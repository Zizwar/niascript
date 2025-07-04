// examples/enhanced-demo.js - أمثلة الاستخدام المحسن
import { nia, NiaEngine } from '../src/core/nia-engine.js';

async function demonstrateEnhancedFeatures() {
  console.log('🎯 NiaScript v2.0 - Enhanced with General AI\n');

  // 1. الاستخدام العادي - مع Fallback للذكاء العام
  console.log('📱 Regular Usage with AI Fallback:');
  console.log('─'.repeat(60));
  
  try {
    // حالات مدعومة بـ Plugins
    console.log('✅ Supported by plugins:');
    let result = await nia`Bitcoin price`;
    console.log('  📊', result);

    result = await nia`$5000 at 8% for 10 years`;
    console.log('  💰', result);

    // حالات غير مدعومة - ستذهب للذكاء العام تلقائياً
    console.log('\n🧠 Auto-fallback to General AI:');
    
    result = await nia`What is the capital of Morocco?`;
    console.log('  🌍', result);

    result = await nia`How to make coffee?`;
    console.log('  ☕', result);

    result = await nia`What is machine learning?`;
    console.log('  🤖', result);

    result = await nia`Tell me a joke`;
    console.log('  😄', result);

  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  console.log('\n' + '─'.repeat(60));

  // 2. الاستخدام المباشر للذكاء العام
  console.log('🎯 Direct AI Usage (nia.ask):');
  console.log('─'.repeat(60));

  try {
    // أسئلة عامة مباشرة
    let answer = await nia.ask('What are the health benefits of green tea?');
    console.log('🍵 Health question:', answer);

    answer = await nia.ask('Explain quantum computing in simple terms');
    console.log('⚛️  Tech question:', answer);

    answer = await nia.ask('What programming language should I learn first?');
    console.log('💻 Programming:', answer);

    answer = await nia.ask('How to stay motivated while learning?');
    console.log('🎓 Motivation:', answer);

    // أسئلة بالعربية
    answer = await nia.ask('ما هي أفضل طريقة لتعلم لغة جديدة؟');
    console.log('🇸🇦 Arabic question:', answer);

  } catch (error) {
    console.error('❌ Direct AI error:', error.message);
  }

  console.log('\n' + '─'.repeat(60));

  // 3. اختبار حالات Plugin معطل أو غير متوفر
  console.log('🔧 Plugin Failure Scenarios:');
  console.log('─'.repeat(60));

  const engine = new NiaEngine({ logLevel: 'info' });

  try {
    // محاكاة عطل plugin الطقس
    console.log('🌤️  Weather plugin not available, using General AI:');
    const weatherResult = await engine.processIntent('What is the weather like in Paris today?');
    console.log('   Result:', weatherResult.data);
    console.log('   Source:', weatherResult.source);

    // محاكاة عطل plugin الترجمة
    console.log('\n🔤 Translation plugin not available, using General AI:');
    const translateResult = await engine.processIntent('Translate "Hello World" to Japanese');
    console.log('   Result:', translateResult.data);
    console.log('   Source:', translateResult.source);

    // سؤال تقني معقد
    console.log('\n⚙️  Complex technical question:');
    const techResult = await engine.processIntent('How does blockchain consensus work?');
    console.log('   Result:', techResult.data);
    console.log('   Source:', techResult.source);

  } catch (error) {
    console.error('❌ Plugin failure test error:', error.message);
  }

  console.log('\n' + '─'.repeat(60));

  // 4. مقارنة الأداء والتكلفة
  console.log('📊 Performance & Cost Analysis:');
  console.log('─'.repeat(60));

  try {
    const stats = nia.stats();
    if (stats) {
      console.log(`💰 Total Cost: $${stats.totalCost.toFixed(6)}`);
      console.log(`⏱️  Average Response: ${stats.averageResponseTime}ms`);
      console.log(`📈 Total Requests: ${stats.totalRequests}`);
      
      console.log('\n🎯 Usage by Domain:');
      Object.entries(stats.topDomains).forEach(([domain, count]) => {
        console.log(`   ${domain}: ${count} requests`);
      });

      // تحليل نوع الاستخدام
      const usageByType = engine.costTracker.costs.reduce((acc, cost) => {
        const type = cost.type || 'unknown';
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {});

      console.log('\n📊 Usage by Type:');
      Object.entries(usageByType).forEach(([type, count]) => {
        console.log(`   ${type}: ${count} times`);
      });

      // تحذيرات التكلفة
      if (stats.totalCost > 0.10) {
        console.log('\n⚠️  Cost Warning: High usage detected!');
        console.log('   💡 Consider optimizing queries or setting limits');
      }

      const hourlyCost = engine.costTracker.getHourlyCost();
      if (hourlyCost > 0.05) {
        console.log('\n⚠️  Rate Warning: High hourly usage!');
        console.log(`   📊 Last hour cost: $${hourlyCost.toFixed(4)}`);
      }
    }

  } catch (error) {
    console.error('❌ Stats error:', error.message);
  }

  console.log('\n' + '─'.repeat(60));

  // 5. اختبار المحادثة التفاعلية
  console.log('💬 Conversation Context Test:');
  console.log('─'.repeat(60));

  try {
    // محادثة متسلسلة
    let response1 = await nia.ask('What is artificial intelligence?');
    console.log('Q1: What is AI?');
    console.log('A1:', response1.substring(0, 100) + '...');

    let response2 = await nia.ask('How is it different from machine learning?');
    console.log('\nQ2: How is it different from ML?');
    console.log('A2:', response2.substring(0, 100) + '...');

    let response3 = await nia.ask('Give me a practical example');
    console.log('\nQ3: Give me a practical example');
    console.log('A3:', response3.substring(0, 100) + '...');

    // مسح السياق
    nia.clearContext();
    console.log('\n🔄 Context cleared');

    let response4 = await nia.ask('What are you talking about?');
    console.log('\nQ4 (after clear): What are you talking about?');
    console.log('A4:', response4);

  } catch (error) {
    console.error('❌ Conversation test error:', error.message);
  }

  console.log('\n' + '═'.repeat(60));
  console.log('🎉 Enhanced Demo Completed!');
  console.log('═'.repeat(60));

  // ملخص نهائي
  const finalStats = nia.stats();
  if (finalStats) {
    console.log(`\n📊 Final Summary:`);
    console.log(`   💰 Total spent: $${finalStats.totalCost.toFixed(6)}`);
    console.log(`   ⚡ Requests: ${finalStats.totalRequests}`);
    console.log(`   ⏱️  Avg time: ${finalStats.averageResponseTime}ms`);
    
    const generalAIUsage = finalStats.topDomains['general-ai'] || 0;
    const fallbackUsage = finalStats.topDomains['general-ai-fallback'] || 0;
    const pluginUsage = finalStats.totalRequests - generalAIUsage - fallbackUsage;
    
    console.log(`\n🔧 Service Distribution:`);
    console.log(`   🔌 Plugin services: ${pluginUsage}`);
    console.log(`   🧠 Direct AI: ${generalAIUsage}`);
    console.log(`   🔄 AI Fallback: ${fallbackUsage}`);
    
    const coverage = pluginUsage / finalStats.totalRequests * 100;
    console.log(`\n📈 Plugin Coverage: ${coverage.toFixed(1)}%`);
    
    if (coverage < 50) {
      console.log('💡 Recommendation: Consider adding more plugins for better efficiency');
    } else {
      console.log('✅ Good plugin coverage! System is well optimized');
    }
  }
}

// دالة لاختبار سيناريوهات مختلفة
async function testVariousScenarios() {
  console.log('\n🧪 Testing Various Scenarios:\n');

  const testCases = [
    // خدمات مالية مدعومة
    { input: 'Bitcoin price', expected: 'plugin', category: 'Finance' },
    { input: 'سعر الذهب اليوم', expected: 'fallback', category: 'Finance' },
    
    // أسئلة عامة
    { input: 'How to cook pasta?', expected: 'fallback', category: 'Cooking' },
    { input: 'What is the meaning of life?', expected: 'fallback', category: 'Philosophy' },
    
    // أسئلة تقنية
    { input: 'Explain React hooks', expected: 'fallback', category: 'Programming' },
    { input: 'How does WiFi work?', expected: 'fallback', category: 'Technology' },
    
    // أسئلة بالعربية
    { input: 'ما هي عاصمة اليابان؟', expected: 'fallback', category: 'Geography' },
    { input: 'كيف أتعلم البرمجة؟', expected: 'fallback', category: 'Education' },
  ];

  for (const testCase of testCases) {
    try {
      console.log(`🔍 Testing: "${testCase.input}"`);
      console.log(`   📂 Category: ${testCase.category}`);
      console.log(`   🎯 Expected: ${testCase.expected}`);
      
      const result = await nia`${testCase.input}`;
      const preview = typeof result === 'string' 
        ? result.substring(0, 80) + (result.length > 80 ? '...' : '')
        : JSON.stringify(result).substring(0, 80) + '...';
      
      console.log(`   ✅ Result: ${preview}`);
      console.log('');
      
    } catch (error) {
      console.log(`   ❌ Failed: ${error.message}`);
      console.log('');
    }
  }
}

// تشغيل العروض التوضيحية
if (import.meta.url === `file://${process.argv[1]}`) {
  (async () => {
    await demonstrateEnhancedFeatures();
    await testVariousScenarios();
  })().catch(console.error);
}

export { demonstrateEnhancedFeatures, testVariousScenarios };

// Configuration examples لملف منفصل
const configExamples = {
  // إعداد متحفظ - تكلفة منخفضة
  conservative: {
    enableGeneralAI: true,
    maxTokensPerRequest: 150,
    maxDailyCost: 0.50,
    logLevel: 'warn'
  },
  
  // إعداد متوازن - للاستخدام العام
  balanced: {
    enableGeneralAI: true,
    maxTokensPerRequest: 300,
    maxDailyCost: 2.00,
    logLevel: 'info'
  },
  
  // إعداد متقدم - للمطورين والاستخدام المكثف
  advanced: {
    enableGeneralAI: true,
    maxTokensPerRequest: 500,
    maxDailyCost: 10.00,
    logLevel: 'debug',
    enableContextMemory: true,
    maxContextLength: 10
  },
  
  // إعداد بدون AI عام - plugins فقط
  pluginsOnly: {
    enableGeneralAI: false,
    logLevel: 'warn',
    strictMode: true
  }
};

// دالة لاختبار الحدود والتحكم في التكلفة
async function testCostControls() {
  console.log('\n💰 Cost Control Testing:\n');
  
  const engine = new NiaEngine({
    maxDailyCost: 0.10, // حد يومي منخفض للاختبار
    warnThreshold: 0.05
  });
  
  try {
    // محاكاة استخدام مكثف
    for (let i = 1; i <= 5; i++) {
      console.log(`Request ${i}/5:`);
      const result = await engine.ask(`Tell me an interesting fact about space ${i}`);
      console.log(`  💡 ${result.substring(0, 60)}...`);
      
      const stats = engine.getStats();
      console.log(`  💰 Current cost: ${stats.totalCost.toFixed(4)}`);
      
      if (stats.totalCost > 0.05) {
        console.log(`  ⚠️  Warning threshold reached!`);
      }
      
      if (stats.totalCost > 0.10) {
        console.log(`  🛑 Daily limit reached! Stopping requests.`);
        break;
      }
      
      console.log('');
    }
    
  } catch (error) {
    console.error('❌ Cost control test failed:', error.message);
  }
}

// دالة لقياس الأداء
async function performanceBenchmark() {
  console.log('\n⚡ Performance Benchmark:\n');
  
  const testQueries = [
    'Bitcoin price',           // Plugin
    'What is AI?',            // General AI
    'Weather in London',      // Fallback
    '$1000 at 5% for 3 years', // Plugin calculation
    'How to learn Python?'    // General AI
  ];
  
  const results = [];
  
  for (const query of testQueries) {
    const startTime = Date.now();
    
    try {
      const result = await nia`${query}`;
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      results.push({
        query: query.substring(0, 30),
        duration,
        success: true,
        resultLength: typeof result === 'string' ? result.length : 0
      });
      
      console.log(`✅ "${query.substring(0, 30)}..." - ${duration}ms`);
      
    } catch (error) {
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      results.push({
        query: query.substring(0, 30),
        duration,
        success: false,
        error: error.message
      });
      
      console.log(`❌ "${query.substring(0, 30)}..." - ${duration}ms - ${error.message}`);
    }
  }
  
  // تحليل النتائج
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  console.log('\n📊 Benchmark Results:');
  console.log(`   ✅ Successful: ${successful.length}/${results.length}`);
  console.log(`   ❌ Failed: ${failed.length}/${results.length}`);
  
  if (successful.length > 0) {
    const avgDuration = successful.reduce((sum, r) => sum + r.duration, 0) / successful.length;
    const minDuration = Math.min(...successful.map(r => r.duration));
    const maxDuration = Math.max(...successful.map(r => r.duration));
    
    console.log(`   ⏱️  Average: ${Math.round(avgDuration)}ms`);
    console.log(`   🚀 Fastest: ${minDuration}ms`);
    console.log(`   🐌 Slowest: ${maxDuration}ms`);
  }
  
  return results;
}

// دالة للاختبار الشامل
async function comprehensiveTest() {
  console.log('\n🧪 Comprehensive System Test\n');
  console.log('═'.repeat(50));
  
  // 1. اختبار الميزات الأساسية
  console.log('1️⃣  Basic Features Test:');
  await demonstrateEnhancedFeatures();
  
  // 2. اختبار السيناريوهات المختلفة
  console.log('\n2️⃣  Scenario Testing:');
  await testVariousScenarios();
  
  // 3. اختبار التحكم في التكلفة
  console.log('\n3️⃣  Cost Control Test:');
  await testCostControls();
  
  // 4. قياس الأداء
  console.log('\n4️⃣  Performance Benchmark:');
  const benchmarkResults = await performanceBenchmark();
  
  // 5. تقرير نهائي شامل
  console.log('\n5️⃣  Final Report:');
  console.log('═'.repeat(50));
  
  const finalStats = nia.stats();
  if (finalStats) {
    // إحصائيات عامة
    console.log('📊 Overall Statistics:');
    console.log(`   💰 Total Cost: ${finalStats.totalCost.toFixed(6)}`);
    console.log(`   📈 Total Requests: ${finalStats.totalRequests}`);
    console.log(`   ⏱️  Average Response: ${finalStats.averageResponseTime}ms`);
    
    // تحليل الاستخدام
    const pluginRequests = Object.entries(finalStats.topDomains)
      .filter(([domain]) => domain !== 'general-ai' && domain !== 'general-ai-fallback')
      .reduce((sum, [, count]) => sum + count, 0);
    
    const directAI = finalStats.topDomains['general-ai'] || 0;
    const fallbackAI = finalStats.topDomains['general-ai-fallback'] || 0;
    
    console.log('\n🔧 Service Distribution:');
    console.log(`   🔌 Plugin Services: ${pluginRequests} (${(pluginRequests/finalStats.totalRequests*100).toFixed(1)}%)`);
    console.log(`   🧠 Direct AI: ${directAI} (${(directAI/finalStats.totalRequests*100).toFixed(1)}%)`);
    console.log(`   🔄 AI Fallback: ${fallbackAI} (${(fallbackAI/finalStats.totalRequests*100).toFixed(1)}%)`);
    
    // تقييم الكفاءة
    const efficiency = pluginRequests / finalStats.totalRequests;
    console.log('\n📈 System Efficiency:');
    if (efficiency > 0.7) {
      console.log('   ✅ Excellent: High plugin usage, low AI costs');
    } else if (efficiency > 0.4) {
      console.log('   🟡 Good: Balanced usage between plugins and AI');
    } else {
      console.log('   🔴 Consider: High AI usage, might need more plugins');
    }
    
    // تقييم الأداء
    console.log('\n⚡ Performance Assessment:');
    if (finalStats.averageResponseTime < 1000) {
      console.log('   ✅ Excellent response times');
    } else if (finalStats.averageResponseTime < 2000) {
      console.log('   🟡 Good response times');
    } else {
      console.log('   🔴 Slow response times - optimization needed');
    }
    
    // تقييم التكلفة
    console.log('\n💰 Cost Assessment:');
    const costPerRequest = finalStats.totalCost / finalStats.totalRequests;
    console.log(`   💵 Cost per request: ${costPerRequest.toFixed(4)}`);
    
    if (costPerRequest < 0.01) {
      console.log('   ✅ Very cost-effective');
    } else if (costPerRequest < 0.05) {
      console.log('   🟡 Reasonable cost');
    } else {
      console.log('   🔴 High cost - consider optimization');
    }
    
    // توصيات
    console.log('\n💡 Recommendations:');
    if (efficiency < 0.5) {
      console.log('   📝 Add more specialized plugins for common queries');
    }
    if (finalStats.averageResponseTime > 2000) {
      console.log('   📝 Optimize plugin performance or API calls');
    }
    if (costPerRequest > 0.05) {
      console.log('   📝 Reduce token usage or implement caching');
    }
    if (fallbackAI > pluginRequests) {
      console.log('   📝 Many queries fall back to AI - expand plugin capabilities');
    }
  }
  
  console.log('\n🎉 Comprehensive test completed!');
  console.log('═'.repeat(50));
}

// إعدادات متقدمة للتشغيل
const runConfig = {
  // تشغيل سريع - للاختبار السريع
  quick: async () => {
    await demonstrateEnhancedFeatures();
  },
  
  // تشغيل كامل - لاختبار شامل
  full: async () => {
    await comprehensiveTest();
  },
  
  // تشغيل الأداء فقط
  performance: async () => {
    await performanceBenchmark();
  },
  
  // تشغيل التكلفة فقط
  cost: async () => {
    await testCostControls();
  }
};

// تصدير كل شيء
export { 
  demonstrateEnhancedFeatures, 
  testVariousScenarios, 
  testCostControls, 
  performanceBenchmark, 
  comprehensiveTest,
  runConfig,
  configExamples
};