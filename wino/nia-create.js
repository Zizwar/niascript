#!/usr/bin/env node
// wino/nia-create.js - مولد المشاريع من النوايا
// اكتب نيتك، NiaScript يولد السكريبت الكامل!
// RunnerAgent - يشغّل ويختبر ويصلح!
// DependencyAgent - يكتشف ويثبت المكتبات تلقائياً!

import 'dotenv/config';
import { createAgentTeam, NiaFlow } from '../src/index.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

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
  let build = { filename: `gen-${Date.now()}.js` };

  if (buildResult.success && buildResult.content) {
    const content = buildResult.content;

    // محاولة 1: استخراج من JSON (الوكيل يُرجع JSON غالباً)
    try {
      const jsonMatch = content.match(/\{[\s\S]*"code"[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.code) {
          // الكود قد يكون escaped
          let code = parsed.code;
          // فك الـ escape
          code = code.replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\\\/g, '\\');
          // إزالة code blocks إذا وُجدت
          const innerMatch = code.match(/```(?:javascript|js)?\n?([\s\S]*?)```/);
          build.code = innerMatch ? innerMatch[1].trim() : code.trim();
        }
      }
    } catch (e) {
      // تجاهل خطأ JSON
    }

    // محاولة 2: استخراج من code blocks
    if (!build.code) {
      const codeBlockMatch = content.match(/```(?:javascript|js|node)?\s*\n?([\s\S]*?)```/);
      if (codeBlockMatch) {
        build.code = codeBlockMatch[1].trim();
      }
    }

    // محاولة 3: إذا بدأ بـ import أو #!/usr/bin
    if (!build.code) {
      const trimmed = content.trim();
      if (trimmed.startsWith('import ') || trimmed.startsWith('#!') || trimmed.startsWith("'use strict'")) {
        build.code = trimmed;
      }
    }

    // محاولة 4: البحث عن كود يبدأ بـ import
    if (!build.code) {
      const importMatch = content.match(/((?:\/\/[^\n]*\n)*import\s+[\s\S]+)/);
      if (importMatch) {
        build.code = importMatch[1].trim();
      }
    }
  } else {
    console.log('   ⚠️ فشل البناء:', buildResult.error || 'لا يوجد محتوى');
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

  if (build.code) {
    console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✨ تم توليد الكود! الآن RunnerAgent سيشغله ويختبره...

📁 الملف: ${filename}
⏱️ وقت التوليد: ${duration} ثانية
`);
  } else {
    console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️ لم يتم توليد الكود. حاول بنية مختلفة.
`);
  }

  return { filepath, filename, plan, build, duration };
}

// ========================================
// 5. DependencyAgent - تثبيت المكتبات تلقائياً
// ========================================
async function detectAndInstallDeps(filepath) {
  const code = fs.readFileSync(filepath, 'utf-8');

  // استخراج جميع الـ imports
  const importMatches = code.matchAll(/import\s+.*?from\s+['"]([^'"./][^'"]*)['"]/g);
  const requireMatches = code.matchAll(/require\s*\(\s*['"]([^'"./][^'"]*)['"]\s*\)/g);

  const deps = new Set();

  for (const match of importMatches) {
    // استخراج اسم الحزمة (بدون المسار الفرعي)
    const pkg = match[1].split('/')[0];
    // استثناء الحزم المدمجة في Node.js
    const builtins = ['fs', 'path', 'url', 'http', 'https', 'crypto', 'util', 'os', 'child_process', 'stream', 'events', 'buffer', 'process'];
    if (!builtins.includes(pkg) && !pkg.startsWith('node:')) {
      deps.add(pkg);
    }
  }

  for (const match of requireMatches) {
    const pkg = match[1].split('/')[0];
    const builtins = ['fs', 'path', 'url', 'http', 'https', 'crypto', 'util', 'os', 'child_process', 'stream', 'events', 'buffer', 'process'];
    if (!builtins.includes(pkg) && !pkg.startsWith('node:')) {
      deps.add(pkg);
    }
  }

  if (deps.size === 0) return { installed: [], skipped: [] };

  console.log(`\n   📦 فحص المكتبات المطلوبة: ${[...deps].join(', ')}`);

  const installed = [];
  const skipped = [];
  const { execSync } = await import('child_process');

  for (const dep of deps) {
    try {
      // تحقق إذا كانت الحزمة مثبتة
      execSync(`node -e "require.resolve('${dep}')"`, {
        stdio: 'pipe',
        cwd: path.dirname(filepath)
      });
      skipped.push(dep);
    } catch {
      // الحزمة غير مثبتة - ثبتها
      console.log(`   📥 تثبيت ${dep}...`);
      try {
        execSync(`npm install ${dep} --save`, {
          stdio: 'pipe',
          cwd: path.resolve(path.dirname(filepath), '..')
        });
        installed.push(dep);
        console.log(`   ✅ تم تثبيت ${dep}`);
      } catch (e) {
        console.log(`   ⚠️ فشل تثبيت ${dep}: ${e.message}`);
      }
    }
  }

  if (installed.length > 0) {
    console.log(`   📦 تم تثبيت: ${installed.join(', ')}`);
  }

  return { installed, skipped };
}

// ========================================
// 6. RunnerAgent - تشغيل واختبار وإصلاح
// ========================================
async function runAndTest(filepath, team, maxRetries = 2) {
  console.log('\n▶️  [5/5] RunnerAgent يشغّل ويختبر الكود...');

  // أولاً: فحص وتثبيت المكتبات
  await detectAndInstallDeps(filepath);

  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    console.log(`\n   🔄 المحاولة ${attempt}/${maxRetries + 1}...`);

    const result = await executeScript(filepath);

    if (result.success) {
      console.log('   ✅ السكريبت يعمل بنجاح!');
      if (result.output) {
        console.log('\n   📤 المخرجات:');
        console.log('   ' + '─'.repeat(50));
        result.output.split('\n').slice(0, 15).forEach(line =>
          console.log(`   ${line}`)
        );
        if (result.output.split('\n').length > 15) {
          console.log('   ... (المزيد)');
        }
      }
      return { success: true, output: result.output };
    }

    // تحليل الخطأ
    console.log(`   ❌ خطأ: ${result.error.substring(0, 100)}...`);

    if (attempt > maxRetries) {
      console.log('\n   ⚠️ استنفدت المحاولات. تحليل المشكلة...');
      const analysis = await analyzeError(result.error, filepath, team);
      return { success: false, error: result.error, analysis };
    }

    // محاولة الإصلاح
    console.log('   🔧 جاري تحليل وإصلاح الخطأ...');
    const fixed = await tryFix(result.error, filepath, team);

    if (!fixed) {
      console.log('   ⚠️ لم يتمكن من الإصلاح التلقائي');
      const analysis = await analyzeError(result.error, filepath, team);
      return { success: false, error: result.error, analysis };
    }

    console.log('   ✅ تم تطبيق الإصلاح، إعادة المحاولة...');
  }
}

async function executeScript(filepath, timeout = 30000) {
  return new Promise((resolve) => {
    const child = spawn('node', [filepath], {
      timeout,
      env: { ...process.env }
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => { stdout += data.toString(); });
    child.stderr.on('data', (data) => { stderr += data.toString(); });

    child.on('close', (code) => {
      if (code === 0) {
        resolve({ success: true, output: stdout });
      } else {
        resolve({ success: false, error: stderr || stdout });
      }
    });

    child.on('error', (err) => {
      resolve({ success: false, error: err.message });
    });

    // Timeout
    setTimeout(() => {
      child.kill();
      resolve({ success: false, error: 'Timeout: السكريبت استغرق وقتاً طويلاً' });
    }, timeout);
  });
}

async function analyzeError(error, filepath, team) {
  const code = fs.readFileSync(filepath, 'utf-8');

  const nia = new NiaFlow();
  const prompt = `حلل هذا الخطأ وأخبرني ما المشكلة وكيف أصلحها:

الخطأ:
${error.substring(0, 1000)}

الكود (أول 50 سطر):
${code.split('\n').slice(0, 50).join('\n')}

أجب بـ JSON:
{
  "problemType": "نوع المشكلة (api_key|network|syntax|logic|dependency|permission)",
  "description": "وصف المشكلة",
  "solution": "الحل المقترح",
  "userAction": "ما يجب على المستخدم فعله",
  "canAutoFix": true/false
}`;

  const result = await nia.ask(prompt, { model: 'openai/gpt-5.1-codex-mini' });

  if (result.success) {
    try {
      const match = result.result.match(/\{[\s\S]*\}/);
      if (match) return JSON.parse(match[0]);
    } catch {}
    return { raw: result.result };
  }

  return { error: 'فشل التحليل' };
}

async function tryFix(error, filepath, team) {
  // أنماط الأخطاء الشائعة والإصلاحات
  const errorPatterns = [
    {
      // ESM module not found
      pattern: /ERR_MODULE_NOT_FOUND.*?['"]([^'"]+)['"]/,
      fix: async (match) => {
        const module = match[1].split('/')[0];
        console.log(`   📦 تثبيت المكتبة الناقصة: ${module}`);
        const { execSync } = await import('child_process');
        try {
          execSync(`npm install ${module} --save`, {
            stdio: 'pipe',
            cwd: path.resolve(path.dirname(filepath), '..')
          });
          console.log(`   ✅ تم تثبيت ${module}`);
          return true;
        } catch { return false; }
      }
    },
    {
      // CommonJS module not found
      pattern: /Cannot find module ['"]([^'"]+)['"]/,
      fix: async (match) => {
        const module = match[1].split('/')[0];
        console.log(`   📦 تثبيت المكتبة الناقصة: ${module}`);
        const { execSync } = await import('child_process');
        try {
          execSync(`npm install ${module} --save`, {
            stdio: 'pipe',
            cwd: path.resolve(path.dirname(filepath), '..')
          });
          console.log(`   ✅ تم تثبيت ${module}`);
          return true;
        } catch { return false; }
      }
    },
    {
      pattern: /ENOTFOUND|ETIMEDOUT|ECONNREFUSED/,
      fix: async () => {
        console.log('   🌐 مشكلة في الشبكة أو API غير متاح');
        return false; // لا يمكن الإصلاح تلقائياً
      }
    },
    {
      pattern: /401|403|Unauthorized|Forbidden/,
      fix: async () => {
        console.log('   🔑 مشكلة في المصادقة - يحتاج API key أو صلاحيات');
        return false;
      }
    },
    {
      pattern: /API.?key|api.?key|apiKey/i,
      fix: async () => {
        console.log('   🔑 يحتاج مفتاح API');
        return false;
      }
    },
    {
      pattern: /SyntaxError/,
      fix: async () => {
        console.log('   ⚠️ خطأ في صيغة الكود - يحتاج مراجعة');
        return false;
      }
    }
  ];

  for (const { pattern, fix } of errorPatterns) {
    const match = error.match(pattern);
    if (match) {
      return await fix(match);
    }
  }

  // محاولة إصلاح ذكي باستخدام AI
  const code = fs.readFileSync(filepath, 'utf-8');
  const nia = new NiaFlow();

  const fixPrompt = `أصلح هذا الخطأ في الكود:

الخطأ: ${error.substring(0, 500)}

الكود:
${code}

أعطني الكود المصحح فقط بين \`\`\`javascript و \`\`\``;

  const result = await nia.ask(fixPrompt, { model: 'openai/gpt-5.1-codex-mini' });

  if (result.success) {
    const codeMatch = result.result.match(/```(?:javascript|js)?\n([\s\S]*?)```/);
    if (codeMatch) {
      fs.writeFileSync(filepath, codeMatch[1].trim());
      return true;
    }
  }

  return false;
}

function printAnalysis(analysis) {
  if (!analysis) return;

  console.log('\n   📋 تحليل المشكلة:');
  console.log('   ' + '─'.repeat(50));

  if (analysis.problemType) {
    const typeEmoji = {
      api_key: '🔑',
      network: '🌐',
      syntax: '⚠️',
      logic: '🧠',
      dependency: '📦',
      permission: '🔒'
    };
    console.log(`   ${typeEmoji[analysis.problemType] || '❓'} النوع: ${analysis.problemType}`);
  }

  if (analysis.description) {
    console.log(`   📝 الوصف: ${analysis.description}`);
  }

  if (analysis.solution) {
    console.log(`   💡 الحل: ${analysis.solution}`);
  }

  if (analysis.userAction) {
    console.log(`\n   👤 المطلوب منك:`);
    console.log(`      ${analysis.userAction}`);
  }
}

// ========================================
// التشغيل الرئيسي المحدث
// ========================================
async function main() {
  const result = await generateProject(userIntent);

  if (result && result.filepath && result.build?.code) {
    const team = createAgentTeam();
    const runResult = await runAndTest(result.filepath, team);

    if (!runResult.success && runResult.analysis) {
      printAnalysis(runResult.analysis);
    }

    // حفظ اللوغ النهائي
    const finalLog = {
      ...result,
      runResult: {
        success: runResult.success,
        output: runResult.output?.substring(0, 500),
        error: runResult.error?.substring(0, 500),
        analysis: runResult.analysis
      },
      completedAt: new Date().toISOString()
    };

    const logPath = result.filepath.replace('.js', '.final.log');
    fs.writeFileSync(logPath, JSON.stringify(finalLog, null, 2));
    console.log(`\n📄 اللوغ النهائي: ${path.basename(logPath)}`);
  }
}

main().catch(console.error);
