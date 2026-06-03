export type PlayerInput = {
  pitch: number;
  roll: number;
  yaw: number;
  throttle: number;
  brake: number;
  flap: number;
  trim: number;
};

export const neutralInput: PlayerInput = {
  pitch: 0,
  roll: 0,
  yaw: 0,
  throttle: 0,
  brake: 0,
  flap: 0,
  trim: 0,
};
