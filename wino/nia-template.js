#!/usr/bin/env node
// wino/nia-template.js - NiaScript Tagged Template Literals
// استخدم النوايا كأنها جزء من JavaScript!
//
// const btc = await nia`سعر البيتكوين اليوم`;
// const news = await nia`5 أخبار من Hacker News`;
// const analysis = await nia`قارن ${btc} مع ${news}`.format("json");

import 'dotenv/config';
import { NiaFlow } from '../src/index.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ========================================
// Cache للسكريبتات المولدة
// ========================================
const scriptCache = new Map();

// ========================================
// NiaResult - نتيجة ذكية مع metadata
// ========================================
class NiaResult {
  constructor(value, meta = {}) {
    this._value = value;
    this._meta = {
      intent: meta.intent || '',
      filepath: meta.filepath || null,
      generatedAt: meta.generatedAt || new Date().toISOString(),
      duration: meta.duration || 0,
      variables: meta.variables || {},
      raw: meta.raw || null,
      ...meta
    };
  }

  // القيمة الأساسية
  get value() { return this._value; }

  // الـ metadata
  get nia() { return this._meta; }

  // تحويل لـ string
  toString() {
    if (typeof this._value === 'object') {
      return JSON.stringify(this._value, null, 2);
    }
    return String(this._value);
  }

  // تحويل لـ JSON
  toJSON() {
    return this._value;
  }

  // للاستخدام في template literals
  [Symbol.toPrimitive](hint) {
    if (hint === 'string') return this.toString();
    if (hint === 'number') return Number(this._value);
    return this._value;
  }

  // إعادة التشغيل مع متغيرات جديدة
  async reload(newVariables = {}) {
    const mergedVars = { ...this._meta.variables, ...newVariables };

    // إذا كان هناك ملف مولد، نعيد تشغيله
    if (this._meta.filepath && fs.existsSync(this._meta.filepath)) {
      return await runGeneratedScript(this._meta.filepath, mergedVars);
    }

    // إعادة توليد من النية
    const newIntent = this._meta.intent;
    return await executeIntent(newIntent, mergedVars);
  }
}

// ========================================
// NiaPromise - Promise مع methods إضافية
// ========================================
class NiaPromise {
  constructor(executor, intent, variables = {}) {
    this._intent = intent;
    this._variables = variables;
    this._formatType = 'auto';
    this._schema = null;

    this._promise = new Promise(executor);
  }

  // format chain method
  format(type = 'json', schema = null) {
    this._formatType = type;
    this._schema = schema;
    return this;
  }

  // json shorthand
  json(schema = null) {
    return this.format('json', schema);
  }

  // text shorthand
  text() {
    return this.format('text');
  }

  // table shorthand
  table() {
    return this.format('table');
  }

  // then للـ await
  then(onFulfilled, onRejected) {
    return this._promise.then(async (result) => {
      // تطبيق التنسيق
      const formatted = await this._applyFormat(result);
      if (onFulfilled) return onFulfilled(formatted);
      return formatted;
    }, onRejected);
  }

  catch(onRejected) {
    return this._promise.catch(onRejected);
  }

  finally(onFinally) {
    return this._promise.finally(onFinally);
  }

  async _applyFormat(result) {
    if (this._formatType === 'auto' || this._formatType === 'text') {
      return result;
    }

    if (this._formatType === 'json') {
      return await formatAsJson(result, this._schema);
    }

    if (this._formatType === 'table') {
      return formatAsTable(result);
    }

    return result;
  }
}

// ========================================
// تنسيق النتائج
// ========================================
async function formatAsJson(result, schema) {
  const value = result instanceof NiaResult ? result._value : result;

  // إذا كانت القيمة JSON بالفعل
  if (typeof value === 'object') {
    if (schema) {
      return validateAndFormat(value, schema);
    }
    return value;
  }

  // محاولة parse
  try {
    const parsed = JSON.parse(value);
    if (schema) {
      return validateAndFormat(parsed, schema);
    }
    return parsed;
  } catch {
    // استخدام AI للتحويل
    if (schema) {
      const nia = new NiaFlow();
      const prompt = `حوّل هذا النص إلى JSON بالهيكل المطلوب:

النص: ${value}

الهيكل المطلوب: ${JSON.stringify(schema)}

أرجع JSON فقط بدون أي نص آخر.`;

      const response = await nia.ask(prompt, { model: 'openai/gpt-5.1-codex-mini' });
      if (response.success) {
        try {
          const match = response.result.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
          if (match) return JSON.parse(match[0]);
        } catch {}
      }
    }

    return { text: value };
  }
}

function validateAndFormat(obj, schema) {
  // تنسيق بسيط حسب الـ schema
  const result = {};
  for (const [key, type] of Object.entries(schema)) {
    if (obj[key] !== undefined) {
      result[key] = obj[key];
    } else {
      // قيمة افتراضية حسب النوع
      if (type === 'number') result[key] = 0;
      else if (type === 'array') result[key] = [];
      else if (type === 'boolean') result[key] = false;
      else result[key] = '';
    }
  }
  return result;
}

function formatAsTable(result) {
  const value = result instanceof NiaResult ? result._value : result;
  if (Array.isArray(value)) {
    console.table(value);
    return value;
  }
  if (typeof value === 'object') {
    console.table([value]);
    return value;
  }
  return value;
}

// ========================================
// تنفيذ النية
// ========================================
async function executeIntent(intent, variables = {}) {
  const startTime = Date.now();
  const nia = new NiaFlow();

  // التحقق من الـ cache
  const cacheKey = intent + JSON.stringify(variables);
  if (scriptCache.has(cacheKey)) {
    const cached = scriptCache.get(cacheKey);
    if (Date.now() - cached.timestamp < 300000) { // 5 دقائق
      return cached.result;
    }
  }

  // بناء الـ prompt
  let fullIntent = intent;
  if (Object.keys(variables).length > 0) {
    fullIntent += `\n\nالمتغيرات:\n${JSON.stringify(variables, null, 2)}`;
  }

  // تنفيذ بسيط أو توليد سكريبت؟
  const needsScript = intent.includes('ملف') ||
                      intent.includes('احفظ') ||
                      intent.includes('سكريبت') ||
                      intent.includes('API') ||
                      intent.includes('جلب') ||
                      intent.includes('fetch');

  if (!needsScript) {
    // تنفيذ مباشر بدون توليد ملف
    const response = await nia.ask(fullIntent, { model: 'openai/gpt-5.1-codex-mini' });

    if (response.success) {
      const result = new NiaResult(response.result, {
        intent,
        variables,
        duration: Date.now() - startTime,
        raw: response
      });

      scriptCache.set(cacheKey, { result, timestamp: Date.now() });
      return result;
    }

    throw new Error(response.error || 'فشل تنفيذ النية');
  }

  // توليد سكريبت كامل
  const generated = await generateScript(intent, variables);

  const result = new NiaResult(generated.output, {
    intent,
    filepath: generated.filepath,
    variables,
    duration: Date.now() - startTime,
    raw: generated
  });

  scriptCache.set(cacheKey, { result, timestamp: Date.now() });
  return result;
}

// ========================================
// توليد وتشغيل سكريبت
// ========================================
async function generateScript(intent, variables = {}) {
  const nia = new NiaFlow();
  const filename = `nia-${Date.now()}.js`;
  const filepath = path.join(__dirname, 'generated', filename);

  // إنشاء مجلد generated
  const genDir = path.join(__dirname, 'generated');
  if (!fs.existsSync(genDir)) {
    fs.mkdirSync(genDir, { recursive: true });
  }

  // بناء prompt للتوليد
  const buildPrompt = `اكتب سكريبت Node.js بسيط ومباشر.

النية: ${intent}

${Object.keys(variables).length > 0 ? `المتغيرات المتاحة:\n${JSON.stringify(variables, null, 2)}` : ''}

المتطلبات:
- استخدم ESM (import/export)
- اطبع النتيجة النهائية كـ JSON باستخدام console.log(JSON.stringify(result))
- لا تستخدم مفاتيح API إلا إذا طُلب
- استخدم APIs مجانية فقط
- الكود يجب أن يكون قابل للتشغيل مباشرة

اكتب الكود فقط بين \`\`\`javascript و \`\`\``;

  const response = await nia.ask(buildPrompt, {
    model: 'openai/gpt-5.1-codex-mini',
    maxTokens: 2000
  });

  if (!response.success) {
    throw new Error('فشل توليد السكريبت');
  }

  // استخراج الكود
  let code = '';
  const codeMatch = response.result.match(/```(?:javascript|js)?\n?([\s\S]*?)```/);
  if (codeMatch) {
    code = codeMatch[1].trim();
  } else if (response.result.includes('import ')) {
    code = response.result.trim();
  }

  if (!code) {
    throw new Error('لم يتم توليد كود صالح');
  }

  // حفظ الملف
  const header = `#!/usr/bin/env node
// Generated by NiaScript Template
// Intent: ${intent.substring(0, 80)}
// Date: ${new Date().toISOString()}

`;
  fs.writeFileSync(filepath, header + code);

  // تثبيت المكتبات إذا لزم
  await installDependencies(code);

  // تشغيل السكريبت
  const output = await runGeneratedScript(filepath, variables);

  return { filepath, code, output: output._value };
}

async function installDependencies(code) {
  const importMatches = code.matchAll(/import\s+.*?from\s+['"]([^'"./][^'"]*)['"]/g);
  const builtins = ['fs', 'path', 'url', 'http', 'https', 'crypto', 'util', 'os', 'child_process', 'stream', 'events', 'buffer', 'process'];

  const deps = new Set();
  for (const match of importMatches) {
    const pkg = match[1].split('/')[0];
    if (!builtins.includes(pkg) && !pkg.startsWith('node:')) {
      deps.add(pkg);
    }
  }

  if (deps.size === 0) return;

  const { execSync } = await import('child_process');
  for (const dep of deps) {
    try {
      execSync(`node -e "require.resolve('${dep}')"`, { stdio: 'pipe' });
    } catch {
      try {
        execSync(`npm install ${dep} --save`, {
          stdio: 'pipe',
          cwd: path.resolve(__dirname, '..')
        });
      } catch {}
    }
  }
}

async function runGeneratedScript(filepath, variables = {}) {
  return new Promise((resolve, reject) => {
    const env = { ...process.env };

    // تمرير المتغيرات كـ environment variables
    for (const [key, value] of Object.entries(variables)) {
      env[`NIA_VAR_${key.toUpperCase()}`] = typeof value === 'object'
        ? JSON.stringify(value)
        : String(value);
    }

    const child = spawn('node', [filepath], { env, timeout: 30000 });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => { stdout += data.toString(); });
    child.stderr.on('data', (data) => { stderr += data.toString(); });

    child.on('close', (code) => {
      if (code === 0) {
        // محاولة parse JSON من الـ output
        let result = stdout.trim();
        try {
          const lines = result.split('\n');
          const lastLine = lines[lines.length - 1];
          result = JSON.parse(lastLine);
        } catch {
          // keep as string
        }

        resolve(new NiaResult(result, { filepath, variables }));
      } else {
        reject(new Error(stderr || stdout || 'Script failed'));
      }
    });

    child.on('error', reject);
  });
}

// ========================================
// Tagged Template Literal - nia`intent`
// ========================================
function nia(strings, ...values) {
  // بناء النية من الـ template literal
  let intent = strings[0];
  const variables = {};

  for (let i = 0; i < values.length; i++) {
    const value = values[i];
    const varName = `var${i + 1}`;

    // إذا كانت القيمة NiaResult، استخدم قيمتها
    if (value instanceof NiaResult) {
      variables[varName] = value._value;
      intent += `\${${varName}: ${JSON.stringify(value._value).substring(0, 100)}}`;
    } else {
      variables[varName] = value;
      intent += `\${${varName}: ${JSON.stringify(value).substring(0, 100)}}`;
    }

    intent += strings[i + 1] || '';
  }

  // إرجاع NiaPromise مع methods
  return new NiaPromise(
    (resolve, reject) => {
      executeIntent(intent, variables)
        .then(resolve)
        .catch(reject);
    },
    intent,
    variables
  );
}

// ========================================
// Helper functions
// ========================================
nia.clearCache = () => scriptCache.clear();

nia.getCacheStats = () => ({
  size: scriptCache.size,
  keys: [...scriptCache.keys()]
});

// ========================================
// تصدير
// ========================================
export { nia, NiaResult, NiaPromise };
export default nia;

// ========================================
// اختبار إذا تم تشغيله مباشرة
// ========================================
const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMain) {
  console.log(`
╔═══════════════════════════════════════════════════════════════╗
║  🎯 NIA Template Literals - اختبار                            ║
╚═══════════════════════════════════════════════════════════════╝
`);

  (async () => {
    try {
      // اختبار 1: نية بسيطة
      console.log('📝 اختبار 1: سعر البيتكوين...');
      const btc = await nia`ما هو سعر البيتكوين التقريبي اليوم بالدولار؟ أجب برقم فقط`;
      console.log('   النتيجة:', btc.toString());
      console.log('   Meta:', btc.nia);

      // اختبار 2: مع format
      console.log('\n📝 اختبار 2: أخبار مع JSON format...');
      const news = await nia`اعطني 3 عناوين أخبار تقنية وهمية`.format('json', {
        headlines: 'array'
      });
      console.log('   النتيجة:', news);

      // اختبار 3: تركيب النتائج
      console.log('\n📝 اختبار 3: تحليل مع المتغيرات السابقة...');
      const analysis = await nia`حلل العلاقة بين سعر البيتكوين ${btc} والأخبار ${news}`;
      console.log('   النتيجة:', analysis.toString().substring(0, 200));

      console.log('\n✅ الاختبارات انتهت!');

    } catch (error) {
      console.error('❌ خطأ:', error.message);
    }
  })();
}
