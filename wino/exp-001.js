#!/usr/bin/env node
// wino/exp-001.js - ملف تجربة أولي
// اكتب تجاربك هنا!

import 'dotenv/config';
import { NiaFlow, createAgentTeam, codegen, LocalEngineExtended } from '../src/index.js';

console.log('🧪 WINO - مساحة التجارب\n');

// ========================================
// جرب هنا!
// ========================================

async function main() {
  // مثال: استخدام المحرك المحلي
  const local = new LocalEngineExtended();
  console.log('📊 المحرك المحلي:');
  console.log(local.tryProcess('متوسط 10 20 30 40 50'));

  // مثال: استخدام NiaFlow
  const nia = new NiaFlow();
  console.log('\n🌊 NiaFlow:');
  console.log(nia.calc('1000$ @ 10% لمدة 3 سنوات'));

  // مثال: استخدام الوكلاء (يحتاج API)
  // const team = createAgentTeam();
  // const result = await team.build('دالة تحسب BMI');
  // console.log(result);

  // مثال: توليد كود (يحتاج API)
  // const code = await codegen.func('دالة تحقق من رقم الهاتف');
  // console.log(code);
}

main().catch(console.error);
