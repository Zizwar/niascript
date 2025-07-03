import { NiaScript } from '../src/index.js';
import { PluginManager } from '../src/core/plugin-manager.js';
import { AIPluginGenerator } from '../src/core/ai-plugin-generator.js';

describe('Plugin System Tests', () => {
  let nia;
  let pluginManager;

  beforeEach(() => {
    nia = new NiaScript();
    pluginManager = nia.pluginManager;
  });

  test('should initialize with default plugins', () => {
    const plugins = pluginManager.listPlugins();
    expect(plugins.length).toBeGreaterThan(0);
    
    const pluginNames = plugins.map(p => p.name);
    expect(pluginNames).toContain('translation');
    expect(pluginNames).toContain('email');
  });

  test('should install custom plugin', async () => {
    const testPlugin = {
      name: "test_plugin",
      version: "1.0.0",
      description: "Test plugin for unit testing",
      triggers: [/test/i],
      recipes: {
        test_recipe: {
          confidence: 0.9,
          steps: [
            {
              action: "format_response",
              template: "Test successful",
              return: true
            }
          ]
        }
      }
    };

    const result = await pluginManager.install(testPlugin);
    expect(result.success).toBe(true);
    
    const plugins = pluginManager.listPlugins();
    const testPluginInstalled = plugins.find(p => p.name === 'test_plugin');
    expect(testPluginInstalled).toBeDefined();
  });

  test('should find matching plugin for query', () => {
    const match = pluginManager.findMatchingPlugin('translate hello world');
    expect(match).toBeTruthy();
    expect(match.plugin.name).toBe('translation');
    expect(match.confidence).toBeGreaterThan(0);
  });

  test('should validate plugin structure', () => {
    const validPlugin = {
      name: "valid_plugin",
      version: "1.0.0",
      triggers: [/valid/i],
      recipes: {
        test: {
          confidence: 0.8,
          steps: []
        }
      }
    };

    expect(() => {
      pluginManager.validatePlugin(validPlugin);
    }).not.toThrow();

    const invalidPlugin = {
      name: "", // Invalid: empty name
      version: "1.0.0"
    };

    expect(() => {
      pluginManager.validatePlugin(invalidPlugin);
    }).toThrow();
  });

  test('should uninstall plugin', async () => {
    const testPlugin = {
      name: "temp_plugin",
      version: "1.0.0",
      description: "Temporary plugin",
      triggers: [/temp/i],
      recipes: {
        temp_recipe: {
          confidence: 0.5,
          steps: []
        }
      }
    };

    await pluginManager.install(testPlugin);
    expect(pluginManager.hasPlugin('temp_plugin')).toBe(true);

    const result = await pluginManager.uninstall('temp_plugin');
    expect(result.success).toBe(true);
    expect(pluginManager.hasPlugin('temp_plugin')).toBe(false);
  });

  test('should execute custom actions', async () => {
    const actionPlugin = {
      name: "action_plugin",
      version: "1.0.0",
      description: "Plugin with custom actions",
      triggers: [/action/i],
      customActions: {
        test_action: async (params) => {
          return { success: true, input: params.input };
        }
      },
      recipes: {
        action_recipe: {
          confidence: 0.8,
          steps: [
            {
              action: "test_action",
              input: "test data",
              assign_to: "result"
            },
            {
              action: "format_response",
              template: "${result.success}",
              return: true
            }
          ]
        }
      }
    };

    await pluginManager.install(actionPlugin);
    
    const action = pluginManager.customActions.get('action_plugin.test_action');
    expect(action).toBeDefined();
    
    const result = await action({ input: 'test' });
    expect(result.success).toBe(true);
    expect(result.input).toBe('test');
  });
});

describe('AI Plugin Generator Tests', () => {
  let generator;
  let pluginManager;

  beforeEach(() => {
    const nia = new NiaScript();
    pluginManager = nia.pluginManager;
    generator = new AIPluginGenerator(null, pluginManager);
  });

  test('should generate plugin from template', async () => {
    const plugin = await generator.generateFromTemplate(
      'Weather information service',
      { type: 'api_service' }
    );

    expect(plugin.name).toBeDefined();
    expect(plugin.version).toBeDefined();
    expect(plugin.triggers).toBeDefined();
    expect(Array.isArray(plugin.triggers)).toBe(true);
  });

  test('should select appropriate template', () => {
    const apiTemplate = generator.selectBestTemplate('API service for weather data');
    expect(apiTemplate).toBe('api_service');

    const dataTemplate = generator.selectBestTemplate('Process and analyze user data');
    expect(dataTemplate).toBe('data_processor');

    const utilityTemplate = generator.selectBestTemplate('Utility helper tool');
    expect(utilityTemplate).toBe('utility_tool');
  });

  test('should generate plugin name from description', () => {
    const name1 = generator.generatePluginName('Weather API service');
    expect(name1).toMatch(/weather/);

    const name2 = generator.generatePluginName('ترجمة النصوص');
    expect(name2).toBeDefined();
    expect(name2.length).toBeGreaterThan(0);
  });

  test('should generate custom actions', () => {
    const actions = generator.generateCustomActions('حساب العمليات الرياضية');
    expect(Object.keys(actions).length).toBeGreaterThan(0);
    expect(actions.validate_input).toBeDefined();
    expect(actions.format_output).toBeDefined();
  });

  test('should generate multiple plugins', async () => {
    const descriptions = [
      'Weather service',
      'File manager',
      'Calculator tool'
    ];

    const result = await generator.generateMultiplePlugins(descriptions);
    expect(result.plugins.length).toBe(3);
    expect(result.errors.length).toBe(0);
  });
});

describe('Recipe Engine Plugin Support Tests', () => {
  let nia;
  let recipeEngine;

  beforeEach(() => {
    nia = new NiaScript();
    recipeEngine = nia.recipeEngine;
  });

  test('should add and retrieve plugin templates', () => {
    const templates = {
      test_template: {
        confidence: 0.8,
        steps: []
      }
    };

    recipeEngine.addPluginTemplates('test_plugin', templates);
    
    const retrieved = recipeEngine.getPluginTemplates('test_plugin');
    expect(retrieved).toEqual(templates);
    
    const list = recipeEngine.listPluginTemplates();
    expect(list).toContain('test_plugin');
  });

  test('should create plugin recipe', () => {
    const templates = {
      main_recipe: {
        confidence: 0.9,
        steps: [
          {
            action: 'format_response',
            template: 'Plugin recipe executed',
            return: true
          }
        ]
      }
    };

    recipeEngine.addPluginTemplates('test_plugin', templates);
    
    const intent = {
      type: 'plugin',
      plugin: 'test_plugin',
      entities: { query: 'test query' }
    };

    const recipe = recipeEngine.createPluginRecipe(intent, templates);
    expect(recipe.confidence).toBe(0.9);
    expect(recipe.context).toEqual(intent.entities);
  });

  test('should get recipe statistics', () => {
    const stats = recipeEngine.getRecipeStats();
    expect(stats.standardTemplates).toBeGreaterThan(0);
    expect(stats.totalTemplates).toBeGreaterThan(0);
  });

  test('should debug recipe', () => {
    const recipe = {
      confidence: 0.8,
      steps: [
        {
          action: 'api_call',
          provider: 'test_provider',
          params: { key: '${value}' }
        },
        {
          action: 'format_response',
          template: 'Result: ${result}',
          return: true
        }
      ]
    };

    const debug = recipeEngine.debugRecipe(recipe);
    expect(debug.confidence).toBe(0.8);
    expect(debug.stepsCount).toBe(2);
    expect(debug.actions.length).toBe(2);
    expect(debug.providers).toContain('test_provider');
    expect(debug.variables.length).toBeGreaterThan(0);
  });
});

describe('Intent Parser Plugin Support Tests', () => {
  let nia;
  let intentParser;

  beforeEach(() => {
    nia = new NiaScript();
    intentParser = nia.intentParser;
  });

  test('should extract translation entities', () => {
    const text = intentParser.extractTextForTranslation('ترجم للانجليزية: مرحبا');
    expect(text).toBe('مرحبا');

    const targetLang = intentParser.extractTargetLanguage('ترجم للانجليزية: مرحبا');
    expect(targetLang).toBe('en');
  });

  test('should extract email entities', () => {
    const recipient = intentParser.extractEmailRecipient('ارسل لبريدي test@example.com');
    expect(recipient).toBe('test@example.com');

    const content = intentParser.extractEmailContent('النص: هذا اختبار');
    expect(content).toBe('هذا اختبار');
  });

  test('should extract common entities', () => {
    const numbers = intentParser.extractNumbers('I have 5 apples and 10 oranges');
    expect(numbers).toEqual([5, 10]);

    const urls = intentParser.extractUrls('Visit https://example.com for more info');
    expect(urls).toContain('https://example.com');

    const emails = intentParser.extractEmailAddresses('Contact admin@test.com or support@company.org');
    expect(emails).toEqual(['admin@test.com', 'support@company.org']);
  });

  test('should detect language', () => {
    const arabicLang = intentParser.detectLanguage('مرحبا بالعالم');
    expect(arabicLang).toBe('ar');

    const englishLang = intentParser.detectLanguage('Hello world');
    expect(englishLang).toBe('en');

    const mixedLang = intentParser.detectLanguage('Hello مرحبا');
    expect(mixedLang).toBe('mixed');
  });

  test('should analyze sentiment', () => {
    const positive = intentParser.analyzeSentiment('This is excellent and great');
    expect(positive).toBe('positive');

    const negative = intentParser.analyzeSentiment('This is terrible and awful');
    expect(negative).toBe('negative');

    const neutral = intentParser.analyzeSentiment('This is a normal message');
    expect(neutral).toBe('neutral');
  });

  test('should detect urgency', () => {
    const high = intentParser.detectUrgency('This is urgent and needs immediate attention');
    expect(high).toBe('high');

    const low = intentParser.detectUrgency('Do this later when you have time');
    expect(low).toBe('low');

    const normal = intentParser.detectUrgency('Please complete this task');
    expect(normal).toBe('normal');
  });
});