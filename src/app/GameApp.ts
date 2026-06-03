import { defaultAircraftConfig } from './Config';
import { GameLoop } from './GameLoop';
import { AudioSystem } from '../audio/AudioSystem';
import { cloneAircraftConfig, type AircraftConfig } from '../flight/AircraftConfig';
import { InputManager } from '../input/InputManager';
import { Renderer } from '../rendering/Renderer';
import { DebugOverlay, Hud } from '../rendering/Hud';
import { Recorder, type FlightRecording } from '../simulation/Recorder';
import { ReplayRunner } from '../simulation/Replay';
import { World } from '../simulation/World';
import type { MissionMode } from '../simulation/WorldState';
import { DebugPanel } from '../ui/DebugPanel';
import { createControlStrip } from '../ui/Menu';

export class GameApp {
  private readonly shell: HTMLDivElement;
  private readonly canvas: HTMLCanvasElement;
  private readonly renderer: Renderer;
  private readonly world: World;
  private readonly input = new InputManager();
  private readonly hud: Hud;
  private readonly debugOverlay: DebugOverlay;
  private readonly debugPanel: DebugPanel;
  private readonly recorder = new Recorder();
  private readonly replay = new ReplayRunner();
  private readonly audio = new AudioSystem();
  private readonly landingPanel: HTMLDivElement;
  private readonly replayPanel: HTMLDivElement;
  private replayText!: HTMLTextAreaElement;
  private readonly loop: GameLoop;
  private config: AircraftConfig;
  private lastRecording: FlightRecording | null = null;
  private hudVisible = true;
  private debugVisible = false;
  private replayActive = false;

  constructor(parent: HTMLElement) {
    this.config = cloneAircraftConfig(defaultAircraftConfig);
    this.shell = document.createElement('div');
    this.shell.className = 'game-shell';
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'render-canvas';
    this.canvas.tabIndex = 0;
    this.shell.append(this.canvas);
    parent.append(this.shell);

    this.renderer = new Renderer(this.canvas);
    this.world = new World(this.config);
    this.hud = new Hud(this.shell);
    this.debugOverlay = new DebugOverlay(this.shell);
    this.debugPanel = new DebugPanel(this.config, (config) => {
      this.config = config;
      this.world.applyConfig(config);
    });
    this.landingPanel = this.createLandingPanel();
    this.replayPanel = this.createReplayPanel();
    createControlStrip(this.shell, {
      reset: () => this.reset(),
      toggleHud: () => this.toggleHud(),
      toggleDebug: () => this.toggleDebug(),
      cycleCamera: () => this.renderer.cameraSystem.cycleMode(),
      saveReplay: () => this.toggleRecording(),
      playReplay: () => this.playReplayFromPanel(),
      enableAudio: () => void this.audio.enable(),
      setMode: (mode) => this.setMode(mode),
    });
    this.loop = new GameLoop({
      fixedUpdate: (dt) => this.fixedUpdate(dt),
      render: (dt, fps, alpha) => this.render(dt, fps, alpha),
    });
  }

  start(): void {
    this.input.attach(this.canvas);
    this.canvas.focus();
    this.loop.start();
  }

  dispose(): void {
    this.loop.stop();
    this.input.detach(this.canvas);
    this.renderer.dispose();
    this.debugPanel.destroy();
  }

  private fixedUpdate(dt: number): void {
    this.handleHotkeys();

    if (this.replayActive) {
      const state = this.replay.step(dt);
      if (!state || this.replay.isFinished()) {
        this.replayActive = false;
      }
      return;
    }

    const input = this.input.update(dt, this.config);
    this.world.fixedUpdate(input, dt);
    if (this.recorder.isRecording()) {
      this.recorder.record(this.world.state.tick, input);
    }
  }

  private render(dt: number, fps: number, alpha: number): void {
    const state = this.replayActive
      ? this.replay.currentState() ?? this.world.state
      : this.world.interpolatedSnapshot(alpha);
    this.renderer.render(state, this.input.consumeOrbitDelta(), dt);
    this.hud.update(state);
    this.debugOverlay.update(state, this.world.metrics, fps);
    this.audio.update(state);
    this.updateLandingPanel(state.mission.mode);
  }

  private handleHotkeys(): void {
    const keyboard = this.input.keyboard;
    if (keyboard.consumeToggle('KeyH')) {
      this.toggleHud();
    }
    if (keyboard.consumeToggle('F1')) {
      this.toggleDebug();
    }
    if (keyboard.consumeToggle('F2')) {
      this.reset();
    }
    if (keyboard.consumeToggle('F3')) {
      this.toggleRecording();
    }
    if (keyboard.consumeToggle('F4')) {
      this.playReplayFromPanel();
    }
    if (keyboard.consumeToggle('KeyC')) {
      this.renderer.cameraSystem.cycleMode();
    }
  }

  private toggleHud(): void {
    this.hudVisible = !this.hudVisible;
    this.hud.setVisible(this.hudVisible);
  }

  private toggleDebug(): void {
    this.debugVisible = !this.debugVisible;
    this.debugOverlay.setVisible(this.debugVisible);
    this.debugPanel.toggle();
  }

  private reset(mode: MissionMode = this.world.state.mission.mode): void {
    const shouldKeepRecording = this.recorder.isRecording();
    this.replayActive = false;
    this.world.reset(mode);
    this.loop.reset();
    if (shouldKeepRecording) {
      this.recorder.start(this.world.snapshot());
    }
  }

  private setMode(mode: MissionMode): void {
    this.reset(mode);
  }

  private toggleRecording(): void {
    if (this.recorder.isRecording()) {
      this.lastRecording = this.recorder.stop();
      this.replayText.value = this.lastRecording ? JSON.stringify(this.lastRecording, null, 2) : '';
      this.replayPanel.classList.remove('hidden');
      return;
    }

    this.recorder.start(this.world.snapshot());
  }

  private playReplayFromPanel(): void {
    const raw = this.replayText.value.trim();
    if (!raw && !this.lastRecording) {
      return;
    }

    try {
      const recording = raw ? (JSON.parse(raw) as FlightRecording) : this.lastRecording;
      if (!recording) {
        return;
      }
      this.replay.load(recording, this.config);
      this.replayActive = true;
    } catch {
      this.replayPanel.classList.remove('hidden');
    }
  }

  private createLandingPanel(): HTMLDivElement {
    const panel = document.createElement('div');
    panel.className = 'landing-panel hidden';
    this.shell.append(panel);
    return panel;
  }

  private updateLandingPanel(mode: MissionMode): void {
    if (mode !== 'landing-challenge') {
      this.landingPanel.classList.add('hidden');
      return;
    }

    const landing = this.world.state.mission.landing;
    this.landingPanel.classList.remove('hidden');
    this.landingPanel.replaceChildren(
      heading('Landing Challenge'),
      para(`Score: ${this.world.state.mission.score}`),
      para(`Touchdown V/S: ${landing.verticalSpeedAtTouchdown.toFixed(2)} m/s`),
      para(`Centerline: ${landing.centerlineError.toFixed(1)} m`),
      para(`Heading error: ${landing.headingErrorDeg.toFixed(1)} deg`),
      para(this.world.state.mission.message),
    );
  }

  private createReplayPanel(): HTMLDivElement {
    const panel = document.createElement('div');
    panel.className = 'replay-panel hidden';
    panel.append(heading('Replay JSON'));
    this.replayText = document.createElement('textarea');
    panel.append(this.replayText);
    this.shell.append(panel);
    return panel;
  }
}

function heading(text: string): HTMLHeadingElement {
  const el = document.createElement('h2');
  el.textContent = text;
  return el;
}

function para(text: string): HTMLParagraphElement {
  const el = document.createElement('p');
  el.textContent = text;
  return el;
}
