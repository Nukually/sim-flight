import type { AircraftConfig } from './AircraftConfig';
import type { AircraftState, MissionMode, WorldState } from '../simulation/WorldState';
import { quatFromForwardUp, quatIdentity } from '../math/Quat';
import { vec3 } from '../math/Vec3';

export function createInitialAircraft(config: AircraftConfig, mode: MissionMode): AircraftState {
  if (mode === 'landing-challenge') {
    return {
      position: vec3(0, 300, -2200),
      rotation: quatFromForwardUp(vec3(0, -0.075, 1), vec3(0, 1, 0)),
      velocityWorld: vec3(0, -2, 42),
      angularVelocityBody: vec3(),
      mass: config.mass,
      controls: {
        elevator: 0,
        aileron: 0,
        rudder: 0,
        flap: 0.45,
        trim: -0.05,
        brake: 0,
      },
      engine: {
        throttle: 0.52,
        rpm: 1700,
        thrust: 0,
      },
      landingGear: {
        compression: 0,
        normalForce: 0,
        lastTouchdownVerticalSpeed: 0,
      },
      derived: createEmptyDerived(),
    };
  }

  return {
    position: vec3(0, config.ground.wheelRadius + 0.25, -700),
    rotation: quatIdentity(),
    velocityWorld: vec3(),
    angularVelocityBody: vec3(),
    mass: config.mass,
    controls: {
      elevator: 0,
      aileron: 0,
      rudder: 0,
      flap: 0,
      trim: 0,
      brake: 0,
    },
    engine: {
      throttle: 0,
      rpm: 800,
      thrust: 0,
    },
    landingGear: {
      compression: 0,
      normalForce: 0,
      lastTouchdownVerticalSpeed: 0,
    },
    derived: createEmptyDerived(),
  };
}

export function createWorldState(config: AircraftConfig, mode: MissionMode = 'free-flight'): WorldState {
  return {
    time: 0,
    tick: 0,
    seed: 1,
    aircraft: createInitialAircraft(config, mode),
    environment: {
      windWorld: vec3(),
      turbulence: vec3(),
      airDensity: 1.225,
      gravity: vec3(0, -9.81, 0),
    },
    ground: {
      height: 0,
      normal: vec3(0, 1, 0),
      friction: 0.8,
      runwayFriction: 0.95,
    },
    mission: {
      mode,
      score: 0,
      hasCrashed: false,
      message: mode === 'landing-challenge' ? 'Landing Challenge' : 'Free Flight',
      landing: {
        hasTouchedDown: false,
        verticalSpeedAtTouchdown: 0,
        centerlineError: 0,
        headingErrorDeg: 0,
        bankDegAtTouchdown: 0,
      },
    },
    autopilot: {
      enabled: true,
      active: false,
      targetPitch: config.autopilot.defaultClimbPitchRad,
      targetRoll: 0,
      mode: 'armed',
    },
  };
}

function createEmptyDerived() {
  return {
    airspeed: 0,
    groundSpeed: 0,
    angleOfAttack: 0,
    sideSlip: 0,
    altitude: 0,
    verticalSpeed: 0,
    loadFactor: 1,
    heading: 0,
    pitch: 0,
    roll: 0,
    isStalling: false,
    isGrounded: true,
    coefficients: {
      CL: 0,
      CD: 0,
      CY: 0,
      Cl: 0,
      Cm: 0,
      Cn: 0,
    },
    forces: {
      lift: 0,
      drag: 0,
      side: 0,
      thrust: 0,
      weight: 0,
    },
    moments: vec3(),
  };
}
