# 🤖 NiaScript

**Intent-based programming language for the AI era**

NiaScript هي مكتبة JavaScript قوية ومرنة تمكن المطورين من بناء تطبيقات ذكية باستخدام معالجة اللغة الطبيعية والذكاء الاصطناعي. تتيح للمستخدمين التفاعل مع التطبيقات باللغة الطبيعية وتحويل النوايا إلى إجراءات قابلة للتنفيذ.

## ✨ الميزات الرئيسية

- **معالجة النوايا الذكية**: تحليل وفهم الاستعلامات بالغة الطبيعية
- **محرك الوصفات**: تحويل النوايا إلى خطوات قابلة للتنفيذ
- **إدارة مقدمي الخدمة**: نظام ذكي لاختيار أفضل مصادر البيانات
- **التنفيذ الآمن**: حماية شاملة ضد العمليات الخطيرة
- **نظام الذاكرة**: تعلم من التفاعلات السابقة
- **معالجة الأخطاء المتقدمة**: استرداد ذكي من الأخطاء

## 📦 التثبيت

```bash
npm install niascript
```

## 🚀 البدء السريع

### الاستخدام الأساسي

```javascript
import { nia } from 'niascript';

// استعلام بسيط لأسعار العملات المشفرة
const btcPrice = await nia`Bitcoin price`;
console.log(btcPrice); // "BTC price: $45,000 USD"

// استعلام للاستثمار
const investment = await nia`If I invest $1000 at 8% annual return, what will I have after 5 years?`;
console.log(investment); // "Investment of $1000 at 8% annually for 5 years = $1469.33"
```

### الاستخدام المتقدم

```javascript
import { NiaScript } from 'niascript';

const nia = new NiaScript();

// معالجة استعلام معقد
const query = "Compare Bitcoin and Ethereum performance over the last 30 days";
const result = await nia.processIntent(query);
console.log(result);
```

## 📖 دليل الاستخدام

### 1. واجهة Template Literal

الطريقة الأسهل والأكثر طبيعية للاستخدام:

```javascript
// أسعار العملات المشفرة
const ethPrice = await nia`Ethereum price`;

// استعلامات الأسهم
const stockPrice = await nia`AAPL stock price`;

// حسابات الاستثمار
const compoundInterest = await nia`What is $5000 invested at 6% for 10 years?`;
```

### 2. الطرق المباشرة

```javascript
// طرح سؤال مباشر
const answer = await nia.ask("What's the current Bitcoin price?");

// طلب توضيح
const choice = await nia.clarify("Apple could refer to:", ["stock", "fruit", "company"]);

// حفظ معلومة في الذاكرة
await nia.remember("User prefers cryptocurrency over stocks");

// نسيان معلومة
await nia.forget("old investment preferences");
```

### 3. تسجيل مقدمي خدمة مخصصين

```javascript
// تسجيل مقدم خدمة جديد
nia.registerProvider('financial', 'alpha_vantage', {
  name: 'Alpha Vantage API',
  baseURL: 'https://www.alphavantage.co/query',
  apiKey: process.env.ALPHA_VANTAGE_KEY,
  rateLimits: { requests: 5, window: 60000 },
  cost: 0,
  reliability: 0.95
});

// معالجة الأخطاء المخصصة
nia.onError(async (error, context) => {
  if (error.type === 'API_FAILURE') {
    console.log('Using fallback provider...');
    return await context.tryFallback();
  }
  throw error;
});
```

## 📚 الـ API Reference

### الفئة الرئيسية: NiaScript

#### المنطق الأساسي

- `processIntent(query, values)`: معالجة استعلام بالغة الطبيعية
- `ask(query, options)`: طرح سؤال مباشر
- `clarify(question, choices)`: طلب توضيح من المستخدم

#### إدارة الذاكرة

- `remember(fact)`: حفظ معلومة في الذاكرة
- `forget(pattern)`: حذف معلومات من الذاكرة

#### إدارة مقدمي الخدمة

- `registerProvider(category, name, config)`: تسجيل مقدم خدمة جديد
- `onError(handler)`: تسجيل معالج أخطاء مخصص

### مكونات النظام

#### IntentParser

محلل النوايا الذي يحول النص الطبيعي إلى نوايا مفهومة:

```javascript
import { IntentParser } from 'niascript/core/intent-parser.js';

const parser = new IntentParser();
const intent = await parser.parseIntent("Bitcoin price");
console.log(intent);
/*
{
  type: 'financial',
  entities: { asset: 'bitcoin', operation: 'get_price' },
  confidence: 0.8,
  needsClarification: false
}
*/
```

#### RecipeEngine

محرك الوصفات الذي يحول النوايا إلى خطوات قابلة للتنفيذ:

```javascript
import { RecipeEngine } from 'niascript/core/recipe-engine.js';

const engine = new RecipeEngine();
const recipe = await engine.generateRecipe(intent);
console.log(recipe);
/*
{
  confidence: 0.95,
  steps: [
    {
      action: "api_call",
      provider: "binance",
      endpoint: "ticker/price",
      params: { symbol: "BTCUSDT" }
    }
  ]
}
*/
```

#### ProviderManager

مدير مقدمي الخدمة للحصول على البيانات من مصادر مختلفة:

```javascript
import { ProviderManager } from 'niascript/providers/provider-manager.js';

const manager = new ProviderManager();

// تسجيل مقدم خدمة
manager.registerProvider('binance', {
  name: 'Binance API',
  baseURL: 'https://api.binance.com/api/v3',
  rateLimits: { requests: 1200, window: 60000 },
  reliability: 0.99
});

// اختيار أفضل مقدم خدمة
const bestProvider = await manager.selectBestProvider('crypto');
```

## 🔧 أمثلة متقدمة

### 1. بناء تطبيق تداول ذكي

```javascript
import { nia, NiaScript } from 'niascript';

class TradingBot {
  constructor() {
    this.nia = new NiaScript();
    this.setupTradingProviders();
  }
  
  setupTradingProviders() {
    // تسجيل مقدمي خدمة التداول
    this.nia.registerProvider('trading', 'binance_trading', {
      name: 'Binance Trading API',
      baseURL: 'https://api.binance.com/api/v3',
      authentication: 'apikey',
      permissions: ['spot_trading']
    });
  }
  
  async analyzeMarket(query) {
    // تحليل السوق باستخدام اللغة الطبيعية
    return await this.nia.processIntent(query);
  }
  
  async executeTrade(command) {
    // تنفيذ أوامر التداول
    return await this.nia.ask(command);
  }
}

// الاستخدام
const bot = new TradingBot();
const analysis = await bot.analyzeMarket("What's the trend for Bitcoin in the last week?");
console.log(analysis);
```

### 2. نظام استشارات مالية

```javascript
class FinancialAdvisor {
  constructor() {
    this.client = new NiaScript();
    this.setupFinancialProviders();
  }
  
  async getPortfolioAdvice(userQuery) {
    // معالجة استعلامات المحفظة الاستثمارية
    const advice = await this.client.ask(userQuery);
    
    // حفظ التفضيلات
    await this.client.remember(`User interested in: ${userQuery}`);
    
    return advice;
  }
  
  async compareInvestments(assets) {
    const comparison = await this.client.ask(
      `Compare performance of ${assets.join(', ')} over the last year`
    );
    return comparison;
  }
}

// الاستخدام
const advisor = new FinancialAdvisor();
const advice = await advisor.getPortfolioAdvice(
  "Should I invest in tech stocks or cryptocurrency?"
);
```

### 3. تطبيق تحليل السوق

```javascript
class MarketAnalyzer {
  constructor() {
    this.analyzer = new NiaScript();
    this.setupAnalysisProviders();
  }
  
  setupAnalysisProviders() {
    // إعداد مقدمي خدمة التحليل
    this.analyzer.registerProvider('analysis', 'technical_analysis', {
      name: 'Technical Analysis Service',
      baseURL: 'https://api.technicalanalysis.com',
      features: ['RSI', 'MACD', 'Bollinger Bands']
    });
  }
  
  async getTechnicalAnalysis(symbol) {
    return await this.analyzer.ask(
      `Provide technical analysis for ${symbol} including RSI and MACD`
    );
  }
  
  async getMarketSentiment(query) {
    return await this.analyzer.processIntent(
      `What's the market sentiment for ${query}?`
    );
  }
}
```

## ⚙️ الإعدادات والتكوين

### متغيرات البيئة

```bash
# مفاتيح API
OPENAI_API_KEY=your_openai_key_here
BINANCE_API_KEY=your_binance_key_here
ALPHA_VANTAGE_KEY=your_alphavantage_key_here

# إعدادات النظام
NIA_LOG_LEVEL=info
NIA_MEMORY_SIZE=1000
NIA_CACHE_TTL=300
```

### ملف الإعدادات

```javascript
// nia.config.js
export default {
  logging: {
    level: 'info',
    output: 'console'
  },
  memory: {
    maxSize: 1000,
    ttl: 86400000 // 24 hours
  },
  providers: {
    defaultTimeout: 5000,
    retryAttempts: 3
  }
};
```

## 🧪 الاختبار

### تشغيل الاختبارات

```bash
# تشغيل جميع الاختبارات
npm test

# تشغيل اختبار معين
npm test -- --testNamePattern="IntentParser"

# تشغيل مع التغطية
npm test -- --coverage
```

### كتابة اختبارات مخصصة

```javascript
import { nia, NiaScript } from 'niascript';

describe('Custom NiaScript Tests', () => {
  let niaInstance;
  
  beforeEach(() => {
    niaInstance = new NiaScript();
  });
  
  test('should parse Bitcoin price query', async () => {
    const result = await nia`Bitcoin price`;
    expect(result).toContain('BTC');
    expect(result).toContain('USD');
  });
  
  test('should handle investment calculations', async () => {
    const result = await nia`$1000 at 5% for 3 years`;
    expect(result).toMatch(/\$1,157/);
  });
});
```

## 🛠️ النشر والإنتاج

### البناء للإنتاج

```bash
# بناء المشروع
npm run build

# إنشاء التوثيق
npm run docs
```

### مراقبة الأداء

```javascript
// إعداد مراقبة الأداء
nia.onError((error, context) => {
  console.error('NiaScript Error:', error);
  // إرسال للخدمة المراقبة
  monitoring.reportError(error, context);
});

// تتبع الاستخدام
nia.onSuccess((result, query) => {
  analytics.trackUsage({
    query,
    result,
    timestamp: Date.now()
  });
});
```

## 🤝 المساهمة

نرحب بالمساهمات! يرجى اتباع الخطوات التالية:

1. فرق المستودع (Fork)
2. أنشئ فرع للميزة (`git checkout -b feature/amazing-feature`)
3. اكتب الاختبارات للكود الجديد
4. تأكد من نجاح جميع الاختبارات (`npm test`)
5. ارفع التغييرات (`git commit -m 'Add amazing feature'`)
6. ادفع للفرع (`git push origin feature/amazing-feature`)
7. افتح Pull Request

## 📄 الترخيص

هذا المشروع مرخص تحت رخصة MIT - انظر ملف [LICENSE](LICENSE) للتفاصيل.

## 👨‍💻 المطور

**Brahim BIDI**

- GitHub: [@brahimbidi](https://github.com/brahimbidi)
- Email: brahim.bidi@example.com

## 🙏 شكر وتقدير

- شكر خاص لجميع المساهمين في المشروع
- مكتبات JavaScript المستخدمة: axios, chalk, inquirer, openai
- مجتمع Node.js للدعم والإلهام

---

**NiaScript - برمجة بالنوايا للعصر الذكي** 🚀