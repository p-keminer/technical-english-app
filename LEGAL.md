# Rechtliches und Repository-Sicherheit

## Deutsche Version

Dieses Repository ist als persoenliche, lokale Lernapp-Codebasis gedacht.

### Was dieses Repository enthalten darf

- fuer diese App geschriebener Quellcode
- generische UI-, Routing-, Persistenz- und Uebungsrenderer-Logik
- Importskripte und Schemas fuer lokal vorbereitete private Inhalte
- Dokumentation dazu, wie das Repository sicher veroeffentlicht werden kann

### Was dieses Repository nicht enthalten darf

- Kursbuch-PDFs
- Audio-ZIP-Dateien, MP3-Dateien oder andere Original-Audiodateien
- extrahierte Buchseiten oder OCR-Dumps
- vollstaendige Transkripte oder Answer-Key-Daten
- generierte private Seed-Bundles aus geschuetzten Lernmaterialien
- Screenshots, die aus dem Buch abgeleitete Uebungstexte, Loesungen oder Transkripte offenlegen
- Verlagslogos, Cover-Art oder Marketingmaterialien
- lokale HTTPS-Zertifikate, private Keys oder `.mobileconfig`-Profile

### Private-Content-Regel

Alle echten Lerninhalte gehoeren unter `private-content/` und muessen lokal bleiben.

Das oeffentliche Repository soll als Codebasis nutzbar bleiben, darf aber das zugrunde liegende Kursmaterial nicht verbreiten. Wer dieses Repository klont, soll eigene rechtmaessig erworbene Materialien benoetigen, um eine vollstaendige lokale Lernversion zu bauen.

### Zugehoerigkeit

Dieses Projekt ist nicht mit einem Verlag, Autor, Markeninhaber oder Rechteinhaber fuer Audioinhalte verbunden, wird nicht von diesen unterstuetzt und nicht von diesen vertrieben.

Verweise auf Kursmaterialien dienen ausschliesslich der persoenlichen lokalen Einrichtung und der Kompatibilitaet mit Dateien, die die nutzende Person rechtmaessig besitzt.

### Vor der Veroeffentlichung

Fuehre diese Checks aus, bevor du committest, pushst oder einen Pull Request oeffnest:

```bash
npm run repo:safety
npm run content:check
npm run typecheck
npm run lint
```

Wenn `repo:safety` fehlschlaegt, nicht veroeffentlichen. Entferne oder ignoriere zuerst die gemeldeten Dateien.

### Praktischer Hinweis

Ein oeffentliches GitHub-Repository kann immer von anderen heruntergeladen werden. Das Sicherheitsziel ist daher nicht, den Code unzuganglich zu machen, sondern sicherzustellen, dass das herunterladbare Repository keine privaten oder urheberrechtlich geschuetzten Lernmaterialien enthaelt.

---

## English Version

This repository is intended as a personal, local learning-app codebase.

### What This Repository May Contain

- Source code written for this app
- Generic UI, routing, persistence and exercise-rendering logic
- Import scripts and schemas for locally prepared private content
- Documentation about how to keep the repository safe to publish

### What This Repository Must Not Contain

- Course-book PDFs
- Audio ZIPs, MP3s or other original audio files
- Extracted book pages or OCR dumps
- Full transcripts or answer-key data
- Generated private seed bundles derived from protected learning materials
- Screenshots that expose book-derived exercise text, solutions or transcripts
- Publisher logos, cover art or marketing assets
- Local HTTPS certificates, private keys or `.mobileconfig` profiles

### Private Content Rule

All real learning content belongs under `private-content/` and must stay local.

The public repository must remain usable as code, but it must not distribute the underlying course material. Anyone cloning this repository should need their own legally obtained materials to build a full local study version.

### Affiliation

This project is not affiliated with, endorsed by, or distributed by any textbook publisher, author, trademark owner or audio-content rightsholder.

Any course-material references are only for personal local setup and compatibility with files lawfully owned by the user.

### Before Publishing

Run these checks before committing, pushing or opening a pull request:

```bash
npm run repo:safety
npm run content:check
npm run typecheck
npm run lint
```

If `repo:safety` fails, do not publish. Remove or ignore the reported files first.

### Practical Reminder

A public GitHub repository can always be downloaded by others. The safety goal is therefore not to make the code impossible to download, but to ensure the downloadable repository contains no private or copyrighted learning materials.
