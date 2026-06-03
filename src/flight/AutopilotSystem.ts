import type { AircraftConfig } from './AircraftConfig';
import type { PlayerInput } from '../input/InputTypes';
import { clamp, moveToward } from '../math/Scalar';
import type { Vec3 } from '../math/Vec3';
import type { AutopilotState, AircraftDerivedState } from '../simulation/WorldState';

const normalPitchUpRatio = 0.28;
const maxPitchDownRatio = 0.16;
const climbRateFromPitch = 0.3;
const verticalSpeedGain = 0.08;

export class AutopilotSystem {
  update(
    input: PlayerInput,
    state: AutopilotState,
    derived: AircraftDerivedState,
    angularVelocityBody: Vec3,
    dt: number,
    config: AircraftConfig,
  ): PlayerInput {
    if (!state.enabled) {
      state.active = false;
      state.mode = 'off';
      return input;
    }

    if (!state.active) {
      state.mode = 'armed';
      if (
        !derived.isGrounded &&
        derived.airspeed >= config.autopilot.engageAirspeed &&
        derived.altitude >= config.autopilot.engageAltitude
      ) {
        state.active = true;
        state.targetPitch = clamp(
          Math.min(
            Math.max(derived.pitch, config.autopilot.defaultClimbPitchRad),
            config.autopilot.defaultClimbPitchRad + 0.04,
          ),
          config.autopilot.minPitchRad,
          config.autopilot.maxPitchRad,
        );
        state.targetRoll = clamp(derived.roll, -config.autopilot.maxRollRad, config.autopilot.maxRollRad);
      } else {
        return input;
      }
    }

    state.mode = 'climb';
    state.targetPitch = clamp(
      state.targetPitch + input.pitch * config.autopilot.pitchAdjustRateRadPerSec * dt,
      config.autopilot.minPitchRad,
      config.autopilot.maxPitchRad,
    );

    if (Math.abs(input.roll) > 0.03) {
      state.targetRoll = clamp(
        state.targetRoll + input.roll * config.autopilot.rollAdjustRateRadPerSec * dt,
        -config.autopilot.maxRollRad,
        config.autopilot.maxRollRad,
      );
    } else {
      state.targetRoll = moveToward(
        state.targetRoll,
        0,
        config.autopilot.rollReturnRateRadPerSec * dt,
      );
    }

    const targetVerticalSpeed = clamp(
      derived.airspeed * Math.sin(state.targetPitch) * climbRateFromPitch,
      -1.2,
      1.8,
    );
    const descentT = clamp((-derived.verticalSpeed - 0.8) / 1.8, 0, 1);
    const maxPitchUpCommand = config.autopilot.maxPitchCommand *
      (normalPitchUpRatio + (1 - normalPitchUpRatio) * descentT);
    const pitchCommand = clamp(
      (state.targetPitch - derived.pitch) * config.autopilot.pitchKp -
        angularVelocityBody.x * config.autopilot.pitchKd +
        (targetVerticalSpeed - derived.verticalSpeed) * verticalSpeedGain,
      -config.autopilot.maxPitchCommand * maxPitchDownRatio,
      maxPitchUpCommand,
    );
    const rollCommand = clamp(
      (state.targetRoll - derived.roll) * config.autopilot.rollKp -
        angularVelocityBody.z * config.autopilot.rollKd,
      -config.autopilot.maxRollCommand,
      config.autopilot.maxRollCommand,
    );

    return {
      ...input,
      pitch: pitchCommand,
      roll: rollCommand,
    };
  }
}
