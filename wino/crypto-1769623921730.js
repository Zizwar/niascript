#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════
// 🤖 تم توليد هذا الملف تلقائياً بواسطة NiaScript Agents
// 📅 التاريخ: 2026-01-28T18:12:04.225Z
// 📝 النية: سكريبت يجلب حالة الطقس من wttr.in ويعرضها بشكل جميل ويحفظها في JSON...
// ═══════════════════════════════════════════════════════════

import axios from 'axios';
import { writeFile } from 'node:fs/promises';
import 'dotenv/config';

const BASE_URL = 'https://wttr.in';
const OUTPUT_FILE = 'weather.json';

/**
 * Builds the request URL for the provided location using the wttr.in query format.
 * @param {string} location - City or location name.
 * @returns {string} Fully qualified URL.
 */
const buildUrl = (location) => `${BASE_URL}/${encodeURIComponent(location)}?format=j1`;

/**
 * Fetches weather data from wttr.in for the given location.
 * @param {string} location - City or location name.
 * @throws {Error} When the API request fails.
 * @returns {Promise<Object>} Parsed weather response.
 */
const fetchWeather = async (location) => {
  if (!location) {
    throw new Error('Location must be provided to fetchWeather.');
  }

  const url = buildUrl(location);
  console.log(`🔍 Fetching weather for ${location} from: ${url}`);

  const response = await axios.get(url, {
    timeout: 10_000,
    responseType: 'json',
  });

  if (response.status !== 200) {
    throw new Error(`Unexpected response status: ${response.status}`);
  }

  console.log('✅ Weather data fetched successfully.');
  return response.data;
};

/**
 * Saves the provided payload to the JSON output file.
 * @param {Object} payload - Weather data to save.
 */
const saveWeatherToFile = async (payload) => {
  console.log(`📁 Saving weather data to ${OUTPUT_FILE}`);

  const serialized = JSON.stringify(payload, null, 2);
  await writeFile(OUTPUT_FILE, serialized, 'utf8');

  console.log('💾 Weather data saved successfully.');
};

/**
 * Main runner for the script.
 * Reads configuration, fetches weather, prints summary, and persists data.
 */
const main = async () => {
  try {
    const location = process.env.LOCATION;
    if (!location) {
      throw new Error('Environment variable LOCATION is required.');
    }

    console.log('🚀 Starting weather fetch workflow.');

    const weather = await fetchWeather(location);

    const currentCondition = weather.current_condition?.[0];
    if (!currentCondition) {
      throw new Error('Missing current condition data in response.');
    }

    console.log('🌡️ Current temperature:', currentCondition.temp_C, '°C');
    console.log('🌬️ Feels like:', currentCondition.FeelsLikeC, '°C');
    console.log('☁️ Weather:', currentCondition.weatherDesc?.[0]?.value ?? 'unknown');

    await saveWeatherToFile(weather);
  } catch (error) {
    console.error('❌ An error occurred:', error.message);
    process.exitCode = 1;
  }
};

main();