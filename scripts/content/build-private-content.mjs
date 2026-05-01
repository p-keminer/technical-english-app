import fs from 'fs';
import path from 'path';

import { z } from 'zod';

import { ensureDir, parseArgs, readJson, repoPath, toModuleLiteral } from './utils.mjs';

const args = parseArgs(process.argv.slice(2));

const qaPaths = args.input
  ? String(args.input)
      .split(',')
      .map((inputPath) => path.resolve(inputPath.trim()))
      .filter(Boolean)
  : fs
      .readdirSync(repoPath('private-content', 'qa'))
      .filter((fileName) => /^unit-\d+\.manual\.json$/.test(fileName))
      .sort((left, right) => left.localeCompare(right, undefined, { numeric: true }))
      .map((fileName) => repoPath('private-content', 'qa', fileName));
const outputDir = repoPath('private-content', 'generated');
const audioDir = path.join(outputDir, 'audio');
const outputModulePath = path.join(outputDir, 'index.ts');
const runtimeBridgePath = repoPath('src', 'private-content', 'runtime.ts');

const manualSchema = z.object({
  sourceFiles: z.object({
    pdfPath: z.string(),
    audioZipPath: z.string().optional(),
  }),
  unit: z.object({
    id: z.string(),
    title: z.string(),
    subtitle: z.string(),
    introDe: z.string(),
    focusAreas: z.array(z.string()),
  }),
  sections: z.array(z.any()),
  vocabItems: z.array(z.any()),
  exercises: z.array(z.any()),
  listeningTracks: z.array(
    z.object({
      id: z.string(),
      assetKey: z.string(),
    }).passthrough()
  ),
  answerKey: z.array(z.any()),
});

if (qaPaths.length === 0) {
  throw new Error('No manual QA files found in private-content/qa.');
}

for (const qaPath of qaPaths) {
  if (!fs.existsSync(qaPath)) {
    throw new Error(`Manual QA file not found: ${qaPath}`);
  }
}

const manualBundles = qaPaths.map((qaPath) => manualSchema.parse(readJson(qaPath)));
ensureDir(outputDir);

for (const manualData of manualBundles) {
  for (const track of manualData.listeningTracks) {
    const expectedPath = path.join(audioDir, `${track.assetKey}.mp3`);
    if (!fs.existsSync(expectedPath)) {
      throw new Error(`Missing audio file for ${track.assetKey}: ${expectedPath}`);
    }
  }
}

const allListeningTracks = manualBundles.flatMap((manualData) => manualData.listeningTracks);
const audioModuleEntries = allListeningTracks
  .map(
    (track) =>
      `  "${track.assetKey}": require("./audio/${track.assetKey}.mp3"),`
  )
  .join('\n');

const bundles = manualBundles.map((manualData) => ({
  unit: manualData.unit,
  sections: manualData.sections,
  vocabItems: manualData.vocabItems,
  exercises: manualData.exercises,
  listeningTracks: manualData.listeningTracks,
  answerKey: manualData.answerKey,
}));

const moduleSource = `export const hasPrivateContent = true;
export const privateContentMeta = {
  generatedAt: ${JSON.stringify(new Date().toISOString())},
  sourcePdf: ${JSON.stringify(manualBundles[0]?.sourceFiles.pdfPath ?? null)},
  notes: ${JSON.stringify(`Lokales privates Bundle fuer ${bundles.length} Unit(s)`)},
};
export const audioModules = {
${audioModuleEntries}
};
export const unitSeedBundles = ${toModuleLiteral(bundles)};
export const unitSeedBundle = unitSeedBundles[0] ?? null;
`;

fs.writeFileSync(outputModulePath, moduleSource, 'utf8');
fs.writeFileSync(
  runtimeBridgePath,
  `export {
  audioModules,
  hasPrivateContent,
  privateContentMeta,
  unitSeedBundle,
  unitSeedBundles,
} from '../../private-content/generated/index';
`,
  'utf8'
);

console.log(`Built local private content module at ${outputModulePath}`);
