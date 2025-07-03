export class AIPluginGenerator {
  constructor(aiModel, pluginManager) {
    this.ai = aiModel;
    this.pluginManager = pluginManager;
    this.templates = {
      api_service: {
        name: "api_service_template",
        description: "Template for creating API-based plugins",
        triggers: ["api", "service", "web", "خدمة", "واجهة"],
        providers: {
          "service_provider": {
            baseURL: "${API_BASE_URL}",
            auth: { type: "apikey", key: "${API_KEY}" },
            endpoints: {
              "main": "${MAIN_ENDPOINT}"
            }
          }
        },
        recipes: {
          "api_call": {
            confidence: 0.9,
            steps: [
              {
                action: "api_call",
                provider: "service_provider",
                endpoint: "main",
                params: "${request_params}",
                assign_to: "api_result"
              },
              {
                action: "format_response",
                template: "${formatted_response}",
                return: true
              }
            ]
          }
        }
      },
      
      data_processor: {
        name: "data_processor_template", 
        description: "Template for creating data processing plugins",
        triggers: ["process", "analyze", "data", "معالجة", "تحليل", "بيانات"],
        customActions: {
          "process_data": "async (params) => { /* Data processing logic */ }"
        },
        recipes: {
          "process": {
            confidence: 0.85,
            steps: [
              {
                action: "process_data",
                data: "${input_data}",
                assign_to: "processed_result"
              },
              {
                action: "format_response",
                template: "${processed_result}",
                return: true
              }
            ]
          }
        }
      },
      
      utility_tool: {
        name: "utility_tool_template",
        description: "Template for creating utility plugins",
        triggers: ["tool", "utility", "helper", "أداة", "مساعد"],
        customActions: {
          "utility_function": "async (params) => { /* Utility logic */ }"
        },
        recipes: {
          "execute": {
            confidence: 0.8,
            steps: [
              {
                action: "utility_function",
                params: "${input_params}",
                assign_to: "utility_result"
              },
              {
                action: "format_response",
                template: "${utility_result}",
                return: true
              }
            ]
          }
        }
      }
    };
  }

  async generatePlugin(description, options = {}) {
    try {
      const prompt = this.buildGenerationPrompt(description, options);
      
      // إذا كان لدينا AI model، نستخدمه، وإلا نستخدم القوالب
      if (this.ai && typeof this.ai.generate === 'function') {
        const response = await this.ai.generate(prompt);
        return this.parseAIResponse(response);
      } else {
        return await this.generateFromTemplate(description, options);
      }
      
    } catch (error) {
      console.error('Error generating plugin:', error);
      throw error;
    }
  }

  buildGenerationPrompt(description, options) {
    const existingPlugins = this.pluginManager.listPlugins()
      .map(p => `${p.name}: ${p.description}`)
      .join('\n');

    return `
أنشئ إضافة NiaScript للوصف التالي:
"${description}"

معلومات السياق:
- الإضافات الموجودة: ${existingPlugins}
- اللغة المطلوبة: ${options.language || 'العربية والانجليزية'}
- نوع الإضافة: ${options.type || 'تلقائي'}

استخدم هذا الشكل بالضبط:
{
  "name": "اسم_الإضافة_بالانجليزية",
  "version": "1.0.0", 
  "description": "وصف ما تفعله الإضافة",
  "author": "AI Generated",
  "triggers": ["أنماط التحفيز بالعربية والانجليزية"],
  "providers": {
    "اسم_المزود": {
      "baseURL": "رابط API إن وجد",
      "auth": {"type": "apikey", "key": "\${API_KEY}"},
      "endpoints": {"action": "/endpoint"}
    }
  },
  "recipes": {
    "اسم_الوصفة": {
      "confidence": 0.95,
      "steps": [
        {
          "action": "api_call أو custom action",
          "provider": "اسم_المزود",
          "params": {},
          "assign_to": "النتيجة"
        },
        {
          "action": "format_response",
          "template": "قالب النتيجة",
          "return": true
        }
      ]
    }
  },
  "customActions": {
    "اسم_الدالة": "وصف الدالة"
  }
}

تأكد من:
- الاسم بالانجليزية وبدون مسافات ورموز خاصة
- المحفزات تشمل العربية والانجليزية
- الخطوات منطقية ومتسلسلة
- دعم أخطاء التشغيل
- استخدام متغيرات مناسبة مثل \${query}, \${text}, \${params}
`;
  }

  parseAIResponse(response) {
    try {
      // استخراج JSON من الاستجابة
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in AI response');
      }
      
      const plugin = JSON.parse(jsonMatch[0]);
      
      // التحقق من صحة الإضافة
      this.validateGeneratedPlugin(plugin);
      
      // تحويل customActions من strings إلى functions
      if (plugin.customActions) {
        plugin.customActions = this.parseCustomActions(plugin.customActions);
      }
      
      return plugin;
      
    } catch (error) {
      console.error('Error parsing AI response:', error);
      throw new Error(`Failed to parse AI-generated plugin: ${error.message}`);
    }
  }

  async generateFromTemplate(description, options) {
    // تحديد أفضل قالب بناءً على الوصف
    const templateType = this.selectBestTemplate(description);
    const template = this.templates[templateType];
    
    if (!template) {
      throw new Error(`Template not found: ${templateType}`);
    }
    
    // إنشاء الإضافة من القالب
    const plugin = this.customizeTemplate(template, description, options);
    
    return plugin;
  }

  selectBestTemplate(description) {
    const lowerDesc = description.toLowerCase();
    
    // تحليل بسيط للوصف لتحديد نوع القالب
    if (lowerDesc.includes('api') || lowerDesc.includes('خدمة') || lowerDesc.includes('web')) {
      return 'api_service';
    } else if (lowerDesc.includes('process') || lowerDesc.includes('analyze') || lowerDesc.includes('معالجة') || lowerDesc.includes('تحليل')) {
      return 'data_processor';
    } else {
      return 'utility_tool';
    }
  }

  customizeTemplate(template, description, options) {
    // إنشاء نسخة من القالب
    const plugin = JSON.parse(JSON.stringify(template));
    
    // تخصيص الإضافة
    plugin.name = this.generatePluginName(description);
    plugin.description = description;
    plugin.triggers = this.generateTriggers(description);
    
    // إضافة وصفات مخصصة
    if (plugin.customActions) {
      plugin.customActions = this.generateCustomActions(description, options);
    }
    
    return plugin;
  }

  generatePluginName(description) {
    // استخراج الكلمات المفتاحية وتحويلها لاسم
    const keywords = description
      .toLowerCase()
      .replace(/[^a-zA-Z0-9\u0600-\u06FF\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 2)
      .slice(0, 3);
    
    // تحويل الكلمات العربية إلى انجليزية بسيطة
    const translations = {
      'طقس': 'weather',
      'ترجمة': 'translation', 
      'بريد': 'email',
      'ملف': 'file',
      'بحث': 'search',
      'حساب': 'calculator',
      'وقت': 'time',
      'تاريخ': 'date',
      'صورة': 'image'
    };
    
    const englishKeywords = keywords.map(word => 
      translations[word] || word.replace(/[\u0600-\u06FF]/g, 'custom')
    );
    
    return englishKeywords.join('_').toLowerCase().replace(/[^a-z0-9_]/g, '');
  }

  generateTriggers(description) {
    const triggers = [];
    const words = description.toLowerCase().split(/\s+/);
    
    // إضافة الكلمات المفتاحية كمحفزات
    words.forEach(word => {
      if (word.length > 3) {
        triggers.push(new RegExp(word, 'i'));
      }
    });
    
    // إضافة أنماط شائعة
    if (description.includes('طقس') || description.includes('weather')) {
      triggers.push(/weather|طقس|درجة حرارة/i);
    }
    
    if (description.includes('ترجم') || description.includes('translate')) {
      triggers.push(/translate|ترجم|translation/i);
    }
    
    if (description.includes('بحث') || description.includes('search')) {
      triggers.push(/search|بحث|find|ابحث/i);
    }
    
    return triggers.slice(0, 5); // أقصى 5 محفزات
  }

  generateCustomActions(description, options) {
    const actions = {};
    
    // إنشاء دالة أساسية بناءً على الوصف
    const mainActionName = this.generateActionName(description);
    
    actions[mainActionName] = async (params) => {
      // دالة عامة قابلة للتخصيص
      console.log(`Executing ${mainActionName} with params:`, params);
      
      // منطق أساسي حسب نوع الإضافة
      if (description.includes('حساب') || description.includes('calculate')) {
        return this.performCalculation(params);
      } else if (description.includes('تنسيق') || description.includes('format')) {
        return this.performFormatting(params);
      } else {
        return {
          success: true,
          result: `تم تنفيذ ${mainActionName} بنجاح`,
          timestamp: new Date().toISOString()
        };
      }
    };
    
    // إضافة دوال مساعدة
    actions.validate_input = async (params) => {
      return params && Object.keys(params).length > 0;
    };
    
    actions.format_output = async (params) => {
      return JSON.stringify(params.data, null, 2);
    };
    
    return actions;
  }

  generateActionName(description) {
    const words = description
      .toLowerCase()
      .replace(/[^a-zA-Z\u0600-\u06FF\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 2)
      .slice(0, 2);
    
    return words.map(word => {
      // تحويل بعض الكلمات العربية
      const translations = {
        'حساب': 'calculate',
        'تنسيق': 'format',
        'معالجة': 'process',
        'تحليل': 'analyze',
        'تحويل': 'convert'
      };
      
      return translations[word] || word;
    }).join('_') || 'execute_action';
  }

  performCalculation(params) {
    // منطق حساب بسيط
    const { numbers, operation = 'sum' } = params;
    
    if (!Array.isArray(numbers)) {
      return { error: 'Numbers array required' };
    }
    
    let result;
    switch (operation) {
      case 'sum':
        result = numbers.reduce((a, b) => a + b, 0);
        break;
      case 'average':
        result = numbers.reduce((a, b) => a + b, 0) / numbers.length;
        break;
      case 'max':
        result = Math.max(...numbers);
        break;
      case 'min':
        result = Math.min(...numbers);
        break;
      default:
        result = numbers.reduce((a, b) => a + b, 0);
    }
    
    return {
      success: true,
      operation,
      input: numbers,
      result,
      timestamp: new Date().toISOString()
    };
  }

  performFormatting(params) {
    // منطق تنسيق بسيط
    const { text, format = 'clean' } = params;
    
    if (!text) {
      return { error: 'Text required' };
    }
    
    let result;
    switch (format) {
      case 'uppercase':
        result = text.toUpperCase();
        break;
      case 'lowercase':
        result = text.toLowerCase();
        break;
      case 'clean':
        result = text.trim().replace(/\s+/g, ' ');
        break;
      case 'reverse':
        result = text.split('').reverse().join('');
        break;
      default:
        result = text.trim();
    }
    
    return {
      success: true,
      format,
      input: text,
      result,
      timestamp: new Date().toISOString()
    };
  }

  parseCustomActions(actionsObj) {
    const parsedActions = {};
    
    for (const [name, code] of Object.entries(actionsObj)) {
      if (typeof code === 'string') {
        try {
          // تحويل الكود النصي إلى دالة (بحذر شديد)
          if (code.startsWith('async (')) {
            parsedActions[name] = eval(`(${code})`);
          } else {
            // دالة افتراضية إذا فشل التحويل
            parsedActions[name] = async (params) => {
              console.log(`Custom action ${name} executed with:`, params);
              return { success: true, action: name, params };
            };
          }
        } catch (error) {
          console.warn(`Failed to parse custom action ${name}:`, error);
          // دالة احتياطية
          parsedActions[name] = async (params) => {
            return { success: false, error: `Failed to execute ${name}` };
          };
        }
      } else if (typeof code === 'function') {
        parsedActions[name] = code;
      }
    }
    
    return parsedActions;
  }

  validateGeneratedPlugin(plugin) {
    const errors = [];
    
    if (!plugin.name) errors.push('Plugin name is required');
    if (!plugin.version) errors.push('Plugin version is required');
    if (!plugin.triggers) errors.push('Plugin triggers are required');
    if (!Array.isArray(plugin.triggers)) errors.push('Triggers must be an array');
    
    if (plugin.recipes) {
      Object.entries(plugin.recipes).forEach(([name, recipe]) => {
        if (!recipe.steps || !Array.isArray(recipe.steps)) {
          errors.push(`Recipe ${name} must have steps array`);
        }
        if (typeof recipe.confidence !== 'number') {
          errors.push(`Recipe ${name} must have numeric confidence`);
        }
      });
    }
    
    if (errors.length > 0) {
      throw new Error(`Generated plugin validation failed: ${errors.join(', ')}`);
    }
  }

  async generateMultiplePlugins(descriptions, options = {}) {
    const plugins = [];
    const errors = [];
    
    for (const description of descriptions) {
      try {
        const plugin = await this.generatePlugin(description, options);
        plugins.push(plugin);
      } catch (error) {
        errors.push({ description, error: error.message });
      }
    }
    
    return { plugins, errors };
  }

  getAvailableTemplates() {
    return Object.keys(this.templates);
  }

  getTemplate(templateName) {
    return this.templates[templateName];
  }

  addTemplate(name, template) {
    this.templates[name] = template;
  }

  removeTemplate(name) {
    delete this.templates[name];
  }
}