import type { AircraftConfig } from './AircraftConfig';
import { clamp } from '../math/Scalar';

export function computeTargetThrust(throttle: number, airspeed: number, config: AircraftConfig): number {
  const speedT = clamp(airspeed / config.engine.maxEffectiveAirspeed, 0, 1);
  const speedFactor = 1 - (1 - config.engine.thrustLapseAtMaxSpeed) * speedT;
  return config.engine.engineCount * config.engine.maxThrust * clamp(throttle, 0, 1) * speedFactor;
}

export function updateEngine(
  currentThrust: number,
  throttle: number,
  airspeed: number,
  dt: number,
  config: AircraftConfig,
): { thrust: number; rpm: number } {
  const targetThrust = computeTargetThrust(throttle, airspeed, config);
  const response = 1 - Math.exp(-dt / config.engine.engineTimeConstant);
  const thrust = currentThrust + (targetThrust - currentThrust) * response;
  const totalMaxThrust = config.engine.engineCount * config.engine.maxThrust;
  const spool = clamp(thrust / Math.max(1, totalMaxThrust), 0, 1);
  const rpm = config.engine.idleRpm + (config.engine.maxRpm - config.engine.idleRpm) * Math.max(throttle, spool);
  return { thrust, rpm };
}
