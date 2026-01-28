#!/usr/bin/env node
// wino/exp-crypto.js - تجربة العملات الرقمية مع الوكلاء
// سعر البيتكوين والإيثيريوم + حساب الهولد 5 سنوات

import 'dotenv/config';
import { createAgentTeam, NiaFlow } from '../src/index.js';
import axios from 'axios';
import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ========================================
// نظام اللوغ - حفظ في ملف
// ========================================
const logFile = path.join(__dirname, `exp-crypto-${Date.now()}.log`);
const logStream = fs.createWriteStream(logFile, { flags: 'a' });

const originalLog = console.log;
console.log = (...args) => {
  const message = args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : a).join(' ');
  originalLog(...args);
  logStream.write(message + '\n');
};

process.on('exit', () => {
  logStream.end();
  originalLog(`\n📄 اللوغ محفوظ في: ${logFile}`);
});

console.log(`
╔═══════════════════════════════════════════════════════════════╗
║  🪙 تجربة العملات الرقمية - WINO                              ║
║  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━                ║
║  Bitcoin + Ethereum + HODL Calculator                         ║
╚═══════════════════════════════════════════════════════════════╝
`);

// ========================================
// 1. جلب أسعار العملات الرقمية (API مجاني)
// ========================================
async function getCryptoPrices() {
  console.log('📡 جاري جلب الأسعار من CoinGecko...\n');

  try {
    // سعر اليوم
    const response = await axios.get(
      'https://api.coingecko.com/api/v3/simple/price', {
        params: {
          ids: 'bitcoin,ethereum',
          vs_currencies: 'usd',
          include_24hr_change: true
        }
      }
    );

    const btc = response.data.bitcoin;
    const eth = response.data.ethereum;

    // أسعار الأمس (تقريبية من التغير)
    const btcYesterday = btc.usd / (1 + btc.usd_24h_change / 100);
    const ethYesterday = eth.usd / (1 + eth.usd_24h_change / 100);

    return {
      bitcoin: {
        today: btc.usd,
        yesterday: btcYesterday,
        change24h: btc.usd_24h_change
      },
      ethereum: {
        today: eth.usd,
        yesterday: ethYesterday,
        change24h: eth.usd_24h_change
      }
    };
  } catch (error) {
    console.log('⚠️ فشل جلب الأسعار، استخدام أسعار تقريبية...');
    return {
      bitcoin: { today: 42000, yesterday: 41500, change24h: 1.2 },
      ethereum: { today: 2500, yesterday: 2450, change24h: 2.0 }
    };
  }
}

// ========================================
// 2. حساب الهولد مع NiaFlow
// ========================================
function calculateHODL(prices, investmentUSD, years) {
  const nia = new NiaFlow();

  // سيناريوهات مختلفة للعائد السنوي
  const scenarios = {
    conservative: 15,  // متحفظ
    moderate: 30,      // معتدل
    optimistic: 50     // متفائل
  };

  const results = {};

  for (const [scenario, annualReturn] of Object.entries(scenarios)) {
    const calcResult = nia.calc(`${investmentUSD}$ @ ${annualReturn}% لمدة ${years} سنوات`);
    results[scenario] = {
      annualReturn: `${annualReturn}%`,
      finalValue: calcResult.result,
      profit: calcResult.details.profit,
      multiplier: calcResult.details.growthMultiple
    };
  }

  return results;
}

// ========================================
// 3. تحليل باستخدام الوكلاء
// ========================================
async function analyzeWithAgents(prices, hodlResults) {
  console.log('\n🤖 تحليل الوكلاء الذكي...\n');

  const team = createAgentTeam();

  const analysisPrompt = `أنت محلل عملات رقمية خبير. حلل البيانات التالية:

الأسعار الحالية:
- Bitcoin: $${prices.bitcoin.today.toLocaleString()} (تغير 24س: ${prices.bitcoin.change24h.toFixed(2)}%)
- Ethereum: $${prices.ethereum.today.toLocaleString()} (تغير 24س: ${prices.ethereum.change24h.toFixed(2)}%)

توقعات HODL لـ 5 سنوات (استثمار $1000):
- متحفظ (15%): ${hodlResults.conservative.finalValue}
- معتدل (30%): ${hodlResults.moderate.finalValue}
- متفائل (50%): ${hodlResults.optimistic.finalValue}

أجب بـ JSON فقط بدون أي نص إضافي:
{"marketSentiment":"bullish أو bearish أو neutral","recommendation":"توصيتك هنا","bestStrategy":"الاستراتيجية","riskLevel":"low أو medium أو high","tips":["نصيحة 1","نصيحة 2","نصيحة 3"]}`;

  try {
    // استخدام ask مباشرة بدلاً من think
    const nia = new NiaFlow();
    const result = await nia.ask(analysisPrompt, { model: 'openai/gpt-5.1-codex-mini' });

    if (result.success && result.result) {
      try {
        const jsonMatch = result.result.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
      } catch (e) {
        console.log('⚠️ خطأ في تحليل JSON:', e.message);
      }
      return { raw: result.result };
    }

    return { error: result.error || 'لا توجد استجابة' };
  } catch (e) {
    return { error: e.message };
  }
}

// ========================================
// 4. توليد كود tracker
// ========================================
async function generateTrackerCode() {
  console.log('\n💻 توليد كود متتبع الأسعار...\n');

  const team = createAgentTeam();

  const result = await team.build(`
اكتب كلاس JavaScript اسمه CryptoTracker يقوم بـ:
1. جلب أسعار Bitcoin و Ethereum من CoinGecko API
2. حساب الربح/الخسارة بناءً على سعر الشراء
3. تنبيه عند تغير السعر بنسبة معينة
4. حفظ تاريخ الأسعار

استخدم axios و ESM
`);

  return result;
}

// ========================================
// التشغيل الرئيسي
// ========================================
async function main() {
  const startTime = Date.now();

  // 1. جلب الأسعار
  console.log('━'.repeat(60));
  console.log('📊 [1] أسعار العملات الرقمية');
  console.log('━'.repeat(60));

  const prices = await getCryptoPrices();

  console.log(`
  ₿ Bitcoin:
     اليوم:    $${prices.bitcoin.today.toLocaleString()}
     الأمس:    $${prices.bitcoin.yesterday.toLocaleString()}
     التغير:   ${prices.bitcoin.change24h >= 0 ? '📈' : '📉'} ${prices.bitcoin.change24h.toFixed(2)}%

  Ξ Ethereum:
     اليوم:    $${prices.ethereum.today.toLocaleString()}
     الأمس:    $${prices.ethereum.yesterday.toLocaleString()}
     التغير:   ${prices.ethereum.change24h >= 0 ? '📈' : '📉'} ${prices.ethereum.change24h.toFixed(2)}%
  `);

  // 2. حساب HODL
  console.log('━'.repeat(60));
  console.log('💎 [2] حساب HODL - استثمار $1,000 لمدة 5 سنوات');
  console.log('━'.repeat(60));

  const hodlResults = calculateHODL(prices, 1000, 5);

  console.log(`
  📊 السيناريوهات:

  🐢 متحفظ (${hodlResults.conservative.annualReturn} سنوياً):
     القيمة النهائية: ${hodlResults.conservative.finalValue}
     الربح: ${hodlResults.conservative.profit}
     المضاعف: ${hodlResults.conservative.multiplier}

  ⚖️ معتدل (${hodlResults.moderate.annualReturn} سنوياً):
     القيمة النهائية: ${hodlResults.moderate.finalValue}
     الربح: ${hodlResults.moderate.profit}
     المضاعف: ${hodlResults.moderate.multiplier}

  🚀 متفائل (${hodlResults.optimistic.annualReturn} سنوياً):
     القيمة النهائية: ${hodlResults.optimistic.finalValue}
     الربح: ${hodlResults.optimistic.profit}
     المضاعف: ${hodlResults.optimistic.multiplier}
  `);

  // 3. تحليل الوكلاء
  console.log('━'.repeat(60));
  console.log('🤖 [3] تحليل الذكاء الاصطناعي');
  console.log('━'.repeat(60));

  const analysis = await analyzeWithAgents(prices, hodlResults);

  if (analysis.marketSentiment) {
    const sentimentEmoji = {
      bullish: '🐂 صعودي',
      bearish: '🐻 هبوطي',
      neutral: '😐 محايد'
    };

    const riskEmoji = {
      low: '🟢 منخفض',
      medium: '🟡 متوسط',
      high: '🔴 عالي'
    };

    console.log(`
  📈 مزاج السوق: ${sentimentEmoji[analysis.marketSentiment] || analysis.marketSentiment}
  ⚠️ مستوى المخاطرة: ${riskEmoji[analysis.riskLevel] || analysis.riskLevel}

  💡 التوصية:
     ${analysis.recommendation}

  🎯 الاستراتيجية المثلى:
     ${analysis.bestStrategy}

  📝 نصائح:
${analysis.tips?.map((t, i) => `     ${i + 1}. ${t}`).join('\n') || '     لا توجد نصائح'}
    `);
  } else if (analysis.raw) {
    console.log(`\n  ${analysis.raw}\n`);
  } else {
    console.log(`\n  ❌ ${analysis.error}\n`);
  }

  // 4. توليد كود (اختياري)
  console.log('━'.repeat(60));
  console.log('💻 [4] توليد كود CryptoTracker');
  console.log('━'.repeat(60));

  const trackerCode = await generateTrackerCode();

  if (trackerCode.success && trackerCode.code) {
    console.log('\n  ✅ تم توليد الكود بنجاح!\n');
    console.log('  الكود:');
    console.log('  ' + '─'.repeat(50));
    // عرض أول 30 سطر
    const lines = trackerCode.code.split('\n').slice(0, 30);
    lines.forEach(line => console.log(`  ${line}`));
    if (trackerCode.code.split('\n').length > 30) {
      console.log('  ... (المزيد)');
    }
  } else {
    console.log(`\n  ⚠️ ${trackerCode.error || 'لم يتم توليد الكود'}\n`);
  }

  // الملخص
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  ⏱️ الوقت الكلي: ${duration} ثانية

  📌 ملخص سريع:
     • BTC: $${prices.bitcoin.today.toLocaleString()}
     • ETH: $${prices.ethereum.today.toLocaleString()}
     • HODL 5 سنوات (معتدل): ${hodlResults.moderate.finalValue}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);
}

main().catch(console.error);
