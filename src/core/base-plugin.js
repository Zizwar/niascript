
// src/core/base-plugin.js - الأساس لجميع الـ Plugins
export class BasePlugin {
  constructor(domain) {
    this.domain = domain;
    this.capabilities = [];
    this.config = {};
  }

  /**
‎   * يجب تنفيذها في كل plugin
   */
  async execute(intent, context) {
    throw new Error(`Plugin ${this.domain} must implement execute() method`);
  }

  /**
‎   * تحديد القدرات التي يدعمها الـ Plugin
   */
  getCapabilities() {
    return this.capabilities;
  }

  /**
‎   * تحديد مدى ملاءمة الـ Plugin للنية المعطاة
   */
  calculateMatch(intent) {
    if (intent.domain !== this.domain) return 0;
    
‎    // يمكن تخصيص هذا في كل plugin
    return intent.confidence || 0.5;
  }

  /**
‎   * إعداد الـ Plugin
   */
  configure(config) {
    this.config = { ...this.config, ...config };
  }

  /**
‎   * تسجيل استخدام الـ Plugin
   */
  logUsage(context, action, details = {}) {
    context.logger.logApiCall(this.domain, action, details.cost, details.duration);
  }
}