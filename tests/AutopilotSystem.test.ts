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

    expect(targetAfterPull).toBeGreaterThan(targetAtEngage + degToRad(1.2));
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
    const finalPitchSamples: number[] = [];
    let wasAirborne = false;
    let firstAirborneTime = 0;
    let sawStall = false;

    runFor(world, 75, () => {
      const airspeed = world.state.aircraft.derived.airspeed;
      const rotate = airspeed > 55 && !wasAirborne;
      const flap = airspeed > 35 ? 0.35 : 0;
      if (!wasAirborne && !world.state.aircraft.derived.isGrounded && world.state.aircraft.derived.altitude > 4) {
        wasAirborne = true;
        firstAirborneTime = world.state.time;
      }
      if (wasAirborne && world.state.time > firstAirborneTime + 35) {
        finalPitchSamples.push(radToDeg(world.state.aircraft.derived.pitch));
      }
      sawStall ||= world.state.aircraft.derived.isStalling;
      return { ...neutralInput, throttle: 1, pitch: rotate ? 0.25 : 0, flap, trim: 0.08 };
    });

    const pitchRange = Math.max(...finalPitchSamples) - Math.min(...finalPitchSamples);
    expect(wasAirborne).toBe(true);
    expect(world.state.mission.hasCrashed).toBe(false);
    expect(sawStall).toBe(false);
    expect(world.state.aircraft.derived.altitude).toBeGreaterThan(300);
    expect(pitchRange).toBeLessThan(4);
  });

  it('tracks an active waypoint with bank command in nav mode', () => {
    const world = createAirborneWorld();
    world.setWaypoints([{ x: 1200, z: 1200, label: 'WP1' }]);
    world.fixedUpdate({ ...neutralInput, throttle: 0.75 }, FIXED_DT);

    expect(world.state.autopilot.mode).toBe('nav');
    expect(world.state.autopilot.targetRoll).toBeGreaterThan(degToRad(5));
    expect(world.state.navigation.activeIndex).toBe(0);
  });

  it('advances to the next waypoint after reaching the active one', () => {
    const world = createAirborneWorld();
    world.state.aircraft.position = vec3(95, 120, 0);
    world.setWaypoints([
      { x: 100, z: 0, label: 'WP1' },
      { x: -900, z: 800, label: 'WP2' },
    ]);

    world.fixedUpdate({ ...neutralInput, throttle: 0.75 }, FIXED_DT);

    expect(world.state.autopilot.mode).toBe('nav');
    expect(world.state.navigation.activeIndex).toBe(1);
    expect(world.state.navigation.reachedCount).toBe(1);
    expect(world.state.autopilot.targetRoll).toBeLessThan(-degToRad(5));
  });
});

function createAirborneWorld(): World {
  const world = new World(defaultAircraftConfig);
  world.state.aircraft.position = vec3(0, 120, -200);
  world.state.aircraft.rotation = quatFromForwardUp(vec3(0, 0.08, 1), vec3(0, 1, 0));
  world.state.aircraft.velocityWorld = vec3(0, 2, 62);
  world.state.aircraft.derived.isGrounded = false;
  world.state.aircraft.derived.altitude = 120;
  world.state.aircraft.derived.airspeed = 62;
  world.state.aircraft.derived.pitch = degToRad(4.5);
  return world;
}

function runFor(world: World, seconds: number, inputForTick: () => PlayerInput): void {
  const steps = Math.round(seconds / FIXED_DT);
  for (let i = 0; i < steps; i += 1) {
    world.fixedUpdate(inputForTick(), FIXED_DT);
  }
}
