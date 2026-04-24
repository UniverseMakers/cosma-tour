# cosma-tour

React + Vite + TypeScript web app for a lightweight Google-Street-View-style COSMA room explorer built on Marzipano.

The app loads a YAML tour definition at runtime, displays 360-degree panorama scenes, and lets users click navigation hotspots to move between scenes or click info hotspots to open overlays.

## What This App Does

- Loads `public/tours/room.yaml` with `fetch` at runtime.
- Parses the YAML with the `yaml` package.
- Validates scene ids, duplicate ids, panorama paths, normalized coordinates, start scene warnings, and navigation targets.
- Uses Marzipano to render equirectangular panorama scenes.
- Uses YAML-authored hotspots for both navigation and information overlays.
- Supports panorama image paths that are either:
  - relative/app-public paths such as `/panoramas/example-room/start.jpg`
  - remote absolute URLs such as `https://...`
- Builds correctly for a GitHub Pages subpath at `/tour/`.

## Install

```bash
npm install
```

## Run Locally

```bash
npm run dev
```

Vite will start a local dev server, typically at `http://127.0.0.1:5173/` or `http://localhost:5173/`.

## Build

Standard production build:

```bash
npm run build
```

GitHub Pages build with the `/tour/` base path:

```bash
npm run build -- --base=/tour/
```

## Project Structure

- `src/main.tsx`: React entry point.
- `src/App.tsx`: app shell, loading/error states, overlay state.
- `src/components/PanoramaViewer.tsx`: Marzipano wrapper and hotspot creation.
- `src/components/InfoOverlay.tsx`: info card overlay.
- `src/config/loadTour.ts`: YAML fetch, parse, validation, and start-scene resolution.
- `src/types/tour.ts`: TypeScript types for the tour schema.
- `src/styles.css`: full-page viewer styling.
- `public/tours/room.yaml`: current room/tour definition.
- `public/panoramas/example-room/`: bundled example panorama images.
- `.github/workflows/deploy.yml`: GitHub Actions deployment workflow.

## Panorama Images

The current example room uses three test images in:

- `public/panoramas/example-room/start.jpg`
- `public/panoramas/example-room/scene-2.jpg`
- `public/panoramas/example-room/scene-3.jpg`

To replace or add panoramas:

1. Put new equirectangular panorama images under `public/panoramas/<room-name>/`.
2. Update `public/tours/room.yaml` to point scenes at those image paths.
3. Restart `npm run dev` if needed, or refresh the page.

## YAML Tour Configuration

The app currently expects one YAML file per room/tour. For now the active tour file is:

- `public/tours/room.yaml`

Each scene defines:

- `id`: unique scene id.
- `title`: display title.
- `panorama`: relative public path or absolute remote URL.
- `position.x` and `position.y`: normalized coordinates in `[0, 1]`.
- `start`: optional start flag.
- `initialView`: optional `yaw`, `pitch`, and `fov`.
- `links`: optional navigation hotspots.
- `info`: optional information hotspots.

Example shape:

```yaml
id: example-room
title: Example Room

scenes:
  - id: start
    title: Start
    start: true
    panorama: /panoramas/example-room/start.jpg
    position:
      x: 0.5
      y: 0.95
    initialView:
      yaw: 0
      pitch: 0
      fov: 90
    links:
      - target: scene-2
        label: Move forward
        yaw: 0
        pitch: -10
    info:
      - id: welcome
        title: Welcome
        body: This is the starting point for the room tour.
        yaw: 35
        pitch: 5
```

## How `start: true` Works

- The app looks for scenes marked with `start: true`.
- If exactly one scene is marked, that scene is used first.
- If none are marked, the app falls back to the first scene and shows a warning.
- If multiple scenes are marked, the app uses the first one and shows a warning.

## Navigation Hotspots

Navigation hotspots are authored manually in YAML with:

- `target`: destination scene id.
- `label`: accessible label/tool tip.
- `yaw`: hotspot horizontal angle in degrees.
- `pitch`: hotspot vertical angle in degrees.

Clicking a navigation hotspot switches the Marzipano scene.

## Info Hotspots

Info hotspots are also authored manually in YAML with:

- `id`
- `title`
- `body`
- `yaw`
- `pitch`

Clicking an info hotspot opens a React overlay card with the configured title and body text.

## Normalized Scene Positions

Each scene stores normalized `position.x` and `position.y` values in `[0, 1]`.

These are reserved for a future minimap and are not rendered yet.

## Relative and Remote Panorama Paths

Relative public paths work locally and under GitHub Pages subpath deployment because the app resolves them against Vite's configured base path.

Examples:

- `/panoramas/example-room/start.jpg`
- `panoramas/example-room/start.jpg`

Remote absolute URLs are passed through unchanged, so scenes can later point at Cloudflare R2, S3, or another CDN.

Example:

```yaml
panorama: https://example-bucket.examplecdn.com/cosma/start.jpg
```

## Deployment

Deployment is handled by `.github/workflows/deploy.yml`.

On pushes to `main` or manual workflow dispatch:

1. The app repo is checked out.
2. Dependencies are installed with `npm ci`.
3. The app is built with `npx vite build --base=/tour/`.
4. The Pages repo `UniverseMakers/universemakers.github.io` is checked out.
5. The generated `dist` output is copied into `pages-repo/tour`.
6. The workflow commits and pushes the updated `tour/` directory to the Pages repo.

The required repository secret is:

- `PAGES_DEPLOY_TOKEN`

That token must exist in this repository's GitHub Actions secrets and must have permission to push to `UniverseMakers/universemakers.github.io`.
