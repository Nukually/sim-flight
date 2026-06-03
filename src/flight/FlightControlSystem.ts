import type { AircraftConfig } from './AircraftConfig';
import type { PlayerInput } from '../input/InputTypes';
import type { ControlSurfaceState } from '../simulation/WorldState';
import { clamp, lerp, moveToward } from '../math/Scalar';

export class FlightControlSystem {
  update(
    input: PlayerInput,
    current: ControlSurfaceState,
    airspeed: number,
    dt: number,
    config: AircraftConfig,
  ): ControlSurfaceState {
    const speedT = clamp(
      (airspeed - config.control.highSpeedSensitivityStart) /
        (config.control.highSpeedSensitivityEnd - config.control.highSpeedSensitivityStart),
      0,
      1,
    );
    const speedSensitivity = lerp(1, config.control.minHighSpeedSensitivity, speedT);
    const trimOffset = input.trim * config.surfaces.trimGainRad;
    const targetElevator =
      clamp(input.pitch * speedSensitivity * config.surfaces.elevatorMaxRad + trimOffset, -1, 1);
    const targetAileron = input.roll * speedSensitivity * config.surfaces.aileronMaxRad;
    const targetRudder = input.yaw * config.surfaces.rudderMaxRad;
    const targetFlap = input.flap * config.surfaces.flapMaxRad;

    return {
      elevator: moveToward(
        current.elevator,
        targetElevator,
        config.surfaces.elevatorRateRadPerSec * dt,
      ),
      aileron: moveToward(
        current.aileron,
        targetAileron,
        config.surfaces.aileronRateRadPerSec * dt,
      ),
      rudder: moveToward(current.rudder, targetRudder, config.surfaces.rudderRateRadPerSec * dt),
      flap: moveToward(current.flap, targetFlap, config.surfaces.flapRateRadPerSec * dt),
      trim: input.trim,
      brake: clamp(input.brake, 0, 1),
    };
  }
}
