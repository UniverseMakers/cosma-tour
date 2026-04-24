export type TourPosition = {
  x: number;
  y: number;
};

export type TourInitialView = {
  yaw: number;
  pitch: number;
  fov: number;
};

export type TourLinkHotspot = {
  target: string;
  label?: string;
  yaw: number;
  pitch: number;
};

export type TourInfoHotspot = {
  id: string;
  title: string;
  body: string;
  yaw: number;
  pitch: number;
};

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

export type TourConfig = {
  id: string;
  title: string;
  scenes: TourScene[];
};

export type LoadedTourConfig = TourConfig & {
  startSceneId: string;
  warnings: string[];
};
