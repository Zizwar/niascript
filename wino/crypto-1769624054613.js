#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════
// 🤖 تم توليد هذا الملف تلقائياً بواسطة NiaScript Agents
// 📅 التاريخ: 2026-01-28T18:14:19.401Z
// 📝 النية: سكريبت يجلب سعر البيتكوين من https://api.coincap.io/v2/assets/bitcoin ويحسب الهولد بثلاث سيناريوهات ...
// ═══════════════════════════════════════════════════════════

import axios from 'axios';
import { writeFile } from 'fs/promises';
import 'dotenv/config';

const API_URL = 'https://api.coincap.io/v2/assets/bitcoin';
const INVESTMENT = Number(process.env.INVESTMENT ?? 1000);
const HOLD_YEARS = Number(process.env.HOLD_YEARS ?? 5);
const OUTPUT_FILE = process.env.OUTPUT_FILE ?? 'btc-hold-results.json';
const SCENARIOS = [0.15, 0.3, 0.5];

/**
 * Fetches the current Bitcoin price in USD from the CoinCap API.
 * @returns {Promise<number>} The current Bitcoin price.
 * @throws Will throw if the API response is malformed or the request fails.
 */
async function fetchBitcoinPrice() {
  console.log('📡 Fetching current Bitcoin price from CoinCap API...');
  const response = await axios.get(API_URL, { timeout: 10000 });
  if (!response?.data?.data?.priceUsd) {
    throw new Error('Unexpected response structure from CoinCap API');
  }

  const price = Number(response.data.data.priceUsd);
  if (!Number.isFinite(price)) {
    throw new Error('Received price is not a valid number');
  }

  console.log(`✅ Current Bitcoin price: $${price.toFixed(2)} USD`);
  return price;
}

/**
 * Calculates the future value for a compounding scenario.
 * @param {number} investment The initial investment amount.
 * @param {number} annualRate The annual growth rate (e.g., 0.15 for 15%).
 * @param {number} years Number of years to hold the investment.
 * @returns {{ rate: number, finalAmount: number, profit: number }} Scenario metrics.
 */
function calculateScenario(investment, annualRate, years) {
  if (investment <= 0 || years <= 0) {
    throw new Error('Investment and years must be greater than zero');
  }

  const finalAmount = investment * Math.pow(1 + annualRate, years);
  const profit = finalAmount - investment;

  return {
    rate: annualRate,
    finalAmount: Number(finalAmount.toFixed(2)),
    profit: Number(profit.toFixed(2)),
  };
}

/**
 * Persists the scenario data into a JSON file for later inspection.
 * @param {string} path File path to save the results.
 * @param {object} payload The payload to persist.
 */
async function persistResults(path, payload) {
  console.log(`💾 Saving results to ${path}...`);
  const formatted = JSON.stringify(payload, null, 2);
  await writeFile(path, formatted, { encoding: 'utf8' });
  console.log('✅ Results saved successfully.');
}

/**
 * Entry point to orchestrate the Bitcoin hold projection flow.
 */
async function main() {
  console.log('🚀 Starting Bitcoin hold calculator...');

  try {
    const currentPrice = await fetchBitcoinPrice();

    console.log('📊 Calculating hold scenarios...');
    const scenarioResults = SCENARIOS.map((rate) => {
      const scenario = calculateScenario(INVESTMENT, rate, HOLD_YEARS);
      console.log(`• Rate: ${(rate * 100).toFixed(0)}% -> Final Value: $${scenario.finalAmount}, Profit: $${scenario.profit}`);
      return scenario;
    });

    const payload = {
      timestamp: new Date().toISOString(),
      investment: INVESTMENT,
      holdYears: HOLD_YEARS,
      currentPriceUsd: currentPrice,
      scenarios: scenarioResults,
    };

    await persistResults(OUTPUT_FILE, payload);

    console.log('🎉 Bitcoin hold projection completed.');
  } catch (error) {
    console.error('❌ Error occurred during execution:', error);
    process.exitCode = 1;
  }
}

main();