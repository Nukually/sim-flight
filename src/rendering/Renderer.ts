import { Engine, Scene } from '@babylonjs/core';
import type { WorldState } from '../simulation/WorldState';
import type { CameraOrbitDelta } from '../input/MouseInput';
import { AircraftView } from './AircraftView';
import { CameraSystem } from './CameraSystem';
import { buildScene } from './SceneBuilder';

export class Renderer {
  readonly engine: Engine;
  readonly scene: Scene;
  readonly aircraftView: AircraftView;
  readonly cameraSystem: CameraSystem;

  constructor(readonly canvas: HTMLCanvasElement) {
    this.engine = new Engine(canvas, true, {
      preserveDrawingBuffer: false,
      stencil: true,
      antialias: true,
    });
    this.scene = new Scene(this.engine);
    buildScene(this.scene);
    this.aircraftView = new AircraftView(this.scene);
    this.cameraSystem = new CameraSystem(this.scene);
    window.addEventListener('resize', this.onResize);
  }

  render(state: WorldState, orbitDelta: CameraOrbitDelta, dt: number): void {
    this.aircraftView.update(state.aircraft, dt);
    this.cameraSystem.update(state.aircraft, orbitDelta, dt);
    this.scene.render();
  }

  dispose(): void {
    window.removeEventListener('resize', this.onResize);
    this.scene.dispose();
    this.engine.dispose();
  }

  private readonly onResize = () => {
    this.engine.resize();
  };
}
