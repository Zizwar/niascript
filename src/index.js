import { IntentParser } from './core/intent-parser.js';
import { RecipeEngine } from './core/recipe-engine.js';
import { SafeExecutor } from './core/safe-executor.js';
import { ProviderManager } from './providers/provider-manager.js';
import { ErrorHandler } from './utils/error-handler.js';
import { MemorySystem } from './core/memory-system.js';
import { Logger } from './utils/logger.js';
import inquirer from 'inquirer';

class NiaScript {
  constructor() {
    this.intentParser = new IntentParser();
    this.recipeEngine = new RecipeEngine();
    this.providerManager = new ProviderManager();
    this.errorHandler = new ErrorHandler();
    this.safeExecutor = new SafeExecutor(this.providerManager, this.errorHandler);
    this.memorySystem = new MemorySystem();
    this.logger = new Logger();
    
    this.setupDefaultProviders();
    this.setupErrorHandlers();
  }

  async processIntent(query, values = []) {
    try {
      this.logger.info(`Processing query: ${query}`);
      
      // Parse the intent
      const intent = await this.intentParser.parseIntent(query);
      this.logger.debug('Parsed intent:', intent);
      
      // Check if clarification is needed
      if (intent.needsClarification) {
        const clarification = await this.requestClarification(
          intent.clarificationOptions.word,
          intent.clarificationOptions.options
        );
        
        // Re-parse with clarification
        const clarifiedQuery = `${query} (${clarification})`;
        const clarifiedIntent = await this.intentParser.parseIntent(clarifiedQuery);
        return this.processIntent(clarifiedQuery, values);
      }
      
      // Generate execution recipe
      const recipe = await this.recipeEngine.generateRecipe(intent);
      this.logger.debug('Generated recipe:', recipe);
      
      // Validate recipe
      const validation = this.recipeEngine.validateRecipe(recipe);
      if (!validation.isValid) {
        throw new Error(`Invalid recipe: ${validation.errors.join(', ')}`);
      }
      
      // Execute recipe safely
      const result = await this.safeExecutor.executeRecipe(recipe);
      
      // Store in memory for learning
      await this.memorySystem.store({
        query,
        intent,
        recipe,
        result,
        timestamp: new Date()
      });
      
      this.logger.info('Query processed successfully');
      return result;
      
    } catch (error) {
      this.logger.error('Error processing query:', error);
      return await this.errorHandler.handleError(error, { query, values });
    }
  }

  async requestClarification(ambiguousWord, options) {
    const answer = await inquirer.prompt([
      {
        type: 'list',
        name: 'clarification',
        message: `"${ambiguousWord}" could refer to multiple things. Which do you mean?`,
        choices: options
      }
    ]);
    
    return answer.clarification;
  }

  setupDefaultProviders() {
    // Binance API for crypto prices
    this.providerManager.registerProvider('binance', {
      name: 'Binance API',
      baseURL: 'https://api.binance.com/api/v3',
      endpoints: {
        'ticker/price': '/ticker/price',
        'klines': '/klines'
      },
      rateLimits: { requests: 1200, window: 60000 },
      cost: 0,
      reliability: 0.99
    });

    // CoinGecko API as fallback
    this.providerManager.registerProvider('coinGecko', {
      name: 'CoinGecko API',
      baseURL: 'https://api.coingecko.com/api/v3',
      endpoints: {
        'simple/price': '/simple/price'
      },
      rateLimits: { requests: 50, window: 60000 },
      cost: 0,
      reliability: 0.95
    });
  }

  setupErrorHandlers() {
    this.errorHandler.onError(async (error, context) => {
      if (error.type === 'AMBIGUOUS_INTENT') {
        const choice = await this.requestClarification(error.word, error.options);
        return await context.retry({ clarification: choice });
      }
      
      if (error.type === 'API_FAILURE') {
        return await context.tryFallback();
      }
      
      if (error.type === 'RATE_LIMIT') {
        const wait = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'wait',
            message: 'Rate limit reached. Would you like to wait and retry?',
            default: true
          }
        ]);
        
        if (wait.wait) {
          await new Promise(resolve => setTimeout(resolve, 60000));
          return await context.retry();
        }
      }
      
      throw error;
    });
  }

  // Extended API methods as specified in the documentation
  async ask(query, options = {}) {
    return await this.processIntent(query, [], options);
  }

  async clarify(question, choices) {
    return await this.requestClarification(question, choices);
  }

  async remember(fact) {
    return await this.memorySystem.store({ type: 'fact', content: fact, timestamp: new Date() });
  }

  async forget(pattern) {
    return await this.memorySystem.forget(pattern);
  }

  registerProvider(category, name, config) {
    return this.providerManager.registerProvider(name, config);
  }

  onError(handler) {
    this.errorHandler.onError(handler);
  }

  // User input setter for testing
  setUserInput(mockFunction) {
    this.userInputFunction = mockFunction;
  }

  async askUser(question, choices) {
    if (this.userInputFunction) {
      return await this.userInputFunction(question, choices);
    }
    
    return await this.requestClarification(question, choices);
  }
}

// Create global instance
const niaInstance = new NiaScript();

// Primary template literal interface
export async function nia(strings, ...values) {
  const query = strings.join('');
  return await niaInstance.processIntent(query, values);
}

// Attach extended methods
nia.ask = niaInstance.ask.bind(niaInstance);
nia.clarify = niaInstance.clarify.bind(niaInstance);
nia.remember = niaInstance.remember.bind(niaInstance);
nia.forget = niaInstance.forget.bind(niaInstance);
nia.registerProvider = niaInstance.registerProvider.bind(niaInstance);
nia.onError = niaInstance.onError.bind(niaInstance);
nia.setUserInput = niaInstance.setUserInput.bind(niaInstance);

// Export the main interface and instance
export { nia as default, niaInstance };
export { NiaScript };