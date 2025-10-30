// src/core/nia-ai.js - النواة الجديدة المبسطة
// الاعتماد الكامل على AI - لا plugins تقليدية

import OpenAI from 'openai';
import { Logger } from '../utils/smart-logger.js';

/**
 * NiaAI - محرك ذكاء بسيط يعتمد على AI بالكامل
 *
 * الفلسفة:
 * - النية هي كل شيء
 * - AI يفهم ويقرر
 * - لا قواعد صارمة، فقط احتمالات
 * - البداية من ذرة تنمو
 */
export class NiaAI {
  constructor(options = {}) {
    this.apiKey = options.apiKey || process.env.OPENROUTER_API_KEY;

    // استخدام مكتبة OpenAI مع OpenRouter baseURL
    this.openai = new OpenAI({
      apiKey: this.apiKey,
      baseURL: 'https://openrouter.ai/api/v1',
      defaultHeaders: {
        'HTTP-Referer': 'https://niascript.dev',
        'X-Title': 'NiaScript'
      }
    });

    this.logger = new Logger({
      level: options.logLevel || 'info',
      showCost: true,
      showTiming: true
    });

    // Models المتاحة - نبدأ بالرخيصة
    this.models = {
      fast: 'anthropic/claude-3-haiku',        // سريع ورخيص
      balanced: 'openai/gpt-4o-mini',          // متوازن
      smart: 'deepseek/deepseek-chat',         // ذكي وقوي
      creative: 'anthropic/claude-3.5-sonnet'  // للمهام المعقدة
    };

    this.defaultModel = options.model || this.models.fast;
    this.conversationContext = [];
    this.tools = this.setupTools();
  }

  /**
   * الأدوات المتاحة للـ AI
   */
  setupTools() {
    return [
      {
        type: 'function',
        function: {
          name: 'fetch_data',
          description: 'يجلب بيانات من الإنترنت عبر API أو URL',
          parameters: {
            type: 'object',
            properties: {
              url: {
                type: 'string',
                description: 'الـ URL المطلوب'
              },
              method: {
                type: 'string',
                enum: ['GET', 'POST'],
                default: 'GET'
              },
              headers: {
                type: 'object',
                description: 'Headers إضافية'
              }
            },
            required: ['url']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'calculate',
          description: 'يحسب عمليات رياضية أو مالية',
          parameters: {
            type: 'object',
            properties: {
              expression: {
                type: 'string',
                description: 'المعادلة الرياضية أو الحسابية'
              },
              type: {
                type: 'string',
                enum: ['math', 'compound_interest', 'roi', 'percentage'],
                description: 'نوع الحساب'
              }
            },
            required: ['expression', 'type']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'search_web',
          description: 'يبحث في الإنترنت عن معلومات',
          parameters: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: 'محتوى البحث'
              }
            },
            required: ['query']
          }
        }
      }
    ];
  }

  /**
   * المدخل الرئيسي - معالجة النية مباشرة
   */
  async process(userIntent, options = {}) {
    const startTime = Date.now();
    const sessionId = this.generateSessionId();

    this.logger.startRequest(sessionId, userIntent);

    try {
      // اختيار النموذج المناسب
      const model = options.model || this.defaultModel;

      // بناء السياق
      const messages = this.buildMessages(userIntent);

      // استدعاء AI مع الأدوات
      const response = await this.callAI(model, messages, this.tools);

      // معالجة استدعاءات الأدوات إن وجدت
      let result;
      if (response.tool_calls && response.tool_calls.length > 0) {
        result = await this.handleToolCalls(response.tool_calls, messages, model);
      } else {
        result = {
          success: true,
          data: response.content,
          source: model,
          reasoning: response.reasoning || 'Direct AI response'
        };
      }

      // حفظ في السياق
      this.conversationContext.push({
        intent: userIntent,
        result: result.data,
        timestamp: Date.now(),
        model: model
      });

      const duration = Date.now() - startTime;
      this.logger.logSuccess(sessionId, result, duration);

      return result;

    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.logError(sessionId, error, duration);
      throw error;
    }
  }

  /**
   * بناء الرسائل للـ AI
   */
  buildMessages(userIntent) {
    const messages = [];

    // System prompt - فلسفة النية
    messages.push({
      role: 'system',
      content: `أنت NiaAI - محرك ذكاء يفهم النوايا ويحولها لأفعال.

الفلسفة:
- ركز على النية، ليس على الكلمات
- استخدم الاحتمالات والذكاء، ليس القواعد الصارمة
- إذا احتجت بيانات خارجية، استخدم الأدوات المتاحة
- كن مباشراً وفعالاً

الأدوات المتاحة:
- fetch_data: لجلب بيانات من APIs
- calculate: للحسابات الرياضية والمالية
- search_web: للبحث في الإنترنت

أمثلة:
- "سعر البيتكوين" → fetch من Binance API
- "احسب 1000 * 1.08^5" → calculate
- "ما هو الذكاء الاصطناعي؟" → إجابة مباشرة
- "ترجم Hello للعربية" → إجابة مباشرة: "مرحبا"`
    });

    // إضافة السياق من المحادثات السابقة
    if (this.conversationContext.length > 0) {
      const recentContext = this.conversationContext
        .slice(-3)
        .map(c => `المستخدم: ${c.intent}\nالنتيجة: ${c.result}`)
        .join('\n\n');

      messages.push({
        role: 'system',
        content: `السياق من المحادثة السابقة:\n${recentContext}`
      });
    }

    // النية الحالية
    messages.push({
      role: 'user',
      content: userIntent
    });

    return messages;
  }

  /**
   * استدعاء OpenRouter API باستخدام مكتبة OpenAI
   */
  async callAI(model, messages, tools = null) {
    try {
      const params = {
        model: model,
        messages: messages,
        temperature: 0.7,
        max_tokens: 1000
      };

      // إضافة tools إذا كانت متاحة
      if (tools && tools.length > 0) {
        params.tools = tools;
        params.tool_choice = 'auto';
      }

      const response = await this.openai.chat.completions.create(params);

      const choice = response.choices[0];

      return {
        content: choice.message.content,
        tool_calls: choice.message.tool_calls,
        reasoning: choice.message.reasoning,
        usage: response.usage,
        model: response.model
      };

    } catch (error) {
      // معالجة أخطاء OpenAI SDK
      if (error.status) {
        throw new Error(`OpenRouter API Error (${error.status}): ${error.message}`);
      } else {
        throw new Error(`Request error: ${error.message}`);
      }
    }
  }

  /**
   * معالجة استدعاءات الأدوات
   */
  async handleToolCalls(toolCalls, messages, model) {
    const results = [];

    for (const toolCall of toolCalls) {
      const functionName = toolCall.function.name;
      const args = JSON.parse(toolCall.function.arguments);

      this.logger.logWarning(`Executing tool: ${functionName}`);

      let toolResult;
      try {
        switch (functionName) {
          case 'fetch_data':
            toolResult = await this.executeFetch(args);
            break;
          case 'calculate':
            toolResult = await this.executeCalculate(args);
            break;
          case 'search_web':
            toolResult = await this.executeSearch(args);
            break;
          default:
            toolResult = { error: 'Unknown tool' };
        }

        results.push({
          tool_call_id: toolCall.id,
          role: 'tool',
          name: functionName,
          content: JSON.stringify(toolResult)
        });

      } catch (error) {
        results.push({
          tool_call_id: toolCall.id,
          role: 'tool',
          name: functionName,
          content: JSON.stringify({ error: error.message })
        });
      }
    }

    // إضافة النتائج للـ messages وإعادة الاستدعاء
    messages.push({
      role: 'assistant',
      tool_calls: toolCalls
    });
    messages.push(...results);

    // استدعاء AI مرة أخرى مع النتائج
    const finalResponse = await this.callAI(model, messages);

    return {
      success: true,
      data: finalResponse.content,
      source: model,
      tools_used: toolCalls.map(tc => tc.function.name),
      reasoning: 'Used tools then generated response'
    };
  }

  /**
   * تنفيذ fetch_data
   */
  async executeFetch(args) {
    const { url, method = 'GET', headers = {} } = args;

    try {
      const response = await fetch(url, {
        method: method,
        headers: {
          'User-Agent': 'NiaScript/2.0',
          ...headers
        }
      });

      if (!response.ok) {
        return { error: `HTTP ${response.status}: ${response.statusText}` };
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      } else {
        return { text: await response.text() };
      }

    } catch (error) {
      return { error: error.message };
    }
  }

  /**
   * تنفيذ calculate
   */
  async executeCalculate(args) {
    const { expression, type } = args;

    try {
      switch (type) {
        case 'math':
          // تقييم آمن للتعبيرات الرياضية
          const result = this.safeEval(expression);
          return { result: result };

        case 'compound_interest':
          // صيغة: P * (1 + r)^t
          const match = expression.match(/(\d+(?:\.\d+)?)\s*\*\s*\(1\s*\+\s*(\d+(?:\.\d+)?)\)\s*\^\s*(\d+)/);
          if (match) {
            const [_, principal, rate, time] = match;
            const result = parseFloat(principal) * Math.pow(1 + parseFloat(rate), parseFloat(time));
            return { result: result.toFixed(2) };
          }
          return { error: 'Invalid compound interest expression' };

        case 'percentage':
          const percentMatch = expression.match(/(\d+(?:\.\d+)?)\s*%\s*of\s*(\d+(?:\.\d+)?)/);
          if (percentMatch) {
            const [_, percent, number] = percentMatch;
            const result = (parseFloat(percent) / 100) * parseFloat(number);
            return { result: result.toFixed(2) };
          }
          return { error: 'Invalid percentage expression' };

        default:
          return { error: 'Unknown calculation type' };
      }

    } catch (error) {
      return { error: error.message };
    }
  }

  /**
   * تقييم آمن للتعبيرات الرياضية
   */
  safeEval(expr) {
    // إزالة أي شيء غير رياضي
    const sanitized = expr.replace(/[^0-9+\-*/.()^\s]/g, '');

    // استخدام Function بدلاً من eval لأمان أفضل
    // فقط العمليات الرياضية الأساسية
    const allowedOps = {
      '+': (a, b) => a + b,
      '-': (a, b) => a - b,
      '*': (a, b) => a * b,
      '/': (a, b) => a / b,
      '^': (a, b) => Math.pow(a, b)
    };

    try {
      // استبدال ^ بـ **
      const jsExpr = sanitized.replace(/\^/g, '**');
      return Function('"use strict"; return (' + jsExpr + ')')();
    } catch (error) {
      throw new Error('Invalid mathematical expression');
    }
  }

  /**
   * تنفيذ search_web
   */
  async executeSearch(args) {
    const { query } = args;

    // للبساطة الآن، نرجع رسالة
    // في المستقبل يمكن إضافة integration مع محرك بحث
    return {
      message: 'Web search not fully implemented yet',
      suggestion: 'Ask me directly and I will use my knowledge'
    };
  }

  /**
   * سؤال مباشر بدون tools
   */
  async ask(question, options = {}) {
    const model = options.model || this.models.fast;
    const messages = [
      {
        role: 'system',
        content: 'أنت مساعد ذكي. أجب بشكل مباشر ومفيد.'
      },
      {
        role: 'user',
        content: question
      }
    ];

    const response = await this.callAI(model, messages);
    return response.content;
  }

  /**
   * تجربة عدة models
   */
  async tryModels(intent, modelList = ['fast', 'balanced', 'smart']) {
    const results = [];

    for (const modelKey of modelList) {
      const model = this.models[modelKey];
      try {
        const startTime = Date.now();
        const result = await this.process(intent, { model });
        const duration = Date.now() - startTime;

        results.push({
          model: modelKey,
          success: true,
          data: result.data,
          duration: duration
        });
      } catch (error) {
        results.push({
          model: modelKey,
          success: false,
          error: error.message
        });
      }
    }

    return results;
  }

  generateSessionId() {
    return `nia_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Template Literal Interface - الواجهة البسيطة
let globalEngine = null;

export async function nia(strings, ...values) {
  if (!globalEngine) {
    globalEngine = new NiaAI();
  }

  const intent = strings.reduce((result, string, i) => {
    return result + string + (values[i] || '');
  }, '');

  const result = await globalEngine.process(intent);
  return result.data;
}

// Methods إضافية
nia.ask = async (question, options = {}) => {
  if (!globalEngine) globalEngine = new NiaAI();
  return await globalEngine.ask(question, options);
};

nia.tryModels = async (intent, models = ['fast', 'balanced', 'smart']) => {
  if (!globalEngine) globalEngine = new NiaAI();
  return await globalEngine.tryModels(intent, models);
};

nia.config = (options) => {
  globalEngine = new NiaAI(options);
  return globalEngine;
};

nia.clearContext = () => {
  if (!globalEngine) return;
  globalEngine.conversationContext = [];
};
