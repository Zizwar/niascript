export class RecipeEngine {
  constructor() {
    this.templates = {
      financial: {
        get_crypto_price: {
          confidence: 0.95,
          steps: [
            {
              action: "api_call",
              provider: "binance",
              endpoint: "ticker/price",
              params: { symbol: "${symbol}USDT" },
              transform: "parseFloat(response.price)",
              assign_to: "price_data"
            },
            {
              action: "format_response",
              template: "${symbol} price: $${price_data} USD",
              return: true
            }
          ],
          fallbacks: [
            { provider: "coinGecko", confidence: 0.85 },
            { provider: "coinMarketCap", confidence: 0.75 }
          ]
        },
        
        get_stock_price: {
          confidence: 0.90,
          steps: [
            {
              action: "api_call", 
              provider: "yahoo_finance",
              endpoint: "quote",
              params: { symbol: "${symbol}" },
              assign_to: "stock_data"
            },
            {
              action: "format_response",
              template: "${symbol} stock price: $${stock_data.price} USD",
              return: true
            }
          ],
          fallbacks: [
            { provider: "alpha_vantage", confidence: 0.80 }
          ]
        },

        compare_performance: {
          confidence: 0.85,
          steps: [
            {
              action: "parallel_api_calls",
              calls: [
                {
                  provider: "binance",
                  endpoint: "klines", 
                  params: { symbol: "${asset1}USDT", interval: "1d", limit: "${days}" },
                  assign_to: "asset1_data"
                },
                {
                  provider: "binance",
                  endpoint: "klines",
                  params: { symbol: "${asset2}USDT", interval: "1d", limit: "${days}" },
                  assign_to: "asset2_data"
                }
              ]
            },
            {
              action: "calculate",
              operation: "percentage_change",
              inputs: ["asset1_data", "asset2_data"],
              assign_to: "performance_comparison"
            },
            {
              action: "format_response",
              template: "Performance comparison (${days} days): ${asset1} ${performance_comparison.asset1_change}%, ${asset2} ${performance_comparison.asset2_change}%",
              return: true
            }
          ]
        }
      },

      calculations: {
        compound_interest: {
          confidence: 0.95,
          steps: [
            {
              action: "calculate",
              operation: "compound_interest",
              params: {
                principal: "${amount}",
                rate: "${rate}",
                time: "${years}",
                compound_frequency: "${frequency}"
              },
              assign_to: "final_amount"
            },
            {
              action: "format_response", 
              template: "Investment of $${amount} at ${rate}% annually for ${years} years = $${final_amount}",
              return: true
            }
          ]
        },

        simple_math: {
          confidence: 0.90,
          steps: [
            {
              action: "calculate",
              operation: "${operation}",
              params: "${params}",
              assign_to: "result"
            },
            {
              action: "format_response",
              template: "Result: ${result}",
              return: true
            }
          ]
        }
      }
    };
  }

  async generateRecipe(intent) {
    const { type, entities } = intent;
    
    if (type === 'financial') {
      return this.generateFinancialRecipe(entities);
    } else if (type === 'calculation') {
      return this.generateCalculationRecipe(entities);
    }
    
    return this.generateFallbackRecipe(intent);
  }

  generateFinancialRecipe(entities) {
    const { operation, asset, assets, amount, timeframe } = entities;
    
    switch (operation) {
      case 'get_price':
        if (this.isCryptocurrency(asset)) {
          return this.createRecipeFromTemplate('financial.get_crypto_price', {
            symbol: this.normalizeCryptoSymbol(asset)
          });
        } else {
          return this.createRecipeFromTemplate('financial.get_stock_price', {
            symbol: asset.toUpperCase()
          });
        }
        
      case 'compare':
        const days = this.timeframeToDays(timeframe) || 7;
        return this.createRecipeFromTemplate('financial.compare_performance', {
          asset1: this.normalizeCryptoSymbol(assets[0]),
          asset2: this.normalizeCryptoSymbol(assets[1]),
          days
        });
        
      case 'investment_calculation':
        return this.createRecipeFromTemplate('calculations.compound_interest', {
          amount: this.parseAmount(amount),
          rate: entities.rate || 8, 
          years: entities.years || 5,
          frequency: 12
        });
        
      default:
        return this.generateFallbackRecipe({ type: 'financial', entities });
    }
  }

  generateCalculationRecipe(entities) {
    const { percentages, amounts, timeframe, isCompound } = entities;
    
    if (isCompound && amounts && percentages) {
      return this.createRecipeFromTemplate('calculations.compound_interest', {
        amount: amounts[0],
        rate: percentages[0],
        years: timeframe?.amount || 5,
        frequency: 12
      });
    }
    
    return this.createRecipeFromTemplate('calculations.simple_math', {
      operation: 'calculate',
      params: entities
    });
  }

  createRecipeFromTemplate(templatePath, variables) {
    const pathParts = templatePath.split('.');
    let template = this.templates;
    
    for (const part of pathParts) {
      template = template[part];
      if (!template) {
        throw new Error(`Template not found: ${templatePath}`);
      }
    }
    
    return this.substituteVariables(JSON.parse(JSON.stringify(template)), variables);
  }

  substituteVariables(recipe, variables) {
    const substituteInString = (str) => {
      return str.replace(/\$\{(\w+)\}/g, (match, key) => {
        return variables[key] !== undefined ? variables[key] : match;
      });
    };

    const substituteInObject = (obj) => {
      if (typeof obj === 'string') {
        return substituteInString(obj);
      } else if (Array.isArray(obj)) {
        return obj.map(substituteInObject);
      } else if (obj && typeof obj === 'object') {
        const result = {};
        for (const [key, value] of Object.entries(obj)) {
          result[key] = substituteInObject(value);
        }
        return result;
      }
      return obj;
    };

    return substituteInObject(recipe);
  }

  generateFallbackRecipe(intent) {
    return {
      confidence: 0.3,
      steps: [
        {
          action: "error",
          message: `Unable to understand intent: ${JSON.stringify(intent)}`,
          suggest_clarification: true
        }
      ],
      fallbacks: []
    };
  }

  // Helper methods
  isCryptocurrency(asset) {
    const cryptos = ['bitcoin', 'btc', 'ethereum', 'eth', 'bnb', 'cardano', 'ada', 'solana', 'sol'];
    return cryptos.includes(asset.toLowerCase());
  }

  normalizeCryptoSymbol(asset) {
    const normalizations = {
      'bitcoin': 'BTC',
      'ethereum': 'ETH', 
      'cardano': 'ADA',
      'solana': 'SOL'
    };
    
    return normalizations[asset.toLowerCase()] || asset.toUpperCase();
  }

  timeframeToDays(timeframe) {
    if (!timeframe) return null;
    
    const { amount, unit } = timeframe;
    const multipliers = {
      'day': 1,
      'week': 7,
      'month': 30,
      'year': 365
    };
    
    return amount * (multipliers[unit] || 1);
  }

  parseAmount(amountStr) {
    return parseFloat(amountStr.replace(/[\$,]/g, ''));
  }

  // Recipe validation
  validateRecipe(recipe) {
    const errors = [];
    
    if (!recipe.steps || !Array.isArray(recipe.steps)) {
      errors.push('Recipe must have steps array');
    }
    
    if (recipe.confidence < 0 || recipe.confidence > 1) {
      errors.push('Confidence must be between 0 and 1');
    }
    
    for (const step of recipe.steps || []) {
      if (!step.action) {
        errors.push('Each step must have an action');
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Recipe optimization
  optimizeRecipe(recipe) {
    const optimized = JSON.parse(JSON.stringify(recipe));
    
    // Combine sequential API calls to same provider
    const steps = optimized.steps || [];
    const combinedSteps = [];
    let currentBatch = null;
    
    for (const step of steps) {
      if (step.action === 'api_call' && currentBatch && currentBatch.provider === step.provider) {
        currentBatch.calls = currentBatch.calls || [currentBatch];
        currentBatch.calls.push(step);
        currentBatch.action = 'batch_api_calls';
      } else {
        if (currentBatch) combinedSteps.push(currentBatch);
        currentBatch = step;
      }
    }
    
    if (currentBatch) combinedSteps.push(currentBatch);
    optimized.steps = combinedSteps;
    
    return optimized;
  }
}