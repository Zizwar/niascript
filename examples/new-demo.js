// examples/new-demo.js - مثال الاستخدام الجديد
import { nia, NiaEngine } from '../src/core/nia-engine.js';

async function demonstrateNewNiaScript() {
  console.log('🎯 NiaScript v2.0 - Clean Architecture Demo\n');

  // 1. الاستخدام البسيط - Template Literal
  console.log('📱 Simple Usage:');
  console.log('─'.repeat(50));
  
  try {
    // أسعار الكريبتو المختلفة
    console.log('Testing crypto prices...');
    let result = await nia`Bitcoin price`;
    console.log('✓', result);

    result = await nia`سعر الإيثيريوم`; // يدعم العربية
    console.log('✓', result);

    result = await nia`What's DOGE worth?`;
    console.log('✓', result);

    result = await nia`Polygon price`; // عملة لم تكن مدعومة من قبل
    console.log('✓', result);

    // عملة جديدة تماماً - سيستخدم AI لفهمها
    result = await nia`Chainlink LINK price`;
    console.log('✓', result);

    // حسابات مالية
    result = await nia`$5000 at 7% for 10 years`;
    console.log('✓', result);

    // خدمات أخرى (plugins)
    result = await nia`Translate "Hello World" to Arabic`;
    console.log('✓', result);

    result = await nia`Weather in Cairo`;
    console.log('✓', result);

  } catch (error) {
    console.error('❌ Simple demo error:', error.message);
  }

  console.log('\n' + '─'.repeat(50));

  // 2. الاستخدام المتقدم - NiaEngine المباشر
  console.log('🔧 Advanced Usage:');
  console.log('─'.repeat(50));

  const engine = new NiaEngine({
    logLevel: 'info', // debug, info, warn, error
    showCost: true,
    showTiming: true
  });

  try {
    // إضافة plugin مخصص
    class CustomMathPlugin {
      constructor() {
        this.domain = 'math';
        this.capabilities = ['calculate', 'solve'];
      }

      async execute(intent, context) {
        const { target } = intent.entities;
        
        // استخدام AI لحل المسائل الرياضية
        const prompt = `Solve this math problem: "${target}". Give a clear answer.`;
        
        const response = await context.openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.1,
          max_tokens: 200
        });

        const cost = context.costTracker.calculateOpenAICost(response);
        context.costTracker.addCost(cost);

        return {
          success: true,
          data: response.choices[0].message.content.trim(),
          cost: cost
        };
      }
    }

    // تسجيل plugin جديد
    engine.addPlugin('math', new CustomMathPlugin());
    console.log('✓ Custom math plugin added');

    // اختبار plugin المخصص
    const mathResult = await engine.processIntent('What is 25% of 480?');
    console.log('✓ Math result:', mathResult.data);

    // إحصائيات الاستخدام
    const stats = engine.getStats();
    console.log('\n📊 Usage Statistics:');
    console.log(`• Total requests: ${stats.totalRequests}`);
    console.log(`• Total cost: $${stats.totalCost.toFixed(4)}`);
    console.log(`• Average response time: ${stats.averageResponseTime}ms`);
    console.log(`• Top domains:`, Object.keys(stats.topDomains).slice(0, 3));

  } catch (error) {
    console.error('❌ Advanced demo error:', error.message);
  }

  console.log('\n' + '─'.repeat(50));

  // 3. اختبار الذكاء - فهم نوايا معقدة
  console.log('🧠 Intelligence Test:');
  console.log('─'.repeat(50));

  const intelligenceTests = [
    'كم سعر عملة البيتكوين اليوم؟', // عربي
    'Give me Ethereum price', // إنجليزي
    'MATIC price now', // رمز مختصر
    'What is SOL trading at?', // تعبير مختلف
    'Compare BTC and ETH', // مقارنة
    'I want to invest $2000 at 6% annually for 8 years', // حساب معقد
    'How much is Cardano worth?', // اسم كامل
    'Show me DOGE value', // تعبير آخر
    'What\'s the price of Polkadot?', // سؤال طبيعي
  ];

  for (const test of intelligenceTests) {
    try {
      console.log(`\n🔍 Testing: "${test}"`);
      const result = await nia`${test}`;
      console.log(`   💡 Result: ${result}`);
    } catch (error) {
      console.log(`   ❌ Failed: ${error.message}`);
    }
  }

  // 4. إحصائيات نهائية مع التكلفة
  console.log('\n' + '═'.repeat(60));
  console.log('📈 Final Statistics:');
  console.log('═'.repeat(60));
  
  const finalStats = nia.stats();
  if (finalStats) {
    console.log(`💰 Total Cost: $${finalStats.totalCost.toFixed(6)}`);
    console.log(`⏱️  Average Response: ${finalStats.averageResponseTime}ms`);
    console.log(`📊 Total Requests: ${finalStats.totalRequests}`);
    console.log(`🎯 Most Used: ${Object.keys(finalStats.topDomains)[0] || 'N/A'}`);
    
    if (finalStats.totalCost > 0.01) {
      console.log(`⚠️  High cost detected! Consider optimizing usage.`);
    }
  }

  console.log('\n🎉 Demo completed successfully!');
}

// تشغيل العرض التوضيحي
if (import.meta.url === `file://${process.argv[1]}`) {
  demonstrateNewNiaScript().catch(console.error);
}

export { demonstrateNewNiaScript };

