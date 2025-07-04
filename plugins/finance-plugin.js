// plugins/finance-plugin.js - مثال على Plugin المالية
import { BasePlugin } from '../src/core/base-plugin.js';
import axios from 'axios';

export default class FinancePlugin extends BasePlugin {
  constructor() {
    super('finance');
    this.capabilities = ['get_price', 'compare_assets', 'calculate_investment'];
    
    // معلومات الموفرين
    this.providers = {
      binance: {
        baseURL: 'https://api.binance.com/api/v3',
        cost: 0,
        reliability: 0.95
      },
      coinGecko: {
        baseURL: 'https://api.coingecko.com/api/v3',
        cost: 0,
        reliability: 0.90
      }
    };

    // قاموس الأصول الذكي - قابل للتوسيع
    this.assetMappings = {
      // الكريبتو الشائع
      'bitcoin': { symbol: 'BTC', type: 'crypto', displayName: 'Bitcoin' },
      'btc': { symbol: 'BTC', type: 'crypto', displayName: 'Bitcoin' },
      'ethereum': { symbol: 'ETH', type: 'crypto', displayName: 'Ethereum' },
      'eth': { symbol: 'ETH', type: 'crypto', displayName: 'Ethereum' },
      'cardano': { symbol: 'ADA', type: 'crypto', displayName: 'Cardano' },
      'ada': { symbol: 'ADA', type: 'crypto', displayName: 'Cardano' },
      'polkadot': { symbol: 'DOT', type: 'crypto', displayName: 'Polkadot' },
      'dot': { symbol: 'DOT', type: 'crypto', displayName: 'Polkadot' },
      'chainlink': { symbol: 'LINK', type: 'crypto', displayName: 'Chainlink' },
      'link': { symbol: 'LINK', type: 'crypto', displayName: 'Chainlink' },
      'solana': { symbol: 'SOL', type: 'crypto', displayName: 'Solana' },
      'sol': { symbol: 'SOL', type: 'crypto', displayName: 'Solana' },
      'dogecoin': { symbol: 'DOGE', type: 'crypto', displayName: 'Dogecoin' },
      'doge': { symbol: 'DOGE', type: 'crypto', displayName: 'Dogecoin' },
      'polygon': { symbol: 'MATIC', type: 'crypto', displayName: 'Polygon' },
      'matic': { symbol: 'MATIC', type: 'crypto', displayName: 'Polygon' },
      
      // الأسهم
      'apple': { symbol: 'AAPL', type: 'stock', displayName: 'Apple Inc.' },
      'aapl': { symbol: 'AAPL', type: 'stock', displayName: 'Apple Inc.' },
      'microsoft': { symbol: 'MSFT', type: 'stock', displayName: 'Microsoft Corp.' },
      'msft': { symbol: 'MSFT', type: 'stock', displayName: 'Microsoft Corp.' },
      'google': { symbol: 'GOOGL', type: 'stock', displayName: 'Alphabet Inc.' },
      'googl': { symbol: 'GOOGL', type: 'stock', displayName: 'Alphabet Inc.' },
      'amazon': { symbol: 'AMZN', type: 'stock', displayName: 'Amazon.com Inc.' },
      'amzn': { symbol: 'AMZN', type: 'stock', displayName: 'Amazon.com Inc.' },
      'tesla': { symbol: 'TSLA', type: 'stock', displayName: 'Tesla Inc.' },
      'tsla': { symbol: 'TSLA', type: 'stock', displayName: 'Tesla Inc.' }
    };
  }

  async execute(intent, context) {
    const startTime = Date.now();
    
    try {
      const result = await this.handleAction(intent, context);
      
      const duration = Date.now() - startTime;
      this.logUsage(context, intent.action, { duration });
      
      return {
        success: true,
        data: result,
        source: 'finance-plugin',
        executionTime: duration
      };
      
    } catch (error) {
      const duration = Date.now() - startTime;
      context.logger.logError(`finance-plugin-error`, error, duration);
      
      // 🎯 بدلاً من الفشل، اقتراح الرجوع للذكاء العام
      return {
        success: false,
        message: `خطأ في الخدمة المالية: ${error.message}`,
        suggestion: 'جرب مرة أخرى أو استخدم اسم مختلف للأصل',
        fallbackToGeneralAI: true, // 🔄 إشارة للرجوع للذكاء العام
        originalError: error.message
      };
    }
  }

  async handleAction(intent, context) {
    switch (intent.action) {
      case 'get_info':
        return await this.getAssetPrice(intent.entities.target, context);
      
      case 'calculate':
        return await this.calculateInvestment(intent.entities, context);
      
      case 'compare':
        return await this.compareAssets(intent.entities, context);
      
      default:
        throw new Error(`Action غير مدعوم: ${intent.action}`);
    }
  }

  async getAssetPrice(assetName, context) {
    // تطبيع اسم الأصل
    const asset = this.normalizeAsset(assetName);
    if (!asset) {
      // استخدام AI لمحاولة فهم الأصل
      return await this.handleUnknownAsset(assetName, context);
    }

    // الحصول على السعر حسب نوع الأصل
    if (asset.type === 'crypto') {
      return await this.getCryptoPrice(asset, context);
    } else if (asset.type === 'stock') {
      return await this.getStockPrice(asset, context);
    }
  }

  async getCryptoPrice(asset, context) {
    try {
      // محاولة Binance أولاً
      const response = await axios.get(
        `${this.providers.binance.baseURL}/ticker/price`,
        { params: { symbol: `${asset.symbol}USDT` } }
      );

      const price = parseFloat(response.data.price);
      return `${asset.displayName} price: $${price.toLocaleString()} USD`;

    } catch (error) {
      // التراجع إلى CoinGecko
      context.logger.logWarning('Binance failed, trying CoinGecko...');
      return await this.getCryptoPriceFromCoinGecko(asset, context);
    }
  }

  async getCryptoPriceFromCoinGecko(asset, context) {
    // تحويل الرمز إلى ID الخاص بـ CoinGecko
    const coinGeckoId = this.getCoinGeckoId(asset.symbol);
    
    const response = await axios.get(
      `${this.providers.coinGecko.baseURL}/simple/price`,
      { 
        params: { 
          ids: coinGeckoId,
          vs_currencies: 'usd'
        } 
      }
    );

    const price = response.data[coinGeckoId]?.usd;
    if (!price) throw new Error('Price not found in CoinGecko');

    return `${asset.displayName} price: $${price.toLocaleString()} USD (via CoinGecko)`;
  }

  async getStockPrice(asset, context) {
    // هنا يمكن استخدام Yahoo Finance أو Alpha Vantage
    // للمثال، سنرجع رسالة تفيد أن الخدمة قيد التطوير
    return `${asset.displayName} stock price service is under development. Please check financial websites for current ${asset.symbol} price.`;
  }

  async handleUnknownAsset(assetName, context) {
    // استخدام AI لمحاولة فهم الأصل
    const prompt = `
The user asked for: "${assetName}"

This could be:
1. A cryptocurrency (like Bitcoin, Ethereum, etc.)
2. A stock symbol (like AAPL, MSFT, etc.)
3. A company name (like Apple, Microsoft, etc.)
4. Something else entirely

Based on the name, what do you think this is? Respond with JSON:
{
  "type": "crypto|stock|unknown",
  "symbol": "best guess for symbol",
  "confidence": 0.0-1.0,
  "alternatives": ["alternative1", "alternative2"]
}
`;

    try {
      const response = await context.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.1,
        max_tokens: 150
      });

      const aiGuess = JSON.parse(response.choices[0].message.content);
      const cost = context.costTracker.calculateOpenAICost(response);
      context.costTracker.addCost(cost);

      if (aiGuess.confidence > 0.7) {
        // إضافة التخمين إلى قاموس الأصول للمرات القادمة
        this.assetMappings[assetName.toLowerCase()] = {
          symbol: aiGuess.symbol,
          type: aiGuess.type,
          displayName: assetName,
          aiGenerated: true
        };

        // محاولة الحصول على السعر
        return await this.getAssetPrice(assetName, context);
      } else {
        return `لم أتمكن من التعرف على "${assetName}". هل تقصد أحد هذه: ${aiGuess.alternatives.join(', ')}؟`;
      }

    } catch (error) {
      return `لم أتمكن من التعرف على "${assetName}". جرب استخدام رمز أو اسم أكثر وضوحاً.`;
    }
  }

  async calculateInvestment(entities, context) {
    const { amount = 1000, rate = 8, years = 5 } = entities.parameters || {};
    
    // حساب الفائدة المركبة
    const finalAmount = amount * Math.pow(1 + (rate / 100) / 12, 12 * years);
    const profit = finalAmount - amount;
    
    return `استثمار $${amount.toLocaleString()} بمعدل ${rate}% سنوياً لمدة ${years} سنوات:
• المبلغ النهائي: $${finalAmount.toLocaleString('en-US', { maximumFractionDigits: 2 })}
• الربح: $${profit.toLocaleString('en-US', { maximumFractionDigits: 2 })}
• عائد الاستثمار: ${((profit / amount) * 100).toFixed(1)}%`;
  }

  async compareAssets(entities, context) {
    // للمثال - مقارنة بسيطة
    const { assets } = entities.parameters || {};
    if (!assets || assets.length < 2) {
      return 'أحتاج أصلين على الأقل للمقارنة';
    }

    const results = [];
    for (const assetName of assets.slice(0, 3)) { // أقصى 3 أصول
      try {
        const price = await this.getAssetPrice(assetName, context);
        results.push(`• ${price}`);
      } catch (error) {
        results.push(`• ${assetName}: غير متوفر`);
      }
    }

    return `مقارنة الأصول:\n${results.join('\n')}`;
  }

  normalizeAsset(assetName) {
    const normalized = assetName.toLowerCase().trim();
    return this.assetMappings[normalized] || null;
  }

  getCoinGeckoId(symbol) {
    const mapping = {
      'BTC': 'bitcoin',
      'ETH': 'ethereum',
      'ADA': 'cardano',
      'DOT': 'polkadot',
      'LINK': 'chainlink',
      'SOL': 'solana',
      'DOGE': 'dogecoin',
      'MATIC': 'matic-network'
    };
    
    return mapping[symbol] || symbol.toLowerCase();
  }

  calculateMatch(intent) {
    if (intent.domain !== 'finance') return 0;
    
    // تحسين مطابقة النية
    const actionMatch = this.capabilities.includes(intent.action) ? 0.3 : 0;
    const confidenceBonus = (intent.confidence || 0.5) * 0.7;
    
    return Math.min(1.0, actionMatch + confidenceBonus);
  }
}