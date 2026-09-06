import { access, readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

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
  if (!(await exists(target))) {
    errors.push(`${kind}: ${path.relative(root, fromFile)} -> ${reference}`);
  }
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
  for (const match of source.matchAll(referencePattern)) {
    await assertReference(match[1], indexPath, 'index reference');
  }
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
      for (const match of source.matchAll(pattern)) {
        await assertReference(match[1], file, 'module import');
      }
    }
  }
}

async function checkManifestIcons() {
  const manifestPath = path.join(root, 'manifest.webmanifest');
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  for (const icon of manifest.icons || []) {
    await assertReference(icon.src, manifestPath, 'manifest icon');
  }
}

await Promise.all([
  checkIndexReferences(),
  checkModuleImports(),
  checkManifestIcons(),
]);

if (errors.length) {
  console.error('IronLog static integrity check failed:\n');
  errors.sort().forEach((error) => console.error(`  - ${error}`));
  process.exitCode = 1;
} else {
  console.log('IronLog static integrity check passed.');
}
