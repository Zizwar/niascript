#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════
// 🤖 تم توليد هذا الملف تلقائياً بواسطة NiaScript Agents
// 📅 التاريخ: 2026-01-28T18:13:16.131Z
// 📝 النية: سكريبت يجلب سعر البيتكوين والإيثيريوم من Binance API ثم يحسب لو استثمرت 1000 دولار كم ستربح بعد 5 سن...
// ═══════════════════════════════════════════════════════════

import axios from 'axios';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import 'dotenv/config';

const API_BASE = 'https://api.binance.com';
const RESULTS_PATH = path.resolve(process.cwd(), 'investment-results.json');
const SCENARIOS = [0.15, 0.3, 0.5];
const INVESTMENT_AMOUNT = 1000;
const INVESTMENT_YEARS = 5;
const ASSETS = ['BTCUSDT', 'ETHUSDT'];

/**
 * Fetch the latest price for a given symbol from Binance.
 * @param {string} symbol - The trading pair symbol (e.g., BTCUSDT).
 * @returns {Promise<number>} - Latest price.
 */
async function fetchLatestPrice(symbol) {
  console.log(`Fetching latest price for ${symbol}...`);
  try {
    const response = await axios.get(
      `${API_BASE}/api/v3/ticker/price`,
      {
        params: { symbol },
        timeout: 5000,
      }
    );
    const price = Number(response.data.price);
    if (Number.isNaN(price)) {
      throw new Error(`Received invalid price for ${symbol}`);
    }
    console.log(`Price for ${symbol}: ${price}`);
    return price;
  } catch (error) {
    console.error(`Error fetching price for ${symbol}:`, error);
    throw error;
  }
}

/**
 * Calculate future profit for a principal amount with compound interest.
 * @param {number} principal - Initial investment amount.
 * @param {number} annualRate - Annual interest rate (decimal).
 * @param {number} years - Number of years.
 * @returns {{futureValue: number, profit: number}}
 */
function calculateCompoundInterest(principal, annualRate, years) {
  const futureValue = principal * Math.pow(1 + annualRate, years);
  const profit = futureValue - principal;
  return { futureValue, profit };
}

/**
 * Persist results to a JSON file.
 * @param {Record<string, unknown>} data - Data to persist.
 */
async function persistResults(data) {
  console.log('Saving results to disk...');
  const payload = JSON.stringify(data, null, 2);
  try {
    await writeFile(RESULTS_PATH, payload, { encoding: 'utf8' });
    console.log(`Results saved at ${RESULTS_PATH}`);
  } catch (error) {
    console.error('Failed to write results:', error);
    throw error;
  }
}

/**
 * Entry point that orchestrates the investment estimation.
 */
async function main() {
  try {
    console.log('Starting investment projection script...');
    const assetData = [];

    for (const symbol of ASSETS) {
      const price = await fetchLatestPrice(symbol);
      const scenarios = SCENARIOS.map((rate) => {
        const { futureValue, profit } = calculateCompoundInterest(
          INVESTMENT_AMOUNT,
          rate,
          INVESTMENT_YEARS
        );
        return {
          annualRate: rate,
          futureValue: Number(futureValue.toFixed(2)),
          profit: Number(profit.toFixed(2)),
        };
      });

      assetData.push({
        symbol,
        currentPrice: price,
        scenarios,
      });
    }

    const summary = {
      timestamp: new Date().toISOString(),
      investmentAmount: INVESTMENT_AMOUNT,
      investmentYears: INVESTMENT_YEARS,
      assets: assetData,
    };

    console.log('Projection complete:', JSON.stringify(summary, null, 2));
    await persistResults(summary);
    console.log('Script finished successfully.');
  } catch (error) {
    console.error('Script encountered an error:', error);
    process.exitCode = 1;
  }
}

await main();