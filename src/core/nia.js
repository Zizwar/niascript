/**
 * NiaScript Core - النواة الموحدة
 * البرمجة بالنوايا - Intent-Based Programming
 *
 * @example
 * import { nia, Nia } from 'niascript';
 *
 * // الطريقة البسيطة
 * const result = await nia`سعر البيتكوين`;
 *
 * // الطريقة المتقدمة
 * const n = new Nia({ apiKey: '...', model: '...' });
 * const result = await n.run('سعر البيتكوين');
 */

import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ========================================
// التكوين الافتراضي
// ========================================
const DEFAULT_CONFIG = {
  apiKey: process.env.OPENROUTER_API_KEY || process.env.NIA_API_KEY,
  model: process.env.NIA_MODEL || 'openai/gpt-4.1-mini',
  outputDir: process.env.NIA_OUTPUT_DIR || 'nia-output',
  cacheEnabled: true,
  cacheTTL: 5 * 60 * 1000, // 5 دقائق
  timeout: 30000,
  maxRetries: 2,
  debug: process.env.NIA_DEBUG === 'true'
};

// ========================================
// المحرك المحلي - بدون API
// ========================================
const LOCAL_PROCESSORS = {
  // الرياضيات
  math: {
    patterns: [
      /^(\d+(?:\.\d+)?)\s*([\+\-\*\/\^%])\s*(\d+(?:\.\d+)?)$/,
      /(?:احسب|حساب|كم|ما\s*(?:هو|هي)?\s*(?:ناتج)?)\s*(.+)/i
    ],
    process: (match) => {
      try {
        const expr = match[1] || match[0];
        const sanitized = expr
          .replace(/[×x]/g, '*')
          .replace(/[÷]/g, '/')
          .replace(/\^/g, '**')
          .replace(/[^\d\+\-\*\/\.\(\)\s\%]/g, '');

        // تأكد من وجود أرقام
        if (!sanitized.match(/\d/)) return null;

        const result = eval(sanitized);
        if (result === undefined || isNaN(result)) return null;

        return { success: true, result, source: 'local' };
      } catch {
        return null;
      }
    }
  },

  // التاريخ والوقت
  datetime: {
    patterns: [
      /(?:ما|كم)\s*(?:هو|هي|هذا)?\s*(?:التاريخ|اليوم|الوقت|الساعة)/i,
      /(?:التاريخ|اليوم|الوقت|الساعة)\s*(?:الآن|اليوم|الحالي)?/i
    ],
    process: () => {
      const now = new Date();
      const days = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
      const months = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
                      'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

      const day = days[now.getDay()];
      const date = now.getDate();
      const month = months[now.getMonth()];
      const year = now.getFullYear();
      const hours = now.getHours().toString().padStart(2, '0');
      const minutes = now.getMinutes().toString().padStart(2, '0');

      return {
        success: true,
        result: `${day}، ${date} ${month} ${year} - الساعة ${hours}:${minutes}`,
        source: 'local'
      };
    }
  },

  // التحويلات
  convert: {
    patterns: [
      /(?:حوّل|حول|تحويل)\s*(\d+(?:\.\d+)?)\s*(.+?)\s*(?:إلى|الى|ل)\s*(.+)/i
    ],
    process: (match) => {
      const value = parseFloat(match[1]);
      const from = match[2].trim().toLowerCase();
      const to = match[3].trim().toLowerCase();

      const conversions = {
        // الطول
        'متر_سنتيمتر': v => v * 100,
        'سنتيمتر_متر': v => v / 100,
        'كيلومتر_متر': v => v * 1000,
        'متر_كيلومتر': v => v / 1000,
        'ميل_كيلومتر': v => v * 1.60934,
        'كيلومتر_ميل': v => v / 1.60934,
        // الوزن
        'كيلوغرام_غرام': v => v * 1000,
        'غرام_كيلوغرام': v => v / 1000,
        'كيلو_غرام': v => v * 1000,
        'غرام_كيلو': v => v / 1000,
        // الحرارة
        'سيلسيوس_فهرنهايت': v => (v * 9/5) + 32,
        'فهرنهايت_سيلسيوس': v => (v - 32) * 5/9,
      };

      const key = `${from}_${to}`;
      if (conversions[key]) {
        return {
          success: true,
          result: `${value} ${from} = ${conversions[key](value).toFixed(2)} ${to}`,
          source: 'local'
        };
      }
      return null;
    }
  },

  // النصوص
  text: {
    patterns: [
      /(?:عدد\s*)?(?:حروف|أحرف|كلمات)\s*(?:في|:)?\s*["']?(.+?)["']?$/i,
      /(?:اقلب|عكس)\s*(?:النص|الكلام)?\s*["']?(.+?)["']?$/i
    ],
    process: (match, intent) => {
      const text = match[1];
      if (/عدد|حروف|أحرف/.test(intent)) {
        return {
          success: true,
          result: `عدد الحروف: ${text.length}، عدد الكلمات: ${text.split(/\s+/).length}`,
          source: 'local'
        };
      }
      if (/اقلب|عكس/.test(intent)) {
        return {
          success: true,
          result: text.split('').reverse().join(''),
          source: 'local'
        };
      }
      return null;
    }
  }
};

// ========================================
// الكاش الذكي
// ========================================
class NiaCache {
  constructor(ttl = DEFAULT_CONFIG.cacheTTL) {
    this.cache = new Map();
    this.ttl = ttl;
  }

  generateKey(intent, options = {}) {
    return `${intent}::${JSON.stringify(options)}`;
  }

  get(key) {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }
    return entry.value;
  }

  set(key, value) {
    this.cache.set(key, { value, timestamp: Date.now() });
  }

  clear() {
    this.cache.clear();
  }

  get size() {
    return this.cache.size;
  }
}

// ========================================
// نتيجة NiaScript
// ========================================
class NiaResult {
  constructor(value, meta = {}) {
    this._value = value;
    this._meta = {
      intent: meta.intent || '',
      source: meta.source || 'unknown',
      model: meta.model || null,
      duration: meta.duration || 0,
      cost: meta.cost || 0,
      filepath: meta.filepath || null,
      cached: meta.cached || false,
      timestamp: new Date().toISOString(),
      ...meta
    };
  }

  get value() { return this._value; }
  get meta() { return this._meta; }

  toString() {
    return typeof this._value === 'object'
      ? JSON.stringify(this._value, null, 2)
      : String(this._value);
  }

  toJSON() {
    return this._value;
  }

  [Symbol.toPrimitive](hint) {
    if (hint === 'string') return this.toString();
    if (hint === 'number') return Number(this._value);
    return this._value;
  }

  async format(type = 'json', schema = null) {
    if (type === 'json') {
      if (typeof this._value === 'object') return this._value;
      try {
        return JSON.parse(this._value);
      } catch {
        return { text: this._value };
      }
    }
    if (type === 'text') return this.toString();
    if (type === 'table') {
      console.table(Array.isArray(this._value) ? this._value : [this._value]);
      return this._value;
    }
    return this._value;
  }
}

// ========================================
// الفئة الرئيسية - Nia
// ========================================
class Nia {
  constructor(config = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.cache = new NiaCache(this.config.cacheTTL);
    this.stats = {
      totalCalls: 0,
      localCalls: 0,
      aiCalls: 0,
      cachedCalls: 0,
      totalCost: 0,
      errors: 0
    };

    // إنشاء مجلد الإخراج
    this._ensureOutputDir();
  }

  // ========================================
  // إعدادات
  // ========================================
  setApiKey(key) {
    this.config.apiKey = key;
    return this;
  }

  setModel(model) {
    this.config.model = model;
    return this;
  }

  setOutputDir(dir) {
    this.config.outputDir = dir;
    this._ensureOutputDir();
    return this;
  }

  _ensureOutputDir() {
    const dir = path.resolve(process.cwd(), this.config.outputDir);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    // إنشاء مجلدات فرعية
    ['scripts', 'logs', 'cache'].forEach(sub => {
      const subDir = path.join(dir, sub);
      if (!fs.existsSync(subDir)) {
        fs.mkdirSync(subDir, { recursive: true });
      }
    });
  }

  // ========================================
  // التنفيذ الرئيسي
  // ========================================
  async run(intent, options = {}) {
    const startTime = Date.now();
    this.stats.totalCalls++;

    const mergedOptions = { ...this.config, ...options };

    // 1. تحقق من الكاش
    if (mergedOptions.cacheEnabled) {
      const cacheKey = this.cache.generateKey(intent, options);
      const cached = this.cache.get(cacheKey);
      if (cached) {
        this.stats.cachedCalls++;
        return new NiaResult(cached.value, {
          ...cached.meta,
          cached: true,
          duration: Date.now() - startTime
        });
      }
    }

    // 2. محاولة المعالجة المحلية
    const localResult = this._tryLocal(intent);
    if (localResult) {
      this.stats.localCalls++;
      const result = new NiaResult(localResult.result, {
        intent,
        source: 'local',
        duration: Date.now() - startTime
      });

      if (mergedOptions.cacheEnabled) {
        this.cache.set(this.cache.generateKey(intent, options), {
          value: localResult.result,
          meta: result._meta
        });
      }

      return result;
    }

    // 3. استدعاء AI
    if (!mergedOptions.apiKey) {
      throw new Error('مفتاح API غير موجود. استخدم setApiKey() أو OPENROUTER_API_KEY');
    }

    try {
      const aiResult = await this._callAI(intent, mergedOptions);
      this.stats.aiCalls++;
      this.stats.totalCost += aiResult.cost || 0;

      const result = new NiaResult(aiResult.result, {
        intent,
        source: 'ai',
        model: mergedOptions.model,
        cost: aiResult.cost,
        usage: aiResult.usage,
        duration: Date.now() - startTime
      });

      if (mergedOptions.cacheEnabled) {
        this.cache.set(this.cache.generateKey(intent, options), {
          value: aiResult.result,
          meta: result._meta
        });
      }

      return result;

    } catch (error) {
      this.stats.errors++;
      throw error;
    }
  }

  // ========================================
  // المعالجة المحلية
  // ========================================
  _tryLocal(intent) {
    for (const [name, processor] of Object.entries(LOCAL_PROCESSORS)) {
      for (const pattern of processor.patterns) {
        const match = intent.match(pattern);
        if (match) {
          const result = processor.process(match, intent);
          if (result) {
            if (this.config.debug) {
              console.log(`[NIA] Local processor: ${name}`);
            }
            return result;
          }
        }
      }
    }
    return null;
  }

  // ========================================
  // استدعاء AI
  // ========================================
  async _callAI(intent, options) {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${options.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://niascript.dev',
        'X-Title': 'NiaScript'
      },
      body: JSON.stringify({
        model: options.model,
        messages: [
          {
            role: 'system',
            content: `أنت مساعد ذكي. أجب بشكل مباشر ومختصر.
إذا طُلب منك JSON، أرجع JSON صالح فقط.
إذا طُلب منك كود، أرجع الكود بين \`\`\` فقط.`
          },
          { role: 'user', content: intent }
        ],
        max_tokens: options.maxTokens || 1000,
        temperature: options.temperature || 0.7
      }),
      signal: AbortSignal.timeout(options.timeout)
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`AI Error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    const usage = data.usage || {};

    return {
      result: content.trim(),
      cost: (usage.total_tokens || 0) * 0.0001,
      usage
    };
  }

  // ========================================
  // توليد وحفظ السكريبتات
  // ========================================
  async generate(intent, options = {}) {
    const buildPrompt = `اكتب سكريبت Node.js كامل وقابل للتشغيل.

النية: ${intent}

المتطلبات:
- استخدم ESM (import/export)
- console.log للنتائج
- try/catch للأخطاء
- لا تستخدم مفاتيح API إلا إذا طُلب

اكتب الكود فقط بين \`\`\`javascript و \`\`\``;

    const response = await this.run(buildPrompt, {
      ...options,
      maxTokens: 2000
    });

    // استخراج الكود
    let code = '';
    const codeMatch = response.value.match(/```(?:javascript|js)?\n?([\s\S]*?)```/);
    if (codeMatch) {
      code = codeMatch[1].trim();
    }

    if (!code) {
      throw new Error('لم يتم توليد كود صالح');
    }

    // حفظ الملف
    const filename = `nia-${Date.now()}.js`;
    const filepath = path.join(
      process.cwd(),
      this.config.outputDir,
      'scripts',
      filename
    );

    const header = `#!/usr/bin/env node
// Generated by NiaScript
// Intent: ${intent.substring(0, 80)}
// Date: ${new Date().toISOString()}
// Model: ${this.config.model}

`;

    fs.writeFileSync(filepath, header + code);

    // حفظ اللوغ
    const logPath = filepath.replace('.js', '.json');
    fs.writeFileSync(logPath, JSON.stringify({
      intent,
      filepath,
      model: this.config.model,
      generatedAt: new Date().toISOString(),
      linesOfCode: code.split('\n').length
    }, null, 2));

    return new NiaResult(code, {
      intent,
      source: 'generated',
      filepath,
      model: this.config.model
    });
  }

  // ========================================
  // تشغيل سكريبت مولد
  // ========================================
  async execute(filepath, options = {}) {
    const { spawn } = await import('child_process');

    return new Promise((resolve, reject) => {
      const child = spawn('node', [filepath], {
        timeout: options.timeout || this.config.timeout,
        env: { ...process.env, ...options.env }
      });

      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (data) => { stdout += data.toString(); });
      child.stderr.on('data', (data) => { stderr += data.toString(); });

      child.on('close', (code) => {
        if (code === 0) {
          resolve(new NiaResult(stdout.trim(), {
            source: 'executed',
            filepath
          }));
        } else {
          reject(new Error(stderr || stdout || 'Script failed'));
        }
      });

      child.on('error', reject);
    });
  }

  // ========================================
  // الإحصائيات
  // ========================================
  getStats() {
    return {
      ...this.stats,
      cacheSize: this.cache.size,
      outputDir: this.config.outputDir
    };
  }

  clearCache() {
    this.cache.clear();
  }
}

// ========================================
// Instance العامة
// ========================================
let globalNia = null;

function getGlobalNia() {
  if (!globalNia) {
    globalNia = new Nia();
  }
  return globalNia;
}

// ========================================
// Tagged Template Literal
// ========================================
function nia(strings, ...values) {
  // بناء النية
  let intent = strings[0];
  for (let i = 0; i < values.length; i++) {
    const value = values[i];
    if (value instanceof NiaResult) {
      intent += value.toString();
    } else if (typeof value === 'object') {
      intent += JSON.stringify(value);
    } else {
      intent += String(value);
    }
    intent += strings[i + 1] || '';
  }

  // إرجاع Promise مع methods إضافية
  const promise = getGlobalNia().run(intent);

  // إضافة format method
  promise.format = async (type, schema) => {
    const result = await promise;
    return result.format(type, schema);
  };

  promise.json = () => promise.format('json');
  promise.text = () => promise.format('text');
  promise.table = () => promise.format('table');

  return promise;
}

// ========================================
// Helper Functions
// ========================================
nia.config = (options) => {
  const n = getGlobalNia();
  if (options.apiKey) n.setApiKey(options.apiKey);
  if (options.model) n.setModel(options.model);
  if (options.outputDir) n.setOutputDir(options.outputDir);
  return nia;
};

nia.setApiKey = (key) => {
  getGlobalNia().setApiKey(key);
  return nia;
};

nia.setModel = (model) => {
  getGlobalNia().setModel(model);
  return nia;
};

nia.generate = (intent, options) => getGlobalNia().generate(intent, options);
nia.execute = (filepath, options) => getGlobalNia().execute(filepath, options);
nia.stats = () => getGlobalNia().getStats();
nia.clearCache = () => getGlobalNia().clearCache();

// ========================================
// التصدير
// ========================================
export { Nia, NiaResult, NiaCache, nia, LOCAL_PROCESSORS };
export default nia;
