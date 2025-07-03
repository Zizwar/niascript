# نظام الإضافات الذكي لـ NiaScript 🔌🧠

## 📋 المهمة المطلوبة من Claude AI

**مرحباً Claude AI!** 👋  
نريدك أن تطور **نظام إضافات ذكي** لمشروع NiaScript الموجود. هذا النظام يجب أن يجعل المشروع قابلاً للتوسع اللامحدود ومفهوماً للذكاء الاصطناعي.

---

## 🎯 الهدف الرئيسي

تحويل NiaScript من نظام محدود (مالي فقط) إلى منصة عامة تدعم:
- **الترجمة**: `nia\`ترجم للانجليزية: أهلاً بالعالم\``
- **الإيميل**: `nia\`ارسل لبريدي zizwar النص ${translated}\``
- **ملفات**: `nia\`اقرأ ملف data.csv وحلله\``
- **وسائل اجتماعية**: `nia\`اجمع تويتات عن الذكاء الاصطناعي\``
- **أي شيء آخر عبر الإضافات!**

---

## 🏗 المطلوب تطويره

### 1. **مدير الإضافات (PluginManager)**

```javascript
class PluginManager {
  constructor(niaInstance) {
    this.nia = niaInstance;
    this.plugins = new Map();
    this.triggers = new Map();
    this.mcpBridge = null;
  }

  // تثبيت إضافة جديدة
  async install(plugin) {
    // التحقق من صحة الإضافة
    this.validatePlugin(plugin);
    
    // تسجيل المحفزات (الكلمات التي تثير الإضافة)
    plugin.triggers.forEach(trigger => {
      this.triggers.set(trigger, plugin.name);
    });
    
    // إضافة المزودين الجدد
    Object.entries(plugin.providers || {}).forEach(([name, config]) => {
      this.nia.providerManager.registerProvider(name, {
        ...config,
        category: plugin.name
      });
    });
    
    // دمج الوصفات الجديدة
    this.nia.recipeEngine.addPluginTemplates(plugin.name, plugin.recipes);
    
    // حفظ الإضافة
    this.plugins.set(plugin.name, plugin);
    
    console.log(`✅ تم تثبيت الإضافة: ${plugin.name}`);
  }

  // العثور على الإضافة المناسبة للطلب
  findMatchingPlugin(query) {
    for (const [trigger, pluginName] of this.triggers) {
      if (trigger instanceof RegExp && trigger.test(query)) {
        return this.plugins.get(pluginName);
      }
      if (typeof trigger === 'string' && query.includes(trigger)) {
        return this.plugins.get(pluginName);
      }
    }
    return null;
  }
}
```

### 2. **بنية الإضافة الموحدة**

كل إضافة يجب أن تتبع هذا الشكل:

```javascript
const pluginSchema = {
  // معلومات أساسية
  name: "اسم_الإضافة",
  version: "1.0.0",
  description: "وصف ما تفعله الإضافة",
  author: "اسم المطور",
  
  // الكلمات/الأنماط التي تثير هذه الإضافة
  triggers: [
    /translate|ترجم/i,
    /send email|ارسل ايميل/i,
    "كلمة محددة"
  ],
  
  // المزودين الخارجيين (APIs)
  providers: {
    "اسم_المزود": {
      baseURL: "https://api.example.com",
      auth: { type: "apikey", key: "${API_KEY}" },
      endpoints: {
        "action": "/endpoint"
      }
    }
  },
  
  // الوصفات (خطوات التنفيذ)
  recipes: {
    "اسم_الوصفة": {
      confidence: 0.95,
      steps: [
        {
          action: "api_call|calculate|format_response",
          provider: "اسم_المزود",
          params: { /* المعاملات */ },
          assign_to: "اسم_المتغير"
        }
      ]
    }
  },
  
  // دوال مخصصة (اختيارية)
  customActions: {
    "اسم_الدالة": async (params) => {
      // منطق مخصص
      return result;
    }
  }
};
```

---

## 🔧 أمثلة الإضافات المطلوبة

### **إضافة الترجمة**

```javascript
const translationPlugin = {
  name: "translation",
  version: "1.0.0",
  description: "ترجمة النصوص بين اللغات المختلفة",
  
  triggers: [
    /translate|ترجم/i,
    /to english|للانجليزية/i,
    /to arabic|للعربية/i
  ],
  
  providers: {
    google_translate: {
      baseURL: "https://translation.googleapis.com/language/translate/v2",
      auth: { type: "apikey", key: "${GOOGLE_TRANSLATE_KEY}" },
      endpoints: {
        translate: ""
      }
    }
  },
  
  recipes: {
    translate_text: {
      confidence: 0.95,
      steps: [
        {
          action: "detect_language",
          text: "${text}",
          assign_to: "source_lang"
        },
        {
          action: "api_call",
          provider: "google_translate",
          params: {
            q: "${text}",
            target: "${target_lang}",
            source: "${source_lang}"
          },
          assign_to: "translation_result"
        },
        {
          action: "format_response",
          template: "الترجمة: ${translation_result.translatedText}",
          return: true
        }
      ]
    }
  },
  
  customActions: {
    detect_language: async (params) => {
      // كشف اللغة تلقائياً
      const text = params.text;
      // منطق كشف اللغة...
      return "ar"; // مثال
    }
  }
};
```

### **إضافة الإيميل**

```javascript
const emailPlugin = {
  name: "email",
  version: "1.0.0", 
  description: "إرسال واستقبال الإيميلات",
  
  triggers: [
    /send email|ارسل ايميل|ارسل لبريد/i,
    /email to|بريد الى/i
  ],
  
  providers: {
    smtp: {
      type: "custom",
      config: {
        host: "${SMTP_HOST}",
        port: 587,
        auth: {
          user: "${SMTP_USER}",
          pass: "${SMTP_PASS}"
        }
      }
    }
  },
  
  recipes: {
    send_email: {
      confidence: 0.90,
      steps: [
        {
          action: "extract_email_parts",
          query: "${query}",
          assign_to: "email_parts"
        },
        {
          action: "send_smtp_email",
          provider: "smtp",
          params: {
            to: "${email_parts.recipient}",
            subject: "${email_parts.subject}",
            text: "${email_parts.content}"
          },
          assign_to: "send_result"
        },
        {
          action: "format_response",
          template: "✅ تم إرسال الإيميل إلى ${email_parts.recipient}",
          return: true
        }
      ]
    }
  },
  
  customActions: {
    extract_email_parts: async (params) => {
      const query = params.query;
      // استخراج المتلقي والمحتوى من النص
      const recipientMatch = query.match(/لبريدي?\s+(\w+)/);
      const contentMatch = query.match(/النص\s+(.+)/);
      
      return {
        recipient: recipientMatch?.[1] + "@example.com",
        subject: "رسالة من NiaScript",
        content: contentMatch?.[1] || "محتوى الرسالة"
      };
    },
    
    send_smtp_email: async (params) => {
      // منطق إرسال الإيميل عبر SMTP
      console.log("إرسال إيميل إلى:", params.to);
      return { success: true, messageId: "12345" };
    }
  }
};
```

---

## 🤖 تكامل MCP (Model Context Protocol)

### **جسر MCP**

```javascript
class MCPBridge {
  constructor(niaInstance) {
    this.nia = niaInstance;
    this.mcpTools = new Map();
  }
  
  // تسجيل أداة MCP كإضافة
  async registerMCPTool(toolConfig) {
    const plugin = {
      name: `mcp_${toolConfig.name}`,
      version: "1.0.0",
      description: `MCP tool: ${toolConfig.description}`,
      
      triggers: [new RegExp(toolConfig.name, 'i')],
      
      recipes: {
        [toolConfig.name]: {
          confidence: 0.85,
          steps: [
            {
              action: "call_mcp_tool",
              tool: toolConfig.name,
              params: "${extracted_params}",
              assign_to: "mcp_result"
            },
            {
              action: "format_response",
              template: "${mcp_result}",
              return: true
            }
          ]
        }
      },
      
      customActions: {
        call_mcp_tool: async (params) => {
          return await this.executeMCPTool(params.tool, params.params);
        }
      }
    };
    
    await this.nia.pluginManager.install(plugin);
  }
  
  async executeMCPTool(toolName, params) {
    // استدعاء أداة MCP الفعلية
    // هذا سيحتاج تكامل مع MCP client
    console.log(`تنفيذ أداة MCP: ${toolName} بالمعاملات:`, params);
    return "نتيجة من MCP";
  }
}
```

---

## 🧠 نظام توليد الإضافات بالذكاء الاصطناعي

### **مولد الإضافات**

```javascript
class AIPluginGenerator {
  constructor(aiModel) {
    this.ai = aiModel;
  }
  
  async generatePlugin(description) {
    const prompt = `
أنشئ إضافة NiaScript للوصف التالي:
"${description}"

استخدم هذا الشكل بالضبط:
{
  "name": "اسم_الإضافة",
  "triggers": ["أنماط التحفيز"],
  "providers": { "مزود": { "baseURL": "رابط API" } },
  "recipes": {
    "وصفة": {
      "confidence": 0.95,
      "steps": [
        {
          "action": "api_call",
          "provider": "المزود",
          "params": {},
          "assign_to": "النتيجة"
        }
      ]
    }
  }
}

تأكد من:
- الاسم بالانجليزية وبدون مسافات
- المحفزات تشمل العربية والانجليزية
- الخطوات منطقية ومتسلسلة
    `;
    
    const response = await this.ai.generate(prompt);
    return JSON.parse(response);
  }
}

// الاستخدام
const generator = new AIPluginGenerator(aiModel);
const weatherPlugin = await generator.generatePlugin(
  "الحصول على معلومات الطقس لأي مدينة"
);
await nia.pluginManager.install(weatherPlugin);
```

---

## 🔄 تحديث النواة الأساسية

### **تحديث Intent Parser**

```javascript
// إضافة للـ IntentParser الموجود
class EnhancedIntentParser extends IntentParser {
  constructor(pluginManager) {
    super();
    this.pluginManager = pluginManager;
  }
  
  async parseIntent(query) {
    // التحليل الأساسي
    const basicIntent = await super.parseIntent(query);
    
    // البحث عن إضافة مناسبة
    const matchingPlugin = this.pluginManager.findMatchingPlugin(query);
    
    if (matchingPlugin) {
      return {
        ...basicIntent,
        type: 'plugin',
        plugin: matchingPlugin.name,
        confidence: Math.max(basicIntent.confidence, 0.8)
      };
    }
    
    return basicIntent;
  }
}
```

### **تحديث Recipe Engine**

```javascript
// إضافة للـ RecipeEngine الموجود
class EnhancedRecipeEngine extends RecipeEngine {
  constructor() {
    super();
    this.pluginTemplates = new Map();
  }
  
  addPluginTemplates(pluginName, templates) {
    this.pluginTemplates.set(pluginName, templates);
  }
  
  async generateRecipe(intent) {
    if (intent.type === 'plugin') {
      const pluginTemplates = this.pluginTemplates.get(intent.plugin);
      if (pluginTemplates) {
        // استخدام وصفات الإضافة
        return this.createPluginRecipe(intent, pluginTemplates);
      }
    }
    
    // الاستدعاء الأساسي
    return await super.generateRecipe(intent);
  }
  
  createPluginRecipe(intent, templates) {
    // منطق إنشاء وصفة من الإضافة
    const templateName = Object.keys(templates)[0];
    return templates[templateName];
  }
}
```

---

## 📦 أمثلة الاستخدام المطلوبة

بعد التطوير، يجب أن تعمل هذه الأمثلة:

```javascript
// 1. الترجمة
const translated = await nia`ترجم للانجليزية: أهلاً بالعالم مرة أخرى`;
console.log(translated); // "Translation: Hello world again"

// 2. الإيميل
const emailResult = await nia`ارسل لبريدي zizwar النص ${translated}`;
console.log(emailResult); // "✅ تم إرسال الإيميل إلى zizwar@example.com"

// 3. الطقس (بعد إنشاء الإضافة)
const weather = await nia`طقس الرياض اليوم`;
console.log(weather); // "الطقس في الرياض: 25°C، صافي"

// 4. وسائل اجتماعية
const tweets = await nia`اجمع آخر 10 تويتات عن الذكاء الاصطناعي`;
console.log(tweets);

// 5. الملفات
const fileContent = await nia`اقرأ ملف package.json`;
console.log(fileContent);
```

---

## 🎯 تعليمات التطبيق لـ Claude AI

### **الخطوات المطلوبة:**

1. **إنشاء PluginManager** في `src/core/plugin-manager.js`
2. **تحديث index.js** لتشمل نظام الإضافات
3. **إنشاء مجلد** `src/plugins/` للإضافات الأساسية
4. **تطبيق إضافة الترجمة** في `src/plugins/translation.js`
5. **تطبيق إضافة الإيميل** في `src/plugins/email.js`
6. **إنشاء MCPBridge** في `src/core/mcp-bridge.js`
7. **تحديث Safe Executor** لدعم الأعمال المخصصة
8. **إضافة اختبارات** للنظام الجديد

### **التأكد من:**
- ✅ النظام آمن (لا eval())
- ✅ قابل للتوسع (إضافات لا محدودة)
- ✅ مفهوم للـ AI (schema واضح)
- ✅ يدعم العربية والانجليزية
- ✅ يتعامل مع الأخطاء بذكاء
- ✅ يحفظ المعرفة في الذاكرة

### **الملفات الجديدة المطلوبة:**
```
src/
├── core/
│   ├── plugin-manager.js          ← جديد
│   ├── mcp-bridge.js             ← جديد
│   └── ai-plugin-generator.js    ← جديد
├── plugins/
│   ├── translation.js            ← جديد
│   ├── email.js                  ← جديد
│   └── weather.js                ← جديد (مثال)
└── examples/
    └── plugin-demo.js            ← جديد
```

---

## ✨ النتيجة المطلوبة

نظام NiaScript محدث يدعم:
- 🔌 إضافات لا محدودة
- 🤖 تكامل مع MCP
- 🧠 توليد إضافات بالذكاء الاصطناعي  
- 🌍 دعم كامل للعربية
- 🔒 أمان عالي
- 📈 قابلية توسع مطلقة

**ابدأ بتطبيق PluginManager أولاً، ثم إضافة الترجمة كمثال عملي!** 🚀