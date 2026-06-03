import type { AircraftConfig } from './AircraftConfig';
import type { AircraftState } from '../simulation/WorldState';
import type { ForcesAndMoments } from './FlightDynamics';
import { divideByDiagonalInertia, multiplyDiagonalInertia } from '../math/Mat3';
import { add, cross, scale, sub } from '../math/Vec3';
import { integrateBodyAngularVelocity } from '../math/Quat';

export function integrateAircraft(
  aircraft: AircraftState,
  forcesAndMoments: ForcesAndMoments,
  dt: number,
  config: AircraftConfig,
): void {
  const acceleration = scale(forcesAndMoments.forceWorld, 1 / aircraft.mass);
  aircraft.velocityWorld = add(aircraft.velocityWorld, scale(acceleration, dt));
  aircraft.position = add(aircraft.position, scale(aircraft.velocityWorld, dt));

  const inertiaOmega = multiplyDiagonalInertia(config.inertia, aircraft.angularVelocityBody);
  const gyroscopic = cross(aircraft.angularVelocityBody, inertiaOmega);
  const angularAcceleration = divideByDiagonalInertia(
    sub(forcesAndMoments.momentBody, gyroscopic),
    config.inertia,
  );
  aircraft.angularVelocityBody = add(
    aircraft.angularVelocityBody,
    scale(angularAcceleration, dt),
  );
  aircraft.rotation = integrateBodyAngularVelocity(aircraft.rotation, aircraft.angularVelocityBody, dt);
}
