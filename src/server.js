#!/usr/bin/env node
/**
 * NiaScript Dashboard Server v2
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

const PORT = process.env.NIA_PORT || 3003;

// ========================================
// نظام التكوين
// ========================================

const DEFAULT_MODELS = [
  { id: 'openai/gpt-4.1-mini', label: 'GPT-4.1 Mini', provider: 'OpenAI' },
  { id: 'openai/gpt-4o-mini', label: 'GPT-4o Mini', provider: 'OpenAI' },
  { id: 'openai/gpt-5-mini', label: 'GPT-5 Mini', provider: 'OpenAI' },
  { id: 'openai/gpt-5.1-codex-mini', label: 'GPT-5.1 Codex Mini', provider: 'OpenAI' },
  { id: 'x-ai/grok-4.1-fast', label: 'Grok 4.1 Fast', provider: 'xAI' },
  { id: 'x-ai/grok-3-mini', label: 'Grok 3 Mini', provider: 'xAI' },
  { id: 'x-ai/grok-code-fast-1', label: 'Grok Code Fast', provider: 'xAI' },
  { id: 'arcee-ai/coder-large', label: 'Arcee Coder Large', provider: 'Arcee' },
];

const DEFAULT_CONFIG = {
  model: 'openai/gpt-4.1-mini',
  theme: 'dark',
  customModels: [],
};

function getConfigPath() {
  return path.resolve(PROJECT_ROOT, 'nia-output', 'config.json');
}

function loadConfig() {
  try {
    const p = getConfigPath();
    if (fs.existsSync(p)) {
      return { ...DEFAULT_CONFIG, ...JSON.parse(fs.readFileSync(p, 'utf-8')) };
    }
  } catch {}
  return { ...DEFAULT_CONFIG };
}

function saveConfig(cfg) {
  const p = getConfigPath();
  const dir = path.dirname(p);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(p, JSON.stringify(cfg, null, 2));
}

let config = loadConfig();

// إعداد Nia
const nia = new Nia({
  outputDir: process.env.NIA_OUTPUT_DIR || 'nia-output',
  model: config.model,
});

const OUTPUT_DIR = path.resolve(PROJECT_ROOT, nia.config.outputDir);
const SCRIPTS_DIR = path.join(OUTPUT_DIR, 'scripts');

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
    let meta = null;
    const logFile = path.join(SCRIPTS_DIR, id + '.json');
    if (fs.existsSync(logFile)) {
      try { meta = JSON.parse(fs.readFileSync(logFile, 'utf-8')); } catch {}
    }
    let intent = meta?.intent || '';
    if (!intent) {
      try {
        const head = fs.readFileSync(filepath, 'utf-8').slice(0, 500);
        const m = head.match(/\/\/\s*Intent:\s*(.+)/);
        if (m) intent = m[1].trim();
      } catch {}
    }
    return { id, filename: file, intent, size: stat.size, createdAt: stat.birthtime.toISOString(), modifiedAt: stat.mtime.toISOString(), meta };
  });
}

function getNiaFiles() {
  const niaDir = path.join(OUTPUT_DIR, 'nia-files');
  if (!fs.existsSync(niaDir)) fs.mkdirSync(niaDir, { recursive: true });
  const files = fs.readdirSync(niaDir)
    .filter(f => f.endsWith('.nia') || f.endsWith('.nia.js'))
    .sort((a, b) => fs.statSync(path.join(niaDir, b)).mtimeMs - fs.statSync(path.join(niaDir, a)).mtimeMs);
  return files.map(file => {
    const filepath = path.join(niaDir, file);
    const stat = fs.statSync(filepath);
    return { id: path.basename(file, path.extname(file)), filename: file, size: stat.size, createdAt: stat.birthtime.toISOString(), content: fs.readFileSync(filepath, 'utf-8') };
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
    const esmRegex = /import\s+.*?\s+from\s+['"]([^'"./][^'"]*)['"]/g;
    let m;
    while ((m = esmRegex.exec(code)) !== null) {
      const pkg = m[1].startsWith('@') ? m[1] : m[1].split('/')[0];
      if (!BUILTIN_MODULES.has(m[1]) && !BUILTIN_MODULES.has(pkg)) imports.add(pkg);
    }
    const cjsRegex = /require\s*\(\s*['"]([^'"./][^'"]*)['"]\s*\)/g;
    while ((m = cjsRegex.exec(code)) !== null) {
      const pkg = m[1].startsWith('@') ? m[1] : m[1].split('/')[0];
      if (!BUILTIN_MODULES.has(m[1]) && !BUILTIN_MODULES.has(pkg)) imports.add(pkg);
    }
    for (const pkg of imports) {
      try {
        const checkPath = path.join(PROJECT_ROOT, 'node_modules', pkg);
        if (!fs.existsSync(checkPath)) {
          console.log(`[DependencyAgent] installing ${pkg}...`);
          execSync(`npm install ${pkg} --save`, { cwd: PROJECT_ROOT, stdio: 'pipe', timeout: 30000 });
        }
      } catch (e) {
        console.warn(`[DependencyAgent] failed ${pkg}: ${e.message}`);
      }
    }
  } catch {}
}

// ========================================
// نقاط API
// ========================================

// Config
app.get('/api/config', (req, res) => {
  config = loadConfig();
  res.json({ success: true, config });
});

app.put('/api/config', (req, res) => {
  try {
    const updates = req.body;
    config = { ...loadConfig(), ...updates };
    saveConfig(config);
    // تحديث Nia
    if (updates.model) nia.setModel(updates.model);
    res.json({ success: true, config });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Models
app.get('/api/models', (req, res) => {
  config = loadConfig();
  const all = [...DEFAULT_MODELS];
  if (config.customModels) {
    for (const m of config.customModels) {
      if (!all.find(x => x.id === m)) {
        all.push({ id: m, label: m.split('/').pop(), provider: m.split('/')[0] });
      }
    }
  }
  res.json({ success: true, current: config.model, models: all });
});

// تشغيل نية مباشرة
app.post('/api/run', async (req, res) => {
  try {
    const { intent, options } = req.body;
    if (!intent) return res.status(400).json({ error: 'intent مطلوب' });
    const result = await nia.run(intent, options || {});
    res.json({ success: true, value: result.value, meta: result.meta });
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
    res.json({ success: true, filepath: result.meta.filepath, code: result.value, meta: result.meta });
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
    if (!fs.existsSync(filepath)) return res.status(404).json({ error: 'السكريبت غير موجود' });
    const code = fs.readFileSync(filepath, 'utf-8');
    const stat = fs.statSync(filepath);
    let meta = null;
    const logFile = path.join(SCRIPTS_DIR, req.params.id + '.json');
    if (fs.existsSync(logFile)) {
      try { meta = JSON.parse(fs.readFileSync(logFile, 'utf-8')); } catch {}
    }
    res.json({ success: true, id: req.params.id, code, size: stat.size, createdAt: stat.birthtime.toISOString(), meta });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// تشغيل سكريبت - POST و GET
async function handleExecute(req, res) {
  try {
    const filepath = path.join(SCRIPTS_DIR, req.params.id + '.js');
    if (!fs.existsSync(filepath)) return res.status(404).json({ error: 'السكريبت غير موجود' });
    autoInstallDeps(filepath);
    const result = await nia.execute(filepath, { timeout: 30000, ...req.body?.options });
    res.json({ success: true, output: result.value, meta: result.meta });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}
app.post('/api/execute/:id', handleExecute);
app.get('/api/execute/:id', handleExecute);

// حذف سكريبت
app.delete('/api/scripts/:id', (req, res) => {
  try {
    const jsFile = path.join(SCRIPTS_DIR, req.params.id + '.js');
    const jsonFile = path.join(SCRIPTS_DIR, req.params.id + '.json');
    if (!fs.existsSync(jsFile)) return res.status(404).json({ error: 'السكريبت غير موجود' });
    fs.unlinkSync(jsFile);
    if (fs.existsSync(jsonFile)) fs.unlinkSync(jsonFile);
    res.json({ success: true, message: 'تم الحذف' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// NIA Files
app.post('/api/nia-files', (req, res) => {
  try {
    const { name, content } = req.body;
    if (!name || !content) return res.status(400).json({ error: 'name و content مطلوبان' });
    const niaDir = path.join(OUTPUT_DIR, 'nia-files');
    if (!fs.existsSync(niaDir)) fs.mkdirSync(niaDir, { recursive: true });
    const filename = name.endsWith('.nia') ? name : name + '.nia';
    fs.writeFileSync(path.join(niaDir, filename), content);
    res.json({ success: true, filename });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/nia-files', (req, res) => {
  try {
    const files = getNiaFiles();
    res.json({ success: true, count: files.length, files });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/nia-files/:name/execute', async (req, res) => {
  try {
    const niaDir = path.join(OUTPUT_DIR, 'nia-files');
    const filename = req.params.name.endsWith('.nia') ? req.params.name : req.params.name + '.nia';
    const filepath = path.join(niaDir, filename);
    if (!fs.existsSync(filepath)) return res.status(404).json({ error: 'الملف غير موجود' });
    const content = fs.readFileSync(filepath, 'utf-8');
    const lines = content.split('\n').filter(l => l.trim() && !l.startsWith('#'));
    const results = [];
    for (const line of lines) {
      try {
        const result = await nia.run(line.trim());
        results.push({ intent: line.trim(), value: result.value, source: result.meta.source });
      } catch (err) {
        results.push({ intent: line.trim(), error: err.message });
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
    res.json({ success: true, engine: stats, scripts: { total: scripts.length, totalSize: scripts.reduce((s, f) => s + f.size, 0) } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/cache', (req, res) => {
  nia.clearCache();
  res.json({ success: true, message: 'تم مسح الكاش' });
});

// ========================================
// لوحة التحكم
// ========================================
app.get('/', (req, res) => {
  res.send(getDashboardHTML());
});

function getDashboardHTML() {
  const modelsJSON = JSON.stringify(DEFAULT_MODELS);
  const configJSON = JSON.stringify(config);

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>NiaScript Dashboard</title>
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.18/codemirror.min.css">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.18/theme/dracula.min.css">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.18/theme/eclipse.min.css">
<style>
* { margin:0; padding:0; box-sizing:border-box; }

/* ===== Dark Theme ===== */
[data-theme="dark"] {
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
  --cm-theme: dracula;
}

/* ===== Light Theme ===== */
[data-theme="light"] {
  --bg: #f0f2f5;
  --surface: #ffffff;
  --surface2: #f8f9fa;
  --border: #dde1e6;
  --text: #1a1a2e;
  --text2: #6b7280;
  --accent: #6c5ce7;
  --accent2: #5a4bd1;
  --success: #00b894;
  --danger: #e17055;
  --warning: #f39c12;
  --cm-theme: eclipse;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
  background: var(--bg);
  color: var(--text);
  line-height: 1.6;
  min-height: 100vh;
  transition: background 0.3s, color 0.3s;
}

/* ===== Header ===== */
header {
  background: var(--surface);
  border-bottom: 1px solid var(--border);
  padding: 0.7rem 1.2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.8rem;
  position: sticky;
  top: 0;
  z-index: 100;
}

.logo {
  font-size: 1.3rem;
  font-weight: 700;
  background: linear-gradient(135deg, var(--accent), var(--accent2));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  white-space: nowrap;
}
.logo span { font-weight: 300; }

.header-center {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.stat-chip {
  font-size: 0.75rem;
  color: var(--text2);
  white-space: nowrap;
}
.stat-chip b { color: var(--accent2); }

.header-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

/* ===== Model Selector ===== */
.model-select-wrap {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.3rem;
}
.model-select-wrap label {
  font-size: 0.75rem;
  color: var(--text2);
  white-space: nowrap;
}
select#modelSelect {
  padding: 0.35rem 0.5rem;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: var(--surface2);
  color: var(--text);
  font-size: 0.8rem;
  max-width: 180px;
  cursor: pointer;
}
#customModelInput {
  display: none;
  padding: 0.35rem 0.5rem;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: var(--surface2);
  color: var(--text);
  font-size: 0.8rem;
  width: 180px;
}

/* ===== Theme Toggle ===== */
.theme-toggle {
  width: 36px; height: 36px;
  border-radius: 50%;
  border: 1px solid var(--border);
  background: var(--surface2);
  color: var(--text);
  font-size: 1.1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}
.theme-toggle:hover { border-color: var(--accent); }

/* ===== Container ===== */
.container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 1rem;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

/* ===== Panels ===== */
.panel {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 10px;
  overflow: hidden;
  transition: border-color 0.2s;
}
.panel:hover { border-color: color-mix(in srgb, var(--accent) 40%, var(--border)); }

.panel-header {
  padding: 0.7rem 1rem;
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--surface2);
  gap: 0.5rem;
  flex-wrap: wrap;
}
.panel-header h2 {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--accent2);
}

.panel-body { padding: 1rem; }
.full-width { grid-column: 1 / -1; }

/* ===== Inputs ===== */
.input-group {
  display: flex;
  gap: 0.4rem;
  margin-bottom: 0.8rem;
}

input[type="text"], textarea {
  flex: 1;
  padding: 0.6rem 0.8rem;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--bg);
  color: var(--text);
  font-size: 0.88rem;
  font-family: inherit;
  outline: none;
  transition: border 0.2s;
}
input:focus, textarea:focus { border-color: var(--accent); }

textarea {
  min-height: 80px;
  resize: vertical;
  font-family: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace;
  font-size: 0.82rem;
}

/* ===== Buttons ===== */
button, .btn {
  padding: 0.55rem 1rem;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--surface2);
  color: var(--text);
  font-size: 0.82rem;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  text-decoration: none;
  font-family: inherit;
}
button:hover { background: var(--accent); border-color: var(--accent); color: #fff; }
.btn-primary { background: var(--accent); border-color: var(--accent); color: #fff; }
.btn-primary:hover { background: var(--accent2); border-color: var(--accent2); }
.btn-danger { color: var(--danger); }
.btn-danger:hover { background: var(--danger); border-color: var(--danger); color: #fff; }
.btn-sm { padding: 0.28rem 0.6rem; font-size: 0.76rem; }

/* ===== Result Box ===== */
.result-box {
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 0.8rem;
  max-height: 350px;
  overflow-y: auto;
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  font-size: 0.82rem;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
}
.result-box.empty {
  color: var(--text2);
  font-family: inherit;
  text-align: center;
  padding: 1.5rem;
}
.result-box .CodeMirror {
  height: auto;
  max-height: 450px;
  border-radius: 6px;
  font-size: 0.82rem;
  line-height: 1.5;
}
.result-box:has(.CodeMirror) {
  padding: 0;
  overflow: hidden;
  background: none;
  border: none;
  max-height: none;
}

/* ===== Scripts List ===== */
.script-list { list-style: none; max-height: 500px; overflow-y: auto; }
.script-item {
  padding: 0.6rem 1rem;
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.4rem;
  transition: background 0.15s;
}
.script-item:hover { background: var(--surface2); }
.script-info { flex: 1; min-width: 0; }
.script-name {
  font-weight: 600;
  font-size: 0.82rem;
  color: var(--accent2);
  cursor: pointer;
}
.script-name:hover { text-decoration: underline; }
.script-intent {
  font-size: 0.75rem;
  color: var(--text2);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.script-endpoint {
  font-size: 0.7rem;
  color: var(--success);
  font-family: monospace;
  cursor: pointer;
  opacity: 0.8;
}
.script-endpoint:hover { opacity: 1; }
.script-actions { display: flex; gap: 0.25rem; flex-shrink: 0; }
.script-date { font-size: 0.72rem; color: var(--text2); }

/* ===== Badges ===== */
.badge {
  display: inline-block;
  padding: 0.12rem 0.45rem;
  border-radius: 20px;
  font-size: 0.7rem;
  font-weight: 600;
}
.badge-local { background: #00b89422; color: var(--success); }
.badge-ai { background: #6c5ce722; color: var(--accent2); }
.badge-cached { background: #fdcb6e22; color: var(--warning); }
.badge-generated { background: #0984e322; color: #74b9ff; }

/* ===== Meta Grid ===== */
.meta-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 0.4rem;
}
.meta-item {
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 0.5rem;
}
.meta-label { font-size: 0.68rem; color: var(--text2); text-transform: uppercase; letter-spacing: 0.5px; }
.meta-value { font-size: 0.85rem; font-weight: 600; color: var(--accent2); margin-top: 0.15rem; word-break: break-all; }

/* ===== Modal ===== */
.modal-overlay {
  display: none;
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.6);
  z-index: 1000;
  justify-content: center;
  align-items: center;
  padding: 1rem;
}
.modal-overlay.active { display: flex; }
.modal {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 10px;
  width: 100%;
  max-width: 850px;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.modal-header {
  padding: 0.8rem 1.2rem;
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.modal-body { padding: 1.2rem; overflow-y: auto; flex: 1; }
.modal-close {
  background: none; border: none;
  color: var(--text2); font-size: 1.5rem;
  cursor: pointer; padding: 0; line-height: 1;
}
.modal-close:hover { color: var(--danger); background: none; border: none; }

/* ===== Loading ===== */
.loading {
  display: inline-block;
  width: 16px; height: 16px;
  border: 2px solid var(--border);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
  vertical-align: middle;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* ===== Toast ===== */
.toast {
  position: fixed;
  bottom: 1.2rem; left: 50%;
  transform: translateX(-50%);
  padding: 0.6rem 1.2rem;
  border-radius: 8px;
  font-size: 0.82rem;
  z-index: 2000;
  animation: fadeUp 0.3s;
  box-shadow: 0 4px 12px rgba(0,0,0,0.3);
}
.toast-success { background: var(--success); color: #fff; }
.toast-error { background: var(--danger); color: #fff; }
@keyframes fadeUp {
  from { opacity:0; transform: translateX(-50%) translateY(10px); }
  to { opacity:1; transform: translateX(-50%) translateY(0); }
}

/* ===== CodeMirror overrides ===== */
.CodeMirror {
  border: 1px solid var(--border);
  border-radius: 8px;
  height: 180px;
  font-size: 0.85rem;
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
}
.cm-s-dracula.CodeMirror { background: var(--bg); }

/* ===== Mobile ===== */
@media (max-width: 768px) {
  .container { grid-template-columns: 1fr; padding: 0.6rem; gap: 0.8rem; }
  header { flex-wrap: wrap; padding: 0.5rem 0.8rem; }
  .header-center { display: none; }
  .logo { font-size: 1.1rem; }
  .model-select-wrap label { display: none; }
  select#modelSelect { max-width: 130px; }
  .panel-header { flex-direction: column; align-items: flex-start; gap: 0.3rem; }
  .script-item { flex-direction: column; align-items: flex-start; }
  .script-actions { width: 100%; justify-content: flex-end; margin-top: 0.3rem; }
  .meta-grid { grid-template-columns: 1fr 1fr; }
  .modal { max-width: 100%; }
  .input-group { flex-direction: column; }
  .input-group button { width: 100%; justify-content: center; }
  .CodeMirror { height: 150px; }
  .stats-mobile { display: flex !important; }
}

/* Stats mobile bar */
.stats-mobile {
  display: none;
  background: var(--surface2);
  padding: 0.4rem 0.8rem;
  gap: 0.8rem;
  font-size: 0.72rem;
  overflow-x: auto;
  border-bottom: 1px solid var(--border);
}
.stats-mobile .stat-chip { flex-shrink: 0; }
</style>
</head>
<body data-theme="${config.theme || 'dark'}">

<header>
  <div class="logo">NiaScript <span>Dashboard</span></div>
  <div class="header-center" id="statsDesktop">
    <span class="stat-chip">Total: <b id="stTotal">0</b></span>
    <span class="stat-chip">Local: <b id="stLocal">0</b></span>
    <span class="stat-chip">AI: <b id="stAI">0</b></span>
    <span class="stat-chip">Cache: <b id="stCache">0</b></span>
    <span class="stat-chip">Scripts: <b id="stScripts">0</b></span>
  </div>
  <div class="header-actions">
    <div class="model-select-wrap">
      <label>Model:</label>
      <select id="modelSelect" onchange="onModelChange()">
        ${DEFAULT_MODELS.map(m => `<option value="${m.id}" ${m.id === config.model ? 'selected' : ''}>${m.label}</option>`).join('')}
        ${(config.customModels || []).map(m => `<option value="${m}" ${m === config.model ? 'selected' : ''}>${m}</option>`).join('')}
        <option value="__custom__">+ Custom...</option>
      </select>
      <input type="text" id="customModelInput" placeholder="provider/model-name" onkeydown="if(event.key==='Enter')applyCustomModel()" />
    </div>
    <button class="theme-toggle" onclick="toggleTheme()" title="Toggle theme" id="themeBtn">&#9790;</button>
  </div>
</header>

<!-- Stats bar for mobile -->
<div class="stats-mobile" id="statsMobile">
  <span class="stat-chip">Total: <b id="stTotalM">0</b></span>
  <span class="stat-chip">Local: <b id="stLocalM">0</b></span>
  <span class="stat-chip">AI: <b id="stAIM">0</b></span>
  <span class="stat-chip">Cache: <b id="stCacheM">0</b></span>
  <span class="stat-chip">Scripts: <b id="stScriptsM">0</b></span>
</div>

<div class="container">

  <!-- Run Intent -->
  <div class="panel">
    <div class="panel-header">
      <h2>Run Intent</h2>
      <span class="badge badge-ai">AI + Local</span>
    </div>
    <div class="panel-body">
      <div class="input-group">
        <input type="text" id="intentInput" placeholder="اكتب نيتك... مثل: احسب 100 * 55" />
        <button class="btn-primary" onclick="runIntent()">Run</button>
      </div>
      <div class="result-box empty" id="runResult">النتيجة ستظهر هنا</div>
    </div>
  </div>

  <!-- Generate Script -->
  <div class="panel">
    <div class="panel-header">
      <h2>Generate Script</h2>
      <span class="badge badge-generated">Code Gen</span>
    </div>
    <div class="panel-body">
      <div class="input-group">
        <input type="text" id="createInput" placeholder="صف السكريبت... مثل: اجلب أخبار Hacker News" />
        <button class="btn-primary" onclick="createScript()">Generate</button>
      </div>
      <div class="result-box empty" id="createResult">الكود سيظهر هنا</div>
    </div>
  </div>

  <!-- NIA Editor -->
  <div class="panel full-width">
    <div class="panel-header">
      <h2>NIA Editor</h2>
      <div style="display:flex;gap:0.4rem;align-items:center;flex-wrap:wrap">
        <input type="text" id="niaFileName" placeholder="filename" style="width:120px;padding:0.3rem 0.6rem;font-size:0.78rem" />
        <button class="btn-sm" onclick="saveNiaFile()">Save</button>
        <button class="btn-sm btn-primary" onclick="executeNiaCode()">Execute</button>
      </div>
    </div>
    <div class="panel-body">
      <div id="niaEditorWrap"></div>
      <div class="result-box empty" id="niaResult" style="margin-top:0.7rem">نتائج التشغيل ستظهر هنا</div>
    </div>
  </div>

  <!-- Scripts List -->
  <div class="panel full-width">
    <div class="panel-header">
      <h2>Scripts</h2>
      <button class="btn-sm" onclick="loadScripts()">Refresh</button>
    </div>
    <ul class="script-list" id="scriptList">
      <li class="script-item" style="justify-content:center;color:var(--text2)">Loading...</li>
    </ul>
  </div>

</div>

<!-- Script Modal -->
<div class="modal-overlay" id="scriptModal">
  <div class="modal">
    <div class="modal-header">
      <h2 id="modalTitle">Script</h2>
      <button class="modal-close" onclick="closeModal()">&times;</button>
    </div>
    <div class="modal-body">
      <div class="meta-grid" id="modalMeta"></div>
      <div style="margin:0.8rem 0 0.4rem;display:flex;align-items:center;justify-content:space-between">
        <h3 style="font-size:0.85rem;color:var(--accent2)">Code</h3>
        <span class="script-endpoint" id="modalEndpoint" onclick="copyEndpoint(this)" title="Click to copy"></span>
      </div>
      <div class="result-box" id="modalCode" style="max-height:none"></div>
      <div style="margin-top:0.8rem;display:flex;gap:0.4rem;flex-wrap:wrap">
        <button class="btn-primary" id="modalRunBtn">Execute</button>
        <button class="btn-danger" id="modalDeleteBtn">Delete</button>
      </div>
      <div class="result-box empty" id="modalOutput" style="margin-top:0.7rem;display:none"></div>
    </div>
  </div>
</div>

<script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.18/codemirror.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.18/mode/javascript/javascript.min.js"></script>
<script>
// ========================================
// State
// ========================================
const BASE = location.origin;
let currentConfig = ${configJSON};

// ========================================
// CodeMirror
// ========================================
const cmTheme = () => document.body.dataset.theme === 'dark' ? 'dracula' : 'eclipse';

const niaEditor = CodeMirror(document.getElementById('niaEditorWrap'), {
  value: '# NIA Code\\n# Each line = one intent\\naحسب 100 + 200\\nما هو التاريخ اليوم',
  mode: 'javascript',
  theme: cmTheme(),
  lineNumbers: true,
  lineWrapping: true,
  direction: 'ltr',
  placeholder: '# Write NIA code here...'
});

let createCodeMirror = null;
let modalCodeMirror = null;

// ========================================
// API Helper
// ========================================
async function api(method, url, body) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(url, opts);
  return res.json();
}

// ========================================
// Theme
// ========================================
function toggleTheme() {
  const next = document.body.dataset.theme === 'dark' ? 'light' : 'dark';
  document.body.dataset.theme = next;
  document.getElementById('themeBtn').innerHTML = next === 'dark' ? '&#9790;' : '&#9728;';
  niaEditor.setOption('theme', cmTheme());
  if (createCodeMirror) createCodeMirror.setOption('theme', cmTheme());
  if (modalCodeMirror) modalCodeMirror.setOption('theme', cmTheme());
  api('PUT', '/api/config', { theme: next });
}
// Set initial icon
if (currentConfig.theme === 'light') {
  document.getElementById('themeBtn').innerHTML = '&#9728;';
}

// ========================================
// Model
// ========================================
function onModelChange() {
  const sel = document.getElementById('modelSelect');
  const input = document.getElementById('customModelInput');
  if (sel.value === '__custom__') {
    input.style.display = 'block';
    input.focus();
  } else {
    input.style.display = 'none';
    api('PUT', '/api/config', { model: sel.value });
    toast('Model: ' + sel.value, 'success');
  }
}

function applyCustomModel() {
  const input = document.getElementById('customModelInput');
  const model = input.value.trim();
  if (!model || !model.includes('/')) return toast('Format: provider/model', 'error');

  const sel = document.getElementById('modelSelect');
  // Add option before __custom__
  const opt = document.createElement('option');
  opt.value = model;
  opt.textContent = model;
  opt.selected = true;
  sel.insertBefore(opt, sel.querySelector('[value="__custom__"]'));

  input.style.display = 'none';
  input.value = '';

  // Save to config
  const customs = currentConfig.customModels || [];
  if (!customs.includes(model)) customs.push(model);
  api('PUT', '/api/config', { model, customModels: customs });
  currentConfig.model = model;
  currentConfig.customModels = customs;
  toast('Model: ' + model, 'success');
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
  result.innerHTML = '<span class="loading"></span> Running...';

  try {
    const data = await api('POST', '/api/run', { intent });
    if (data.success) {
      const src = data.meta?.source || '?';
      const badge = src === 'local' ? 'badge-local' : src === 'cached' ? 'badge-cached' : 'badge-ai';
      result.innerHTML =
        '<div style="margin-bottom:0.4rem"><span class="badge ' + badge + '">' + src + '</span>' +
        (data.meta?.duration ? ' <span style="color:var(--text2);font-size:0.75rem">' + data.meta.duration + 'ms</span>' : '') +
        (data.meta?.cost ? ' <span style="color:var(--text2);font-size:0.75rem">$' + data.meta.cost.toFixed(4) + '</span>' : '') +
        '</div>' +
        esc(typeof data.value === 'object' ? JSON.stringify(data.value, null, 2) : String(data.value));
    } else {
      result.innerHTML = '<span style="color:var(--danger)">Error: ' + esc(data.error) + '</span>';
    }
  } catch (e) {
    result.innerHTML = '<span style="color:var(--danger)">' + esc(e.message) + '</span>';
  }
  refreshStats();
}

document.getElementById('intentInput').addEventListener('keydown', e => { if (e.key === 'Enter') runIntent(); });

// ========================================
// Generate Script
// ========================================
async function createScript() {
  const input = document.getElementById('createInput');
  const result = document.getElementById('createResult');
  const intent = input.value.trim();
  if (!intent) return;

  result.className = 'result-box';
  result.innerHTML = '<span class="loading"></span> Generating...';

  try {
    const data = await api('POST', '/api/create', { intent });
    if (data.success) {
      result.innerHTML = '';
      result.className = 'result-box';
      createCodeMirror = CodeMirror(result, {
        value: data.code,
        mode: 'javascript',
        theme: cmTheme(),
        lineNumbers: true,
        readOnly: true,
        lineWrapping: true,
        direction: 'ltr'
      });
      toast('Script created', 'success');
      loadScripts();
    } else {
      result.innerHTML = '<span style="color:var(--danger)">Error: ' + esc(data.error) + '</span>';
    }
  } catch (e) {
    result.innerHTML = '<span style="color:var(--danger)">' + esc(e.message) + '</span>';
  }
  refreshStats();
}

document.getElementById('createInput').addEventListener('keydown', e => { if (e.key === 'Enter') createScript(); });

// ========================================
// NIA Editor
// ========================================
async function executeNiaCode() {
  const result = document.getElementById('niaResult');
  const code = niaEditor.getValue().trim();
  if (!code) return;

  const lines = code.split('\\n').filter(l => l.trim() && !l.startsWith('#'));
  result.className = 'result-box';
  result.innerHTML = '<span class="loading"></span> Running ' + lines.length + ' intents...';

  let output = '';
  for (const line of lines) {
    try {
      const data = await api('POST', '/api/run', { intent: line.trim() });
      const src = data.meta?.source || '?';
      output += '> ' + line.trim() + '\\n';
      output += (data.success ? String(data.value) : 'Error: ' + data.error) + '  [' + src + ']\\n\\n';
    } catch (e) {
      output += '> ' + line.trim() + '\\nError: ' + e.message + '\\n\\n';
    }
  }
  result.textContent = output;
  refreshStats();
}

async function saveNiaFile() {
  const name = document.getElementById('niaFileName').value.trim();
  const content = niaEditor.getValue();
  if (!name) return toast('Enter filename', 'error');
  if (!content.trim()) return toast('Editor is empty', 'error');
  try {
    const data = await api('POST', '/api/nia-files', { name, content });
    if (data.success) toast('Saved: ' + data.filename, 'success');
    else toast(data.error, 'error');
  } catch (e) { toast(e.message, 'error'); }
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
      list.innerHTML = '<li class="script-item" style="justify-content:center;color:var(--text2)">No scripts yet</li>';
      return;
    }
    list.innerHTML = data.scripts.map(s => {
      const date = new Date(s.createdAt).toLocaleDateString();
      const endpoint = BASE + '/api/execute/' + s.id;
      return '<li class="script-item">' +
        '<div class="script-info">' +
          '<div class="script-name" onclick="viewScript(\\'' + s.id + '\\')">' + esc(s.filename) + '</div>' +
          '<div class="script-intent">' + esc(s.intent || 'No intent') + '</div>' +
          '<div class="script-endpoint" onclick="copyText(\\'' + endpoint + '\\')" title="Click to copy endpoint">GET ' + endpoint + '</div>' +
          '<div class="script-date">' + date + ' | ' + fmtSize(s.size) + '</div>' +
        '</div>' +
        '<div class="script-actions">' +
          '<button class="btn-sm" onclick="viewScript(\\'' + s.id + '\\')">View</button>' +
          '<button class="btn-sm btn-primary" onclick="execScript(\\'' + s.id + '\\')">Run</button>' +
          '<button class="btn-sm btn-danger" onclick="delScript(\\'' + s.id + '\\')">Del</button>' +
        '</div>' +
      '</li>';
    }).join('');
  } catch (e) {
    list.innerHTML = '<li class="script-item" style="color:var(--danger)">' + e.message + '</li>';
  }
}

async function viewScript(id) {
  const modal = document.getElementById('scriptModal');
  const code = document.getElementById('modalCode');
  const output = document.getElementById('modalOutput');
  const endpoint = document.getElementById('modalEndpoint');
  output.style.display = 'none';
  code.innerHTML = '<span class="loading"></span>';
  document.getElementById('modalMeta').innerHTML = '';
  document.getElementById('modalTitle').textContent = id;
  endpoint.textContent = 'GET ' + BASE + '/api/execute/' + id;
  modal.classList.add('active');

  try {
    const data = await api('GET', '/api/scripts/' + id);
    if (data.success) {
      code.innerHTML = '';
      modalCodeMirror = CodeMirror(code, {
        value: data.code,
        mode: 'javascript',
        theme: cmTheme(),
        lineNumbers: true,
        readOnly: true,
        lineWrapping: true,
        direction: 'ltr'
      });
      setTimeout(() => modalCodeMirror.refresh(), 50);
      const md = data.meta || {};
      const items = [
        { l: 'Intent', v: md.intent || '-' },
        { l: 'Model', v: md.model || '-' },
        { l: 'Generated', v: md.generatedAt ? new Date(md.generatedAt).toLocaleString() : '-' },
        { l: 'Lines', v: md.linesOfCode || '-' },
        { l: 'Size', v: fmtSize(data.size) },
        { l: 'Endpoint', v: '/api/execute/' + id },
      ];
      document.getElementById('modalMeta').innerHTML = items.map(i =>
        '<div class="meta-item"><div class="meta-label">' + i.l + '</div><div class="meta-value">' + esc(String(i.v)) + '</div></div>'
      ).join('');

      document.getElementById('modalRunBtn').onclick = async () => {
        output.style.display = 'block';
        output.className = 'result-box';
        output.innerHTML = '<span class="loading"></span> Executing...';
        try {
          const r = await api('POST', '/api/execute/' + id);
          output.textContent = r.success ? r.output : 'Error: ' + r.error;
          if (!r.success) output.innerHTML = '<span style="color:var(--danger)">' + esc(r.error) + '</span>';
        } catch (e) {
          output.innerHTML = '<span style="color:var(--danger)">' + esc(e.message) + '</span>';
        }
      };

      document.getElementById('modalDeleteBtn').onclick = async () => {
        if (confirm('Delete this script?')) { await delScript(id); closeModal(); }
      };
    }
  } catch (e) {
    code.innerHTML = '<span style="color:var(--danger)">' + e.message + '</span>';
  }
}

async function execScript(id) {
  toast('Executing...', 'success');
  try {
    const data = await api('POST', '/api/execute/' + id);
    if (data.success) {
      toast('Success', 'success');
      viewScript(id);
      setTimeout(() => {
        const o = document.getElementById('modalOutput');
        o.style.display = 'block';
        o.className = 'result-box';
        o.textContent = data.output;
      }, 300);
    } else { toast(data.error, 'error'); }
  } catch (e) { toast(e.message, 'error'); }
}

async function delScript(id) {
  try {
    const data = await api('DELETE', '/api/scripts/' + id);
    if (data.success) { toast('Deleted', 'success'); loadScripts(); }
    else toast(data.error, 'error');
  } catch (e) { toast(e.message, 'error'); }
}

function closeModal() { document.getElementById('scriptModal').classList.remove('active'); }
document.getElementById('scriptModal').addEventListener('click', e => { if (e.target === e.currentTarget) closeModal(); });

// ========================================
// Stats
// ========================================
async function refreshStats() {
  try {
    const data = await api('GET', '/api/stats');
    if (data.success) {
      const e = data.engine;
      const s = data.scripts;
      // Desktop
      document.getElementById('stTotal').textContent = e.totalCalls;
      document.getElementById('stLocal').textContent = e.localCalls;
      document.getElementById('stAI').textContent = e.aiCalls;
      document.getElementById('stCache').textContent = e.cachedCalls;
      document.getElementById('stScripts').textContent = s.total;
      // Mobile
      document.getElementById('stTotalM').textContent = e.totalCalls;
      document.getElementById('stLocalM').textContent = e.localCalls;
      document.getElementById('stAIM').textContent = e.aiCalls;
      document.getElementById('stCacheM').textContent = e.cachedCalls;
      document.getElementById('stScriptsM').textContent = s.total;
    }
  } catch {}
}

// ========================================
// Helpers
// ========================================
function esc(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }
function fmtSize(b) { return b < 1024 ? b + 'B' : b < 1048576 ? (b/1024).toFixed(1) + 'KB' : (b/1048576).toFixed(1) + 'MB'; }
function toast(m, t) {
  const el = document.createElement('div');
  el.className = 'toast toast-' + t;
  el.textContent = m;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2500);
}
function copyText(t) {
  navigator.clipboard.writeText(t).then(() => toast('Copied!', 'success')).catch(() => {});
}
function copyEndpoint(el) { copyText(el.textContent.replace('GET ', '')); }

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
╔═══════════════════════════════════════════╗
║       NiaScript Dashboard v2             ║
╠═══════════════════════════════════════════╣
║  Dashboard:  http://localhost:${PORT}        ║
║  Model:      ${config.model.padEnd(26)}║
║  Theme:      ${(config.theme || 'dark').padEnd(26)}║
╠═══════════════════════════════════════════╣
║  POST /api/run         - Run intent      ║
║  POST /api/create      - Generate script ║
║  GET  /api/scripts     - List scripts    ║
║  GET  /api/scripts/:id - Script detail   ║
║  GET  /api/execute/:id - Run script      ║
║  POST /api/execute/:id - Run script      ║
║  GET  /api/config      - Get config      ║
║  PUT  /api/config      - Update config   ║
║  GET  /api/models      - List models     ║
║  GET  /api/stats       - Statistics      ║
╚═══════════════════════════════════════════╝
`);
});

export default app;
