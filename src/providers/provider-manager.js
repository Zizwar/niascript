export class ProviderManager {
  constructor() {
    this.providers = new Map();
    this.categories = new Map();
  }

  registerProvider(name, config) {
    const provider = {
      ...config,
      name,
      registeredAt: new Date(),
      callCount: 0,
      errorCount: 0,
      lastUsed: null
    };

    this.providers.set(name, provider);
    
    if (config.category) {
      if (!this.categories.has(config.category)) {
        this.categories.set(config.category, []);
      }
      this.categories.get(config.category).push(name);
    }

    return provider;
  }

  getProvider(name) {
    return this.providers.get(name);
  }

  getProvidersByCategory(category) {
    const providerNames = this.categories.get(category) || [];
    return providerNames.map(name => this.providers.get(name)).filter(Boolean);
  }

  async selectBestProvider(category, requirements = {}) {
    const providers = this.getProvidersByCategory(category);
    
    if (providers.length === 0) {
      throw new Error(`No providers found for category: ${category}`);
    }

    let bestProvider = providers[0];
    let bestScore = this.calculateProviderScore(bestProvider, requirements);

    for (const provider of providers.slice(1)) {
      const score = this.calculateProviderScore(provider, requirements);
      if (score > bestScore) {
        bestScore = score;
        bestProvider = provider;
      }
    }

    return bestProvider;
  }

  calculateProviderScore(provider, requirements) {
    let score = 0;
    
    // Reliability score (0-40 points)
    score += (provider.reliability || 0.5) * 40;
    
    // Cost score (0-20 points, lower cost = higher score)
    const costScore = provider.cost === 0 ? 20 : Math.max(0, 20 - provider.cost * 10);
    score += costScore;
    
    // Performance score (0-20 points)
    const successRate = provider.callCount > 0 ? 
      (provider.callCount - provider.errorCount) / provider.callCount : 0.5;
    score += successRate * 20;
    
    // Rate limit availability (0-10 points)
    if (provider.rateLimits) {
      const rateLimitScore = this.checkRateLimits(provider) ? 10 : 0;
      score += rateLimitScore;
    }
    
    // Recent usage penalty (0-10 points)
    if (provider.lastUsed) {
      const timeSinceLastUse = Date.now() - provider.lastUsed.getTime();
      const recentUsagePenalty = Math.min(10, timeSinceLastUse / 60000); // minutes
      score += recentUsagePenalty;
    } else {
      score += 10; // Bonus for unused providers
    }

    return score;
  }

  checkRateLimits(provider) {
    if (!provider.rateLimits) return true;
    
    const { requests, window } = provider.rateLimits;
    const windowStart = Date.now() - window;
    
    // Simple rate limit checking - in production, this would be more sophisticated
    if (!provider.requestHistory) {
      provider.requestHistory = [];
    }
    
    // Clean old requests
    provider.requestHistory = provider.requestHistory.filter(
      timestamp => timestamp > windowStart
    );
    
    return provider.requestHistory.length < requests;
  }

  recordApiCall(providerName, success = true) {
    const provider = this.providers.get(providerName);
    if (provider) {
      provider.callCount++;
      provider.lastUsed = new Date();
      
      if (!success) {
        provider.errorCount++;
      }
      
      if (!provider.requestHistory) {
        provider.requestHistory = [];
      }
      provider.requestHistory.push(Date.now());
    }
  }

  getProviderStats(providerName) {
    const provider = this.providers.get(providerName);
    if (!provider) return null;
    
    return {
      name: provider.name,
      callCount: provider.callCount,
      errorCount: provider.errorCount,
      successRate: provider.callCount > 0 ? 
        (provider.callCount - provider.errorCount) / provider.callCount : 0,
      reliability: provider.reliability,
      cost: provider.cost,
      lastUsed: provider.lastUsed
    };
  }

  getAllProviders() {
    return Array.from(this.providers.values());
  }

  removeProvider(name) {
    const provider = this.providers.get(name);
    if (provider && provider.category) {
      const categoryProviders = this.categories.get(provider.category);
      if (categoryProviders) {
        const index = categoryProviders.indexOf(name);
        if (index > -1) {
          categoryProviders.splice(index, 1);
        }
      }
    }
    
    return this.providers.delete(name);
  }

  // Health check for providers
  async healthCheck() {
    const results = {};
    
    for (const [name, provider] of this.providers) {
      try {
        if (provider.healthCheckEndpoint) {
          const response = await fetch(`${provider.baseURL}${provider.healthCheckEndpoint}`);
          results[name] = {
            status: response.ok ? 'healthy' : 'unhealthy',
            responseTime: response.headers.get('x-response-time') || 'unknown'
          };
        } else {
          results[name] = { status: 'unknown', message: 'No health check endpoint' };
        }
      } catch (error) {
        results[name] = { status: 'error', error: error.message };
      }
    }
    
    return results;
  }
}