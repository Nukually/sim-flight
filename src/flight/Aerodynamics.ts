import type { AircraftConfig } from './AircraftConfig';
import type { ControlSurfaceState } from '../simulation/WorldState';
import { clamp, lerp, smoothstep } from '../math/Scalar';

export type AeroInput = {
  alpha: number;
  beta: number;
  airspeed: number;
  p: number;
  q: number;
  r: number;
  controls: ControlSurfaceState;
};

export type AeroCoefficients = {
  CL: number;
  CD: number;
  CY: number;
  Cl: number;
  Cm: number;
  Cn: number;
};

export function computeAerodynamicCoefficients(
  input: AeroInput,
  config: AircraftConfig,
): AeroCoefficients {
  const { alpha, beta, airspeed, p, q, r, controls } = input;
  const v = Math.max(airspeed, 1);
  const b = config.wingSpan;
  const c = config.meanChord;
  const pHat = (p * b) / (2 * v);
  const qHat = (q * c) / (2 * v);
  const rHat = (r * b) / (2 * v);
  const liftEfficiency = computeControlEfficiency(alpha, config);
  const CL = computeLiftCoefficient(alpha, controls.elevator, controls.flap, config);
  const CD =
    config.aero.CD0 +
    config.aero.inducedDragK * CL * CL +
    config.aero.CDFlap * Math.abs(controls.flap) +
    config.aero.CDGear +
    config.aero.CDBrake * controls.brake +
    stallDragPenalty(alpha, config);
  const CY = config.aero.CYBeta * beta + config.aero.CYRudder * controls.rudder * liftEfficiency;
  const Cl =
    config.aero.ClBeta * beta +
    config.aero.ClAileron * controls.aileron * liftEfficiency +
    config.aero.Clp * pHat;
  const Cm =
    config.aero.Cm0 +
    config.aero.CmAlpha * alpha +
    config.aero.CmElevator * controls.elevator * liftEfficiency +
    config.aero.Cmq * qHat;
  const Cn =
    config.aero.CnBeta * beta +
    config.aero.CnRudder * controls.rudder * liftEfficiency +
    config.aero.Cnr * rHat;
  return { CL, CD, CY, Cl, Cm, Cn };
}

export function computeLiftCoefficient(
  alpha: number,
  elevator: number,
  flap: number,
  config: AircraftConfig,
): number {
  const linearCL =
    config.aero.CL0 +
    config.aero.CLAlpha * alpha +
    config.aero.CLElevator * elevator +
    config.aero.CLFlap * flap;
  const absAlpha = Math.abs(alpha);

  if (absAlpha < config.stall.alphaStallRad) {
    return clamp(linearCL, -config.aero.CLMaxAfterStall * 1.85, config.aero.CLMaxAfterStall * 1.85);
  }

  const t = smoothstep(config.stall.alphaStallRad, config.stall.alphaFullStallRad, absAlpha);
  const stalledCL = Math.sign(linearCL || alpha || 1) * config.aero.CLMaxAfterStall;
  return lerp(linearCL, stalledCL, t);
}

export function computeControlEfficiency(alpha: number, config: AircraftConfig): number {
  const t = smoothstep(config.stall.alphaStallRad, config.stall.alphaFullStallRad, Math.abs(alpha));
  return lerp(1, 0.38, t);
}

export function isStalling(alpha: number, airspeed: number, config: AircraftConfig): boolean {
  return Math.abs(alpha) >= config.stall.alphaStallRad && airspeed > 6;
}

function stallDragPenalty(alpha: number, config: AircraftConfig): number {
  const t = smoothstep(config.stall.alphaStallRad, config.stall.alphaFullStallRad, Math.abs(alpha));
  return 0.45 * t;
}
