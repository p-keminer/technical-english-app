import { evaluateExercise } from '@/lib/evaluate';
import type {
  DashboardOverview,
  ExerciseResult,
  ExerciseSeed,
  ReviewSnapshot,
  SectionCard,
  SectionDetail,
  UnitQuizSnapshot,
  UnitSeedBundle,
  UnitVocabularySnapshot,
  VocabStatus,
} from '@/types/content';

const STORAGE_KEY = 'technical-english-app-web-progress-v1';
const STORAGE_KEY_SUFFIX = '-web-progress-v1';

type WebProgressState = {
  exerciseResults: Record<string, ExerciseResult>;
  vocabStatuses: Record<string, VocabStatus>;
  audioCompleted: string[];
  reviewExercises: string[];
  reviewVocab: string[];
  unitQuizResults: Record<string, { status: 'passed' | 'skipped'; completedAt: string }>;
};

type StoredProgress = {
  bundleId: string;
  state: WebProgressState;
};

function normalizeBundles(bundles: UnitSeedBundle | UnitSeedBundle[]) {
  return Array.isArray(bundles) ? bundles : [bundles];
}

function loadStoredValueWithSuffixMigration(currentKey: string, keySuffix: string) {
  const currentValue = window.localStorage.getItem(currentKey);
  if (currentValue) {
    return currentValue;
  }

  for (let index = 0; index < window.localStorage.length; index += 1) {
    const candidateKey = window.localStorage.key(index);
    if (!candidateKey || candidateKey === currentKey || !candidateKey.endsWith(keySuffix)) {
      continue;
    }

    const migratedValue = window.localStorage.getItem(candidateKey);
    if (!migratedValue) {
      continue;
    }

    window.localStorage.setItem(currentKey, migratedValue);
    window.localStorage.removeItem(candidateKey);
    return migratedValue;
  }

  return null;
}

function getUnitSortNumber(unitId: string) {
  const match = /^unit-(\d+)$/.exec(unitId);
  return match ? Number(match[1]) : Number.MAX_SAFE_INTEGER;
}

function sortBundlesByUnit(bundles: UnitSeedBundle[]) {
  return [...bundles].sort(
    (left, right) =>
      getUnitSortNumber(left.unit.id) - getUnitSortNumber(right.unit.id) || left.unit.id.localeCompare(right.unit.id)
  );
}

function getBundleStorageId(bundles: UnitSeedBundle | UnitSeedBundle[]) {
  return normalizeBundles(bundles)
    .map((bundle) => bundle.unit.id)
    .join('|');
}

function sortSections(bundle: UnitSeedBundle) {
  return [...bundle.sections].sort((left, right) => left.position - right.position);
}

function sortExercises(bundle: UnitSeedBundle) {
  return [...bundle.exercises].sort((left, right) => left.position - right.position);
}

function sortTracks(bundle: UnitSeedBundle) {
  return [...bundle.listeningTracks].sort((left, right) => left.position - right.position);
}

function sortVocab(bundle: UnitSeedBundle) {
  return [...bundle.vocabItems].sort((left, right) => left.term.localeCompare(right.term));
}

function ensureUnique(ids: string[]) {
  return [...new Set(ids)];
}

export function createInitialWebProgress(bundles: UnitSeedBundle | UnitSeedBundle[]): WebProgressState {
  const normalizedBundles = normalizeBundles(bundles);
  return {
    exerciseResults: Object.fromEntries(
      normalizedBundles.flatMap((bundle) =>
        bundle.exercises.map((exercise) => [exercise.id, 'unseen' satisfies ExerciseResult])
      )
    ),
    vocabStatuses: Object.fromEntries(
      normalizedBundles.flatMap((bundle) => bundle.vocabItems.map((item) => [item.id, 'new' satisfies VocabStatus]))
    ),
    audioCompleted: [],
    reviewExercises: [],
    reviewVocab: [],
    unitQuizResults: {},
  };
}

export function loadWebProgress(bundles: UnitSeedBundle | UnitSeedBundle[]): WebProgressState {
  if (typeof window === 'undefined' || !window.localStorage) {
    return createInitialWebProgress(bundles);
  }

  try {
    const raw = loadStoredValueWithSuffixMigration(STORAGE_KEY, STORAGE_KEY_SUFFIX);
    if (!raw) {
      return createInitialWebProgress(bundles);
    }

    const parsed = JSON.parse(raw) as Partial<StoredProgress>;
    if (!parsed.state) {
      return createInitialWebProgress(bundles);
    }

    const defaults = createInitialWebProgress(bundles);
    return {
      exerciseResults: {
        ...defaults.exerciseResults,
        ...(parsed.state.exerciseResults ?? {}),
      },
      vocabStatuses: {
        ...defaults.vocabStatuses,
        ...(parsed.state.vocabStatuses ?? {}),
      },
      audioCompleted: ensureUnique(parsed.state.audioCompleted ?? []),
      reviewExercises: ensureUnique(parsed.state.reviewExercises ?? []),
      reviewVocab: ensureUnique(parsed.state.reviewVocab ?? []),
      unitQuizResults: parsed.state.unitQuizResults ?? {},
    };
  } catch {
    return createInitialWebProgress(bundles);
  }
}

export function saveWebProgress(bundles: UnitSeedBundle | UnitSeedBundle[], state: WebProgressState) {
  if (typeof window === 'undefined' || !window.localStorage) {
    return;
  }

  const payload: StoredProgress = {
    bundleId: getBundleStorageId(bundles),
    state,
  };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

export function getSectionCardsFromBundle(bundle: UnitSeedBundle, state: WebProgressState): SectionCard[] {
  return sortSections(bundle).map((section) => {
    const sectionExercises = bundle.exercises.filter((exercise) => exercise.sectionId === section.id);
    const sectionVocab = bundle.vocabItems.filter((item) => item.sectionId === section.id);
    const sectionTracks = bundle.listeningTracks.filter((track) => track.sectionId === section.id);

    return {
      id: section.id,
      title: section.title,
      subtitle: section.subtitle,
      summaryDe: section.summaryDe,
      bookSectionRef: section.bookSectionRef,
      pageRangeLabel: `S. ${section.pageStart}-${section.pageEnd}`,
      exerciseTotal: sectionExercises.length,
      exerciseCorrect: sectionExercises.filter((exercise) => state.exerciseResults[exercise.id] === 'correct').length,
      vocabTotal: sectionVocab.length,
      vocabLearned: sectionVocab.filter((item) => state.vocabStatuses[item.id] === 'learned').length,
      audioTotal: sectionTracks.length,
      audioCompleted: sectionTracks.filter((track) => state.audioCompleted.includes(track.id)).length,
    };
  });
}

export function getDashboardOverviewFromBundle(
  bundle: UnitSeedBundle,
  state: WebProgressState
): DashboardOverview {
  const sections = getSectionCardsFromBundle(bundle, state);
  const firstIncomplete = sections.find((section) => section.exerciseCorrect < section.exerciseTotal);
  const learnedVocabulary = bundle.vocabItems.filter((item) => state.vocabStatuses[item.id] === 'learned').length;
  const completedExercises = bundle.exercises.filter((exercise) => state.exerciseResults[exercise.id] === 'correct').length;

  return {
    unit: bundle.unit,
    reviewCount: state.reviewExercises.length + state.reviewVocab.length,
    learnedVocabulary,
    vocabularyTotal: bundle.vocabItems.length,
    completedExercises,
    totalExercises: bundle.exercises.length,
    continueSectionId: firstIncomplete?.id ?? sections[0]?.id ?? null,
  };
}

export function getDashboardOverviewsFromBundles(
  bundles: UnitSeedBundle[],
  state: WebProgressState
): DashboardOverview[] {
  return sortBundlesByUnit(bundles).map((bundle) => getDashboardOverviewFromBundle(bundle, state));
}

export function getSectionsByUnitFromBundles(
  bundles: UnitSeedBundle[],
  state: WebProgressState
): Record<string, SectionCard[]> {
  return Object.fromEntries(
    sortBundlesByUnit(bundles).map((bundle) => [bundle.unit.id, getSectionCardsFromBundle(bundle, state)])
  );
}

export function findBundleBySectionId(bundles: UnitSeedBundle[], sectionId: string): UnitSeedBundle | null {
  return bundles.find((bundle) => bundle.sections.some((section) => section.id === sectionId)) ?? null;
}

export function findBundleByUnitId(bundles: UnitSeedBundle[], unitId: string): UnitSeedBundle | null {
  return bundles.find((bundle) => bundle.unit.id === unitId) ?? null;
}

export function getSectionDetailFromBundle(
  bundle: UnitSeedBundle,
  state: WebProgressState,
  sectionId: string
): SectionDetail | null {
  const section = bundle.sections.find((item) => item.id === sectionId);
  if (!section) {
    return null;
  }

  return {
    section,
    vocabItems: sortVocab(bundle)
      .filter((item) => item.sectionId === sectionId)
      .map((item) => ({
        ...item,
        status: state.vocabStatuses[item.id] ?? 'new',
      })),
    exercises: sortExercises(bundle)
      .filter((exercise) => exercise.sectionId === sectionId)
      .map((exercise) => ({
        ...exercise,
        lastResult: state.exerciseResults[exercise.id] ?? 'unseen',
      })),
    listeningTracks: sortTracks(bundle)
      .filter((track) => track.sectionId === sectionId)
      .map((track) => ({
        ...track,
        completed: state.audioCompleted.includes(track.id),
      })),
  };
}

function getUnitQuizSnapshotFromBundle(
  bundle: UnitSeedBundle,
  state: WebProgressState,
  unitId: string,
  totalQuestions: number
): UnitQuizSnapshot {
  const unitSections = bundle.sections.filter((section) => section.unitId === unitId);
  const unitExerciseIds = bundle.exercises
    .filter((exercise) => unitSections.some((section) => section.id === exercise.sectionId))
    .map((exercise) => exercise.id);
  const allExercisesCompleted =
    unitExerciseIds.length > 0 && unitExerciseIds.every((exerciseId) => state.exerciseResults[exerciseId] === 'correct');
  const unitResult = state.unitQuizResults[unitId];

  if (unitResult?.status === 'passed') {
    return {
      unitId,
      status: 'passed',
      totalQuestions,
      completedAt: unitResult.completedAt,
      unlockedBy: 'quiz',
    };
  }

  if (unitResult?.status === 'skipped') {
    return {
      unitId,
      status: 'skipped',
      totalQuestions,
      completedAt: unitResult.completedAt,
      unlockedBy: 'skip',
    };
  }

  return {
    unitId,
    status: allExercisesCompleted ? 'ready' : 'locked',
    totalQuestions,
    completedAt: null,
    unlockedBy: null,
  };
}

export function getUnitVocabularySnapshotFromBundle(
  bundle: UnitSeedBundle,
  state: WebProgressState,
  unitId: string
): UnitVocabularySnapshot | null {
  if (bundle.unit.id !== unitId) {
    return null;
  }

  const sectionLookup = new Map(bundle.sections.map((section) => [section.id, section]));
  const items = sortVocab(bundle)
    .filter((item) => sectionLookup.has(item.sectionId))
    .sort((left, right) => {
      const leftSection = sectionLookup.get(left.sectionId);
      const rightSection = sectionLookup.get(right.sectionId);
      return (leftSection?.position ?? 0) - (rightSection?.position ?? 0) || left.term.localeCompare(right.term);
    })
    .map((item) => {
      const section = sectionLookup.get(item.sectionId);
      return {
        ...item,
        status: state.vocabStatuses[item.id] ?? 'new',
        sectionTitle: section?.title ?? item.sectionId,
        sectionRef: section?.bookSectionRef ?? item.sectionId,
      };
    });

  return {
    unit: bundle.unit,
    items,
    learnedCount: items.filter((item) => item.status === 'learned').length,
    totalCount: items.length,
    quiz: getUnitQuizSnapshotFromBundle(bundle, state, unitId, items.length),
  };
}

export function getReviewSnapshotFromBundle(bundle: UnitSeedBundle, state: WebProgressState): ReviewSnapshot {
  const sectionTitles = new Map(bundle.sections.map((section) => [section.id, section.title]));
  const exerciseLookup = new Map(bundle.exercises.map((exercise) => [exercise.id, exercise]));

  const exercises = state.reviewExercises
    .map((exerciseId) => exerciseLookup.get(exerciseId))
    .filter((exercise): exercise is ExerciseSeed => Boolean(exercise))
    .slice(0, 12)
    .map((exercise) => ({
      id: exercise.id,
      title: exercise.title,
      sectionId: exercise.sectionId,
      sectionTitle: sectionTitles.get(exercise.sectionId) ?? exercise.sectionId,
      explanationDe: exercise.explanationDe,
      type: exercise.type,
    }));

  const vocabItems = sortVocab(bundle)
    .filter((item) => {
      const status = state.vocabStatuses[item.id] ?? 'new';
      return status === 'new' || status === 'review';
    })
    .sort((left, right) => {
      const leftStatus = state.vocabStatuses[left.id] ?? 'new';
      const rightStatus = state.vocabStatuses[right.id] ?? 'new';
      const leftWeight = leftStatus === 'review' ? 0 : 1;
      const rightWeight = rightStatus === 'review' ? 0 : 1;
      return leftWeight - rightWeight || left.term.localeCompare(right.term);
    })
    .slice(0, 12)
    .map((item) => ({
      id: item.id,
      term: item.term,
      translationDe: item.translationDe,
      exampleEn: item.exampleEn,
      status: state.vocabStatuses[item.id] ?? 'new',
    }));

  return { exercises, vocabItems };
}

export function getReviewSnapshotFromBundles(bundles: UnitSeedBundle[], state: WebProgressState): ReviewSnapshot {
  return bundles.reduce<ReviewSnapshot>(
    (snapshot, bundle) => {
      const next = getReviewSnapshotFromBundle(bundle, state);
      return {
        exercises: [...snapshot.exercises, ...next.exercises].slice(0, 12),
        vocabItems: [...snapshot.vocabItems, ...next.vocabItems].slice(0, 12),
      };
    },
    { exercises: [], vocabItems: [] }
  );
}

export function submitExerciseInWebState(
  state: WebProgressState,
  exercise: ExerciseSeed,
  answer: unknown
): { result: 'correct' | 'incorrect'; nextState: WebProgressState } {
  const result = evaluateExercise(exercise, answer) === 'correct' ? 'correct' : 'incorrect';
  const persistedResult: ExerciseResult =
    state.exerciseResults[exercise.id] === 'correct' || result === 'correct' ? 'correct' : 'incorrect';
  const reviewExercises =
    persistedResult === 'correct'
      ? state.reviewExercises.filter((id) => id !== exercise.id)
      : exercise.reviewEligible
        ? ensureUnique([...state.reviewExercises, exercise.id])
        : state.reviewExercises;

  return {
    result,
    nextState: {
      ...state,
      exerciseResults: {
        ...state.exerciseResults,
        [exercise.id]: persistedResult,
      },
      reviewExercises,
    },
  };
}

export function updateVocabInWebState(state: WebProgressState, vocabId: string, status: VocabStatus): WebProgressState {
  const reviewVocab =
    status === 'learned'
      ? state.reviewVocab.filter((id) => id !== vocabId)
      : ensureUnique([...state.reviewVocab, vocabId]);

  return {
    ...state,
    vocabStatuses: {
      ...state.vocabStatuses,
      [vocabId]: status,
    },
    reviewVocab,
  };
}

export function markTrackCompletedInWebState(state: WebProgressState, trackId: string): WebProgressState {
  return {
    ...state,
    audioCompleted: ensureUnique([...state.audioCompleted, trackId]),
  };
}

export function setUnitQuizStatusInWebState(
  state: WebProgressState,
  unitId: string,
  status: 'passed' | 'skipped'
): WebProgressState {
  return {
    ...state,
    unitQuizResults: {
      ...state.unitQuizResults,
      [unitId]: {
        status,
        completedAt: new Date().toISOString(),
      },
    },
  };
}
