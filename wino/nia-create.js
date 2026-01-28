#!/usr/bin/env node
// wino/nia-create.js - مولد المشاريع من النوايا
// اكتب نيتك، NiaScript يولد السكريبت الكامل!

import 'dotenv/config';
import { createAgentTeam, codegen } from '../src/index.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log(`
╔═══════════════════════════════════════════════════════════════╗
║  🧙 NIA-CREATE - مولد المشاريع من النوايا                     ║
║  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━                ║
║  اكتب نيتك → NiaScript يولد السكريبت الكامل                  ║
╚═══════════════════════════════════════════════════════════════╝
`);

// ========================================
// النية من سطر الأوامر أو افتراضية
// ========================================
const userIntent = process.argv.slice(2).join(' ') || `
سكريبت يجلب أسعار البيتكوين والإيثيريوم من API حقيقي
ثم يحسب الهولد لمدة 5 سنوات بثلاث سيناريوهات
ثم يحلل السوق ويعطي توصيات
ويحفظ النتائج في ملف JSON
`;

console.log('📝 النية:', userIntent.trim());
console.log('\n' + '━'.repeat(60));

// ========================================
// الوكلاء يعملون
// ========================================
async function generateProject(intent) {
  const team = createAgentTeam();
  const startTime = Date.now();

  // 1. التخطيط
  console.log('\n🧠 [1/4] الوكيل المخطط يحلل النية...');

  const planPrompt = `حلل هذه النية وقسمها لأجزاء تقنية:

النية: ${intent}

أجب بـ JSON:
{
  "projectName": "اسم المشروع بالإنجليزية",
  "description": "وصف مختصر",
  "components": [
    {"name": "اسم الجزء", "purpose": "الغرض", "type": "function|class|api-call"}
  ],
  "dependencies": ["المكتبات المطلوبة"],
  "dataFlow": "كيف تتدفق البيانات"
}`;

  const planResult = await team.planner.think(planPrompt);
  let plan = {};

  if (planResult.success) {
    try {
      const match = planResult.content.match(/\{[\s\S]*\}/);
      if (match) plan = JSON.parse(match[0]);
    } catch {}
  }

  console.log('   ✅ التخطيط:', plan.projectName || 'تم');
  if (plan.components) {
    plan.components.forEach(c => console.log(`      • ${c.name}: ${c.purpose}`));
  }

  // 2. البناء
  console.log('\n🔨 [2/4] الوكيل البنّاء يكتب الكود...');

  const buildPrompt = `اكتب سكريبت Node.js كامل وقابل للتشغيل.

النية: ${intent}

المتطلبات:
- استخدم ESM (import/export)
- استخدم axios لـ API
- استخدم dotenv/config
- console.log لكل خطوة
- try/catch للأخطاء
- احفظ النتائج في JSON

اكتب الكود فقط بين علامات \`\`\`javascript و \`\`\`
لا تكتب أي شيء آخر غير الكود.`;

  const buildResult = await team.builder.think(buildPrompt, { maxTokens: 4000 });
  let build = { filename: `crypto-${Date.now()}.js` };

  if (buildResult.success && buildResult.content) {
    // محاولة 1: استخراج من JSON
    try {
      const jsonMatch = buildResult.content.match(/\{[\s\S]*"code"[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.code) {
          // الكود قد يكون داخل code blocks
          const innerCode = parsed.code.match(/```(?:javascript|js)?\n([\s\S]*?)```/);
          build.code = innerCode ? innerCode[1].trim() : parsed.code.trim();
        }
      }
    } catch {}

    // محاولة 2: استخراج مباشر من code blocks
    if (!build.code) {
      const codeMatch = buildResult.content.match(/```(?:javascript|js)?\n([\s\S]*?)```/);
      if (codeMatch) {
        build.code = codeMatch[1].trim();
      }
    }

    // محاولة 3: استخدم المحتوى كاملاً إذا يبدو ككود
    if (!build.code && buildResult.content.includes('import ')) {
      build.code = buildResult.content.trim();
    }
  }

  console.log('   ✅ البناء:', build.code ? `${build.code.split('\n').length} سطر` : 'فشل');

  // 3. التدقيق
  console.log('\n🔍 [3/4] الوكيل المدقق يراجع الكود...');

  if (build.code) {
    const validateResult = await team.validator.validate(build.code, 'Node.js script');

    if (validateResult.success && validateResult.validation) {
      const v = validateResult.validation;
      console.log(`   ✅ التدقيق: ${v.score || 'OK'}/100`);
      if (v.issues && v.issues.length > 0) {
        v.issues.slice(0, 3).forEach(i =>
          console.log(`      ⚠️ ${i.severity}: ${i.message}`)
        );
      }
    }
  }

  // 4. الحفظ
  console.log('\n💾 [4/4] حفظ الملفات...');

  const filename = build.filename || `generated-${Date.now()}.js`;
  const filepath = path.join(__dirname, filename);
  const logpath = filepath.replace('.js', '.log');

  if (build.code) {
    // إضافة header للملف
    const header = `#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════
// 🤖 تم توليد هذا الملف تلقائياً بواسطة NiaScript Agents
// 📅 التاريخ: ${new Date().toISOString()}
// 📝 النية: ${intent.trim().substring(0, 100)}...
// ═══════════════════════════════════════════════════════════

`;

    fs.writeFileSync(filepath, header + build.code);
    console.log(`   ✅ السكريبت: ${filename}`);

    // حفظ اللوغ
    const log = {
      timestamp: new Date().toISOString(),
      intent: intent.trim(),
      plan,
      filename,
      duration: Date.now() - startTime
    };
    fs.writeFileSync(logpath, JSON.stringify(log, null, 2));
    console.log(`   ✅ اللوغ: ${filename.replace('.js', '.log')}`);
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✨ تم توليد المشروع بنجاح!

📁 الملفات:
   • ${filepath}
   • ${logpath}

▶️ للتشغيل:
   node wino/${filename}

⏱️ الوقت: ${duration} ثانية

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);

  return { filepath, plan, build };
}

// ========================================
// التشغيل
// ========================================
generateProject(userIntent).catch(console.error);
