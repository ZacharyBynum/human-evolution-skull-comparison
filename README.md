# Human Evolution

Static educational site centered on interactive hominin skull models, with a supporting fossil archive and timeline.

## Structure

- `public/` is the deployable site. Serve this directory, not the repository root. The model experience is the root page; the catalog and timeline live at `archive.html`.
- `source-assets/` keeps raw STL files, HD/reference models, conversion scripts, and the original large archive out of the served site.
- `scripts/` contains repeatable asset build tasks for thumbnails and GLB optimization.

## Commands

```bash
npm install
npm run build
npm run serve
```

The local preview runs at `http://127.0.0.1:4173/`.

`npm run build` expects the local `source-assets/` directory. The GitHub repo
tracks the optimized static site in `public/` and intentionally leaves raw
source archives out of Git.
