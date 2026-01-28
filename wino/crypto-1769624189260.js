#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════
// 🤖 تم توليد هذا الملف تلقائياً بواسطة NiaScript Agents
// 📅 التاريخ: 2026-01-28T18:16:31.040Z
// 📝 النية: سكريبت يجلب سعر البيتكوين والإيثيريوم من CoinGecko API (https://api.coingecko.com/api/v3/simple/pric...
// ═══════════════════════════════════════════════════════════

import 'dotenv/config';
import axios from 'axios';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const API_URL = 'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd';
const PRINCIPAL_USD = 1000;
const INVESTMENT_YEARS = 5;

const SCENARIOS = [
  { label: '15% APR', rate: 0.15 },
  { label: '30% APR', rate: 0.30 },
  { label: '50% APR', rate: 0.50 },
];

const RESULTS_FILE = path.resolve(process.cwd(), 'investment-results.json');

/**
 * Fetch the latest USD prices for bitcoin and ethereum from CoinGecko.
 * @returns {Promise<Record<string, { usd: number }>>}
 */
async function fetchCryptoPrices() {
  console.log('⏳ Fetching latest prices from CoinGecko...');
  const response = await axios.get(API_URL, { timeout: 10000 });
  console.log('✅ Prices retrieved successfully.');
  return response.data;
}

/**
 * Calculate the future value using compound interest.
 * @param {number} principal
 * @param {number} annualRate
 * @param {number} years
 * @returns {number}
 */
function calculateFutureValue(principal, annualRate, years) {
  return principal * Math.pow(1 + annualRate, years);
}

/**
 * Build the investment plan table and persist results.
 * @returns {Promise<object>} Stored result summary.
 */
async function buildInvestmentReport() {
  console.log('🧮 Building investment report...');
  const prices = await fetchCryptoPrices();

  const tableRows = [];
  for (const [key, data] of Object.entries(prices)) {
    const currencyName = key.charAt(0).toUpperCase() + key.slice(1);
    const currentPrice = data.usd ?? 0;

    for (const scenario of SCENARIOS) {
      const projectedValue = calculateFutureValue(PRINCIPAL_USD, scenario.rate, INVESTMENT_YEARS);
      tableRows.push({
        Currency: currencyName,
        'Current Price (USD)': currentPrice.toLocaleString('en-US', { style: 'currency', currency: 'USD' }),
        Scenario: scenario.label,
        'Future Value (USD)': projectedValue.toLocaleString('en-US', { style: 'currency', currency: 'USD' }),
        'Years': INVESTMENT_YEARS,
      });
    }
  }

  console.log('📊 Displaying results table:');
  console.table(tableRows);

  const payload = {
    timestamp: new Date().toISOString(),
    principalUSD: PRINCIPAL_USD,
    years: INVESTMENT_YEARS,
    scenarios: SCENARIOS.map((scenario) => scenario.label),
    data: tableRows,
  };

  console.log(`💾 Saving results to ${RESULTS_FILE}...`);
  await writeFile(RESULTS_FILE, JSON.stringify(payload, null, 2), { encoding: 'utf8' });
  console.log('✅ Results persisted to disk.');

  return payload;
}

async function main() {
  console.log('🚀 Starting investment evaluation script...');
  try {
    await buildInvestmentReport();
    console.log('🎉 Script completed successfully.');
  } catch (error) {
    console.error('❌ An error occurred during execution:', error instanceof Error ? error.message : error);
    throw error;
  }
}

main().catch((error) => {
  console.error('🛑 Runtime failure:', error instanceof Error ? error.stack ?? error.message : error);
  process.exit(1);
});