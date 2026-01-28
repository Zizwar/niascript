# NiaScript Flow 2.0

## نظام التدفق الذكي - الثورة في البرمجة بالنوايا

### ما الجديد؟

NiaScript Flow 2.0 هو تطوير ثوري يقدم **البرمجة بالنوايا المتسلسلة** (Chainable Intents) مع استراتيجية **المحلي أولاً** (Local-First) لتوفير التكاليف.

## المميزات الرئيسية

### 1. المحلي أولاً (Local-First) - مجاني 100%

```javascript
import { NiaFlow } from 'niascript';

const nia = new NiaFlow();

// حسابات مجانية بدون API
nia.calc('100 + 50 * 2');                    // 200
nia.calc('2^10');                             // 1024
nia.calc('15% من 200');                       // 30
nia.calc('خصم 30% من 1000');                  // $700
nia.calc('1000$ @ 8% لمدة 5 سنوات');          // $1,469.33
nia.calc('100 دولار للريال');                 // 375
nia.calc('استثمار 10000 ربح 15000');          // 50% ROI
```

### 2. سلسلة النوايا (Pipeline)

```javascript
// الطريقة القديمة (3 استدعاءات API)
const btc = await nia.process('سعر البيتكوين');
const sar = await nia.process(`حول ${btc} للريال`);
const tax = await nia.process(`احسب 10% من ${sar}`);

// الطريقة الجديدة (استدعاء واحد!)
const result = await nia.intent`سعر البيتكوين`
  .pipe`حوله للريال`
  .pipe`احسب 10% منه`
  .run();
```

### 3. التنفيذ المتوازي (Parallel)

```javascript
const [btc, eth, sol] = await nia.parallel(
  nia.calc('1000$ @ 5% لمدة 10 سنوات'),
  nia.calc('2000$ @ 8% لمدة 5 سنوات'),
  nia.calc('500$ @ 12% لمدة 3 سنوات')
);
```

### 4. الكاش الذكي (Smart Cache)

```javascript
// أول مرة: يحسب
await nia.process('1000$ @ 8% لمدة 5 سنوات'); // ~1ms

// ثاني مرة: من الكاش!
await nia.process('1000$ @ 8% لمدة 5 سنوات'); // ~0ms
```

### 5. تتبع الإحصائيات

```javascript
const stats = nia.getStats();
// {
//   totalRequests: 10,
//   localHits: 7,      // 70% محلي!
//   cacheHits: 2,
//   apiCalls: 1,
//   efficiency: '90%',
//   totalCost: '$0.00001'
// }
```

## الاستخدام السريع

### التثبيت

```bash
npm install niascript
```

### الاستخدام

```javascript
import { NiaFlow, flow } from 'niascript';

// طريقة 1: كلاس
const nia = new NiaFlow({
  apiKey: process.env.OPENROUTER_API_KEY,
  model: 'openai/gpt-4.1-mini' // أرخص موديل
});

// طريقة 2: Template Literals
flow.config({ apiKey: 'your-key' });

const result = await flow`ما هي عاصمة فرنسا؟`;
```

## الموديلات المدعومة

| الموديل | الاستخدام | التكلفة |
|---------|----------|---------|
| `openai/gpt-4.1-mini` | الأرخص | ~$0.00001/req |
| `anthropic/claude-3-haiku` | سريع | ~$0.00025/req |
| `openai/gpt-4o-mini` | متوازن | ~$0.00015/req |
| `deepseek/deepseek-chat` | ذكي | ~$0.00014/req |

## الأنماط المدعومة محلياً (مجاني)

| النمط | المثال |
|-------|--------|
| عمليات رياضية | `100 + 50 * 2`, `2^10` |
| نسبة مئوية | `15% من 200` |
| خصم | `خصم 30% من 1000` |
| فائدة مركبة | `1000$ @ 8% لمدة 5 سنوات` |
| تحويل عملات | `100 دولار للريال` |
| ROI | `استثمار 10000 ربح 15000` |

## تشغيل الـ Demo

```bash
# اختبار شامل
npm run demo:flow

# اختبار محلي فقط
npm run demo:local
```

## البنية

```
src/
├── core/
│   ├── nia-flow.js    # النواة الجديدة (Flow 2.0)
│   └── nia-ai.js      # النواة القديمة (للتوافقية)
└── index.js           # التصدير الرئيسي

examples/
├── flow-demo.js       # أمثلة Flow 2.0
└── demo-local.js      # أمثلة محلية
```

## الفرق بين القديم والجديد

| الميزة | NiaAI (القديم) | NiaFlow (الجديد) |
|--------|---------------|-----------------|
| الحسابات المحلية | محدودة | شاملة ومجانية |
| Pipeline | لا | نعم |
| Caching | لا | نعم (ذكي) |
| التوازي | لا | نعم |
| تتبع التكلفة | بسيط | مفصل |
| الأنماط العربية | محدود | كامل |

## الترخيص

MIT
