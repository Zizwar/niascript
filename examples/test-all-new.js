#!/usr/bin/env node
// examples/test-all-new.js - اختبار شامل للمكونات الجديدة
// NiaScript 3.0 - البرمجة بالنوايا!

import 'dotenv/config';
import chalk from 'chalk';

// استيراد المكونات
import { NiaFlow, flow } from '../src/core/nia-flow.js';
import { NiaAgentTeam, createAgentTeam } from '../src/core/nia-agents.js';
import { LocalEngineExtended } from '../src/core/nia-local-extended.js';
import { NiaCodeGen, codegen } from '../src/core/nia-codegen.js';

const API_KEY = process.env.OPENROUTER_API_KEY;

console.log(chalk.cyan.bold(`
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   🚀 NiaScript 3.0 - اختبار شامل                              ║
║   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━               ║
║   البرمجة بالنوايا | نظام الوكلاء | توليد الكود              ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
`));

console.log(chalk.gray(`API Key: ${API_KEY ? '✅ موجود' : '❌ غير موجود'}\n`));

// ========================================
// اختبار 1: المحرك المحلي الموسع
// ========================================
async function testLocalExtended() {
  console.log(chalk.yellow.bold('\n📊 [1] اختبار المحرك المحلي الموسع'));
  console.log(chalk.gray('━'.repeat(60)));

  const engine = new LocalEngineExtended();

  const tests = [
    // التواريخ
    { name: 'التاريخ الحالي', input: 'ما هو اليوم' },
    { name: 'فرق التواريخ', input: 'كم يوم بين 2024-01-01 و 2024-12-31' },
    { name: 'إضافة أيام', input: 'أضف 30 يوم إلى اليوم' },

    // تحويل الوحدات
    { name: 'تحويل طول', input: '100 km إلى mi' },
    { name: 'تحويل وزن', input: '75 كجم إلى رطل' },
    { name: 'تحويل حرارة', input: '37 مئوية إلى فهرنهايت' },
    { name: 'تحويل بيانات', input: '1024 mb إلى gb' },

    // الإحصائيات
    { name: 'المتوسط', input: 'متوسط 10 20 30 40 50' },
    { name: 'المجموع', input: 'مجموع 100 200 300' },
    { name: 'الأكبر', input: 'أكبر في 5 2 8 1 9 3' },

    // الأرقام
    { name: 'مضروب', input: 'مضروب 5' },
    { name: 'جذر تربيعي', input: 'جذر 144' },
    { name: 'عشوائي', input: 'عشوائي بين 1 و 100' },
    { name: 'هل أولي', input: 'هل 17 أولي' },

    // النصوص
    { name: 'طول النص', input: 'طول "مرحبا بالعالم"' },
    { name: 'عكس النص', input: 'اعكس "Hello"' },

    // المقارنات
    { name: 'مقارنة', input: 'هل 50 أكبر من 30' },
    { name: 'بين', input: 'هل 25 بين 10 و 50' },
  ];

  let passed = 0;
  for (const test of tests) {
    const result = engine.tryProcess(test.input);
    if (result && result.success) {
      console.log(chalk.green(`  ✅ ${test.name}: ${result.result}`));
      passed++;
    } else {
      console.log(chalk.red(`  ❌ ${test.name}: فشل`));
    }
  }

  console.log(chalk.cyan(`\n  📊 النتيجة: ${passed}/${tests.length} نجحت`));
  return passed === tests.length;
}

// ========================================
// اختبار 2: NiaFlow الأساسي
// ========================================
async function testNiaFlow() {
  console.log(chalk.yellow.bold('\n🌊 [2] اختبار NiaFlow'));
  console.log(chalk.gray('━'.repeat(60)));

  const nia = new NiaFlow({ apiKey: API_KEY });

  // اختبارات محلية
  console.log(chalk.cyan('\n  الحسابات المحلية:'));

  const localTests = [
    '100 + 50 * 2',
    '15% من 200',
    'خصم 30% من 1000',
    '1000$ @ 8% لمدة 5 سنوات'
  ];

  for (const test of localTests) {
    const result = nia.calc(test);
    if (result?.success) {
      console.log(chalk.green(`  ✅ ${test} = ${result.result}`));
    }
  }

  // اختبار AI
  if (API_KEY) {
    console.log(chalk.cyan('\n  اختبار AI:'));
    try {
      const result = await nia.ask('ما هو 2+2؟ أجب برقم فقط');
      if (result.success) {
        console.log(chalk.green(`  ✅ AI يعمل: ${result.result}`));
      } else {
        console.log(chalk.red(`  ❌ AI فشل: ${result.error}`));
      }
    } catch (e) {
      console.log(chalk.red(`  ❌ خطأ: ${e.message}`));
    }
  }

  return true;
}

// ========================================
// اختبار 3: نظام الوكلاء
// ========================================
async function testAgents() {
  console.log(chalk.yellow.bold('\n🤖 [3] اختبار نظام الوكلاء'));
  console.log(chalk.gray('━'.repeat(60)));

  if (!API_KEY) {
    console.log(chalk.yellow('  ⚠️  يحتاج API key'));
    return true;
  }

  const team = createAgentTeam({ apiKey: API_KEY });

  // اختبار التخطيط
  console.log(chalk.cyan('\n  📋 اختبار التخطيط:'));
  try {
    const planResult = await team.plan('اكتب دالة تحسب مضروب رقم');
    if (planResult.success) {
      console.log(chalk.green('  ✅ التخطيط نجح'));
      if (planResult.plan?.steps) {
        console.log(chalk.gray(`     الخطوات: ${planResult.plan.steps.length}`));
      }
    } else {
      console.log(chalk.yellow(`  ⚠️  ${planResult.error}`));
    }
  } catch (e) {
    console.log(chalk.red(`  ❌ خطأ: ${e.message}`));
  }

  // اختبار البناء السريع
  console.log(chalk.cyan('\n  🔨 اختبار البناء السريع:'));
  try {
    const buildResult = await team.build('دالة تجمع رقمين');
    if (buildResult.success) {
      console.log(chalk.green('  ✅ البناء نجح'));
      if (buildResult.code) {
        console.log(chalk.gray(`     الكود: ${buildResult.code.substring(0, 100)}...`));
      }
    } else {
      console.log(chalk.yellow(`  ⚠️  ${buildResult.error}`));
    }
  } catch (e) {
    console.log(chalk.red(`  ❌ خطأ: ${e.message}`));
  }

  return true;
}

// ========================================
// اختبار 4: توليد الكود
// ========================================
async function testCodeGen() {
  console.log(chalk.yellow.bold('\n💻 [4] اختبار توليد الكود'));
  console.log(chalk.gray('━'.repeat(60)));

  if (!API_KEY) {
    console.log(chalk.yellow('  ⚠️  يحتاج API key'));
    return true;
  }

  const gen = new NiaCodeGen({ apiKey: API_KEY });

  // توليد دالة
  console.log(chalk.cyan('\n  📝 توليد دالة:'));
  try {
    const funcResult = await gen.func('دالة تتحقق من صحة البريد الإلكتروني');
    if (funcResult.success) {
      console.log(chalk.green('  ✅ التوليد نجح'));
      const code = funcResult.generated?.code || funcResult.generated?.raw || '';
      if (code) {
        console.log(chalk.gray(`     الكود: ${code.substring(0, 150)}...`));
      }
    } else {
      console.log(chalk.yellow(`  ⚠️  ${funcResult.error}`));
    }
  } catch (e) {
    console.log(chalk.red(`  ❌ خطأ: ${e.message}`));
  }

  // شرح كود
  console.log(chalk.cyan('\n  📖 شرح كود:'));
  try {
    const explainResult = await gen.explain(`
function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}
    `);
    if (explainResult.success) {
      console.log(chalk.green('  ✅ الشرح نجح'));
      const summary = explainResult.explanation?.summary || explainResult.explanation?.raw || '';
      if (summary) {
        console.log(chalk.gray(`     الملخص: ${summary.substring(0, 100)}...`));
      }
    }
  } catch (e) {
    console.log(chalk.red(`  ❌ خطأ: ${e.message}`));
  }

  return true;
}

// ========================================
// اختبار 5: التكامل الكامل
// ========================================
async function testIntegration() {
  console.log(chalk.yellow.bold('\n🔗 [5] اختبار التكامل'));
  console.log(chalk.gray('━'.repeat(60)));

  // اختبار استيراد من index
  try {
    const module = await import('../src/index.js');

    const exports = [
      'NiaFlow', 'flow',
      'NiaAgentTeam', 'createAgentTeam',
      'LocalEngineExtended',
      'NiaCodeGen', 'codegen'
    ];

    console.log(chalk.cyan('\n  التصديرات:'));
    for (const exp of exports) {
      if (module[exp]) {
        console.log(chalk.green(`  ✅ ${exp}`));
      } else {
        console.log(chalk.red(`  ❌ ${exp} غير موجود`));
      }
    }

    return true;
  } catch (e) {
    console.log(chalk.red(`  ❌ خطأ في الاستيراد: ${e.message}`));
    return false;
  }
}

// ========================================
// تشغيل جميع الاختبارات
// ========================================
async function runAll() {
  const startTime = Date.now();
  const results = [];

  try {
    results.push({ name: 'المحرك المحلي', passed: await testLocalExtended() });
    results.push({ name: 'NiaFlow', passed: await testNiaFlow() });
    results.push({ name: 'الوكلاء', passed: await testAgents() });
    results.push({ name: 'توليد الكود', passed: await testCodeGen() });
    results.push({ name: 'التكامل', passed: await testIntegration() });
  } catch (e) {
    console.error(chalk.red(`\n❌ خطأ عام: ${e.message}`));
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  const passed = results.filter(r => r.passed).length;

  console.log(chalk.cyan.bold(`
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   📊 ملخص الاختبارات                                          ║
║   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━               ║
`));

  for (const r of results) {
    const icon = r.passed ? '✅' : '❌';
    console.log(`║   ${icon} ${r.name.padEnd(20)}`);
  }

  console.log(`║                                                               ║
║   النتيجة: ${passed}/${results.length} نجحت                                       ║
║   الوقت: ${duration} ثانية                                          ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
`);

  console.log(chalk.green.bold(`
🎉 NiaScript 3.0 جاهز!

الميزات الجديدة:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🤖 نظام الوكلاء المتخصصين:
   • PlannerAgent - للتخطيط والتحليل
   • BuilderAgent - لكتابة الكود
   • ValidatorAgent - للتدقيق والمراجعة
   • TestAgent - للاختبار
   • OrchestratorAgent - للتنسيق

📊 المحرك المحلي الموسع:
   • التواريخ والوقت
   • تحويل الوحدات (طول، وزن، حرارة، بيانات)
   • الإحصائيات (متوسط، مجموع، أكبر، أصغر)
   • الأرقام المتقدمة (مضروب، جذر، أولي)
   • النصوص والمقارنات

💻 نظام توليد الكود:
   • توليد دوال وكلاسات
   • توليد API endpoints
   • توليد مكونات UI
   • شرح وتحسين الكود
   • توليد اختبارات

🌊 NiaFlow المحسن:
   • سلسلة النوايا (Pipeline)
   • التنفيذ المتوازي
   • الكاش الذكي
   • تتبع التكاليف
`));
}

runAll();
