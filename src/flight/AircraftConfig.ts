import type { DiagonalInertia } from '../math/Mat3';

export type AircraftConfig = {
  mass: number;
  wingArea: number;
  wingSpan: number;
  meanChord: number;
  inertia: DiagonalInertia;
  aero: {
    CL0: number;
    CLAlpha: number;
    CLMaxAfterStall: number;
    CLElevator: number;
    CLFlap: number;
    CD0: number;
    inducedDragK: number;
    CDFlap: number;
    CDGear: number;
    CDBrake: number;
    CYBeta: number;
    CYRudder: number;
    CYp: number;
    CYr: number;
    Cm0: number;
    CmAlpha: number;
    CmElevator: number;
    Cmq: number;
    ClBeta: number;
    ClAileron: number;
    ClRudder: number;
    Clp: number;
    CnBeta: number;
    CnRudder: number;
    CnAileron: number;
    Cnr: number;
  };
  engine: {
    engineCount: number;
    maxThrust: number;
    engineTimeConstant: number;
    maxEffectiveAirspeed: number;
    thrustLapseAtMaxSpeed: number;
    idleRpm: number;
    maxRpm: number;
  };
  surfaces: {
    elevatorMaxRad: number;
    aileronMaxRad: number;
    rudderMaxRad: number;
    flapMaxRad: number;
    elevatorRateRadPerSec: number;
    aileronRateRadPerSec: number;
    rudderRateRadPerSec: number;
    flapRateRadPerSec: number;
    trimGainRad: number;
  };
  stall: {
    alphaStallRad: number;
    alphaFullStallRad: number;
  };
  control: {
    keyboardPressRate: number;
    keyboardReturnRate: number;
    keyboardPitchLimit: number;
    keyboardRollLimit: number;
    keyboardYawLimit: number;
    gamepadDeadzone: number;
    gamepadExpo: number;
    surfaceExpo: number;
    highSpeedSensitivityStart: number;
    highSpeedSensitivityEnd: number;
    minHighSpeedSensitivity: number;
    pitchDampingAssist: number;
    pitchAttitudeAssist: number;
    rollDampingAssist: number;
    rollLevelAssist: number;
    yawDamperAssist: number;
    turnCoordinationAssist: number;
    sideSlipAssist: number;
  };
  autopilot: {
    engageAirspeed: number;
    engageAltitude: number;
    defaultClimbPitchRad: number;
    minPitchRad: number;
    maxPitchRad: number;
    maxRollRad: number;
    waypointRadius: number;
    headingKp: number;
    pitchAdjustRateRadPerSec: number;
    rollAdjustRateRadPerSec: number;
    rollReturnRateRadPerSec: number;
    pitchKp: number;
    pitchKd: number;
    rollKp: number;
    rollKd: number;
    maxPitchCommand: number;
    maxRollCommand: number;
  };
  ground: {
    wheelRadius: number;
    springK: number;
    damperC: number;
    rollingFriction: number;
    brakeFriction: number;
    sideFriction: number;
    crashVerticalSpeed: number;
  };
  environment: {
    windX: number;
    windY: number;
    windZ: number;
  };
};

export function cloneAircraftConfig(config: AircraftConfig): AircraftConfig {
  return structuredClone(config) as AircraftConfig;
}
