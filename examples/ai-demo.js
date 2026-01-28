// examples/ai-demo.js - اختبار النظام الجديد
import { nia, NiaAI } from '../src/core/nia-ai.js';
import chalk from 'chalk';

console.log(chalk.cyan.bold('\n🚀 NiaAI - النظام الجديد المبسط\n'));
console.log(chalk.gray('الاعتماد على AI بالكامل - لا plugins تقليدية\n'));

async function runExamples() {
  try {
    // ═══════════════════════════════════════
    // 📝 مثال 1: سؤال بسيط
    // ═══════════════════════════════════════
    console.log(chalk.yellow.bold('📝 مثال 1: سؤال بسيط'));
    console.log(chalk.gray('───────────────────────────────────'));

    const answer1 = await nia`ما هو الذكاء الاصطناعي؟`;
    console.log(chalk.green('✓ النتيجة:'), answer1);
    console.log();

    // ═══════════════════════════════════════
    // 💰 مثال 2: سعر البيتكوين (مع API call)
    // ═══════════════════════════════════════
    console.log(chalk.yellow.bold('💰 مثال 2: سعر البيتكوين'));
    console.log(chalk.gray('───────────────────────────────────'));

    const btcPrice = await nia`احصل على سعر البيتكوين الحالي`;
    console.log(chalk.green('✓ النتيجة:'), btcPrice);
    console.log();

    // ═══════════════════════════════════════
    // 🧮 مثال 3: حساب مركب
    // ═══════════════════════════════════════
    console.log(chalk.yellow.bold('🧮 مثال 3: حساب مركب'));
    console.log(chalk.gray('───────────────────────────────────'));

    const investment = await nia`إذا استثمرت 1000 دولار بنسبة 8% سنوياً لمدة 5 سنوات، كم سأحصل؟`;
    console.log(chalk.green('✓ النتيجة:'), investment);
    console.log();

    // ═══════════════════════════════════════
    // 🌐 مثال 4: ترجمة (AI مباشر)
    // ═══════════════════════════════════════
    console.log(chalk.yellow.bold('🌐 مثال 4: ترجمة'));
    console.log(chalk.gray('───────────────────────────────────'));

    const translation = await nia`ترجم "Hello, how are you?" للعربية`;
    console.log(chalk.green('✓ النتيجة:'), translation);
    console.log();

    // ═══════════════════════════════════════
    // 🔬 مثال 5: مقارنة Models
    // ═══════════════════════════════════════
    console.log(chalk.yellow.bold('🔬 مثال 5: مقارنة Models'));
    console.log(chalk.gray('───────────────────────────────────'));

    const question = "اشرح blockchain في جملة واحدة";
    const comparison = await nia.tryModels(question, ['fast', 'balanced', 'smart']);

    comparison.forEach(result => {
      if (result.success) {
        console.log(chalk.cyan(`\n${result.model}:`), chalk.white(result.data));
        console.log(chalk.gray(`⏱️  ${result.duration}ms`));
      } else {
        console.log(chalk.red(`\n${result.model}: Error - ${result.error}`));
      }
    });
    console.log();

    // ═══════════════════════════════════════
    // 🎯 مثال 6: سياق المحادثة
    // ═══════════════════════════════════════
    console.log(chalk.yellow.bold('🎯 مثال 6: سياق المحادثة'));
    console.log(chalk.gray('───────────────────────────────────'));

    const response1 = await nia`اسمي أحمد`;
    console.log(chalk.green('✓'), response1);

    const response2 = await nia`ما اسمي؟`;
    console.log(chalk.green('✓'), response2);
    console.log();

    // ═══════════════════════════════════════
    // 📊 إحصائيات
    // ═══════════════════════════════════════
    console.log(chalk.yellow.bold('📊 إحصائيات'));
    console.log(chalk.gray('───────────────────────────────────'));
    console.log(chalk.green('✓ جميع الأمثلة نجحت'));
    console.log(chalk.cyan('💡 النظام يعتمد بالكامل على AI'));
    console.log(chalk.cyan('💡 لا حاجة لـ plugins تقليدية'));
    console.log(chalk.cyan('💡 دعم models متعددة عبر OpenRouter'));

  } catch (error) {
    console.error(chalk.red('\n❌ خطأ:'), error.message);
    console.error(chalk.gray(error.stack));
  }
}

// ═══════════════════════════════════════
// 🧪 اختبار مع models مختلفة
// ═══════════════════════════════════════
async function testModels() {
  console.log(chalk.cyan.bold('\n\n🧪 اختبار Models المختلفة\n'));

  const models = [
    { key: 'fast', name: 'Claude 3 Haiku (سريع ورخيص)' },
    { key: 'balanced', name: 'GPT-4o-mini (متوازن)' },
    { key: 'smart', name: 'Deepseek Chat (ذكي)' }
  ];

  const testQuery = "احسب 15% من 200";

  for (const model of models) {
    try {
      console.log(chalk.yellow(`\n${model.name}:`));

      const engine = new NiaAI({ model: model.key });
      const startTime = Date.now();
      const result = await engine.process(testQuery);
      const duration = Date.now() - startTime;

      console.log(chalk.green('✓ النتيجة:'), result.data);
      console.log(chalk.gray(`⏱️  ${duration}ms`));

    } catch (error) {
      console.log(chalk.red('✗ فشل:'), error.message);
    }
  }
}

// تشغيل الأمثلة
console.log(chalk.magenta('═'.repeat(50)));
runExamples()
  .then(() => testModels())
  .then(() => {
    console.log(chalk.magenta('\n' + '═'.repeat(50)));
    console.log(chalk.green.bold('\n✅ اكتملت جميع الاختبارات\n'));
  })
  .catch(error => {
    console.error(chalk.red('\n❌ خطأ عام:'), error);
    process.exit(1);
  });
