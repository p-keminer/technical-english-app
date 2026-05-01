import fs from 'fs';
import path from 'path';

import AdmZip from 'adm-zip';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';

import { downloadsPath, ensureDir, parseArgs, repoPath, writeJson } from './utils.mjs';

const args = parseArgs(process.argv.slice(2));

const pdfPath = path.resolve(args.pdf || process.env.CONTENT_PDF_PATH || downloadsPath('course-book.pdf'));
const audioZipPath = path.resolve(
  args.audio1 || process.env.CONTENT_AUDIO_ZIP_1_PATH || downloadsPath('course-audio-tracks-1.zip')
);

const qaDir = repoPath('private-content', 'qa');
const generatedAudioDir = repoPath('private-content', 'generated', 'audio');

ensureDir(qaDir);
ensureDir(generatedAudioDir);

if (!fs.existsSync(pdfPath)) {
  throw new Error(`PDF not found: ${pdfPath}`);
}

if (!fs.existsSync(audioZipPath)) {
  throw new Error(`Audio ZIP not found: ${audioZipPath}`);
}

const unitOnePageNumbers = [4, 5, 6, 7, 8, 9, 10, 11, 88, 98];
const unitOneTrackNumbers = ['1.1', '1.2', '1.3', '1.4', '1.5', '1.6', '1.7'];

async function extractPdfPages() {
  const document = await getDocument(pdfPath).promise;
  const pages = [];

  for (const pageNumber of unitOnePageNumbers) {
    const page = await document.getPage(pageNumber);
    const content = await page.getTextContent();
    const text = content.items
      .map((item) => ('str' in item ? item.str : ''))
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();

    pages.push({
      pageNumber,
      text,
    });
  }

  return pages;
}

function extractAudioTracks() {
  const zip = new AdmZip(audioZipPath);
  const writtenTracks = [];

  for (const entry of zip.getEntries()) {
    const matchedTrack = unitOneTrackNumbers.find((trackNumber) =>
      entry.entryName.includes(`Audio Track ${trackNumber}.mp3`)
    );
    if (!matchedTrack) {
      continue;
    }

    const fileName = `track-${matchedTrack.replace('.', '-')}.mp3`;
    const targetPath = path.join(generatedAudioDir, fileName);
    fs.writeFileSync(targetPath, entry.getData());
    writtenTracks.push({
      trackNumber: matchedTrack,
      fileName,
      targetPath,
    });
  }

  return writtenTracks.sort((a, b) => a.trackNumber.localeCompare(b.trackNumber, undefined, { numeric: true }));
}

function ensureManualTemplate() {
  const manualPath = path.join(qaDir, 'unit-1.manual.json');
  if (fs.existsSync(manualPath)) {
    return;
  }

  writeJson(manualPath, {
    note: 'Fuelle diese Datei mit bereinigten Unit-1-Inhalten und starte danach npm run content:build',
    sourceFiles: {
      pdfPath,
      audioZipPath,
    },
    unit: null,
    sections: [],
    vocabItems: [],
    exercises: [],
    listeningTracks: [],
    answerKey: [],
  });
}

const pages = await extractPdfPages();
const audioTracks = extractAudioTracks();

writeJson(path.join(qaDir, 'unit-1.candidates.json'), {
  generatedAt: new Date().toISOString(),
  sourceFiles: {
    pdfPath,
    audioZipPath,
  },
  pages,
  audioTracks,
});

ensureManualTemplate();

console.log(`Extracted ${pages.length} relevant PDF pages to private-content/qa/unit-1.candidates.json`);
console.log(`Extracted ${audioTracks.length} Unit 1 audio tracks to private-content/generated/audio`);
