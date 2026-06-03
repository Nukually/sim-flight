import type { AircraftConfig } from '../flight/AircraftConfig';
import { cloneAircraftConfig } from '../flight/AircraftConfig';
import { createWorldState } from '../flight/Aircraft';
import { AutopilotSystem } from '../flight/AutopilotSystem';
import { FlightControlSystem } from '../flight/FlightControlSystem';
import { computeForcesAndMoments } from '../flight/FlightDynamics';
import { resolveGroundContact } from '../flight/GroundDynamics';
import { integrateAircraft } from '../flight/Integrator';
import type { PlayerInput } from '../input/InputTypes';
import { airDensityAtAltitude } from '../environment/Atmosphere';
import { updateWind } from '../environment/WindField';
import { lerpQuat } from '../math/Quat';
import { lerpVec3, vec3 } from '../math/Vec3';
import type { MissionMode, WorldState } from './WorldState';
import { cloneWorldState } from './WorldState';

export type WorldMetrics = {
  lastPhysicsCostMs: number;
  lastStepCount: number;
};

export class World {
  readonly controlSystem = new FlightControlSystem();
  readonly autopilotSystem = new AutopilotSystem();
  state: WorldState;
  previousState: WorldState;
  config: AircraftConfig;
  metrics: WorldMetrics = {
    lastPhysicsCostMs: 0,
    lastStepCount: 0,
  };

  constructor(config: AircraftConfig, initialState?: WorldState) {
    this.config = cloneAircraftConfig(config);
    this.state = initialState ? cloneWorldState(initialState) : createWorldState(this.config);
    this.previousState = cloneWorldState(this.state);
  }

  reset(mode: MissionMode = this.state.mission.mode): void {
    this.state = createWorldState(this.config, mode);
    this.previousState = cloneWorldState(this.state);
  }

  fixedUpdate(input: PlayerInput, dt: number): void {
    const start = performance.now();
    this.previousState = cloneWorldState(this.state);
    this.state.aircraft.engine.throttle = input.throttle;
    const controlInput = this.autopilotSystem.update(
      input,
      this.state.autopilot,
      this.state.aircraft.derived,
      this.state.aircraft.angularVelocityBody,
      dt,
      this.config,
    );
    this.state.aircraft.controls = this.controlSystem.update(
      controlInput,
      this.state.aircraft.controls,
      this.state.aircraft.derived,
      this.state.aircraft.angularVelocityBody,
      dt,
      this.config,
    );
    this.state.environment.airDensity = airDensityAtAltitude(this.state.aircraft.derived.altitude);
    updateWind(this.state.environment, this.state.time);
    const forcesAndMoments = computeForcesAndMoments(
      this.state.aircraft,
      this.state.environment,
      this.state.ground,
      dt,
      this.config,
    );
    integrateAircraft(this.state.aircraft, forcesAndMoments, dt, this.config);
    resolveGroundContact(
      this.state.aircraft,
      this.state.ground,
      this.state.mission,
      dt,
      this.config,
    );
    this.evaluateMission();
    this.state.time += dt;
    this.state.tick += 1;
    this.metrics.lastPhysicsCostMs = performance.now() - start;
  }

  snapshot(): WorldState {
    return cloneWorldState(this.state);
  }

  interpolatedSnapshot(alpha: number): WorldState {
    const t = Math.max(0, Math.min(1, alpha));
    const state = cloneWorldState(this.state);
    state.aircraft.position = lerpVec3(
      this.previousState.aircraft.position,
      this.state.aircraft.position,
      t,
    );
    state.aircraft.velocityWorld = lerpVec3(
      this.previousState.aircraft.velocityWorld,
      this.state.aircraft.velocityWorld,
      t,
    );
    state.aircraft.angularVelocityBody = lerpVec3(
      this.previousState.aircraft.angularVelocityBody,
      this.state.aircraft.angularVelocityBody,
      t,
    );
    state.aircraft.rotation = lerpQuat(
      this.previousState.aircraft.rotation,
      this.state.aircraft.rotation,
      t,
    );
    return state;
  }

  applyConfig(config: AircraftConfig): void {
    const oldMass = this.config.mass;
    this.config = cloneAircraftConfig(config);
    this.state.aircraft.mass = this.config.mass;
    this.state.environment.windWorld = vec3(
      this.config.environment.windX,
      this.config.environment.windY,
      this.config.environment.windZ,
    );
    if (oldMass !== this.config.mass) {
      this.state.aircraft.derived.loadFactor = 1;
    }
  }

  toggleAutopilot(): void {
    this.state.autopilot.enabled = !this.state.autopilot.enabled;
    if (!this.state.autopilot.enabled) {
      this.state.autopilot.active = false;
      this.state.autopilot.mode = 'off';
    } else {
      this.state.autopilot.mode = 'armed';
      this.state.autopilot.targetPitch = this.config.autopilot.defaultClimbPitchRad;
      this.state.autopilot.targetRoll = 0;
    }
  }

  private evaluateMission(): void {
    const aircraft = this.state.aircraft;
    if (this.state.mission.hasCrashed) {
      return;
    }

    if (Math.abs(aircraft.position.x) > 90 && aircraft.derived.isGrounded && aircraft.derived.groundSpeed > 18) {
      this.state.mission.hasCrashed = true;
      this.state.mission.message = 'Runway excursion';
      this.state.mission.score = 0;
      return;
    }

    if (this.state.mission.mode === 'landing-challenge' && aircraft.derived.isGrounded) {
      if (aircraft.derived.groundSpeed < 1.5 && this.state.mission.landing.hasTouchedDown) {
        this.state.mission.message = `Stopped - score ${this.state.mission.score}`;
      }
      return;
    }

    if (aircraft.derived.isStalling) {
      this.state.mission.message = 'STALL';
    } else if (aircraft.derived.isGrounded && aircraft.derived.groundSpeed < 1) {
      this.state.mission.message = 'Ready';
    } else if (aircraft.derived.isGrounded) {
      this.state.mission.message = 'Ground roll';
    } else {
      this.state.mission.message = 'Airborne';
    }
  }
}
