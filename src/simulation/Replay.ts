import type { AircraftConfig } from '../flight/AircraftConfig';
import type { PlayerInput } from '../input/InputTypes';
import { neutralInput } from '../input/InputTypes';
import type { WorldState } from './WorldState';
import { cloneWorldState } from './WorldState';
import type { FlightRecording } from './Recorder';
import { World } from './World';

export class ReplayRunner {
  private frameIndex = 0;
  private world: World | null = null;
  private recording: FlightRecording | null = null;

  load(recording: FlightRecording, config: AircraftConfig): void {
    this.recording = structuredClone(recording) as FlightRecording;
    this.world = new World(config, cloneWorldState(recording.initialWorldState));
    this.frameIndex = 0;
  }

  step(dt: number): WorldState | null {
    if (!this.world || !this.recording) {
      return null;
    }

    const nextFrame = this.recording.inputStream[this.frameIndex];
    const input: PlayerInput = nextFrame ? { ...nextFrame } : neutralInput;
    this.world.fixedUpdate(input, dt);
    if (nextFrame && nextFrame.tick <= this.world.state.tick) {
      this.frameIndex += 1;
    }
    return this.world.state;
  }

  currentState(): WorldState | null {
    return this.world?.state ?? null;
  }

  isFinished(): boolean {
    if (!this.world || !this.recording) {
      return true;
    }
    return this.frameIndex >= this.recording.inputStream.length;
  }
}

export function runReplayToEnd(recording: FlightRecording, config: AircraftConfig, dt: number): WorldState {
  const replay = new ReplayRunner();
  replay.load(recording, config);
  let state: WorldState | null = null;
  while (!replay.isFinished()) {
    state = replay.step(dt);
  }
  return state ?? cloneWorldState(recording.initialWorldState);
}
