// examples/email-demo.js - أمثلة استخدام Email Plugin
import { nia, NiaEngine } from '../src/core/nia-engine.js';

async function demonstrateEmailFeatures() {
  console.log('📧 Email Plugin Demo - Mock Email System\n');
  console.log('─'.repeat(60));

  try {
    // 1. عرض ملخص البريد
    console.log('📬 1. Email Summary:');
    let result = await nia`email summary`;
    console.log(result);
    console.log('\n' + '─'.repeat(60));

    // 2. قراءة آخر الرسائل
    console.log('📖 2. Reading Recent Emails:');
    result = await nia`read my emails`;
    console.log(result);
    console.log('\n' + '─'.repeat(60));

    // 3. قراءة الرسائل غير المقروءة فقط
    console.log('🆕 3. Unread Emails Only:');
    result = await nia`show unread emails`;
    console.log(result);
    console.log('\n' + '─'.repeat(60));

    // 4. قراءة رسالة محددة
    console.log('📄 4. Reading Specific Email:');
    result = await nia`read email #1`;
    console.log(result);
    console.log('\n' + '─'.repeat(60));

    // 5. إرسال رسالة جديدة
    console.log('📤 5. Sending New Email:');
    result = await nia`send email to ahmed about meeting tomorrow`;
    console.log(result);
    console.log('\n' + '─'.repeat(60));

    // 6. إرسال رسالة بالعربية
    console.log('📤 6. Sending Arabic Email:');
    result = await nia`أرسل رسالة لأمي عن العشاء`;
    console.log(result);
    console.log('\n' + '─'.repeat(60));

    // 7. إنشاء مسودة رسالة
    console.log('✍️ 7. Composing Email Draft:');
    result = await nia`compose email to sara about project update`;
    console.log(result);
    console.log('\n' + '─'.repeat(60));

    // 8. البحث في الرسائل
    console.log('🔍 8. Searching Emails:');
    result = await nia`search emails for meeting`;
    console.log(result);
    console.log('\n' + '─'.repeat(60));

    // 9. حذف رسالة
    console.log('🗑️ 9. Deleting Email:');
    result = await nia`delete email #3`;
    console.log(result);
    console.log('\n' + '─'.repeat(60));

    // 10. عرض قائمة مفصلة
    console.log('📋 10. Detailed Email List:');
    result = await nia`list all emails`;
    console.log(result);

  } catch (error) {
    console.error('❌ Email demo error:', error.message);
  }
}

async function testEmailVariations() {
  console.log('\n🧪 Testing Email Command Variations:\n');
  console.log('─'.repeat(60));

  const emailCommands = [
    // أوامر إرسال متنوعة
    'Send an email to work about vacation request',
    'أرسل إيميل للمدير عن الإجازة',
    'Email dad about birthday party',
    'New message to ahmed',
    
    // أوامر قراءة متنوعة
    'Check my inbox',
    'Show me new emails',
    'اقرأ الرسائل الجديدة',
    'What emails do I have?',
    'عرض البريد الوارد',
    
    // أوامر بحث
    'Find emails from mom',
    'Search for important emails',
    'ابحث عن رسائل العمل',
    'Look for emails about meeting',
    
    // أوامر إدارة
    'Delete old emails',
    'Mark emails as read',
    'احذف الرسائل القديمة',
    'Archive this email'
  ];

  for (const command of emailCommands) {
    try {
      console.log(`🔍 Testing: "${command}"`);
      const result = await nia`${command}`;
      const preview = result.length > 100 ? result.substring(0, 100) + '...' : result;
      console.log(`   ✅ ${preview}`);
      console.log('');
    } catch (error) {
      console.log(`   ❌ Failed: ${error.message}`);
      console.log('');
    }
  }
}

async function demonstrateAdvancedEmailFeatures() {
  console.log('\n🚀 Advanced Email Features:\n');
  console.log('─'.repeat(60));

  const engine = new NiaEngine({ logLevel: 'info' });

  try {
    // تكوين Email Plugin
    const emailPlugin = engine.pluginManager.getPlugin('email');
    if (emailPlugin) {
      // إضافة جهات اتصال مخصصة
      emailPlugin.addContact('زميل العمل', 'colleague@company.com');
      emailPlugin.addContact('العميل المهم', 'important.client@business.com');
      
      console.log('✅ Custom contacts added');
      
      // تخصيص إعدادات المستخدم
      emailPlugin.configure({
        userEmail: 'my.custom@email.com',
        userName: 'المستخدم المتقدم',
        signature: 'مع أطيب التحيات،\nالمستخدم المتقدم\nشركة التقنية المتقدمة'
      });
      
      console.log('✅ User settings configured');
    }

    // اختبار الميزات المتقدمة
    console.log('\n📊 1. Detailed Statistics:');
    let result = await engine.processIntent('show detailed email statistics');
    console.log(result.data);

    console.log('\n✍️ 2. AI-Assisted Email Composition:');
    result = await engine.processIntent('compose formal email to important client about project delay');
    console.log(result.data);

    console.log('\n🔍 3. Smart Email Search:');
    result = await engine.processIntent('find all important emails from last week');
    console.log(result.data);

    console.log('\n📤 4. Sending to Custom Contact:');
    result = await engine.processIntent('send email to زميل العمل about team meeting');
    console.log(result.data);

    console.log('\n📈 5. Email Analytics:');
    if (emailPlugin) {
      const stats = emailPlugin.getDetailedStats();
      console.log(stats);
    }

  } catch (error) {
    console.error('❌ Advanced features error:', error.message);
  }
}

async function testEmailWithOtherPlugins() {
  console.log('\n🔗 Testing Email Integration with Other Plugins:\n');
  console.log('─'.repeat(60));

  try {
    // الجمع بين البريد والخدمات المالية
    console.log('💰 1. Email + Finance:');
    let result = await nia`send email to dad about Bitcoin price today`;
    console.log(result);

    console.log('\n🌤️ 2. Email + Weather:');
    result = await nia`compose email to mom about weather for picnic tomorrow`;
    console.log(result);

    console.log('\n🔤 3. Email + Translation:');
    result = await nia`send email in English to sara about project status`;
    console.log(result);

    // اختبار فشل البريد والرجوع للذكاء العام
    console.log('\n🧠 4. Email Fallback to General AI:');
    result = await nia`how to write professional emails effectively`;
    console.log(result);

    console.log('\n📚 5. Email Best Practices (General AI):');
    result = await nia`what are the best practices for email communication in business`;
    console.log(result);

  } catch (error) {
    console.error('❌ Integration test error:', error.message);
  }
}

// دالة لاختبار الأداء مع البريد الإلكتروني
async function emailPerformanceTest() {
  console.log('\n⚡ Email Plugin Performance Test:\n');
  console.log('─'.repeat(60));

  const testCases = [
    { action: 'read', input: 'show my emails' },
    { action: 'send', input: 'send email to ahmed' },
    { action: 'search', input: 'search emails for meeting' },
    { action: 'compose', input: 'compose email to work' },
    { action: 'delete', input: 'delete email #2' }
  ];

  const results = [];

  for (const testCase of testCases) {
    const startTime = Date.now();
    
    try {
      const result = await nia`${testCase.input}`;
      const duration = Date.now() - startTime;
      
      results.push({
        action: testCase.action,
        duration,
        success: true,
        responseLength: result.length
      });
      
      console.log(`✅ ${testCase.action}: ${duration}ms`);
      
    } catch (error) {
      const duration = Date.now() - startTime;
      
      results.push({
        action: testCase.action,
        duration,
        success: false,
        error: error.message
      });
      
      console.log(`❌ ${testCase.action}: ${duration}ms - ${error.message}`);
    }
  }

  // تحليل النتائج
  const successful = results.filter(r => r.success);
  const avgDuration = successful.reduce((sum, r) => sum + r.duration, 0) / successful.length;
  
  console.log(`\n📊 Performance Summary:`);
  console.log(`   ✅ Success Rate: ${successful.length}/${results.length} (${(successful.length/results.length*100).toFixed(1)}%)`);
  console.log(`   ⏱️  Average Duration: ${Math.round(avgDuration)}ms`);
  console.log(`   🚀 Fastest: ${Math.min(...successful.map(r => r.duration))}ms`);
  console.log(`   🐌 Slowest: ${Math.max(...successful.map(r => r.duration))}ms`);
}

// دالة لعرض مساعدة البريد الإلكتروني
function showEmailHelp() {
  console.log('\n📚 Email Plugin Help & Commands:\n');
  console.log('═'.repeat(60));
  
  console.log('📧 SENDING EMAILS:');
  console.log('   • "send email to ahmed"');
  console.log('   • "أرسل رسالة لأحمد"');
  console.log('   • "email dad about dinner"');
  console.log('   • "new message to work about vacation"');
  console.log('   • "send email to sara@company.com"');
  
  console.log('\n📖 READING EMAILS:');
  console.log('   • "read my emails"');
  console.log('   • "show inbox"');
  console.log('   • "اقرأ الرسائل"');
  console.log('   • "read email #1"');
  console.log('   • "show unread emails"');
  
  console.log('\n🔍 SEARCHING EMAILS:');
  console.log('   • "search emails for meeting"');
  console.log('   • "find emails from mom"');
  console.log('   • "ابحث عن رسائل العمل"');
  console.log('   • "look for important emails"');
  
  console.log('\n✍️ COMPOSING EMAILS:');
  console.log('   • "compose email to ahmed"');
  console.log('   • "write formal email to manager"');
  console.log('   • "اكتب رسالة رسمية للمدير"');
  console.log('   • "draft email about project update"');
  
  console.log('\n🗑️ MANAGING EMAILS:');
  console.log('   • "delete email #3"');
  console.log('   • "احذف الرسالة"');
  console.log('   • "list all emails"');
  console.log('   • "email summary"');
  
  console.log('\n👥 CONTACTS:');
  console.log('   • ahmed → ahmed@example.com');
  console.log('   • sara → sara@company.com');
  console.log('   • أمي/mom → mom@family.com');
  console.log('   • العمل/work → work@company.com');
  console.log('   • المدير/manager → manager@company.com');
  
  console.log('\n💡 TIPS:');
  console.log('   • يدعم العربية والإنجليزية');
  console.log('   • يستخدم AI لمساعدة في الكتابة');
  console.log('   • يحفظ جهات الاتصال تلقائياً');
  console.log('   • يوفر ردود وهمية للاختبار');
  
  console.log('\n🎯 EXAMPLES:');
  console.log('   nia process "send email to ahmed about meeting tomorrow"');
  console.log('   nia process "اقرأ آخر الرسائل"');
  console.log('   nia ask "how to write professional emails"');
}

// دالة شاملة لتشغيل جميع الاختبارات
async function runCompleteEmailDemo() {
  console.log('🎯 Complete Email Plugin Demonstration\n');
  console.log('═'.repeat(70));
  
  try {
    // 1. الميزات الأساسية
    await demonstrateEmailFeatures();
    
    // 2. تنويعات الأوامر
    await testEmailVariations();
    
    // 3. الميزات المتقدمة
    await demonstrateAdvancedEmailFeatures();
    
    // 4. التكامل مع plugins أخرى
    await testEmailWithOtherPlugins();
    
    // 5. اختبار الأداء
    await emailPerformanceTest();
    
    // 6. الإحصائيات النهائية
    console.log('\n📊 Final Email Demo Statistics:');
    console.log('═'.repeat(60));
    
    const stats = nia.stats();
    if (stats) {
      const emailUsage = stats.topDomains.email || 0;
      const totalRequests = stats.totalRequests;
      const emailPercentage = (emailUsage / totalRequests * 100).toFixed(1);
      
      console.log(`📧 Email requests: ${emailUsage}/${totalRequests} (${emailPercentage}%)`);
      console.log(`💰 Total cost: ${stats.totalCost.toFixed(6)}`);
      console.log(`⏱️  Average response: ${stats.averageResponseTime}ms`);
      
      if (emailUsage > 0) {
        console.log('\n✅ Email Plugin is working correctly!');
        console.log('🎉 Mock email system successfully demonstrated');
      }
    }
    
    // 7. عرض المساعدة
    showEmailHelp();
    
  } catch (error) {
    console.error('❌ Complete demo failed:', error.message);
  }
}

// CLI integration for email commands
const emailCliCommands = {
  // أوامر سريعة للـ CLI
  inbox: () => nia`show my emails`,
  send: (recipient, subject) => nia`send email to ${recipient} about ${subject}`,
  read: (id) => nia`read email #${id}`,
  search: (query) => nia`search emails for ${query}`,
  compose: (recipient) => nia`compose email to ${recipient}`,
  delete: (id) => nia`delete email #${id}`,
  summary: () => nia`email summary`
};

// تصدير الدوال للاستخدام
export {
  demonstrateEmailFeatures,
  testEmailVariations,
  demonstrateAdvancedEmailFeatures,
  testEmailWithOtherPlugins,
  emailPerformanceTest,
  showEmailHelp,
  runCompleteEmailDemo,
  emailCliCommands
};

// تشغيل العرض التوضيحي إذا تم استدعاء الملف مباشرة
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  
  if (args.includes('--help')) {
    showEmailHelp();
  } else if (args.includes('--performance')) {
    emailPerformanceTest();
  } else if (args.includes('--basic')) {
    demonstrateEmailFeatures();
  } else if (args.includes('--advanced')) {
    demonstrateAdvancedEmailFeatures();
  } else {
    runCompleteEmailDemo();
  }
}

// دالة مساعدة لاختبار سريع
export const quickEmailTest = async () => {
  console.log('⚡ Quick Email Test:');
  
  const tests = [
    'email summary',
    'send email to ahmed',
    'read my emails',
    'search for important emails'
  ];
  
  for (const test of tests) {
    try {
      const result = await nia`${test}`;
      console.log(`✅ ${test}: OK`);
    } catch (error) {
      console.log(`❌ ${test}: ${error.message}`);
    }
  }
};

// تكوين افتراضي للبريد الإلكتروني
export const defaultEmailConfig = {
  userEmail: 'user@niascript.com',
  userName: 'NiaScript User',
  signature: 'Best regards,\nNiaScript User\n\nSent via NiaScript AI Assistant',
  autoReply: false,
  maxEmailsToShow: 10,
  defaultLanguage: 'arabic',
  mockMode: true // تفعيل الوضع الوهمي للاختبار
};