export type CameraOrbitDelta = {
  yaw: number;
  pitch: number;
};

export class MouseInput {
  private active = false;
  private yawDelta = 0;
  private pitchDelta = 0;

  attach(canvas: HTMLCanvasElement): void {
    canvas.addEventListener('contextmenu', this.preventContextMenu);
    canvas.addEventListener('pointerdown', this.onPointerDown);
    window.addEventListener('pointerup', this.onPointerUp);
    window.addEventListener('pointermove', this.onPointerMove);
  }

  detach(canvas: HTMLCanvasElement): void {
    canvas.removeEventListener('contextmenu', this.preventContextMenu);
    canvas.removeEventListener('pointerdown', this.onPointerDown);
    window.removeEventListener('pointerup', this.onPointerUp);
    window.removeEventListener('pointermove', this.onPointerMove);
  }

  consumeOrbitDelta(): CameraOrbitDelta {
    const delta = { yaw: this.yawDelta, pitch: this.pitchDelta };
    this.yawDelta = 0;
    this.pitchDelta = 0;
    return delta;
  }

  private readonly preventContextMenu = (event: MouseEvent) => {
    event.preventDefault();
  };

  private readonly onPointerDown = (event: PointerEvent) => {
    if (event.button === 2) {
      this.active = true;
    }
  };

  private readonly onPointerUp = () => {
    this.active = false;
  };

  private readonly onPointerMove = (event: PointerEvent) => {
    if (!this.active) {
      return;
    }
    this.yawDelta += event.movementX * 0.004;
    this.pitchDelta += event.movementY * 0.004;
  };
}
