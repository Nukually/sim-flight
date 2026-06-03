import { describe, expect, it } from 'vitest';
import { defaultAircraftConfig, FIXED_DT } from '../src/app/Config';
import type { PlayerInput } from '../src/input/InputTypes';
import { Recorder } from '../src/simulation/Recorder';
import { runReplayToEnd } from '../src/simulation/Replay';
import { World } from '../src/simulation/World';

describe('input recording and replay', () => {
  it('reproduces the same state from the same initial state and input stream', () => {
    const world = new World(defaultAircraftConfig);
    const recorder = new Recorder();
    recorder.start(world.snapshot());

    for (let i = 0; i < 420; i += 1) {
      const input: PlayerInput = {
        throttle: i < 360 ? 1 : 0.65,
        pitch: i > 170 ? 0.28 : 0,
        roll: i > 260 ? 0.16 : 0,
        yaw: i > 260 ? 0.08 : 0,
        brake: 0,
        flap: i > 140 ? 0.2 : 0,
        trim: 0.05,
      };
      world.fixedUpdate(input, FIXED_DT);
      recorder.record(world.state.tick, input);
    }

    const recording = recorder.stop();
    expect(recording).not.toBeNull();
    const replayed = runReplayToEnd(recording!, defaultAircraftConfig, FIXED_DT);

    expect(replayed.tick).toBe(world.state.tick);
    expect(replayed.aircraft.position.x).toBeCloseTo(world.state.aircraft.position.x, 8);
    expect(replayed.aircraft.position.y).toBeCloseTo(world.state.aircraft.position.y, 8);
    expect(replayed.aircraft.position.z).toBeCloseTo(world.state.aircraft.position.z, 8);
    expect(replayed.aircraft.velocityWorld.z).toBeCloseTo(world.state.aircraft.velocityWorld.z, 8);
  });
});
