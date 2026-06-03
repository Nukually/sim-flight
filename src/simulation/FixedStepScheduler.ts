export class FixedStepScheduler {
  private accumulator = 0;

  constructor(private readonly fixedDt: number) {}

  update(frameDt: number, step: () => void): number {
    const maxFrameDt = 0.1;
    this.accumulator += Math.min(frameDt, maxFrameDt);
    let steps = 0;

    while (this.accumulator >= this.fixedDt) {
      step();
      this.accumulator -= this.fixedDt;
      steps += 1;
    }

    return steps;
  }

  getAlpha(): number {
    return this.accumulator / this.fixedDt;
  }

  reset(): void {
    this.accumulator = 0;
  }
}
