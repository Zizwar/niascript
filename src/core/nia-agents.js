// src/core/nia-agents.js - NiaScript Multi-Agent System 3.0
// نظام الوكلاء المتخصصين - كل وكيل خبير في مجاله!

import axios from 'axios';

/**
 * NiaAgents - نظام الوكلاء الذكي
 *
 * الفكرة: بدلاً من وكيل واحد يفعل كل شيء،
 * لدينا فريق من الوكلاء المتخصصين يتعاونون!
 *
 * الوكلاء:
 * - PlannerAgent: يخطط ويحلل المهام
 * - BuilderAgent: يبني ويكتب الكود
 * - ValidatorAgent: يدقق ويراجع
 * - TestAgent: يختبر ويتحقق
 * - OrchestratorAgent: ينسق بين الوكلاء
 */

// ========================================
// قاعدة الوكيل
// ========================================
class BaseAgent {
  constructor(name, config = {}) {
    this.name = name;
    this.apiKey = config.apiKey || process.env.OPENROUTER_API_KEY;
    this.baseURL = config.baseURL || 'https://openrouter.ai/api/v1';
    this.model = config.model || 'openai/gpt-5.1-codex-mini';
    this.systemPrompt = '';
    this.tools = [];
    this.memory = [];
    this.maxMemory = 20;
  }

  setSystemPrompt(prompt) {
    this.systemPrompt = prompt;
    return this;
  }

  addTool(tool) {
    this.tools.push(tool);
    return this;
  }

  remember(item) {
    this.memory.push({
      ...item,
      timestamp: Date.now()
    });
    if (this.memory.length > this.maxMemory) {
      this.memory = this.memory.slice(-this.maxMemory);
    }
  }

  async think(prompt, options = {}) {
    const messages = [
      { role: 'system', content: this.systemPrompt },
    ];

    // إضافة الذاكرة كسياق
    if (this.memory.length > 0 && !options.noMemory) {
      const memoryContext = this.memory
        .slice(-5)
        .map(m => `[${m.type}] ${m.content}`)
        .join('\n');
      messages.push({
        role: 'system',
        content: `الذاكرة الأخيرة:\n${memoryContext}`
      });
    }

    messages.push({ role: 'user', content: prompt });

    try {
      const response = await axios.post(
        `${this.baseURL}/chat/completions`,
        {
          model: options.model || this.model,
          messages,
          temperature: options.temperature || 0.3,
          max_tokens: options.maxTokens || 2000,
          ...(this.tools.length > 0 && { tools: this.tools })
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
      const toolCalls = response.data.choices[0].message.tool_calls;

      this.remember({
        type: 'thought',
        content: prompt.substring(0, 100) + '...',
        result: content?.substring(0, 100) + '...'
      });

      return {
        success: true,
        content,
        toolCalls,
        usage: response.data.usage
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error?.message || error.message
      };
    }
  }
}

// ========================================
// وكيل التخطيط (Planner)
// ========================================
export class PlannerAgent extends BaseAgent {
  constructor(config = {}) {
    super('Planner', config);
    this.model = config.model || 'openai/gpt-5.1-codex-mini';
    this.setSystemPrompt(`أنت وكيل التخطيط في NiaScript.
مهمتك: تحليل النوايا وتقسيمها إلى خطوات قابلة للتنفيذ.

عند استلام نية:
1. حللها لفهم الهدف النهائي
2. حدد المكونات المطلوبة
3. قسمها إلى خطوات صغيرة
4. حدد الوكيل المناسب لكل خطوة
5. حدد التبعيات بين الخطوات

أجب دائماً بصيغة JSON:
{
  "analysis": "تحليل النية",
  "goal": "الهدف النهائي",
  "steps": [
    {
      "id": 1,
      "description": "وصف الخطوة",
      "agent": "Builder|Validator|Test",
      "input": "المدخلات",
      "output": "المخرجات المتوقعة",
      "dependsOn": []
    }
  ],
  "estimatedComplexity": "low|medium|high"
}`);
  }

  async plan(intent) {
    const result = await this.think(`خطط لتنفيذ هذه النية:\n${intent}`);

    if (!result.success) {
      return { success: false, error: result.error };
    }

    try {
      // محاولة استخراج JSON
      const jsonMatch = result.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const plan = JSON.parse(jsonMatch[0]);
        return { success: true, plan };
      }
      return { success: true, plan: { raw: result.content } };
    } catch {
      return { success: true, plan: { raw: result.content } };
    }
  }
}

// ========================================
// وكيل البناء (Builder)
// ========================================
export class BuilderAgent extends BaseAgent {
  constructor(config = {}) {
    super('Builder', config);
    this.model = config.model || 'openai/gpt-5.1-codex-mini';
    this.setSystemPrompt(`أنت وكيل البناء في NiaScript.
مهمتك: كتابة الكود وبناء الحلول.

القواعد:
1. اكتب كود نظيف وقابل للقراءة
2. أضف تعليقات توضيحية
3. استخدم أفضل الممارسات
4. فكر في الأمان
5. اجعل الكود قابل للاختبار

عند كتابة الكود:
- استخدم ESM (import/export)
- أضف معالجة الأخطاء
- وثق الدوال
- اجعله قابل للتوسع

أجب بصيغة JSON:
{
  "code": "الكود",
  "language": "javascript|python|...",
  "explanation": "شرح مختصر",
  "dependencies": ["التبعيات"],
  "usage": "مثال الاستخدام"
}`);
  }

  async build(specification) {
    const result = await this.think(`ابنِ هذا:\n${specification}`, {
      maxTokens: 4000
    });

    if (!result.success) {
      return { success: false, error: result.error };
    }

    try {
      const jsonMatch = result.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const built = JSON.parse(jsonMatch[0]);
        return { success: true, built };
      }

      // استخراج الكود من code blocks
      const codeMatch = result.content.match(/```[\w]*\n([\s\S]*?)```/);
      if (codeMatch) {
        return {
          success: true,
          built: {
            code: codeMatch[1],
            raw: result.content
          }
        };
      }

      return { success: true, built: { raw: result.content } };
    } catch {
      return { success: true, built: { raw: result.content } };
    }
  }

  async generateFunction(description) {
    return await this.build(`اكتب دالة JavaScript:
الوصف: ${description}
المتطلبات:
- دالة async إذا لزم الأمر
- معالجة الأخطاء
- تعليقات JSDoc
- أمثلة استخدام`);
  }

  async generateClass(description) {
    return await this.build(`اكتب كلاس JavaScript:
الوصف: ${description}
المتطلبات:
- تصميم OOP نظيف
- methods واضحة
- constructor مناسب
- تعليقات JSDoc`);
  }
}

// ========================================
// وكيل التدقيق (Validator)
// ========================================
export class ValidatorAgent extends BaseAgent {
  constructor(config = {}) {
    super('Validator', config);
    this.model = config.model || 'anthropic/claude-3-haiku';
    this.setSystemPrompt(`أنت وكيل التدقيق في NiaScript.
مهمتك: مراجعة الكود والتحقق من جودته.

عند مراجعة الكود، تحقق من:
1. الصحة: هل الكود صحيح منطقياً؟
2. الأمان: هل هناك ثغرات أمنية؟
3. الأداء: هل هناك مشاكل أداء؟
4. القراءة: هل الكود سهل القراءة؟
5. أفضل الممارسات: هل يتبع المعايير؟

أجب بصيغة JSON:
{
  "valid": true|false,
  "score": 0-100,
  "issues": [
    {
      "severity": "error|warning|info",
      "line": رقم السطر أو null,
      "message": "وصف المشكلة",
      "suggestion": "الحل المقترح"
    }
  ],
  "summary": "ملخص المراجعة",
  "approved": true|false
}`);
  }

  async validate(code, context = '') {
    const prompt = context
      ? `راجع هذا الكود:\nالسياق: ${context}\n\nالكود:\n\`\`\`\n${code}\n\`\`\``
      : `راجع هذا الكود:\n\`\`\`\n${code}\n\`\`\``;

    const result = await this.think(prompt);

    if (!result.success) {
      return { success: false, error: result.error };
    }

    try {
      const jsonMatch = result.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const validation = JSON.parse(jsonMatch[0]);
        return { success: true, validation };
      }
      return { success: true, validation: { raw: result.content } };
    } catch {
      return { success: true, validation: { raw: result.content } };
    }
  }

  async quickCheck(code) {
    const result = await this.think(
      `فحص سريع - هل هذا الكود آمن وصحيح؟ أجب بـ yes أو no مع سبب مختصر:\n${code}`,
      { maxTokens: 200 }
    );

    return {
      success: result.success,
      safe: result.content?.toLowerCase().includes('yes'),
      reason: result.content
    };
  }
}

// ========================================
// وكيل الاختبار (Tester)
// ========================================
export class TestAgent extends BaseAgent {
  constructor(config = {}) {
    super('Tester', config);
    this.model = config.model || 'openai/gpt-5.1-codex-mini';
    this.setSystemPrompt(`أنت وكيل الاختبار في NiaScript.
مهمتك: كتابة وتنفيذ الاختبارات.

عند كتابة الاختبارات:
1. غطِّ الحالات الأساسية (happy path)
2. غطِّ حالات الحدود (edge cases)
3. غطِّ حالات الخطأ (error cases)
4. استخدم أسماء واضحة للاختبارات

أجب بصيغة JSON:
{
  "tests": [
    {
      "name": "اسم الاختبار",
      "description": "ماذا يختبر",
      "input": "المدخلات",
      "expectedOutput": "المخرجات المتوقعة",
      "code": "كود الاختبار"
    }
  ],
  "coverage": "تقدير التغطية",
  "suggestions": ["اقتراحات لاختبارات إضافية"]
}`);
  }

  async generateTests(code, description = '') {
    const prompt = `اكتب اختبارات لهذا الكود:
${description ? `الوصف: ${description}\n` : ''}
الكود:
\`\`\`
${code}
\`\`\``;

    const result = await this.think(prompt, { maxTokens: 3000 });

    if (!result.success) {
      return { success: false, error: result.error };
    }

    try {
      const jsonMatch = result.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const tests = JSON.parse(jsonMatch[0]);
        return { success: true, tests };
      }
      return { success: true, tests: { raw: result.content } };
    } catch {
      return { success: true, tests: { raw: result.content } };
    }
  }

  async runSimulation(code, testCases) {
    const prompt = `شغّل هذه الاختبارات ذهنياً وأعطني النتائج:

الكود:
\`\`\`
${code}
\`\`\`

حالات الاختبار:
${JSON.stringify(testCases, null, 2)}

أجب بـ JSON:
{
  "results": [
    {"test": "اسم", "passed": true|false, "actual": "النتيجة الفعلية", "note": "ملاحظة"}
  ],
  "summary": {"passed": عدد, "failed": عدد, "total": عدد}
}`;

    const result = await this.think(prompt);

    if (!result.success) {
      return { success: false, error: result.error };
    }

    try {
      const jsonMatch = result.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return { success: true, simulation: JSON.parse(jsonMatch[0]) };
      }
      return { success: true, simulation: { raw: result.content } };
    } catch {
      return { success: true, simulation: { raw: result.content } };
    }
  }
}

// ========================================
// وكيل التنسيق (Orchestrator)
// ========================================
export class OrchestratorAgent extends BaseAgent {
  constructor(config = {}) {
    super('Orchestrator', config);
    this.model = config.model || 'openai/gpt-5.1-codex-mini';

    // إنشاء الوكلاء الفرعيين
    this.planner = new PlannerAgent(config);
    this.builder = new BuilderAgent(config);
    this.validator = new ValidatorAgent(config);
    this.tester = new TestAgent(config);

    this.setSystemPrompt(`أنت المنسق الرئيسي في NiaScript.
مهمتك: تنسيق العمل بين الوكلاء المختلفين لتحقيق الهدف.

الوكلاء المتاحين:
- Planner: للتخطيط والتحليل
- Builder: لكتابة الكود
- Validator: للتدقيق والمراجعة
- Tester: للاختبار

عملية العمل:
1. استلم النية من المستخدم
2. أرسلها للـ Planner للتخطيط
3. نفذ الخطوات بالترتيب
4. دقق وراجع
5. اختبر
6. أرجع النتيجة النهائية`);
  }

  /**
   * تنفيذ نية كاملة مع جميع الوكلاء
   */
  async execute(intent, options = {}) {
    const startTime = Date.now();
    const log = [];

    const addLog = (agent, action, result) => {
      log.push({
        agent,
        action,
        result: typeof result === 'string' ? result : JSON.stringify(result).substring(0, 200),
        timestamp: Date.now() - startTime
      });
    };

    try {
      // 1. التخطيط
      addLog('Orchestrator', 'starting', intent);

      const planResult = await this.planner.plan(intent);
      if (!planResult.success) {
        return { success: false, error: 'فشل التخطيط', details: planResult };
      }
      addLog('Planner', 'planned', planResult.plan);

      const plan = planResult.plan;
      const results = [];

      // 2. تنفيذ الخطوات
      if (plan.steps && Array.isArray(plan.steps)) {
        for (const step of plan.steps) {
          addLog('Orchestrator', 'executing_step', step.description);

          let stepResult;
          switch (step.agent?.toLowerCase()) {
            case 'builder':
              stepResult = await this.builder.build(step.input || step.description);
              break;
            case 'validator':
              stepResult = await this.validator.validate(step.input || results[results.length - 1]?.built?.code);
              break;
            case 'test':
            case 'tester':
              stepResult = await this.tester.generateTests(step.input || results[results.length - 1]?.built?.code);
              break;
            default:
              stepResult = await this.builder.build(step.description);
          }

          results.push({ step, result: stepResult });
          addLog(step.agent || 'Builder', 'completed', stepResult);

          if (!stepResult.success && !options.continueOnError) {
            return {
              success: false,
              error: `فشل في الخطوة: ${step.description}`,
              completedSteps: results.length - 1,
              results,
              log
            };
          }
        }
      } else {
        // خطة بسيطة - بناء مباشر
        const buildResult = await this.builder.build(intent);
        results.push({ step: { description: 'بناء مباشر' }, result: buildResult });
        addLog('Builder', 'direct_build', buildResult);
      }

      // 3. التدقيق النهائي (إذا كان هناك كود)
      const lastCode = results.find(r => r.result?.built?.code)?.result?.built?.code;
      let validation = null;

      if (lastCode && !options.skipValidation) {
        validation = await this.validator.validate(lastCode);
        addLog('Validator', 'final_validation', validation);
      }

      // 4. توليد الاختبارات (إذا طُلب)
      let tests = null;
      if (lastCode && options.generateTests) {
        tests = await this.tester.generateTests(lastCode);
        addLog('Tester', 'generated_tests', tests);
      }

      return {
        success: true,
        plan,
        results,
        validation,
        tests,
        log,
        duration: Date.now() - startTime,
        summary: this.summarize(results)
      };

    } catch (error) {
      return {
        success: false,
        error: error.message,
        log
      };
    }
  }

  /**
   * تنفيذ سريع (بدون تخطيط مفصل)
   */
  async quickBuild(intent) {
    const buildResult = await this.builder.build(intent);
    if (!buildResult.success) return buildResult;

    const code = buildResult.built?.code;
    if (!code) return buildResult;

    const validation = await this.validator.quickCheck(code);

    return {
      success: true,
      code,
      safe: validation.safe,
      details: buildResult.built
    };
  }

  /**
   * تحسين كود موجود
   */
  async improve(code, instructions) {
    const validation = await this.validator.validate(code);

    const improvePrompt = `حسّن هذا الكود بناءً على:
1. التعليمات: ${instructions}
2. مشاكل المراجعة: ${JSON.stringify(validation.validation?.issues || [])}

الكود الأصلي:
\`\`\`
${code}
\`\`\``;

    return await this.builder.build(improvePrompt);
  }

  summarize(results) {
    const successful = results.filter(r => r.result?.success).length;
    return {
      totalSteps: results.length,
      successful,
      failed: results.length - successful,
      hasCode: results.some(r => r.result?.built?.code)
    };
  }
}

// ========================================
// NiaAgentTeam - الواجهة السهلة
// ========================================
export class NiaAgentTeam {
  constructor(config = {}) {
    this.config = {
      apiKey: config.apiKey || process.env.OPENROUTER_API_KEY,
      ...config
    };

    this.orchestrator = new OrchestratorAgent(this.config);
    this.planner = this.orchestrator.planner;
    this.builder = this.orchestrator.builder;
    this.validator = this.orchestrator.validator;
    this.tester = this.orchestrator.tester;
  }

  /**
   * تنفيذ نية كاملة
   */
  async do(intent, options = {}) {
    return await this.orchestrator.execute(intent, options);
  }

  /**
   * بناء سريع
   */
  async build(what) {
    return await this.orchestrator.quickBuild(what);
  }

  /**
   * تخطيط فقط
   */
  async plan(intent) {
    return await this.planner.plan(intent);
  }

  /**
   * مراجعة كود
   */
  async review(code) {
    return await this.validator.validate(code);
  }

  /**
   * توليد اختبارات
   */
  async test(code, description) {
    return await this.tester.generateTests(code, description);
  }

  /**
   * تحسين كود
   */
  async improve(code, instructions) {
    return await this.orchestrator.improve(code, instructions);
  }

  /**
   * سؤال مباشر لوكيل معين
   */
  async ask(agent, question) {
    const agents = {
      planner: this.planner,
      builder: this.builder,
      validator: this.validator,
      tester: this.tester,
      orchestrator: this.orchestrator
    };

    const targetAgent = agents[agent.toLowerCase()];
    if (!targetAgent) {
      return { success: false, error: `وكيل غير معروف: ${agent}` };
    }

    return await targetAgent.think(question);
  }
}

// ========================================
// Factory Function
// ========================================
export function createAgentTeam(config = {}) {
  return new NiaAgentTeam(config);
}

// Export default
export default NiaAgentTeam;
