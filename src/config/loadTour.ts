import { parse } from 'yaml';
import type {
  LoadedTourConfig,
  TourConfig,
  TourInfoHotspot,
  TourInitialView,
  TourLinkHotspot,
  TourScene,
} from '../types/tour';

/**
 * Narrow unknown YAML parser output into a plain object shape.
 */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Read a required non-empty string field from parsed YAML.
 */
function readString(value: unknown, fieldName: string) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`Expected ${fieldName} to be a non-empty string.`);
  }

  return value;
}

/**
 * Read a required numeric field from parsed YAML.
 */
function readNumber(value: unknown, fieldName: string) {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    throw new Error(`Expected ${fieldName} to be a number.`);
  }

  return value;
}

/**
 * Parse an optional initial view block for a scene.
 */
function readInitialView(value: unknown, sceneId: string): TourInitialView | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (!isRecord(value)) {
    throw new Error(`Expected initialView for scene ${sceneId} to be an object.`);
  }

  return {
    yaw: readNumber(value.yaw ?? 0, `initialView.yaw for scene ${sceneId}`),
    pitch: readNumber(value.pitch ?? 0, `initialView.pitch for scene ${sceneId}`),
    fov: readNumber(value.fov ?? 90, `initialView.fov for scene ${sceneId}`),
  };
}

/**
 * Parse scene-to-scene navigation hotspots.
 */
function readLinks(value: unknown, sceneId: string): TourLinkHotspot[] {
  if (value === undefined) {
    return [];
  }

  if (!Array.isArray(value)) {
    throw new Error(`Expected links for scene ${sceneId} to be an array.`);
  }

  return value.map((entry, index) => {
    if (!isRecord(entry)) {
      throw new Error(`Expected link ${index} for scene ${sceneId} to be an object.`);
    }

    return {
      target: readString(entry.target, `links[${index}].target for scene ${sceneId}`),
      label: typeof entry.label === 'string' ? entry.label : undefined,
      yaw: readNumber(entry.yaw, `links[${index}].yaw for scene ${sceneId}`),
      pitch: readNumber(entry.pitch, `links[${index}].pitch for scene ${sceneId}`),
    };
  });
}

/**
 * Parse informational hotspots.
 */
function readInfo(value: unknown, sceneId: string): TourInfoHotspot[] {
  if (value === undefined) {
    return [];
  }

  if (!Array.isArray(value)) {
    throw new Error(`Expected info for scene ${sceneId} to be an array.`);
  }

  return value.map((entry, index) => {
    if (!isRecord(entry)) {
      throw new Error(`Expected info hotspot ${index} for scene ${sceneId} to be an object.`);
    }

    return {
      id: readString(entry.id, `info[${index}].id for scene ${sceneId}`),
      title: readString(entry.title, `info[${index}].title for scene ${sceneId}`),
      body: readString(entry.body, `info[${index}].body for scene ${sceneId}`),
      yaw: readNumber(entry.yaw, `info[${index}].yaw for scene ${sceneId}`),
      pitch: readNumber(entry.pitch, `info[${index}].pitch for scene ${sceneId}`),
    };
  });
}

/**
 * Parse the array of scenes and validate per-scene structural constraints.
 */
function readScenes(value: unknown): TourScene[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error('Expected scenes to be a non-empty array.');
  }

  return value.map((entry, index) => {
    if (!isRecord(entry)) {
      throw new Error(`Expected scene ${index} to be an object.`);
    }

    const sceneId = readString(entry.id, `scenes[${index}].id`);
    const position = entry.position;

    if (!isRecord(position)) {
      throw new Error(`Expected position for scene ${sceneId} to be an object.`);
    }

    const x = readNumber(position.x, `position.x for scene ${sceneId}`);
    const y = readNumber(position.y, `position.y for scene ${sceneId}`);

    if (x < 0 || x > 1 || y < 0 || y > 1) {
      throw new Error(`Scene ${sceneId} must have normalized position x/y values in the range [0, 1].`);
    }

    return {
      id: sceneId,
      title: readString(entry.title, `title for scene ${sceneId}`),
      panorama: readString(entry.panorama, `panorama for scene ${sceneId}`),
      position: { x, y },
      start: typeof entry.start === 'boolean' ? entry.start : false,
      initialView: readInitialView(entry.initialView, sceneId),
      links: readLinks(entry.links, sceneId),
      info: readInfo(entry.info, sceneId),
    };
  });
}

/**
 * Validate cross-scene relationships once the YAML has been parsed into typed
 * objects.
 *
 * This catches problems that require knowledge of the whole tour, such as
 * duplicate ids, broken navigation targets, and ambiguous start-scene flags.
 */
function validateTour(config: TourConfig): LoadedTourConfig {
  const warnings: string[] = [];
  const sceneIds = new Set<string>();

  for (const scene of config.scenes) {
    if (sceneIds.has(scene.id)) {
      throw new Error(`Duplicate scene id found: ${scene.id}`);
    }

    sceneIds.add(scene.id);

    for (const link of scene.links) {
      if (!sceneIds.has(link.target) && !config.scenes.some((candidate) => candidate.id === link.target)) {
        throw new Error(`Scene ${scene.id} links to missing target scene id ${link.target}.`);
      }
    }
  }

  const startScenes = config.scenes.filter((scene) => scene.start);
  if (startScenes.length === 0) {
    warnings.push('No scene is marked with start: true. Falling back to the first scene.');
  }

  if (startScenes.length > 1) {
    warnings.push('Multiple scenes are marked with start: true. Using the first one.');
  }

  return {
    ...config,
    startSceneId: startScenes[0]?.id ?? config.scenes[0].id,
    warnings,
  };
}

/**
 * Fetch, parse, validate, and normalise the single room-tour YAML file.
 */
export async function loadTour(): Promise<LoadedTourConfig> {
  const response = await fetch(`${import.meta.env.BASE_URL}tours/room.yaml`);

  if (!response.ok) {
    throw new Error(`Failed to fetch room.yaml (${response.status} ${response.statusText}).`);
  }

  const parsed = parse(await response.text());

  if (!isRecord(parsed)) {
    throw new Error('The YAML tour config must be an object.');
  }

  const config: TourConfig = {
    id: readString(parsed.id, 'id'),
    title: readString(parsed.title, 'title'),
    scenes: readScenes(parsed.scenes),
  };

  return validateTour(config);
}
