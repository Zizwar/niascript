// examples/simple-demo.js - أمثلة بسيطة بدون الحاجة لـ API
// للتوضيح فقط - كيف يعمل النظام الجديد

import chalk from 'chalk';

console.log(chalk.cyan.bold('\n🎯 NiaAI - الفلسفة الجديدة\n'));

console.log(chalk.yellow('═'.repeat(60)));
console.log(chalk.white.bold('الفرق بين النظام القديم والجديد'));
console.log(chalk.yellow('═'.repeat(60)));

console.log(chalk.gray('\n📦 النظام القديم (معقد):'));
console.log(chalk.red(`
  1️⃣  Input: "سعر البيتكوين"
  2️⃣  Intent Parser: تحليل النية → domain: finance, action: get_price
  3️⃣  Plugin Selection: البحث عن finance plugin
  4️⃣  Plugin Execution: تشغيل كود محدد مسبقاً
  5️⃣  Output: النتيجة

  ❌ المشاكل:
     - يحتاج plugin لكل مجال
     - قواعد صارمة للتصنيف
     - صعب التوسع
     - ترجمة تقليدية بالبحث في dictionary
`));

console.log(chalk.gray('✨ النظام الجديد (بسيط):'));
console.log(chalk.green(`
  1️⃣  Input: "سعر البيتكوين"
  2️⃣  AI: فهم النية مباشرة + اتخاذ القرار
         ↓
      "يحتاج API call لـ Binance"
         ↓
      استدعاء أداة fetch_data
         ↓
      معالجة النتيجة وإرجاعها
  3️⃣  Output: النتيجة

  ✅ المزايا:
     - لا حاجة لـ plugins مخصصة
     - AI يقرر بذكاء
     - سهل التوسع
     - ترجمة بالـ AI مباشرة (لا dictionary)
`));

console.log(chalk.yellow('═'.repeat(60)));
console.log(chalk.white.bold('الأدوات المتاحة للـ AI'));
console.log(chalk.yellow('═'.repeat(60)));

const tools = [
  {
    name: 'fetch_data',
    description: 'جلب بيانات من APIs',
    example: 'جلب سعر BTC من Binance API'
  },
  {
    name: 'calculate',
    description: 'حسابات رياضية ومالية',
    example: 'حساب فائدة مركبة: 1000 * (1.08)^5'
  },
  {
    name: 'search_web',
    description: 'البحث في الإنترنت',
    example: 'البحث عن أخبار حديثة'
  }
];

tools.forEach(tool => {
  console.log(chalk.cyan(`\n📌 ${tool.name}`));
  console.log(chalk.white(`   ${tool.description}`));
  console.log(chalk.gray(`   مثال: ${tool.example}`));
});

console.log(chalk.yellow('\n' + '═'.repeat(60)));
console.log(chalk.white.bold('أمثلة على سيناريوهات'));
console.log(chalk.yellow('═'.repeat(60)));

const scenarios = [
  {
    input: 'سعر البيتكوين',
    thinking: 'AI يفكر: يحتاج API call → يستخدم fetch_data',
    action: 'fetch("https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT")',
    output: 'BTC: $42,580 USD'
  },
  {
    input: 'احسب 15% من 200',
    thinking: 'AI يفكر: عملية حسابية بسيطة → يستخدم calculate',
    action: 'calculate({ expression: "15% of 200", type: "percentage" })',
    output: '30'
  },
  {
    input: 'ترجم Hello للعربية',
    thinking: 'AI يفكر: ترجمة بسيطة → يجيب مباشرة',
    action: 'مباشرة من المعرفة',
    output: 'مرحبا'
  },
  {
    input: 'استثمار 1000$ بنسبة 8% لمدة 5 سنوات',
    thinking: 'AI يفكر: فائدة مركبة → يستخدم calculate',
    action: 'calculate({ expression: "1000 * (1 + 0.08)^5", type: "compound_interest" })',
    output: '$1,469.33'
  }
];

scenarios.forEach((scenario, index) => {
  console.log(chalk.cyan(`\n${index + 1}. ${scenario.input}`));
  console.log(chalk.yellow(`   💭 ${scenario.thinking}`));
  console.log(chalk.gray(`   🔧 ${scenario.action}`));
  console.log(chalk.green(`   ✅ ${scenario.output}`));
});

console.log(chalk.yellow('\n' + '═'.repeat(60)));
console.log(chalk.white.bold('النماذج المتاحة عبر OpenRouter'));
console.log(chalk.yellow('═'.repeat(60)));

const models = [
  {
    key: 'fast',
    name: 'Claude 3 Haiku',
    cost: '$0.25 / 1M tokens',
    use: 'مهام بسيطة وسريعة'
  },
  {
    key: 'balanced',
    name: 'GPT-4o-mini',
    cost: '$0.15 / 1M tokens',
    use: 'مهام متوسطة'
  },
  {
    key: 'smart',
    name: 'Deepseek Chat',
    cost: '$0.27 / 1M tokens',
    use: 'مهام معقدة وذكية'
  },
  {
    key: 'creative',
    name: 'Claude 3.5 Sonnet',
    cost: '$3 / 1M tokens',
    use: 'مهام إبداعية ومعقدة جداً'
  }
];

models.forEach(model => {
  console.log(chalk.cyan(`\n📊 ${model.name}`));
  console.log(chalk.gray(`   💰 ${model.cost}`));
  console.log(chalk.white(`   🎯 ${model.use}`));
});

console.log(chalk.yellow('\n' + '═'.repeat(60)));
console.log(chalk.white.bold('طريقة الاستخدام'));
console.log(chalk.yellow('═'.repeat(60)));

console.log(chalk.white(`
${chalk.cyan('// 1. استخدام بسيط')}
import { nia } from 'niascript';

const result = await nia\`سعر البيتكوين\`;
console.log(result);

${chalk.cyan('// 2. سؤال مباشر')}
const answer = await nia.ask('ما هو blockchain؟');

${chalk.cyan('// 3. مقارنة models')}
const comparison = await nia.tryModels('شرح AI في جملة', ['fast', 'smart']);

${chalk.cyan('// 4. إعدادات مخصصة')}
nia.config({
  apiKey: 'your-openrouter-key',
  model: 'fast',
  logLevel: 'debug'
});
`));

console.log(chalk.yellow('═'.repeat(60)));
console.log(chalk.white.bold('الخلاصة'));
console.log(chalk.yellow('═'.repeat(60)));

console.log(chalk.green(`
✅ النظام الجديد:
   • أبسط - لا plugins معقدة
   • أذكى - AI يقرر بنفسه
   • أرخص - استخدام models مناسبة
   • أسرع - استجابات مباشرة
   • قابل للتوسع - من ذرة إلى شجرة

💡 الفلسفة:
   "النية هي كل شيء - AI يفهم ويقرر"

🚀 البداية:
   بذرة صغيرة (أمثلة بسيطة) → تنمو مع الوقت

🎯 الهدف:
   برمجة بالنية - لا بالقواعد
`));

console.log(chalk.yellow('═'.repeat(60)));
console.log(chalk.green.bold('\n✨ هذه هي الثورة!\n'));
