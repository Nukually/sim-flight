import {
  Color3,
  Mesh,
  MeshBuilder,
  Quaternion,
  StandardMaterial,
  TransformNode,
  Vector3,
} from '@babylonjs/core';
import type { Scene } from '@babylonjs/core';
import type { AircraftState } from '../simulation/WorldState';

export class AircraftView {
  readonly root: TransformNode;
  private readonly fanBlades: Mesh[] = [];

  constructor(scene: Scene) {
    this.root = new TransformNode('aircraft-root', scene);

    const white = material(scene, 'aircraft-white', new Color3(0.88, 0.91, 0.92));
    const blue = material(scene, 'aircraft-blue', new Color3(0.05, 0.32, 0.55));
    const glass = material(scene, 'aircraft-glass', new Color3(0.15, 0.5, 0.72));
    const dark = material(scene, 'aircraft-dark', new Color3(0.06, 0.07, 0.08));

    const fuselage = MeshBuilder.CreateCylinder(
      'fuselage',
      {
        diameterTop: 0.95,
        diameterBottom: 1.05,
        height: 8,
        tessellation: 16,
      },
      scene,
    );
    fuselage.rotation.x = Math.PI / 2;
    fuselage.material = white;
    fuselage.parent = this.root;

    const nose = MeshBuilder.CreateSphere('nose', { diameter: 0.9, segments: 16 }, scene);
    nose.position.z = 4;
    nose.scaling.z = 1.05;
    nose.material = blue;
    nose.parent = this.root;

    const tail = MeshBuilder.CreateBox('tail-boom', { width: 0.62, height: 0.58, depth: 2.6 }, scene);
    tail.position.z = -4.2;
    tail.material = white;
    tail.parent = this.root;

    const cockpit = MeshBuilder.CreateSphere('cockpit', { diameter: 1.1, segments: 16 }, scene);
    cockpit.position.set(0, 0.52, 1.35);
    cockpit.scaling.set(0.82, 0.42, 1.15);
    cockpit.material = glass;
    cockpit.parent = this.root;

    const wing = MeshBuilder.CreateBox('main-wing', { width: 13.5, height: 0.12, depth: 1.45 }, scene);
    wing.position.set(0, 0.1, 0.25);
    wing.material = white;
    wing.parent = this.root;

    const leftAileron = MeshBuilder.CreateBox('left-aileron', { width: 3.2, height: 0.08, depth: 0.38 }, scene);
    leftAileron.position.set(-4.2, 0.04, -0.6);
    leftAileron.material = blue;
    leftAileron.parent = this.root;

    const rightAileron = MeshBuilder.CreateBox('right-aileron', { width: 3.2, height: 0.08, depth: 0.38 }, scene);
    rightAileron.position.set(4.2, 0.04, -0.6);
    rightAileron.material = blue;
    rightAileron.parent = this.root;

    const hTail = MeshBuilder.CreateBox('horizontal-tail', { width: 4.1, height: 0.1, depth: 0.85 }, scene);
    hTail.position.set(0, 0.35, -5.15);
    hTail.material = white;
    hTail.parent = this.root;

    const vTail = MeshBuilder.CreateBox('vertical-tail', { width: 0.18, height: 1.75, depth: 0.9 }, scene);
    vTail.position.set(0, 1.08, -5.1);
    vTail.material = blue;
    vTail.parent = this.root;

    for (const x of [-2.7, 2.7]) {
      const nacelle = MeshBuilder.CreateCylinder(
        `engine-nacelle-${x}`,
        { diameterTop: 0.62, diameterBottom: 0.72, height: 1.25, tessellation: 16 },
        scene,
      );
      nacelle.rotation.x = Math.PI / 2;
      nacelle.position.set(x, -0.28, 0.1);
      nacelle.material = white;
      nacelle.parent = this.root;

      const fan = MeshBuilder.CreateBox(`fan-${x}`, { width: 0.55, height: 0.05, depth: 0.05 }, scene);
      fan.position.set(x, -0.28, 0.78);
      fan.material = dark;
      fan.parent = this.root;
      this.fanBlades.push(fan);
    }

    for (const x of [-1.2, 1.2]) {
      const wheel = MeshBuilder.CreateCylinder(
        `main-wheel-${x}`,
        { diameter: 0.54, height: 0.18, tessellation: 12 },
        scene,
      );
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(x, -0.62, -0.9);
      wheel.material = dark;
      wheel.parent = this.root;
    }

    const noseWheel = MeshBuilder.CreateCylinder(
      'nose-wheel',
      { diameter: 0.42, height: 0.14, tessellation: 12 },
      scene,
    );
    noseWheel.rotation.z = Math.PI / 2;
    noseWheel.position.set(0, -0.64, 2.65);
    noseWheel.material = dark;
    noseWheel.parent = this.root;
  }

  update(aircraft: AircraftState, dt: number): void {
    this.root.position.set(aircraft.position.x, aircraft.position.y, aircraft.position.z);
    this.root.rotationQuaternion = new Quaternion(
      aircraft.rotation.x,
      aircraft.rotation.y,
      aircraft.rotation.z,
      aircraft.rotation.w,
    );
    for (const fan of this.fanBlades) {
      fan.rotate(Vector3.Forward(), aircraft.engine.rpm * dt * 0.18);
    }
  }
}

function material(scene: Scene, name: string, color: Color3): StandardMaterial {
  const mat = new StandardMaterial(name, scene);
  mat.diffuseColor = color;
  mat.specularColor = new Color3(0.12, 0.13, 0.14);
  return mat;
}
