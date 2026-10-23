# MigraMap

**23 October update:** Personal diary only; Expo Demo controls are removed. First-time onboarding asks the existing headache questions one screen at a time, with Back, Continue, optional skips, review and save. It appears only until completed or skipped in this browser. Saving the first entry opens Dashboard directly. Later visits open the app without onboarding. There are no sign-in, sign-up, social login, or cloud requests. Clearing site storage or changing browser starts a fresh setup. Desktop and mobile logos return home. Existing personal records are preserved. Legacy demo storage is not merged into personal records.


**Track your days. Understand your patterns.**

A local-first React + TypeScript student migraine diary and research-expo application. The included `dist/` is built and ready to serve. It has no backend, login, analytics, live AI, or cloud synchronization. Nothing has been publicly deployed.

## Open the working application

With Node.js installed, double-click **Start-MigraMap.cmd** on Windows, the launcher opens **http://127.0.0.1:5173** automatically once ready. If the browser does not open, click that address yourself. Keep the terminal open while using the app; Ctrl+C stops the server.

Or, from this folder:

```sh
node scripts/serve.mjs
```

This serves the prebuilt app and requires **no dependency installation**. Do not open `dist/index.html` directly using `file://`; browser modules and reliable origin-based storage require HTTP. Always use the same host and port: `localhost` and `127.0.0.1` are different storage origins.

## Develop and build

Node 18.17+ was used for verification. A current supported Node LTS release is recommended for ongoing development.

```sh
npm ci
npm run dev
npm run build
npm test
```

`npm run dev` runs Vite; `npm run build` checks TypeScript and builds production assets. The source is in `src/`. The pinned lockfile is included.

On restricted Windows environments where native subprocess **pipes** are blocked, the following verified fallback invokes the installed esbuild executable directly, runs TypeScript, builds `dist/`, and runs the same unit specifications through Node's test runner:

```powershell
.\scripts\verify-portable.ps1
.\scripts\verify-ui.ps1
```

The UI fallback exercises the actual React application in jsdom. It does not substitute for browser rendering, accessibility, responsive-layout, print, or browser-restart testing. See `TEST-RESULTS.md` for exactly what passed and what remains unverified.

## Browser tests

In a normal environment with browser launching available:

```sh
npx playwright install chromium
```

Start the app in one terminal (`node scripts/serve.mjs`), then run `npm run test:e2e` in another. Optionally set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` to an installed Chrome executable instead of downloading Chromium. The browser suite covers reload persistence, navigation, personal/demo separation, import preview/merge/replace, deletion, downloads, animation controls, mobile overflow, Urdu RTL, screenshots, and page errors.

## Included workflows

- Welcome and separate Expo Demo / Personal Diary modes; personal mode begins empty and shows a storage explanation.
- Persistent IndexedDB diary with one daily check-in per local date and multiple attacks per date.
- Headache-free and uncertain days, optional sleep/meal/caffeine/exposure information, attack symptoms and medication documentation.
- Attack create/view/edit/delete, ongoing attacks, overlap warnings, overnight/multi-day accounting, future/date/range validation.
- Date-filtered dashboard, calendar/list diary with symptom filtering, chart alternatives, descriptive meal comparisons, calculation definitions.
- Clinician report, selected notes, CSV with spreadsheet-formula protection, full JSON backups, validated import preview and explicit merge/replace, confirmed deletion.
- English/Urdu UI and RTL; keyboard focus styles, native modal dialogs, reduced-motion styling and user-controlled educational animation with transcript.
- Separate SootheRoll formulation-research page and app-usability research page with printable blank observer checklist; no invented results.

## Demo walkthrough

Choose **Expo Demo → Guided tour**. The walkthrough prompts a fictional headache-free check-in, an attack, an edit, chart review, export, and deletion. **Reset demo** restores rolling fictional sample records. Sample dates use Asia/Karachi; personal mode uses the device timezone. No demo data can be imported into personal mode or vice versa.

## Data model and calculations

IndexedDB database `migramap-v1`, object store `datasets`, keys `demo` and `personal`. Transactions atomically replace the selected dataset after validation. UI updates occur after successful persistence. Preferences only (language, mode, welcome acknowledgement) are stored in localStorage. No health information goes in URLs or application logs.

Daily dates are local calendar dates. Attack timestamps are UTC instants. Attack overlap uses `[start, end)`; an attack ending exactly at midnight does not count the next day. Ongoing attacks extend to the current time and are excluded from completed-duration summaries. Date ranges clip day counts. Attack counts and intensity means include each distinct overlapping attack once. Completed durations are the **full** durations of overlapping completed attacks, not clipped fragments.

An attack overrides a contradictory headache-free daily check-in, with a visible conflict flag. Uncertain days count as recorded but not headache-free. Unrecorded days are not headache-free. Empty intensity/duration means are unavailable. Coverage counts can legitimately be zero; headache/headache-free totals are shown as unavailable when there are no recorded days. Meal comparisons exclude missing meal answers and uncertain headache status.

Import validation checks schema/version/mode, types, date validity, future times, numerical ranges, enums, duplicate daily dates and identifiers, text lengths and file size. Merge replaces matching daily dates/IDs and attack IDs with incoming values; replace replaces the current mode only. Overlapping attack times are not automatically deduplicated. Review warnings and conflicts after import.

## Project configuration

Change `rollOnName` in `src/config.ts` to rename SootheRoll, then rebuild. Its formulation study compares F1 fractionated coconut, F2 fractionated coconut/grapeseed, and F3 grapeseed carriers with a constant supervisor-approved essential-oil blend. No skin-use formula, concentrations, efficacy measurements or product recommendation are generated.

## Sources and review status

Source checks performed **16 October 2026**:

- [MedlinePlus — Migraine](https://medlineplus.gov/migraine.html): symptoms, variable possible triggers, aura and professional assessment.
- [MedlinePlus — Headache](https://medlineplus.gov/ency/article/003024.htm): urgent-help warning signs.
- [NCCIH — Peppermint Oil](https://www.nccih.nih.gov/health/peppermint-oil): essential-oil safety limitations, skin irritation/allergy.
- [NINDS — Migraine](https://www.ninds.nih.gov/health-information/disorders/migraine), [NIH migraine information](https://health.nih.gov/health-topics-a-z/migraine), and [NINDS headache booklet](https://www.ninds.nih.gov/sites/default/files/2025-05/headache-hope-through-research.pdf): genetics, nervous-system processes, trigeminal signalling and CGRP. NINDS direct retrieval was blocked; indexed official-source excerpts were available. Links are included for human review, not represented as a completed clinical review.
- The Pure Luna product URL supplied in the brief could not be independently retrieved. The app describes it only as a user-supplied category reference, gives no percentages or product claims, and includes no sales link.

Human clinical review and qualified Urdu medical-translation review remain pending. The application states this. The animation is a conceptual illustration, not an anatomical model or mechanism claim about essential oils.

## Limitations and privacy

This is a student prototype, **not clinically validated or production-ready for patient care**. It cannot diagnose, prescribe, verify triggers, assess medication overuse, or establish efficacy. Only fictional test and expo records were used while building it.

Browser storage can be cleared or evicted. Private browsing may discard it. There is no cross-device backup, application encryption or authentication. Export backups and keep downloaded health information private. This is not a secure clinical record system; no HIPAA/GDPR compliance claim is made. Use one editing tab at a time; concurrent-tab editing is not supported. The served static app can continue in an already-loaded tab without network access, but there is no service-worker offline-relaunch guarantee.

Clinical/cloud deployment would require a separate design and assessment covering authentication, authorization, secure backend storage, privacy, consent, institutional approval and clinical governance. Optional future AI would need explicit opt-in, consent, precise data-disclosure language and a secure backend with no frontend API keys. The non-AI summary must remain available.

## Verification still needed before an expo

Open the prebuilt app in your intended browser and inspect desktop/mobile layout, Urdu typography, keyboard/screen-reader behavior, downloads, browser restart persistence and print/PDF output. Run the included Playwright suite when browser launch is available. Verify English/Urdu clinical content with the supervisor. These checks were not falsely marked as complete in this restricted environment.

## My Headache Check-in redesign

The English/Urdu questionnaire supports headache-free days, unknown timestamps and optional pain/symptom/medicine answers. Daily context records observations, not confirmed causes. No diagnostic or total severity score is calculated. Check-in details appear in My Diary, My Summary, CSV and JSON backups. Daily peak pain ratings appear separately in Patterns; they do not create or double-count timed attacks. Legacy records remain compatible.

Research & Expo links to the printable `public/poster.html` (served at `/poster.html`). Usability results and a public QR destination remain pending researcher input. See `design/DESIGN-SPEC.md` and `TEST-RESULTS.md` for design references and the browser visual-verification limitation.
