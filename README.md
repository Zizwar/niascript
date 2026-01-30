# NiaScript

**البرمجة بالنوايا - اكتب ما تريد، لا كيف تريد**

NiaScript هي مكتبة JavaScript ثورية تمكّنك من البرمجة باستخدام اللغة الطبيعية. بدلاً من كتابة كود معقد، اكتب نيتك وسيتولى NiaScript الباقي.

```javascript
import { nia } from 'niascript';

// بهذه البساطة!
const price = await nia`سعر البيتكوين`;
const news = await nia`5 أخبار تقنية من Hacker News`;
const analysis = await nia`حلل ${price} مع ${news}`;
```

## المميزات

- **Tagged Template Literals** - اكتب النوايا كجزء طبيعي من JavaScript
- **معالجة محلية** - الحسابات والتاريخ والتحويلات بدون API
- **ذكاء اصطناعي** - OpenRouter لأي شيء أعقد
- **توليد الكود** - ولّد سكريبتات كاملة من النوايا
- **نظام وكلاء** - وكلاء متخصصون للتخطيط والبناء والتدقيق
- **كاش ذكي** - أداء عالٍ بتكلفة منخفضة

## التثبيت

```bash
npm install niascript
```

## البدء السريع

### 1. النوايا البسيطة

```javascript
import { nia } from 'niascript';

// حسابات (محلية - بدون API)
const calc = await nia`احسب 25 * 4`;
console.log(calc.value); // 100

// التاريخ والوقت (محلي)
const date = await nia`ما هو التاريخ اليوم`;
console.log(date.value); // الأربعاء، 28 يناير 2026

// تحويلات (محلي)
const convert = await nia`حول 100 كيلومتر إلى ميل`;
console.log(convert.value); // 100 كيلومتر = 62.14 ميل

// أي شيء آخر (AI)
const answer = await nia`ما هي عاصمة فرنسا`;
console.log(answer.value); // باريس
```

### 2. الإعدادات

```javascript
import { nia, Nia } from 'niascript';

// الطريقة 1: إعداد عام
nia.setApiKey('sk-or-...');
nia.setModel('openai/gpt-4');

// الطريقة 2: Instance خاص
const n = new Nia({
  apiKey: process.env.OPENROUTER_API_KEY,
  model: 'anthropic/claude-3-opus',
  outputDir: 'my-output'
});

const result = await n.run('سعر البيتكوين');
```

### 3. تركيب المتغيرات

```javascript
const name = 'أحمد';
const age = 25;

// المتغيرات تُدمج تلقائياً
const story = await nia`اكتب قصة قصيرة عن ${name} عمره ${age} سنة`;

// تركيب نتائج سابقة
const btc = await nia`سعر البيتكوين`;
const eth = await nia`سعر الإيثيريوم`;
const compare = await nia`قارن بين ${btc} و ${eth}`;
```

### 4. التنسيقات

```javascript
// JSON مع schema
const colors = await nia`5 ألوان للتصميم`.format('json', {
  colors: 'array'
});
// { colors: ['أزرق', 'أخضر', ...] }

// اختصارات
const data = await nia`بيانات المستخدمين`.json();
const text = await nia`ملخص المقال`.text();
const table = await nia`قائمة الأسعار`.table(); // يطبع جدول
```

### 5. توليد السكريبتات

```javascript
// توليد سكريبت كامل
const script = await nia.generate('سكريبت يجلب أخبار من Hacker News');

console.log(script.value);        // الكود المولد
console.log(script.meta.filepath); // nia-output/scripts/nia-123.js

// تشغيل السكريبت
const output = await nia.execute(script.meta.filepath);
```

### 6. الإحصائيات

```javascript
const stats = nia.stats();
console.log(stats);
// {
//   totalCalls: 10,
//   localCalls: 6,      // بدون API
//   aiCalls: 4,         // مع API
//   cachedCalls: 2,     // من الكاش
//   totalCost: 0.0234,  // بالدولار
//   outputDir: 'nia-output'
// }
```

## الاستخدام المتقدم

### نظام الوكلاء

```javascript
import { createAgentTeam } from 'niascript';

const team = createAgentTeam();

// التخطيط
const plan = await team.planner.think('خطط لتطبيق إدارة مهام');

// البناء
const code = await team.builder.think('اكتب API لإدارة المهام');

// التدقيق
const review = await team.validator.validate(code, 'Node.js API');

// الاختبار
const tests = await team.tester.generateTests(code);
```

### توليد الكود

```javascript
import { NiaCodeGen } from 'niascript';

const codegen = new NiaCodeGen();

// توليد دالة
const fn = await codegen.generateFunction('دالة تحسب الضريبة 15%');

// توليد كلاس
const cls = await codegen.generateClass('كلاس لإدارة سلة التسوق');

// توليد API
const api = await codegen.generateAPI('API لإدارة المستخدمين مع CRUD');
```

## الهيكل

```
niascript/
├── src/
│   ├── core/
│   │   ├── nia.js           # النواة الموحدة
│   │   ├── nia-agents.js    # نظام الوكلاء
│   │   └── nia-codegen.js   # توليد الكود
│   ├── server.js            # خادم Dashboard + API
│   └── index.js             # المصدرات
├── nia-output/              # الملفات المولدة
│   ├── scripts/
│   ├── logs/
│   └── cache/
└── examples/
    └── demo-new.js          # مثال شامل
```

## متغيرات البيئة

```bash
# .env
OPENROUTER_API_KEY=sk-or-...    # مفتاح OpenRouter (مطلوب للـ AI)
NIA_MODEL=openai/gpt-4.1-mini   # الموديل الافتراضي
NIA_OUTPUT_DIR=nia-output       # مجلد الإخراج
NIA_DEBUG=true                  # وضع التصحيح
```

## الأمثلة

### مثال 1: متتبع أسعار العملات

```javascript
import { nia } from 'niascript';

async function trackCrypto() {
  const btc = await nia`سعر البيتكوين`;
  const eth = await nia`سعر الإيثيريوم`;

  console.log('BTC:', btc.value);
  console.log('ETH:', eth.value);

  const analysis = await nia`
    حلل السوق بناءً على:
    - بيتكوين: ${btc}
    - إيثيريوم: ${eth}
    أعطني توصية قصيرة
  `.json({ recommendation: 'string', risk: 'string' });

  console.log('التوصية:', analysis.recommendation);
}
```

### مثال 2: مولد التقارير

```javascript
import { nia } from 'niascript';

async function generateReport(data) {
  // تحليل البيانات
  const summary = await nia`لخص هذه البيانات: ${JSON.stringify(data)}`;

  // توليد التقرير
  const report = await nia.generate(`
    سكريبت يولد تقرير PDF يحتوي على:
    ${summary}
  `);

  // تشغيل المولد
  await nia.execute(report.meta.filepath);
}
```

### مثال 3: الدردشة الذكية

```javascript
import { nia } from 'niascript';

const context = [];

async function chat(message) {
  context.push({ role: 'user', content: message });

  const response = await nia`
    السياق: ${JSON.stringify(context)}
    الرسالة الجديدة: ${message}
    أجب بشكل طبيعي ومفيد
  `;

  context.push({ role: 'assistant', content: response.value });
  return response.value;
}

// استخدام
await chat('مرحبا!');
await chat('ما هو الذكاء الاصطناعي؟');
await chat('أعطني مثال عملي');
```

### 7. لوحة التحكم (Dashboard)

```bash
# تشغيل الخادم
npm run server

# أو عبر PM2
npm run pm2:start
```

افتح `http://localhost:3003` للوصول للوحة التحكم:

- **Run Intent** - تنفيذ نوايا مباشرة (محلي + AI)
- **Generate Script** - إنشاء سكريبتات من النوايا مع عرض الكود بـ syntax highlighting
- **NIA Editor** - محرر كود NIA متقدم (CodeMirror) مع حفظ وتشغيل
- **Scripts Browser** - تصفح وتشغيل وحذف السكريبتات
- **Settings** - اختيار الموديل وتبديل الوضع (نهاري/ليلي)

#### اختيار الموديل

يمكنك تغيير موديل الذكاء الاصطناعي مباشرة من لوحة التحكم عبر لوحة Settings. الموديلات المتاحة:

| الموديل | الوصف |
|---------|-------|
| `openai/gpt-4.1-mini` | الافتراضي - سريع واقتصادي |
| `openai/gpt-4o-mini` | خفيف وسريع |
| `openai/gpt-5-mini` | متقدم |
| `openai/gpt-5.1-codex-mini` | متخصص في الكود |
| `x-ai/grok-4.1-fast` | Grok سريع |
| `x-ai/grok-3-mini` | Grok خفيف |
| `x-ai/grok-code-fast-1` | Grok متخصص في الكود |
| `arcee-ai/coder-large` | متخصص في البرمجة |

يمكنك أيضاً إضافة أي موديل مخصص من OpenRouter عبر حقل "Custom Model" بصيغة `provider/model-name`.

```bash
# عرض الموديلات المتاحة
curl http://localhost:3003/api/models

# تغيير الموديل عبر API
curl -X PUT http://localhost:3003/api/config \
  -H 'Content-Type: application/json' \
  -d '{"model": "x-ai/grok-4.1-fast"}'

# عرض الإعدادات الحالية
curl http://localhost:3003/api/config
```

#### نقاط الاتصال الدائمة (Persistent Endpoints)

كل سكريبت يتم إنشاؤه يحصل على نقطة اتصال دائمة يمكن استدعاؤها لاحقاً من أي مكان:

```bash
# 1. إنشاء سكريبت
curl -X POST http://localhost:3003/api/create \
  -H 'Content-Type: application/json' \
  -d '{"intent": "سكريبت يجلب أخبار Hacker News"}'
# يُرجع: { "id": "nia-1738234567890", "endpoint": "/api/execute/nia-1738234567890", ... }

# 2. تشغيل السكريبت لاحقاً عبر GET (من المتصفح أو curl)
curl http://localhost:3003/api/execute/nia-1738234567890

# أو عبر POST
curl -X POST http://localhost:3003/api/execute/nia-1738234567890
```

يمكنك رؤية رابط نقطة الاتصال لكل سكريبت في لوحة التحكم (تحت كل سكريبت في القائمة وفي نافذة العرض). انقر على الرابط لنسخه.

#### نقاط API الأخرى

```bash
# تنفيذ نية
curl -X POST http://localhost:3003/api/run \
  -H 'Content-Type: application/json' \
  -d '{"intent": "احسب 100 * 55"}'

# عرض جميع السكريبتات
curl http://localhost:3003/api/scripts

# عرض سكريبت محدد (مع الكود والبيانات الوصفية)
curl http://localhost:3003/api/scripts/nia-1738234567890

# الإحصائيات
curl http://localhost:3003/api/stats
```

## CLI

```bash
# تشغيل مباشر
npx niascript "سعر البيتكوين"

# الوضع التفاعلي
npx niascript interactive

# توليد سكريبت
npx niascript generate "سكريبت لجلب الأخبار"
```

## المساهمة

المساهمات مرحب بها! يرجى:

1. عمل Fork للمشروع
2. إنشاء branch للميزة (`git checkout -b feature/amazing`)
3. Commit التغييرات (`git commit -m 'Add amazing feature'`)
4. Push إلى الـ branch (`git push origin feature/amazing`)
5. فتح Pull Request

## الرخصة

MIT License - مشروع مفتوح المصدر

---

**NiaScript - اكتب ما تريد، لا كيف تريد**
