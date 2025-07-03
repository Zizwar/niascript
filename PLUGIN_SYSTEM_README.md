# 🔌 نظام الإضافات الذكي - NiaScript Plugin System

## 🎯 نظرة عامة

تم تطوير نظام الإضافات الذكي لتحويل NiaScript من نظام محدود للعمليات المالية إلى منصة عامة قابلة للتوسع اللامحدود تدعم أي نوع من الإضافات والخدمات.

## ✨ الميزات الجديدة

### 🔧 النواة الأساسية
- **PluginManager**: إدارة متقدمة للإضافات مع التحقق والتثبيت الآمن
- **Enhanced SafeExecutor**: دعم العمليات المخصصة والشرطية
- **Enhanced RecipeEngine**: دعم قوالب الإضافات والدمج الذكي
- **Enhanced IntentParser**: استخراج ذكي للكيانات وتحليل النية المحسن

### 🧠 الذكاء الاصطناعي
- **AIPluginGenerator**: توليد إضافات تلقائياً من الوصف النصي
- **Template System**: قوالب جاهزة للإضافات الشائعة
- **Smart Entity Extraction**: استخراج ذكي للمعلومات من النصوص

### 🔗 التكامل الخارجي
- **MCP Bridge**: تكامل كامل مع Model Context Protocol
- **Multi-language Support**: دعم متقدم للعربية والإنجليزية
- **API Integration**: تكامل سهل مع أي API خارجي

## 📦 الإضافات المتاحة

### 🌍 إضافة الترجمة (Translation Plugin)
```javascript
await nia`ترجم للانجليزية: أهلاً بالعالم`
// النتيجة: "Hello world"

await nia`translate to Arabic: How are you?`
// النتيجة: "كيف حالك؟"
```

**الميزات:**
- ترجمة بين العربية والإنجليزية
- كشف تلقائي للغة المصدر
- دعم LibreTranslate كخدمة مجانية
- إمكانية التكامل مع Google Translate

### 📧 إضافة الإيميل (Email Plugin)
```javascript
await nia`ارسل لبريدي admin@company.com موضوع: تقرير يومي النص: تم إنجاز المهام`
// النتيجة: "✅ تم إرسال الإيميل إلى admin@company.com"

await nia`send email to support subject: Issue report text: Found a bug`
// النتيجة: "✅ Email sent to support@example.com"
```

**الميزات:**
- إرسال الإيميلات عبر SMTP
- دعم SendGrid API
- قوالب إيميل جاهزة
- استخراج ذكي للمستقبل والمحتوى

### 🔗 إضافات MCP (MCP Plugins)
```javascript
// عمليات الملفات
await nia`read file package.json`
await nia`list directory /home/user`
await nia`write file test.txt content: Hello World`

// البحث في الويب
await nia`search web for latest AI news`
await nia`get page content from https://example.com`

// معلومات الطقس
await nia`weather in London today`
await nia`get forecast for New York`
```

## 🛠️ إنشاء إضافة مخصصة

### 1. الهيكل الأساسي
```javascript
const myPlugin = {
  name: "my_custom_plugin",
  version: "1.0.0",
  description: "وصف الإضافة",
  author: "اسمك",
  
  // الكلمات المحفزة
  triggers: [
    /my-keyword|كلمتي/i,
    "specific phrase"
  ],
  
  // مزودو الخدمات (APIs)
  providers: {
    my_api: {
      baseURL: "https://api.example.com",
      auth: { type: "apikey", key: "${API_KEY}" },
      endpoints: {
        action: "/endpoint"
      }
    }
  },
  
  // وصفات التنفيذ
  recipes: {
    main_action: {
      confidence: 0.9,
      steps: [
        {
          action: "api_call",
          provider: "my_api",
          endpoint: "action",
          params: { query: "${query}" },
          assign_to: "result"
        },
        {
          action: "format_response",
          template: "النتيجة: ${result}",
          return: true
        }
      ]
    }
  },
  
  // دوال مخصصة
  customActions: {
    process_data: async (params) => {
      // منطق معالجة البيانات
      return { processed: true, data: params.input };
    }
  }
};

// تثبيت الإضافة
await nia.installPlugin(myPlugin);
```

### 2. استخدام مولد الإضافات بالذكاء الاصطناعي
```javascript
import { AIPluginGenerator } from './src/core/ai-plugin-generator.js';

const generator = new AIPluginGenerator(null, nia.pluginManager);

// إنشاء إضافة من الوصف
const weatherPlugin = await generator.generatePlugin(
  "الحصول على معلومات الطقس لأي مدينة",
  { type: 'api_service', language: 'العربية والانجليزية' }
);

// تثبيت الإضافة المولدة
await nia.installPlugin(weatherPlugin);
```

## 🔄 العمليات المتقدمة

### العمليات الشرطية
```javascript
const conditionalPlugin = {
  recipes: {
    conditional_action: {
      steps: [
        {
          action: "validate_input",
          input: "${query}",
          assign_to: "is_valid"
        },
        {
          action: "conditional",
          condition: "${is_valid}",
          if_true: [
            {
              action: "process_valid_input",
              input: "${query}",
              assign_to: "result"
            }
          ],
          if_false: [
            {
              action: "format_response",
              template: "البيانات المدخلة غير صحيحة",
              return: true
            }
          ]
        }
      ]
    }
  }
};
```

### العمليات المتوازية
```javascript
const parallelPlugin = {
  recipes: {
    parallel_action: {
      steps: [
        {
          action: "parallel_api_calls",
          calls: [
            {
              provider: "api1",
              endpoint: "data",
              assign_to: "result1"
            },
            {
              provider: "api2", 
              endpoint: "info",
              assign_to: "result2"
            }
          ]
        },
        {
          action: "merge_results",
          inputs: ["${result1}", "${result2}"],
          assign_to: "combined"
        }
      ]
    }
  }
};
```

## 📊 إدارة الإضافات

### عرض الإضافات المثبتة
```javascript
const plugins = nia.listPlugins();
console.log('الإضافات المثبتة:', plugins);
```

### تحميل إضافة من ملف
```javascript
await nia.loadPlugin('./my-plugin.js');
```

### إلغاء تثبيت إضافة
```javascript
await nia.uninstallPlugin('plugin_name');
```

### فحص حالة النظام
```javascript
const stats = nia.recipeEngine.getRecipeStats();
console.log('إحصائيات النظام:', stats);
```

## 🔍 التطوير والاختبار

### تشغيل المثال التوضيحي
```bash
node examples/plugin-demo.js
```

### تشغيل الاختبارات
```bash
npm test
```

### بناء المشروع
```bash
npm run build
```

## 🛡️ الأمان والأداء

### ميزات الأمان
- **تحقق صحة الإضافات**: فحص شامل لبنية الإضافة قبل التثبيت
- **تنفيذ آمن**: لا استخدام لـ `eval()` أو تنفيذ كود غير آمن
- **عزل العمليات**: كل إضافة تعمل في بيئة معزولة
- **التحقق من الأذونات**: فحص صلاحيات الوصول للمصادر

### تحسين الأداء
- **تنفيذ متوازي**: عمليات متعددة في نفس الوقت
- **ذاكرة التخزين المؤقت**: حفظ نتائج الإضافات الشائعة
- **تحسين الوصفات**: دمج العمليات المتتالية
- **تحميل تدريجي**: تحميل الإضافات حسب الحاجة

## 🔮 المستقبل والتطوير

### الميزات القادمة
- **Plugin Store**: متجر إضافات مدمج
- **Visual Plugin Builder**: أداة بصرية لبناء الإضافات
- **Advanced AI Integration**: تكامل متقدم مع نماذج الذكاء الاصطناعي
- **Real-time Collaboration**: تعاون مباشر بين المطورين

### كيفية المساهمة
1. Fork المشروع
2. أنشئ branch جديد للميزة
3. اكتب الاختبارات المناسبة
4. أرسل Pull Request

## 📚 المراجع والتوثيق

- **Claude.md**: الوثائق التفصيلية للمتطلبات
- **API Reference**: مرجع كامل للواجهات البرمجية
- **Plugin Examples**: أمثلة متنوعة للإضافات
- **Best Practices**: أفضل الممارسات في التطوير

## 📞 الدعم والمساعدة

- **GitHub Issues**: للبلاغات والاقتراحات
- **Community Forum**: منتدى المجتمع
- **Documentation**: الوثائق الرسمية
- **Examples**: الأمثلة العملية

---

تم تطوير نظام الإضافات الذكي لـ NiaScript ليكون مرناً وقابلاً للتوسع ومفهوماً للذكاء الاصطناعي. 🚀