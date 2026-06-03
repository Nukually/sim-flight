import type { WorldState } from '../simulation/WorldState';

export class AudioSystem {
  private context: AudioContext | null = null;
  private engineOsc: OscillatorNode | null = null;
  private engineGain: GainNode | null = null;
  private stallOsc: OscillatorNode | null = null;
  private stallGain: GainNode | null = null;

  async enable(): Promise<void> {
    if (this.context) {
      await this.context.resume();
      return;
    }

    const context = new AudioContext();
    const engineOsc = context.createOscillator();
    const engineGain = context.createGain();
    const stallOsc = context.createOscillator();
    const stallGain = context.createGain();

    engineOsc.type = 'sawtooth';
    engineOsc.frequency.value = 80;
    engineGain.gain.value = 0;
    engineOsc.connect(engineGain).connect(context.destination);
    engineOsc.start();

    stallOsc.type = 'square';
    stallOsc.frequency.value = 740;
    stallGain.gain.value = 0;
    stallOsc.connect(stallGain).connect(context.destination);
    stallOsc.start();

    this.context = context;
    this.engineOsc = engineOsc;
    this.engineGain = engineGain;
    this.stallOsc = stallOsc;
    this.stallGain = stallGain;
  }

  update(state: WorldState): void {
    if (!this.context || !this.engineOsc || !this.engineGain || !this.stallGain || !this.stallOsc) {
      return;
    }

    const now = this.context.currentTime;
    const throttle = state.aircraft.engine.throttle;
    const airspeed = state.aircraft.derived.airspeed;
    this.engineOsc.frequency.setTargetAtTime(55 + throttle * 95 + airspeed * 0.5, now, 0.05);
    this.engineGain.gain.setTargetAtTime(0.015 + throttle * 0.045, now, 0.05);

    const stallGain = state.aircraft.derived.isStalling ? 0.05 : 0;
    const beep = state.aircraft.derived.isStalling ? 1 + Math.sin(state.time * 20) : 0;
    this.stallOsc.frequency.setTargetAtTime(650 + beep * 120, now, 0.02);
    this.stallGain.gain.setTargetAtTime(stallGain * Math.max(0, beep), now, 0.02);
  }
}
