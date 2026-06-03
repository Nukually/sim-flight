import type { AircraftConfig } from '../flight/AircraftConfig';
import type { PlayerInput } from './InputTypes';
import { KeyboardInput } from './KeyboardInput';
import { MouseInput, type CameraOrbitDelta } from './MouseInput';
import { readGamepadInput } from './GamepadInput';

export class InputManager {
  readonly keyboard = new KeyboardInput();
  readonly mouse = new MouseInput();

  attach(canvas: HTMLCanvasElement): void {
    this.keyboard.attach(window);
    this.mouse.attach(canvas);
  }

  detach(canvas: HTMLCanvasElement): void {
    this.keyboard.detach(window);
    this.mouse.detach(canvas);
  }

  update(dt: number, config: AircraftConfig): PlayerInput {
    this.keyboard.update(dt, config);
    const gamepad = readGamepadInput(config);
    return {
      pitch: gamepad.pitch ?? this.keyboard.pitch,
      roll: gamepad.roll ?? this.keyboard.roll,
      yaw: gamepad.yaw ?? this.keyboard.yaw,
      throttle: gamepad.throttle ?? this.keyboard.throttle,
      brake: Math.max(gamepad.brake ?? 0, this.keyboard.brake),
      flap: this.keyboard.flap,
      trim: this.keyboard.trim,
    };
  }

  consumeOrbitDelta(): CameraOrbitDelta {
    return this.mouse.consumeOrbitDelta();
  }
}
