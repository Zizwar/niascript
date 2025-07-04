
// src/utils/smart-logger.js
import chalk from 'chalk';

export class Logger {
  constructor(options = {}) {
    this.level = options.level || 'info';
    this.showCost = options.showCost || false;
    this.showTiming = options.showTiming || false;
    this.compact = options.compact !== false; // compact by default
    
    this.levels = { debug: 0, info: 1, warn: 2, error: 3 };
    this.activeRequests = new Map();
  }

  startRequest(sessionId, input) {
    this.activeRequests.set(sessionId, {
      input: input.substring(0, 50) + (input.length > 50 ? '...' : ''),
      startTime: Date.now()
    });
    
    if (this.levels[this.level] <= 1) {
      console.log(chalk.blue('🚀') + chalk.gray(` [${sessionId.slice(-6)}]`) + ` ${input}`);
    }
  }

  logIntent(sessionId, intent) {
    if (this.levels[this.level] <= 0) {
      const confidence = Math.round(intent.confidence * 100);
      console.log(chalk.gray('   ├─') + chalk.cyan(`Intent: ${intent.domain}.${intent.action}`) + 
                  chalk.gray(` (${confidence}%)`));
    }
  }

  logSuccess(sessionId, result, duration) {
    const request = this.activeRequests.get(sessionId);
    this.activeRequests.delete(sessionId);
    
    if (this.levels[this.level] <= 1) {
      let output = chalk.green('✅') + chalk.gray(` [${sessionId.slice(-6)}]`);
          // إضافة التوقيت إذا كان مطلوباً
      if (this.showTiming) {
        output += chalk.yellow(` ${duration}ms`);
      }
      
  // إضافة التكلفة إذا كانت متوفرة
      if (this.showCost && result.cost) {
        output += chalk.magenta(` $${result.cost.toFixed(4)}`);
      }
          // النتيجة المختصرة
      const resultPreview = typeof result.data === 'string' ? 
        result.data.substring(0, 60) + (result.data.length > 60 ? '...' : '') :
        `${result.success ? 'Success' : 'Failed'}`;
      
      output += ` ${resultPreview}`;
      console.log(output);
    }
  }

  logError(sessionId, error, duration) {
    const request = this.activeRequests.get(sessionId);
    this.activeRequests.delete(sessionId);
    
    if (this.levels[this.level] <= 3) {
      let output = chalk.red('❌') + chalk.gray(` [${sessionId.slice(-6)}]`);
      
      if (this.showTiming) {
        output += chalk.yellow(` ${duration}ms`);
      }
      
      output += ` ${error.message}`;
      console.log(output);
      
   // تفاصيل إضافية في حالة الخطأ الحرج
      if (this.levels[this.level] <= 0 && error.stack) {
        console.log(chalk.gray('   └─ Stack:'), error.stack.split('\n')[1]?.trim());
      }
    }
  }

  logWarning(message) {
    if (this.levels[this.level] <= 2) {
      console.log(chalk.yellow('⚠️  ') + message);
    }
  }

  logApiCall(provider, endpoint, cost, duration) {
    if (this.levels[this.level] <= 0) {
      let output = chalk.gray('   ├─ API:') + ` ${provider}/${endpoint}`;
      
      if (this.showTiming) {
        output += chalk.yellow(` ${duration}ms`);
      }
      
      if (this.showCost && cost) {
        output += chalk.magenta(` $${cost.toFixed(4)}`);
      }
      
      console.log(output);
    }
  }

  setLevel(level) {
    this.level = level;
  }

 // دالة لطباعة إحصائيات دورية
  printStats(stats) {
    if (this.levels[this.level] <= 1) {
      console.log('\n' + chalk.blue('📊 NiaScript Stats:'));
      console.log(chalk.gray('├─') + ` Total Requests: ${stats.totalRequests}`);
      console.log(chalk.gray('├─') + ` Total Cost: $${stats.totalCost.toFixed(4)}`);
      console.log(chalk.gray('├─') + ` Avg Response: ${stats.averageResponseTime}ms`);
      console.log(chalk.gray('└─') + ` Top Domain: ${Object.keys(stats.topDomains)[0] || 'N/A'}\n`);
    }
  }
}
