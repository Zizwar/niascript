import fs from 'fs/promises';
import path from 'path';

export class MemorySystem {
  constructor(dataDir = './data') {
    this.dataDir = dataDir;
    this.memoryFile = path.join(dataDir, 'memory.json');
    this.memory = {
      interactions: [],
      userPreferences: {},
      learnedPatterns: {},
      cachedResults: {},
      facts: []
    };
    
    this.initialize();
  }

  async initialize() {
    try {
      await fs.mkdir(this.dataDir, { recursive: true });
      await this.load();
    } catch (error) {
      console.warn('Memory system initialization warning:', error.message);
    }
  }

  async store(interaction) {
    try {
      const entry = {
        id: Date.now().toString(),
        timestamp: new Date(),
        ...interaction
      };
      
      this.memory.interactions.push(entry);
      
      // Keep only last 1000 interactions
      if (this.memory.interactions.length > 1000) {
        this.memory.interactions = this.memory.interactions.slice(-1000);
      }
      
      // Extract and store patterns
      await this.extractPatterns(entry);
      
      // Cache successful results
      if (entry.result && entry.query) {
        await this.cacheResult(entry.query, entry.result);
      }
      
      await this.save();
      return entry.id;
      
    } catch (error) {
      console.error('Memory storage error:', error);
      return null;
    }
  }

  async extractPatterns(interaction) {
    const { query, intent, result } = interaction;
    
    if (!query || !intent) return;
    
    // Extract common query patterns
    const queryLower = query.toLowerCase();
    const intentType = intent.type;
    
    if (!this.memory.learnedPatterns[intentType]) {
      this.memory.learnedPatterns[intentType] = {
        commonPhrases: {},
        entities: {},
        successfulQueries: []
      };
    }
    
    const patterns = this.memory.learnedPatterns[intentType];
    
    // Track common phrases
    const words = queryLower.split(/\s+/);
    for (const word of words) {
      if (word.length > 3) { // Skip short words
        patterns.commonPhrases[word] = (patterns.commonPhrases[word] || 0) + 1;
      }
    }
    
    // Track entities
    if (intent.entities) {
      for (const [key, value] of Object.entries(intent.entities)) {
        if (!patterns.entities[key]) {
          patterns.entities[key] = {};
        }
        if (typeof value === 'string') {
          patterns.entities[key][value] = (patterns.entities[key][value] || 0) + 1;
        }
      }
    }
    
    // Track successful queries for similar future requests
    if (result) {
      patterns.successfulQueries.push({
        query: query,
        entities: intent.entities,
        timestamp: new Date()
      });
      
      // Keep only last 50 successful queries per pattern
      if (patterns.successfulQueries.length > 50) {
        patterns.successfulQueries = patterns.successfulQueries.slice(-50);
      }
    }
  }

  async cacheResult(query, result, ttl = 300000) { // 5 minutes default TTL
    const cacheKey = this.generateCacheKey(query);
    
    this.memory.cachedResults[cacheKey] = {
      result,
      timestamp: Date.now(),
      ttl,
      query
    };
    
    // Clean expired cache entries
    await this.cleanExpiredCache();
  }

  async getCachedResult(query) {
    const cacheKey = this.generateCacheKey(query);
    const cached = this.memory.cachedResults[cacheKey];
    
    if (!cached) return null;
    
    // Check if expired
    if (Date.now() - cached.timestamp > cached.ttl) {
      delete this.memory.cachedResults[cacheKey];
      return null;
    }
    
    return cached.result;
  }

  generateCacheKey(query) {
    return query.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
  }

  async cleanExpiredCache() {
    const now = Date.now();
    const expired = [];
    
    for (const [key, cached] of Object.entries(this.memory.cachedResults)) {
      if (now - cached.timestamp > cached.ttl) {
        expired.push(key);
      }
    }
    
    for (const key of expired) {
      delete this.memory.cachedResults[key];
    }
  }

  async storeFact(fact) {
    const factEntry = {
      id: Date.now().toString(),
      content: fact,
      timestamp: new Date(),
      type: 'user_provided'
    };
    
    this.memory.facts.push(factEntry);
    await this.save();
    return factEntry.id;
  }

  async forget(pattern) {
    let removed = 0;
    
    // Remove matching interactions
    const beforeCount = this.memory.interactions.length;
    this.memory.interactions = this.memory.interactions.filter(
      interaction => !this.matchesPattern(interaction, pattern)
    );
    removed += beforeCount - this.memory.interactions.length;
    
    // Remove matching facts
    const beforeFactsCount = this.memory.facts.length;
    this.memory.facts = this.memory.facts.filter(
      fact => !this.matchesPattern(fact, pattern)
    );
    removed += beforeFactsCount - this.memory.facts.length;
    
    // Remove matching cached results
    const cacheKeys = Object.keys(this.memory.cachedResults);
    for (const key of cacheKeys) {
      if (this.matchesPattern(this.memory.cachedResults[key], pattern)) {
        delete this.memory.cachedResults[key];
        removed++;
      }
    }
    
    await this.save();
    return removed;
  }

  matchesPattern(item, pattern) {
    const itemStr = JSON.stringify(item).toLowerCase();
    const patternStr = pattern.toLowerCase();
    
    return itemStr.includes(patternStr);
  }

  async getUserPreference(key) {
    return this.memory.userPreferences[key];
  }

  async setUserPreference(key, value) {
    this.memory.userPreferences[key] = value;
    await this.save();
  }

  async getRecentInteractions(limit = 10) {
    return this.memory.interactions.slice(-limit);
  }

  async getPatternStats() {
    return {
      totalInteractions: this.memory.interactions.length,
      learnedPatterns: Object.keys(this.memory.learnedPatterns).length,
      cachedResults: Object.keys(this.memory.cachedResults).length,
      facts: this.memory.facts.length,
      userPreferences: Object.keys(this.memory.userPreferences).length
    };
  }

  async findSimilarQueries(query, limit = 5) {
    const queryLower = query.toLowerCase();
    const queryWords = queryLower.split(/\s+/);
    
    const similar = [];
    
    for (const interaction of this.memory.interactions) {
      if (!interaction.query) continue;
      
      const score = this.calculateSimilarity(queryWords, interaction.query.toLowerCase().split(/\s+/));
      
      if (score > 0.3) { // Similarity threshold
        similar.push({
          query: interaction.query,
          result: interaction.result,
          score,
          timestamp: interaction.timestamp
        });
      }
    }
    
    return similar
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  calculateSimilarity(words1, words2) {
    const set1 = new Set(words1);
    const set2 = new Set(words2);
    
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    
    return intersection.size / union.size; // Jaccard similarity
  }

  async suggestImprovement(query, intent) {
    const patterns = this.memory.learnedPatterns[intent.type];
    if (!patterns) return null;
    
    const suggestions = [];
    
    // Check for common successful phrases
    const queryWords = query.toLowerCase().split(/\s+/);
    const commonPhrases = Object.entries(patterns.commonPhrases)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
      
    for (const [phrase, count] of commonPhrases) {
      if (!queryWords.includes(phrase) && count > 2) {
        suggestions.push({
          type: 'add_phrase',
          suggestion: phrase,
          reason: `Often used in similar queries (${count} times)`
        });
      }
    }
    
    return suggestions.length > 0 ? suggestions : null;
  }

  async save() {
    try {
      await fs.writeFile(this.memoryFile, JSON.stringify(this.memory, null, 2));
    } catch (error) {
      console.error('Failed to save memory:', error);
    }
  }

  async load() {
    try {
      const data = await fs.readFile(this.memoryFile, 'utf8');
      this.memory = { ...this.memory, ...JSON.parse(data) };
    } catch (error) {
      // File doesn't exist or is invalid, start with default memory
      console.log('Starting with fresh memory system');
    }
  }

  async export() {
    return JSON.stringify(this.memory, null, 2);
  }

  async import(data) {
    try {
      const imported = JSON.parse(data);
      this.memory = { ...this.memory, ...imported };
      await this.save();
      return true;
    } catch (error) {
      console.error('Failed to import memory:', error);
      return false;
    }
  }

  async clear() {
    this.memory = {
      interactions: [],
      userPreferences: {},
      learnedPatterns: {},
      cachedResults: {},
      facts: []
    };
    await this.save();
  }

  // Analytics and insights
  async getInsights() {
    const insights = {
      mostUsedIntents: {},
      mostSuccessfulPatterns: {},
      averageResponseTime: 0,
      userBehaviorTrends: []
    };
    
    // Calculate most used intents
    for (const interaction of this.memory.interactions) {
      if (interaction.intent?.type) {
        const type = interaction.intent.type;
        insights.mostUsedIntents[type] = (insights.mostUsedIntents[type] || 0) + 1;
      }
    }
    
    // Calculate most successful patterns
    for (const [patternType, pattern] of Object.entries(this.memory.learnedPatterns)) {
      insights.mostSuccessfulPatterns[patternType] = pattern.successfulQueries.length;
    }
    
    return insights;
  }
}