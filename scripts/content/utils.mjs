import fs from 'fs';
import os from 'os';
import path from 'path';

export function ensureDir(targetPath) {
  fs.mkdirSync(targetPath, { recursive: true });
}

export function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

export function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

export function downloadsPath(...parts) {
  return path.join(os.homedir(), 'Downloads', ...parts);
}

export function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const current = argv[index];
    if (!current.startsWith('--')) {
      continue;
    }
    const key = current.slice(2);
    const next = argv[index + 1];
    args[key] = next && !next.startsWith('--') ? next : true;
  }
  return args;
}

export function repoPath(...parts) {
  return path.resolve(process.cwd(), ...parts);
}

export function toModuleLiteral(value) {
  return JSON.stringify(value, null, 2);
}
