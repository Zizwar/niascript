// src/index.js - NiaScript 3.0 Main Export
// النظام الشامل للبرمجة بالنوايا!

// ========================================
// النواة الرئيسية - NiaFlow
// ========================================
export { NiaFlow, flow, SmartCache, LocalEngine, NiaIntent } from './core/nia-flow.js';

// ========================================
// نظام الوكلاء المتخصصين - جديد!
// ========================================
export {
  NiaAgentTeam,
  OrchestratorAgent,
  PlannerAgent,
  BuilderAgent,
  ValidatorAgent,
  TestAgent,
  createAgentTeam
} from './core/nia-agents.js';

// ========================================
// المحرك المحلي الموسع - جديد!
// ========================================
export { LocalEngineExtended } from './core/nia-local-extended.js';

// ========================================
// نظام توليد الكود - جديد!
// ========================================
export { NiaCodeGen, codegen } from './core/nia-codegen.js';

// ========================================
// النواة القديمة - للتوافقية
// ========================================
export { NiaAI, nia } from './core/nia-ai.js';

// ========================================
// Default export - NiaFlow
// ========================================
export { flow as default } from './core/nia-flow.js';
