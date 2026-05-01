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

## Local Offline PWA Preview

For a free iPhone home-screen version, this project can create a local PWA export in `dist/`.

On Windows, double-click:

```text
start-pwa-server.cmd
```

The script:

- creates a local HTTPS certificate in `.local-https/`
- rebuilds the local private-content bundle from your local files
- exports the app for web
- adds PWA metadata, an app icon, an offline page and a service worker
- serves `dist/` over HTTPS on your local network, usually on port `8443`
- also serves the local root certificate over HTTP, usually on port `8091`

First-time iPhone setup:

1. Double-click `start-pwa-server.cmd`.
2. Open the printed `Certificate install URL` on the iPhone.
3. Download `local-root-ca.mobileconfig`.
4. Install the downloaded profile under `Settings -> General -> VPN & Device Management`.
5. Enable full trust under `Settings -> General -> About -> Certificate Trust Settings`.
6. Open the printed HTTPS `LAN URL for phone preview`.
7. In Safari, use `Share -> Add to Home Screen`.

If `Certificate Trust Settings` only shows trust-store versions, the profile was not installed successfully yet. Reopen the certificate install URL and make sure the `.mobileconfig` profile appears under `VPN & Device Management`.

For later updates, double-click `start-pwa-server.cmd` again, open the HTTPS PWA once on the iPhone and wait for the update to load.

Important iOS limitation: service-worker offline caching requires a secure context. `localhost` works on the same machine, but an iPhone needs HTTPS with a trusted local certificate. The generated `dist/` folder and `.local-https/` certificate files are ignored by Git and may contain private local learning content or machine-specific trust material.

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
