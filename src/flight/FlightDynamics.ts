import type { AircraftConfig } from './AircraftConfig';
import type { AircraftState, EnvironmentState, GroundState } from '../simulation/WorldState';
import { computeAerodynamicCoefficients, isStalling } from './Aerodynamics';
import { updateEngine } from './Propulsion';
import { inverseRotateVecByQuat, rotateVecByQuat, toEuler } from '../math/Quat';
import { add, dot, length, scale, sub, type Vec3, vec3 } from '../math/Vec3';
import { radToDeg } from '../math/Units';

export type ForcesAndMoments = {
  forceWorld: Vec3;
  momentBody: Vec3;
};

export function computeForcesAndMoments(
  aircraft: AircraftState,
  environment: EnvironmentState,
  ground: GroundState,
  dt: number,
  config: AircraftConfig,
): ForcesAndMoments {
  const windWorld = add(environment.windWorld, environment.turbulence);
  const relativeWindWorld = sub(aircraft.velocityWorld, windWorld);
  const bodyVelocity = inverseRotateVecByQuat(aircraft.rotation, relativeWindWorld);
  const forwardSpeed = bodyVelocity.z;
  const sideSpeed = bodyVelocity.x;
  const verticalBodySpeed = -bodyVelocity.y;
  const airspeed = Math.max(0, length(bodyVelocity));
  const alpha =
    airspeed > 1 ? Math.atan2(verticalBodySpeed, Math.max(1e-4, Math.abs(forwardSpeed))) : 0;
  const beta = airspeed > 1 ? Math.asin(Math.max(-1, Math.min(1, sideSpeed / airspeed))) : 0;
  const qbar = 0.5 * environment.airDensity * airspeed * airspeed;
  const coefficients = computeAerodynamicCoefficients(
    {
      alpha,
      beta,
      airspeed,
      p: aircraft.angularVelocityBody.z,
      q: aircraft.angularVelocityBody.x,
      r: aircraft.angularVelocityBody.y,
      controls: aircraft.controls,
    },
    config,
  );
  const lift = qbar * config.wingArea * coefficients.CL;
  const drag = qbar * config.wingArea * coefficients.CD;
  const side = qbar * config.wingArea * coefficients.CY;
  const thrustState = updateEngine(
    aircraft.engine.thrust,
    aircraft.engine.throttle,
    airspeed,
    dt,
    config,
  );
  aircraft.engine.thrust = thrustState.thrust;
  aircraft.engine.rpm = thrustState.rpm;

  const forceBody = vec3(
    side,
    lift,
    thrustState.thrust - drag,
  );
  const forceWorld = add(rotateVecByQuat(aircraft.rotation, forceBody), scale(environment.gravity, aircraft.mass));
  const momentBody = vec3(
    qbar * config.wingArea * config.meanChord * coefficients.Cm,
    qbar * config.wingArea * config.wingSpan * coefficients.Cn,
    qbar * config.wingArea * config.wingSpan * coefficients.Cl,
  );
  const euler = toEuler(aircraft.rotation);
  const groundSpeed = Math.sqrt(
    aircraft.velocityWorld.x * aircraft.velocityWorld.x +
      aircraft.velocityWorld.z * aircraft.velocityWorld.z,
  );
  const weight = aircraft.mass * Math.abs(environment.gravity.y);
  aircraft.derived = {
    airspeed,
    groundSpeed,
    angleOfAttack: alpha,
    sideSlip: beta,
    altitude: Math.max(0, aircraft.position.y - ground.height),
    verticalSpeed: aircraft.velocityWorld.y,
    loadFactor: weight > 0 ? Math.max(0, lift / weight) : 0,
    heading: (radToDeg(euler.yaw) + 360) % 360,
    pitch: euler.pitch,
    roll: euler.roll,
    isStalling: isStalling(alpha, airspeed, config),
    isGrounded: aircraft.position.y <= ground.height + config.ground.wheelRadius + 0.25,
    coefficients,
    forces: {
      lift,
      drag,
      side,
      thrust: thrustState.thrust,
      weight,
    },
    moments: momentBody,
  };

  if (aircraft.derived.isStalling) {
    const rollShake = Math.sin((aircraft.derived.airspeed + aircraft.position.z) * 0.73) * 70;
    momentBody.z += rollShake;
  }

  if (forwardSpeed < -1 && aircraft.derived.isGrounded) {
    aircraft.velocityWorld = sub(aircraft.velocityWorld, scale(rotateVecByQuat(aircraft.rotation, vec3(0, 0, 1)), dot(aircraft.velocityWorld, rotateVecByQuat(aircraft.rotation, vec3(0, 0, 1))) * 0.08));
  }

  return { forceWorld, momentBody };
}
