import type { SQLiteDatabase } from 'expo-sqlite';

import { evaluateExercise } from '@/lib/evaluate';
import type {
  DashboardOverview,
  ExerciseResult,
  ExerciseSeed,
  PrivateContentMeta,
  ReviewSnapshot,
  SectionCard,
  SectionDetail,
  SectionSeed,
  UnitSeed,
  UnitQuizSnapshot,
  UnitVocabularySnapshot,
  VocabItemSeed,
  VocabStatus,
} from '@/types/content';

function parseJson<T>(value: string): T {
  return JSON.parse(value) as T;
}

function nowIso() {
  return new Date().toISOString();
}

type SectionRow = {
  id: string;
  unit_id: string;
  position: number;
  title: string;
  subtitle: string;
  summary_de: string;
  book_section_ref: string;
  page_start: number;
  page_end: number;
  grammar_topics_json: string;
};

type ExerciseRow = {
  id: string;
  section_id: string;
  position: number;
  type: ExerciseSeed['type'];
  title: string;
  instructions_de: string;
  book_section_ref: string;
  difficulty: ExerciseSeed['difficulty'];
  solution_mode: ExerciseSeed['solutionMode'];
  review_eligible: number;
  explanation_de: string;
  payload_json: string;
  last_result: ExerciseResult;
};

type VocabRow = {
  id: string;
  section_id: string;
  term: string;
  translation_de: string;
  explanation_de: string;
  example_en: string;
  example_de: string;
  notes_de: string | null;
  status: VocabStatus;
};

type AudioTrackRow = {
  id: string;
  section_id: string;
  position: number;
  title: string;
  prompt_de: string;
  transcript_text: string;
  source_ref: string;
  asset_key: string;
  completed_at: string | null;
};

type UnitRow = {
  id: string;
  title: string;
  subtitle: string;
  intro_de: string;
  focus_areas_json: string;
};

function mapUnitRow(row: UnitRow): UnitSeed {
  return {
    id: row.id,
    title: row.title,
    subtitle: row.subtitle,
    introDe: row.intro_de,
    focusAreas: parseJson(row.focus_areas_json),
  };
}

function mapSectionRow(row: SectionRow): SectionSeed {
  return {
    id: row.id,
    unitId: row.unit_id,
    position: row.position,
    title: row.title,
    subtitle: row.subtitle,
    summaryDe: row.summary_de,
    bookSectionRef: row.book_section_ref,
    pageStart: row.page_start,
    pageEnd: row.page_end,
    grammarTopics: parseJson(row.grammar_topics_json),
  };
}

function mapExerciseRow(row: ExerciseRow): ExerciseSeed & { lastResult: ExerciseResult } {
  return {
    id: row.id,
    sectionId: row.section_id,
    position: row.position,
    type: row.type,
    title: row.title,
    instructionsDe: row.instructions_de,
    bookSectionRef: row.book_section_ref,
    difficulty: row.difficulty,
    solutionMode: row.solution_mode,
    reviewEligible: row.review_eligible === 1,
    explanationDe: row.explanation_de,
    payload: parseJson(row.payload_json),
    lastResult: row.last_result ?? 'unseen',
  };
}

function mapVocabRow(row: VocabRow): VocabItemSeed & { status: VocabStatus } {
  return {
    id: row.id,
    sectionId: row.section_id,
    term: row.term,
    translationDe: row.translation_de,
    explanationDe: row.explanation_de,
    exampleEn: row.example_en,
    exampleDe: row.example_de,
    notesDe: row.notes_de ?? undefined,
    status: row.status,
  };
}

async function getUnitAsync(db: SQLiteDatabase) {
  const row = await db.getFirstAsync<UnitRow>(
    'SELECT * FROM units ORDER BY CAST(SUBSTR(id, 6) AS INTEGER) ASC, id ASC LIMIT 1'
  );
  return row ? mapUnitRow(row) : null;
}

async function getUnitByIdAsync(db: SQLiteDatabase, unitId: string) {
  const row = await db.getFirstAsync<UnitRow>('SELECT * FROM units WHERE id = ?', [unitId]);
  return row ? mapUnitRow(row) : null;
}

export async function getUnitsAsync(db: SQLiteDatabase): Promise<UnitSeed[]> {
  const rows = await db.getAllAsync<UnitRow>(
    'SELECT * FROM units ORDER BY CAST(SUBSTR(id, 6) AS INTEGER) ASC, id ASC'
  );
  return rows.map(mapUnitRow);
}

async function getDashboardOverviewForUnitAsync(db: SQLiteDatabase, unit: UnitSeed): Promise<DashboardOverview> {
  const sections = await getSectionCardsAsync(db, unit.id);
  const firstIncomplete = sections.find((section) => section.exerciseCorrect < section.exerciseTotal);
  const reviewCountRow = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count
     FROM review_queue q
     WHERE q.status = 'pending'
       AND (
         (
           q.item_type = 'exercise'
           AND EXISTS (
             SELECT 1
             FROM exercises e
             JOIN sections s ON s.id = e.section_id
             WHERE e.id = q.item_id AND s.unit_id = ?
           )
         )
         OR (
           q.item_type = 'vocab'
           AND EXISTS (
             SELECT 1
             FROM vocab_items v
             JOIN sections s ON s.id = v.section_id
             WHERE v.id = q.item_id AND s.unit_id = ?
           )
         )
       )`,
    [unit.id, unit.id]
  );
  const vocabStats = await db.getFirstAsync<{ total: number; learned: number }>(
    `SELECT
       COUNT(*) as total,
       SUM(CASE WHEN v.status = 'learned' THEN 1 ELSE 0 END) as learned
     FROM vocab_items v
     JOIN sections s ON s.id = v.section_id
     WHERE s.unit_id = ?`,
    [unit.id]
  );
  const exerciseStats = await db.getFirstAsync<{ total: number; correct: number }>(
    `SELECT
       COUNT(*) as total,
       SUM(CASE WHEN e.last_result = 'correct' THEN 1 ELSE 0 END) as correct
     FROM exercises e
     JOIN sections s ON s.id = e.section_id
     WHERE s.unit_id = ?`,
    [unit.id]
  );

  return {
    unit,
    reviewCount: reviewCountRow?.count ?? 0,
    learnedVocabulary: vocabStats?.learned ?? 0,
    vocabularyTotal: vocabStats?.total ?? 0,
    completedExercises: exerciseStats?.correct ?? 0,
    totalExercises: exerciseStats?.total ?? 0,
    continueSectionId: firstIncomplete?.id ?? sections[0]?.id ?? null,
  };
}

async function getUnitQuizSnapshotAsync(
  db: SQLiteDatabase,
  unitId: string,
  totalQuestions: number
): Promise<UnitQuizSnapshot> {
  const exerciseStats = await db.getFirstAsync<{ total: number; correct: number }>(
    `SELECT
       COUNT(*) as total,
       SUM(CASE WHEN last_result = 'correct' THEN 1 ELSE 0 END) as correct
     FROM exercises e
     JOIN sections s ON s.id = e.section_id
     WHERE s.unit_id = ?`,
    [unitId]
  );
  const quizProgress = await db.getFirstAsync<{ status: 'passed' | 'skipped'; completed_at: string | null }>(
    `SELECT status, completed_at
     FROM user_progress
     WHERE entity_type = 'unit_quiz' AND entity_id = ?`,
    [unitId]
  );

  const hasCompletedSections =
    (exerciseStats?.total ?? 0) > 0 && (exerciseStats?.correct ?? 0) === (exerciseStats?.total ?? 0);

  if (quizProgress?.status === 'passed') {
    return {
      unitId,
      status: 'passed',
      totalQuestions,
      completedAt: quizProgress.completed_at ?? null,
      unlockedBy: 'quiz',
    };
  }

  if (quizProgress?.status === 'skipped') {
    return {
      unitId,
      status: 'skipped',
      totalQuestions,
      completedAt: quizProgress.completed_at ?? null,
      unlockedBy: 'skip',
    };
  }

  return {
    unitId,
    status: hasCompletedSections ? 'ready' : 'locked',
    totalQuestions,
    completedAt: null,
    unlockedBy: null,
  };
}

export async function getSectionCardsAsync(db: SQLiteDatabase, unitId: string): Promise<SectionCard[]> {
  const rows = await db.getAllAsync<SectionRow>(
    'SELECT * FROM sections WHERE unit_id = ? ORDER BY position ASC',
    [unitId]
  );

  const cards: SectionCard[] = [];
  for (const row of rows) {
    const exerciseStats = await db.getFirstAsync<{ total: number; correct: number }>(
      `SELECT
         COUNT(*) as total,
         SUM(CASE WHEN last_result = 'correct' THEN 1 ELSE 0 END) as correct
       FROM exercises WHERE section_id = ?`,
      [row.id]
    );
    const vocabStats = await db.getFirstAsync<{ total: number; learned: number }>(
      `SELECT
         COUNT(*) as total,
         SUM(CASE WHEN status = 'learned' THEN 1 ELSE 0 END) as learned
       FROM vocab_items WHERE section_id = ?`,
      [row.id]
    );
    const audioStats = await db.getFirstAsync<{ total: number; completed: number }>(
      `SELECT
         COUNT(*) as total,
         SUM(CASE WHEN completed_at IS NOT NULL THEN 1 ELSE 0 END) as completed
       FROM audio_tracks WHERE section_id = ?`,
      [row.id]
    );

    cards.push({
      id: row.id,
      title: row.title,
      subtitle: row.subtitle,
      summaryDe: row.summary_de,
      bookSectionRef: row.book_section_ref,
      pageRangeLabel: `S. ${row.page_start}-${row.page_end}`,
      exerciseTotal: exerciseStats?.total ?? 0,
      exerciseCorrect: exerciseStats?.correct ?? 0,
      vocabTotal: vocabStats?.total ?? 0,
      vocabLearned: vocabStats?.learned ?? 0,
      audioTotal: audioStats?.total ?? 0,
      audioCompleted: audioStats?.completed ?? 0,
    });
  }

  return cards;
}

export async function getDashboardOverviewAsync(db: SQLiteDatabase): Promise<DashboardOverview | null> {
  const unit = await getUnitAsync(db);
  if (!unit) {
    return null;
  }

  return getDashboardOverviewForUnitAsync(db, unit);
}

export async function getDashboardOverviewsAsync(db: SQLiteDatabase): Promise<DashboardOverview[]> {
  const units = await getUnitsAsync(db);
  const overviews: DashboardOverview[] = [];
  for (const unit of units) {
    overviews.push(await getDashboardOverviewForUnitAsync(db, unit));
  }
  return overviews;
}

export async function getSectionDetailAsync(db: SQLiteDatabase, sectionId: string): Promise<SectionDetail | null> {
  const sectionRow = await db.getFirstAsync<SectionRow>('SELECT * FROM sections WHERE id = ?', [sectionId]);
  if (!sectionRow) {
    return null;
  }

  const [vocabRows, exerciseRows, audioRows] = await Promise.all([
    db.getAllAsync<VocabRow>('SELECT * FROM vocab_items WHERE section_id = ? ORDER BY term ASC', [sectionId]),
    db.getAllAsync<ExerciseRow>('SELECT * FROM exercises WHERE section_id = ? ORDER BY position ASC', [sectionId]),
    db.getAllAsync<AudioTrackRow>('SELECT * FROM audio_tracks WHERE section_id = ? ORDER BY position ASC', [sectionId]),
  ]);

  return {
    section: mapSectionRow(sectionRow),
    vocabItems: vocabRows.map(mapVocabRow),
    exercises: exerciseRows.map(mapExerciseRow),
    listeningTracks: audioRows.map((row) => ({
      id: row.id,
      sectionId: row.section_id,
      position: row.position,
      title: row.title,
      promptDe: row.prompt_de,
      transcriptText: row.transcript_text,
      sourceRef: row.source_ref,
      assetKey: row.asset_key,
      completed: Boolean(row.completed_at),
    })),
  };
}

export async function getUnitVocabularySnapshotAsync(
  db: SQLiteDatabase,
  unitId: string
): Promise<UnitVocabularySnapshot | null> {
  const unit = await getUnitByIdAsync(db, unitId);
  if (!unit) {
    return null;
  }

  const [sectionRows, vocabRows] = await Promise.all([
    db.getAllAsync<SectionRow>('SELECT * FROM sections WHERE unit_id = ? ORDER BY position ASC', [unitId]),
    db.getAllAsync<
      VocabRow & {
        section_title: string;
        book_section_ref: string;
        section_position: number;
      }
    >(
      `SELECT v.*, s.title AS section_title, s.book_section_ref, s.position AS section_position
       FROM vocab_items v
       JOIN sections s ON s.id = v.section_id
       WHERE s.unit_id = ?
       ORDER BY s.position ASC, v.term ASC`,
      [unitId]
    ),
  ]);

  if (sectionRows.length === 0) {
    return null;
  }

  const items = vocabRows.map((row) => ({
    ...mapVocabRow(row),
    sectionTitle: row.section_title,
    sectionRef: row.book_section_ref,
  }));
  const quiz = await getUnitQuizSnapshotAsync(db, unitId, items.length);

  return {
    unit,
    items,
    learnedCount: items.filter((item) => item.status === 'learned').length,
    totalCount: items.length,
    quiz,
  };
}

export async function getReviewSnapshotAsync(db: SQLiteDatabase): Promise<ReviewSnapshot> {
  const exerciseRows = await db.getAllAsync<{
    id: string;
    title: string;
    section_id: string;
    section_title: string;
    explanation_de: string;
    type: ExerciseSeed['type'];
  }>(
    `SELECT e.id, e.title, e.section_id, s.title AS section_title, e.explanation_de, e.type
     FROM review_queue q
     JOIN exercises e ON e.id = q.item_id
     JOIN sections s ON s.id = e.section_id
     WHERE q.item_type = 'exercise' AND q.status = 'pending'
     ORDER BY q.due_at ASC
     LIMIT 12`
  );

  const vocabRows = await db.getAllAsync<{
    id: string;
    term: string;
    translation_de: string;
    example_en: string;
    status: VocabStatus;
  }>(
    `SELECT id, term, translation_de, example_en, status
     FROM vocab_items
     WHERE status IN ('new', 'review')
     ORDER BY CASE status WHEN 'review' THEN 0 ELSE 1 END, term ASC
     LIMIT 12`
  );

  return {
    exercises: exerciseRows.map((row) => ({
      id: row.id,
      title: row.title,
      sectionId: row.section_id,
      sectionTitle: row.section_title,
      explanationDe: row.explanation_de,
      type: row.type,
    })),
    vocabItems: vocabRows.map((row) => ({
      id: row.id,
      term: row.term,
      translationDe: row.translation_de,
      exampleEn: row.example_en,
      status: row.status,
    })),
  };
}

export async function submitExerciseAnswerAsync(
  db: SQLiteDatabase,
  exercise: ExerciseSeed,
  answer: unknown
): Promise<'correct' | 'incorrect'> {
  const result = evaluateExercise(exercise, answer) === 'correct' ? 'correct' : 'incorrect';
  const timestamp = nowIso();

  await db.withTransactionAsync(async () => {
    const existingProgress = await db.getFirstAsync<{ status: ExerciseResult | null }>(
      `SELECT status FROM user_progress WHERE entity_type = 'exercise' AND entity_id = ?`,
      [exercise.id]
    );
    const existingExercise = await db.getFirstAsync<{ last_result: ExerciseResult | null }>(
      `SELECT last_result FROM exercises WHERE id = ?`,
      [exercise.id]
    );
    const persistedResult: ExerciseResult =
      existingProgress?.status === 'correct' || existingExercise?.last_result === 'correct' || result === 'correct'
        ? 'correct'
        : 'incorrect';

    await db.runAsync(
      `INSERT INTO exercise_attempts (exercise_id, submitted_answer_json, is_correct, created_at)
       VALUES (?, ?, ?, ?)`,
      [exercise.id, JSON.stringify(answer), result === 'correct' ? 1 : 0, timestamp]
    );

    await db.runAsync(
      `UPDATE exercises SET last_result = ?, last_attempt_at = ? WHERE id = ?`,
      [persistedResult, timestamp, exercise.id]
    );

    await db.runAsync(
      `INSERT INTO user_progress (entity_type, entity_id, status, score, completed_at, updated_at, meta_json)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(entity_type, entity_id) DO UPDATE SET
         status = excluded.status,
         score = excluded.score,
         completed_at = excluded.completed_at,
         updated_at = excluded.updated_at,
         meta_json = excluded.meta_json`,
      [
        'exercise',
        exercise.id,
        persistedResult,
        persistedResult === 'correct' ? 1 : 0,
        persistedResult === 'correct' ? timestamp : null,
        timestamp,
        JSON.stringify({ type: exercise.type, lastAttemptResult: result }),
      ]
    );

    if (persistedResult === 'correct') {
      await db.runAsync(
        `UPDATE review_queue SET status = 'done', due_at = ? WHERE item_type = 'exercise' AND item_id = ? AND status = 'pending'`,
        [timestamp, exercise.id]
      );
    } else if (exercise.reviewEligible) {
      await db.runAsync(
        `UPDATE review_queue SET status = 'pending', due_at = ?, reason = ? WHERE item_type = 'exercise' AND item_id = ?`,
        [timestamp, 'incorrect_attempt', exercise.id]
      );
      await db.runAsync(
        `INSERT INTO review_queue (item_type, item_id, reason, due_at, status)
         SELECT ?, ?, ?, ?, ?
         WHERE NOT EXISTS (
           SELECT 1 FROM review_queue WHERE item_type = ? AND item_id = ? AND status = 'pending'
         )`,
        ['exercise', exercise.id, 'incorrect_attempt', timestamp, 'pending', 'exercise', exercise.id]
      );
    }
  });

  return result;
}

export async function updateVocabStatusAsync(db: SQLiteDatabase, vocabId: string, status: VocabStatus) {
  const timestamp = nowIso();

  await db.withTransactionAsync(async () => {
    await db.runAsync(`UPDATE vocab_items SET status = ?, last_reviewed_at = ? WHERE id = ?`, [
      status,
      timestamp,
      vocabId,
    ]);

    await db.runAsync(
      `INSERT INTO user_progress (entity_type, entity_id, status, score, completed_at, updated_at, meta_json)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(entity_type, entity_id) DO UPDATE SET
         status = excluded.status,
         score = excluded.score,
         completed_at = excluded.completed_at,
         updated_at = excluded.updated_at,
         meta_json = excluded.meta_json`,
      [
        'vocab',
        vocabId,
        status,
        status === 'learned' ? 1 : 0.5,
        status === 'learned' ? timestamp : null,
        timestamp,
        JSON.stringify({ source: 'manual_review' }),
      ]
    );

    if (status === 'learned') {
      await db.runAsync(
        `UPDATE review_queue SET status = 'done', due_at = ? WHERE item_type = 'vocab' AND item_id = ? AND status = 'pending'`,
        [timestamp, vocabId]
      );
    } else {
      await db.runAsync(
        `UPDATE review_queue SET status = 'pending', due_at = ?, reason = ? WHERE item_type = 'vocab' AND item_id = ?`,
        [timestamp, 'vocab_review', vocabId]
      );
      await db.runAsync(
        `INSERT INTO review_queue (item_type, item_id, reason, due_at, status)
         SELECT ?, ?, ?, ?, ?
         WHERE NOT EXISTS (
           SELECT 1 FROM review_queue WHERE item_type = ? AND item_id = ? AND status = 'pending'
         )`,
        ['vocab', vocabId, 'vocab_review', timestamp, 'pending', 'vocab', vocabId]
      );
    }
  });
}

export async function markTrackCompletedAsync(db: SQLiteDatabase, trackId: string) {
  const timestamp = nowIso();

  await db.withTransactionAsync(async () => {
    await db.runAsync(`UPDATE audio_tracks SET completed_at = COALESCE(completed_at, ?) WHERE id = ?`, [
      timestamp,
      trackId,
    ]);
    await db.runAsync(
      `INSERT INTO user_progress (entity_type, entity_id, status, score, completed_at, updated_at, meta_json)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(entity_type, entity_id) DO UPDATE SET
         status = excluded.status,
         score = excluded.score,
         completed_at = excluded.completed_at,
         updated_at = excluded.updated_at,
         meta_json = excluded.meta_json`,
      [
        'audio',
        trackId,
        'completed',
        1,
        timestamp,
        timestamp,
        JSON.stringify({ action: 'heard' }),
      ]
    );
  });
}

export async function setUnitQuizStatusAsync(
  db: SQLiteDatabase,
  unitId: string,
  status: 'passed' | 'skipped'
) {
  const timestamp = nowIso();
  await db.runAsync(
    `INSERT INTO user_progress (entity_type, entity_id, status, score, completed_at, updated_at, meta_json)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(entity_type, entity_id) DO UPDATE SET
       status = excluded.status,
       score = excluded.score,
       completed_at = excluded.completed_at,
       updated_at = excluded.updated_at,
       meta_json = excluded.meta_json`,
    [
      'unit_quiz',
      unitId,
      status,
      status === 'passed' ? 1 : 0,
      timestamp,
      timestamp,
      JSON.stringify({ unlockedBy: status === 'passed' ? 'quiz' : 'skip' }),
    ]
  );
}

export async function getSeedMetaAsync(db: SQLiteDatabase): Promise<PrivateContentMeta> {
  const rows = await db.getAllAsync<{ key: string; value: string }>(
    `SELECT key, value FROM app_meta WHERE key IN ('seed_generated_at', 'seed_source_pdf')`
  );
  const map = new Map(rows.map((row) => [row.key, row.value]));

  return {
    generatedAt: map.get('seed_generated_at') || null,
    sourcePdf: map.get('seed_source_pdf') || null,
  };
}
