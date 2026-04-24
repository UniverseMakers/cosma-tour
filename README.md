# cosma-tour

Lightweight 360-degree COSMA room tour built with React, Vite, TypeScript, and Marzipano.

The app loads a YAML tour definition, displays panorama scenes, lets users move between scenes with navigation hotspots, and shows information cards from info hotspots.

## Run locally

Install dependencies:

```bash
npm install
```

Start the dev server:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

Build for GitHub Pages under `/tour/`:

```bash
npm run build -- --base=/tour/
```

## Main files

- `public/tours/room.yaml`: room/tour configuration
- `public/panoramas/example-room/`: example panorama images
- `src/components/PanoramaViewer.tsx`: Marzipano viewer
- `src/components/InfoOverlay.tsx`: info hotspot overlay
- `.github/workflows/deploy.yml`: deployment workflow

## Editing the tour

The active tour is defined in `public/tours/room.yaml`.

Each scene includes:

- `id`
- `title`
- `panorama`
- `position.x` and `position.y`
- optional `start`
- optional `initialView`
- optional `links`
- optional `info`

Example:

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
        rotation: 0
    info:
      - id: welcome
        title: Welcome
        body: This is the starting point for the room tour.
        yaw: 35
        pitch: 5
```

### Start scene

- The scene with `start: true` is used first.
- If no scene has `start: true`, the app uses the first scene.

### Navigation hotspots

- Defined in `links`
- Use `target`, `label`, `yaw`, and `pitch`
- Optional `rotation` sets the arrow icon direction in degrees
- Clicking one changes scene

### Info hotspots

- Defined in `info`
- Use `id`, `title`, `body`, `yaw`, and `pitch`
- Clicking one opens an overlay card

### Panorama paths

You can use either:

- relative public paths such as `/panoramas/example-room/start.jpg`
- remote absolute URLs such as `https://...`

Relative paths work locally and under the `/tour/` GitHub Pages subpath.

### Normalized positions

`position.x` and `position.y` are stored for future minimap use.

## Replacing panoramas

1. Put panorama images under `public/panoramas/<room-name>/`
2. Update `public/tours/room.yaml` to point at them
3. Refresh the app

## Deployment

Deployment is handled by `.github/workflows/deploy.yml`.

It builds this app and copies the built files into:

- `UniverseMakers/universemakers.github.io/tour`

This repository must have a GitHub Actions secret named:

- `PAGES_DEPLOY_TOKEN`

That token must have permission to push to `UniverseMakers/universemakers.github.io`.
