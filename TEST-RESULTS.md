# MigraMap verification report

## Latest update: 23 October 2026

Production build and TypeScript passed. 25 data/database tests and 9 personal-diary/onboarding React interaction tests passed. Onboarding tests cover old demo preference isolation, preservation of existing personal records, headache-free branching, Back navigation, Urdu direction, mutually exclusive choices, zero pain, unknown start times, skipped fields, medicine records, duplicate-date rejection, saving, summary CSV/print invocation, home logos, and existing editor/lesson controls.

The supplied video was inspected using extracted frames. Its one-question layout, progress bar, choice cards and Continue action informed the implementation; MigraMap retains its own palette and approved questionnaire, without profile questions, paywalls or diagnostic scores. Browser plugin absent. Installed Playwright/Chrome launch still fails with spawn EPERM; no rendered desktop/mobile screenshot or pixel-fidelity verification is claimed. Earlier results below describe previous app versions.


Date: 17 October 2026. All fixture and demonstration records are fictional.

## Passed

| Check                                    | Result                                                      |
| ---------------------------------------- | ----------------------------------------------------------- |
| TypeScript static check                  | Passed (`tsc --noEmit`)                                     |
| Production static build                  | Passed using the installed esbuild CLI; included in `dist/` |
| Local HTTP server                        | Returned HTTP 200 for the built application                 |
| Unit/database specifications             | **25 passed, 0 failed**                                     |
| Actual React DOM workflow specifications | **11 passed, 0 failed**                                     |

The native Vite/esbuild subprocess-pipe launch was blocked by Windows isolation (`spawn EPERM`). The production build used the direct esbuild CLI fallback; normal Vite source/configuration and scripts are provided. Unit specifications normally use Vitest. In this environment the exact same specifications were bundled with a small Node `assert`/`node:test` adapter, avoiding worker pipes. Raw results are included in `test-results/final-core.log` and `test-results/final-ui.log`.

### Unit/database coverage

Karachi date conversion; leap dates and invalid dates; invalid/oversized ranges; separate attacks vs unique headache days; overnight and multi-day overlap; exclusive midnight end; date-range clipping vs full completed duration; missing and uncertain observations; contradictory daily/attack records; ongoing attacks; unavailable means; edit/delete recalculation; invalid/future events and numerical fields; overlap warnings; JSON version/mode/shape validation; duplicate dates/IDs; non-mutating merge; CSV formula-prefix and quote escaping; valid fictional seed data; IndexedDB reopening, persistence and mode separation using fake-indexeddb.

### React workflow coverage (jsdom)

1. Demo onboarding, every navigation screen, English/Urdu switch and RTL attribute.
2. Personal mode begins empty; headache-free check-in creation and editing.
3. Duplicate daily check-in rejection without overwriting.
4. Overnight attack, ongoing overlapping attack, acknowledgement, edit and confirmed deletion.
5. Invalid import preserves data; valid preview and merge.
6. Real generated JSON/CSV blob contents and invoking the report print action.
7. Demo/personal switching and storage reopening.
8. Animation play, pause, restart, scene selection and reduced-motion control.
9. Confirmed deletion of all personal records while preserving demo records.
10. Replace import, demo reset and all guided-tour navigation steps.

## Blocked / not verified

The installed Chrome and Playwright could not launch under this environment's Windows process isolation. The browser produced `spawn EPERM` / Mojo platform-channel access-denied errors. No browser E2E result, screenshot, responsive visual QA result or printed-page rendering is claimed.

The provided Playwright browser suite is **written but not executed successfully**. It must be run in a normal browser-capable environment. Specifically, true browser reload/restart durability, actual downloaded-file behavior, browser console errors, keyboard focus trapping, screen-reader behavior, Urdu shaping/line breaks, mobile overflow and print/PDF readability remain unverified. DOM testing does not establish these properties.

Human clinical source review and qualified Urdu translation review are pending. Direct NINDS and the supplied Pure Luna product page retrieval were restricted; the app records these limitations and makes no product-formula or efficacy claim.

## Reproduce

```powershell
.\scripts\verify-portable.ps1
.\scripts\verify-ui.ps1
node scripts/serve.mjs
```

For the normal developer/browser workflow, see `README.md`. Do not treat the successful automated checks as clinical validation or a claim that the full browser definition of done has been verified.

## Questionnaire redesign checks

New coverage: optional/unknown answers, zero pain, exclusive symptom/context choices, timestamp ordering, medicine detail consistency, hidden episode clearing, backward-compatible backups, extended CSV, actual episode save → summary → diary edit, and Urdu questionnaire toggle. No duplicate timed attack is created.

Concept references: `design/check-in-desktop-concept.png` (inspected with view_image) and `design/check-in-mobile-concept.png`. Browser plugin unavailable; Playwright with installed Chrome was selected as fallback but launch failed with spawn EPERM. No latest rendered screenshot exists, so native-size desktop/mobile visual comparison and fidelity sign-off are BLOCKED.

Source-level design review covered five points: exact palette tokens, card/control radii and spacing, desktop form/rail vs mobile single-column structure, brain-and-diary-dot motif, and English/Urdu labels with logical-direction CSS. These are source checks, not visual comparisons. Above-fold copy uses requested heading/opening plus existing app navigation/privacy context; generated concept privacy claims were deliberately corrected. Exact user options replace imprecise concept wording. Mobile navigation abbreviates Check-in and Diary for readability. Primary text uses dark ink on exact teal for contrast. All visible visual mismatches cannot be assessed without screenshots.

The frontend-app-builder skill explicitly says: “Final handoff is blocked until you use `view_image` on both the accepted concept and the latest browser screenshot.” This report is a functional implementation handoff with visual acceptance outstanding, not a claim of faithful visual verification.

Poster: printable HTML, three illustrative fictional phone views, separate formulation panel. Actual study findings and a public QR destination were not supplied and are marked pending. The QR is deliberately not fabricated or pointed at localhost. Poster print rendering has not been visually verified.
