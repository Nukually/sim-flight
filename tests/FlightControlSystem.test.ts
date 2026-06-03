import { describe, expect, it } from 'vitest';
import { defaultAircraftConfig, FIXED_DT } from '../src/app/Config';
import { FlightControlSystem } from '../src/flight/FlightControlSystem';
import { neutralInput } from '../src/input/InputTypes';
import { vec3 } from '../src/math/Vec3';
import type { AircraftDerivedState, ControlSurfaceState } from '../src/simulation/WorldState';

describe('keyboard-friendly flight control assist', () => {
  it('limits high-speed surface authority', () => {
    const controls = new FlightControlSystem();
    const lowSpeed = runControlFor(
      controls,
      { ...neutralInput, pitch: 0.5 },
      derived({ airspeed: 25 }),
    );
    const highSpeed = runControlFor(
      controls,
      { ...neutralInput, pitch: 0.5 },
      derived({ airspeed: 90 }),
    );

    expect(Math.abs(highSpeed.elevator)).toBeLessThan(Math.abs(lowSpeed.elevator));
  });

  it('adds wings-level aileron when the keyboard is released', () => {
    const controls = new FlightControlSystem();
    const response = controls.update(
      neutralInput,
      surfaces(),
      derived({ roll: 0.45, isGrounded: false }),
      vec3(),
      FIXED_DT,
      defaultAircraftConfig,
    );

    expect(response.aileron).toBeLessThan(0);
  });

  it('mixes rudder to help coordinate keyboard roll input', () => {
    const controls = new FlightControlSystem();
    const response = controls.update(
      { ...neutralInput, roll: 0.55 },
      surfaces(),
      derived({ airspeed: 45, isGrounded: false }),
      vec3(),
      FIXED_DT,
      defaultAircraftConfig,
    );

    expect(Math.abs(response.rudder)).toBeGreaterThan(0);
  });
});

function surfaces(): ControlSurfaceState {
  return {
    elevator: 0,
    aileron: 0,
    rudder: 0,
    flap: 0,
    trim: 0,
    brake: 0,
  };
}

function runControlFor(
  controls: FlightControlSystem,
  input: typeof neutralInput,
  state: AircraftDerivedState,
): ControlSurfaceState {
  let current = surfaces();
  for (let i = 0; i < 120; i += 1) {
    current = controls.update(input, current, state, vec3(), FIXED_DT, defaultAircraftConfig);
  }
  return current;
}

function derived(overrides: Partial<AircraftDerivedState>): AircraftDerivedState {
  return {
    airspeed: 45,
    groundSpeed: 45,
    angleOfAttack: 0,
    sideSlip: 0,
    altitude: 500,
    verticalSpeed: 0,
    loadFactor: 1,
    heading: 0,
    pitch: 0,
    roll: 0,
    isStalling: false,
    isGrounded: false,
    coefficients: {
      CL: 0,
      CD: 0,
      CY: 0,
      Cl: 0,
      Cm: 0,
      Cn: 0,
    },
    forces: {
      lift: 0,
      drag: 0,
      side: 0,
      thrust: 0,
      weight: 0,
    },
    moments: vec3(),
    ...overrides,
  };
}
