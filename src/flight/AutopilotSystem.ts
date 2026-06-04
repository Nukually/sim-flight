import type { AircraftConfig } from './AircraftConfig';
import type { PlayerInput } from '../input/InputTypes';
import { clamp, moveToward, smoothstep } from '../math/Scalar';
import type { Vec3 } from '../math/Vec3';
import type { AutopilotState, AircraftDerivedState, NavigationState } from '../simulation/WorldState';

const normalPitchUpRatio = 0.42;
const maxPitchDownRatio = 0.16;
const climbRateFromPitch = 0.3;
const verticalSpeedGain = 0.12;

export class AutopilotSystem {
  update(
    input: PlayerInput,
    state: AutopilotState,
    navigation: NavigationState,
    position: Vec3,
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

    state.mode = navigation.waypoints.length > navigation.activeIndex ? 'nav' : 'climb';
    const pitchProtection = Math.max(
      smoothstep(degToRad(9), degToRad(13), derived.angleOfAttack),
      smoothstep(degToRad(10), degToRad(16), derived.pitch),
    );
    const pitchTargetInput = input.pitch > 0 ? input.pitch * (1 - pitchProtection) : input.pitch;
    state.targetPitch = clamp(
      state.targetPitch + pitchTargetInput * config.autopilot.pitchAdjustRateRadPerSec * dt,
      config.autopilot.minPitchRad,
      config.autopilot.maxPitchRad,
    );

    const activeWaypoint = navigation.waypoints[navigation.activeIndex];
    if (state.mode === 'nav' && activeWaypoint) {
      const dx = activeWaypoint.x - position.x;
      const dz = activeWaypoint.z - position.z;
      const distance = Math.hypot(dx, dz);
      if (distance <= config.autopilot.waypointRadius) {
        navigation.activeIndex += 1;
        navigation.reachedCount += 1;
        if (navigation.activeIndex >= navigation.waypoints.length) {
          state.mode = 'climb';
        }
      }
    }

    const waypoint = navigation.waypoints[navigation.activeIndex];
    if (state.mode === 'nav' && waypoint) {
      const targetHeading = Math.atan2(waypoint.x - position.x, waypoint.z - position.z);
      const headingError = shortestAngleRad(targetHeading, degToRad(derived.heading));
      state.targetHeading = targetHeading;
      state.targetRoll = clamp(
        headingError * config.autopilot.headingKp + input.roll * 0.3,
        -config.autopilot.maxRollRad,
        config.autopilot.maxRollRad,
      );
    } else if (Math.abs(input.roll) > 0.03) {
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
      (normalPitchUpRatio + (1 - normalPitchUpRatio) * descentT) *
      (1 - pitchProtection * 0.85);
    const pitchCommand = clamp(
      (state.targetPitch - derived.pitch) * config.autopilot.pitchKp +
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

function degToRad(value: number): number {
  return (value * Math.PI) / 180;
}

function shortestAngleRad(target: number, current: number): number {
  return ((((target - current) % (Math.PI * 2)) + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
}
