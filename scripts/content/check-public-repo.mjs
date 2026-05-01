import { execSync } from 'child_process';
import path from 'path';

function getGitFileList(command) {
  const output = execSync(command, { encoding: 'utf8', cwd: process.cwd() });
  return output
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

const trackedFiles = getGitFileList('git ls-files');
const unignoredFiles = getGitFileList('git ls-files --others --exclude-standard');
const bannedExtensions = [
  '.pdf',
  '.zip',
  '.mp3',
  '.m4a',
  '.wav',
  '.aac',
  '.key',
  '.pem',
  '.p12',
  '.p8',
  '.crt',
  '.cer',
  '.der',
  '.mobileconfig',
];
const bannedPathPrefixes = ['private-content/', '.codex-tmp/', '.playwright-mcp/', '.local-https/'];
const bannedRootScreenshotPattern = /^[^/]+\.(png|jpg|jpeg|webp)$/i;

function isBannedRepoFile(file) {
  const normalized = file.replace(/\\/g, '/');
  if (normalized === 'private-content/.gitkeep') {
    return false;
  }

  return (
    bannedPathPrefixes.some((prefix) => normalized.startsWith(prefix)) ||
    bannedExtensions.includes(path.extname(normalized).toLowerCase()) ||
    bannedRootScreenshotPattern.test(normalized)
  );
}

const bannedTrackedFiles = trackedFiles.filter(isBannedRepoFile);
if (bannedTrackedFiles.length > 0) {
  throw new Error(`Files that must stay out of Git are currently tracked:\n${bannedTrackedFiles.join('\n')}`);
}

const riskyUnignoredFiles = unignoredFiles.filter(isBannedRepoFile);
if (riskyUnignoredFiles.length > 0) {
  throw new Error(
    `Files that must stay out of Git are not ignored yet:\n${riskyUnignoredFiles.join('\n')}`
  );
}

console.log('Repo safety check passed: no private content, extraction artifacts, screenshots, or learning media are trackable.');
