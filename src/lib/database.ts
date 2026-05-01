import type { SQLiteDatabase } from 'expo-sqlite';

import { getPrivateContentMeta, getPrivateSeedBundles, privateContentIsAvailable } from '@/lib/private-content';
import type { ExerciseSeed, UnitSeedBundle, VocabStatus } from '@/types/content';

export const DATABASE_NAME = 'technical-english-app.db';

function json(value: unknown) {
  return JSON.stringify(value);
}

function nowIso() {
  return new Date().toISOString();
}

async function insertUnitSeedAsync(db: SQLiteDatabase, bundle: UnitSeedBundle) {
  const timestamp = nowIso();

  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `INSERT OR REPLACE INTO units (id, title, subtitle, intro_de, focus_areas_json, seeded_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        bundle.unit.id,
        bundle.unit.title,
        bundle.unit.subtitle,
        bundle.unit.introDe,
        json(bundle.unit.focusAreas),
        timestamp,
      ]
    );

    for (const section of bundle.sections) {
      await db.runAsync(
        `INSERT OR REPLACE INTO sections (
          id, unit_id, position, title, subtitle, summary_de, book_section_ref,
          page_start, page_end, grammar_topics_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          section.id,
          section.unitId,
          section.position,
          section.title,
          section.subtitle,
          section.summaryDe,
          section.bookSectionRef,
          section.pageStart,
          section.pageEnd,
          json(section.grammarTopics),
        ]
      );
    }

    for (const vocab of bundle.vocabItems) {
      await db.runAsync(
        `INSERT OR REPLACE INTO vocab_items (
          id, section_id, term, translation_de, explanation_de, example_en, example_de, notes_de, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, COALESCE((SELECT status FROM vocab_items WHERE id = ?), ?))`,
        [
          vocab.id,
          vocab.sectionId,
          vocab.term,
          vocab.translationDe,
          vocab.explanationDe,
          vocab.exampleEn,
          vocab.exampleDe,
          vocab.notesDe ?? null,
          vocab.id,
          'new' satisfies VocabStatus,
        ]
      );
    }

    for (const exercise of bundle.exercises) {
      await insertExerciseAsync(db, exercise);
    }

    for (const track of bundle.listeningTracks) {
      await db.runAsync(
        `INSERT OR REPLACE INTO audio_tracks (
          id, section_id, position, title, prompt_de, transcript_text, source_ref, asset_key, completed_at
        ) VALUES (
          ?, ?, ?, ?, ?, ?, ?, ?,
          COALESCE((SELECT completed_at FROM audio_tracks WHERE id = ?), NULL)
        )`,
        [
          track.id,
          track.sectionId,
          track.position,
          track.title,
          track.promptDe,
          track.transcriptText,
          track.sourceRef,
          track.assetKey,
          track.id,
        ]
      );
    }

    await db.runAsync(
      `INSERT OR REPLACE INTO app_meta (key, value) VALUES (?, ?), (?, ?)`,
      ['seed_generated_at', getPrivateContentMeta().generatedAt ?? '', 'seed_source_pdf', getPrivateContentMeta().sourcePdf ?? '']
    );
  });
}

async function insertExerciseAsync(db: SQLiteDatabase, exercise: ExerciseSeed) {
  await db.runAsync(
    `INSERT OR REPLACE INTO exercises (
      id, section_id, position, type, title, instructions_de, book_section_ref,
      difficulty, solution_mode, review_eligible, explanation_de, payload_json,
      last_result, last_attempt_at
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
      COALESCE((SELECT last_result FROM exercises WHERE id = ?), 'unseen'),
      COALESCE((SELECT last_attempt_at FROM exercises WHERE id = ?), NULL)
    )`,
    [
      exercise.id,
      exercise.sectionId,
      exercise.position,
      exercise.type,
      exercise.title,
      exercise.instructionsDe,
      exercise.bookSectionRef,
      exercise.difficulty,
      exercise.solutionMode,
      exercise.reviewEligible ? 1 : 0,
      exercise.explanationDe,
      json(exercise.payload),
      exercise.id,
      exercise.id,
    ]
  );
}

export async function initializeDatabaseAsync(db: SQLiteDatabase) {
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS app_meta (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS units (
      id TEXT PRIMARY KEY NOT NULL,
      title TEXT NOT NULL,
      subtitle TEXT NOT NULL,
      intro_de TEXT NOT NULL,
      focus_areas_json TEXT NOT NULL,
      seeded_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sections (
      id TEXT PRIMARY KEY NOT NULL,
      unit_id TEXT NOT NULL,
      position INTEGER NOT NULL,
      title TEXT NOT NULL,
      subtitle TEXT NOT NULL,
      summary_de TEXT NOT NULL,
      book_section_ref TEXT NOT NULL,
      page_start INTEGER NOT NULL,
      page_end INTEGER NOT NULL,
      grammar_topics_json TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS exercises (
      id TEXT PRIMARY KEY NOT NULL,
      section_id TEXT NOT NULL,
      position INTEGER NOT NULL,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      instructions_de TEXT NOT NULL,
      book_section_ref TEXT NOT NULL,
      difficulty TEXT NOT NULL,
      solution_mode TEXT NOT NULL,
      review_eligible INTEGER NOT NULL,
      explanation_de TEXT NOT NULL,
      payload_json TEXT NOT NULL,
      last_result TEXT NOT NULL DEFAULT 'unseen',
      last_attempt_at TEXT
    );

    CREATE TABLE IF NOT EXISTS exercise_attempts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      exercise_id TEXT NOT NULL,
      submitted_answer_json TEXT NOT NULL,
      is_correct INTEGER NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS vocab_items (
      id TEXT PRIMARY KEY NOT NULL,
      section_id TEXT NOT NULL,
      term TEXT NOT NULL,
      translation_de TEXT NOT NULL,
      explanation_de TEXT NOT NULL,
      example_en TEXT NOT NULL,
      example_de TEXT NOT NULL,
      notes_de TEXT,
      status TEXT NOT NULL DEFAULT 'new',
      last_reviewed_at TEXT
    );

    CREATE TABLE IF NOT EXISTS review_queue (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      item_type TEXT NOT NULL,
      item_id TEXT NOT NULL,
      reason TEXT NOT NULL,
      due_at TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending'
    );

    CREATE TABLE IF NOT EXISTS audio_tracks (
      id TEXT PRIMARY KEY NOT NULL,
      section_id TEXT NOT NULL,
      position INTEGER NOT NULL,
      title TEXT NOT NULL,
      prompt_de TEXT NOT NULL,
      transcript_text TEXT NOT NULL,
      source_ref TEXT NOT NULL,
      asset_key TEXT NOT NULL,
      completed_at TEXT
    );

    CREATE TABLE IF NOT EXISTS user_progress (
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      status TEXT NOT NULL,
      score REAL,
      completed_at TEXT,
      updated_at TEXT NOT NULL,
      meta_json TEXT,
      PRIMARY KEY (entity_type, entity_id)
    );
  `);

  if (privateContentIsAvailable()) {
    const bundles = getPrivateSeedBundles();
    for (const bundle of bundles) {
      await insertUnitSeedAsync(db, bundle);
    }
  }
}

export async function resetProgressAsync(db: SQLiteDatabase) {
  await db.withTransactionAsync(async () => {
    await db.execAsync(`
      DELETE FROM exercise_attempts;
      DELETE FROM review_queue;
      DELETE FROM user_progress;
      UPDATE exercises SET last_result = 'unseen', last_attempt_at = NULL;
      UPDATE vocab_items SET status = 'new', last_reviewed_at = NULL;
      UPDATE audio_tracks SET completed_at = NULL;
    `);
  });
}
