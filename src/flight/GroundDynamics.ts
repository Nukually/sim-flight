import type { AircraftConfig } from './AircraftConfig';
import type { AircraftState, GroundState, MissionState } from '../simulation/WorldState';
import { getForward, getRight, quatFromForwardUp, toEuler } from '../math/Quat';
import { clamp } from '../math/Scalar';
import { add, dot, scale, sub, vec3 } from '../math/Vec3';
import { degToRad, radToDeg } from '../math/Units';

export function resolveGroundContact(
  aircraft: AircraftState,
  ground: GroundState,
  mission: MissionState,
  dt: number,
  config: AircraftConfig,
): void {
  const minY = ground.height + config.ground.wheelRadius + 0.25;
  const wasGrounded = aircraft.derived.isGrounded;
  aircraft.landingGear.normalForce = 0;
  aircraft.landingGear.compression = 0;

  if (aircraft.position.y > minY) {
    return;
  }

  const verticalSpeedBeforeContact = aircraft.velocityWorld.y;
  const compression = minY - aircraft.position.y;
  const springForce = config.ground.springK * compression;
  const dampingForce = Math.max(0, -config.ground.damperC * verticalSpeedBeforeContact);
  const normalForce = Math.max(0, springForce + dampingForce);
  aircraft.position.y = minY;
  aircraft.landingGear.compression = compression;
  aircraft.landingGear.normalForce = normalForce;
  aircraft.derived.isGrounded = true;

  if (aircraft.velocityWorld.y < 0) {
    aircraft.velocityWorld.y *= -0.06;
  }

  stabilizeGroundAttitude(aircraft);

  const forward = getForward(aircraft.rotation);
  const right = getRight(aircraft.rotation);
  const flatForward = normalizeFlat(vec3(forward.x, 0, forward.z));
  const flatRight = normalizeFlat(vec3(right.x, 0, right.z));
  const forwardSpeed = dot(aircraft.velocityWorld, flatForward);
  const sideSpeed = dot(aircraft.velocityWorld, flatRight);
  const rolling = config.ground.rollingFriction * Math.sign(forwardSpeed);
  const brake = config.ground.brakeFriction * aircraft.controls.brake * Math.sign(forwardSpeed);
  const side = config.ground.sideFriction * sideSpeed;
  const frictionAcceleration = add(
    scale(flatForward, -(rolling + brake) * 9.81),
    scale(flatRight, -side * dt * 4),
  );
  aircraft.velocityWorld = add(aircraft.velocityWorld, scale(frictionAcceleration, dt));

  if (Math.abs(forwardSpeed) < 0.25 && aircraft.controls.brake > 0.5) {
    aircraft.velocityWorld = sub(aircraft.velocityWorld, scale(flatForward, forwardSpeed));
  }

  if (!wasGrounded) {
    aircraft.landingGear.lastTouchdownVerticalSpeed = verticalSpeedBeforeContact;
    evaluateTouchdown(aircraft, mission, config);
  }
}

function stabilizeGroundAttitude(aircraft: AircraftState): void {
  const euler = toEuler(aircraft.rotation);
  const pitch = clamp(euler.pitch, degToRad(-4), degToRad(12));
  const yaw = euler.yaw;
  const forward = vec3(
    Math.sin(yaw) * Math.cos(pitch),
    Math.sin(pitch),
    Math.cos(yaw) * Math.cos(pitch),
  );

  aircraft.rotation = quatFromForwardUp(forward, vec3(0, 1, 0));
  aircraft.angularVelocityBody.x *= 0.68;
  aircraft.angularVelocityBody.y *= 0.94;
  aircraft.angularVelocityBody.z *= 0.55;
}

function evaluateTouchdown(
  aircraft: AircraftState,
  mission: MissionState,
  config: AircraftConfig,
): void {
  if (mission.hasCrashed) {
    return;
  }

  const euler = toEuler(aircraft.rotation);
  const headingErrorDeg = shortestAngleDeg(aircraft.derived.heading, 0);
  const centerlineError = aircraft.position.x;
  mission.landing = {
    hasTouchedDown: true,
    verticalSpeedAtTouchdown: aircraft.landingGear.lastTouchdownVerticalSpeed,
    centerlineError,
    headingErrorDeg,
    bankDegAtTouchdown: radToDeg(euler.roll),
  };

  if (
    Math.abs(aircraft.landingGear.lastTouchdownVerticalSpeed) > config.ground.crashVerticalSpeed ||
    Math.abs(radToDeg(euler.roll)) > 18 ||
    Math.abs(radToDeg(euler.pitch)) > 18 ||
    Math.abs(centerlineError) > 30
  ) {
    mission.hasCrashed = true;
    mission.score = 0;
    mission.message = 'Crash landing';
    return;
  }

  const score =
    100 -
    Math.abs(centerlineError) * 0.5 -
    Math.abs(aircraft.landingGear.lastTouchdownVerticalSpeed) * 8 -
    Math.abs(headingErrorDeg) * 2 -
    Math.abs(radToDeg(euler.roll)) * 3;
  mission.score = Math.max(0, Math.round(score));
  mission.message = mission.mode === 'landing-challenge' ? 'Touchdown scored' : 'Touchdown';
}

function normalizeFlat(value: { x: number; y: number; z: number }) {
  const len = Math.hypot(value.x, value.z);
  if (len < 1e-6) {
    return vec3(0, 0, 1);
  }
  return vec3(value.x / len, 0, value.z / len);
}

function shortestAngleDeg(a: number, b: number): number {
  return ((((a - b) % 360) + 540) % 360) - 180;
}
