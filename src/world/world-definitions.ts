import type { WorldDefinition, WorldId, WorldObject, WorldTheme } from '@/world/types';

const hubTheme: WorldTheme = {
  mapBackground: '#5FCB68',
  mapBorder: '#176E3B',
  tileBackground: '#91E86E',
  tileBorder: '#3D9D45',
  objectBackground: '#FFD232',
  objectBorder: '#A86B0C',
  nearbyBackground: '#FF8A2A',
  nearbyBorder: '#C94D13',
};

const unitTheme: WorldTheme = {
  mapBackground: '#60BDF2',
  mapBorder: '#126CA7',
  tileBackground: '#9FE3FF',
  tileBorder: '#328FC8',
  objectBackground: '#FFE06B',
  objectBorder: '#B9780B',
  nearbyBackground: '#FF8A2A',
  nearbyBorder: '#C94D13',
};

const sectionThemes = {
  gps: {
    mapBackground: '#35B9C8',
    mapBorder: '#0B6F80',
    tileBackground: '#84E8EF',
    tileBorder: '#2395A7',
    objectBackground: '#FFE06B',
    objectBorder: '#B9780B',
    nearbyBackground: '#FF8A2A',
    nearbyBorder: '#C94D13',
  },
  elevator: {
    mapBackground: '#859FFF',
    mapBorder: '#354FAE',
    tileBackground: '#C7D5FF',
    tileBorder: '#627CE0',
    objectBackground: '#FFB66B',
    objectBorder: '#B45C19',
    nearbyBackground: '#FFE06B',
    nearbyBorder: '#C94D13',
  },
  pump: {
    mapBackground: '#F1993F',
    mapBorder: '#9A4F16',
    tileBackground: '#FFD07D',
    tileBorder: '#C87525',
    objectBackground: '#66D17A',
    objectBorder: '#268947',
    nearbyBackground: '#36E090',
    nearbyBorder: '#14744B',
  },
  blueprint: {
    mapBackground: '#AA83FF',
    mapBorder: '#6140A8',
    tileBackground: '#D8C6FF',
    tileBorder: '#8464CF',
    objectBackground: '#9FE3FF',
    objectBorder: '#126CA7',
    nearbyBackground: '#FFE06B',
    nearbyBorder: '#C94D13',
  },
} satisfies Record<string, WorldTheme>;

export const worldDefinitions: Record<WorldId, WorldDefinition> = {
  hub: {
    id: 'hub',
    title: 'Engineering Hub',
    subtitle: 'Startwelt fuer Navigation, Vokabeln, Fortschritt und Units.',
    width: 9,
    height: 8,
    startPosition: { x: 4, y: 5 },
    theme: hubTheme,
    objects: [
      {
        id: 'hub-vocab-notebook',
        label: 'Vokabelheft',
        description: 'Oeffnet den Vokabelbereich.',
        kind: 'notebook',
        spriteKey: 'placeholder-notebook',
        token: 'VOC',
        position: { x: 2, y: 2 },
        blocksMovement: true,
        destination: { type: 'route', route: '/vocab', label: 'Vokabeln' },
      },
      {
        id: 'hub-unit-1-gate',
        label: 'Unit-1-Signalstation',
        description: 'Fuehrt in die eigene Unit-1-Welt.',
        kind: 'unit_gate',
        spriteKey: 'placeholder-signal-station',
        token: 'U1',
        position: { x: 6, y: 2 },
        blocksMovement: true,
        destination: { type: 'world', worldId: 'unit-1', label: 'Unit 1 betreten' },
      },
      {
        id: 'hub-progress-terminal',
        label: 'Fortschritts-Terminal',
        description: 'Oeffnet die Fortschrittsansicht.',
        kind: 'terminal',
        spriteKey: 'placeholder-progress-terminal',
        token: 'PROG',
        position: { x: 2, y: 5 },
        blocksMovement: true,
        destination: { type: 'route', route: '/progress', label: 'Fortschritt' },
      },
      {
        id: 'hub-toolbox',
        label: 'Werkzeugkiste',
        description: 'Oeffnet Setup und Reset.',
        kind: 'toolbox',
        spriteKey: 'placeholder-toolbox',
        token: 'SET',
        position: { x: 6, y: 5 },
        blocksMovement: true,
        destination: { type: 'route', route: '/settings', label: 'Setup' },
      },
    ],
  },
  'unit-1': {
    id: 'unit-1',
    title: 'Unit 1 Welt',
    subtitle: 'GPS, Funktionen, Prozesse und technische Vorteile.',
    width: 7,
    height: 7,
    startPosition: { x: 3, y: 5 },
    theme: unitTheme,
    objects: [
      {
        id: 'unit-1-exit',
        label: 'Rueckweg zum Hub',
        description: 'Fuehrt zurueck in die Startwelt.',
        kind: 'exit',
        spriteKey: 'placeholder-exit-pad',
        token: 'HUB',
        position: { x: 3, y: 6 },
        blocksMovement: false,
        destination: { type: 'world', worldId: 'hub', label: 'Zum Hub' },
      },
      {
        id: 'unit-1-section-a',
        label: '1A GPS-Empfaenger',
        description: 'Betritt die Abschnittswelt zu GPS-Funktionen und Anwendungen.',
        kind: 'section_marker',
        spriteKey: 'placeholder-gps-dish',
        token: '1A',
        position: { x: 1, y: 1 },
        blocksMovement: true,
        destination: { type: 'world', worldId: 'unit-1-section-a', label: '1A-Welt betreten' },
      },
      {
        id: 'unit-1-section-b',
        label: '1B Space-Elevator',
        description: 'Betritt die Abschnittswelt zu technischen Prozessen.',
        kind: 'section_marker',
        spriteKey: 'placeholder-elevator-tower',
        token: '1B',
        position: { x: 5, y: 1 },
        blocksMovement: true,
        destination: { type: 'world', worldId: 'unit-1-section-b', label: '1B-Welt betreten' },
      },
      {
        id: 'unit-1-section-c',
        label: '1C Pumpenstation',
        description: 'Betritt die Abschnittswelt zu technischen Vorteilen.',
        kind: 'section_marker',
        spriteKey: 'placeholder-pump-station',
        token: '1C',
        position: { x: 1, y: 3 },
        blocksMovement: true,
        destination: { type: 'world', worldId: 'unit-1-section-c', label: '1C-Welt betreten' },
      },
      {
        id: 'unit-1-section-d',
        label: '1D Blueprint-Board',
        description: 'Betritt die Abschnittswelt zu vereinfachten Erklaerungen.',
        kind: 'section_marker',
        spriteKey: 'placeholder-blueprint-board',
        token: '1D',
        position: { x: 5, y: 3 },
        blocksMovement: true,
        destination: { type: 'world', worldId: 'unit-1-section-d', label: '1D-Welt betreten' },
      },
      {
        id: 'unit-1-final-quiz',
        label: 'Abschlussquiz-Gate',
        description: 'Fragt spaeter alle Unit-1-Vokabeln ab.',
        kind: 'quiz_gate',
        spriteKey: 'placeholder-quiz-gate',
        token: 'QUIZ',
        position: { x: 3, y: 2 },
        blocksMovement: true,
        destination: {
          type: 'locked',
          label: 'Unit-1-Abschlussquiz',
          message: 'Das Abschlussquiz ist noch gesperrt. Erledige zuerst alle Unit-1-Uebungen.',
        },
      },
    ],
  },
  'unit-1-section-a': createSectionWorld({
    id: 'unit-1-section-a',
    sectionId: 'unit-1-functions',
    title: 'Unit 1A Welt',
    subtitle: 'GPS-Funktionen, Anwendungen und Nutzen.',
    theme: sectionThemes.gps,
    landmark: {
      grammar: 'Funktions-Konsole',
      vocab: 'GPS-Vokabelkiste',
      listening: 'Satelliten-Funkmast',
      exercise: 'Anwendungs-Labor',
    },
  }),
  'unit-1-section-b': createSectionWorld({
    id: 'unit-1-section-b',
    sectionId: 'unit-1-space-elevator',
    title: 'Unit 1B Welt',
    subtitle: 'Space Elevator, Prozesssprache und technische Ablaeufe.',
    theme: sectionThemes.elevator,
    landmark: {
      grammar: 'Prozess-Steuerpult',
      vocab: 'Payload-Vokabelbox',
      listening: 'Aufzug-Funkstation',
      exercise: 'Ablauf-Teststand',
    },
  }),
  'unit-1-section-c': createSectionWorld({
    id: 'unit-1-section-c',
    sectionId: 'unit-1-advantages',
    title: 'Unit 1C Welt',
    subtitle: 'Pumpenprofil, technische Vorteile und Performance.',
    theme: sectionThemes.pump,
    landmark: {
      grammar: 'Vorteils-Anzeige',
      vocab: 'Pumpen-Vokabelbox',
      listening: 'Messdaten-Empfaenger',
      exercise: 'Performance-Pruefstand',
    },
  }),
  'unit-1-section-d': createSectionWorld({
    id: 'unit-1-section-d',
    sectionId: 'unit-1-simplifying',
    title: 'Unit 1D Welt',
    subtitle: 'Blueprints, einfache Begriffe und klare Erklaerungen.',
    theme: sectionThemes.blueprint,
    landmark: {
      grammar: 'Erklaer-Board',
      vocab: 'Begriffs-Kartei',
      listening: 'Briefing-Station',
      exercise: 'Simple-Terms-Werkbank',
    },
  }),
};

function createSectionWorld({
  id,
  sectionId,
  title,
  subtitle,
  theme,
  landmark,
}: {
  id: Exclude<WorldId, 'hub' | 'unit-1'>;
  sectionId: string;
  title: string;
  subtitle: string;
  theme: WorldTheme;
  landmark: {
    grammar: string;
    vocab: string;
    listening: string;
    exercise: string;
  };
}): WorldDefinition {
  return {
    id,
    title,
    subtitle,
    width: 7,
    height: 6,
    startPosition: { x: 3, y: 4 },
    theme,
    objects: createSectionObjects(id, sectionId, landmark),
  };
}

function createSectionObjects(
  sectionWorldId: Exclude<WorldId, 'hub' | 'unit-1'>,
  sectionId: string,
  landmark: {
    grammar: string;
    vocab: string;
    listening: string;
    exercise: string;
  }
): WorldObject[] {
  const sectionLabel = sectionWorldId.replace('unit-1-section-', '1').toUpperCase();

  return [
    {
      id: `${sectionWorldId}-exit`,
      label: 'Rueckweg zur Unit-1-Welt',
      description: 'Fuehrt zurueck zur uebergeordneten Unit-Welt.',
      kind: 'exit',
      spriteKey: 'placeholder-section-exit',
      token: 'U1',
      position: { x: 3, y: 5 },
      blocksMovement: false,
      destination: { type: 'world', worldId: 'unit-1', label: 'Zur Unit-1-Welt' },
    },
    createLearningObject(sectionWorldId, sectionId, 'grammar', landmark.grammar, 'GRAM', { x: 1, y: 1 }),
    createLearningObject(sectionWorldId, sectionId, 'vocab', landmark.vocab, 'VOC', { x: 5, y: 1 }),
    createLearningObject(sectionWorldId, sectionId, 'listening', landmark.listening, 'AUD', { x: 1, y: 3 }),
    createLearningObject(sectionWorldId, sectionId, 'exercises', landmark.exercise, 'EX', { x: 5, y: 3 }),
    {
      id: `${sectionWorldId}-anchor`,
      label: `${sectionLabel} Orientierungspunkt`,
      description: 'Markiert die aktuelle Abschnittswelt und bleibt ein Platzhalter fuer spaetere Deko.',
      kind: 'section_marker',
      spriteKey: 'placeholder-section-anchor',
      token: sectionLabel,
      position: { x: 3, y: 2 },
      blocksMovement: true,
      destination: {
        type: 'locked',
        label: `${sectionLabel} Orientierung`,
        message: 'Dieser Abschnittsanker ist nur Orientierung. Nutze GRAM, VOC, AUD oder EX.',
      },
    },
  ];
}

function createLearningObject(
  sectionWorldId: Exclude<WorldId, 'hub' | 'unit-1'>,
  sectionId: string,
  type: 'grammar' | 'vocab' | 'listening' | 'exercises',
  label: string,
  token: string,
  position: { x: number; y: number }
): WorldObject {
  const kindByType = {
    grammar: 'grammar_station',
    vocab: 'vocab_station',
    listening: 'listening_station',
    exercises: 'exercise_station',
  } as const;

  return {
    id: `${sectionWorldId}-${type}`,
    label,
    description: `Oeffnet den Abschnitt mit Fokus auf ${token}.`,
    kind: kindByType[type],
    spriteKey: `placeholder-${type}-station`,
    token,
    position,
    blocksMovement: true,
    destination: { type: 'route', route: `/section/${sectionId}?focus=${type}`, label },
  };
}

export function getWorldDefinition(worldId: WorldId) {
  return worldDefinitions[worldId];
}
