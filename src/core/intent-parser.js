export class IntentParser {
  constructor() {
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
}