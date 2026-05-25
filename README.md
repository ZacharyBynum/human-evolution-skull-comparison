# Human Evolution

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
