# DAYRIVO · Your day. Your rhythm.

A desktop-first weekly planner for freelancers and independent creatives. Make room for life, plan focused work, and compare your morning plan with what you actually finished.

> Private development repository. DAYRIVO is the new proposed product name. No public release or open-source license is declared.

## Run

The accompanying bilingual [landing page](landing/index.html) presents the app with real demo screenshots, interactive looks and the English promo film. Open it locally or serve this entire project and visit `/tool/landing/`. See [landing page notes](landing/README.md).

Open **[../index.html](../index.html)** in Microsoft Edge or Google Chrome. No build, server, account or package installation is required.

Your planning data stays in this browser's local storage. It is not stored in Git or synced between devices. Keep the same browser profile and file location; moving the app or switching to a hosted URL can expose a different storage area. Export a backup first, then restore it in the new location.

Use **Backup** to connect the project folder and write JSON backups into `tool/backup/` (relative to the project root). The browser asks for folder permission. Clearing browser data can erase your plan. Git is not a backup of your calendar.

## Features

- Five-day timeline with drag-and-drop, resizing and quarter-hour planning.
- Life and work categories, quick reminders, daily and weekly presets.
- Capture the morning plan; track completion against that fixed baseline.
- Choose a daily highlight, grow five day symbols and save a voluntary weekly reflection.
- Manual actual work time and hourly rates, separate from planned time.
- Week, month and insights views.
- Editable colors, saved looks, icons, standard titles and categories.
- German and English UI, responsive layout and reduced-motion support.

Optional [Clockodo customer/project selection](docs/CLOCKODO.md) starts directly from **Settings → Clockodo → Start Clockodo**. Run `clockodo/Direktstart-einrichten.cmd` once per Windows user on a new PC (Node.js 22+ required). Credentials stay in the local service; customer-job links are saved with the entry and remain readable offline. No times are sent to Clockodo. There is no hosted account service or automatic cloud backup.

## Development

Use Node.js 22 or newer for development checks. The app itself remains plain HTML, CSS and JavaScript.

Run development commands from `tool/` (or use `npm --prefix tool` at the root).

```sh
npm ci
npm test
```

Browser smoke test with Microsoft Edge installed on Windows:

```sh
npm run test:browser
```

For bundled Chromium, first run `npx playwright install chromium`, then set `PLAYWRIGHT_CHANNEL=chromium`. In PowerShell:

```powershell
$env:PLAYWRIGHT_CHANNEL = 'chromium'
npm run test:browser
```

Tests use an isolated browser profile and synthetic data. GitHub Actions runs model checks and the current UI smoke test on Chromium. Other scripts in `tests/` include historical checks against older UI structure; they are not part of the current CI gate.

## Project map

- `../index.html`: the stable app entry point, the only visible file at the project root.
- `js/`, `css/`: data models, UI scripts and styles.
- `AGENTS.md`: project instructions. Hidden Git metadata remains at the project root.
- `locales/`: English interface strings.
- `assets/`: local branding assets.
- `tests/`: model checks and browser scripts.
- `promo/`: trailer sources; generated media stays local.
- `landing/`: DE/EN product page and the selected media required to display it from a fresh clone.
- [User guide](docs/USER_GUIDE.md): detailed German workflow documentation.
- [GitHub preparation](docs/GITHUB.md): scope, checks and upload instructions.
- [Clockodo](docs/CLOCKODO.md): direct launch, customer/project selection and integration boundaries.

## Recent UI refinement

The selected-day ring is explicitly labelled; the weekly bar and locked baseline show daily progress and planning deviations. Shared titles have a compact, editable and hideable library. Visible day hours are configurable under Settings → Planning & data; entries outside extend the view and planning stays in 15-minute steps. Completion effects originate at the checkbox/click. See [the current UI pass](docs/UI_REFINEMENTS.md).

## Author and rights

Created by [Jona Fynn Schlegelmilch](https://www.linkedin.com/in/jonaschlegelmilch/).

Private project; no open-source license has been granted. Publication and licensing decisions remain separate.

- [Daily highlight and weekly rhythm](docs/RHYTHM.md): meaning, snapshots and validation.

## Public browser edition

Build and verify with npm run build:web and npm run test:web from tool/. Only the generated dist/public/index.html is published. See [public web delivery](docs/PUBLIC_WEB.md) for the deployment status and differences from the local version.
