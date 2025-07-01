# 🤖 NiaScript

**Intent-based programming language for the AI era**

NiaScript is a powerful JavaScript library that enables developers to build intelligent applications using natural language processing and AI. It allows users to interact with applications using natural language and transforms intents into executable actions.

## ✨ Key Features

- **Intelligent Intent Processing**: Analyze and understand natural language queries
- **Recipe Engine**: Transform intents into executable steps
- **Provider Management**: Smart system for selecting optimal data sources
- **Secure Execution**: Comprehensive protection against dangerous operations
- **Memory System**: Learn from previous interactions
- **Advanced Error Handling**: Smart recovery from failures

## 📦 Installation

```bash
npm install niascript
```

## 🚀 Quick Start

### Basic Usage

```javascript
import { nia } from 'niascript';

// Simple cryptocurrency price query
const btcPrice = await nia`Bitcoin price`;
console.log(btcPrice); // "BTC price: $45,000 USD"

// Investment calculation
const investment = await nia`If I invest $1000 at 8% annual return, what will I have after 5 years?`;
console.log(investment); // "Investment of $1000 at 8% annually for 5 years = $1469.33"
```

### Advanced Usage

```javascript
import { NiaScript } from 'niascript';

const nia = new NiaScript();

// Process complex query
const query = "Compare Bitcoin and Ethereum performance over the last 30 days";
const result = await nia.processIntent(query);
console.log(result);
```

## 📖 Usage Guide

### 1. Template Literal Interface

The easiest and most natural way to use NiaScript:

```javascript
// Cryptocurrency prices
const ethPrice = await nia`Ethereum price`;

// Stock queries
const stockPrice = await nia`AAPL stock price`;

// Investment calculations
const compoundInterest = await nia`What is $5000 invested at 6% for 10 years?`;
```

### 2. Direct Methods

```javascript
// Ask a direct question
const answer = await nia.ask("What's the current Bitcoin price?");

// Request clarification
const choice = await nia.clarify("Apple could refer to:", ["stock", "fruit", "company"]);

// Save information to memory
await nia.remember("User prefers cryptocurrency over stocks");

// Forget information
await nia.forget("old investment preferences");
```

### 3. Register Custom Providers

```javascript
// Register a new provider
nia.registerProvider('financial', 'alpha_vantage', {
  name: 'Alpha Vantage API',
  baseURL: 'https://www.alphavantage.co/query',
  apiKey: process.env.ALPHA_VANTAGE_KEY,
  rateLimits: { requests: 5, window: 60000 },
  cost: 0,
  reliability: 0.95
});

// Custom error handling
nia.onError(async (error, context) => {
  if (error.type === 'API_FAILURE') {
    console.log('Using fallback provider...');
    return await context.tryFallback();
  }
  throw error;
});
```

## 📚 API Reference

### Main Class: NiaScript

#### Core Logic

- `processIntent(query, values)`: Process natural language query
- `ask(query, options)`: Ask a direct question
- `clarify(question, choices)`: Request clarification from user

#### Memory Management

- `remember(fact)`: Save information to memory
- `forget(pattern)`: Remove information from memory

#### Provider Management

- `registerProvider(category, name, config)`: Register new provider
- `onError(handler)`: Register custom error handler

### System Components

#### IntentParser

Intent parser that converts natural text into understandable intents:

```javascript
import { IntentParser } from 'niascript/core/intent-parser.js';

const parser = new IntentParser();
const intent = await parser.parseIntent("Bitcoin price");
console.log(intent);
/*
{
  type: 'financial',
  entities: { asset: 'bitcoin', operation: 'get_price' },
  confidence: 0.8,
  needsClarification: false
}
*/
```

#### RecipeEngine

Recipe engine that transforms intents into executable steps:

```javascript
import { RecipeEngine } from 'niascript/core/recipe-engine.js';

const engine = new RecipeEngine();
const recipe = await engine.generateRecipe(intent);
console.log(recipe);
/*
{
  confidence: 0.95,
  steps: [
    {
      action: "api_call",
      provider: "binance",
      endpoint: "ticker/price",
      params: { symbol: "BTCUSDT" }
    }
  ]
}
*/
```

#### ProviderManager

Provider manager for getting data from various sources:

```javascript
import { ProviderManager } from 'niascript/providers/provider-manager.js';

const manager = new ProviderManager();

// Register provider
manager.registerProvider('binance', {
  name: 'Binance API',
  baseURL: 'https://api.binance.com/api/v3',
  rateLimits: { requests: 1200, window: 60000 },
  reliability: 0.99
});

// Select best provider
const bestProvider = await manager.selectBestProvider('crypto');
```

## 🔧 Advanced Examples

### 1. Building an Intelligent Trading App

```javascript
import { nia, NiaScript } from 'niascript';

class TradingBot {
  constructor() {
    this.nia = new NiaScript();
    this.setupTradingProviders();
  }
  
  setupTradingProviders() {
    // Register trading providers
    this.nia.registerProvider('trading', 'binance_trading', {
      name: 'Binance Trading API',
      baseURL: 'https://api.binance.com/api/v3',
      authentication: 'apikey',
      permissions: ['spot_trading']
    });
  }
  
  async analyzeMarket(query) {
    // Analyze market using natural language
    return await this.nia.processIntent(query);
  }
  
  async executeTrade(command) {
    // Execute trading commands
    return await this.nia.ask(command);
  }
}

// Usage
const bot = new TradingBot();
const analysis = await bot.analyzeMarket("What's the trend for Bitcoin in the last week?");
console.log(analysis);
```

### 2. Financial Advisory System

```javascript
class FinancialAdvisor {
  constructor() {
    this.client = new NiaScript();
    this.setupFinancialProviders();
  }
  
  async getPortfolioAdvice(userQuery) {
    // Process portfolio queries
    const advice = await this.client.ask(userQuery);
    
    // Save preferences
    await this.client.remember(`User interested in: ${userQuery}`);
    
    return advice;
  }
  
  async compareInvestments(assets) {
    const comparison = await this.client.ask(
      `Compare performance of ${assets.join(', ')} over the last year`
    );
    return comparison;
  }
}

// Usage
const advisor = new FinancialAdvisor();
const advice = await advisor.getPortfolioAdvice(
  "Should I invest in tech stocks or cryptocurrency?"
);
```

## ⚙️ Configuration

### Environment Variables

```bash
# API Keys
OPENAI_API_KEY=your_openai_key_here
BINANCE_API_KEY=your_binance_key_here
ALPHA_VANTAGE_KEY=your_alphavantage_key_here

# System Settings
NIA_LOG_LEVEL=info
NIA_MEMORY_SIZE=1000
NIA_CACHE_TTL=300
```

### Configuration File

```javascript
// nia.config.js
export default {
  logging: {
    level: 'info',
    output: 'console'
  },
  memory: {
    maxSize: 1000,
    ttl: 86400000 // 24 hours
  },
  providers: {
    defaultTimeout: 5000,
    retryAttempts: 3
  }
};
```

## 🧪 Testing

### Running Tests

```bash
# Run all tests
npm test

# Run specific test
npm test -- --testNamePattern="IntentParser"

# Run with coverage
npm test -- --coverage
```

### Writing Custom Tests

```javascript
import { nia, NiaScript } from 'niascript';

describe('Custom NiaScript Tests', () => {
  let niaInstance;
  
  beforeEach(() => {
    niaInstance = new NiaScript();
  });
  
  test('should parse Bitcoin price query', async () => {
    const result = await nia`Bitcoin price`;
    expect(result).toContain('BTC');
    expect(result).toContain('USD');
  });
  
  test('should handle investment calculations', async () => {
    const result = await nia`$1000 at 5% for 3 years`;
    expect(result).toMatch(/\$1,157/);
  });
});
```

## 🛠️ Production Deployment

### Building for Production

```bash
# Build project
npm run build

# Generate documentation
npm run docs
```

### Performance Monitoring

```javascript
// Setup performance monitoring
nia.onError((error, context) => {
  console.error('NiaScript Error:', error);
  // Send to monitoring service
  monitoring.reportError(error, context);
});

// Track usage
nia.onSuccess((result, query) => {
  analytics.trackUsage({
    query,
    result,
    timestamp: Date.now()
  });
});
```

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Write tests for new code
4. Ensure all tests pass (`npm test`)
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Brahim BIDI**

- GitHub: [@brahimbidi](https://github.com/brahimbidi)
- Email: brahim.bidi@example.com

## 🙏 Acknowledgments

- Special thanks to all project contributors
- JavaScript libraries used: axios, chalk, inquirer, openai
- Node.js community for support and inspiration

---

**NiaScript - Intent-based programming for the intelligent era** 🚀