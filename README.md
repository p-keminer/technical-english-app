# Technical English Coach

Local `Expo + React Native` learning app for personal engineering-English study on iPhone and web preview.

## Repo Scope

This repository contains only:

- app source code, navigation and UI components
- local persistence, exercise rendering and progress logic
- private-content import/build scripts
- public documentation and safety checks

This repository intentionally does not contain:

- course-book PDFs
- audio ZIPs or MP3 files
- extracted book pages
- full transcripts
- answer-key content
- generated private seed bundles
- screenshots that reveal book-derived learning content

Private study data stays local under `private-content/` and is ignored by Git.

## Legal And Content Safety

This app is a personal study tool. It is not affiliated with, endorsed by, or distributed by any textbook publisher or rights holder.

To use real study content, you must provide your own legally obtained course materials locally. Do not commit or publish any original book, audio, transcript, answer-key, extracted, or generated private learning content.

See [LEGAL.md](./LEGAL.md) before publishing or sharing this repository.

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Place your legally obtained private learning files locally on your machine.

3. Build the local private-content module:

```bash
npm run content:build
```

4. Start the app:

```bash
npm run start
```

Without local private content, the repo remains a code shell and does not provide the copyrighted course material.

## Fresh Clone Behavior

If someone clones this repository from GitHub and starts it without private local data, the app opens with a setup notice instead of the real learning units.

The public clone contains:

- the app layout and navigation
- empty private-content placeholder wiring
- safety checks and import/build scripts

The public clone does not contain:

- real unit exercises
- vocabulary derived from the course book
- local audio
- transcripts
- answer keys

To turn the shell into a full personal study app, the user must add their own legally obtained materials locally and build `private-content/` on their own machine.

## Checks Before Any Commit Or Push

Run:

```bash
npm run repo:safety
npm run content:check
npm run typecheck
npm run lint
```

For route smoke testing while the Expo web server is running:

```bash
npm run qa:routes
```

## Architecture

- `src/app/`: Expo Router screens
- `src/components/`: reusable UI and exercise components
- `src/lib/`: persistence, evaluation and repository logic
- `src/providers/`: app state providers
- `src/types/`: content schema
- `scripts/content/`: private build and repo-safety scripts
- `docs/`: planning and verification documents

## Publication Rule

Never push until `npm run repo:safety` passes. A public clone must not include private learning content or enough extracted material to reconstruct the original course material.
