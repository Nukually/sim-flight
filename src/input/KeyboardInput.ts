import type { AircraftConfig } from '../flight/AircraftConfig';
import { clamp, moveToward } from '../math/Scalar';

export class KeyboardInput {
  private readonly pressed = new Set<string>();
  pitch = 0;
  roll = 0;
  yaw = 0;
  throttle = 0;
  brake = 0;
  flap = 0;
  trim = 0;

  attach(target: Window): void {
    target.addEventListener('keydown', this.onKeyDown);
    target.addEventListener('keyup', this.onKeyUp);
  }

  detach(target: Window): void {
    target.removeEventListener('keydown', this.onKeyDown);
    target.removeEventListener('keyup', this.onKeyUp);
  }

  update(dt: number, config: AircraftConfig): void {
    this.pitch = this.updateAxis(
      this.pitch,
      this.pressed.has('KeyW') || this.pressed.has('ArrowDown'),
      this.pressed.has('KeyS') || this.pressed.has('ArrowUp'),
      dt,
      config,
    );
    this.roll = this.updateAxis(
      this.roll,
      this.pressed.has('KeyA') || this.pressed.has('ArrowLeft'),
      this.pressed.has('KeyD') || this.pressed.has('ArrowRight'),
      dt,
      config,
    );
    this.yaw = this.updateAxis(
      this.yaw,
      this.pressed.has('KeyQ'),
      this.pressed.has('KeyE'),
      dt,
      config,
    );
    const throttleStep = dt * 0.55;
    if (this.pressed.has('Equal') || this.pressed.has('NumpadAdd')) {
      this.throttle += throttleStep;
    }
    if (this.pressed.has('Minus') || this.pressed.has('NumpadSubtract')) {
      this.throttle -= throttleStep;
    }
    if (this.pressed.has('Digit1')) {
      this.throttle = 0;
    }
    if (this.pressed.has('Digit2')) {
      this.throttle = 0.5;
    }
    if (this.pressed.has('Digit3')) {
      this.throttle = 1;
    }
    if (this.pressed.has('KeyF')) {
      this.flap = Math.min(1, this.flap + dt * 0.8);
    }
    if (this.pressed.has('KeyV')) {
      this.flap = Math.max(0, this.flap - dt * 0.8);
    }
    if (this.pressed.has('BracketRight')) {
      this.trim = Math.min(1, this.trim + dt * 0.45);
    }
    if (this.pressed.has('BracketLeft')) {
      this.trim = Math.max(-1, this.trim - dt * 0.45);
    }
    this.throttle = clamp(this.throttle, 0, 1);
    this.brake = this.pressed.has('Space') ? 1 : 0;
  }

  consumeToggle(code: string): boolean {
    const key = `toggle:${code}`;
    if (!this.pressed.has(key)) {
      return false;
    }
    this.pressed.delete(key);
    return true;
  }

  private updateAxis(
    axis: number,
    negative: boolean,
    positive: boolean,
    dt: number,
    config: AircraftConfig,
  ): number {
    const target = positive ? 1 : negative ? -1 : 0;
    const rate = target === 0 ? config.control.keyboardReturnRate : config.control.keyboardPressRate;
    return moveToward(axis, target, rate * dt);
  }

  private readonly onKeyDown = (event: KeyboardEvent) => {
    if (!event.repeat) {
      this.pressed.add(`toggle:${event.code}`);
    }
    this.pressed.add(event.code);
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(event.code)) {
      event.preventDefault();
    }
  };

  private readonly onKeyUp = (event: KeyboardEvent) => {
    this.pressed.delete(event.code);
  };
}
