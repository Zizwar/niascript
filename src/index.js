/**
 * NiaScript - البرمجة بالنوايا
 * Intent-Based Programming
 *
 * @example
 * import { nia, Nia } from 'niascript';
 *
 * // الطريقة البسيطة - Tagged Template Literals
 * const result = await nia`سعر البيتكوين`;
 * const news = await nia`أخبار اليوم`.json();
 *
 * // الطريقة المتقدمة
 * const n = new Nia({ apiKey: '...', model: '...' });
 * const result = await n.run('سعر البيتكوين');
 *
 * // توليد سكريبتات
 * const script = await nia.generate('سكريبت لجلب الأخبار');
 */

// ========================================
// النواة الجديدة الموحدة
// ========================================
export {
  Nia,
  NiaResult,
  NiaCache,
  nia,
  LOCAL_PROCESSORS
} from './core/nia.js';

// ========================================
// نظام الوكلاء المتخصصين
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
// توليد الكود
// ========================================
export { NiaCodeGen, codegen } from './core/nia-codegen.js';

// ========================================
// المحرك المحلي الموسع (اختياري)
// ========================================
export { LocalEngineExtended } from './core/nia-local-extended.js';

// ========================================
// التوافقية مع الإصدارات السابقة
// @deprecated - استخدم nia أو Nia بدلاً من ذلك
// ========================================
export { NiaFlow, flow, SmartCache, LocalEngine, NiaIntent } from './core/nia-flow.js';
export { NiaAI } from './core/nia-ai.js';

// ========================================
// Default export
// ========================================
export { nia as default } from './core/nia.js';
