# NiaScript

**Intent-Based Programming - Write what you want, not how**

> [README بالعربية](README.ar.md)

NiaScript is a JavaScript library that lets you program using natural language. Instead of writing complex code, write your intent and NiaScript handles the rest.

```javascript
import { nia } from 'niascript';

// It's that simple!
const price = await nia`Bitcoin price`;
const news = await nia`5 tech news from Hacker News`;
const analysis = await nia`analyze ${price} with ${news}`;
```

## Features

- **Tagged Template Literals** - Write intents as a natural part of JavaScript
- **Local Processing** - Math, dates, and conversions without any API
- **AI Powered** - OpenRouter for anything more complex
- **Code Generation** - Generate complete scripts from intents
- **Agent System** - Specialized agents for planning, building, and reviewing
- **Smart Cache** - High performance at low cost
- **Dashboard + API** - Web dashboard with model selection and persistent endpoints
- **Model Selection** - Switch AI models from dashboard or API

## Installation

```bash
npm install niascript
```

## Quick Start

### 1. Simple Intents

```javascript
import { nia } from 'niascript';

// Math (local - no API)
const calc = await nia`calculate 25 * 4`;
console.log(calc.value); // 100

// Date & Time (local)
const date = await nia`what is today's date`;
console.log(date.value); // Wednesday, January 28, 2026

// Conversions (local)
const convert = await nia`convert 100 kilometers to miles`;
console.log(convert.value); // 100 km = 62.14 miles

// Anything else (AI)
const answer = await nia`what is the capital of France`;
console.log(answer.value); // Paris
```

### 2. Configuration

```javascript
import { nia, Nia } from 'niascript';

// Method 1: Global config
nia.setApiKey('sk-or-...');
nia.setModel('openai/gpt-4');

// Method 2: Custom instance
const n = new Nia({
  apiKey: process.env.OPENROUTER_API_KEY,
  model: 'anthropic/claude-3-opus',
  outputDir: 'my-output'
});

const result = await n.run('Bitcoin price');
```

### 3. Variable Interpolation

```javascript
const name = 'Ahmed';
const age = 25;

// Variables are merged automatically
const story = await nia`write a short story about ${name} who is ${age} years old`;

// Compose previous results
const btc = await nia`Bitcoin price`;
const eth = await nia`Ethereum price`;
const compare = await nia`compare ${btc} and ${eth}`;
```

### 4. Formatting

```javascript
// JSON with schema
const colors = await nia`5 design colors`.format('json', {
  colors: 'array'
});
// { colors: ['blue', 'green', ...] }

// Shortcuts
const data = await nia`user data`.json();
const text = await nia`article summary`.text();
const table = await nia`price list`.table(); // prints table
```

### 5. Script Generation

```javascript
// Generate a complete script
const script = await nia.generate('script that fetches Hacker News stories');

console.log(script.value);        // generated code
console.log(script.meta.filepath); // nia-output/scripts/nia-123.js

// Execute the script
const output = await nia.execute(script.meta.filepath);
```

### 6. Stats

```javascript
const stats = nia.stats();
console.log(stats);
// {
//   totalCalls: 10,
//   localCalls: 6,      // no API
//   aiCalls: 4,         // with API
//   cachedCalls: 2,     // from cache
//   totalCost: 0.0234,  // in USD
//   outputDir: 'nia-output'
// }
```

## Advanced Usage

### Agent System

```javascript
import { createAgentTeam } from 'niascript';

const team = createAgentTeam();

// Planning
const plan = await team.planner.think('plan a task management app');

// Building
const code = await team.builder.think('write a task management API');

// Review
const review = await team.validator.validate(code, 'Node.js API');

// Testing
const tests = await team.tester.generateTests(code);
```

### Code Generation

```javascript
import { NiaCodeGen } from 'niascript';

const codegen = new NiaCodeGen();

// Generate function
const fn = await codegen.generateFunction('function that calculates 15% tax');

// Generate class
const cls = await codegen.generateClass('shopping cart management class');

// Generate API
const api = await codegen.generateAPI('user management API with CRUD');
```

## Project Structure

```
niascript/
├── src/
│   ├── core/
│   │   ├── nia.js           # Unified core
│   │   ├── nia-agents.js    # Agent system
│   │   └── nia-codegen.js   # Code generation
│   ├── server.js            # Dashboard + API server
│   └── index.js             # Exports
├── nia-output/              # Generated files
│   ├── scripts/
│   ├── logs/
│   └── cache/
└── examples/
    └── demo-new.js          # Full demo
```

## Environment Variables

```bash
# .env
OPENROUTER_API_KEY=sk-or-...    # OpenRouter key (required for AI)
NIA_MODEL=openai/gpt-4.1-mini   # Default model
NIA_OUTPUT_DIR=nia-output       # Output directory
NIA_DEBUG=true                  # Debug mode
```

## Dashboard

```bash
# Start the server
npm run server

# Or via PM2
npm run pm2:start
```

Open `http://localhost:3003` to access the dashboard:

- **Run Intent** - Execute intents directly (local + AI)
- **Generate Script** - Create scripts from intents with syntax highlighting
- **NIA Editor** - Advanced code editor (CodeMirror) with save and run
- **Scripts Browser** - Browse, run, and delete scripts
- **Settings** - Model selection and theme toggle (light/dark)

### Model Selection

Switch the AI model directly from the dashboard via the Settings panel. Available models:

| Model | Description |
|-------|-------------|
| `openai/gpt-4.1-mini` | Default - fast and economical |
| `openai/gpt-4o-mini` | Lightweight and fast |
| `openai/gpt-5-mini` | Advanced |
| `openai/gpt-5.1-codex-mini` | Code specialized |
| `x-ai/grok-4.1-fast` | Grok fast |
| `x-ai/grok-3-mini` | Grok lightweight |
| `x-ai/grok-code-fast-1` | Grok code specialized |
| `arcee-ai/coder-large` | Programming specialized |

You can also add any custom OpenRouter model via the "Custom Model" field using `provider/model-name` format.

```bash
# List available models
curl http://localhost:3003/api/models

# Change model via API
curl -X PUT http://localhost:3003/api/config \
  -H 'Content-Type: application/json' \
  -d '{"model": "x-ai/grok-4.1-fast"}'

# View current config
curl http://localhost:3003/api/config
```

### Persistent Endpoints

Every generated script gets a persistent endpoint that can be called later from anywhere:

```bash
# 1. Create a script
curl -X POST http://localhost:3003/api/create \
  -H 'Content-Type: application/json' \
  -d '{"intent": "script that fetches Hacker News stories"}'
# Returns: { "id": "nia-1738234567890", "endpoint": "/api/execute/nia-1738234567890", ... }

# 2. Run the script later via GET (from browser or curl)
curl http://localhost:3003/api/execute/nia-1738234567890

# Or via POST
curl -X POST http://localhost:3003/api/execute/nia-1738234567890
```

Each script in the dashboard displays its API endpoint URL. Click to copy.

### API Endpoints

```bash
# Run an intent
curl -X POST http://localhost:3003/api/run \
  -H 'Content-Type: application/json' \
  -d '{"intent": "calculate 100 * 55"}'

# Create a script
curl -X POST http://localhost:3003/api/create \
  -H 'Content-Type: application/json' \
  -d '{"intent": "script that fetches Hacker News"}'

# List all scripts
curl http://localhost:3003/api/scripts

# View a specific script (with code and metadata)
curl http://localhost:3003/api/scripts/nia-1738234567890

# Execute a script (GET or POST)
curl http://localhost:3003/api/execute/nia-1738234567890

# Available models
curl http://localhost:3003/api/models

# Config (GET to read, PUT to update)
curl http://localhost:3003/api/config

# Stats
curl http://localhost:3003/api/stats
```

## CLI

```bash
# Direct execution
npx niascript "Bitcoin price"

# Interactive mode
npx niascript interactive

# Generate script
npx niascript generate "script to fetch news"
```

## Contributing

Contributions are welcome! Please:

1. Fork the project
2. Create a feature branch (`git checkout -b feature/amazing`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing`)
5. Open a Pull Request

## License

MIT License - Open source project

---

**NiaScript - Write what you want, not how**
