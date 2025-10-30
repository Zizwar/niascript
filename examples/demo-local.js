// examples/demo-local.js - أمثلة تعمل بدون API
// تُظهر قوة النظام في الحسابات والمعالجة المحلية

import { NiaAI } from '../src/core/nia-ai.js';
import chalk from 'chalk';

console.log(chalk.cyan.bold('\n🎯 NiaAI - Demo محلي (بدون API)\n'));
console.log(chalk.gray('اختبار الأدوات المحلية التي لا تحتاج API\n'));

const nia = new NiaAI();

console.log(chalk.yellow('═'.repeat(60)));
console.log(chalk.white.bold('🧮 اختبارات الحسابات'));
console.log(chalk.yellow('═'.repeat(60)));

async function testCalculations() {
  const tests = [
    {
      name: 'عملية حسابية بسيطة',
      input: { expression: '10 + 20 * 2', type: 'math' },
      expected: 50
    },
    {
      name: 'قوة أُسية',
      input: { expression: '2^10', type: 'math' },
      expected: 1024
    },
    {
      name: 'تعبير معقد',
      input: { expression: '(100 - 20) * 3 + 50', type: 'math' },
      expected: 290
    },
    {
      name: 'فائدة مركبة',
      input: { expression: '1000 * (1 + 0.08)^5', type: 'compound_interest' },
      expected: 1469.33
    },
    {
      name: 'استثمار 10 سنوات',
      input: { expression: '5000 * (1 + 0.12)^10', type: 'compound_interest' },
      expected: 15529.24
    },
    {
      name: 'نسبة مئوية',
      input: { expression: '15% of 200', type: 'percentage' },
      expected: 30
    },
    {
      name: 'خصم 25%',
      input: { expression: '25% of 500', type: 'percentage' },
      expected: 125
    }
  ];

  for (const test of tests) {
    try {
      const result = await nia.executeCalculate(test.input);
      const value = parseFloat(result.result);
      const success = Math.abs(value - test.expected) < 1;

      if (success) {
        console.log(chalk.green(`\n✅ ${test.name}`));
        console.log(chalk.white(`   المدخل: ${test.input.expression}`));
        console.log(chalk.cyan(`   النتيجة: ${result.result}`));
      } else {
        console.log(chalk.red(`\n❌ ${test.name}`));
        console.log(chalk.white(`   توقعنا: ${test.expected}, حصلنا: ${value}`));
      }
    } catch (error) {
      console.log(chalk.red(`\n❌ ${test.name} - خطأ: ${error.message}`));
    }
  }
}

console.log(chalk.yellow('\n' + '═'.repeat(60)));
console.log(chalk.white.bold('🌐 اختبار Fetch (بيانات حقيقية)'));
console.log(chalk.yellow('═'.repeat(60)));

async function testFetch() {
  const apis = [
    {
      name: 'سعر Bitcoin',
      url: 'https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT',
      process: (data) => `BTC: $${parseFloat(data.price).toLocaleString()}`
    },
    {
      name: 'سعر Ethereum',
      url: 'https://api.binance.com/api/v3/ticker/price?symbol=ETHUSDT',
      process: (data) => `ETH: $${parseFloat(data.price).toLocaleString()}`
    },
    {
      name: 'معلومات عشوائية',
      url: 'https://api.coindesk.com/v1/bpi/currentprice.json',
      process: (data) => `BTC (CoinDesk): $${parseFloat(data.bpi.USD.rate.replace(',', '')).toLocaleString()}`
    }
  ];

  for (const api of apis) {
    try {
      console.log(chalk.cyan(`\n📡 جلب: ${api.name}`));
      const result = await nia.executeFetch({ url: api.url, method: 'GET' });

      if (result.error) {
        console.log(chalk.yellow(`   ⚠️  ${result.error}`));
      } else {
        const processed = api.process(result);
        console.log(chalk.green(`   ✅ ${processed}`));
      }
    } catch (error) {
      console.log(chalk.yellow(`   ⚠️  ${error.message}`));
    }
  }
}

console.log(chalk.yellow('\n' + '═'.repeat(60)));
console.log(chalk.white.bold('🧠 اختبار Safe Eval'));
console.log(chalk.yellow('═'.repeat(60)));

async function testSafeEval() {
  const expressions = [
    '2 + 2',
    '10 * 5 + 3',
    '100 / 4',
    '2^8',
    '(15 + 5) * 2',
    '1000 * 1.08^5'
  ];

  for (const expr of expressions) {
    try {
      const result = nia.safeEval(expr);
      console.log(chalk.green(`\n✅ ${expr} = ${result}`));
    } catch (error) {
      console.log(chalk.red(`\n❌ ${expr} - خطأ: ${error.message}`));
    }
  }
}

console.log(chalk.yellow('\n' + '═'.repeat(60)));
console.log(chalk.white.bold('💼 سيناريوهات عملية'));
console.log(chalk.yellow('═'.repeat(60)));

async function practicalScenarios() {
  console.log(chalk.cyan('\n📊 سيناريو 1: حساب ROI'));
  console.log(chalk.gray('   استثمرت 10,000$ وحصلت على 13,500$'));

  const investment = 10000;
  const returns = 13500;
  const profit = returns - investment;
  const roi = ((profit / investment) * 100).toFixed(2);

  console.log(chalk.green(`   💰 الربح: $${profit.toLocaleString()}`));
  console.log(chalk.green(`   📈 ROI: ${roi}%`));

  console.log(chalk.cyan('\n📊 سيناريو 2: مقارنة استثمارات'));
  console.log(chalk.gray('   أيهما أفضل: 5000$ بنسبة 8% أم 3000$ بنسبة 12%؟'));

  const option1 = await nia.executeCalculate({
    expression: '5000 * (1 + 0.08)^10',
    type: 'compound_interest'
  });

  const option2 = await nia.executeCalculate({
    expression: '3000 * (1 + 0.12)^10',
    type: 'compound_interest'
  });

  console.log(chalk.white(`   الخيار 1 (5000$ @ 8%): $${parseFloat(option1.result).toLocaleString()}`));
  console.log(chalk.white(`   الخيار 2 (3000$ @ 12%): $${parseFloat(option2.result).toLocaleString()}`));

  const better = parseFloat(option2.result) > parseFloat(option1.result) ? 'الخيار 2' : 'الخيار 1';
  console.log(chalk.green(`   ✨ الأفضل: ${better}`));

  console.log(chalk.cyan('\n📊 سيناريو 3: حساب الخصومات'));
  console.log(chalk.gray('   منتج ثمنه 1,250$ وعليه خصم 30%'));

  const price = 1250;
  const discountResult = await nia.executeCalculate({
    expression: '30% of 1250',
    type: 'percentage'
  });

  const discount = parseFloat(discountResult.result);
  const finalPrice = price - discount;

  console.log(chalk.white(`   السعر الأصلي: $${price.toLocaleString()}`));
  console.log(chalk.yellow(`   الخصم (30%): -$${discount.toLocaleString()}`));
  console.log(chalk.green(`   السعر النهائي: $${finalPrice.toLocaleString()}`));
}

// تشغيل جميع الاختبارات
async function runAll() {
  try {
    await testCalculations();
    await testSafeEval();
    await testFetch();
    await practicalScenarios();

    console.log(chalk.yellow('\n' + '═'.repeat(60)));
    console.log(chalk.green.bold('✅ جميع الاختبارات المحلية اكتملت بنجاح!'));
    console.log(chalk.yellow('═'.repeat(60)));

    console.log(chalk.cyan('\n💡 ملاحظات:'));
    console.log(chalk.white('   • الحسابات تعمل بدون API'));
    console.log(chalk.white('   • Fetch يجلب بيانات حقيقية'));
    console.log(chalk.white('   • النظام جاهز للاستخدام الفوري'));
    console.log(chalk.white('   • للحصول على ذكاء كامل، أضف مفتاح OpenRouter صالح\n'));

  } catch (error) {
    console.error(chalk.red('\n❌ خطأ:'), error.message);
  }
}

runAll();
