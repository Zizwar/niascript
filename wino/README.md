# WINO - Workspace for Intent-based Experiments
# مساحة العمل التجريبية لـ NiaScript

> هذا المجلد مخصص للتجارب المعقدة والتعديلات الجذرية

---

## للذكاء الاصطناعي: دليل بنية NiaScript التقني

### 1. نظرة عامة على المشروع

```
NiaScript هو نظام برمجة بالنوايا (Intent-Based Programming)
يحول اللغة الطبيعية إلى تنفيذ فعلي أو كود.

الفلسفة: "اكتب ما تريد، لا كيف تفعله"
```

### 2. هيكل المشروع

```
niascript/
├── src/
│   ├── index.js                 # نقطة الدخول الرئيسية - تصدير كل المكونات
│   └── core/
│       ├── nia-flow.js          # [الأساسي] محرك التدفق والنوايا
│       ├── nia-agents.js        # [جديد] نظام الوكلاء المتخصصين
│       ├── nia-codegen.js       # [جديد] توليد الكود من النوايا
│       ├── nia-local-extended.js # [جديد] المحرك المحلي الموسع
│       ├── nia-ai.js            # محرك AI القديم (للتوافقية)
│       └── nia-engine.js        # المحرك القديم (للتوافقية)
├── examples/                    # أمثلة وعروض
├── wino/                        # مساحة التجارب (أنت هنا)
├── bin/                         # CLI
└── test/                        # اختبارات
```

### 3. المكونات الأساسية

#### 3.1 NiaFlow (`nia-flow.js`) - القلب النابض

```javascript
// الاستيراد
import { NiaFlow, flow } from 'niascript';

// الكلاسات:
// - SmartCache: تخزين مؤقت ذكي مع TTL
// - LocalEngine: حسابات محلية بدون API (مجانية)
// - NiaIntent: كائن النية القابل للتسلسل (chainable)
// - NiaFlow: المحرك الرئيسي

// الاستخدام:
const nia = new NiaFlow({ apiKey: 'xxx' });

// حساب محلي (مجاني)
nia.calc('15% من 200');              // → 30
nia.calc('1000$ @ 8% لمدة 5 سنوات'); // → $1,469.33

// سلسلة نوايا
await nia.intent`1000$`.pipe`أضف 10%`.pipe`حوله للريال`.run();

// AI مباشر
await nia.ask('ما هي عاصمة فرنسا؟');

// تنفيذ متوازي
await nia.parallel(intent1, intent2, intent3);
```

#### 3.2 NiaAgents (`nia-agents.js`) - فريق الوكلاء

```javascript
import { createAgentTeam, NiaAgentTeam } from 'niascript';

const team = createAgentTeam({ apiKey: 'xxx' });

// الوكلاء المتاحون:
// - team.planner  → PlannerAgent: تحليل وتخطيط
// - team.builder  → BuilderAgent: كتابة الكود
// - team.validator → ValidatorAgent: تدقيق ومراجعة
// - team.tester   → TestAgent: توليد اختبارات
// - team.orchestrator → OrchestratorAgent: تنسيق الكل

// الدوال الرئيسية:
await team.do('نية معقدة');        // تنفيذ كامل مع كل الوكلاء
await team.build('وصف');           // بناء سريع
await team.plan('نية');            // تخطيط فقط
await team.review(code);           // مراجعة كود
await team.test(code);             // توليد اختبارات
await team.improve(code, 'تعليمات'); // تحسين كود
```

#### 3.3 NiaCodeGen (`nia-codegen.js`) - مولد الكود

```javascript
import { codegen, NiaCodeGen } from 'niascript';

// اختصارات سريعة:
await codegen.func('دالة تتحقق من البريد');
await codegen.class('كلاس لإدارة المستخدمين');
await codegen.api('endpoint لتسجيل الدخول');
await codegen.component('زر React مع loading');
await codegen.script('CLI لتحويل الصور');
await codegen.tests(code);
await codegen.explain(code);
await codegen.fix(code, 'رسالة الخطأ');
await codegen.improve(code, 'اجعله أسرع');
await codegen.convert(code, 'python', 'javascript');
```

#### 3.4 LocalEngineExtended (`nia-local-extended.js`) - بدون API

```javascript
import { LocalEngineExtended } from 'niascript';

const local = new LocalEngineExtended();

// التواريخ
local.tryProcess('كم يوم بين 2024-01-01 و 2024-12-31');
local.tryProcess('أضف 30 يوم إلى اليوم');
local.tryProcess('عمر مولود في 1990-05-15');

// تحويل الوحدات
local.tryProcess('100 km إلى mi');
local.tryProcess('75 كجم إلى رطل');
local.tryProcess('37 مئوية إلى فهرنهايت');
local.tryProcess('1024 mb إلى gb');
local.tryProcess('3600 ثانية إلى ساعة');

// الإحصائيات
local.tryProcess('متوسط 10 20 30 40 50');
local.tryProcess('مجموع 100 200 300');
local.tryProcess('أكبر في 5 2 8 1 9');

// الأرقام
local.tryProcess('مضروب 5');
local.tryProcess('جذر 144');
local.tryProcess('هل 17 أولي');
local.tryProcess('عشوائي بين 1 و 100');

// النصوص
local.tryProcess('طول "مرحبا"');
local.tryProcess('اعكس "Hello"');

// المقارنات
local.tryProcess('هل 50 أكبر من 30');
local.tryProcess('هل 25 بين 10 و 50');
```

### 4. الموديلات المتاحة (عبر OpenRouter)

```javascript
// في NiaFlow
this.models = {
  micro: 'openai/gpt-4.1-mini',        // رخيص جداً
  fast: 'anthropic/claude-3-haiku',    // سريع
  balanced: 'openai/gpt-4o-mini',      // متوازن
  smart: 'openai/gpt-5.1-codex-mini',  // ذكي
  codex: 'openai/gpt-5.1-codex-mini',  // للكود (الافتراضي)
  creative: 'anthropic/claude-3.5-sonnet' // إبداعي
};

// الموديل الافتراضي للوكلاء وتوليد الكود:
// openai/gpt-5.1-codex-mini
```

### 5. متغيرات البيئة

```env
# مطلوب
OPENROUTER_API_KEY=sk-or-v1-xxx

# اختياري
NIA_LOG_LEVEL=info
NIA_DEFAULT_MODEL=fast
```

### 6. أنماط الاستخدام الشائعة

```javascript
// 1. استخدام بسيط
import flow from 'niascript';
const result = await flow`ما هو 2+2؟`;

// 2. حساب محلي
import { flow } from 'niascript';
const calc = flow.calc('15% من 200');

// 3. نظام الوكلاء الكامل
import { createAgentTeam } from 'niascript';
const team = createAgentTeam();
const result = await team.do('اكتب API كامل لإدارة المهام');

// 4. توليد كود
import { codegen } from 'niascript';
const func = await codegen.func('sort array بطريقة فعالة');

// 5. المحرك المحلي الموسع
import { LocalEngineExtended } from 'niascript';
const local = new LocalEngineExtended();
local.tryProcess('تحويل 100 دولار للريال');
```

### 7. هيكل الاستجابة

```javascript
// استجابة ناجحة
{
  success: true,
  result: "النتيجة",
  raw: 123.45,           // القيمة الخام
  type: "نوع العملية",
  source: "local|ai|cache",
  cost: 0.0001,          // التكلفة (AI فقط)
  details: { ... }       // تفاصيل إضافية
}

// استجابة فاشلة
{
  success: false,
  error: "رسالة الخطأ"
}
```

### 8. ملاحظات للتطوير

```
1. المحلي أولاً (Local-First):
   - حاول دائماً الحل محلياً قبل API
   - LocalEngine يوفر 70%+ من الاستدعاءات

2. التسلسل (Chaining):
   - NiaIntent قابل للتسلسل
   - استخدم .pipe() لربط النوايا

3. الكاش (Caching):
   - SmartCache يخزن النتائج مؤقتاً
   - TTL افتراضي: 60 ثانية

4. الوكلاء (Agents):
   - كل وكيل متخصص في مجاله
   - OrchestratorAgent ينسق بينهم
   - يمكن استخدام كل وكيل منفرداً

5. الموديلات:
   - gpt-5.1-codex-mini للكود
   - claude-3-haiku للسرعة
   - claude-3.5-sonnet للإبداع
```

---

## ملفات التجارب

ضع ملفاتك التجريبية هنا. أمثلة:

```
wino/
├── README.md          # هذا الملف
├── exp-001.js         # تجربة 1
├── exp-002.js         # تجربة 2
└── projects/          # مشاريع تجريبية كاملة
```

---

## كيفية التجربة

```bash
# من المجلد الرئيسي
node wino/exp-001.js

# أو مع dotenv
node -r dotenv/config wino/exp-001.js
```

---

*هذا المجلد للتجارب - لا تخف من التعديلات الجذرية!*
