/**
 * Future minimap anchor for a scene.
 *
 * These values are normalised into the range [0, 1] so they can be reused in a
 * later 2D map view without coupling the data model to any specific pixel size.
 */
export type TourPosition = {
  x: number;
  y: number;
};

/**
 * Optional starting camera orientation for a scene.
 *
 * All values are authored in degrees inside YAML because they are easier for a
 * human editor to tweak, and converted to radians only when passed to Marzipano.
 */
export type TourInitialView = {
  yaw: number;
  pitch: number;
  fov: number;
};

/**
 * Manually authored navigation hotspot linking one scene to another.
 */
export type TourLinkHotspot = {
  target: string;
  label?: string;
  yaw: number;
  pitch: number;
  rotation?: number;
};

/**
 * Informational hotspot rendered inside a panorama and expanded into a React
 * overlay when clicked.
 */
export type TourInfoHotspot = {
  id: string;
  title: string;
  body: string;
  yaw: number;
  pitch: number;
};

/**
 * Fully parsed scene definition loaded from YAML.
 */
export type TourScene = {
  id: string;
  title: string;
  panorama: string;
  position: TourPosition;
  start?: boolean;
  initialView?: TourInitialView;
  links: TourLinkHotspot[];
  info: TourInfoHotspot[];
};

/**
 * Base tour configuration shared by the YAML file and the runtime model.
 */
export type TourConfig = {
  id: string;
  title: string;
  scenes: TourScene[];
};

/**
 * Runtime form of the tour config after validation and start-scene resolution.
 */
export type LoadedTourConfig = TourConfig & {
  startSceneId: string;
  warnings: string[];
};
