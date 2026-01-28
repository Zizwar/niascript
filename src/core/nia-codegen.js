// src/core/nia-codegen.js - NiaScript Code Generation System
// نظام توليد الكود من النوايا - اكتب ما تريد، نحن نكتب الكود!

import axios from 'axios';

/**
 * NiaCodeGen - مولد الكود الذكي
 *
 * الفكرة: بدلاً من كتابة الكود يدوياً،
 * اكتب نيتك وسيُولد الكود لك!
 *
 * الأنواع المدعومة:
 * - Functions (دوال)
 * - Classes (كلاسات)
 * - APIs (نقاط النهاية)
 * - Components (مكونات)
 * - Scripts (سكربتات كاملة)
 * - Tests (اختبارات)
 */

export class NiaCodeGen {
  constructor(config = {}) {
    this.apiKey = config.apiKey || process.env.OPENROUTER_API_KEY;
    this.baseURL = config.baseURL || 'https://openrouter.ai/api/v1';
    this.model = config.model || 'openai/gpt-5.1-codex-mini';

    // قوالب الأنماط
    this.templates = {
      function: this.functionTemplate(),
      class: this.classTemplate(),
      api: this.apiTemplate(),
      component: this.componentTemplate(),
      script: this.scriptTemplate(),
      test: this.testTemplate()
    };

    // السياق والتاريخ
    this.history = [];
    this.context = {};
  }

  // ========================================
  // القوالب
  // ========================================

  functionTemplate() {
    return `أنت مولد كود JavaScript/TypeScript متخصص.
اكتب دالة بناءً على الوصف التالي.

القواعد:
- استخدم ESM (export)
- أضف JSDoc كامل
- معالجة الأخطاء
- كود نظيف وقابل للقراءة
- أضف أمثلة استخدام

أجب بـ JSON:
{
  "name": "اسم الدالة",
  "code": "الكود الكامل",
  "usage": "مثال الاستخدام",
  "dependencies": [],
  "notes": "ملاحظات"
}`;
  }

  classTemplate() {
    return `أنت مولد كود JavaScript/TypeScript متخصص.
اكتب كلاس بناءً على الوصف التالي.

القواعد:
- تصميم OOP نظيف
- JSDoc لكل method
- Constructor مناسب
- Getters/Setters عند الحاجة
- معالجة الأخطاء

أجب بـ JSON:
{
  "name": "اسم الكلاس",
  "code": "الكود الكامل",
  "methods": ["قائمة الدوال"],
  "usage": "مثال الاستخدام",
  "dependencies": []
}`;
  }

  apiTemplate() {
    return `أنت مولد كود API متخصص (Express.js / Fastify / Hono).
اكتب endpoint(s) بناءً على الوصف.

القواعد:
- RESTful design
- معالجة الأخطاء
- Validation
- تعليقات واضحة
- أمان (sanitization)

أجب بـ JSON:
{
  "endpoints": [
    {
      "method": "GET|POST|PUT|DELETE",
      "path": "/path",
      "description": "الوصف",
      "code": "الكود"
    }
  ],
  "middleware": "أي middleware مطلوب",
  "dependencies": []
}`;
  }

  componentTemplate() {
    return `أنت مولد مكونات React/Vue/Svelte.
اكتب مكون UI بناءً على الوصف.

القواعد:
- Functional components (React hooks)
- Props واضحة
- TypeScript types
- Accessibility (a11y)
- Responsive design hints

أجب بـ JSON:
{
  "name": "اسم المكون",
  "framework": "react|vue|svelte",
  "code": "الكود الكامل",
  "props": [{"name": "", "type": "", "description": ""}],
  "usage": "مثال الاستخدام",
  "dependencies": []
}`;
  }

  scriptTemplate() {
    return `أنت مولد سكربتات Node.js.
اكتب سكربت كامل وقابل للتشغيل.

القواعد:
- CLI ready (يمكن تشغيله من terminal)
- معالجة arguments
- معالجة الأخطاء
- Output واضح
- Exit codes صحيحة

أجب بـ JSON:
{
  "name": "اسم السكربت",
  "description": "ماذا يفعل",
  "code": "الكود الكامل",
  "usage": "كيفية التشغيل",
  "arguments": [{"name": "", "description": "", "required": true|false}],
  "dependencies": []
}`;
  }

  testTemplate() {
    return `أنت مولد اختبارات (Vitest/Jest).
اكتب اختبارات شاملة للكود المعطى.

القواعد:
- تغطية شاملة (happy path, edge cases, errors)
- أسماء وصفية
- Setup/Teardown عند الحاجة
- Mocking عند الحاجة

أجب بـ JSON:
{
  "testFile": "اسم ملف الاختبار",
  "code": "الكود الكامل",
  "coverage": ["ما تم تغطيته"],
  "dependencies": []
}`;
  }

  // ========================================
  // التوليد الرئيسي
  // ========================================

  /**
   * توليد كود من نية
   */
  async generate(intent, options = {}) {
    const type = options.type || this.detectType(intent);
    const template = this.templates[type] || this.templates.function;

    const messages = [
      { role: 'system', content: template },
      { role: 'user', content: intent }
    ];

    // إضافة السياق إذا وُجد
    if (options.context || Object.keys(this.context).length > 0) {
      const ctx = { ...this.context, ...options.context };
      messages[0].content += `\n\nالسياق:\n${JSON.stringify(ctx, null, 2)}`;
    }

    try {
      const response = await axios.post(
        `${this.baseURL}/chat/completions`,
        {
          model: options.model || this.model,
          messages,
          temperature: 0.2,
          max_tokens: 4000
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 60000
        }
      );

      const content = response.data.choices[0].message.content;

      // محاولة parse JSON
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      let generated;

      if (jsonMatch) {
        try {
          generated = JSON.parse(jsonMatch[0]);
        } catch {
          generated = { code: this.extractCode(content), raw: content };
        }
      } else {
        generated = { code: this.extractCode(content), raw: content };
      }

      // حفظ في التاريخ
      this.history.push({
        intent,
        type,
        result: generated,
        timestamp: Date.now()
      });

      return {
        success: true,
        type,
        generated,
        usage: response.data.usage
      };

    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error?.message || error.message
      };
    }
  }

  /**
   * اكتشاف نوع الكود المطلوب
   */
  detectType(intent) {
    const lower = intent.toLowerCase();

    if (/كلاس|class|فئة|object/.test(lower)) return 'class';
    if (/api|endpoint|route|مسار|نقطة/.test(lower)) return 'api';
    if (/component|مكون|واجهة|ui|button|form/.test(lower)) return 'component';
    if (/script|سكربت|cli|أداة|tool/.test(lower)) return 'script';
    if (/test|اختبار|spec/.test(lower)) return 'test';

    return 'function'; // الافتراضي
  }

  /**
   * استخراج الكود من نص
   */
  extractCode(text) {
    const codeMatch = text.match(/```[\w]*\n([\s\S]*?)```/);
    return codeMatch ? codeMatch[1].trim() : text;
  }

  // ========================================
  // دوال مساعدة مختصرة
  // ========================================

  /**
   * توليد دالة
   */
  async func(description, options = {}) {
    return await this.generate(description, { ...options, type: 'function' });
  }

  /**
   * توليد كلاس
   */
  async class_(description, options = {}) {
    return await this.generate(description, { ...options, type: 'class' });
  }

  /**
   * توليد API endpoint
   */
  async api(description, options = {}) {
    return await this.generate(description, { ...options, type: 'api' });
  }

  /**
   * توليد مكون UI
   */
  async component(description, framework = 'react', options = {}) {
    return await this.generate(description, {
      ...options,
      type: 'component',
      context: { framework }
    });
  }

  /**
   * توليد سكربت
   */
  async script(description, options = {}) {
    return await this.generate(description, { ...options, type: 'script' });
  }

  /**
   * توليد اختبارات لكود
   */
  async tests(code, description = '', options = {}) {
    const intent = description
      ? `اكتب اختبارات لـ: ${description}\n\nالكود:\n\`\`\`\n${code}\n\`\`\``
      : `اكتب اختبارات لهذا الكود:\n\`\`\`\n${code}\n\`\`\``;

    return await this.generate(intent, { ...options, type: 'test' });
  }

  // ========================================
  // الأدوات المتقدمة
  // ========================================

  /**
   * تحسين كود موجود
   */
  async improve(code, instructions, options = {}) {
    const intent = `حسّن هذا الكود بناءً على التعليمات التالية:

التعليمات: ${instructions}

الكود الأصلي:
\`\`\`
${code}
\`\`\`

أعطني الكود المحسن فقط مع شرح التغييرات.`;

    return await this.generate(intent, options);
  }

  /**
   * تحويل كود من لغة لأخرى
   */
  async convert(code, fromLang, toLang, options = {}) {
    const intent = `حوّل هذا الكود من ${fromLang} إلى ${toLang}:

\`\`\`${fromLang}
${code}
\`\`\`

حافظ على نفس المنطق والوظيفة.`;

    return await this.generate(intent, options);
  }

  /**
   * شرح كود
   */
  async explain(code, options = {}) {
    const messages = [
      {
        role: 'system',
        content: `أنت شارح كود محترف. اشرح الكود بالعربية بشكل واضح ومفصل.

اشرح:
1. ماذا يفعل الكود بشكل عام
2. كل جزء رئيسي
3. أي أنماط تصميم مستخدمة
4. نقاط القوة والضعف

أجب بـ JSON:
{
  "summary": "ملخص قصير",
  "explanation": "الشرح المفصل",
  "concepts": ["المفاهيم المستخدمة"],
  "improvements": ["اقتراحات التحسين"]
}`
      },
      {
        role: 'user',
        content: `اشرح هذا الكود:\n\`\`\`\n${code}\n\`\`\``
      }
    ];

    try {
      const response = await axios.post(
        `${this.baseURL}/chat/completions`,
        {
          model: options.model || this.model,
          messages,
          temperature: 0.3,
          max_tokens: 2000
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const content = response.data.choices[0].message.content;
      const jsonMatch = content.match(/\{[\s\S]*\}/);

      return {
        success: true,
        explanation: jsonMatch ? JSON.parse(jsonMatch[0]) : { raw: content }
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * إصلاح خطأ في كود
   */
  async fix(code, error, options = {}) {
    const intent = `أصلح هذا الخطأ في الكود:

الخطأ: ${error}

الكود:
\`\`\`
${code}
\`\`\`

أعطني الكود المصحح مع شرح الإصلاح.`;

    return await this.generate(intent, options);
  }

  /**
   * توليد كود من مثال
   */
  async fromExample(input, output, options = {}) {
    const intent = `اكتب دالة تحول هذا المدخل إلى هذا المخرج:

المدخل: ${JSON.stringify(input)}
المخرج: ${JSON.stringify(output)}

اكتب دالة عامة تعمل مع حالات مشابهة.`;

    return await this.generate(intent, { ...options, type: 'function' });
  }

  // ========================================
  // إدارة السياق
  // ========================================

  /**
   * تعيين سياق عام
   */
  setContext(key, value) {
    this.context[key] = value;
    return this;
  }

  /**
   * مسح السياق
   */
  clearContext() {
    this.context = {};
    return this;
  }

  /**
   * الحصول على التاريخ
   */
  getHistory() {
    return this.history;
  }

  /**
   * مسح التاريخ
   */
  clearHistory() {
    this.history = [];
    return this;
  }
}

// ========================================
// واجهة سهلة
// ========================================

let globalCodeGen = null;

export function codegen(config = {}) {
  if (!globalCodeGen || config.apiKey) {
    globalCodeGen = new NiaCodeGen(config);
  }
  return globalCodeGen;
}

// اختصارات
codegen.func = async (desc, opts) => codegen().func(desc, opts);
codegen.class = async (desc, opts) => codegen().class_(desc, opts);
codegen.api = async (desc, opts) => codegen().api(desc, opts);
codegen.component = async (desc, fw, opts) => codegen().component(desc, fw, opts);
codegen.script = async (desc, opts) => codegen().script(desc, opts);
codegen.tests = async (code, desc, opts) => codegen().tests(code, desc, opts);
codegen.improve = async (code, inst, opts) => codegen().improve(code, inst, opts);
codegen.explain = async (code, opts) => codegen().explain(code, opts);
codegen.fix = async (code, err, opts) => codegen().fix(code, err, opts);

export default NiaCodeGen;
