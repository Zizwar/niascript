import { describe, test, expect, beforeAll, jest } from '@jest/globals';
import { nia, NiaScript } from '../src/index.js';

describe('NiaScript Basic Functionality', () => {
  let niaInstance;

  beforeAll(() => {
    niaInstance = new NiaScript();
  });

  test('should handle Bitcoin price query', async () => {
    const result = await nia`Bitcoin price`;
    expect(result).toContain('BTC price');
    expect(result).toContain('USD');
    expect(result).toMatch(/\$[\d,]+\.?\d*/);
  });

  test('should handle compound interest calculation', async () => {
    const result = await nia`If I invest $1000 at 8% annual return, what will I have after 5 years?`;
    expect(result).toContain('Investment of $1000');
    expect(result).toContain('1489.85');
  });

  test('should handle Ethereum price query', async () => {
    const result = await nia`Ethereum price`;
    expect(result).toContain('ETH price');
    expect(result).toContain('USD');
  });

  test('should handle ambiguous queries with mock input', async () => {
    const mockUserInput = jest.fn().mockResolvedValue('stock');
    nia.setUserInput(mockUserInput);
    
    const result = await nia`Apple price`;
    expect(mockUserInput).toHaveBeenCalled();
  });
});

describe('Intent Parser', () => {
  test('should parse Bitcoin price intent correctly', async () => {
    const { IntentParser } = await import('../src/core/intent-parser.js');
    const parser = new IntentParser();
    
    const intent = await parser.parseIntent('Bitcoin price');
    
    expect(intent.type).toBe('financial');
    expect(intent.entities.asset).toBe('bitcoin');
    expect(intent.entities.operation).toBe('get_price');
    expect(intent.confidence).toBeGreaterThan(0.5);
  });

  test('should detect ambiguous queries', async () => {
    const { IntentParser } = await import('../src/core/intent-parser.js');
    const parser = new IntentParser();
    
    const intent = await parser.parseIntent('Apple price');
    
    expect(intent.needsClarification).toBe(true);
    expect(intent.clarificationOptions.word).toBe('apple');
  });
});

describe('Recipe Engine', () => {
  test('should generate crypto price recipe', async () => {
    const { RecipeEngine } = await import('../src/core/recipe-engine.js');
    const engine = new RecipeEngine();
    
    const intent = {
      type: 'financial',
      entities: {
        operation: 'get_price',
        asset: 'bitcoin'
      }
    };
    
    const recipe = await engine.generateRecipe(intent);
    
    expect(recipe.confidence).toBeGreaterThan(0.8);
    expect(recipe.steps).toHaveLength(2);
    expect(recipe.steps[0].action).toBe('api_call');
    expect(recipe.steps[0].provider).toBe('binance');
    expect(recipe.fallbacks).toBeDefined();
  });

  test('should generate compound interest recipe', async () => {
    const { RecipeEngine } = await import('../src/core/recipe-engine.js');
    const engine = new RecipeEngine();
    
    const intent = {
      type: 'calculation',
      entities: {
        amounts: [1000],
        percentages: [8],
        timeframe: { amount: 5, unit: 'year' },
        isCompound: true
      }
    };
    
    const recipe = await engine.generateRecipe(intent);
    
    expect(recipe.confidence).toBeGreaterThan(0.8);
    expect(recipe.steps[0].action).toBe('calculate');
    expect(recipe.steps[0].operation).toBe('compound_interest');
  });
});

describe('Safe Executor', () => {
  test('should calculate compound interest correctly', async () => {
    const { SafeExecutor } = await import('../src/core/safe-executor.js');
    const { ProviderManager } = await import('../src/providers/provider-manager.js');
    const { ErrorHandler } = await import('../src/utils/error-handler.js');
    
    const executor = new SafeExecutor(new ProviderManager(), new ErrorHandler());
    
    const result = executor.calculateCompoundInterest({
      principal: 1000,
      rate: 8,
      time: 5,
      compound_frequency: 12
    });
    
    expect(result).toBeCloseTo(1489.85, 2);
  });

  test('should validate recipe steps', async () => {
    const { SafeExecutor } = await import('../src/core/safe-executor.js');
    const { ProviderManager } = await import('../src/providers/provider-manager.js');
    const { ErrorHandler } = await import('../src/utils/error-handler.js');
    
    const executor = new SafeExecutor(new ProviderManager(), new ErrorHandler());
    
    const validStep = { action: 'calculate', operation: 'compound_interest' };
    const invalidStep = { action: 'eval', code: 'malicious_code()' };
    
    expect(() => executor.validateStep(validStep)).not.toThrow();
    expect(() => executor.validateStep(invalidStep)).toThrow();
  });
});

describe('Provider Manager', () => {
  test('should register and retrieve providers', async () => {
    const { ProviderManager } = await import('../src/providers/provider-manager.js');
    const manager = new ProviderManager();
    
    const config = {
      name: 'Test Provider',
      baseURL: 'https://api.test.com',
      reliability: 0.95
    };
    
    manager.registerProvider('test', config);
    const provider = manager.getProvider('test');
    
    expect(provider).toBeDefined();
    expect(provider.name).toBe('Test Provider');
    expect(provider.reliability).toBe(0.95);
  });
});

describe('Error Handling', () => {
  test('should classify error types correctly', async () => {
    const { ErrorHandler } = await import('../src/utils/error-handler.js');
    const handler = new ErrorHandler();
    
    const networkError = new Error('Network connection failed');
    const rateLimitError = new Error('Too many requests - rate limit exceeded');
    
    const networkAnalysis = handler.analyzeError(networkError);
    const rateLimitAnalysis = handler.analyzeError(rateLimitError);
    
    expect(networkAnalysis.type).toBe('API_FAILURE');
    expect(networkAnalysis.retryable).toBe(true);
    
    expect(rateLimitAnalysis.type).toBe('RATE_LIMIT');
    expect(rateLimitAnalysis.retryable).toBe(true);
  });
});