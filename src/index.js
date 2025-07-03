import { IntentParser } from './core/intent-parser.js';
import { RecipeEngine } from './core/recipe-engine.js';
import { SafeExecutor } from './core/safe-executor.js';
import { ProviderManager } from './providers/provider-manager.js';
import { ErrorHandler } from './utils/error-handler.js';
import { MemorySystem } from './core/memory-system.js';
import { Logger } from './utils/logger.js';
import { PluginManager } from './core/plugin-manager.js';
import inquirer from 'inquirer';

class NiaScript {
  constructor() {
    this.logger = new Logger();
    this.intentParser = new IntentParser();
    this.recipeEngine = new RecipeEngine();
    this.providerManager = new ProviderManager();
    this.errorHandler = new ErrorHandler();
    this.safeExecutor = new SafeExecutor(this.providerManager, this.errorHandler);
    this.memorySystem = new MemorySystem();
    this.pluginManager = new PluginManager(this);
    
    // Connect plugin manager to safe executor and intent parser
    this.safeExecutor.setPluginManager(this.pluginManager);
    this.intentParser.setPluginManager(this.pluginManager);
    
    this.setupDefaultProviders();
    this.setupErrorHandlers();
    this.loadDefaultPlugins();
  }

  async processIntent(query, values = []) {
    try {
      this.logger.info(`Processing query: ${query}`);
      
      // Check for plugin match first
      const pluginMatch = this.pluginManager.findMatchingPlugin(query);
      
      if (pluginMatch && pluginMatch.confidence > 0.7) {
        // Use plugin to handle the query
        return await this.processPluginIntent(query, pluginMatch, values);
      }
      
      // Parse the intent using traditional method
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

  // Plugin-related methods
  async processPluginIntent(query, pluginMatch, values = []) {
    try {
      const { plugin, confidence } = pluginMatch;
      this.logger.info(`Processing query with plugin: ${plugin.name} (confidence: ${confidence})`);
      
      // Find the best matching recipe
      const recipe = this.selectPluginRecipe(query, plugin);
      
      if (!recipe) {
        throw new Error(`No suitable recipe found in plugin ${plugin.name}`);
      }
      
      // Prepare the context with query and values
      this.safeExecutor.context.set('query', query);
      this.safeExecutor.context.set('values', values);
      
      // Extract relevant parameters from query
      const extractedParams = await this.extractQueryParameters(query, plugin);
      Object.entries(extractedParams).forEach(([key, value]) => {
        this.safeExecutor.context.set(key, value);
      });
      
      // Execute the plugin recipe
      const result = await this.safeExecutor.executeRecipe(recipe);
      
      // Store in memory for learning
      await this.memorySystem.store({
        query,
        plugin: plugin.name,
        recipe: recipe,
        result,
        confidence,
        timestamp: new Date()
      });
      
      this.logger.info('Plugin query processed successfully');
      return result;
      
    } catch (error) {
      this.logger.error('Error processing plugin query:', error);
      return await this.errorHandler.handleError(error, { query, values });
    }
  }

  selectPluginRecipe(query, plugin) {
    if (!plugin.recipes) return null;
    
    const recipeNames = Object.keys(plugin.recipes);
    let bestRecipe = null;
    let bestScore = 0;
    
    for (const recipeName of recipeNames) {
      const recipe = plugin.recipes[recipeName];
      let score = recipe.confidence || 0.5;
      
      // Increase score based on keyword matches
      const lowerQuery = query.toLowerCase();
      if (lowerQuery.includes(recipeName.toLowerCase())) {
        score += 0.3;
      }
      
      if (score > bestScore) {
        bestScore = score;
        bestRecipe = recipe;
      }
    }
    
    return bestRecipe;
  }

  async extractQueryParameters(query, plugin) {
    const params = {};
    
    // Extract text for translation
    if (plugin.name === 'translation') {
      const textMatch = query.match(/(?:ترجم|translate)[:\s]+(.*?)(?:\s+(?:إلى|للانجليزية|للعربية|to|into))?$/i);
      if (textMatch) {
        params.text = textMatch[1].trim();
      }
    }
    
    // Extract email parts
    if (plugin.name === 'email') {
      const recipientMatch = query.match(/(?:لبريدي?|to|email)\s+(\S+)/i);
      if (recipientMatch) {
        params.recipient = recipientMatch[1];
      }
    }
    
    return params;
  }

  async loadDefaultPlugins() {
    try {
      // Load translation plugin
      const { default: translationPlugin } = await import('./plugins/translation.js');
      await this.pluginManager.install(translationPlugin);
      
      // Load email plugin
      const { default: emailPlugin } = await import('./plugins/email.js');
      await this.pluginManager.install(emailPlugin);
      
      this.logger.info('Default plugins loaded successfully');
    } catch (error) {
      this.logger.error('Error loading default plugins:', error);
    }
  }

  // Plugin management API methods
  async installPlugin(plugin) {
    return await this.pluginManager.install(plugin);
  }

  async uninstallPlugin(pluginName) {
    return await this.pluginManager.uninstall(pluginName);
  }

  listPlugins() {
    return this.pluginManager.listPlugins();
  }

  getPlugin(name) {
    return this.pluginManager.getPlugin(name);
  }

  async loadPlugin(filePath) {
    return await this.pluginManager.loadPluginFromFile(filePath);
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

// Plugin management methods
nia.installPlugin = niaInstance.installPlugin.bind(niaInstance);
nia.uninstallPlugin = niaInstance.uninstallPlugin.bind(niaInstance);
nia.listPlugins = niaInstance.listPlugins.bind(niaInstance);
nia.getPlugin = niaInstance.getPlugin.bind(niaInstance);
nia.loadPlugin = niaInstance.loadPlugin.bind(niaInstance);

// Export the main interface and instance
export { nia as default, niaInstance };
export { NiaScript };