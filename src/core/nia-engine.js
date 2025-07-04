// src/core/nia-engine.js - القلب النظيف
import OpenAI from 'openai';
import { Logger } from '../utils/smart-logger.js';
import { PluginManager } from './plugin-manager.js';
import { CostTracker } from '../utils/cost-tracker.js';

export class NiaEngine {
  constructor(options = {}) {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    
    this.logger = new Logger({
      level: options.logLevel || 'info',
      showCost: true,
      showTiming: true
    });
    
    this.pluginManager = new PluginManager();
    this.costTracker = new CostTracker();
    this.conversationContext = [];
    this.enableGeneralAI = options.enableGeneralAI !== false; // مفعل افتراضياً
    
    this.setupDefaultPlugins();
  }

  /**
   * المدخل الرئيسي - فهم النية بذكاء خالص
   */
  async processIntent(userInput) {
    const startTime = Date.now();
    const sessionId = this.generateSessionId();
    
    this.logger.startRequest(sessionId, userInput);

    try {
      // 1. فهم النية باستخدام AI خالص
      const intent = await this.understandIntent(userInput);
      this.logger.logIntent(sessionId, intent);

      // 2. العثور على Plugin المناسب
      const plugin = this.pluginManager.findBestPlugin(intent);
      if (!plugin) {
        // 🎯 لا يوجد plugin مناسب - استخدام AI العام
        return await this.fallbackToGeneralAI(userInput, intent, sessionId);
      }

      // 3. تنفيذ المهمة عبر Plugin
      const result = await plugin.execute(intent, this.createPluginContext());
      
      // 🔄 إذا فشل Plugin - محاولة AI العام
      if (!result.success && this.enableGeneralAI) {
        this.logger.logWarning(`Plugin ${plugin.domain} failed, trying General AI...`);
        return await this.fallbackToGeneralAI(userInput, intent, sessionId);
      }
      
      // 4. تسجيل النتائج والتكلفة
      const duration = Date.now() - startTime;
      this.logger.logSuccess(sessionId, result, duration);
      this.costTracker.recordUsage(sessionId, intent, duration);
      
      return result;

    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.logError(sessionId, error, duration);
      return this.handleError(error, userInput);
    }
  }

  /**
   * السؤال المباشر للذكاء العام - بدون تحليل النية
   */
  async ask(question, options = {}) {
    const startTime = Date.now();
    const sessionId = this.generateSessionId();
    
    this.logger.startRequest(sessionId, `[ASK] ${question}`);
    
    try {
      const result = await this.queryGeneralAI(question, options);
      
      const duration = Date.now() - startTime;
      this.logger.logSuccess(sessionId, result, duration);
      this.costTracker.recordDirectAI(sessionId, question, duration, result.cost);
      
      return result.data;
      
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.logError(sessionId, error, duration);
      return `عذراً، لم أتمكن من الإجابة: ${error.message}`;
    }
  }

  /**
   * الرجوع للذكاء العام عند عدم وجود plugin مناسب
   */
  async fallbackToGeneralAI(originalQuery, intent, sessionId) {
    if (!this.enableGeneralAI) {
      return this.handleUnknownIntent(intent);
    }

    this.logger.logWarning(`No suitable plugin found, using General AI...`);
    
    try {
      const result = await this.queryGeneralAI(originalQuery, {
        context: `Intent was classified as: ${intent.domain}.${intent.action}`,
        fallbackMode: true
      });
      
      const duration = Date.now() - Date.now(); // سيتم حسابه في المستوى الأعلى
      this.costTracker.recordFallback(sessionId, intent, result.cost);
      
      return {
        success: true,
        data: result.data,
        source: 'general-ai-fallback',
        fallback: true,
        cost: result.cost
      };
      
    } catch (error) {
      this.logger.logError(sessionId, error, 0);
      return this.handleUnknownIntent(intent);
    }
  }

  /**
   * استعلام الذكاء العام
   */
  async queryGeneralAI(question, options = {}) {
    const { context = '', fallbackMode = false, maxTokens = 500 } = options;
    
    let systemPrompt = `أنت مساعد ذكي قادر على الإجابة على أسئلة متنوعة.`;
    
    if (fallbackMode) {
      systemPrompt += `
      
لم يتم العثور على خدمة متخصصة لهذا السؤال، لذا حاول الإجابة بناءً على معرفتك العامة.
إذا كان السؤال يحتاج لبيانات حية (مثل أسعار العملات، الطقس، الأخبار)، اذكر أنك لا تملك بيانات محدثة واقترح مصادر موثوقة.`;
    }

    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: `${context ? context + '\n\n' : ''}${question}` }
    ];

    // إضافة السياق من المحادثات السابقة
    if (this.conversationContext.length > 0) {
      const recentContext = this.conversationContext
        .slice(-2)
        .map(c => `السؤال السابق: ${c.input}\nالإجابة: ${c.result}`)
        .join('\n\n');
      
      messages.splice(1, 0, {
        role: "system", 
        content: `السياق من المحادثة:\n${recentContext}`
      });
    }

    const response = await this.openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: messages,
      temperature: 0.7, // أعلى قليلاً للإبداع في الإجابات العامة
      max_tokens: maxTokens,
      presence_penalty: 0.1,
      frequency_penalty: 0.1
    });

    const cost = this.costTracker.calculateOpenAICost(response);
    const answer = response.choices[0].message.content.trim();
    
    // حفظ في السياق
    this.conversationContext.push({
      input: question,
      result: answer,
      timestamp: Date.now(),
      source: fallbackMode ? 'general-ai-fallback' : 'direct-ask'
    });

    // الاحتفاظ بآخر 5 محادثات فقط
    if (this.conversationContext.length > 5) {
      this.conversationContext = this.conversationContext.slice(-5);
    }

    return {
      data: answer,
      cost: cost,
      tokens: response.usage
    };
  }
  async understandIntent(userInput) {
    const prompt = this.buildIntentPrompt(userInput);
    
    const response = await this.openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `أنت محرك فهم النوايا الذكي. مهمتك فهم ما يريده المستخدم وتصنيف النية.

أرجع JSON بهذا الشكل:
{
  "domain": "finance|weather|email|translation|general",
  "action": "get_info|calculate|send|translate|search",
  "entities": {
    "target": "ما يريد معلومات عنه",
    "parameters": {...}
  },
  "confidence": 0.0-1.0,
  "reasoning": "لماذا فهمت النية هكذا"
}`
        },
        {
          role: "user", 
          content: prompt
        }
      ],
      temperature: 0.1,
      max_tokens: 300
    });

    const cost = this.costTracker.calculateOpenAICost(response);
    this.costTracker.addCost(cost);

    return JSON.parse(response.choices[0].message.content);
  }

  buildIntentPrompt(userInput) {
    // إضافة السياق من المحادثات السابقة
    const contextStr = this.conversationContext
      .slice(-3) // آخر 3 محادثات
      .map(c => `User: ${c.input}\nResult: ${c.result}`)
      .join('\n\n');

    return `
السياق السابق:
${contextStr}

الطلب الجديد: "${userInput}"

حلل هذا الطلب وحدد:
1. المجال (domain): ما نوع الخدمة المطلوبة؟
2. الإجراء (action): ما الذي يريد فعله؟  
3. الكيانات (entities): ما هي التفاصيل المهمة؟
4. درجة الثقة: كم أنت متأكد من فهمك؟

أمثلة:
- "سعر البيتكوين" → domain: finance, action: get_info, target: bitcoin
- "كم الطقس اليوم؟" → domain: weather, action: get_info, target: today
- "أرسل إيميل لأحمد" → domain: email, action: send, target: ahmed
- "ترجم 'Hello' للعربية" → domain: translation, action: translate, target: Hello, to: arabic
`;
  }

  /**
   * إعداد Plugins الافتراضية
   */
  setupDefaultPlugins() {
    // تحميل Plugins من مجلدات منفصلة
    this.pluginManager.loadPlugin('finance', './plugins/finance-plugin.js');
    this.pluginManager.loadPlugin('weather', './plugins/weather-plugin.js');
    this.pluginManager.loadPlugin('translation', './plugins/translation-plugin.js');
    this.pluginManager.loadPlugin('email', './plugins/email-plugin.js');
  }

  /**
   * إنشاء سياق للـ Plugins
   */
  createPluginContext() {
    return {
      logger: this.logger,
      costTracker: this.costTracker,
      openai: this.openai,
      
      // إتاحة استدعاء plugins أخرى
      callPlugin: (domain, intent) => {
        const plugin = this.pluginManager.getPlugin(domain);
        return plugin ? plugin.execute(intent, this) : null;
      },
      
      // حفظ واسترجاع البيانات
      store: (key, value) => this.store.set(key, value),
      retrieve: (key) => this.store.get(key)
    };
  }

  /**
   * التعامل مع النوايا غير المعروفة
   */
  handleUnknownIntent(intent) {
    this.logger.logWarning(`Unknown intent: ${intent.domain}`);
    
    const availableServices = this.pluginManager.getAllDomains();
    const suggestions = availableServices.length > 0 
      ? `الخدمات المتاحة: ${availableServices.join(', ')}`
      : 'لا توجد خدمات متاحة حالياً';
    
    return {
      success: false,
      message: `عذراً، لم أفهم طلبك. ${suggestions}`,
      suggestions: availableServices,
      intent: intent,
      hint: this.enableGeneralAI 
        ? "يمكنك استخدام nia.ask('سؤالك') للحصول على إجابة عامة"
        : "يمكنك تفعيل الذكاء العام بإضافة enableGeneralAI: true"
    };
  }

  /**
   * معالجة الأخطاء
   */
  handleError(error, userInput) {
    return {
      success: false,
      message: "حدث خطأ في معالجة طلبك",
      error: error.message,
      suggestion: "جرب إعادة صياغة السؤال"
    };
  }

  /**
   * إضافة plugin جديد في Runtime
   */
  addPlugin(domain, pluginClass) {
    return this.pluginManager.registerPlugin(domain, pluginClass);
  }

  /**
   * الحصول على إحصائيات الاستخدام
   */
  getStats() {
    return {
      totalRequests: this.costTracker.getTotalRequests(),
      totalCost: this.costTracker.getTotalCost(),
      averageResponseTime: this.costTracker.getAverageResponseTime(),
      pluginUsage: this.pluginManager.getUsageStats(),
      topDomains: this.costTracker.getTopDomains()
    };
  }

  generateSessionId() {
    return `nia_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Template Literal Interface - الواجهة البسيطة
let globalEngine = null;

export async function nia(strings, ...values) {
  if (!globalEngine) {
    globalEngine = new NiaEngine();
  }
  
  const query = strings.reduce((result, string, i) => {
    return result + string + (values[i] || '');
  }, '');
  
  const result = await globalEngine.processIntent(query);
  return result.success ? result.data : result.message;
}

// إضافة methods للـ template literal
nia.ask = async (question, options = {}) => {
  if (!globalEngine) globalEngine = new NiaEngine();
  return await globalEngine.ask(question, options);
};

nia.addPlugin = (domain, pluginClass) => {
  if (!globalEngine) globalEngine = new NiaEngine();
  return globalEngine.addPlugin(domain, pluginClass);
};

nia.stats = () => {
  if (!globalEngine) return null;
  return globalEngine.getStats();
};

nia.setLogLevel = (level) => {
  if (!globalEngine) globalEngine = new NiaEngine();
  globalEngine.logger.setLevel(level);
};

nia.enableGeneralAI = (enable = true) => {
  if (!globalEngine) globalEngine = new NiaEngine();
  globalEngine.enableGeneralAI = enable;
};

nia.clearContext = () => {
  if (!globalEngine) return;
  globalEngine.conversationContext = [];
};

export { NiaEngine };