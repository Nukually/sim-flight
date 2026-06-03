import type { AircraftConfig } from '../flight/AircraftConfig';
import type { PlayerInput } from './InputTypes';
import { clamp, expoSigned } from '../math/Scalar';

export function readGamepadInput(config: AircraftConfig): Partial<PlayerInput> {
  const pads = navigator.getGamepads?.() ?? [];
  const pad = Array.from(pads).find((candidate) => candidate?.connected);
  if (!pad) {
    return {};
  }

  return {
    roll: shapeAxis(pad.axes[0] ?? 0, config),
    pitch: shapeAxis(-(pad.axes[1] ?? 0), config),
    yaw: shapeAxis(pad.axes[2] ?? 0, config),
    throttle: clamp(1 - ((pad.axes[3] ?? 1) + 1) * 0.5, 0, 1),
    brake: buttonValue(pad.buttons[6]),
  };
}

function shapeAxis(value: number, config: AircraftConfig): number {
  const deadzone = config.control.gamepadDeadzone;
  if (Math.abs(value) < deadzone) {
    return 0;
  }
  const normalized = (Math.abs(value) - deadzone) / (1 - deadzone);
  return expoSigned(Math.sign(value) * normalized, config.control.gamepadExpo);
}

function buttonValue(button: GamepadButton | undefined): number {
  return button ? clamp(button.value, 0, 1) : 0;
}
