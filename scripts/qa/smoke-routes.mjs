import fs from 'fs';
import path from 'path';

import { parseArgs, repoPath } from '../content/utils.mjs';

const args = parseArgs(process.argv.slice(2));
const baseUrl = String(args['base-url'] ?? 'http://localhost:8082').replace(/\/$/, '');
const qaDir = repoPath('private-content', 'qa');

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function listManualUnitFiles() {
  return fs
    .readdirSync(qaDir)
    .filter((fileName) => /^unit-\d+\.manual\.json$/.test(fileName))
    .sort((left, right) => left.localeCompare(right, undefined, { numeric: true }))
    .map((fileName) => path.join(qaDir, fileName));
}

const bundles = listManualUnitFiles().map(readJson);
const routes = [
  '/',
  '/unit',
  '/vocab',
  '/progress',
  '/settings',
  ...bundles.map((bundle) => `/unit/${bundle.unit.id}`),
  ...bundles.flatMap((bundle) => bundle.sections.map((section) => `/section/${section.id}`)),
  ...bundles.map((bundle) => `/quiz/${bundle.unit.id}`),
];

const concurrency = Number(args.concurrency ?? 8);
const results = [];

async function checkRoute(route) {
  const url = `${baseUrl}${route}`;
  try {
    const response = await fetch(url);
    if (!response.ok) {
      return { ok: false, route, status: `${response.status} ${response.statusText}` };
    }
    return { ok: true, route, status: `${response.status} ${response.statusText}` };
  } catch (error) {
    return { ok: false, route, status: `ERROR ${error.message}` };
  }
}

async function runQueue() {
  let index = 0;

  async function worker() {
    while (index < routes.length) {
      const route = routes[index];
      index += 1;
      results.push(await checkRoute(route));
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, routes.length) }, () => worker());
  await Promise.all(workers);
}

await runQueue();

results.sort((left, right) => routes.indexOf(left.route) - routes.indexOf(right.route));

for (const result of results) {
  const line = `${result.route} -> ${result.status}`;
  if (result.ok) {
    console.log(line);
  } else {
    console.error(line);
  }
}

const hasError = results.some((result) => !result.ok);

if (hasError) {
  process.exitCode = 1;
} else {
  console.log(`Route smoke check passed for ${routes.length} routes at ${baseUrl}.`);
}
