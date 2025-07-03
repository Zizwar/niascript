export class IntentParser {
  constructor() {
    this.pluginManager = null;
    this.patterns = {
      financial: {
        price: /(?:price|cost|value)\s+(?:of\s+)?(\w+)|(\w+)\s+(?:price|cost|value)/i,
        compare: /compare\s+(\w+)\s+(?:vs|and|with)\s+(\w+)/i,
        investment: /invest(?:ment)?\s+.*?(\$[\d,]+|\d+\s*(?:dollars?|usd))/i,
        returns: /returns?\s+.*?(\d+%|\d+\s*percent)/i,
        performance: /performance\s+(?:of\s+)?(\w+)(?:\s+(?:over|for|in)\s+(.+?))?/i
      },
      calculations: {
        math: /calculate|compute|what\s+(?:is|will|would)/i,
        compound: /compound|reinvest/i,
        percentage: /(\d+(?:\.\d+)?)\s*%/g,
        currency: /\$?([\d,]+(?:\.\d{2})?)/g,
        timeframe: /(last|past|next|in)\s+(\d+)\s+(day|week|month|year)s?/i
      },
      clarification: {
        ambiguous: ['apple', 'amazon', 'meta', 'microsoft'],
        contexts: {
          apple: ['stock', 'fruit', 'company'],
          amazon: ['stock', 'rainforest', 'company'],
          meta: ['stock', 'facebook', 'company'],
          microsoft: ['stock', 'company', 'software']
        }
      }
    };
  }

  async parseIntent(query) {
    const normalizedQuery = query.toLowerCase().trim();
    
    const intent = {
      type: 'unknown',
      entities: {},
      confidence: 0,
      needsClarification: false,
      clarificationOptions: null
    };

    // Check for plugin patterns first
    if (this.pluginManager) {
      const pluginMatch = this.checkPluginPatterns(normalizedQuery);
      if (pluginMatch && pluginMatch.confidence > 0.7) {
        intent.type = 'plugin';
        intent.plugin = pluginMatch.plugin.name;
        intent.entities = await this.extractPluginEntities(query, pluginMatch.plugin);
        intent.confidence = pluginMatch.confidence;
        return intent;
      }
    }

    // Check for financial patterns
    if (this.isFinancialQuery(normalizedQuery)) {
      intent.type = 'financial';
      intent.entities = this.extractFinancialEntities(normalizedQuery);
      intent.confidence = 0.8;
    }
    
    // Check for calculation patterns
    else if (this.isCalculationQuery(normalizedQuery)) {
      intent.type = 'calculation';
      intent.entities = this.extractCalculationEntities(normalizedQuery);
      intent.confidence = 0.75;
    }

    // Check for ambiguous queries
    const ambiguity = this.checkAmbiguity(normalizedQuery);
    if (ambiguity.isAmbiguous) {
      intent.needsClarification = true;
      intent.clarificationOptions = ambiguity.options;
      intent.confidence = 0.3;
    }

    return intent;
  }

  isFinancialQuery(query) {
    return Object.values(this.patterns.financial).some(pattern => pattern.test(query));
  }

  isCalculationQuery(query) {
    return this.patterns.calculations.math.test(query);
  }

  extractFinancialEntities(query) {
    const entities = {};
    
    // Extract price queries
    const priceMatch = query.match(this.patterns.financial.price);
    if (priceMatch) {
      entities.asset = priceMatch[1] || priceMatch[2];
      entities.operation = 'get_price';
    }

    // Extract comparison queries  
    const compareMatch = query.match(this.patterns.financial.compare);
    if (compareMatch) {
      entities.assets = [compareMatch[1], compareMatch[2]];
      entities.operation = 'compare';
    }

    // Extract investment queries
    const investMatch = query.match(this.patterns.financial.investment);
    if (investMatch) {
      entities.amount = investMatch[1];
      entities.operation = 'investment_calculation';
    }

    // Extract timeframe
    const timeMatch = query.match(this.patterns.calculations.timeframe);
    if (timeMatch) {
      entities.timeframe = {
        direction: timeMatch[1],
        amount: parseInt(timeMatch[2]),
        unit: timeMatch[3]
      };
    }

    return entities;
  }

  extractCalculationEntities(query) {
    const entities = {};
    
    // Extract percentages
    const percentages = [...query.matchAll(this.patterns.calculations.percentage)];
    if (percentages.length > 0) {
      entities.percentages = percentages.map(match => parseFloat(match[1]));
    }

    // Extract currency amounts
    const amounts = [...query.matchAll(this.patterns.calculations.currency)];
    if (amounts.length > 0) {
      entities.amounts = amounts.map(match => parseFloat(match[1].replace(/,/g, '')));
    }

    // Extract timeframe
    const timeMatch = query.match(this.patterns.calculations.timeframe);
    if (timeMatch) {
      entities.timeframe = {
        direction: timeMatch[1],
        amount: parseInt(timeMatch[2]),
        unit: timeMatch[3]
      };
    }

    // Detect compound interest
    if (this.patterns.calculations.compound.test(query)) {
      entities.isCompound = true;
    }

    return entities;
  }

  checkAmbiguity(query) {
    for (const ambiguousWord of this.patterns.clarification.ambiguous) {
      if (query.includes(ambiguousWord.toLowerCase())) {
        return {
          isAmbiguous: true,
          word: ambiguousWord,
          options: this.patterns.clarification.contexts[ambiguousWord] || []
        };
      }
    }
    
    return { isAmbiguous: false };
  }

  // Enhanced intent recognition for specific financial operations
  recognizeFinancialIntent(query) {
    const intent = {
      action: null,
      params: {}
    };

    // Bitcoin/Crypto price patterns
    if (/bitcoin|btc/i.test(query) && /price|value|cost/i.test(query)) {
      intent.action = 'get_crypto_price';
      intent.params.symbol = 'BTC'; 
    }
    
    // Stock price patterns
    else if (/(?:stock|share)\s+price|price.*(?:stock|share)/i.test(query)) {
      const symbolMatch = query.match(/([A-Z]{1,5})\s+(?:stock|share|price)/i);
      if (symbolMatch) {
        intent.action = 'get_stock_price';
        intent.params.symbol = symbolMatch[1].toUpperCase();
      }
    }

    return intent;
  }

  // Plugin integration methods
  setPluginManager(pluginManager) {
    this.pluginManager = pluginManager;
  }

  checkPluginPatterns(query) {
    if (!this.pluginManager) {
      return null;
    }

    return this.pluginManager.findMatchingPlugin(query);
  }

  async extractPluginEntities(query, plugin) {
    const entities = {};

    // Generic entity extraction for plugins
    entities.query = query;
    entities.originalQuery = query;

    // Plugin-specific entity extraction
    if (plugin.name === 'translation') {
      entities.text = this.extractTextForTranslation(query);
      entities.targetLanguage = this.extractTargetLanguage(query);
      entities.sourceLanguage = this.extractSourceLanguage(query);
    } else if (plugin.name === 'email') {
      entities.recipient = this.extractEmailRecipient(query);
      entities.subject = this.extractEmailSubject(query);
      entities.content = this.extractEmailContent(query);
    } else if (plugin.name.startsWith('mcp_')) {
      entities.params = this.extractMCPParameters(query, plugin);
    }

    // Extract common entities
    entities.numbers = this.extractNumbers(query);
    entities.dates = this.extractDates(query);
    entities.urls = this.extractUrls(query);
    entities.mentions = this.extractMentions(query);

    return entities;
  }

  // Translation-specific extraction
  extractTextForTranslation(query) {
    const patterns = [
      /(?:ترجم|translate)[:\s]+(.*?)(?:\s+(?:إلى|للانجليزية|للعربية|to|into))?$/i,
      /["'](.*?)["']/,
      /النص[:\s]+(.*?)$/i,
      /text[:\s]+(.*?)$/i
    ];

    for (const pattern of patterns) {
      const match = query.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }

    // If no specific pattern, try to extract after the trigger word
    const afterTrigger = query.split(/ترجم|translate/i)[1];
    if (afterTrigger) {
      return afterTrigger.replace(/^[:\s]+/, '').trim();
    }

    return query;
  }

  extractTargetLanguage(query) {
    const languagePatterns = {
      'ar': /للعربية|to arabic|إلى العربية/i,
      'en': /للانجليزية|to english|إلى الانجليزية/i,
      'fr': /للفرنسية|to french|إلى الفرنسية/i,
      'de': /للألمانية|to german|إلى الألمانية/i,
      'es': /للإسبانية|to spanish|إلى الإسبانية/i
    };

    for (const [code, pattern] of Object.entries(languagePatterns)) {
      if (pattern.test(query)) {
        return code;
      }
    }

    return null;
  }

  extractSourceLanguage(query) {
    const sourcePatterns = {
      'ar': /من العربية|from arabic/i,
      'en': /من الانجليزية|from english/i,
      'fr': /من الفرنسية|from french/i,
      'de': /من الألمانية|from german/i,
      'es': /من الإسبانية|from spanish/i
    };

    for (const [code, pattern] of Object.entries(sourcePatterns)) {
      if (pattern.test(query)) {
        return code;
      }
    }

    return null;
  }

  // Email-specific extraction
  extractEmailRecipient(query) {
    const patterns = [
      /(?:لبريدي?|to|email)\s+(\S+@\S+\.\S+)/i,
      /(?:لبريدي?|to|email)\s+(\w+)/i,
      /(?:إلى|to)\s+(\S+@\S+\.\S+)/i
    ];

    for (const pattern of patterns) {
      const match = query.match(pattern);
      if (match) {
        let recipient = match[1];
        // Add default domain if not present
        if (!recipient.includes('@')) {
          recipient += '@example.com';
        }
        return recipient;
      }
    }

    return null;
  }

  extractEmailSubject(query) {
    const patterns = [
      /(?:موضوع|subject)[:\s]+(.*?)(?:\n|$)/i,
      /(?:عنوان|title)[:\s]+(.*?)(?:\n|$)/i
    ];

    for (const pattern of patterns) {
      const match = query.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }

    return null;
  }

  extractEmailContent(query) {
    const patterns = [
      /(?:النص|المحتوى|content|message)[:\s]+(.*?)$/i,
      /(?:الرسالة|text)[:\s]+(.*?)$/i,
      /"([^"]+)"/,
      /'([^']+)'/
    ];

    for (const pattern of patterns) {
      const match = query.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }

    return null;
  }

  // MCP-specific extraction
  extractMCPParameters(query, plugin) {
    const params = {};

    // Extract based on plugin type
    if (plugin.name.includes('filesystem')) {
      params.path = this.extractFilePath(query);
      params.content = this.extractFileContent(query);
    } else if (plugin.name.includes('web_search')) {
      params.query = this.extractSearchQuery(query);
      params.limit = this.extractSearchLimit(query);
    } else if (plugin.name.includes('weather')) {
      params.location = this.extractLocation(query);
    }

    return params;
  }

  // Common entity extraction methods
  extractNumbers(query) {
    const numberPattern = /\b\d+(?:\.\d+)?\b/g;
    const matches = query.match(numberPattern);
    return matches ? matches.map(Number) : [];
  }

  extractDates(query) {
    const datePatterns = [
      /\b\d{1,2}\/\d{1,2}\/\d{4}\b/g, // MM/DD/YYYY
      /\b\d{4}-\d{1,2}-\d{1,2}\b/g,   // YYYY-MM-DD
      /\b(?:اليوم|today|غداً|tomorrow|أمس|yesterday)\b/gi
    ];

    const dates = [];
    for (const pattern of datePatterns) {
      const matches = query.match(pattern);
      if (matches) {
        dates.push(...matches);
      }
    }

    return dates;
  }

  extractUrls(query) {
    const urlPattern = /https?:\/\/[^\s]+/g;
    const matches = query.match(urlPattern);
    return matches || [];
  }

  extractMentions(query) {
    const mentionPattern = /@(\w+)/g;
    const matches = [];
    let match;
    
    while ((match = mentionPattern.exec(query)) !== null) {
      matches.push(match[1]);
    }
    
    return matches;
  }

  extractFilePath(query) {
    const pathPatterns = [
      /(?:ملف|file)[:\s]+([^\s]+)/i,
      /(?:مسار|path)[:\s]+([^\s]+)/i,
      /([\/\\]?[\w\-_\.\/\\]+\.[\w]+)/
    ];

    for (const pattern of pathPatterns) {
      const match = query.match(pattern);
      if (match) {
        return match[1];
      }
    }

    return null;
  }

  extractFileContent(query) {
    const contentPatterns = [
      /(?:محتوى|content)[:\s]+(.*?)$/i,
      /(?:نص|text)[:\s]+(.*?)$/i
    ];

    for (const pattern of contentPatterns) {
      const match = query.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }

    return null;
  }

  extractSearchQuery(query) {
    const searchPatterns = [
      /(?:ابحث عن|search for|بحث)[:\s]+(.*?)$/i,
      /(?:اجمع|find|gather)[:\s]+(.*?)$/i
    ];

    for (const pattern of searchPatterns) {
      const match = query.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }

    // Remove trigger words and return the rest
    const cleanQuery = query.replace(/(?:ابحث|search|بحث|اجمع|find)/gi, '').trim();
    return cleanQuery || query;
  }

  extractSearchLimit(query) {
    const limitPattern = /(?:أول|first|آخر|last)\s+(\d+)/i;
    const match = query.match(limitPattern);
    return match ? parseInt(match[1]) : null;
  }

  extractLocation(query) {
    const locationPatterns = [
      /(?:في|in)\s+([^\s]+)/i,
      /(?:طقس|weather)\s+([^\s]+)/i,
      /([أ-ي]+(?:\s+[أ-ي]+)?)/  // Arabic city names
    ];

    for (const pattern of locationPatterns) {
      const match = query.match(pattern);
      if (match) {
        return match[1];
      }
    }

    return null;
  }

  // Enhanced intent analysis
  analyzeIntent(query) {
    const analysis = {
      language: this.detectLanguage(query),
      entities: this.extractAllEntities(query),
      sentiment: this.analyzeSentiment(query),
      urgency: this.detectUrgency(query),
      complexity: this.calculateComplexity(query)
    };

    return analysis;
  }

  detectLanguage(query) {
    const arabicRegex = /[\u0600-\u06FF]/;
    const englishRegex = /[a-zA-Z]/;

    const hasArabic = arabicRegex.test(query);
    const hasEnglish = englishRegex.test(query);

    if (hasArabic && !hasEnglish) return 'ar';
    if (hasEnglish && !hasArabic) return 'en';
    if (hasArabic && hasEnglish) return 'mixed';
    
    return 'unknown';
  }

  extractAllEntities(query) {
    return {
      numbers: this.extractNumbers(query),
      dates: this.extractDates(query),
      urls: this.extractUrls(query),
      mentions: this.extractMentions(query),
      emails: this.extractEmailAddresses(query),
      currencies: this.extractCurrencies(query)
    };
  }

  extractEmailAddresses(query) {
    const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    const matches = query.match(emailPattern);
    return matches || [];
  }

  extractCurrencies(query) {
    const currencyPattern = /(?:\$|USD|€|EUR|£|GBP|ر\.س|SAR)\s*[\d,]+(?:\.\d{2})?/g;
    const matches = query.match(currencyPattern);
    return matches || [];
  }

  analyzeSentiment(query) {
    const positiveWords = ['جيد', 'ممتاز', 'رائع', 'good', 'excellent', 'great', 'awesome'];
    const negativeWords = ['سيء', 'سيئ', 'فظيع', 'bad', 'terrible', 'awful', 'horrible'];

    const words = query.toLowerCase().split(/\s+/);
    let positiveCount = 0;
    let negativeCount = 0;

    words.forEach(word => {
      if (positiveWords.some(pw => word.includes(pw))) positiveCount++;
      if (negativeWords.some(nw => word.includes(nw))) negativeCount++;
    });

    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  detectUrgency(query) {
    const urgentWords = ['عاجل', 'فوري', 'سريع', 'urgent', 'asap', 'immediately', 'quickly'];
    const lowUrgencyWords = ['لاحقاً', 'عندما تستطيع', 'later', 'whenever', 'no rush'];

    const lowerQuery = query.toLowerCase();

    if (urgentWords.some(word => lowerQuery.includes(word))) return 'high';
    if (lowUrgencyWords.some(word => lowerQuery.includes(word))) return 'low';
    
    return 'normal';
  }

  calculateComplexity(query) {
    let complexity = 0;
    
    // Word count
    const words = query.split(/\s+/).length;
    complexity += Math.min(words / 10, 3);
    
    // Number of entities
    const entities = this.extractAllEntities(query);
    const entityCount = Object.values(entities).flat().length;
    complexity += Math.min(entityCount / 5, 2);
    
    // Special characters and patterns
    if (/[{}[\]()]/g.test(query)) complexity += 1;
    if (/\d+/g.test(query)) complexity += 0.5;
    if (/https?:\/\//g.test(query)) complexity += 0.5;
    
    return Math.min(complexity, 5);
  }
}