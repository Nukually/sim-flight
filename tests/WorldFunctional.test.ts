import { describe, expect, it } from 'vitest';
import { defaultAircraftConfig, FIXED_DT } from '../src/app/Config';
import type { PlayerInput } from '../src/input/InputTypes';
import { neutralInput } from '../src/input/InputTypes';
import { quatIdentity } from '../src/math/Quat';
import { radToDeg } from '../src/math/Units';
import { vec3 } from '../src/math/Vec3';
import { World } from '../src/simulation/World';

describe('standard MVP flight cards', () => {
  it('rests on the runway without sinking through the ground', () => {
    const world = new World(defaultAircraftConfig);
    runFor(world, 2, () => neutralInput);

    expect(world.state.aircraft.position.y).toBeGreaterThan(0.5);
    expect(world.state.aircraft.derived.isGrounded).toBe(true);
  });

  it('accelerates down the runway at full throttle', () => {
    const world = new World(defaultAircraftConfig);
    const startZ = world.state.aircraft.position.z;
    runFor(world, 7, () => ({ ...neutralInput, throttle: 1 }));

    expect(world.state.aircraft.derived.groundSpeed).toBeGreaterThan(16);
    expect(world.state.aircraft.position.z).toBeGreaterThan(startZ + 60);
  });

  it('can rotate and lift off once it reaches flying speed', () => {
    const world = new World(defaultAircraftConfig);
    let wasAirborne = false;

    runFor(world, 45, () => {
      const airspeed = world.state.aircraft.derived.airspeed;
      const pitch = airspeed > 55 ? 0.25 : 0;
      const flap = airspeed > 35 ? 0.35 : 0;
      if (!world.state.aircraft.derived.isGrounded && world.state.aircraft.derived.altitude > 2) {
        wasAirborne = true;
      }
      return { ...neutralInput, throttle: 1, pitch, flap, trim: 0.08 };
    });

    expect(wasAirborne).toBe(true);
    expect(world.state.mission.hasCrashed).toBe(false);
  });

  it('enters a stall under low-speed high-alpha pull and can recover after unloading', () => {
    const world = new World(defaultAircraftConfig);
    world.toggleAutopilot();
    world.state.aircraft.position.y = 650;
    world.state.aircraft.velocityWorld.z = 32;
    world.state.aircraft.derived.isGrounded = false;
    let sawStall = false;

    runFor(world, 12, () => {
      sawStall ||= world.state.aircraft.derived.isStalling;
      return { ...neutralInput, throttle: 0.2, pitch: 1, trim: 0.2 };
    });

    expect(sawStall).toBe(true);

    runFor(world, 10, () => ({ ...neutralInput, throttle: 1, pitch: -0.45, trim: -0.1 }));

    expect(world.state.aircraft.derived.airspeed).toBeGreaterThan(20);
    expect(world.state.aircraft.derived.isStalling).toBe(false);
  });

  it('responds to elevator, aileron, and rudder inputs in flight', () => {
    const pitchWorld = createAirborneWorld();
    runFor(pitchWorld, 3, () => ({ ...neutralInput, throttle: 0.6, pitch: 0.45 }));
    expect(radToDeg(pitchWorld.state.aircraft.derived.pitch)).toBeGreaterThan(3);

    const rollWorld = createAirborneWorld();
    runFor(rollWorld, 3, () => ({ ...neutralInput, throttle: 0.6, roll: 0.75 }));
    expect(Math.abs(radToDeg(rollWorld.state.aircraft.derived.roll))).toBeGreaterThan(5);

    const yawWorld = createAirborneWorld();
    runFor(yawWorld, 3, () => ({ ...neutralInput, throttle: 0.6, yaw: 0.75 }));
    expect(Math.abs(radToDeg(yawWorld.state.aircraft.derived.sideSlip))).toBeGreaterThan(1);
  });

  it('scores a normal touchdown and fails a hard landing', () => {
    const normal = createLandingWorld(-2);
    runFor(normal, 2, () => ({ ...neutralInput, throttle: 0.2, flap: 0.45, brake: 0.2 }));

    expect(normal.state.mission.landing.hasTouchedDown).toBe(true);
    expect(normal.state.mission.hasCrashed).toBe(false);
    expect(normal.state.mission.score).toBeGreaterThan(60);

    const hard = createLandingWorld(-8);
    runFor(hard, 1, () => ({ ...neutralInput, throttle: 0.2, flap: 0.45 }));

    expect(hard.state.mission.landing.hasTouchedDown).toBe(true);
    expect(hard.state.mission.hasCrashed).toBe(true);
    expect(hard.state.mission.score).toBe(0);
  });

  it('slows down with throttle closed and brakes applied on the runway', () => {
    const world = new World(defaultAircraftConfig);
    runFor(world, 8, () => ({ ...neutralInput, throttle: 1 }));
    const fast = world.state.aircraft.derived.groundSpeed;

    runFor(world, 10, () => ({ ...neutralInput, throttle: 0, brake: 1 }));

    expect(fast).toBeGreaterThan(18);
    expect(world.state.aircraft.derived.groundSpeed).toBeLessThan(fast * 0.45);
  });
});

function runFor(world: World, seconds: number, inputForTick: () => PlayerInput): void {
  const steps = Math.round(seconds / FIXED_DT);
  for (let i = 0; i < steps; i += 1) {
    world.fixedUpdate(inputForTick(), FIXED_DT);
  }
}

function createAirborneWorld(): World {
  const world = new World(defaultAircraftConfig);
  world.state.autopilot.enabled = false;
  world.state.autopilot.mode = 'off';
  world.state.aircraft.position = vec3(0, 500, -200);
  world.state.aircraft.rotation = quatIdentity();
  world.state.aircraft.velocityWorld = vec3(0, 0, 45);
  world.state.aircraft.derived.isGrounded = false;
  return world;
}

function createLandingWorld(verticalSpeed: number): World {
  const world = new World(defaultAircraftConfig);
  world.reset('landing-challenge');
  world.state.aircraft.position = vec3(0, 0.92, 20);
  world.state.aircraft.rotation = quatIdentity();
  world.state.aircraft.velocityWorld = vec3(0, verticalSpeed, 34);
  world.state.aircraft.angularVelocityBody = vec3();
  world.state.aircraft.derived.isGrounded = false;
  world.state.mission.landing.hasTouchedDown = false;
  world.state.mission.hasCrashed = false;
  return world;
}
