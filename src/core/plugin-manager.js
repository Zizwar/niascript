// src/core/plugin-manager.js
export class PluginManager {
  constructor() {
    this.plugins = new Map();
    this.usageStats = new Map();
  }

  async loadPlugin(domain, pluginPath) {
    try {
      const { default: PluginClass } = await import(pluginPath);
      const plugin = new PluginClass();
      
      this.plugins.set(domain, plugin);
      this.usageStats.set(domain, { calls: 0, successRate: 0, avgTime: 0 });
      
      return plugin;
    } catch (error) {
      console.warn(`Failed to load plugin ${domain}:`, error.message);
      return null;
    }
  }

  registerPlugin(domain, pluginInstance) {
    this.plugins.set(domain, pluginInstance);
    this.usageStats.set(domain, { calls: 0, successRate: 0, avgTime: 0 });
    return true;
  }

  findBestPlugin(intent) {
    return this.plugins.get(intent.domain);
  }

  getPlugin(domain) {
    return this.plugins.get(domain);
  }

  getAllDomains() {
    return Array.from(this.plugins.keys());
  }

  recordUsage(domain, success, responseTime) {
    const stats = this.usageStats.get(domain);
    if (stats) {
      stats.calls++;
      stats.avgTime = (stats.avgTime + responseTime) / 2;
      if (success) stats.successRate = (stats.successRate + 1) / stats.calls;
    }
  }

  getUsageStats() {
    return Object.fromEntries(this.usageStats);
  }
}
