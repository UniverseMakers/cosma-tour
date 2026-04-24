import { useEffect, useRef } from 'react';
import Marzipano from 'marzipano';
import type { LoadedTourConfig, TourInfoHotspot, TourLinkHotspot, TourScene } from '../types/tour';

type PanoramaViewerProps = {
  currentSceneId: string;
  tour: LoadedTourConfig;
  onNavigate: (sceneId: string) => void;
  onOpenInfo: (info: TourInfoHotspot) => void;
};

type MarzipanoSceneMap = Record<string, any>;

const DEFAULT_FOV = 90;
const DEFAULT_WIDTH = 4000;

function degreesToRadians(value: number) {
  return (value * Math.PI) / 180;
}

function radiansToDegrees(value: number) {
  return (value * 180) / Math.PI;
}

function resolvePanoramaUrl(path: string) {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const normalizedPath = path.startsWith('/') ? path.slice(1) : path;
  return new URL(normalizedPath, new URL(import.meta.env.BASE_URL, window.location.origin)).toString();
}

function getLinkDirectionDegrees(scene: TourScene, link: TourLinkHotspot, scenesById: Map<string, TourScene>) {
  const targetScene = scenesById.get(link.target);

  if (!targetScene) {
    return 0;
  }

  const deltaX = targetScene.position.x - scene.position.x;
  const deltaY = targetScene.position.y - scene.position.y;

  if (deltaX === 0 && deltaY === 0) {
    return 0;
  }

  return radiansToDegrees(Math.atan2(deltaY, deltaX));
}

function createNavigationHotspot(
  scene: TourScene,
  link: TourLinkHotspot,
  scenesById: Map<string, TourScene>,
  onNavigate: (sceneId: string) => void,
) {
  const button = document.createElement('button');
  const icon = document.createElement('span');
  const angle = getLinkDirectionDegrees(scene, link, scenesById);

  button.type = 'button';
  button.className = 'hotspot-button hotspot-nav';
  button.setAttribute('aria-label', link.label ?? `Go to ${link.target}`);
  button.title = link.label ?? `Go to ${link.target}`;

  icon.className = 'hotspot-nav-icon';
  icon.textContent = '➜';
  icon.style.transform = `rotate(${angle}deg)`;

  button.appendChild(icon);
  button.addEventListener('click', () => onNavigate(link.target));
  return button;
}

function createInfoHotspot(info: TourInfoHotspot, onOpenInfo: (item: TourInfoHotspot) => void) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'hotspot-button hotspot-info';
  button.setAttribute('aria-label', info.title);
  button.title = info.title;
  button.textContent = 'i';
  button.addEventListener('click', () => onOpenInfo(info));
  return button;
}

function buildScene(
  viewer: any,
  scene: TourScene,
  scenesById: Map<string, TourScene>,
  onNavigate: (sceneId: string) => void,
  onOpenInfo: (info: TourInfoHotspot) => void,
) {
  const source = Marzipano.ImageUrlSource.fromString(resolvePanoramaUrl(scene.panorama));
  const geometry = new Marzipano.EquirectGeometry([{ width: DEFAULT_WIDTH }]);
  const view = new Marzipano.RectilinearView({
    yaw: degreesToRadians(scene.initialView?.yaw ?? 0),
    pitch: degreesToRadians(scene.initialView?.pitch ?? 0),
    fov: degreesToRadians(scene.initialView?.fov ?? DEFAULT_FOV),
  });

  const marzipanoScene = viewer.createScene({
    source,
    geometry,
    view,
    pinFirstLevel: true,
  });

  scene.links.forEach((link) => {
    marzipanoScene.hotspotContainer().createHotspot(createNavigationHotspot(scene, link, scenesById, onNavigate), {
      yaw: degreesToRadians(link.yaw),
      pitch: degreesToRadians(link.pitch),
    });
  });

  scene.info.forEach((info) => {
    marzipanoScene.hotspotContainer().createHotspot(createInfoHotspot(info, onOpenInfo), {
      yaw: degreesToRadians(info.yaw),
      pitch: degreesToRadians(info.pitch),
    });
  });

  return marzipanoScene;
}

function PanoramaViewer({ currentSceneId, tour, onNavigate, onOpenInfo }: PanoramaViewerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const sceneMapRef = useRef<MarzipanoSceneMap>({});

  useEffect(() => {
    const container = containerRef.current;

    if (!container) {
      return;
    }

    container.innerHTML = '';
    const viewer = new Marzipano.Viewer(container, {
      controls: {
        mouseViewMode: 'drag',
      },
    });

    sceneMapRef.current = {};
    const scenesById = new Map(tour.scenes.map((scene) => [scene.id, scene]));

    for (const scene of tour.scenes) {
      sceneMapRef.current[scene.id] = buildScene(viewer, scene, scenesById, onNavigate, onOpenInfo);
    }

    sceneMapRef.current[currentSceneId]?.switchTo({ transitionDuration: 0 });

    return () => {
      sceneMapRef.current = {};
      container.innerHTML = '';
    };
  }, [onNavigate, onOpenInfo, tour]);

  useEffect(() => {
    const currentScene = sceneMapRef.current[currentSceneId];
    if (!currentScene) {
      return;
    }

    currentScene.switchTo({ transitionDuration: 500 });
  }, [currentSceneId]);

  return <div aria-label="360 degree panorama viewer" className="panorama-viewer" ref={containerRef} />;
}

export default PanoramaViewer;
