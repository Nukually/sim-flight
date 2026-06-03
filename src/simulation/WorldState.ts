import type { Quat } from '../math/Quat';
import type { Vec3 } from '../math/Vec3';

export type ControlSurfaceState = {
  elevator: number;
  aileron: number;
  rudder: number;
  flap: number;
  trim: number;
  brake: number;
};

export type EngineState = {
  throttle: number;
  rpm: number;
  thrust: number;
};

export type LandingGearState = {
  compression: number;
  normalForce: number;
  lastTouchdownVerticalSpeed: number;
};

export type AircraftDerivedState = {
  airspeed: number;
  groundSpeed: number;
  angleOfAttack: number;
  sideSlip: number;
  altitude: number;
  verticalSpeed: number;
  loadFactor: number;
  heading: number;
  pitch: number;
  roll: number;
  isStalling: boolean;
  isGrounded: boolean;
  coefficients: {
    CL: number;
    CD: number;
    CY: number;
    Cl: number;
    Cm: number;
    Cn: number;
  };
  forces: {
    lift: number;
    drag: number;
    side: number;
    thrust: number;
    weight: number;
  };
  moments: Vec3;
};

export type AircraftState = {
  position: Vec3;
  rotation: Quat;
  velocityWorld: Vec3;
  angularVelocityBody: Vec3;
  mass: number;
  controls: ControlSurfaceState;
  engine: EngineState;
  landingGear: LandingGearState;
  derived: AircraftDerivedState;
};

export type EnvironmentState = {
  windWorld: Vec3;
  turbulence: Vec3;
  airDensity: number;
  gravity: Vec3;
};

export type GroundState = {
  height: number;
  normal: Vec3;
  friction: number;
  runwayFriction: number;
};

export type MissionMode = 'free-flight' | 'landing-challenge';

export type MissionState = {
  mode: MissionMode;
  score: number;
  hasCrashed: boolean;
  message: string;
  landing: {
    hasTouchedDown: boolean;
    verticalSpeedAtTouchdown: number;
    centerlineError: number;
    headingErrorDeg: number;
    bankDegAtTouchdown: number;
  };
};

export type AutopilotState = {
  enabled: boolean;
  active: boolean;
  targetPitch: number;
  targetRoll: number;
  mode: 'off' | 'armed' | 'climb';
};

export type WorldState = {
  time: number;
  tick: number;
  seed: number;
  aircraft: AircraftState;
  environment: EnvironmentState;
  ground: GroundState;
  mission: MissionState;
  autopilot: AutopilotState;
};

export function cloneWorldState(state: WorldState): WorldState {
  return structuredClone(state) as WorldState;
}
