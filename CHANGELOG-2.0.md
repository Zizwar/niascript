# 🚀 NiaScript 2.0 - Changelog

## التحول العميق: من Plugins إلى Pure AI

**التاريخ:** 2025-10-30

---

## 🎯 الفلسفة الجديدة

```
النية هي كل شيء
AI يفهم، يقرر، وينفذ
لا قواعد صارمة - فقط احتمالات وذكاء
```

---

## ✨ التغييرات الرئيسية

### 1. محرك جديد بالكامل

#### ❌ القديم: `nia-engine.js`
- Intent Parser معقد
- Domain Classification صارم
- Plugin Manager
- Plugins مخصصة لكل مجال
- ~2000 سطر

#### ✅ الجديد: `nia-ai.js`
- AI فهم مباشر
- Function calling ديناميكي
- لا plugins تقليدية
- أدوات بسيطة وقوية
- ~600 سطر

### 2. الأدوات (Tools)

بدلاً من plugins كاملة، أدوات بسيطة:

```javascript
tools = [
  'fetch_data',   // جلب من APIs
  'calculate',    // حسابات
  'search_web'    // بحث
]
```

AI يقرر متى وكيف يستخدمها.

### 3. دعم Models متعددة

عبر **OpenRouter** - الوصول لـ 400+ نموذج:

- **Claude 3 Haiku** (fast) - $0.25/1M
- **GPT-4o-mini** (balanced) - $0.15/1M
- **Deepseek Chat** (smart) - $0.27/1M
- **Claude 3.5 Sonnet** (creative) - $3/1M

### 4. الترجمة

#### ❌ القديم
```javascript
class TranslationPlugin {
  dictionary = { ... }  // آلاف الكلمات
  complexRules()
}
```

#### ✅ الجديد
```javascript
await nia`ترجم "Hello" للعربية`
// AI يترجم مباشرة
```

### 5. الحسابات المالية

#### ❌ القديم
```javascript
calculateCompoundInterest(p, r, t)
calculateROI(i, r)
calculateMortgage(p, r, t)
// دالة لكل حالة
```

#### ✅ الجديد
```javascript
await nia`استثمار 1000$ بنسبة 8% لمدة 5 سنوات`
// AI يفهم أي سؤال مالي
```

---

## 📁 ملفات جديدة

### Core
- `src/core/nia-ai.js` - المحرك الجديد
- `test/nia-ai.test.js` - اختبارات شاملة

### Examples
- `examples/ai-demo.js` - أمثلة كاملة
- `examples/simple-demo.js` - عرض الفلسفة

### Documentation
- `README-NEW.md` - توثيق كامل
- `CHANGELOG-2.0.md` - هذا الملف

---

## 🧪 الاختبار

```bash
# عرض الفلسفة
npm run demo:simple

# اختبارات بدون API
npm run test:ai

# demo مع OpenRouter (يحتاج API key)
npm run demo:ai:env
```

---

## 📊 المقارنة

| الميزة | القديم | الجديد |
|--------|--------|--------|
| الأسطر | ~2000 | ~600 |
| Plugins | نعم | لا |
| الترجمة | Dictionary | AI |
| الحسابات | دوال محددة | فهم طبيعي |
| Models | OpenAI فقط | 400+ |
| التوسع | صعب | سهل جداً |

---

## 🌱 من ذرة إلى غابة

### ✅ المرحلة 1: الذرة (الحالية)
- Core engine
- 3 أدوات أساسية
- دعم models متعددة
- أمثلة واختبارات

### 🌱 المرحلة 2: البذرة (قريباً)
- أدوات إضافية (database, filesystem)
- Memory system
- Caching ذكي
- Rate limiting

### 🌳 المرحلة 3: الشجرة
- Multi-agent collaboration
- Plugin ecosystem جديد (اختياري)
- Self-improving AI
- Web interface

### 🌲 المرحلة 4: الغابة
- Distributed system
- Community plugins
- Marketplace
- Enterprise features

---

## 💡 لماذا؟

### المشاكل المحلولة

1. **التعقيد**
   - كان: plugin لكل حالة جديدة
   - الآن: AI يفهم أي حالة

2. **الصيانة**
   - كان: كل تحديث يؤثر على كل شيء
   - الآن: أدوات مستقلة

3. **المرونة**
   - كان: قواعد صارمة
   - الآن: احتمالات ذكية

4. **التوسع**
   - كان: إضافة plugin كاملة
   - الآن: إضافة أداة بسيطة

---

## 🚧 Breaking Changes

### API تغير

```javascript
// القديم
import { NiaEngine } from 'niascript';
const nia = new NiaEngine();
await nia.processIntent('سعر البيتكوين');

// الجديد
import { NiaAI } from 'niascript';
const nia = new NiaAI({
  apiKey: 'openrouter-key',
  model: 'fast'
});
await nia.process('سعر البيتكوين');
```

### Environment Variables

```bash
# القديم
OPENAI_API_KEY=...

# الجديد (اختياري)
OPENROUTER_API_KEY=...
OPENAI_API_KEY=...  # لا يزال مدعوماً
```

---

## 📝 Migration Guide

### للمستخدمين الحاليين

1. **Template Literal** - لا تغيير
```javascript
await nia`سؤالك هنا`
// يعمل كما هو
```

2. **للاستخدامات المتقدمة**
```javascript
// القديم
import { NiaEngine } from 'niascript';

// الجديد
import { NiaAI } from 'niascript';
// أو للبساطة
import { nia } from 'niascript';
```

3. **Custom Plugins**
- الـ plugins القديمة لا تعمل
- لكن يمكن تحويلها لـ tools بسيطة
- أو الاعتماد على AI مباشرة

---

## 🙏 شكر

- **المجتمع** - على الملاحظات القيمة
- **OpenRouter** - على الوصول لنماذج متعددة
- **AI Providers** - Anthropic، OpenAI، Deepseek

---

## 🎯 الخلاصة

```javascript
// كل هذا التعقيد...
const oldSystem = {
  intentParser: ...,
  domainClassifier: ...,
  pluginManager: ...,
  plugins: [...]
};

// أصبح...
const newSystem = await nia`ما تريده`;

// بساطة. ذكاء. فعالية. 🚀
```

---

**NiaScript 2.0 - حيث النية هي الكود** 🎯
