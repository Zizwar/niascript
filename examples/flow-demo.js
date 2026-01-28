#!/usr/bin/env node
// examples/flow-demo.js - اختبار NiaScript Flow 2.0
// نظام التدفق الذكي الثوري!

import { NiaFlow, flow } from '../src/core/nia-flow.js';
import chalk from 'chalk';

// ========================================
// إعداد المفتاح
// ========================================
const API_KEY = process.env.OPENROUTER_API_KEY || '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';

console.log(chalk.cyan.bold(`
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   🌊 NiaScript Flow 2.0 - نظام التدفق الذكي                  ║
║   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━               ║
║   البرمجة بالنوايا المتسلسلة | Chainable Intents             ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
`));

// ========================================
// تهيئة المحرك
// ========================================
const nia = new NiaFlow({
  apiKey: API_KEY,
  model: 'openai/gpt-4.1-mini' // أرخص موديل
});

// ========================================
// اختبار 1: الحسابات المحلية (بدون API)
// ========================================
async function testLocal() {
  console.log(chalk.yellow.bold('\n📊 [1] اختبار الحسابات المحلية (بدون API - مجاني!)'));
  console.log(chalk.gray('━'.repeat(60)));

  const tests = [
    { name: 'عملية رياضية', input: '100 + 50 * 2' },
    { name: 'قوة أسية', input: '2^10' },
    { name: 'نسبة مئوية', input: '15% من 200' },
    { name: 'خصم', input: 'خصم 30% من 1000' },
    { name: 'فائدة مركبة', input: '1000$ @ 8% لمدة 5 سنوات' },
    { name: 'تحويل عملة', input: '100 دولار للريال' },
    { name: 'ROI', input: 'استثمار 10000 ربح 15000' }
  ];

  for (const test of tests) {
    const result = nia.calc(test.input);
    if (result && result.success) {
      console.log(chalk.green(`  ✅ ${test.name}`));
      console.log(chalk.white(`     المدخل: ${test.input}`));
      console.log(chalk.cyan(`     النتيجة: ${result.result}`));
      if (result.details) {
        console.log(chalk.gray(`     التفاصيل: ${JSON.stringify(result.details)}`));
      }
    } else {
      console.log(chalk.yellow(`  ⚠️  ${test.name}: يحتاج AI`));
    }
    console.log();
  }

  return true;
}

// ========================================
// اختبار 2: Pipeline (سلسلة نوايا)
// ========================================
async function testPipeline() {
  console.log(chalk.yellow.bold('\n🔗 [2] اختبار Pipeline - سلسلة نوايا متصلة'));
  console.log(chalk.gray('━'.repeat(60)));

  console.log(chalk.cyan('\n  📌 سيناريو: حساب استثمار متعدد الخطوات'));
  console.log(chalk.gray('     1000$ → فائدة 10% لـ 3 سنوات → خصم 15% → النتيجة النهائية'));

  // طريقة 1: محلية (سريعة ومجانية)
  console.log(chalk.white('\n  [طريقة محلية - مجانية]:'));

  const step1 = nia.calc('1000$ @ 10% لمدة 3 سنوات');
  console.log(chalk.green(`     الخطوة 1: ${step1.result} (${step1.details.growthMultiple})`));

  const afterInterest = step1.raw;
  const step2 = nia.calc(`خصم 15% من ${afterInterest.toFixed(0)}`);
  console.log(chalk.green(`     الخطوة 2: ${step2.result}`));

  return true;
}

// ========================================
// اختبار 3: AI (مع OpenRouter)
// ========================================
async function testAI() {
  console.log(chalk.yellow.bold('\n🤖 [3] اختبار AI مع OpenRouter'));
  console.log(chalk.gray('━'.repeat(60)));

  const questions = [
    'ما هي عاصمة فرنسا؟',
    'ترجم "Hello World" للعربية',
    'ما هو 2+2؟'
  ];

  for (const q of questions) {
    console.log(chalk.cyan(`\n  📌 السؤال: ${q}`));
    try {
      const result = await nia.ask(q, { model: 'openai/gpt-4.1-mini' });
      if (result.success) {
        console.log(chalk.green(`     ✅ الإجابة: ${result.result}`));
        console.log(chalk.gray(`     التكلفة: $${result.cost?.toFixed(6) || '0.000001'}`));
      } else {
        console.log(chalk.red(`     ❌ خطأ: ${result.error}`));
      }
    } catch (error) {
      console.log(chalk.red(`     ❌ خطأ: ${error.message}`));
    }
  }

  return true;
}

// ========================================
// اختبار 4: التوازي (Parallel)
// ========================================
async function testParallel() {
  console.log(chalk.yellow.bold('\n⚡ [4] اختبار التنفيذ المتوازي'));
  console.log(chalk.gray('━'.repeat(60)));

  console.log(chalk.cyan('\n  📌 تنفيذ 3 حسابات محلية بالتوازي:'));

  const startTime = Date.now();

  const results = await nia.parallel(
    nia.calc('1000$ @ 5% لمدة 10 سنوات'),
    nia.calc('2000$ @ 8% لمدة 5 سنوات'),
    nia.calc('500$ @ 12% لمدة 3 سنوات')
  );

  const duration = Date.now() - startTime;

  results.forEach((r, i) => {
    if (r && r.success) {
      console.log(chalk.green(`     النتيجة ${i + 1}: ${r.result}`));
    }
  });

  console.log(chalk.gray(`     الوقت: ${duration}ms`));

  return true;
}

// ========================================
// اختبار 5: الكاش الذكي
// ========================================
async function testCache() {
  console.log(chalk.yellow.bold('\n💾 [5] اختبار الكاش الذكي'));
  console.log(chalk.gray('━'.repeat(60)));

  const intent = '1000$ @ 8% لمدة 5 سنوات';

  console.log(chalk.cyan(`\n  📌 تنفيذ نفس النية 3 مرات:`));

  for (let i = 1; i <= 3; i++) {
    const startTime = Date.now();
    const result = await nia.process(intent);
    const duration = Date.now() - startTime;

    console.log(chalk.green(`     المرة ${i}: ${result.result} (${duration}ms) ${result.fromCache ? '📦 من الكاش!' : ''}`));
  }

  return true;
}

// ========================================
// اختبار 6: الإحصائيات
// ========================================
function showStats() {
  console.log(chalk.yellow.bold('\n📈 [6] إحصائيات الجلسة'));
  console.log(chalk.gray('━'.repeat(60)));

  const stats = nia.getStats();

  console.log(chalk.white(`
  📊 الإحصائيات:
     ────────────────────────────────
     إجمالي الطلبات:    ${stats.totalRequests}
     نجحت محلياً:       ${stats.localHits} 🏠
     من الكاش:          ${stats.cacheHits} 📦
     استدعاءات API:     ${stats.apiCalls} 🌐
     ────────────────────────────────
     الكفاءة:           ${stats.efficiency}
     التكلفة الكلية:    $${stats.totalCost.toFixed(6)}
     التوفير التقديري:  $${stats.savedCost.toFixed(6)}
  `));
}

// ========================================
// اختبار 7: Template Literals (الطريقة السهلة)
// ========================================
async function testTemplateLiterals() {
  console.log(chalk.yellow.bold('\n✨ [7] اختبار Template Literals - الطريقة السهلة'));
  console.log(chalk.gray('━'.repeat(60)));

  // تهيئة flow مع المفتاح
  flow.config({ apiKey: API_KEY });

  console.log(chalk.cyan('\n  📌 استخدام flow`` مباشرة:'));

  // حساب محلي
  const calc = flow.calc('50% من 200');
  console.log(chalk.green(`     flow.calc('50% من 200') = ${calc.result}`));

  // إحصائيات
  const flowStats = flow.stats();
  console.log(chalk.gray(`     إحصائيات flow: ${flowStats.efficiency} كفاءة`));

  return true;
}

// ========================================
// اختبار 8: مقارنة الموديلات
// ========================================
async function testModels() {
  console.log(chalk.yellow.bold('\n🎯 [8] اختبار موديلات مختلفة'));
  console.log(chalk.gray('━'.repeat(60)));

  const models = [
    { key: 'micro', name: 'GPT-4.1-mini', id: 'openai/gpt-4.1-mini' },
    { key: 'fast', name: 'Claude-3-Haiku', id: 'anthropic/claude-3-haiku' }
  ];

  const question = 'ما هو 5 + 3؟';

  for (const model of models) {
    console.log(chalk.cyan(`\n  📌 الموديل: ${model.name}`));
    try {
      const startTime = Date.now();
      const result = await nia.ask(question, { model: model.id });
      const duration = Date.now() - startTime;

      if (result.success) {
        console.log(chalk.green(`     ✅ الإجابة: ${result.result}`));
        console.log(chalk.gray(`     الوقت: ${duration}ms | التكلفة: $${result.cost?.toFixed(6) || '~0'}`));
      } else {
        console.log(chalk.yellow(`     ⚠️  ${result.error}`));
      }
    } catch (error) {
      console.log(chalk.red(`     ❌ ${error.message}`));
    }
  }

  return true;
}

// ========================================
// تشغيل جميع الاختبارات
// ========================================
async function runAllTests() {
  const startTime = Date.now();

  try {
    // اختبارات محلية (مجانية)
    await testLocal();
    await testPipeline();
    await testParallel();
    await testCache();
    await testTemplateLiterals();

    // اختبارات AI
    console.log(chalk.magenta.bold('\n🌐 بدء اختبارات AI (تحتاج إنترنت)...'));
    await testAI();
    await testModels();

    // الإحصائيات النهائية
    showStats();

    const totalDuration = Date.now() - startTime;

    console.log(chalk.green.bold(`
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   ✅ جميع الاختبارات اكتملت بنجاح!                           ║
║   الوقت الكلي: ${(totalDuration / 1000).toFixed(2)} ثانية                                 ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
`));

    console.log(chalk.cyan(`
💡 ملخص NiaScript Flow 2.0:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🏠 المحلي أولاً (Local-First):
   • الحسابات تعمل بدون API = مجاني 100%
   • الفائدة المركبة، النسب، ROI، تحويل العملات

🔗 سلسلة النوايا (Pipeline):
   • ربط نوايا متعددة بـ .pipe\`\`
   • تجميع ذكي يوفر 66% من التكلفة

⚡ التوازي (Parallel):
   • تنفيذ متعدد في وقت واحد
   • nia.parallel(intent1, intent2, intent3)

💾 الكاش الذكي (Smart Cache):
   • تخزين النتائج لدقيقة
   • تقليل استدعاءات API

📊 تتبع التكلفة:
   • إحصائيات مفصلة لكل جلسة
   • معرفة الكفاءة والتوفير
`));

  } catch (error) {
    console.error(chalk.red('\n❌ خطأ في الاختبارات:'), error.message);
    console.error(error.stack);
  }
}

// تشغيل
runAllTests();
