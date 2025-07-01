import chalk from 'chalk';
import fs from 'fs/promises';
import path from 'path';

export class Logger {
  constructor(options = {}) {
    this.level = options.level || 'info';
    this.enableConsole = options.enableConsole !== false;
    this.enableFile = options.enableFile || false;
    this.logDir = options.logDir || './logs';
    this.logFile = path.join(this.logDir, 'niascript.log');
    this.maxFileSize = options.maxFileSize || 10 * 1024 * 1024; // 10MB
    this.maxFiles = options.maxFiles || 5;
    
    this.levels = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3
    };
    
    this.colors = {
      debug: chalk.gray,
      info: chalk.blue,
      warn: chalk.yellow,
      error: chalk.red
    };
    
    this.initialize();
  }

  async initialize() {
    if (this.enableFile) {
      try {
        await fs.mkdir(this.logDir, { recursive: true });
      } catch (error) {
        console.warn('Failed to create log directory:', error.message);
        this.enableFile = false;
      }
    }
  }

  shouldLog(level) {
    return this.levels[level] >= this.levels[this.level];
  }

  formatMessage(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    const metaStr = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
    
    return {
      console: `${chalk.gray(timestamp)} ${this.colors[level](`[${level.toUpperCase()}]`)} ${message}${metaStr}`,
      file: `${timestamp} [${level.toUpperCase()}] ${message}${metaStr}`
    };
  }

  async log(level, message, meta = {}) {
    if (!this.shouldLog(level)) return;
    
    const formatted = this.formatMessage(level, message, meta);
    
    if (this.enableConsole) {
      console.log(formatted.console);
    }
    
    if (this.enableFile) {
      await this.writeToFile(formatted.file);
    }
  }

  async writeToFile(message) {
    try {
      // Check file size and rotate if necessary
      await this.rotateLogIfNeeded();
      
      await fs.appendFile(this.logFile, message + '\n');
    } catch (error) {
      console.error('Failed to write to log file:', error.message);
    }
  }

  async rotateLogIfNeeded() {
    try {
      const stats = await fs.stat(this.logFile);
      
      if (stats.size > this.maxFileSize) {
        // Rotate logs
        for (let i = this.maxFiles - 1; i > 0; i--) {
          const oldFile = `${this.logFile}.${i}`;
          const newFile = `${this.logFile}.${i + 1}`;
          
          try {
            await fs.rename(oldFile, newFile);
          } catch (error) {
            // File doesn't exist, continue
          }
        }
        
        // Move current log to .1
        await fs.rename(this.logFile, `${this.logFile}.1`);
      }
    } catch (error) {
      // File doesn't exist yet, no need to rotate
    }
  }

  debug(message, meta = {}) {
    return this.log('debug', message, meta);
  }

  info(message, meta = {}) {
    return this.log('info', message, meta);
  }

  warn(message, meta = {}) {
    return this.log('warn', message, meta);
  }

  error(message, meta = {}) {
    return this.log('error', message, meta);
  }

  // Performance logging
  time(label) {
    if (!this.timers) this.timers = new Map();
    this.timers.set(label, Date.now());
  }

  timeEnd(label) {
    if (!this.timers || !this.timers.has(label)) {
      this.warn(`Timer '${label}' does not exist`);
      return;
    }
    
    const startTime = this.timers.get(label);
    const duration = Date.now() - startTime;
    this.timers.delete(label);
    
    this.info(`${label}: ${duration}ms`);
    return duration;
  }

  // Request/Response logging for API calls
  logApiCall(provider, endpoint, params, response, duration) {
    this.info('API Call', {
      provider,
      endpoint, 
      params,
      responseSize: typeof response === 'string' ? response.length : JSON.stringify(response).length,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString()
    });
  }

  logApiError(provider, endpoint, error, duration) {
    this.error('API Error', {
      provider,
      endpoint,
      error: error.message,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString()
    });
  }

  // Intent processing logging
  logIntentProcessing(query, intent, confidence) {
    this.debug('Intent Processed', {
      query,
      type: intent.type,
      confidence,
      entities: intent.entities,
      needsClarification: intent.needsClarification
    });
  }

  logRecipeGeneration(intent, recipe, confidence) {
    this.debug('Recipe Generated', {
      intentType: intent.type,
      confidence,
      stepCount: recipe.steps?.length || 0,
      fallbackCount: recipe.fallbacks?.length || 0
    });
  }

  logRecipeExecution(recipe, result, duration, stepResults) {
    this.info('Recipe Executed', {
      confidence: recipe.confidence,
      stepCount: recipe.steps?.length || 0,
      duration: `${duration}ms`,
      success: !!result,
      failedSteps: stepResults?.filter(s => s.status === 'failed').length || 0
    });
  }

  // Memory system logging
  logMemoryOperation(operation, details) {
    this.debug('Memory Operation', {
      operation,
      ...details
    });
  }

  // Error aggregation and reporting
  getErrorSummary(timeRange = 3600000) { // Last hour by default
    // This would be implemented to read from log files
    // For now, return a placeholder
    return {
      total: 0,
      byLevel: {},
      byCategory: {},
      timeRange: `${timeRange / 1000}s`
    };
  }

  // Performance metrics
  getPerformanceMetrics() {
    return {
      averageResponseTime: 0,
      apiCallCount: 0,
      errorRate: 0,
      uptime: process.uptime()
    };
  }

  // Custom formatters for complex objects
  formatIntent(intent) {
    return {
      type: intent.type,
      confidence: intent.confidence,
      entities: Object.keys(intent.entities || {}).length,
      needsClarification: intent.needsClarification
    };
  }

  formatRecipe(recipe) {
    return {
      confidence: recipe.confidence,
      steps: recipe.steps?.length || 0,
      fallbacks: recipe.fallbacks?.length || 0,
      estimatedCost: recipe.estimatedCost || 0
    };
  }

  // Development helpers
  enableDebugMode() {
    this.level = 'debug';
    this.info('Debug mode enabled');
  }

  disableDebugMode() {
    this.level = 'info';
    this.info('Debug mode disabled');
  }

  // Log level management
  setLevel(level) {
    if (this.levels[level] !== undefined) {
      this.level = level;
      this.info(`Log level set to ${level}`);
    } else {
      this.warn(`Invalid log level: ${level}`);
    }
  }

  // Structured logging for monitoring tools
  structuredLog(event, data = {}) {
    const logEntry = {
      event,
      timestamp: new Date().toISOString(),
      service: 'niascript',
      version: '1.0.0',
      ...data
    };
    
    this.info('STRUCTURED_LOG', logEntry);
  }
}