export class PluginManager {
  constructor(niaInstance) {
    this.nia = niaInstance;
    this.plugins = new Map();
    this.triggers = new Map();
    this.mcpBridge = null;
    this.customActions = new Map();
    this.logger = niaInstance.logger;
  }

  async install(plugin) {
    try {
      // التحقق من صحة الإضافة
      this.validatePlugin(plugin);
      
      // تسجيل المحفزات (الكلمات التي تثير الإضافة)
      plugin.triggers.forEach(trigger => {
        this.triggers.set(trigger, plugin.name);
      });
      
      // إضافة المزودين الجدد
      if (plugin.providers) {
        Object.entries(plugin.providers).forEach(([name, config]) => {
          this.nia.providerManager.registerProvider(name, {
            ...config,
            category: plugin.name
          });
        });
      }
      
      // دمج الوصفات الجديدة
      if (plugin.recipes) {
        this.nia.recipeEngine.addPluginTemplates(plugin.name, plugin.recipes);
      }
      
      // تسجيل الأعمال المخصصة
      if (plugin.customActions) {
        Object.entries(plugin.customActions).forEach(([actionName, actionFunction]) => {
          this.customActions.set(`${plugin.name}.${actionName}`, actionFunction);
        });
      }
      
      // حفظ الإضافة
      this.plugins.set(plugin.name, plugin);
      
      this.logger.info(`✅ تم تثبيت الإضافة: ${plugin.name}`);
      
      return {
        success: true,
        message: `Plugin ${plugin.name} installed successfully`
      };
      
    } catch (error) {
      this.logger.error(`Error installing plugin ${plugin.name}:`, error);
      throw error;
    }
  }

  async uninstall(pluginName) {
    try {
      const plugin = this.plugins.get(pluginName);
      if (!plugin) {
        throw new Error(`Plugin ${pluginName} not found`);
      }

      // إزالة المحفزات
      for (const [trigger, name] of this.triggers.entries()) {
        if (name === pluginName) {
          this.triggers.delete(trigger);
        }
      }

      // إزالة المزودين
      if (plugin.providers) {
        Object.keys(plugin.providers).forEach(providerName => {
          this.nia.providerManager.unregisterProvider(providerName);
        });
      }

      // إزالة الوصفات
      this.nia.recipeEngine.removePluginTemplates(pluginName);

      // إزالة الأعمال المخصصة
      for (const [actionName] of this.customActions.entries()) {
        if (actionName.startsWith(`${pluginName}.`)) {
          this.customActions.delete(actionName);
        }
      }

      // إزالة الإضافة
      this.plugins.delete(pluginName);

      this.logger.info(`✅ تم إلغاء تثبيت الإضافة: ${pluginName}`);
      
      return {
        success: true,
        message: `Plugin ${pluginName} uninstalled successfully`
      };

    } catch (error) {
      this.logger.error(`Error uninstalling plugin ${pluginName}:`, error);
      throw error;
    }
  }

  findMatchingPlugin(query) {
    const lowerQuery = query.toLowerCase();
    
    for (const [trigger, pluginName] of this.triggers) {
      let matches = false;
      
      if (trigger instanceof RegExp) {
        matches = trigger.test(lowerQuery);
      } else if (typeof trigger === 'string') {
        matches = lowerQuery.includes(trigger.toLowerCase());
      }
      
      if (matches) {
        const plugin = this.plugins.get(pluginName);
        if (plugin) {
          return {
            plugin,
            confidence: this.calculatePluginConfidence(query, plugin)
          };
        }
      }
    }
    
    return null;
  }

  calculatePluginConfidence(query, plugin) {
    let confidence = 0.5;
    const lowerQuery = query.toLowerCase();
    
    // زيادة الثقة بناءً على عدد المحفزات المطابقة
    let matchCount = 0;
    plugin.triggers.forEach(trigger => {
      if (trigger instanceof RegExp && trigger.test(lowerQuery)) {
        matchCount++;
      } else if (typeof trigger === 'string' && lowerQuery.includes(trigger.toLowerCase())) {
        matchCount++;
      }
    });
    
    confidence += (matchCount * 0.2);
    
    // زيادة الثقة إذا كان لدى الإضافة وصفات مطابقة
    if (plugin.recipes) {
      const recipeNames = Object.keys(plugin.recipes);
      const matchingRecipes = recipeNames.filter(name => 
        lowerQuery.includes(name.toLowerCase())
      );
      confidence += (matchingRecipes.length * 0.1);
    }
    
    return Math.min(confidence, 1.0);
  }

  async executeCustomAction(actionName, params) {
    const action = this.customActions.get(actionName);
    if (!action) {
      throw new Error(`Custom action not found: ${actionName}`);
    }
    
    try {
      return await action(params);
    } catch (error) {
      this.logger.error(`Error executing custom action ${actionName}:`, error);
      throw error;
    }
  }

  validatePlugin(plugin) {
    const errors = [];
    
    // التحقق من الحقول الإجبارية
    if (!plugin.name) {
      errors.push('Plugin name is required');
    }
    
    if (!plugin.version) {
      errors.push('Plugin version is required');
    }
    
    if (!plugin.triggers || !Array.isArray(plugin.triggers)) {
      errors.push('Plugin triggers must be an array');
    }
    
    // التحقق من صحة المحفزات
    if (plugin.triggers) {
      plugin.triggers.forEach((trigger, index) => {
        if (typeof trigger !== 'string' && !(trigger instanceof RegExp)) {
          errors.push(`Trigger at index ${index} must be string or RegExp`);
        }
      });
    }
    
    // التحقق من صحة المزودين
    if (plugin.providers) {
      Object.entries(plugin.providers).forEach(([name, config]) => {
        if (!config.baseURL && config.type !== 'custom') {
          errors.push(`Provider ${name} must have baseURL or be custom type`);
        }
      });
    }
    
    // التحقق من صحة الوصفات
    if (plugin.recipes) {
      Object.entries(plugin.recipes).forEach(([name, recipe]) => {
        if (!recipe.steps || !Array.isArray(recipe.steps)) {
          errors.push(`Recipe ${name} must have steps array`);
        }
        
        if (typeof recipe.confidence !== 'number' || recipe.confidence < 0 || recipe.confidence > 1) {
          errors.push(`Recipe ${name} confidence must be number between 0 and 1`);
        }
      });
    }
    
    // التحقق من صحة الأعمال المخصصة
    if (plugin.customActions) {
      Object.entries(plugin.customActions).forEach(([name, action]) => {
        if (typeof action !== 'function') {
          errors.push(`Custom action ${name} must be a function`);
        }
      });
    }
    
    if (errors.length > 0) {
      throw new Error(`Plugin validation failed: ${errors.join(', ')}`);
    }
  }

  listPlugins() {
    return Array.from(this.plugins.values()).map(plugin => ({
      name: plugin.name,
      version: plugin.version,
      description: plugin.description,
      author: plugin.author,
      triggers: plugin.triggers,
      hasProviders: !!plugin.providers,
      hasRecipes: !!plugin.recipes,
      hasCustomActions: !!plugin.customActions
    }));
  }

  getPlugin(name) {
    return this.plugins.get(name);
  }

  hasPlugin(name) {
    return this.plugins.has(name);
  }

  async loadPluginFromFile(filePath) {
    try {
      const { default: plugin } = await import(filePath);
      await this.install(plugin);
      return plugin;
    } catch (error) {
      this.logger.error(`Error loading plugin from file ${filePath}:`, error);
      throw error;
    }
  }

  async loadPluginsFromDirectory(directoryPath) {
    try {
      const fs = await import('fs');
      const path = await import('path');
      
      const files = await fs.promises.readdir(directoryPath);
      const pluginFiles = files.filter(file => file.endsWith('.js'));
      
      const loadedPlugins = [];
      
      for (const file of pluginFiles) {
        try {
          const pluginPath = path.join(directoryPath, file);
          const plugin = await this.loadPluginFromFile(pluginPath);
          loadedPlugins.push(plugin);
        } catch (error) {
          this.logger.error(`Error loading plugin ${file}:`, error);
        }
      }
      
      return loadedPlugins;
    } catch (error) {
      this.logger.error(`Error loading plugins from directory ${directoryPath}:`, error);
      throw error;
    }
  }

  setMCPBridge(mcpBridge) {
    this.mcpBridge = mcpBridge;
  }

  getMCPBridge() {
    return this.mcpBridge;
  }

  generatePluginSchema() {
    return {
      name: "string (required)",
      version: "string (required)",
      description: "string (optional)",
      author: "string (optional)",
      triggers: "array of strings/RegExp (required)",
      providers: {
        "provider_name": {
          baseURL: "string (required for API providers)",
          type: "string (custom/api)",
          auth: "object (optional)",
          endpoints: "object (optional)",
          config: "object (optional)"
        }
      },
      recipes: {
        "recipe_name": {
          confidence: "number (0-1, required)",
          steps: "array (required)",
          fallbacks: "array (optional)"
        }
      },
      customActions: {
        "action_name": "function (optional)"
      }
    };
  }
}