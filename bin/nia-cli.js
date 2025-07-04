#!/usr/bin/env node
// bin/nia-cli.js - واجهة سطر الأوامر الذكية

import { program } from 'commander';
import chalk from 'chalk';
import { nia, NiaEngine } from '../src/core/nia-engine.js';
import { runConfig } from '../examples/enhanced-demo.js';

// إعداد البرنامج
program
  .name('nia')
  .description('NiaScript - Intent-based AI programming')
  .version('2.0.0');

// أمر السؤال المباشر
program
  .command('ask <question>')
  .description('Ask a direct question to the AI')
  .option('-v, --verbose', 'Verbose output')
  .option('--no-cost', 'Hide cost information')
  .action(async (question, options) => {
    try {
      if (options.verbose) {
        nia.setLogLevel('debug');
      }
      
      console.log(chalk.blue('🤖 ') + question);
      console.log(chalk.gray('─'.repeat(50)));
      
      const startTime = Date.now();
      const answer = await nia.ask(question);
      const duration = Date.now() - startTime;
      
      console.log(chalk.green('💡 ') + answer);
      
      if (options.cost !== false) {
        const stats = nia.stats();
        console.log(chalk.gray(`\n⏱️  ${duration}ms • 💰 $${stats.totalCost.toFixed(4)} total`));
      }
      
    } catch (error) {
      console.error(chalk.red('❌ Error: ') + error.message);
      process.exit(1);
    }
  });

// أمر المعالجة العادية (فهم النية)
program
  .command('process <input>')
  .description('Process input through intent understanding')
  .option('-v, --verbose', 'Verbose output')
  .action(async (input, options) => {
    try {
      if (options.verbose) {
        nia.setLogLevel('debug');
      }
      
      console.log(chalk.blue('🎯 ') + input);
      console.log(chalk.gray('─'.repeat(50)));
      
      const result = await nia`${input}`;
      console.log(chalk.green('✅ ') + result);
      
      const stats = nia.stats();
      console.log(chalk.gray(`\n📊 ${stats.totalRequests} requests • 💰 $${stats.totalCost.toFixed(4)} total`));
      
    } catch (error) {
      console.error(chalk.red('❌ Error: ') + error.message);
      process.exit(1);
    }
  });

// أمر التشغيل التفاعلي
program
  .command('interactive')
  .alias('i')
  .description('Start interactive mode')
  .option('-m, --mode <mode>', 'Mode: ask|process|auto', 'auto')
  .action(async (options) => {
    const { default: inquirer } = await import('inquirer');
    
    console.log(chalk.cyan('🎯 NiaScript Interactive Mode'));
    console.log(chalk.gray('Type "exit" to quit, "stats" for statistics\n'));
    
    const engine = new NiaEngine({ logLevel: 'info' });
    let sessionCount = 0;
    
    while (true) {
      try {
        const { input } = await inquirer.prompt([
          {
            type: 'input',
            name: 'input',
            message: chalk.blue('nia>'),
            validate: (input) => input.trim().length > 0 || 'Please enter a question or command'
          }
        ]);
        
        const trimmed = input.trim();
        
        // أوامر خاصة
        if (trimmed.toLowerCase() === 'exit') {
          break;
        }
        
        if (trimmed.toLowerCase() === 'stats') {
          const stats = engine.getStats();
          console.log(chalk.yellow('\n📊 Session Statistics:'));
          console.log(`   Requests: ${stats.totalRequests}`);
          console.log(`   Total Cost: $${stats.totalCost.toFixed(6)}`);
          console.log(`   Avg Time: ${stats.averageResponseTime}ms`);
          console.log(`   Domains: ${Object.keys(stats.topDomains).join(', ')}\n`);
          continue;
        }
        
        if (trimmed.toLowerCase() === 'clear') {
          console.clear();
          console.log(chalk.cyan('🎯 NiaScript Interactive Mode'));
          console.log(chalk.gray('Type "exit" to quit, "stats" for statistics\n'));
          continue;
        }
        
        // معالجة الإدخال
        sessionCount++;
        console.log(chalk.gray(`[${sessionCount}] Processing...`));
        
        let result;
        const startTime = Date.now();
        
        if (options.mode === 'ask') {
          result = await engine.ask(trimmed);
        } else if (options.mode === 'process') {
          const processResult = await engine.processIntent(trimmed);
          result = processResult.success ? processResult.data : processResult.message;
        } else {
          // تلقائي - قرار ذكي
          if (trimmed.startsWith('?') || trimmed.includes('what') || trimmed.includes('how') || trimmed.includes('why')) {
            result = await engine.ask(trimmed);
          } else {
            const processResult = await engine.processIntent(trimmed);
            result = processResult.success ? processResult.data : processResult.message;
          }
        }
        
        const duration = Date.now() - startTime;
        
        console.log(chalk.green(`✅ ${result}`));
        console.log(chalk.gray(`   ⏱️  ${duration}ms\n`));
        
      } catch (error) {
        console.error(chalk.red(`❌ ${error.message}\n`));
      }
    }
    
    // إحصائيات الجلسة النهائية
    const finalStats = engine.getStats();
    console.log(chalk.yellow('\n📊 Final Session Statistics:'));
    console.log(`   Total Requests: ${finalStats.totalRequests}`);
    console.log(`   Total Cost: $${finalStats.totalCost.toFixed(6)}`);
    console.log(`   Session Duration: ${sessionCount} interactions`);
    console.log(chalk.cyan('\n👋 Goodbye!'));
  });

// أمر الاختبار
program
  .command('test [type]')
  .description('Run system tests')
  .option('-q, --quick', 'Quick test only')
  .action(async (type = 'full', options) => {
    console.log(chalk.cyan('🧪 Running NiaScript Tests\n'));
    
    try {
      if (options.quick || type === 'quick') {
        await runConfig.quick();
      } else if (type === 'performance') {
        await runConfig.performance();
      } else if (type === 'cost') {
        await runConfig.cost();
      } else {
        await runConfig.full();
      }
      
      console.log(chalk.green('\n✅ Tests completed successfully!'));
      
    } catch (error) {
      console.error(chalk.red('\n❌ Tests failed: ') + error.message);
      process.exit(1);
    }
  });

// أمر الإحصائيات
program
  .command('stats')
  .description('Show usage statistics')
  .option('-d, --detailed', 'Show detailed statistics')
  .action((options) => {
    const stats = nia.stats();
    
    if (!stats) {
      console.log(chalk.yellow('📊 No usage data available yet'));
      return;
    }
    
    console.log(chalk.cyan('📊 NiaScript Usage Statistics\n'));
    console.log(`💰 Total Cost: $${stats.totalCost.toFixed(6)}`);
    console.log(`📈 Total Requests: ${stats.totalRequests}`);
    console.log(`⏱️  Average Response: ${stats.averageResponseTime}ms\n`);
    
    if (options.detailed) {
      console.log(chalk.yellow('🎯 Usage by Domain:'));
      Object.entries(stats.topDomains).forEach(([domain, count]) => {
        const percentage = (count / stats.totalRequests * 100).toFixed(1);
        console.log(`   ${domain}: ${count} (${percentage}%)`);
      });
      
      const hourlyData = nia.costTracker?.getHourlyCost() || 0;
      const dailyData = nia.costTracker?.getDailyCost() || 0;
      
      console.log(chalk.yellow('\n💰 Cost Breakdown:'));
      console.log(`   Last Hour: $${hourlyData.toFixed(6)}`);
      console.log(`   Last 24h: $${dailyData.toFixed(6)}`);
      console.log(`   Per Request: $${(stats.totalCost / stats.totalRequests).toFixed(6)}`);
    }
  });

// أمر البريد الإلكتروني
program
  .command('email [action]')
  .description('Email operations (inbox, send, read, search, compose)')
  .option('-t, --to <recipient>', 'Email recipient')
  .option('-s, --subject <subject>', 'Email subject')
  .option('-i, --id <id>', 'Email ID for read/delete operations')
  .option('-q, --query <query>', 'Search query')
  .action(async (action = 'inbox', options) => {
    try {
      let result;
      
      switch (action.toLowerCase()) {
        case 'inbox':
        case 'list':
          result = await nia`show my emails`;
          break;
          
        case 'send':
          if (!options.to) {
            console.error(chalk.red('❌ Recipient required for send command'));
            console.log(chalk.gray('Example: nia email send --to ahmed --subject "Meeting"'));
            return;
          }
          const subject = options.subject || 'Hello';
          result = await nia`send email to ${options.to} about ${subject}`;
          break;
          
        case 'read':
          if (options.id) {
            result = await nia`read email #${options.id}`;
          } else {
            result = await nia`read my emails`;
          }
          break;
          
        case 'search':
          if (!options.query) {
            console.error(chalk.red('❌ Search query required'));
            console.log(chalk.gray('Example: nia email search --query "meeting"'));
            return;
          }
          result = await nia`search emails for ${options.query}`;
          break;
          
        case 'compose':
          if (!options.to) {
            console.error(chalk.red('❌ Recipient required for compose'));
            return;
          }
          result = await nia`compose email to ${options.to}`;
          break;
          
        case 'delete':
          if (!options.id) {
            console.error(chalk.red('❌ Email ID required for delete'));
            console.log(chalk.gray('Example: nia email delete --id 3'));
            return;
          }
          result = await nia`delete email #${options.id}`;
          break;
          
        case 'summary':
          result = await nia`email summary`;
          break;
          
        default:
          console.error(chalk.red(`❌ Unknown email action: ${action}`));
          console.log(chalk.yellow('Available actions: inbox, send, read, search, compose, delete, summary'));
          return;
      }
      
      console.log(chalk.blue('📧 ') + result);
      
    } catch (error) {
      console.error(chalk.red('❌ Email error: ') + error.message);
    }
  });
  .description('Manage configuration')
  .option('-s, --show', 'Show current configuration')
  .option('--log-level <level>', 'Set log level (debug|info|warn|error)')
  .option('--enable-ai', 'Enable general AI fallback')
  .option('--disable-ai', 'Disable general AI fallback')
  .action((options) => {
    if (options.show) {
      console.log(chalk.cyan('⚙️  NiaScript Configuration\n'));
      console.log(`Log Level: ${process.env.NIA_LOG_LEVEL || 'info'}`);
      console.log(`OpenAI Key: ${process.env.OPENAI_API_KEY ? '✅ Set' : '❌ Missing'}`);
      console.log(`General AI: ${process.env.NIA_ENABLE_GENERAL_AI !== 'false' ? '✅ Enabled' : '❌ Disabled'}`);
      return;
    }
    
    if (options.logLevel) {
      process.env.NIA_LOG_LEVEL = options.logLevel;
      console.log(chalk.green(`✅ Log level set to: ${options.logLevel}`));
    }
    
    if (options.enableAi) {
      process.env.NIA_ENABLE_GENERAL_AI = 'true';
      console.log(chalk.green('✅ General AI enabled'));
    }
    
    if (options.disableAi) {
      process.env.NIA_ENABLE_GENERAL_AI = 'false';
      console.log(chalk.yellow('⚠️  General AI disabled'));
    }
  });

// أمر المساعدة المحسن
program
  .command('help-examples')
  .description('Show usage examples')
  .action(() => {
    console.log(chalk.cyan('📚 NiaScript Usage Examples\n'));
    
    console.log(chalk.yellow('💰 Financial Queries:'));
    console.log('   nia process "Bitcoin price"');
    console.log('   nia process "سعر الإيثيريوم"');
    console.log('   nia process "$5000 at 8% for 10 years"');
    console.log('   nia process "Compare BTC and ETH"');
    
    console.log(chalk.yellow('\n🧠 General Questions:'));
    console.log('   nia ask "What is machine learning?"');
    console.log('   nia ask "How to learn programming?"');
    console.log('   nia ask "ما هي أفضل طريقة لتعلم اللغة؟"');
    
    console.log(chalk.yellow('\n📧 Email Commands:'));
    console.log('   nia email inbox              # Show email list');
    console.log('   nia email send --to ahmed --subject "Meeting"');
    console.log('   nia email read --id 1        # Read specific email');
    console.log('   nia email search --query "important"');
    console.log('   nia email compose --to sara');
    console.log('   nia email delete --id 2');
    console.log('   nia email summary            # Email overview');
    
    console.log(chalk.yellow('\n🔧 System Commands:'));
    console.log('   nia interactive          # Start interactive mode');
    console.log('   nia test quick           # Quick system test');
    console.log('   nia stats --detailed     # Detailed statistics');
    console.log('   nia config --show        # Show configuration');
    
    console.log(chalk.yellow('\n🎯 Interactive Mode:'));
    console.log('   Type "stats" for statistics');
    console.log('   Type "clear" to clear screen');
    console.log('   Type "exit" to quit');
    
    console.log(chalk.gray('\n💡 Tip: Use "nia ask" for direct AI questions'));
    console.log(chalk.gray('💡 Tip: Use "nia process" for intent-based processing'));
  });

// معالجة الأخطاء العامة
process.on('unhandledRejection', (error) => {
  console.error(chalk.red('\n❌ Unhandled Error: ') + error.message);
  if (process.env.NODE_ENV === 'development') {
    console.error(error.stack);
  }
  process.exit(1);
});

// معالجة انقطاع المستخدم
process.on('SIGINT', () => {
  console.log(chalk.yellow('\n\n👋 NiaScript stopped by user'));
  process.exit(0);
});

// تشغيل البرنامج
program.parse();

// إذا لم يتم تمرير أي أوامر، عرض المساعدة
if (!process.argv.slice(2).length) {
  program.outputHelp();
  console.log(chalk.gray('\n💡 Try: nia help-examples for usage examples'));
  console.log(chalk.gray('💡 Try: nia interactive for interactive mode'));
}

// package.json المحدث للـ CLI
const packageJsonUpdate = {
  "bin": {
    "nia": "./bin/nia-cli.js"
  },
  "scripts": {
    "start": "node examples/enhanced-demo.js",
    "cli": "node bin/nia-cli.js",
    "test": "node bin/nia-cli.js test",
    "interactive": "node bin/nia-cli.js interactive",
    "dev": "nodemon examples/enhanced-demo.js",
    "build": "rollup -c",
    "docs": "jsdoc -d docs src/",
    "stats": "node bin/nia-cli.js stats",
    "install-global": "npm install -g ."
  },
  "dependencies": {
    "commander": "^11.0.0",
    "inquirer": "^9.2.0",
    // ... باقي التبعيات
  }
};

// README للـ CLI
const cliReadme = `
# 🎯 NiaScript CLI

## Installation

\`\`\`bash
npm install -g niascript
\`\`\`

## Usage

### Quick Start
\`\`\`bash
# Ask any question directly
nia ask "What is artificial intelligence?"

# Process financial queries
nia process "Bitcoin price"

# Interactive mode
nia interactive
\`\`\`

### Advanced Usage
\`\`\`bash
# Run tests
nia test quick
nia test performance
nia test full

# View statistics
nia stats
nia stats --detailed

# Configuration
nia config --show
nia config --log-level debug
nia config --enable-ai
\`\`\`

### Interactive Mode
\`\`\`bash
nia interactive

nia> Bitcoin price
✅ Bitcoin price: $45,230 USD
   ⏱️  1,245ms

nia> What is blockchain?
✅ Blockchain is a distributed ledger technology...
   ⏱️  2,150ms

nia> stats
📊 Session Statistics:
   Requests: 2
   Total Cost: $0.003456
   Avg Time: 1,697ms

nia> exit
👋 Goodbye!
\`\`\`

## Commands

| Command | Description |
|---------|-------------|
| \`ask <question>\` | Direct AI question |
| \`process <input>\` | Intent-based processing |
| \`interactive\` | Interactive mode |
| \`test [type]\` | Run system tests |
| \`stats\` | Show usage statistics |
| \`config\` | Manage configuration |
| \`help-examples\` | Show usage examples |

## Examples

### Financial Queries
\`\`\`bash
nia process "Bitcoin price"
nia process "سعر الذهب اليوم"
nia process "$10000 at 7% for 15 years"
nia process "Compare ETH and ADA performance"
\`\`\`

### General Questions
\`\`\`bash
nia ask "How does machine learning work?"
nia ask "What are the best programming practices?"
nia ask "كيف أتعلم البرمجة بسرعة؟"
nia ask "Explain quantum computing simply"
\`\`\`

### System Management
\`\`\`bash
nia test quick           # Quick functionality test
nia stats --detailed     # Detailed usage analytics
nia config --show        # Current configuration
nia interactive --mode ask  # Ask-only interactive mode
\`\`\`

## Configuration

Set environment variables in \`.env\`:

\`\`\`bash
OPENAI_API_KEY=your_openai_key_here
NIA_LOG_LEVEL=info
NIA_ENABLE_GENERAL_AI=true
NIA_MAX_DAILY_COST=5.00
\`\`\`

## Tips

💡 Use \`nia ask\` for direct AI questions  
💡 Use \`nia process\` for intent-based processing  
💡 Use \`nia interactive\` for conversational mode  
💡 Run \`nia stats\` regularly to monitor costs  
💡 Use \`--verbose\` flag for detailed logging  

## Cost Monitoring

NiaScript automatically tracks OpenAI usage:

\`\`\`bash
nia stats
📊 Total Cost: $0.0234
📈 Total Requests: 15
⏱️  Average Response: 1,250ms

💰 Cost Breakdown:
   Last Hour: $0.0123
   Per Request: $0.0016
\`\`\`
`;

export { packageJsonUpdate, cliReadme };