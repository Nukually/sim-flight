import { describe, expect, it } from 'vitest';
import { defaultAircraftConfig, FIXED_DT } from '../src/app/Config';
import { neutralInput } from '../src/input/InputTypes';
import { degToRad, radToDeg } from '../src/math/Units';
import { quatFromForwardUp } from '../src/math/Quat';
import { vec3 } from '../src/math/Vec3';
import { World } from '../src/simulation/World';

describe('takeoff autopilot', () => {
  it('arms by default and engages after liftoff', () => {
    const world = createAirborneWorld();
    world.fixedUpdate({ ...neutralInput, throttle: 0.75 }, FIXED_DT);

    expect(world.state.autopilot.enabled).toBe(true);
    expect(world.state.autopilot.active).toBe(true);
    expect(world.state.autopilot.mode).toBe('climb');
  });

  it('turns pitch keys into a held target attitude after takeoff', () => {
    const world = createAirborneWorld();
    world.fixedUpdate({ ...neutralInput, throttle: 0.75 }, FIXED_DT);
    const targetAtEngage = world.state.autopilot.targetPitch;

    runFor(world, 2, () => ({ ...neutralInput, throttle: 0.75, pitch: 0.45 }));
    const targetAfterPull = world.state.autopilot.targetPitch;

    runFor(world, 3, () => ({ ...neutralInput, throttle: 0.75 }));

    expect(targetAfterPull).toBeGreaterThan(targetAtEngage + degToRad(2));
    expect(world.state.autopilot.targetPitch).toBeCloseTo(targetAfterPull, 6);
    expect(radToDeg(world.state.aircraft.derived.pitch)).toBeGreaterThan(2);
  });

  it('does not snap nose-down when pitch input is released', () => {
    const world = createAirborneWorld();
    runFor(world, 2.5, () => ({ ...neutralInput, throttle: 0.75, pitch: 0.5 }));
    const pitchBeforeRelease = world.state.aircraft.derived.pitch;

    runFor(world, 1.5, () => ({ ...neutralInput, throttle: 0.75 }));
    const pitchAfterRelease = world.state.aircraft.derived.pitch;

    expect(radToDeg(pitchAfterRelease - pitchBeforeRelease)).toBeGreaterThan(-4);
    expect(world.state.aircraft.derived.verticalSpeed).toBeGreaterThan(-2);
  });
});

function createAirborneWorld(): World {
  const world = new World(defaultAircraftConfig);
  world.state.aircraft.position = vec3(0, 35, -200);
  world.state.aircraft.rotation = quatFromForwardUp(vec3(0, 0.08, 1), vec3(0, 1, 0));
  world.state.aircraft.velocityWorld = vec3(0, 1.5, 35);
  world.state.aircraft.derived.isGrounded = false;
  world.state.aircraft.derived.altitude = 35;
  world.state.aircraft.derived.airspeed = 35;
  world.state.aircraft.derived.pitch = degToRad(4.5);
  return world;
}

function runFor(world: World, seconds: number, inputForTick: () => typeof neutralInput): void {
  const steps = Math.round(seconds / FIXED_DT);
  for (let i = 0; i < steps; i += 1) {
    world.fixedUpdate(inputForTick(), FIXED_DT);
  }
}
