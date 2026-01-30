#!/usr/bin/env node
/**
 * NiaScript Dashboard Server
 * خادم Express مع لوحة تحكم ونقاط نهاية API
 */

import 'dotenv/config';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import { Nia, NiaResult } from './core/nia.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// إعداد Nia
const nia = new Nia({
  outputDir: process.env.NIA_OUTPUT_DIR || 'nia-output'
});

const PORT = process.env.NIA_PORT || 3003;
const OUTPUT_DIR = path.resolve(PROJECT_ROOT, nia.config.outputDir);
const SCRIPTS_DIR = path.join(OUTPUT_DIR, 'scripts');
const LOGS_DIR = path.join(OUTPUT_DIR, 'logs');

// ========================================
// مساعدات
// ========================================

function getScriptList() {
  if (!fs.existsSync(SCRIPTS_DIR)) return [];

  const files = fs.readdirSync(SCRIPTS_DIR)
    .filter(f => f.endsWith('.js'))
    .sort((a, b) => {
      const ta = fs.statSync(path.join(SCRIPTS_DIR, a)).mtimeMs;
      const tb = fs.statSync(path.join(SCRIPTS_DIR, b)).mtimeMs;
      return tb - ta;
    });

  return files.map(file => {
    const filepath = path.join(SCRIPTS_DIR, file);
    const stat = fs.statSync(filepath);
    const id = path.basename(file, '.js');

    // قراءة الميتاداتا
    let meta = null;
    const logFile = path.join(SCRIPTS_DIR, id + '.json');
    if (fs.existsSync(logFile)) {
      try { meta = JSON.parse(fs.readFileSync(logFile, 'utf-8')); } catch {}
    }

    // استخراج النية من الهيدر
    let intent = meta?.intent || '';
    if (!intent) {
      try {
        const head = fs.readFileSync(filepath, 'utf-8').slice(0, 500);
        const m = head.match(/\/\/\s*Intent:\s*(.+)/);
        if (m) intent = m[1].trim();
      } catch {}
    }

    return {
      id,
      filename: file,
      intent,
      size: stat.size,
      createdAt: stat.birthtime.toISOString(),
      modifiedAt: stat.mtime.toISOString(),
      meta
    };
  });
}

function getNiaFiles() {
  // ملفات .nia المحفوظة
  const niaDir = path.join(OUTPUT_DIR, 'nia-files');
  if (!fs.existsSync(niaDir)) {
    fs.mkdirSync(niaDir, { recursive: true });
  }

  const files = fs.readdirSync(niaDir)
    .filter(f => f.endsWith('.nia') || f.endsWith('.nia.js'))
    .sort((a, b) => {
      const ta = fs.statSync(path.join(niaDir, a)).mtimeMs;
      const tb = fs.statSync(path.join(niaDir, b)).mtimeMs;
      return tb - ta;
    });

  return files.map(file => {
    const filepath = path.join(niaDir, file);
    const stat = fs.statSync(filepath);
    return {
      id: path.basename(file, path.extname(file)),
      filename: file,
      size: stat.size,
      createdAt: stat.birthtime.toISOString(),
      content: fs.readFileSync(filepath, 'utf-8')
    };
  });
}

// ========================================
// تنصيب التبعيات تلقائياً
// ========================================

const BUILTIN_MODULES = new Set([
  'fs', 'path', 'http', 'https', 'url', 'crypto', 'os', 'util',
  'stream', 'events', 'child_process', 'net', 'dns', 'tls',
  'zlib', 'buffer', 'querystring', 'assert', 'readline',
  'fs/promises', 'node:fs', 'node:path', 'node:http', 'node:https',
  'node:url', 'node:crypto', 'node:os', 'node:util', 'node:child_process',
  'dotenv/config'
]);

function autoInstallDeps(filepath) {
  try {
    const code = fs.readFileSync(filepath, 'utf-8');
    const imports = new Set();

    // ESM imports
    const esmRegex = /import\s+.*?\s+from\s+['"]([^'"./][^'"]*)['"]/g;
    let m;
    while ((m = esmRegex.exec(code)) !== null) {
      const pkg = m[1].startsWith('@') ? m[1] : m[1].split('/')[0];
      if (!BUILTIN_MODULES.has(m[1]) && !BUILTIN_MODULES.has(pkg)) {
        imports.add(pkg);
      }
    }

    // require()
    const cjsRegex = /require\s*\(\s*['"]([^'"./][^'"]*)['"]\s*\)/g;
    while ((m = cjsRegex.exec(code)) !== null) {
      const pkg = m[1].startsWith('@') ? m[1] : m[1].split('/')[0];
      if (!BUILTIN_MODULES.has(m[1]) && !BUILTIN_MODULES.has(pkg)) {
        imports.add(pkg);
      }
    }

    for (const pkg of imports) {
      try {
        const checkPath = path.join(PROJECT_ROOT, 'node_modules', pkg);
        if (!fs.existsSync(checkPath)) {
          console.log(`[DependencyAgent] تنصيب ${pkg}...`);
          execSync(`npm install ${pkg} --save`, {
            cwd: PROJECT_ROOT,
            stdio: 'pipe',
            timeout: 30000
          });
          console.log(`[DependencyAgent] تم تنصيب ${pkg}`);
        }
      } catch (e) {
        console.warn(`[DependencyAgent] فشل تنصيب ${pkg}: ${e.message}`);
      }
    }
  } catch {}
}

// ========================================
// نقاط API
// ========================================

// تشغيل نية مباشرة
app.post('/api/run', async (req, res) => {
  try {
    const { intent, options } = req.body;
    if (!intent) return res.status(400).json({ error: 'intent مطلوب' });

    const result = await nia.run(intent, options || {});
    res.json({
      success: true,
      value: result.value,
      meta: result.meta
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// إنشاء سكريبت من نية
app.post('/api/create', async (req, res) => {
  try {
    const { intent, options } = req.body;
    if (!intent) return res.status(400).json({ error: 'intent مطلوب' });

    const result = await nia.generate(intent, options || {});
    res.json({
      success: true,
      filepath: result.meta.filepath,
      code: result.value,
      meta: result.meta
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// عرض قائمة السكريبتات
app.get('/api/scripts', (req, res) => {
  try {
    const scripts = getScriptList();
    res.json({ success: true, count: scripts.length, scripts });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// تفاصيل سكريبت معين
app.get('/api/scripts/:id', (req, res) => {
  try {
    const filepath = path.join(SCRIPTS_DIR, req.params.id + '.js');
    if (!fs.existsSync(filepath)) {
      return res.status(404).json({ error: 'السكريبت غير موجود' });
    }

    const code = fs.readFileSync(filepath, 'utf-8');
    const stat = fs.statSync(filepath);

    let meta = null;
    const logFile = path.join(SCRIPTS_DIR, req.params.id + '.json');
    if (fs.existsSync(logFile)) {
      try { meta = JSON.parse(fs.readFileSync(logFile, 'utf-8')); } catch {}
    }

    res.json({
      success: true,
      id: req.params.id,
      code,
      size: stat.size,
      createdAt: stat.birthtime.toISOString(),
      meta
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// تشغيل سكريبت (مع تنصيب التبعيات تلقائياً)
app.post('/api/execute/:id', async (req, res) => {
  try {
    const filepath = path.join(SCRIPTS_DIR, req.params.id + '.js');
    if (!fs.existsSync(filepath)) {
      return res.status(404).json({ error: 'السكريبت غير موجود' });
    }

    // تنصيب التبعيات تلقائياً
    autoInstallDeps(filepath);

    const result = await nia.execute(filepath, {
      timeout: 30000,
      ...req.body?.options
    });

    res.json({
      success: true,
      output: result.value,
      meta: result.meta
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// حذف سكريبت
app.delete('/api/scripts/:id', (req, res) => {
  try {
    const jsFile = path.join(SCRIPTS_DIR, req.params.id + '.js');
    const jsonFile = path.join(SCRIPTS_DIR, req.params.id + '.json');

    if (!fs.existsSync(jsFile)) {
      return res.status(404).json({ error: 'السكريبت غير موجود' });
    }

    fs.unlinkSync(jsFile);
    if (fs.existsSync(jsonFile)) fs.unlinkSync(jsonFile);

    res.json({ success: true, message: 'تم الحذف' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// حفظ ملف NIA
app.post('/api/nia-files', (req, res) => {
  try {
    const { name, content } = req.body;
    if (!name || !content) {
      return res.status(400).json({ error: 'name و content مطلوبان' });
    }

    const niaDir = path.join(OUTPUT_DIR, 'nia-files');
    if (!fs.existsSync(niaDir)) fs.mkdirSync(niaDir, { recursive: true });

    const filename = name.endsWith('.nia') ? name : name + '.nia';
    const filepath = path.join(niaDir, filename);
    fs.writeFileSync(filepath, content);

    res.json({ success: true, filename, filepath });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// عرض ملفات NIA
app.get('/api/nia-files', (req, res) => {
  try {
    const files = getNiaFiles();
    res.json({ success: true, count: files.length, files });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// تشغيل ملف NIA (تحويل إلى سكريبت وتشغيله)
app.post('/api/nia-files/:name/execute', async (req, res) => {
  try {
    const niaDir = path.join(OUTPUT_DIR, 'nia-files');
    const filename = req.params.name.endsWith('.nia')
      ? req.params.name : req.params.name + '.nia';
    const filepath = path.join(niaDir, filename);

    if (!fs.existsSync(filepath)) {
      return res.status(404).json({ error: 'الملف غير موجود' });
    }

    const content = fs.readFileSync(filepath, 'utf-8');
    const lines = content.split('\n').filter(l => l.trim() && !l.startsWith('#'));

    const results = [];
    for (const line of lines) {
      try {
        const result = await nia.run(line.trim());
        results.push({
          intent: line.trim(),
          value: result.value,
          source: result.meta.source
        });
      } catch (err) {
        results.push({
          intent: line.trim(),
          error: err.message
        });
      }
    }

    res.json({ success: true, results });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// الإحصائيات
app.get('/api/stats', (req, res) => {
  try {
    const stats = nia.getStats();
    const scripts = getScriptList();
    res.json({
      success: true,
      engine: stats,
      scripts: {
        total: scripts.length,
        totalSize: scripts.reduce((s, f) => s + f.size, 0)
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// مسح الكاش
app.delete('/api/cache', (req, res) => {
  nia.clearCache();
  res.json({ success: true, message: 'تم مسح الكاش' });
});

// ========================================
// لوحة التحكم - Dashboard
// ========================================
app.get('/', (req, res) => {
  res.send(getDashboardHTML());
});

function getDashboardHTML() {
  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>NiaScript Dashboard</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }

    :root {
      --bg: #0a0a0f;
      --surface: #12121a;
      --surface2: #1a1a25;
      --border: #2a2a3a;
      --text: #e0e0e8;
      --text2: #8888a0;
      --accent: #6c5ce7;
      --accent2: #a29bfe;
      --success: #00b894;
      --danger: #e17055;
      --warning: #fdcb6e;
      --radius: 10px;
    }

    body {
      font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
      background: var(--bg);
      color: var(--text);
      line-height: 1.6;
      min-height: 100vh;
    }

    header {
      background: linear-gradient(135deg, var(--surface), var(--surface2));
      border-bottom: 1px solid var(--border);
      padding: 1rem 2rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .logo {
      font-size: 1.5rem;
      font-weight: 700;
      background: linear-gradient(135deg, var(--accent), var(--accent2));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .logo span { font-weight: 300; opacity: 0.7; }

    .stats-bar {
      display: flex;
      gap: 1.5rem;
      font-size: 0.85rem;
    }

    .stat-item {
      display: flex;
      align-items: center;
      gap: 0.4rem;
    }

    .stat-value {
      color: var(--accent2);
      font-weight: 600;
    }

    .container {
      max-width: 1400px;
      margin: 0 auto;
      padding: 1.5rem;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.5rem;
    }

    .panel {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      overflow: hidden;
    }

    .panel-header {
      padding: 0.8rem 1.2rem;
      border-bottom: 1px solid var(--border);
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: var(--surface2);
    }

    .panel-header h2 {
      font-size: 0.95rem;
      font-weight: 600;
      color: var(--accent2);
    }

    .panel-body { padding: 1.2rem; }

    .full-width {
      grid-column: 1 / -1;
    }

    /* نموذج الإدخال */
    .input-group {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 1rem;
    }

    input[type="text"], textarea {
      flex: 1;
      padding: 0.7rem 1rem;
      border: 1px solid var(--border);
      border-radius: var(--radius);
      background: var(--bg);
      color: var(--text);
      font-size: 0.9rem;
      font-family: inherit;
      outline: none;
      transition: border 0.2s;
    }

    input:focus, textarea:focus {
      border-color: var(--accent);
    }

    textarea {
      min-height: 100px;
      resize: vertical;
      font-family: 'Cascadia Code', 'Fira Code', monospace;
    }

    button, .btn {
      padding: 0.7rem 1.2rem;
      border: 1px solid var(--border);
      border-radius: var(--radius);
      background: var(--surface2);
      color: var(--text);
      font-size: 0.85rem;
      cursor: pointer;
      transition: all 0.2s;
      white-space: nowrap;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
    }

    button:hover, .btn:hover {
      background: var(--accent);
      border-color: var(--accent);
      color: #fff;
    }

    .btn-primary {
      background: var(--accent);
      border-color: var(--accent);
      color: #fff;
    }

    .btn-primary:hover {
      background: var(--accent2);
    }

    .btn-danger {
      color: var(--danger);
    }

    .btn-danger:hover {
      background: var(--danger);
      border-color: var(--danger);
      color: #fff;
    }

    .btn-sm {
      padding: 0.3rem 0.7rem;
      font-size: 0.8rem;
    }

    /* النتائج */
    .result-box {
      background: var(--bg);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 1rem;
      max-height: 400px;
      overflow-y: auto;
      font-family: 'Cascadia Code', 'Fira Code', monospace;
      font-size: 0.85rem;
      line-height: 1.5;
      white-space: pre-wrap;
      word-break: break-word;
    }

    .result-box.empty {
      color: var(--text2);
      font-family: inherit;
      text-align: center;
      padding: 2rem;
    }

    /* قائمة السكريبتات */
    .script-list {
      list-style: none;
      max-height: 500px;
      overflow-y: auto;
    }

    .script-item {
      padding: 0.7rem 1rem;
      border-bottom: 1px solid var(--border);
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.5rem;
      transition: background 0.15s;
    }

    .script-item:hover {
      background: var(--surface2);
    }

    .script-info {
      flex: 1;
      min-width: 0;
    }

    .script-name {
      font-weight: 600;
      font-size: 0.85rem;
      color: var(--accent2);
      cursor: pointer;
    }

    .script-name:hover {
      text-decoration: underline;
    }

    .script-intent {
      font-size: 0.78rem;
      color: var(--text2);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 400px;
    }

    .script-actions {
      display: flex;
      gap: 0.3rem;
    }

    .script-date {
      font-size: 0.75rem;
      color: var(--text2);
    }

    /* الميتا */
    .meta-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
      gap: 0.5rem;
    }

    .meta-item {
      background: var(--bg);
      border: 1px solid var(--border);
      border-radius: 6px;
      padding: 0.6rem;
    }

    .meta-label {
      font-size: 0.72rem;
      color: var(--text2);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .meta-value {
      font-size: 0.9rem;
      font-weight: 600;
      color: var(--accent2);
      margin-top: 0.2rem;
    }

    /* التبويبات */
    .tabs {
      display: flex;
      gap: 0;
      border-bottom: 1px solid var(--border);
    }

    .tab {
      padding: 0.6rem 1.2rem;
      cursor: pointer;
      font-size: 0.85rem;
      border-bottom: 2px solid transparent;
      transition: all 0.2s;
      color: var(--text2);
    }

    .tab:hover { color: var(--text); }
    .tab.active {
      color: var(--accent2);
      border-bottom-color: var(--accent);
    }

    .tab-content { display: none; }
    .tab-content.active { display: block; }

    /* التحميل */
    .loading {
      display: inline-block;
      width: 18px;
      height: 18px;
      border: 2px solid var(--border);
      border-top-color: var(--accent);
      border-radius: 50%;
      animation: spin 0.6s linear infinite;
    }

    @keyframes spin { to { transform: rotate(360deg); } }

    .badge {
      display: inline-block;
      padding: 0.15rem 0.5rem;
      border-radius: 20px;
      font-size: 0.72rem;
      font-weight: 600;
    }

    .badge-local { background: #00b89433; color: var(--success); }
    .badge-ai { background: #6c5ce733; color: var(--accent2); }
    .badge-cached { background: #fdcb6e33; color: var(--warning); }
    .badge-generated { background: #0984e333; color: #74b9ff; }

    /* Modal */
    .modal-overlay {
      display: none;
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.7);
      z-index: 1000;
      justify-content: center;
      align-items: center;
    }

    .modal-overlay.active {
      display: flex;
    }

    .modal {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      width: 90%;
      max-width: 800px;
      max-height: 85vh;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    .modal-header {
      padding: 1rem 1.5rem;
      border-bottom: 1px solid var(--border);
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .modal-body {
      padding: 1.5rem;
      overflow-y: auto;
      flex: 1;
    }

    .modal-close {
      background: none;
      border: none;
      color: var(--text2);
      font-size: 1.5rem;
      cursor: pointer;
      padding: 0;
    }

    .modal-close:hover {
      color: var(--danger);
      background: none;
      border: none;
    }

    /* رسبونسف */
    @media (max-width: 900px) {
      .container { grid-template-columns: 1fr; }
      header { flex-direction: column; gap: 0.5rem; }
    }

    .toast {
      position: fixed;
      bottom: 1.5rem;
      left: 50%;
      transform: translateX(-50%);
      padding: 0.7rem 1.5rem;
      border-radius: var(--radius);
      font-size: 0.85rem;
      z-index: 2000;
      animation: fadeUp 0.3s;
    }

    .toast-success { background: var(--success); color: #fff; }
    .toast-error { background: var(--danger); color: #fff; }

    @keyframes fadeUp {
      from { opacity: 0; transform: translateX(-50%) translateY(10px); }
      to { opacity: 1; transform: translateX(-50%) translateY(0); }
    }
  </style>
</head>
<body>

<header>
  <div class="logo">NiaScript <span>Dashboard</span></div>
  <div class="stats-bar" id="statsBar">
    <div class="stat-item">Total: <span class="stat-value" id="statTotal">0</span></div>
    <div class="stat-item">Local: <span class="stat-value" id="statLocal">0</span></div>
    <div class="stat-item">AI: <span class="stat-value" id="statAI">0</span></div>
    <div class="stat-item">Cache: <span class="stat-value" id="statCache">0</span></div>
    <div class="stat-item">Scripts: <span class="stat-value" id="statScripts">0</span></div>
  </div>
</header>

<div class="container">

  <!-- تنفيذ نية مباشرة -->
  <div class="panel">
    <div class="panel-header">
      <h2>Run Intent</h2>
      <span class="badge badge-ai">AI + Local</span>
    </div>
    <div class="panel-body">
      <div class="input-group">
        <input type="text" id="intentInput" placeholder="اكتب نيتك هنا... مثل: احسب 100 * 55" />
        <button class="btn-primary" onclick="runIntent()">Run</button>
      </div>
      <div class="result-box empty" id="runResult">النتيجة ستظهر هنا</div>
    </div>
  </div>

  <!-- إنشاء سكريبت -->
  <div class="panel">
    <div class="panel-header">
      <h2>Generate Script</h2>
      <span class="badge badge-generated">AI Code Gen</span>
    </div>
    <div class="panel-body">
      <div class="input-group">
        <input type="text" id="createInput" placeholder="صف السكريبت... مثل: اجلب أخبار Hacker News" />
        <button class="btn-primary" onclick="createScript()">Generate</button>
      </div>
      <div class="result-box empty" id="createResult">الكود سيظهر هنا</div>
    </div>
  </div>

  <!-- محرر NIA -->
  <div class="panel full-width">
    <div class="panel-header">
      <h2>NIA Editor</h2>
      <div style="display:flex;gap:0.5rem;align-items:center">
        <input type="text" id="niaFileName" placeholder="اسم الملف" style="width:150px;padding:0.4rem 0.7rem;font-size:0.8rem" />
        <button class="btn-sm" onclick="saveNiaFile()">Save</button>
        <button class="btn-sm btn-primary" onclick="executeNiaCode()">Execute</button>
      </div>
    </div>
    <div class="panel-body">
      <textarea id="niaEditor" placeholder="# كود NIA - سطر = نية
احسب 100 + 200
ما هو التاريخ اليوم
حول 10 كيلومتر الى ميل"></textarea>
      <div class="result-box empty" id="niaResult" style="margin-top:0.8rem">نتائج التشغيل ستظهر هنا</div>
    </div>
  </div>

  <!-- قائمة السكريبتات -->
  <div class="panel full-width">
    <div class="panel-header">
      <h2>Scripts</h2>
      <button class="btn-sm" onclick="loadScripts()">Refresh</button>
    </div>
    <ul class="script-list" id="scriptList">
      <li class="script-item" style="justify-content:center;color:var(--text2)">
        جاري التحميل...
      </li>
    </ul>
  </div>

</div>

<!-- Modal لعرض السكريبت -->
<div class="modal-overlay" id="scriptModal">
  <div class="modal">
    <div class="modal-header">
      <h2 id="modalTitle">Script Details</h2>
      <button class="modal-close" onclick="closeModal()">&times;</button>
    </div>
    <div class="modal-body">
      <div class="meta-grid" id="modalMeta"></div>
      <h3 style="margin:1rem 0 0.5rem;font-size:0.9rem;color:var(--accent2)">Code</h3>
      <div class="result-box" id="modalCode" style="max-height:none"></div>
      <div style="margin-top:1rem;display:flex;gap:0.5rem">
        <button class="btn-primary" id="modalRunBtn">Execute</button>
        <button class="btn-danger" id="modalDeleteBtn">Delete</button>
      </div>
      <div class="result-box empty" id="modalOutput" style="margin-top:0.8rem;display:none"></div>
    </div>
  </div>
</div>

<script>
  const API = '';

  // ========================================
  // API Calls
  // ========================================

  async function api(method, url, body) {
    const opts = { method, headers: { 'Content-Type': 'application/json' } };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(API + url, opts);
    return res.json();
  }

  // ========================================
  // Run Intent
  // ========================================

  async function runIntent() {
    const input = document.getElementById('intentInput');
    const result = document.getElementById('runResult');
    const intent = input.value.trim();
    if (!intent) return;

    result.className = 'result-box';
    result.innerHTML = '<span class="loading"></span> جاري التشغيل...';

    try {
      const data = await api('POST', '/api/run', { intent });
      if (data.success) {
        const source = data.meta?.source || 'unknown';
        const badge = source === 'local' ? 'badge-local' :
                      source === 'ai' ? 'badge-ai' : 'badge-cached';
        result.innerHTML =
          '<div style="margin-bottom:0.5rem"><span class="badge ' + badge + '">' +
          source + '</span>' +
          (data.meta?.duration ? ' <span style="color:var(--text2);font-size:0.78rem">' +
          data.meta.duration + 'ms</span>' : '') +
          (data.meta?.cost ? ' <span style="color:var(--text2);font-size:0.78rem">$' +
          data.meta.cost.toFixed(4) + '</span>' : '') +
          '</div>' +
          escapeHtml(typeof data.value === 'object' ? JSON.stringify(data.value, null, 2) : String(data.value));
      } else {
        result.innerHTML = '<span style="color:var(--danger)">Error: ' + escapeHtml(data.error) + '</span>';
      }
    } catch (e) {
      result.innerHTML = '<span style="color:var(--danger)">Error: ' + escapeHtml(e.message) + '</span>';
    }

    refreshStats();
  }

  // Enter key
  document.getElementById('intentInput').addEventListener('keydown', e => {
    if (e.key === 'Enter') runIntent();
  });

  // ========================================
  // Create Script
  // ========================================

  async function createScript() {
    const input = document.getElementById('createInput');
    const result = document.getElementById('createResult');
    const intent = input.value.trim();
    if (!intent) return;

    result.className = 'result-box';
    result.innerHTML = '<span class="loading"></span> جاري إنشاء السكريبت...';

    try {
      const data = await api('POST', '/api/create', { intent });
      if (data.success) {
        result.innerHTML = escapeHtml(data.code);
        toast('تم إنشاء السكريبت', 'success');
        loadScripts();
      } else {
        result.innerHTML = '<span style="color:var(--danger)">Error: ' + escapeHtml(data.error) + '</span>';
      }
    } catch (e) {
      result.innerHTML = '<span style="color:var(--danger)">Error: ' + escapeHtml(e.message) + '</span>';
    }

    refreshStats();
  }

  document.getElementById('createInput').addEventListener('keydown', e => {
    if (e.key === 'Enter') createScript();
  });

  // ========================================
  // NIA Editor
  // ========================================

  async function executeNiaCode() {
    const editor = document.getElementById('niaEditor');
    const result = document.getElementById('niaResult');
    const code = editor.value.trim();
    if (!code) return;

    const lines = code.split('\\n').filter(l => l.trim() && !l.startsWith('#'));
    result.className = 'result-box';
    result.innerHTML = '<span class="loading"></span> جاري تشغيل ' + lines.length + ' نية...';

    let output = '';
    for (const line of lines) {
      try {
        const data = await api('POST', '/api/run', { intent: line.trim() });
        const source = data.meta?.source || '?';
        output += '> ' + line.trim() + '\\n';
        output += (data.success ? String(data.value) : 'Error: ' + data.error) +
                  '  [' + source + ']\\n\\n';
      } catch (e) {
        output += '> ' + line.trim() + '\\nError: ' + e.message + '\\n\\n';
      }
    }

    result.innerHTML = escapeHtml(output);
    refreshStats();
  }

  async function saveNiaFile() {
    const name = document.getElementById('niaFileName').value.trim();
    const content = document.getElementById('niaEditor').value;
    if (!name) return toast('ادخل اسم الملف', 'error');
    if (!content.trim()) return toast('الملف فارغ', 'error');

    try {
      const data = await api('POST', '/api/nia-files', { name, content });
      if (data.success) toast('تم الحفظ: ' + data.filename, 'success');
      else toast(data.error, 'error');
    } catch (e) {
      toast(e.message, 'error');
    }
  }

  // ========================================
  // Scripts List
  // ========================================

  async function loadScripts() {
    const list = document.getElementById('scriptList');
    list.innerHTML = '<li class="script-item" style="justify-content:center"><span class="loading"></span></li>';

    try {
      const data = await api('GET', '/api/scripts');
      if (!data.scripts || data.scripts.length === 0) {
        list.innerHTML = '<li class="script-item" style="justify-content:center;color:var(--text2)">لا توجد سكريبتات بعد</li>';
        return;
      }

      list.innerHTML = data.scripts.map(s => {
        const date = new Date(s.createdAt).toLocaleString('ar-SA');
        return '<li class="script-item">' +
          '<div class="script-info">' +
            '<div class="script-name" onclick="viewScript(\\'' + s.id + '\\')">' + escapeHtml(s.filename) + '</div>' +
            '<div class="script-intent">' + escapeHtml(s.intent || 'No intent') + '</div>' +
            '<div class="script-date">' + date + ' | ' + formatSize(s.size) + '</div>' +
          '</div>' +
          '<div class="script-actions">' +
            '<button class="btn-sm" onclick="viewScript(\\'' + s.id + '\\')">View</button>' +
            '<button class="btn-sm btn-primary" onclick="executeScript(\\'' + s.id + '\\')">Run</button>' +
            '<button class="btn-sm btn-danger" onclick="deleteScript(\\'' + s.id + '\\')">Del</button>' +
          '</div>' +
        '</li>';
      }).join('');
    } catch (e) {
      list.innerHTML = '<li class="script-item" style="color:var(--danger)">' + e.message + '</li>';
    }
  }

  async function viewScript(id) {
    const modal = document.getElementById('scriptModal');
    const title = document.getElementById('modalTitle');
    const meta = document.getElementById('modalMeta');
    const code = document.getElementById('modalCode');
    const output = document.getElementById('modalOutput');

    output.style.display = 'none';
    code.innerHTML = '<span class="loading"></span>';
    meta.innerHTML = '';
    title.textContent = id;
    modal.classList.add('active');

    try {
      const data = await api('GET', '/api/scripts/' + id);
      if (data.success) {
        code.innerHTML = escapeHtml(data.code);

        const metaData = data.meta || {};
        const items = [
          { label: 'Intent', value: metaData.intent || '-' },
          { label: 'Model', value: metaData.model || '-' },
          { label: 'Generated', value: metaData.generatedAt ? new Date(metaData.generatedAt).toLocaleString('ar-SA') : '-' },
          { label: 'Lines', value: metaData.linesOfCode || '-' },
          { label: 'Size', value: formatSize(data.size) },
        ];

        meta.innerHTML = items.map(i =>
          '<div class="meta-item">' +
            '<div class="meta-label">' + i.label + '</div>' +
            '<div class="meta-value">' + escapeHtml(String(i.value)) + '</div>' +
          '</div>'
        ).join('');

        document.getElementById('modalRunBtn').onclick = async () => {
          output.style.display = 'block';
          output.className = 'result-box';
          output.innerHTML = '<span class="loading"></span> جاري التشغيل...';
          try {
            const r = await api('POST', '/api/execute/' + id);
            output.innerHTML = r.success
              ? escapeHtml(r.output)
              : '<span style="color:var(--danger)">' + escapeHtml(r.error) + '</span>';
          } catch (e) {
            output.innerHTML = '<span style="color:var(--danger)">' + escapeHtml(e.message) + '</span>';
          }
        };

        document.getElementById('modalDeleteBtn').onclick = async () => {
          if (confirm('هل تريد حذف هذا السكريبت؟')) {
            await deleteScript(id);
            closeModal();
          }
        };
      }
    } catch (e) {
      code.innerHTML = '<span style="color:var(--danger)">' + e.message + '</span>';
    }
  }

  async function executeScript(id) {
    toast('جاري التشغيل...', 'success');
    try {
      const data = await api('POST', '/api/execute/' + id);
      if (data.success) {
        toast('تم التشغيل بنجاح', 'success');
        viewScript(id);
        setTimeout(() => {
          const output = document.getElementById('modalOutput');
          output.style.display = 'block';
          output.className = 'result-box';
          output.innerHTML = escapeHtml(data.output);
        }, 300);
      } else {
        toast('Error: ' + data.error, 'error');
      }
    } catch (e) {
      toast(e.message, 'error');
    }
  }

  async function deleteScript(id) {
    try {
      const data = await api('DELETE', '/api/scripts/' + id);
      if (data.success) {
        toast('تم الحذف', 'success');
        loadScripts();
      } else {
        toast(data.error, 'error');
      }
    } catch (e) {
      toast(e.message, 'error');
    }
  }

  function closeModal() {
    document.getElementById('scriptModal').classList.remove('active');
  }

  // Close modal on overlay click
  document.getElementById('scriptModal').addEventListener('click', e => {
    if (e.target === e.currentTarget) closeModal();
  });

  // ========================================
  // Stats
  // ========================================

  async function refreshStats() {
    try {
      const data = await api('GET', '/api/stats');
      if (data.success) {
        document.getElementById('statTotal').textContent = data.engine.totalCalls;
        document.getElementById('statLocal').textContent = data.engine.localCalls;
        document.getElementById('statAI').textContent = data.engine.aiCalls;
        document.getElementById('statCache').textContent = data.engine.cachedCalls;
        document.getElementById('statScripts').textContent = data.scripts.total;
      }
    } catch {}
  }

  // ========================================
  // Helpers
  // ========================================

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function formatSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  function toast(msg, type = 'success') {
    const el = document.createElement('div');
    el.className = 'toast toast-' + type;
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 3000);
  }

  // ========================================
  // Init
  // ========================================

  loadScripts();
  refreshStats();
</script>

</body>
</html>`;
}

// ========================================
// بدء الخادم
// ========================================
app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════╗
║       NiaScript Dashboard Server        ║
╠══════════════════════════════════════════╣
║                                         ║
║  Dashboard: http://localhost:${PORT}       ║
║                                         ║
║  API Endpoints:                         ║
║  POST /api/run      - Run intent        ║
║  POST /api/create   - Generate script   ║
║  GET  /api/scripts  - List scripts      ║
║  GET  /api/scripts/:id - Script detail  ║
║  POST /api/execute/:id - Run script     ║
║  DELETE /api/scripts/:id - Delete       ║
║  POST /api/nia-files - Save NIA code    ║
║  GET  /api/nia-files - List NIA files   ║
║  GET  /api/stats    - Statistics        ║
║                                         ║
╚══════════════════════════════════════════╝
`);
});

export default app;
