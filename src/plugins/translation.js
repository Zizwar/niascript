const translationPlugin = {
  name: "translation",
  version: "1.0.0",
  description: "ترجمة النصوص بين اللغات المختلفة",
  author: "NiaScript Team",
  
  triggers: [
    /translate|ترجم/i,
    /to english|للانجليزية/i,
    /to arabic|للعربية/i,
    /إلى العربية|إلى الانجليزية/i,
    /من العربية|من الانجليزية/i
  ],
  
  providers: {
    google_translate: {
      baseURL: "https://translation.googleapis.com/language/translate/v2",
      auth: { 
        type: "apikey", 
        key: "${GOOGLE_TRANSLATE_KEY}" 
      },
      endpoints: {
        translate: "",
        detect: "/detect"
      },
      rateLimits: { 
        requests: 100, 
        window: 60000 
      },
      cost: 0.001,
      reliability: 0.95
    },
    
    libre_translate: {
      baseURL: "https://libretranslate.de/translate",
      type: "custom",
      endpoints: {
        translate: "",
        detect: "/detect"
      },
      rateLimits: { 
        requests: 5, 
        window: 60000 
      },
      cost: 0,
      reliability: 0.80
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
          action: "determine_target_language",
          query: "${query}",
          source_lang: "${source_lang}",
          assign_to: "target_lang"
        },
        {
          action: "api_call",
          provider: "google_translate",
          endpoint: "translate",
          params: {
            q: "${text}",
            target: "${target_lang}",
            source: "${source_lang}",
            format: "text"
          },
          assign_to: "translation_result"
        },
        {
          action: "format_response",
          template: "الترجمة: ${translation_result.translatedText}",
          return: true
        }
      ],
      fallbacks: [
        {
          provider: "libre_translate",
          confidence: 0.80,
          steps: [
            {
              action: "libre_translate_call",
              text: "${text}",
              source: "${source_lang}",
              target: "${target_lang}",
              assign_to: "libre_result"
            },
            {
              action: "format_response",
              template: "الترجمة: ${libre_result.translatedText}",
              return: true
            }
          ]
        }
      ]
    },
    
    detect_language_only: {
      confidence: 0.85,
      steps: [
        {
          action: "detect_language",
          text: "${text}",
          assign_to: "detected_lang"
        },
        {
          action: "format_response",
          template: "اللغة المكتشفة: ${detected_lang.name} (${detected_lang.code})",
          return: true
        }
      ]
    }
  },
  
  customActions: {
    detect_language: async (params) => {
      const text = params.text;
      
      // كشف اللغة البسيط بناءً على الأحرف
      const arabicRegex = /[\u0600-\u06FF]/;
      const englishRegex = /[a-zA-Z]/;
      
      if (arabicRegex.test(text) && !englishRegex.test(text)) {
        return {
          code: "ar",
          name: "Arabic",
          confidence: 0.9
        };
      } else if (englishRegex.test(text) && !arabicRegex.test(text)) {
        return {
          code: "en", 
          name: "English",
          confidence: 0.9
        };
      } else if (arabicRegex.test(text) && englishRegex.test(text)) {
        // نص مختلط، نحدد الأكثر شيوعاً
        const arabicChars = (text.match(/[\u0600-\u06FF]/g) || []).length;
        const englishChars = (text.match(/[a-zA-Z]/g) || []).length;
        
        if (arabicChars > englishChars) {
          return { code: "ar", name: "Arabic", confidence: 0.7 };
        } else {
          return { code: "en", name: "English", confidence: 0.7 };
        }
      }
      
      // افتراضي - محاولة استخدام API للكشف
      try {
        const response = await fetch('https://libretranslate.de/detect', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            q: text
          })
        });
        
        const result = await response.json();
        return {
          code: result[0].language,
          name: result[0].language.toUpperCase(),
          confidence: result[0].confidence
        };
      } catch (error) {
        // إذا فشل كل شيء، نعيد الانجليزية كافتراضي
        return {
          code: "en",
          name: "English", 
          confidence: 0.5
        };
      }
    },
    
    determine_target_language: async (params) => {
      const query = params.query.toLowerCase();
      const sourceLang = params.source_lang;
      
      // استخراج اللغة المستهدفة من الاستعلام
      if (query.includes("للانجليزية") || query.includes("to english")) {
        return "en";
      } else if (query.includes("للعربية") || query.includes("to arabic")) {
        return "ar";
      } else if (query.includes("للفرنسية") || query.includes("to french")) {
        return "fr";
      } else if (query.includes("للألمانية") || query.includes("to german")) {
        return "de";
      } else if (query.includes("للإسبانية") || query.includes("to spanish")) {
        return "es";
      }
      
      // إذا لم نجد لغة محددة، نترجم إلى العكس
      if (sourceLang === "ar") {
        return "en";
      } else if (sourceLang === "en") {
        return "ar";
      }
      
      // افتراضي
      return "en";
    },
    
    libre_translate_call: async (params) => {
      const { text, source, target } = params;
      
      try {
        const response = await fetch('https://libretranslate.de/translate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            q: text,
            source: source,
            target: target,
            format: 'text'
          })
        });
        
        const result = await response.json();
        return {
          translatedText: result.translatedText,
          sourceLanguage: source,
          targetLanguage: target
        };
      } catch (error) {
        throw new Error(`Translation failed: ${error.message}`);
      }
    },
    
    extract_text_from_query: async (params) => {
      const query = params.query;
      
      // استخراج النص المراد ترجمته من الاستعلام
      const patterns = [
        /ترجم[:\s]+(.*?)(?:\s+(?:إلى|للانجليزية|للعربية|to|into))?$/i,
        /translate[:\s]+(.*?)(?:\s+(?:to|into)\s+\w+)?$/i,
        /["'](.*?)["']/g,
        /(?:النص|text)[:\s]+(.*?)$/i
      ];
      
      for (const pattern of patterns) {
        const match = query.match(pattern);
        if (match && match[1]) {
          return match[1].trim();
        }
      }
      
      // إذا لم نجد نمط، نأخذ كل شيء بعد الكلمة الأساسية
      const afterTranslate = query.split(/ترجم|translate/i)[1];
      if (afterTranslate) {
        return afterTranslate.replace(/^[:\s]+/, '').trim();
      }
      
      return query;
    },
    
    get_supported_languages: async () => {
      return {
        ar: "Arabic",
        en: "English", 
        fr: "French",
        de: "German",
        es: "Spanish",
        it: "Italian",
        pt: "Portuguese",
        ru: "Russian",
        zh: "Chinese",
        ja: "Japanese",
        ko: "Korean"
      };
    }
  }
};

export default translationPlugin;