// src/index.js - NiaScript 2.0 Main Export
// Export all components

// النواة الجديدة - NiaFlow (النظام الثوري)
export { NiaFlow, flow, SmartCache, LocalEngine, NiaIntent } from './core/nia-flow.js';

// النواة القديمة - NiaAI (للتوافقية)
export { NiaAI, nia } from './core/nia-ai.js';

// Default export - NiaFlow (النظام الجديد)
export { flow as default } from './core/nia-flow.js';
