// src/core/nia-flow.js - NiaScript Flow 2.0
// نظام التدفق الذكي - البرمجة بالنوايا المتسلسلة
// الفكرة: النوايا تتدفق مثل الماء عبر أنابيب ذكية!

import axios from 'axios';

/**
 * NiaFlow - محرك التدفق الذكي
 *
 * الفلسفة الجديدة:
 * - النوايا تتسلسل (Chainable)
 * - التجميع الذكي (Smart Batching)
 * - المحلي أولاً (Local-First)
 * - التوازي عند الإمكان (Parallel When Possible)
 * - التكلفة الدنيا (Cost Optimized)
 */

// ========================================
// التخزين المؤقت الذكي
// ========================================
class SmartCache {
  constructor(ttl = 60000) { // 1 دقيقة افتراضياً
    this.cache = new Map();
    this.ttl = ttl;
  }

  set(key, value, customTtl) {
    const expiry = Date.now() + (customTtl || this.ttl);
    this.cache.set(key, { value, expiry });
    return value;
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }
    return item.value;
  }

  has(key) {
    return this.get(key) !== null;
  }

  clear() {
    this.cache.clear();
  }

  stats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

// ========================================
// محرك الحسابات المحلي المتقدم
// ========================================
class LocalEngine {
  constructor() {
    this.patterns = this.setupPatterns();
  }

  setupPatterns() {
    // استخدام Array للحفاظ على الترتيب (الأكثر تحديداً أولاً)
    return [
      // الخصم (يجب أن يكون قبل percentage لأنه أكثر تحديداً)
      ['discount', /(?:خصم|discount)\s*(\d+(?:\.\d+)?)\s*%\s*(?:من|of|from)?\s*(\d+(?:,\d{3})*(?:\.\d+)?)/i],

      // الفائدة المركبة: 1000$ @ 8% لمدة 5 سنوات
      ['compound', /(\d+(?:,\d{3})*(?:\.\d+)?)\s*\$?\s*[@بنسبة]\s*(\d+(?:\.\d+)?)\s*%\s*(?:لمدة|×|x|for)?\s*(\d+)\s*(?:سنوات?|years?|سنة)?/i],

      // ROI: استثمار 1000 ربح 1500
      ['roi', /(?:استثمار|invested?)\s*(\d+(?:,\d{3})*(?:\.\d+)?)\s*(?:ربح|returns?|profit)\s*(\d+(?:,\d{3})*(?:\.\d+)?)/i],

      // تحويل العملات: 100 دولار للريال
      ['currency', /(\d+(?:,\d{3})*(?:\.\d+)?)\s*(?:دولار|\$|USD)\s*(?:إلى|الى|to|للـ?|ل)\s*(ريال|SAR|جنيه|EGP|درهم|AED)/i],

      // النسبة المئوية (الأخير لأنه الأعم): 15% من 200
      ['percentage', /(\d+(?:\.\d+)?)\s*%\s*(?:من|of|from)\s*(\d+(?:,\d{3})*(?:\.\d+)?)/i]
    ];
  }

  // محاولة الحل محلياً
  tryLocal(intent) {
    const normalized = this.normalizeIntent(intent);

    // 1. محاولة الأنماط الخاصة أولاً (بالترتيب - الأكثر تحديداً أولاً)
    for (const [type, pattern] of this.patterns) {
      const match = normalized.match(pattern);
      if (match) {
        return this.execute(type, match, intent);
      }
    }

    // 2. محاولة التعبير الرياضي المباشر
    const cleanExpr = normalized.replace(/[,،]/g, '').replace(/\s+/g, ' ').trim();
    if (this.isMathExpression(cleanExpr)) {
      return this.executeMath(cleanExpr);
    }

    return null; // لا يمكن الحل محلياً
  }

  // التحقق من أن النص تعبير رياضي
  isMathExpression(text) {
    // يجب أن يحتوي على رقم واحد على الأقل وعملية واحدة على الأقل
    const hasNumber = /\d/.test(text);
    const hasOperator = /[+\-*\/^]/.test(text);
    const isClean = /^[\d\s+\-*\/().^]+$/.test(text);
    return hasNumber && hasOperator && isClean;
  }

  normalizeIntent(intent) {
    return intent
      .replace(/،/g, ',')
      .replace(/٪/g, '%')
      .replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d))
      .trim();
  }

  execute(type, match, originalIntent) {
    switch (type) {
      case 'compound':
        return this.executeCompound(match);
      case 'percentage':
        return this.executePercentage(match);
      case 'discount':
        return this.executeDiscount(match);
      case 'currency':
        return this.executeCurrency(match);
      case 'roi':
        return this.executeROI(match);
      default:
        return null;
    }
  }

  executeMath(expr) {
    try {
      const sanitized = expr
        .replace(/[,،]/g, '')
        .replace(/\^/g, '**')
        .replace(/[^0-9+\-*/.()% ]/g, '');

      const result = Function('"use strict"; return (' + sanitized + ')')();

      return {
        success: true,
        type: 'math',
        result: this.formatNumber(result),
        raw: result,
        source: 'local',
        cost: 0
      };
    } catch (e) {
      return null;
    }
  }

  executeCompound(match) {
    const principal = parseFloat(match[1].replace(/,/g, ''));
    const rate = parseFloat(match[2]) / 100;
    const years = parseFloat(match[3]);

    const result = principal * Math.pow(1 + rate, years);
    const profit = result - principal;

    return {
      success: true,
      type: 'compound_interest',
      result: `$${this.formatNumber(result)}`,
      details: {
        principal: `$${this.formatNumber(principal)}`,
        rate: `${match[2]}%`,
        years: years,
        profit: `$${this.formatNumber(profit)}`,
        growthMultiple: (result / principal).toFixed(2) + 'x'
      },
      raw: result,
      source: 'local',
      cost: 0
    };
  }

  executePercentage(match) {
    const percent = parseFloat(match[1]);
    const number = parseFloat(match[2].replace(/,/g, ''));
    const result = (percent / 100) * number;

    return {
      success: true,
      type: 'percentage',
      result: this.formatNumber(result),
      details: {
        percent: `${percent}%`,
        of: this.formatNumber(number)
      },
      raw: result,
      source: 'local',
      cost: 0
    };
  }

  executeDiscount(match) {
    const percent = parseFloat(match[1]);
    const price = parseFloat(match[2].replace(/,/g, ''));
    const discount = (percent / 100) * price;
    const final = price - discount;

    return {
      success: true,
      type: 'discount',
      result: `$${this.formatNumber(final)}`,
      details: {
        original: `$${this.formatNumber(price)}`,
        discount: `-$${this.formatNumber(discount)} (${percent}%)`,
        savings: `${percent}%`
      },
      raw: final,
      source: 'local',
      cost: 0
    };
  }

  executeCurrency(match) {
    const amount = parseFloat(match[1].replace(/,/g, ''));
    const toCurrency = match[2].toLowerCase();

    // أسعار تقريبية (يمكن تحديثها من API)
    const rates = {
      'ريال': 3.75, 'sar': 3.75,
      'جنيه': 30.90, 'egp': 30.90,
      'درهم': 3.67, 'aed': 3.67
    };

    const rate = rates[toCurrency] || 1;
    const result = amount * rate;

    return {
      success: true,
      type: 'currency',
      result: this.formatNumber(result),
      details: {
        from: `$${this.formatNumber(amount)}`,
        rate: rate,
        to: toCurrency.toUpperCase()
      },
      raw: result,
      source: 'local',
      cost: 0,
      note: 'سعر تقريبي - للسعر الحقيقي استخدم API'
    };
  }

  executeROI(match) {
    const invested = parseFloat(match[1].replace(/,/g, ''));
    const returned = parseFloat(match[2].replace(/,/g, ''));
    const profit = returned - invested;
    const roi = (profit / invested) * 100;

    return {
      success: true,
      type: 'roi',
      result: `${roi.toFixed(2)}%`,
      details: {
        invested: `$${this.formatNumber(invested)}`,
        returned: `$${this.formatNumber(returned)}`,
        profit: `$${this.formatNumber(profit)}`
      },
      raw: roi,
      source: 'local',
      cost: 0
    };
  }

  formatNumber(num) {
    if (typeof num !== 'number') return num;
    return num.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    });
  }
}

// ========================================
// NiaIntent - كائن النية القابل للتسلسل
// ========================================
class NiaIntent {
  constructor(intent, engine) {
    this.intents = [intent];
    this.engine = engine;
    this._options = {};
  }

  // إضافة نية للسلسلة
  pipe(strings, ...values) {
    const intent = strings.reduce((r, s, i) => r + s + (values[i] || ''), '');
    this.intents.push(intent);
    return this;
  }

  // اختصار لـ pipe
  then(strings, ...values) {
    return this.pipe(strings, ...values);
  }

  // تحديد الموديل
  model(modelName) {
    this._options.model = modelName;
    return this;
  }

  // تحديد اللغة
  lang(language) {
    this._options.language = language;
    return this;
  }

  // بدون AI (محلي فقط)
  local() {
    this._options.localOnly = true;
    return this;
  }

  // تنسيق النتيجة
  format(type) {
    this._options.format = type;
    return this;
  }

  // تنفيذ السلسلة
  async run() {
    return await this.engine.executePipeline(this.intents, this._options);
  }

  // اختصار لـ run
  async exec() {
    return await this.run();
  }

  // للتوافق مع await مباشرة
  then(resolve, reject) {
    return this.run().then(resolve, reject);
  }
}

// ========================================
// NiaFlow - المحرك الرئيسي
// ========================================
export class NiaFlow {
  constructor(options = {}) {
    this.apiKey = options.apiKey || process.env.OPENROUTER_API_KEY;
    this.baseURL = options.baseURL || 'https://openrouter.ai/api/v1';

    // المحركات
    this.localEngine = new LocalEngine();
    this.cache = new SmartCache(options.cacheTTL || 60000);

    // الموديلات - من الأرخص للأغلى
    this.models = {
      micro: 'openai/gpt-4.1-mini',           // رخيص جداً
      fast: 'anthropic/claude-3-haiku',       // سريع ورخيص
      balanced: 'openai/gpt-4o-mini',         // متوازن
      smart: 'openai/gpt-5.1-codex-mini',     // ذكي
      codex: 'openai/gpt-5.1-codex-mini',     // للكود (الأفضل)
      creative: 'anthropic/claude-3.5-sonnet' // إبداعي
    };

    this.defaultModel = options.model || this.models.micro;

    // إحصائيات
    this.stats = {
      totalRequests: 0,
      localHits: 0,
      cacheHits: 0,
      apiCalls: 0,
      totalCost: 0,
      savedCost: 0
    };

    // السياق
    this.context = [];
  }

  // ========================================
  // الواجهة الرئيسية
  // ========================================

  // إنشاء نية جديدة (chainable)
  intent(strings, ...values) {
    const intent = strings.reduce((r, s, i) => r + s + (values[i] || ''), '');
    return new NiaIntent(intent, this);
  }

  // تنفيذ نية واحدة
  async process(intent, options = {}) {
    this.stats.totalRequests++;

    // 1. محاولة من الكاش
    const cacheKey = this.getCacheKey(intent);
    const cached = this.cache.get(cacheKey);
    if (cached) {
      this.stats.cacheHits++;
      return { ...cached, fromCache: true };
    }

    // 2. محاولة محلية
    if (!options.forceAPI) {
      const localResult = this.localEngine.tryLocal(intent);
      if (localResult) {
        this.stats.localHits++;
        this.stats.savedCost += 0.001; // تقدير التوفير
        this.cache.set(cacheKey, localResult, 300000); // 5 دقائق
        return localResult;
      }
    }

    // 3. إذا طلب محلي فقط
    if (options.localOnly) {
      return {
        success: false,
        error: 'لا يمكن حل هذه النية محلياً',
        suggestion: 'استخدم .run() بدلاً من .local().run()'
      };
    }

    // 4. استخدام AI
    const result = await this.callAI(intent, options);
    this.stats.apiCalls++;

    // تخزين في الكاش
    if (result.success) {
      this.cache.set(cacheKey, result);
    }

    return result;
  }

  // تنفيذ سلسلة نوايا (Pipeline)
  async executePipeline(intents, options = {}) {
    const startTime = Date.now();
    const results = [];
    let currentContext = null;

    // تحسين: تجميع النوايا في طلب واحد إذا أمكن
    if (intents.length > 1 && !options.localOnly) {
      const batchResult = await this.executeBatch(intents, options);
      if (batchResult.success) {
        return {
          ...batchResult,
          pipelineMode: 'batched',
          duration: Date.now() - startTime
        };
      }
    }

    // تنفيذ تسلسلي مع تمرير السياق
    for (let i = 0; i < intents.length; i++) {
      let intent = intents[i];

      // إضافة السياق من النتيجة السابقة
      if (currentContext !== null) {
        intent = `${intent} (القيمة السابقة: ${currentContext})`;
      }

      const result = await this.process(intent, options);
      results.push(result);

      if (!result.success) {
        return {
          success: false,
          error: `فشل في الخطوة ${i + 1}: ${result.error}`,
          completedSteps: i,
          results: results
        };
      }

      // تحديث السياق
      currentContext = result.raw || result.result;
    }

    return {
      success: true,
      result: results[results.length - 1].result,
      raw: results[results.length - 1].raw,
      steps: results,
      pipelineMode: 'sequential',
      duration: Date.now() - startTime,
      source: results.some(r => r.source === 'ai') ? 'mixed' : 'local'
    };
  }

  // تنفيذ مجمع (Batch)
  async executeBatch(intents, options = {}) {
    const combinedPrompt = `
أنت NiaFlow - محرك تدفق ذكي. نفذ هذه النوايا المتسلسلة:

${intents.map((intent, i) => `${i + 1}. ${intent}`).join('\n')}

القواعد:
- نتيجة كل خطوة تُستخدم في الخطوة التالية
- أجب بـ JSON فقط بهذا الشكل:
{
  "steps": [
    {"step": 1, "intent": "...", "result": "...", "raw": ...},
    ...
  ],
  "final_result": "النتيجة النهائية"
}
`;

    try {
      const response = await this.callAI(combinedPrompt, {
        ...options,
        jsonMode: true
      });

      if (response.success && response.result) {
        // محاولة parse JSON
        try {
          const parsed = JSON.parse(response.result);
          return {
            success: true,
            result: parsed.final_result,
            steps: parsed.steps,
            source: 'ai-batched',
            cost: response.cost
          };
        } catch {
          return {
            success: true,
            result: response.result,
            source: 'ai',
            cost: response.cost
          };
        }
      }

      return response;
    } catch (error) {
      // فشل الـ batch، العودة للتنفيذ التسلسلي
      return { success: false, error: error.message };
    }
  }

  // تنفيذ متوازي
  async parallel(...intentBuilders) {
    const promises = intentBuilders.map(builder => {
      if (builder instanceof NiaIntent) {
        return builder.run();
      } else if (typeof builder === 'string') {
        return this.process(builder);
      } else {
        return Promise.resolve(builder);
      }
    });

    const results = await Promise.all(promises);
    return results;
  }

  // سباق (أول نتيجة)
  async race(...intentBuilders) {
    const promises = intentBuilders.map(builder => {
      if (builder instanceof NiaIntent) {
        return builder.run();
      } else if (typeof builder === 'string') {
        return this.process(builder);
      } else {
        return Promise.resolve(builder);
      }
    });

    return await Promise.race(promises);
  }

  // ========================================
  // محرك AI
  // ========================================

  async callAI(prompt, options = {}) {
    if (!this.apiKey) {
      return {
        success: false,
        error: 'مفتاح API غير موجود',
        suggestion: 'أضف OPENROUTER_API_KEY'
      };
    }

    const model = options.model || this.defaultModel;

    const messages = [
      {
        role: 'system',
        content: `أنت NiaFlow - محرك ذكي للنوايا.
- أجب بشكل مباشر ومختصر
- إذا كانت النتيجة رقم، أعطه بدون شرح زائد
- إذا طُلب JSON، أجب بـ JSON فقط`
      },
      {
        role: 'user',
        content: prompt
      }
    ];

    // إضافة السياق
    if (this.context.length > 0) {
      const contextStr = this.context.slice(-3)
        .map(c => `${c.intent} → ${c.result}`)
        .join('\n');
      messages[0].content += `\n\nالسياق السابق:\n${contextStr}`;
    }

    try {
      const response = await axios.post(
        `${this.baseURL}/chat/completions`,
        {
          model: model,
          messages: messages,
          temperature: 0.3,
          max_tokens: 500
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://niascript.dev',
            'X-Title': 'NiaScript-Flow'
          },
          timeout: 30000
        }
      );

      const content = response.data.choices[0].message.content;
      const usage = response.data.usage || {};

      // حساب التكلفة التقريبية
      const cost = this.estimateCost(model, usage);
      this.stats.totalCost += cost;

      // حفظ في السياق
      this.context.push({
        intent: prompt.substring(0, 100),
        result: content.substring(0, 100),
        timestamp: Date.now()
      });

      // تنظيف السياق القديم
      if (this.context.length > 10) {
        this.context = this.context.slice(-10);
      }

      return {
        success: true,
        result: content.trim(),
        raw: this.extractNumber(content),
        source: 'ai',
        model: model,
        cost: cost,
        usage: usage
      };

    } catch (error) {
      if (error.response) {
        const status = error.response.status;
        const msg = error.response.data?.error?.message || error.response.statusText;
        return {
          success: false,
          error: `API Error (${status}): ${msg}`
        };
      }
      return {
        success: false,
        error: error.message
      };
    }
  }

  extractNumber(text) {
    // محاولة استخراج رقم من النص
    const match = text.match(/[\d,]+\.?\d*/);
    if (match) {
      return parseFloat(match[0].replace(/,/g, ''));
    }
    return null;
  }

  estimateCost(model, usage) {
    // تقدير التكلفة بناءً على الموديل
    const rates = {
      'openai/gpt-4.1-mini': 0.00001,
      'anthropic/claude-3-haiku': 0.00025,
      'openai/gpt-4o-mini': 0.00015,
      'deepseek/deepseek-chat': 0.00014,
      'openai/gpt-4.1-codex-mini': 0.00001
    };

    const rate = rates[model] || 0.0001;
    const tokens = (usage.prompt_tokens || 0) + (usage.completion_tokens || 0);
    return rate * tokens;
  }

  getCacheKey(intent) {
    return `nia_${intent.toLowerCase().replace(/\s+/g, '_').substring(0, 50)}`;
  }

  // ========================================
  // أدوات مساعدة
  // ========================================

  // سؤال مباشر
  async ask(question, options = {}) {
    return await this.process(question, { ...options, forceAPI: true });
  }

  // حساب محلي
  calc(expression) {
    return this.localEngine.tryLocal(expression);
  }

  // إحصائيات
  getStats() {
    return {
      ...this.stats,
      cacheStats: this.cache.stats(),
      efficiency: this.stats.totalRequests > 0
        ? ((this.stats.localHits + this.stats.cacheHits) / this.stats.totalRequests * 100).toFixed(1) + '%'
        : '0%'
    };
  }

  // مسح السياق
  clearContext() {
    this.context = [];
    this.cache.clear();
  }

  // تغيير الموديل الافتراضي
  setModel(modelKey) {
    if (this.models[modelKey]) {
      this.defaultModel = this.models[modelKey];
    } else {
      this.defaultModel = modelKey; // استخدام مباشر
    }
    return this;
  }
}

// ========================================
// الواجهة السهلة (Template Literals)
// ========================================
let globalFlow = null;

export function flow(strings, ...values) {
  if (!globalFlow) {
    globalFlow = new NiaFlow();
  }

  const intent = strings.reduce((r, s, i) => r + s + (values[i] || ''), '');
  return new NiaIntent(intent, globalFlow);
}

// أدوات إضافية
flow.config = (options) => {
  globalFlow = new NiaFlow(options);
  return globalFlow;
};

flow.parallel = async (...args) => {
  if (!globalFlow) globalFlow = new NiaFlow();
  return await globalFlow.parallel(...args);
};

flow.stats = () => {
  if (!globalFlow) globalFlow = new NiaFlow();
  return globalFlow.getStats();
};

flow.calc = (expr) => {
  if (!globalFlow) globalFlow = new NiaFlow();
  return globalFlow.calc(expr);
};

flow.ask = async (q, opts) => {
  if (!globalFlow) globalFlow = new NiaFlow();
  return await globalFlow.ask(q, opts);
};

flow.clear = () => {
  if (globalFlow) globalFlow.clearContext();
};

// Export كل شيء
export { SmartCache, LocalEngine, NiaIntent };
export default flow;
