export class ErrorHandler {
  constructor() {
    this.errorHandlers = [];
    this.errorHistory = [];
    this.errorPatterns = {
      API_FAILURE: /(?:network|connection|timeout|fetch|axios)/i,
      RATE_LIMIT: /(?:rate.?limit|too.?many.?requests|429)/i,
      AMBIGUOUS_INTENT: /(?:ambiguous|unclear|multiple.?matches)/i,
      INVALID_PARAMS: /(?:invalid|missing|required).?param/i,
      PROVIDER_ERROR: /(?:provider|service).?(?:unavailable|error)/i,
      AUTHENTICATION: /(?:auth|unauthorized|forbidden|401|403)/i
    };
  }

  onError(handler) {
    this.errorHandlers.push(handler);
  }

  async handleError(error, context = {}) {
    const errorInfo = this.analyzeError(error);
    this.logError(errorInfo, context);
    
    // Try registered error handlers
    for (const handler of this.errorHandlers) {
      try {
        const result = await handler(errorInfo, {
          ...context,
          retry: () => this.retry(context),
          tryFallback: () => this.tryFallback(context)
        });
        
        if (result !== undefined) {
          return result;
        }
      } catch (handlerError) {
        this.logError(handlerError, { source: 'errorHandler' });
      }
    }
    
    // Default error handling
    return this.getDefaultErrorResponse(errorInfo);
  }

  async handleExecutionError(error, recipe) {
    const errorInfo = this.analyzeError(error);
    
    // Try fallback providers if available
    if (recipe.fallbacks && recipe.fallbacks.length > 0) {
      for (const fallback of recipe.fallbacks) {
        try {
          // This would need integration with the SafeExecutor
          // For now, just log the attempt
          this.logError(error, { 
            message: `Trying fallback provider: ${fallback.provider}`,
            fallback: true 
          });
          
          // In a real implementation, we'd modify the recipe and retry
          throw new Error('Fallback execution not implemented yet');
          
        } catch (fallbackError) {
          continue;
        }
      }
    }
    
    return this.getErrorMessage(errorInfo);
  }

  analyzeError(error) {
    let errorType = 'UNKNOWN';
    let severity = 'medium';
    let retryable = false;
    let suggestion = null;

    const message = error.message || error.toString();

    // Classify error type
    for (const [type, pattern] of Object.entries(this.errorPatterns)) {
      if (pattern.test(message)) {
        errorType = type;
        break;
      }
    }

    // Determine severity and retryability
    switch (errorType) {
      case 'API_FAILURE':
        severity = 'high';
        retryable = true;
        suggestion = 'Check your internet connection and try again';
        break;
        
      case 'RATE_LIMIT':
        severity = 'medium';
        retryable = true;
        suggestion = 'Please wait a moment before trying again';
        break;
        
      case 'AMBIGUOUS_INTENT':
        severity = 'low'; 
        retryable = false;
        suggestion = 'Please be more specific in your request';
        break;
        
      case 'INVALID_PARAMS':
        severity = 'medium';
        retryable = false;
        suggestion = 'Check your input parameters';
        break;
        
      case 'PROVIDER_ERROR':
        severity = 'high';
        retryable = true;
        suggestion = 'Service temporarily unavailable, trying alternative';
        break;
        
      case 'AUTHENTICATION':
        severity = 'high';
        retryable = false;
        suggestion = 'Check your API credentials';
        break;
    }

    return {
      type: errorType,
      message,
      severity,
      retryable,
      suggestion,
      originalError: error,
      timestamp: new Date()
    };
  }

  logError(errorInfo, context = {}) {
    const logEntry = {
      ...errorInfo,
      context,
      id: Date.now().toString()
    };
    
    this.errorHistory.push(logEntry);
    
    // Keep only last 100 errors
    if (this.errorHistory.length > 100) {
      this.errorHistory = this.errorHistory.slice(-100);
    }
    
    // Console logging with appropriate level
    switch (errorInfo.severity) {
      case 'low':
        console.warn('⚠️  NiaScript Warning:', errorInfo.message);
        break;
      case 'medium':
        console.error('❌ NiaScript Error:', errorInfo.message);
        break;
      case 'high':
        console.error('🚨 NiaScript Critical Error:', errorInfo.message);
        if (errorInfo.suggestion) {
          console.log('💡 Suggestion:', errorInfo.suggestion);
        }
        break;
    }
  }

  getDefaultErrorResponse(errorInfo) {
    const responses = {
      API_FAILURE: "I'm having trouble connecting to the data source. Please check your internet connection and try again.",
      RATE_LIMIT: "I'm being rate limited. Please wait a moment and try again.",
      AMBIGUOUS_INTENT: "I'm not sure what you meant. Could you be more specific?",
      INVALID_PARAMS: "There seems to be an issue with the request parameters. Please check your input.",
      PROVIDER_ERROR: "The service is temporarily unavailable. I'm trying to find an alternative.",
      AUTHENTICATION: "There's an authentication issue. Please check your API credentials.",
      UNKNOWN: "Something went wrong. Please try again or rephrase your request."
    };
    
    let response = responses[errorInfo.type] || responses.UNKNOWN;
    
    if (errorInfo.suggestion) {
      response += ` Suggestion: ${errorInfo.suggestion}`;
    }
    
    return response;
  }

  getErrorMessage(errorInfo) {
    return `Error: ${errorInfo.message}${errorInfo.suggestion ? ` (${errorInfo.suggestion})` : ''}`;
  }

  async retry(context, maxRetries = 3) {
    if (!context.retryCount) {
      context.retryCount = 0;
    }
    
    if (context.retryCount >= maxRetries) {
      throw new Error('Maximum retry attempts exceeded');
    }
    
    context.retryCount++;
    
    // Exponential backoff
    const delay = Math.pow(2, context.retryCount) * 1000;
    await new Promise(resolve => setTimeout(resolve, delay));
    
    // This would need to be implemented with the actual retry logic
    throw new Error('Retry mechanism not implemented yet');
  }

  async tryFallback(context) {
    // This would need integration with the provider system
    throw new Error('Fallback mechanism not implemented yet');
  }

  // Error reporting and analytics
  getErrorStats() {
    const stats = {
      total: this.errorHistory.length,
      byType: {},
      bySeverity: {},
      recent: this.errorHistory.slice(-10)
    };
    
    for (const error of this.errorHistory) {
      stats.byType[error.type] = (stats.byType[error.type] || 0) + 1;
      stats.bySeverity[error.severity] = (stats.bySeverity[error.severity] || 0) + 1;
    }
    
    return stats;
  }

  clearErrorHistory() {
    this.errorHistory = [];
  }

  // User-friendly error formatting
  formatUserError(errorInfo) {
    const emoji = {
      low: '⚠️',
      medium: '❌', 
      high: '🚨'
    };
    
    return `${emoji[errorInfo.severity]} ${errorInfo.message}${errorInfo.suggestion ? `\n💡 ${errorInfo.suggestion}` : ''}`;
  }

  // Development helpers
  simulateError(type) {
    const errors = {
      API_FAILURE: new Error('Network connection failed'),
      RATE_LIMIT: new Error('Too many requests - rate limit exceeded'),
      AMBIGUOUS_INTENT: new Error('Ambiguous intent detected'),
      INVALID_PARAMS: new Error('Invalid parameter provided'),
      PROVIDER_ERROR: new Error('Provider service unavailable'),
      AUTHENTICATION: new Error('Unauthorized access - 401')
    };
    
    throw errors[type] || new Error('Unknown error type');
  }
}