#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════
// 🤖 تم توليد هذا الملف تلقائياً بواسطة NiaScript Agents
// 📅 التاريخ: 2026-01-28T18:11:29.477Z
// 📝 النية: سكريبت يجلب سعر البيتكوين من CoinGecko ويحسب الهولد 5 سنوات...
// ═══════════════════════════════════════════════════════════

import 'dotenv/config';
import axios from 'axios';
import { writeFile } from 'node:fs/promises';

const API_BASE = 'https://api.coingecko.com/api/v3';
const OUTPUT_PATH = './bitcoin-hold-5y.json';
const TARGET_COIN = 'bitcoin';

/**
 * حساب تاريخ منذ 5 سنوات بصيغة المطلوبة من CoinGecko (dd-mm-yyyy)
 * @returns {string}
 */
function getDateFiveYearsAgo() {
  const today = new Date();
  const pastDate = new Date(today);
  pastDate.setFullYear(pastDate.getFullYear() - 5);

  const day = String(pastDate.getUTCDate()).padStart(2, '0');
  const month = String(pastDate.getUTCMonth() + 1).padStart(2, '0');
  const year = pastDate.getUTCFullYear();

  return `${day}-${month}-${year}`;
}

/**
 * استرجاع السعر الحالي من CoinGecko
 * @returns {Promise<number>}
 */
async function fetchCurrentPrice() {
  console.log('Fetching current Bitcoin price...');
  const url = `${API_BASE}/simple/price`;
  const response = await axios.get(url, {
    params: {
      ids: TARGET_COIN,
      vs_currencies: 'usd'
    },
    timeout: 10000
  });
  const price = response.data?.[TARGET_COIN]?.usd;
  if (typeof price !== 'number') {
    throw new Error('Unable to parse current price from CoinGecko response');
  }
  console.log(`Current price fetched: $${price}`);
  return price;
}

/**
 * استرجاع السعر التاريخي
 * @param {string} dateString
 * @returns {Promise<number>}
 */
async function fetchHistoricalPrice(dateString) {
  console.log(`Fetching historical price for ${dateString}...`);
  const url = `${API_BASE}/coins/${TARGET_COIN}/history`;
  const response = await axios.get(url, {
    params: {
      date: dateString,
      localization: 'false'
    },
    timeout: 10000
  });
  const price = response.data?.market_data?.current_price?.usd;
  if (typeof price !== 'number') {
    throw new Error('Unable to parse historical price from CoinGecko response');
  }
  console.log(`Historical price on ${dateString}: $${price}`);
  return price;
}

/**
 * حساب العائد بعد خمس سنوات
 * @param {number} currentPrice
 * @param {number} historicalPrice
 * @returns {{absoluteGain: number, percentReturn: number}}
 */
function calculateHold(currentPrice, historicalPrice) {
  const absoluteGain = currentPrice - historicalPrice;
  const percentReturn = (absoluteGain / historicalPrice) * 100;
  console.log('Calculated hold metrics');
  return {
    absoluteGain,
    percentReturn
  };
}

/**
 * حفظ النتائج في ملف JSON
 * @param {Record<string, any>} data
 * @returns {Promise<void>}
 */
async function saveResults(data) {
  console.log(`Saving results to ${OUTPUT_PATH}...`);
  const serialized = JSON.stringify(data, null, 2);
  await writeFile(OUTPUT_PATH, serialized, { encoding: 'utf-8' });
  console.log('Results saved successfully.');
}

async function main() {
  console.log('Starting Bitcoin 5-year hold script...');
  try {
    const historicalDate = getDateFiveYearsAgo();
    const [currentPrice, historicalPrice] = await Promise.all([
      fetchCurrentPrice(),
      fetchHistoricalPrice(historicalDate)
    ]);

    const holdMetrics = calculateHold(currentPrice, historicalPrice);

    const payload = {
      targetCoin: TARGET_COIN,
      currentPrice,
      historicalPrice,
      historicalDate,
      hold: holdMetrics,
      runAt: new Date().toISOString()
    };

    await saveResults(payload);
    console.log('Bitcoin hold calculation complete.');
  } catch (error) {
    console.error('An error occurred during execution:', error);
    process.exitCode = 1;
  }
}

main();