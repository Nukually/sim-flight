import type { AircraftConfig } from './AircraftConfig';
import type { PlayerInput } from '../input/InputTypes';
import type { AircraftDerivedState, ControlSurfaceState } from '../simulation/WorldState';
import { clamp, expoSigned, lerp, moveToward } from '../math/Scalar';
import type { Vec3 } from '../math/Vec3';

export class FlightControlSystem {
  update(
    input: PlayerInput,
    current: ControlSurfaceState,
    derived: AircraftDerivedState,
    angularVelocityBody: Vec3,
    dt: number,
    config: AircraftConfig,
  ): ControlSurfaceState {
    const airspeed = derived.airspeed;
    const speedT = clamp(
      (airspeed - config.control.highSpeedSensitivityStart) /
        (config.control.highSpeedSensitivityEnd - config.control.highSpeedSensitivityStart),
      0,
      1,
    );
    const speedSensitivity = lerp(1, config.control.minHighSpeedSensitivity, speedT);
    const trimOffset = input.trim * config.surfaces.trimGainRad;
    const shapedPitch = expoSigned(input.pitch, config.control.surfaceExpo);
    const shapedRoll = expoSigned(input.roll, config.control.surfaceExpo);
    const shapedYaw = expoSigned(input.yaw, config.control.surfaceExpo);
    const pitchAssist = Math.abs(input.pitch) < 0.05 && !derived.isGrounded ? 1 : 0.35;
    const rollAssist = Math.abs(input.roll) < 0.05 && !derived.isGrounded ? 1 : 0.25;
    const elevatorAssist =
      pitchAssist *
      clamp(
        -derived.pitch * config.control.pitchAttitudeAssist -
          angularVelocityBody.x * config.control.pitchDampingAssist,
        -0.45,
        0.45,
      ) *
      config.surfaces.elevatorMaxRad;
    const aileronAssist =
      rollAssist *
      clamp(
        -derived.roll * config.control.rollLevelAssist -
          angularVelocityBody.z * config.control.rollDampingAssist,
        -0.5,
        0.5,
      ) *
      config.surfaces.aileronMaxRad;
    const rudderAssist =
      clamp(
        shapedRoll * config.control.turnCoordinationAssist -
          derived.sideSlip * config.control.sideSlipAssist -
          angularVelocityBody.y * config.control.yawDamperAssist,
        -0.55,
        0.55,
      ) * config.surfaces.rudderMaxRad;
    const targetElevator = clamp(
      shapedPitch * speedSensitivity * config.surfaces.elevatorMaxRad + trimOffset + elevatorAssist,
      -config.surfaces.elevatorMaxRad,
      config.surfaces.elevatorMaxRad,
    );
    const targetAileron = clamp(
      shapedRoll * speedSensitivity * config.surfaces.aileronMaxRad + aileronAssist,
      -config.surfaces.aileronMaxRad,
      config.surfaces.aileronMaxRad,
    );
    const targetRudder = clamp(
      shapedYaw * config.surfaces.rudderMaxRad + rudderAssist,
      -config.surfaces.rudderMaxRad,
      config.surfaces.rudderMaxRad,
    );
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
