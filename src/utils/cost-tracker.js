
// src/utils/cost-tracker.js
export class CostTracker {
  constructor() {
    this.costs = [];
    this.usage = new Map();
    this.startTime = Date.now();
  }

  recordUsage(sessionId, intent, duration, cost = 0) {
    const usage = {
      sessionId,
      domain: intent.domain,
      action: intent.action,
      duration,
      cost,
      timestamp: Date.now(),
      type: 'plugin'
    };
    
    this.costs.push(usage);
    this.updateDomainStats(intent.domain, duration, cost);
  }

  recordDirectAI(sessionId, question, duration, cost) {
    const usage = {
      sessionId,
      domain: 'general-ai',
      action: 'ask',
      duration,
      cost,
      timestamp: Date.now(),
      type: 'direct-ask',
      question: question.substring(0, 50)
    };
    
    this.costs.push(usage);
    this.updateDomainStats('general-ai', duration, cost);
  }

  recordFallback(sessionId, intent, cost) {
    const usage = {
      sessionId,
      domain: 'general-ai',
      action: 'fallback',
      originalDomain: intent.domain,
      cost,
      timestamp: Date.now(),
      type: 'fallback'
    };
    
    this.costs.push(usage);
    this.updateDomainStats('general-ai-fallback', 0, cost);
  }

  updateDomainStats(domain, duration, cost) {
    const domainStats = this.usage.get(domain) || { 
      calls: 0, totalCost: 0, totalTime: 0 
    };
    
    domainStats.calls++;
    domainStats.totalCost += cost;
    domainStats.totalTime += duration;
    
    this.usage.set(domain, domainStats);
  }

  calculateOpenAICost(response) {
‎    // تكلفة GPT-3.5-turbo: $0.002 per 1K tokens
    const inputTokens = response.usage?.prompt_tokens || 0;
    const outputTokens = response.usage?.completion_tokens || 0;
    
    return (inputTokens + outputTokens) * 0.002 / 1000;
  }

  addCost(cost) {
    this.costs.push({
      cost,
      timestamp: Date.now(),
      type: 'openai'
    });
  }

  getTotalCost() {
    return this.costs.reduce((total, item) => total + (item.cost || 0), 0);
  }

  getTotalRequests() {
    return this.costs.length;
  }

  getAverageResponseTime() {
    const times = this.costs.filter(c => c.duration).map(c => c.duration);
    return times.length > 0 ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : 0;
  }

  getTopDomains() {
    const domains = {};
    for (const [domain, stats] of this.usage) {
      domains[domain] = stats.calls;
    }
    
    return Object.fromEntries(
      Object.entries(domains).sort(([,a], [,b]) => b - a)
    );
  }

  getHourlyCost() {
    const now = Date.now();
    const hourAgo = now - (60 * 60 * 1000);
    
    return this.costs
      .filter(c => c.timestamp > hourAgo)
      .reduce((total, item) => total + (item.cost || 0), 0);
  }

  getDailyCost() {
    const now = Date.now();
    const dayAgo = now - (24 * 60 * 60 * 1000);
    
    return this.costs
      .filter(c => c.timestamp > dayAgo)
      .reduce((total, item) => total + (item.cost || 0), 0);
  }

‎  // تنظيف البيانات القديمة (احتفظ بآخر 24 ساعة فقط)
  cleanup() {
    const dayAgo = Date.now() - (24 * 60 * 60 * 1000);
    this.costs = this.costs.filter(c => c.timestamp > dayAgo);
  }

‎  // تصدير إحصائيات مفصلة
  exportStats() {
    return {
      summary: {
        totalRequests: this.getTotalRequests(),
        totalCost: this.getTotalCost(),
        averageResponseTime: this.getAverageResponseTime(),
        hourlyCost: this.getHourlyCost(),
        dailyCost: this.getDailyCost()
      },
      byDomain: Object.fromEntries(this.usage),
      recentActivity: this.costs.slice(-10)
    };
  }
}