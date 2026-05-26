# Hominin Skulls

Static site for comparing hominin skull models, fossil specimens, and dates.

## Structure

- `public/` is the deployable site. Serve this directory, not the repository root. The root page contains the model workspace, comparison view, timeline, and catalog.
- `source-assets/` keeps raw STL files, HD/reference models, conversion scripts, and the original large archive out of the served site.
- `scripts/` contains repeatable asset build tasks for thumbnails and GLB optimization.

## Commands

```bash
npm install
npm run dev
npm run build
npm run serve
```

The local preview runs at `http://127.0.0.1:4173/`. Use `npm run dev`
while editing and `npm run serve` for a quick static preview.

`npm run build` regenerates derivatives when the optional local `source-assets/`
directory exists. The GitHub repo tracks the optimized static site in `public/`
and intentionally leaves raw source archives out of Git, so the build skips
asset regeneration gracefully when those raw inputs are absent.

## Release QA

Before publishing, run:

```bash
npm run build
node --check public/app.js
node --check public/data.js
node --check public/data/viewer-species.js
```

Then preview `public/` with `npm run serve` and check:

- single and compare model modes on desktop and mobile
- species drawer opens full height on mobile
- compare grid does not overflow the viewport
- timeline and catalog filters remain horizontally scrollable
- light/dark theme toggles smoothly
- no console errors or failed local assets

## Deployment

The site publishes to GitHub Pages from the `main` branch using
`.github/workflows/pages.yml`. The workflow uploads the tracked `public/`
directory as the Pages artifact.

Live site:

```text
https://zacharybynum.github.io/human-evolution-skull-comparison/
```
