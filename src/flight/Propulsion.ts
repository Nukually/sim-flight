import type { AircraftConfig } from './AircraftConfig';
import { clamp } from '../math/Scalar';

export function computeTargetThrust(throttle: number, airspeed: number, config: AircraftConfig): number {
  const speedFactor = clamp(1 - airspeed / config.engine.maxEffectiveAirspeed, 0.15, 1);
  return config.engine.maxThrust * clamp(throttle, 0, 1) * speedFactor;
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
  const rpm = 800 + 1900 * throttle + 250 * (thrust / Math.max(1, config.engine.maxThrust));
  return { thrust, rpm };
}
