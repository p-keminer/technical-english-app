import fs from 'fs';
import path from 'path';

import { repoPath } from './utils.mjs';

const qaDir = repoPath('private-content', 'qa');

const expectedBookMainExercises = {
  'unit-1-functions': [1, 2, 3, 4, 5],
  'unit-1-space-elevator': [6, 7, 8, 9],
  'unit-1-advantages': [10, 11, 12, 13],
  'unit-1-simplifying': [14, 15, 16, 17],

  'unit-2-specific-materials': [1, 2, 3, 4],
  'unit-2-categorising-materials': [5, 6, 7],
  'unit-2-properties': [8, 9, 10, 11],
  'unit-2-quality-issues': [12, 13, 14, 15, 16],

  'unit-3-shapes-features': [1, 2, 3, 4],
  'unit-3-manufacturing-techniques': [5, 6, 7, 8],
  'unit-3-jointing-fixing': [9, 10, 11, 12],
  'unit-3-component-positions': [13, 14, 15],

  'unit-4-working-with-drawings': [1, 2, 3, 4, 5],
  'unit-4-dimensions-precision': [6, 7, 8],
  'unit-4-design-procedures': [9, 10, 11, 12],
  'unit-4-resolving-design-problems': [13, 14],

  'unit-5-technical-problems': [1, 2, 3, 4],
  'unit-5-assessing-faults': [5, 6, 7],
  'unit-5-causes-of-faults': [8, 9, 10],
  'unit-5-repairs-maintenance': [11, 12, 13, 14, 15],

  'unit-6-technical-requirements': [1, 2, 3, 4],
  'unit-6-ideas-solutions': [5, 6, 7],
  'unit-6-feasibility': [8, 9, 10],
  'unit-6-improvements-redesign': [11, 12, 13],

  'unit-7-health-safety-precautions': [1, 2, 3, 4],
  'unit-7-importance-precautions': [5, 6, 7],
  'unit-7-regulations-standards': [8, 9, 10, 11],
  'unit-7-written-instructions': [12, 13, 14, 15],

  'unit-8-automated-systems': [1, 2, 3, 4],
  'unit-8-measurable-parameters': [5, 6, 7],
  'unit-8-readings-trends': [8, 9, 10],
  'unit-8-approximate-figures': [11, 12, 13],

  'unit-9-tests-experiments': [1, 2, 3],
  'unit-9-predictions-theories': [4, 5, 6],
  'unit-9-results-expectations': [7, 8, 9, 10, 11],
  'unit-9-causes-effects': [13, 14],

  'unit-10-performance-suitability': [1, 2, 3],
  'unit-10-physical-forces': [4],
  'unit-10-relative-performance': [5, 6, 7],
  'unit-10-capabilities-limitations': [8, 9],
};

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

function expandExerciseReference(reference) {
  const numbers = new Set();
  const pattern = /\bex\.\s*(\d+)(?:\s*-\s*(\d+))?/gi;
  for (const match of reference.matchAll(pattern)) {
    const start = Number(match[1]);
    const end = match[2] ? Number(match[2]) : start;
    for (let value = start; value <= end; value += 1) {
      numbers.add(value);
    }
  }
  return [...numbers].sort((left, right) => left - right);
}

const rows = [];
let missingSectionCount = 0;

for (const filePath of listManualUnitFiles()) {
  const bundle = readJson(filePath);
  const exercisesBySection = new Map();

  for (const exercise of bundle.exercises ?? []) {
    const list = exercisesBySection.get(exercise.sectionId) ?? [];
    list.push(exercise);
    exercisesBySection.set(exercise.sectionId, list);
  }

  for (const section of [...(bundle.sections ?? [])].sort((left, right) => left.position - right.position)) {
    const expected = expectedBookMainExercises[section.id] ?? [];
    const appExercises = exercisesBySection.get(section.id) ?? [];
    const covered = [
      ...new Set(appExercises.flatMap((exercise) => expandExerciseReference(exercise.bookSectionRef ?? ''))),
    ].sort((left, right) => left - right);
    const missing = expected.filter((exerciseNumber) => !covered.includes(exerciseNumber));

    if (missing.length > 0) {
      missingSectionCount += 1;
    }

    rows.push({
      unit: bundle.unit.id,
      sectionRef: section.bookSectionRef,
      sectionId: section.id,
      bookMainCount: expected.length,
      appCardCount: appExercises.length,
      covered,
      missing,
      refs: appExercises.map((exercise) => exercise.bookSectionRef),
    });
  }
}

console.log('| Unit | Section | Buch-Hauptuebungen | App-Karten | Abgedeckt | Fehlt |');
console.log('| --- | --- | ---: | ---: | --- | --- |');
for (const row of rows) {
  console.log(
    `| ${row.unit} | ${row.sectionRef} | ${row.bookMainCount} | ${row.appCardCount} | ${
      row.covered.length ? row.covered.join(', ') : '-'
    } | ${row.missing.length ? row.missing.join(', ') : '-'} |`
  );
}

console.log(`\nSections with missing main book exercises: ${missingSectionCount}/${rows.length}`);

if (missingSectionCount > 0) {
  process.exitCode = 1;
}
