import { describe, expect, it } from 'vitest';
import { defaultAircraftConfig } from '../src/app/Config';
import { FIXED_DT } from '../src/app/Config';
import {
  computeAerodynamicCoefficients,
  computeLiftCoefficient,
} from '../src/flight/Aerodynamics';
import { computeTargetThrust } from '../src/flight/Propulsion';
import { neutralInput } from '../src/input/InputTypes';
import { degToRad } from '../src/math/Units';
import { World } from '../src/simulation/World';

describe('aerodynamics and propulsion', () => {
  it('keeps the lift curve from growing without bound after stall', () => {
    const linear = computeLiftCoefficient(degToRad(10), 0, 0, defaultAircraftConfig);
    const stalled = computeLiftCoefficient(degToRad(32), 0, 0, defaultAircraftConfig);

    expect(linear).toBeGreaterThan(0.8);
    expect(stalled).toBeLessThan(linear);
    expect(stalled).toBeLessThanOrEqual(defaultAircraftConfig.aero.CLMaxAfterStall + 0.001);
  });

  it('is symmetric without side slip or lateral controls', () => {
    const coefficients = computeAerodynamicCoefficients(
      {
        alpha: degToRad(4),
        beta: 0,
        airspeed: 45,
        p: 0,
        q: 0,
        r: 0,
        controls: {
          elevator: 0,
          aileron: 0,
          rudder: 0,
          flap: 0,
          trim: 0,
          brake: 0,
        },
      },
      defaultAircraftConfig,
    );

    expect(Math.abs(coefficients.CY)).toBeLessThan(1e-8);
    expect(Math.abs(coefficients.Cl)).toBeLessThan(1e-8);
    expect(Math.abs(coefficients.Cn)).toBeLessThan(1e-8);
  });

  it('raises thrust with throttle and loses propeller effectiveness at speed', () => {
    const idle = computeTargetThrust(0.1, 20, defaultAircraftConfig);
    const fullLowSpeed = computeTargetThrust(1, 20, defaultAircraftConfig);
    const fullHighSpeed = computeTargetThrust(1, 85, defaultAircraftConfig);

    expect(fullLowSpeed).toBeGreaterThan(idle * 5);
    expect(fullHighSpeed).toBeLessThan(fullLowSpeed);
  });

  it('scales lift and drag with approximately speed squared', () => {
    const low = sampleForcesAtSpeed(20);
    const high = sampleForcesAtSpeed(40);

    expect(high.lift / low.lift).toBeGreaterThan(3.4);
    expect(high.lift / low.lift).toBeLessThan(4.8);
    expect(high.drag / low.drag).toBeGreaterThan(3.2);
  });
});

function sampleForcesAtSpeed(speed: number) {
  const world = new World(defaultAircraftConfig);
  world.state.aircraft.position.y = 500;
  world.state.aircraft.velocityWorld.z = speed;
  world.state.aircraft.derived.isGrounded = false;
  world.fixedUpdate(neutralInput, FIXED_DT);
  return world.state.aircraft.derived.forces;
}
