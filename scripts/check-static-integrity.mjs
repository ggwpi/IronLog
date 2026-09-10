import { access, readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { spawn } from 'node:child_process';

const root = process.cwd();
const errors = [];

function cleanReference(reference) {
  return String(reference || '').trim().split('#')[0].split('?')[0];
}

function localPath(reference, fromFile) {
  const clean = cleanReference(reference);
  if (!clean || clean.startsWith('#') || /^(?:https?:|data:|mailto:|tel:|javascript:)/i.test(clean)) return null;
  if (clean.startsWith('/')) return path.join(root, clean.slice(1));
  if (!clean.startsWith('.')) return null;
  return path.resolve(path.dirname(fromFile), clean);
}

async function exists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function assertReference(reference, fromFile, kind) {
  const target = localPath(reference, fromFile);
  if (!target) return;
  if (!(await exists(target))) errors.push(`${kind}: ${path.relative(root, fromFile)} -> ${reference}`);
}

async function walk(directory, extension, output = []) {
  const entries = await readdir(directory, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) await walk(fullPath, extension, output);
    else if (entry.isFile() && fullPath.endsWith(extension)) output.push(fullPath);
  }
  return output;
}

async function checkIndexReferences() {
  const indexPath = path.join(root, 'index.html');
  const source = await readFile(indexPath, 'utf8');
  const referencePattern = /\b(?:src|href)=["']([^"']+)["']/g;
  for (const match of source.matchAll(referencePattern)) await assertReference(match[1], indexPath, 'index reference');
}

async function checkModuleImports() {
  const sourceRoot = path.join(root, 'src');
  const files = await walk(sourceRoot, '.js');
  const patterns = [
    /\bimport\s+(?:[^'"()]*?\s+from\s+)?["']([^"']+)["']/g,
    /\bimport\(\s*["']([^"']+)["']\s*\)/g,
  ];

  for (const file of files) {
    const source = await readFile(file, 'utf8');
    for (const pattern of patterns) {
      for (const match of source.matchAll(pattern)) await assertReference(match[1], file, 'module import');
    }
  }
}

function nodeCheck(file) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, ['--check', file], { stdio: ['ignore', 'ignore', 'pipe'] });
    let stderr = '';
    child.stderr.setEncoding('utf8');
    child.stderr.on('data', (chunk) => { stderr += chunk; });
    child.on('error', (error) => {
      errors.push(`javascript syntax: ${path.relative(root, file)} -> ${error.message}`);
      resolve();
    });
    child.on('close', (code) => {
      if (code !== 0) {
        const detail = stderr.trim().split('\n').slice(-2).join(' ');
        errors.push(`javascript syntax: ${path.relative(root, file)}${detail ? ` -> ${detail}` : ''}`);
      }
      resolve();
    });
  });
}

async function checkJavaScriptSyntax() {
  const files = await walk(path.join(root, 'src'), '.js');
  await Promise.all(files.map(nodeCheck));
}

async function checkManifestIcons() {
  const manifestPath = path.join(root, 'manifest.webmanifest');
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  for (const icon of manifest.icons || []) await assertReference(icon.src, manifestPath, 'manifest icon');
}

async function checkIosShellContract() {
  const indexPath = path.join(root, 'index.html');
  const source = await readFile(indexPath, 'utf8');
  const viewport = source.match(/<meta\s+name=["']viewport["']\s+content=["']([^"']+)["']/i)?.[1] || '';
  if (!viewport.includes('viewport-fit=cover')) errors.push('iOS contract: viewport-fit=cover is required');
  if (/user-scalable\s*=\s*no|maximum-scale\s*=\s*1/i.test(viewport)) errors.push('iOS contract: viewport must not disable user zoom');

  const iosCssIndex = source.lastIndexOf('/src/ironlog-ios-system.css');
  const premiumCssIndex = source.lastIndexOf('/src/ironlog-premium-refinement.css');
  const homeRebuildCssIndex = source.lastIndexOf('/src/features/home/home-rebuild.css');
  const lastStylesheetIndex = source.lastIndexOf('rel="stylesheet"');
  if (iosCssIndex < 0) errors.push('iOS contract: unified IronLog iOS stylesheet is not loaded');
  if (premiumCssIndex < 0) errors.push('premium contract: unified premium refinement is not loaded');
  else if (premiumCssIndex < iosCssIndex) errors.push('premium contract: premium refinement must load after the shared iOS system');
  if (homeRebuildCssIndex < 0) errors.push('home contract: rebuilt Home stylesheet is not loaded');
  else if (homeRebuildCssIndex < premiumCssIndex) errors.push('home contract: rebuilt Home stylesheet must load after premium refinement');
  else if (homeRebuildCssIndex < lastStylesheetIndex) errors.push('home contract: rebuilt Home stylesheet must be the last stylesheet');

  const retiredHomeStyles = [
    'home-reference-fix.css',
    'home-anatomy-tune.css',
    'home-header-tune.css',
    'home-greeting-final.css',
    'home-ios-final.css',
  ];
  retiredHomeStyles.forEach((file) => {
    if (source.includes(file)) errors.push(`home contract: retired stylesheet is still loaded -> ${file}`);
  });

  const premiumPath = path.join(root, 'src', 'ironlog-premium-refinement.css');
  const premiumSource = await readFile(premiumPath, 'utf8');
  if (!premiumSource.includes('.training-hero')) errors.push('workouts contract: premium layer must cover workout hero');
  if (!premiumSource.includes('.live-entry-form')) errors.push('active workout contract: premium layer must cover set entry');
  if (!premiumSource.includes('.statistics-page--native')) errors.push('statistics contract: premium layer must cover native statistics');

  const homePath = path.join(root, 'src', 'features', 'home', 'home-rebuild.css');
  const homeSource = await readFile(homePath, 'utf8');
  if (!homeSource.includes('.home-body--back')) errors.push('home contract: rebuilt Home must preserve rear anatomy');
  if (!homeSource.includes('.home-stage__visual')) errors.push('home contract: hero visual must be separated from controls');
  if (!homeSource.includes('.home-goal-track')) errors.push('home contract: rebuilt Home must expose weekly goal progress');
  if (!homeSource.includes('padding-bottom:calc(var(--safe-bottom) + 176px)')) errors.push('home contract: Home must reserve space above the tab bar');

  const homeScreenPath = path.join(root, 'src', 'features', 'home', 'home-screen.js');
  const homeScreenSource = await readFile(homeScreenPath, 'utf8');
  if (!homeScreenSource.includes('home-stage__visual')) errors.push('home contract: Home markup must separate hero visual from CTA');
  if (!homeScreenSource.includes('home-rebuild')) errors.push('home contract: Home screen must opt into rebuilt layout');

  const appScriptMatches = [...source.matchAll(/<script\s+type=["']module["']\s+src=["']\/src\/app\.js[^"']*["']/g)];
  if (appScriptMatches.length !== 1) errors.push(`app shell contract: expected one app.js module, found ${appScriptMatches.length}`);
}

await Promise.all([
  checkIndexReferences(),
  checkModuleImports(),
  checkJavaScriptSyntax(),
  checkManifestIcons(),
  checkIosShellContract(),
]);

if (errors.length) {
  console.error('IronLog static integrity check failed:\n');
  errors.sort().forEach((error) => console.error(`  - ${error}`));
  process.exitCode = 1;
} else {
  console.log('IronLog static integrity check passed.');
}
