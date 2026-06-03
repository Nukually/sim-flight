import type { PlayerInput } from '../input/InputTypes';
import type { WorldState } from './WorldState';
import { cloneWorldState } from './WorldState';

export type RecordedInputFrame = {
  tick: number;
  pitch: number;
  roll: number;
  yaw: number;
  throttle: number;
  brake: number;
  flap: number;
  trim: number;
};

export type FlightRecording = {
  configVersion: string;
  physicsVersion: string;
  randomSeed: number;
  initialWorldState: WorldState;
  inputStream: RecordedInputFrame[];
};

export class Recorder {
  private recording: FlightRecording | null = null;

  start(initialWorldState: WorldState): void {
    this.recording = {
      configVersion: 'mvp-0.1',
      physicsVersion: 'simple-6dof-0.1',
      randomSeed: initialWorldState.seed,
      initialWorldState: cloneWorldState(initialWorldState),
      inputStream: [],
    };
  }

  record(tick: number, input: PlayerInput): void {
    if (!this.recording) {
      return;
    }

    this.recording.inputStream.push({
      tick,
      pitch: input.pitch,
      roll: input.roll,
      yaw: input.yaw,
      throttle: input.throttle,
      brake: input.brake,
      flap: input.flap,
      trim: input.trim,
    });
  }

  stop(): FlightRecording | null {
    const recording = this.recording;
    this.recording = null;
    return recording ? structuredClone(recording) : null;
  }

  isRecording(): boolean {
    return this.recording !== null;
  }
}
