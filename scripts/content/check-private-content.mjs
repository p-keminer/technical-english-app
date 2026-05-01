import fs from 'fs';
import path from 'path';

import { repoPath } from './utils.mjs';

const qaDir = repoPath('private-content', 'qa');
const audioDir = repoPath('private-content', 'generated', 'audio');

function fail(message) {
  throw new Error(message);
}

function listManualUnitFiles() {
  if (!fs.existsSync(qaDir)) {
    fail(`Missing private QA directory: ${qaDir}`);
  }

  return fs
    .readdirSync(qaDir)
    .filter((fileName) => /^unit-\d+\.manual\.json$/.test(fileName))
    .sort((left, right) => left.localeCompare(right, undefined, { numeric: true }))
    .map((fileName) => path.join(qaDir, fileName));
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function getDuplicates(values) {
  return [...new Set(values.filter((value, index) => values.indexOf(value) !== index))];
}

function isListeningExercise(exercise) {
  return Boolean(getExerciseTrackId(exercise));
}

function getExerciseTrackId(exercise) {
  if (exercise.type === 'listening_cloze') {
    return exercise.payload?.trackId ?? null;
  }

  const text = `${exercise.title ?? ''} ${exercise.bookSectionRef ?? ''}`;
  const match = text.match(/\btrack\s*(\d+)[.-](\d+)\b/i);
  return match ? `track-${match[1]}-${match[2]}` : null;
}

function hasVisibleSupportMaterial(exercise) {
  return Boolean(exercise.payload?.sourceMaterial?.length || exercise.payload?.wordBank?.length);
}

function needsWordBank(exercise) {
  return (
    exercise.type === 'cloze' &&
    Array.isArray(exercise.payload?.blanks) &&
    exercise.payload.blanks.length > 1 &&
    !exercise.payload?.wordBank?.length
  );
}

function needsVisibleSupportMaterial(exercise) {
  if (exercise.type === 'listening_cloze' || exercise.type === 'matching') {
    return false;
  }

  const text = `${exercise.title ?? ''} ${exercise.instructionsDe ?? ''}`.toLowerCase();
  return [
    'user-manual-ausschnitt',
    'advantage-woerter',
    'from the briefing',
    'rephrasing-phrasen',
    'kevlar-text',
    'fahrzeugteile aus dem buch',
    'trainingstext',
    'buchuebung',
    'regulations-text',
    'industrial blower',
  ].some((needle) => text.includes(needle));
}

const files = listManualUnitFiles();
const seenUnits = new Set();
const seenSections = new Set();
const seenExercises = new Set();
const seenVocab = new Set();
let hasError = false;

for (const file of files) {
  const data = readJson(file);
  const unitId = data.unit?.id;
  const sectionIds = new Set((data.sections ?? []).map((section) => section.id));
  const exerciseIds = (data.exercises ?? []).map((exercise) => exercise.id);
  const answerIds = (data.answerKey ?? []).map((answer) => answer.exerciseId);
  const trackIds = new Set((data.listeningTracks ?? []).map((track) => track.id));
  const problems = [];

  if (!unitId) {
    problems.push('missing unit.id');
  } else if (seenUnits.has(unitId)) {
    problems.push(`duplicate unit id: ${unitId}`);
  }
  seenUnits.add(unitId);

  for (const section of data.sections ?? []) {
    if (!section.id) {
      problems.push('section without id');
      continue;
    }
    if (section.unitId !== unitId) {
      problems.push(`section ${section.id} has unitId ${section.unitId}`);
    }
    if (seenSections.has(section.id)) {
      problems.push(`duplicate section id: ${section.id}`);
    }
    seenSections.add(section.id);
  }

  for (const vocab of data.vocabItems ?? []) {
    if (!vocab.id) {
      problems.push('vocab item without id');
      continue;
    }
    if (!sectionIds.has(vocab.sectionId)) {
      problems.push(`vocab ${vocab.id} references unknown section ${vocab.sectionId}`);
    }
    if (seenVocab.has(vocab.id)) {
      problems.push(`duplicate vocab id: ${vocab.id}`);
    }
    seenVocab.add(vocab.id);
  }

  for (const exercise of data.exercises ?? []) {
    if (!exercise.id) {
      problems.push('exercise without id');
      continue;
    }
    if (!sectionIds.has(exercise.sectionId)) {
      problems.push(`exercise ${exercise.id} references unknown section ${exercise.sectionId}`);
    }
    if (seenExercises.has(exercise.id)) {
      problems.push(`duplicate exercise id: ${exercise.id}`);
    }
    const trackId = getExerciseTrackId(exercise);
    if (trackId) {
      const linkedTrack = (data.listeningTracks ?? []).find((track) => track.id === trackId);
      if (!linkedTrack || !trackIds.has(trackId)) {
        problems.push(`exercise ${exercise.id} references unknown track ${trackId}`);
      } else if (linkedTrack.sectionId !== exercise.sectionId) {
        problems.push(
          `exercise ${exercise.id} references track ${trackId} from different section ${linkedTrack.sectionId}`
        );
      }
    }
    if (needsVisibleSupportMaterial(exercise) && !hasVisibleSupportMaterial(exercise)) {
      problems.push(`exercise ${exercise.id} needs visible in-app support material`);
    }
    if (needsWordBank(exercise)) {
      problems.push(`exercise ${exercise.id} needs a visible word bank for its cloze answers`);
    }
    seenExercises.add(exercise.id);
  }

  for (const track of data.listeningTracks ?? []) {
    if (!track.id) {
      problems.push('listening track without id');
      continue;
    }
    if (!sectionIds.has(track.sectionId)) {
      problems.push(`track ${track.id} references unknown section ${track.sectionId}`);
    }
    if (!track.assetKey) {
      problems.push(`track ${track.id} has no assetKey`);
      continue;
    }
    const expectedAudioPath = path.join(audioDir, `${track.assetKey}.mp3`);
    if (!fs.existsSync(expectedAudioPath)) {
      problems.push(`missing audio asset for ${track.assetKey}: ${expectedAudioPath}`);
    }

    const linkedExercises = (data.exercises ?? []).filter(
      (exercise) => exercise.sectionId === track.sectionId && getExerciseTrackId(exercise) === track.id
    );
    if (linkedExercises.length === 0) {
      problems.push(`track ${track.id} has no linked exercise in section ${track.sectionId}`);
    }
  }

  for (const exerciseId of exerciseIds) {
    if (!answerIds.includes(exerciseId)) {
      problems.push(`missing answer key for ${exerciseId}`);
    }
  }

  for (const answerId of answerIds) {
    if (!exerciseIds.includes(answerId)) {
      problems.push(`answer key references unknown exercise ${answerId}`);
    }
  }

  const duplicateExercises = getDuplicates(exerciseIds);
  if (duplicateExercises.length > 0) {
    problems.push(`duplicate exercise ids inside unit: ${duplicateExercises.join(', ')}`);
  }

  for (const section of data.sections ?? []) {
    const sectionExercises = (data.exercises ?? []).filter((exercise) => exercise.sectionId === section.id);
    const defaultRenderBuckets = [
      ...sectionExercises.filter((exercise) => !isListeningExercise(exercise) && exercise.type !== 'matching'),
      ...sectionExercises.filter(isListeningExercise),
      ...sectionExercises.filter((exercise) => !isListeningExercise(exercise) && exercise.type === 'matching'),
    ].map((exercise) => exercise.id);
    const duplicates = getDuplicates(defaultRenderBuckets);
    const missing = sectionExercises
      .map((exercise) => exercise.id)
      .filter((exerciseId) => !defaultRenderBuckets.includes(exerciseId));

    if (duplicates.length > 0) {
      problems.push(`section ${section.id} would render duplicate exercises: ${duplicates.join(', ')}`);
    }
    if (missing.length > 0) {
      problems.push(`section ${section.id} would hide exercises in default view: ${missing.join(', ')}`);
    }
  }

  if (problems.length > 0) {
    hasError = true;
    console.error(`${unitId ?? path.basename(file)}: FAIL`);
    for (const problem of problems) {
      console.error(`  - ${problem}`);
    }
  } else {
    console.log(
      `${unitId}: OK (${data.sections.length} sections, ${data.vocabItems.length} vocab, ${data.exercises.length} exercises, ${data.listeningTracks.length} tracks)`
    );
  }
}

if (files.length !== 10) {
  hasError = true;
  console.error(`Expected 10 unit seed files, found ${files.length}.`);
}

if (hasError) {
  process.exitCode = 1;
} else {
  console.log(`Private content check passed for ${files.length} units.`);
}
