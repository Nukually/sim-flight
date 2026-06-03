import { describe, expect, it } from 'vitest';
import { defaultAircraftConfig, FIXED_DT } from '../src/app/Config';
import type { PlayerInput } from '../src/input/InputTypes';
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

  it('turns pitch keys into a held climb target after takeoff', () => {
    const world = createAirborneWorld();
    world.fixedUpdate({ ...neutralInput, throttle: 0.75 }, FIXED_DT);
    const targetAtEngage = world.state.autopilot.targetPitch;

    runFor(world, 2, () => ({ ...neutralInput, throttle: 0.75, pitch: 0.45 }));
    const targetAfterPull = world.state.autopilot.targetPitch;

    runFor(world, 3, () => ({ ...neutralInput, throttle: 0.75 }));

    expect(targetAfterPull).toBeGreaterThan(targetAtEngage + degToRad(2));
    expect(world.state.autopilot.targetPitch).toBeCloseTo(targetAfterPull, 6);
    expect(world.state.aircraft.derived.verticalSpeed).toBeGreaterThan(-3.5);
  });

  it('does not snap nose-down when pitch input is released', () => {
    const world = createAirborneWorld();
    runFor(world, 2.5, () => ({ ...neutralInput, throttle: 0.75, pitch: 0.5 }));
    const pitchBeforeRelease = world.state.aircraft.derived.pitch;

    runFor(world, 1.5, () => ({ ...neutralInput, throttle: 0.75 }));
    const pitchAfterRelease = world.state.aircraft.derived.pitch;

    expect(radToDeg(pitchAfterRelease - pitchBeforeRelease)).toBeGreaterThan(-4);
    expect(world.state.aircraft.derived.verticalSpeed).toBeGreaterThan(-3);
  });

  it('settles into a steady climb instead of a pitch roller coaster', () => {
    const world = new World(defaultAircraftConfig);
    const settledPitchSamples: number[] = [];
    let wasAirborne = false;
    let firstAirborneTime = 0;
    let sawStall = false;

    runFor(world, 75, () => {
      const airspeed = world.state.aircraft.derived.airspeed;
      const rotate = airspeed > 31 && !wasAirborne;
      const flap = airspeed > 28 ? 0.18 : 0;
      if (!wasAirborne && !world.state.aircraft.derived.isGrounded && world.state.aircraft.derived.altitude > 2) {
        wasAirborne = true;
        firstAirborneTime = world.state.time;
      }
      if (wasAirborne && world.state.time > firstAirborneTime + 10) {
        settledPitchSamples.push(radToDeg(world.state.aircraft.derived.pitch));
      }
      sawStall ||= world.state.aircraft.derived.isStalling;
      return { ...neutralInput, throttle: 1, pitch: rotate ? 0.28 : 0, flap, trim: 0.08 };
    });

    const pitchRange = Math.max(...settledPitchSamples) - Math.min(...settledPitchSamples);
    expect(wasAirborne).toBe(true);
    expect(world.state.mission.hasCrashed).toBe(false);
    expect(sawStall).toBe(false);
    expect(world.state.aircraft.derived.altitude).toBeGreaterThan(30);
    expect(pitchRange).toBeLessThan(6);
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

function runFor(world: World, seconds: number, inputForTick: () => PlayerInput): void {
  const steps = Math.round(seconds / FIXED_DT);
  for (let i = 0; i < steps; i += 1) {
    world.fixedUpdate(inputForTick(), FIXED_DT);
  }
}
