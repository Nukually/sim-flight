import { FIXED_DT } from './Config';
import { FixedStepScheduler } from '../simulation/FixedStepScheduler';

export type GameLoopHandlers = {
  fixedUpdate: (dt: number) => void;
  render: (dt: number, fps: number) => void;
};

export class GameLoop {
  private readonly scheduler = new FixedStepScheduler(FIXED_DT);
  private running = false;
  private frameHandle = 0;
  private lastTime = 0;
  private fps = 60;

  constructor(private readonly handlers: GameLoopHandlers) {}

  start(): void {
    if (this.running) {
      return;
    }
    this.running = true;
    this.lastTime = performance.now();
    this.frameHandle = requestAnimationFrame(this.frame);
  }

  stop(): void {
    this.running = false;
    cancelAnimationFrame(this.frameHandle);
  }

  reset(): void {
    this.scheduler.reset();
    this.lastTime = performance.now();
  }

  private readonly frame = (time: number) => {
    if (!this.running) {
      return;
    }

    const dt = Math.max(0, (time - this.lastTime) / 1000);
    this.lastTime = time;
    this.fps = this.fps * 0.9 + (dt > 0 ? (1 / dt) * 0.1 : 0);
    this.scheduler.update(dt, () => this.handlers.fixedUpdate(FIXED_DT));
    this.handlers.render(dt, this.fps);
    this.frameHandle = requestAnimationFrame(this.frame);
  };
}
