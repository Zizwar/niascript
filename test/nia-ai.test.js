// test/nia-ai.test.js - اختبارات بسيطة للنظام الجديد
import { NiaAI } from '../src/core/nia-ai.js';
import { strict as assert } from 'assert';

console.log('🧪 اختبارات NiaAI\n');

// ══════════════════════════════════════
// اختبار الأدوات بدون API
// ══════════════════════════════════════

async function testCalculate() {
  console.log('📝 اختبار: Calculate Tool');

  const ai = new NiaAI();

  // Test 1: Math expression
  const result1 = await ai.executeCalculate({
    expression: '10 + 20 * 2',
    type: 'math'
  });
  assert.equal(result1.result, 50, 'Math calculation failed');
  console.log('  ✓ Math: 10 + 20 * 2 = ' + result1.result);

  // Test 2: Compound interest
  const result2 = await ai.executeCalculate({
    expression: '1000 * (1 + 0.08)^5',
    type: 'compound_interest'
  });
  assert.ok(Math.abs(result2.result - 1469.33) < 1, 'Compound interest failed');
  console.log('  ✓ Compound Interest: 1000 * (1.08)^5 = ' + result2.result);

  // Test 3: Percentage
  const result3 = await ai.executeCalculate({
    expression: '15% of 200',
    type: 'percentage'
  });
  assert.equal(result3.result, '30.00', 'Percentage calculation failed');
  console.log('  ✓ Percentage: 15% of 200 = ' + result3.result);

  console.log('  ✅ جميع اختبارات Calculate نجحت\n');
}

async function testFetch() {
  console.log('📝 اختبار: Fetch Tool');

  const ai = new NiaAI();

  // Test: Fetch public API
  try {
    const result = await ai.executeFetch({
      url: 'https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT',
      method: 'GET'
    });

    if (result.error) {
      console.log('  ⚠️  Fetch test skipped (network issue):', result.error, '\n');
    } else {
      assert.ok(result.symbol === 'BTCUSDT', 'Fetch failed to get BTC price');
      assert.ok(result.price, 'Price not returned');
      console.log(`  ✓ Fetched BTC price: $${parseFloat(result.price).toLocaleString()}`);
      console.log('  ✅ Fetch test نجح\n');
    }
  } catch (error) {
    console.log('  ⚠️  Fetch test skipped (error):', error.message, '\n');
  }
}

async function testSafeEval() {
  console.log('📝 اختبار: Safe Eval');

  const ai = new NiaAI();

  // Test 1: Simple math
  const r1 = ai.safeEval('2 + 2');
  assert.equal(r1, 4, 'Simple addition failed');
  console.log('  ✓ Safe eval: 2 + 2 = ' + r1);

  // Test 2: Complex expression
  const r2 = ai.safeEval('(10 + 5) * 2 - 8');
  assert.equal(r2, 22, 'Complex expression failed');
  console.log('  ✓ Safe eval: (10 + 5) * 2 - 8 = ' + r2);

  // Test 3: Power
  const r3 = ai.safeEval('2 ^ 3');
  assert.equal(r3, 8, 'Power operation failed');
  console.log('  ✓ Safe eval: 2 ^ 3 = ' + r3);

  console.log('  ✅ Safe Eval tests نجحت\n');
}

async function testConversationContext() {
  console.log('📝 اختبار: Conversation Context');

  const ai = new NiaAI();

  // إضافة إلى السياق
  ai.conversationContext.push({
    intent: 'اسمي أحمد',
    result: 'تشرفنا، أحمد!',
    timestamp: Date.now(),
    model: 'test'
  });

  ai.conversationContext.push({
    intent: 'عمري 25',
    result: 'جميل',
    timestamp: Date.now(),
    model: 'test'
  });

  // التحقق من السياق
  assert.equal(ai.conversationContext.length, 2, 'Context not saved');
  console.log('  ✓ Context saved: ' + ai.conversationContext.length + ' items');

  // بناء الرسائل مع السياق
  const messages = ai.buildMessages('ما اسمي؟');
  const contextMessage = messages.find(m => m.content.includes('السياق'));

  assert.ok(contextMessage, 'Context not included in messages');
  assert.ok(contextMessage.content.includes('أحمد'), 'Name not in context');
  console.log('  ✓ Context included in messages');

  console.log('  ✅ Conversation Context test نجح\n');
}

async function testModelSelection() {
  console.log('📝 اختبار: Model Selection');

  const ai = new NiaAI();

  // التحقق من Models المتاحة
  assert.ok(ai.models.fast, 'Fast model not defined');
  assert.ok(ai.models.balanced, 'Balanced model not defined');
  assert.ok(ai.models.smart, 'Smart model not defined');
  assert.ok(ai.models.creative, 'Creative model not defined');

  console.log('  ✓ Fast:', ai.models.fast);
  console.log('  ✓ Balanced:', ai.models.balanced);
  console.log('  ✓ Smart:', ai.models.smart);
  console.log('  ✓ Creative:', ai.models.creative);

  console.log('  ✅ جميع Models متوفرة\n');
}

async function testTools() {
  console.log('📝 اختبار: Available Tools');

  const ai = new NiaAI();

  // التحقق من الأدوات
  assert.ok(Array.isArray(ai.tools), 'Tools not an array');
  assert.ok(ai.tools.length >= 3, 'Not enough tools');

  const toolNames = ai.tools.map(t => t.function.name);
  assert.ok(toolNames.includes('fetch_data'), 'fetch_data not available');
  assert.ok(toolNames.includes('calculate'), 'calculate not available');
  assert.ok(toolNames.includes('search_web'), 'search_web not available');

  console.log('  ✓ Available tools:', toolNames.join(', '));
  console.log('  ✅ جميع الأدوات متوفرة\n');
}

// ══════════════════════════════════════
// تشغيل الاختبارات
// ══════════════════════════════════════

async function runAllTests() {
  console.log('════════════════════════════════════════\n');

  try {
    await testCalculate();
    await testSafeEval();
    await testConversationContext();
    await testModelSelection();
    await testTools();
    await testFetch(); // آخر لأنه قد يفشل بسبب الشبكة

    console.log('════════════════════════════════════════');
    console.log('✅ جميع الاختبارات نجحت!');
    console.log('════════════════════════════════════════\n');

    process.exit(0);

  } catch (error) {
    console.log('════════════════════════════════════════');
    console.error('❌ فشل الاختبار:', error.message);
    console.error(error.stack);
    console.log('════════════════════════════════════════\n');

    process.exit(1);
  }
}

runAllTests();
