import axios from 'axios';

export class SafeExecutor {
  constructor(providerManager, errorHandler) {
    this.providerManager = providerManager;
    this.errorHandler = errorHandler;
    this.context = new Map();
    this.executionHistory = [];
    this.pluginManager = null;
    this.safeOperations = {
      'api_call': this.executeApiCall.bind(this),
      'parallel_api_calls': this.executeParallelApiCalls.bind(this),
      'batch_api_calls': this.executeBatchApiCalls.bind(this),
      'calculate': this.executeCalculation.bind(this),
      'format_response': this.executeFormatResponse.bind(this),
      'transform': this.executeTransform.bind(this),
      'error': this.executeError.bind(this),
      'conditional': this.executeConditional.bind(this),
      'detect_language': this.executeCustomAction.bind(this),
      'determine_target_language': this.executeCustomAction.bind(this),
      'libre_translate_call': this.executeCustomAction.bind(this),
      'extract_text_from_query': this.executeCustomAction.bind(this),
      'extract_email_parts': this.executeCustomAction.bind(this),
      'validate_email_address': this.executeCustomAction.bind(this),
      'send_smtp_email': this.executeCustomAction.bind(this),
      'send_via_sendgrid': this.executeCustomAction.bind(this),
      'fetch_recent_emails': this.executeCustomAction.bind(this),
      'format_email_list': this.executeCustomAction.bind(this),
      'generate_email_content': this.executeCustomAction.bind(this),
      'parse_email_query': this.executeCustomAction.bind(this),
      'get_email_templates': this.executeCustomAction.bind(this)
    };
  }

  async executeRecipe(recipe) {
    try {
      this.context.clear();
      const executionId = Date.now().toString();
      
      const execution = {
        id: executionId,
        recipe,
        startTime: new Date(),
        steps: [],
        status: 'running'
      };
      
      this.executionHistory.push(execution);
      
      for (let i = 0; i < recipe.steps.length; i++) {
        const step = recipe.steps[i];
        const stepExecution = {
          index: i,
          step,
          startTime: new Date(),
          status: 'running'
        };
        
        execution.steps.push(stepExecution);
        
        try {
          const result = await this.executeStep(step);
          
          stepExecution.result = result;
          stepExecution.endTime = new Date();
          stepExecution.status = 'completed';
          
          if (step.return) {
            execution.result = result;
            execution.endTime = new Date();
            execution.status = 'completed';
            return result;
          }
          
        } catch (error) {
          stepExecution.error = error.message;
          stepExecution.endTime = new Date();
          stepExecution.status = 'failed';
          
          // Try fallback providers if available
          if (recipe.fallbacks && recipe.fallbacks.length > 0) {
            const fallbackResult = await this.tryFallbacks(recipe.fallbacks, step);
            if (fallbackResult) {
              stepExecution.status = 'completed_via_fallback';
              stepExecution.result = fallbackResult;
              continue;
            }
          }
          
          execution.status = 'failed';
          execution.error = error.message;
          execution.endTime = new Date();
          throw error;
        }
      }
      
      execution.endTime = new Date();
      execution.status = 'completed';
      return execution.result || 'Recipe completed successfully';
      
    } catch (error) {
      return await this.errorHandler.handleExecutionError(error, recipe);
    }
  }

  async executeStep(step) {
    const { action } = step;
    
    // Check if it's a built-in safe operation
    if (this.safeOperations[action]) {
      const result = await this.safeOperations[action](step);
      
      if (step.assign_to) {
        this.context.set(step.assign_to, result);
      }
      
      return result;
    }
    
    // Check if it's a custom plugin action
    if (this.pluginManager) {
      try {
        const result = await this.executeCustomAction(step);
        
        if (step.assign_to) {
          this.context.set(step.assign_to, result);
        }
        
        return result;
      } catch (error) {
        // If custom action fails, check if it's an unknown operation
        throw new Error(`Unsafe or unknown operation: ${action}`);
      }
    }
    
    throw new Error(`Unsafe or unknown operation: ${action}`);
  }

  async executeApiCall(step) {
    const { provider, endpoint, params, transform } = step;
    
    const providerConfig = this.providerManager.getProvider(provider);
    if (!providerConfig) {
      throw new Error(`Provider not found: ${provider}`);
    }
    
    const url = `${providerConfig.baseURL}${providerConfig.endpoints[endpoint] || endpoint}`;
    const config = {
      method: 'GET',
      url,
      params: this.resolveParams(params),
      headers: providerConfig.headers || {},
      timeout: 10000
    };
    
    if (providerConfig.auth) {
      this.applyAuthentication(config, providerConfig.auth);
    }
    
    const response = await axios(config);
    let data = response.data;
    
    if (transform) {
      data = this.applyTransform(data, transform);
    }
    
    return data;
  }

  async executeParallelApiCalls(step) {
    const { calls } = step;
    
    const promises = calls.map(async (call) => {
      try {
        const result = await this.executeApiCall(call);
        return { success: true, result, call };
      } catch (error) {
        return { success: false, error: error.message, call };
      }
    });
    
    const results = await Promise.all(promises);
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    
    if (successful.length === 0) {
      throw new Error(`All parallel calls failed: ${failed.map(f => f.error).join(', ')}`);
    }
    
    return {
      successful: successful.map(s => ({ ...s.result, source: s.call.assign_to })),
      failed: failed.length,
      total: results.length
    };
  }

  async executeBatchApiCalls(step) {
    const { calls, provider } = step;
    
    const results = [];
    for (const call of calls) {
      try {
        const result = await this.executeApiCall({ ...call, provider });
        results.push({ success: true, result, call });
      } catch (error) {
        results.push({ success: false, error: error.message, call });
      }
    }
    
    return results;
  }

  async executeCalculation(step) {
    const { operation, params, inputs } = step;
    
    const calculator = {
      'compound_interest': this.calculateCompoundInterest.bind(this),
      'percentage_change': this.calculatePercentageChange.bind(this),
      'standard_deviation': this.calculateStandardDeviation.bind(this),
      'mean': this.calculateMean.bind(this),
      'correlation': this.calculateCorrelation.bind(this)
    };
    
    if (!calculator[operation]) {
      throw new Error(`Unknown calculation: ${operation}`);
    }
    
    const resolvedParams = this.resolveParams(params);
    const resolvedInputs = inputs ? inputs.map(input => this.context.get(input)) : [];
    
    return calculator[operation](resolvedParams, resolvedInputs);
  }

  async executeFormatResponse(step) {
    const { template } = step;
    
    return this.interpolateString(template);
  }

  async executeTransform(step) {
    const { input, operation } = step;
    const data = this.context.get(input);
    
    const transformations = {
      'parseFloat': (val) => parseFloat(val),
      'parseInt': (val) => parseInt(val),
      'toUpperCase': (val) => val.toString().toUpperCase(),
      'toLowerCase': (val) => val.toString().toLowerCase(),
      'round': (val) => Math.round(parseFloat(val)),
      'abs': (val) => Math.abs(parseFloat(val))
    };
    
    if (!transformations[operation]) {
      throw new Error(`Unknown transformation: ${operation}`);
    }
    
    return transformations[operation](data);
  }

  async executeError(step) {
    const { message, suggest_clarification } = step;
    
    const error = new Error(message);
    error.needsClarification = suggest_clarification;
    throw error;
  }

  // Helper Methods
  resolveParams(params) {
    if (!params) return {};
    
    const resolved = {};
    for (const [key, value] of Object.entries(params)) {
      if (typeof value === 'string' && value.startsWith('${') && value.endsWith('}')) {
        const contextKey = value.slice(2, -1);
        resolved[key] = this.context.get(contextKey) || value;
      } else {
        resolved[key] = value;
      }
    }
    return resolved;
  }

  interpolateString(template) {
    return template.replace(/\$\{(\w+(?:\.\w+)*)\}/g, (match, path) => {
      const keys = path.split('.');
      let value = this.context.get(keys[0]);
      
      for (let i = 1; i < keys.length && value; i++) {
        value = value[keys[i]];
      }
      
      return value !== undefined ? value : match;
    });
  }

  applyAuthentication(config, auth) {
    switch (auth.type) {
      case 'apiKey':
        config.params = { ...config.params, [auth.paramName || 'apikey']: auth.key };
        break;
      case 'bearer':
        config.headers.Authorization = `Bearer ${auth.token}`;
        break;
      case 'basic':
        config.auth = { username: auth.username, password: auth.password };
        break;
    }
  }

  applyTransform(data, transform) {
    if (transform.startsWith('parseFloat(') && transform.endsWith(')')) {
      const path = transform.slice(11, -1);
      
      // Handle different response structures
      let value = data;
      if (path === 'response.price') {
        // For Binance API, the response directly contains the price field
        value = data.price;
      } else {
        const pathParts = path.split('.');
        for (const key of pathParts) {
          if (key !== 'response' && value && typeof value === 'object') {
            value = value[key];
          }
        }
      }
      
      return parseFloat(value);
    }
    
    return data;
  }

  // Calculation Methods
  calculateCompoundInterest(params) {
    const { principal, rate, time, compound_frequency = 12 } = params;
    const A = principal * Math.pow(1 + (rate / 100) / compound_frequency, compound_frequency * time);
    return Math.round(A * 100) / 100;
  }

  calculatePercentageChange(params, inputs) {
    const [data1, data2] = inputs;
    
    const getFirstLast = (data) => {
      if (Array.isArray(data) && data.length > 0) {
        return {
          first: parseFloat(data[0][1] || data[0].open || data[0]),
          last: parseFloat(data[data.length - 1][4] || data[data.length - 1].close || data[data.length - 1])
        };
      }
      return { first: 0, last: 0 };
    };
    
    const asset1 = getFirstLast(data1);
    const asset2 = getFirstLast(data2);
    
    return {
      asset1_change: Math.round(((asset1.last - asset1.first) / asset1.first) * 10000) / 100,
      asset2_change: Math.round(((asset2.last - asset2.first) / asset2.first) * 10000) / 100
    };
  }

  calculateStandardDeviation(params, inputs) {
    const data = inputs[0] || params.data;
    const mean = data.reduce((sum, val) => sum + val, 0) / data.length;
    const variance = data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / data.length;
    return Math.sqrt(variance);
  }

  calculateMean(params, inputs) {
    const data = inputs[0] || params.data;
    return data.reduce((sum, val) => sum + val, 0) / data.length;
  }

  calculateCorrelation(params, inputs) {
    const [x, y] = inputs;
    if (x.length !== y.length) throw new Error('Arrays must have equal length');
    
    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((total, xi, i) => total + xi * y[i], 0);
    const sumX2 = x.reduce((total, xi) => total + xi * xi, 0);
    const sumY2 = y.reduce((total, yi) => total + yi * yi, 0);
    
    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
    
    return denominator === 0 ? 0 : numerator / denominator;
  }

  // Fallback handling
  async tryFallbacks(fallbacks, originalStep) {
    for (const fallback of fallbacks) {
      try {
        const fallbackStep = { ...originalStep, provider: fallback.provider };
        return await this.executeStep(fallbackStep);
      } catch (error) {
        continue;
      }
    }
    return null;
  }

  // Security validation
  validateStep(step) {
    const allowedActions = Object.keys(this.safeOperations);
    
    if (!allowedActions.includes(step.action)) {
      throw new Error(`Unsafe action: ${step.action}`);
    }
    
    if (step.code || step.eval || step.exec) {
      throw new Error('Code execution not allowed');
    }
    
    return true;
  }

  // Context management
  getContext() {
    return Object.fromEntries(this.context);
  }

  clearContext() {
    this.context.clear();
  }

  getExecutionHistory() {
    return this.executionHistory;
  }

  // Plugin manager integration
  setPluginManager(pluginManager) {
    this.pluginManager = pluginManager;
  }

  // Execute custom plugin actions
  async executeCustomAction(step) {
    const { action } = step;
    
    if (!this.pluginManager) {
      throw new Error('Plugin manager not available for custom actions');
    }
    
    // Try to find the action in installed plugins
    for (const [actionName, actionFunction] of this.pluginManager.customActions) {
      if (actionName.endsWith(`.${action}`) || actionName === action) {
        const params = this.resolveParams(step);
        return await actionFunction(params);
      }
    }
    
    throw new Error(`Custom action not found: ${action}`);
  }

  // Execute conditional logic
  async executeConditional(step) {
    const { condition, if_true, if_false } = step;
    
    // Resolve the condition
    const resolvedCondition = this.resolveBooleanCondition(condition);
    
    const stepsToExecute = resolvedCondition ? if_true : if_false;
    
    if (!stepsToExecute || !Array.isArray(stepsToExecute)) {
      return null;
    }
    
    let lastResult = null;
    for (const conditionalStep of stepsToExecute) {
      lastResult = await this.executeStep(conditionalStep);
      
      if (conditionalStep.return) {
        return lastResult;
      }
    }
    
    return lastResult;
  }

  // Resolve boolean conditions
  resolveBooleanCondition(condition) {
    if (typeof condition === 'boolean') {
      return condition;
    }
    
    if (typeof condition === 'string') {
      // Handle template variables
      if (condition.startsWith('${') && condition.endsWith('}')) {
        const contextKey = condition.slice(2, -1);
        const value = this.context.get(contextKey);
        return Boolean(value);
      }
      
      // Handle simple boolean string values
      if (condition.toLowerCase() === 'true') return true;
      if (condition.toLowerCase() === 'false') return false;
    }
    
    return Boolean(condition);
  }

  // Enhanced parameter resolution for plugins
  resolveParams(step) {
    const params = {};
    
    // Add all step properties except action and assign_to
    Object.entries(step).forEach(([key, value]) => {
      if (key !== 'action' && key !== 'assign_to') {
        params[key] = this.resolveValue(value);
      }
    });
    
    return params;
  }

  resolveValue(value) {
    if (typeof value === 'string' && value.startsWith('${') && value.endsWith('}')) {
      const contextKey = value.slice(2, -1);
      return this.context.get(contextKey) || value;
    }
    
    if (Array.isArray(value)) {
      return value.map(item => this.resolveValue(item));
    }
    
    if (value && typeof value === 'object') {
      const resolved = {};
      Object.entries(value).forEach(([key, val]) => {
        resolved[key] = this.resolveValue(val);
      });
      return resolved;
    }
    
    return value;
  }

  // Add custom safe operations dynamically
  addSafeOperation(name, handler) {
    this.safeOperations[name] = handler.bind(this);
  }

  // Remove safe operation
  removeSafeOperation(name) {
    delete this.safeOperations[name];
  }

  // Get list of available operations
  getAvailableOperations() {
    return Object.keys(this.safeOperations);
  }
}