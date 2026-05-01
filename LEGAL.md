# Legal And Repository Safety

This repository is intended as a personal, local learning-app codebase.

## What This Repository May Contain

- Source code written for this app
- Generic UI, routing, persistence and exercise-rendering logic
- Import scripts and schemas for locally prepared private content
- Documentation about how to keep the repository safe to publish

## What This Repository Must Not Contain

- Course-book PDFs
- Audio ZIPs, MP3s or other original audio files
- Extracted book pages or OCR dumps
- Full transcripts or answer-key data
- Generated private seed bundles derived from protected learning materials
- Screenshots that expose book-derived exercise text, solutions or transcripts
- Publisher logos, cover art or marketing assets

## Private Content Rule

All real learning content belongs under `private-content/` and must stay local.

The public repository must remain usable as code, but it must not distribute the underlying course material. Anyone cloning this repository should need their own legally obtained materials to build a full local study version.

## Affiliation

This project is not affiliated with, endorsed by, or distributed by any textbook publisher, author, trademark owner or audio-content rightsholder.

Any course-book references are only for personal local setup and compatibility with files lawfully owned by the user.

## Before Publishing

Run these checks before committing, pushing or opening a pull request:

```bash
npm run repo:safety
npm run content:check
npm run typecheck
npm run lint
```

If `repo:safety` fails, do not publish. Remove or ignore the reported files first.

## Practical Reminder

A public GitHub repository can always be downloaded by others. The safety goal is therefore not to make the code impossible to download, but to ensure the downloadable repository contains no private or copyrighted learning materials.
