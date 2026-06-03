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
  private readonly propeller: Mesh;

  constructor(scene: Scene) {
    this.root = new TransformNode('aircraft-root', scene);

    const white = material(scene, 'aircraft-white', new Color3(0.88, 0.91, 0.92));
    const blue = material(scene, 'aircraft-blue', new Color3(0.05, 0.32, 0.55));
    const glass = material(scene, 'aircraft-glass', new Color3(0.15, 0.5, 0.72));
    const dark = material(scene, 'aircraft-dark', new Color3(0.06, 0.07, 0.08));

    const fuselage = MeshBuilder.CreateCylinder(
      'fuselage',
      {
        diameterTop: 0.75,
        diameterBottom: 0.9,
        height: 6,
        tessellation: 16,
      },
      scene,
    );
    fuselage.rotation.x = Math.PI / 2;
    fuselage.material = white;
    fuselage.parent = this.root;

    const nose = MeshBuilder.CreateSphere('nose', { diameter: 0.9, segments: 16 }, scene);
    nose.position.z = 3;
    nose.scaling.z = 0.75;
    nose.material = blue;
    nose.parent = this.root;

    const tail = MeshBuilder.CreateBox('tail-boom', { width: 0.5, height: 0.55, depth: 2.2 }, scene);
    tail.position.z = -3.1;
    tail.material = white;
    tail.parent = this.root;

    const cockpit = MeshBuilder.CreateSphere('cockpit', { diameter: 1.1, segments: 16 }, scene);
    cockpit.position.set(0, 0.42, 0.9);
    cockpit.scaling.set(0.78, 0.45, 0.9);
    cockpit.material = glass;
    cockpit.parent = this.root;

    const wing = MeshBuilder.CreateBox('main-wing', { width: 10.5, height: 0.13, depth: 1.35 }, scene);
    wing.position.set(0, 0.12, 0.2);
    wing.material = white;
    wing.parent = this.root;

    const leftAileron = MeshBuilder.CreateBox('left-aileron', { width: 2.8, height: 0.08, depth: 0.4 }, scene);
    leftAileron.position.set(-3.6, 0.05, -0.55);
    leftAileron.material = blue;
    leftAileron.parent = this.root;

    const rightAileron = MeshBuilder.CreateBox('right-aileron', { width: 2.8, height: 0.08, depth: 0.4 }, scene);
    rightAileron.position.set(3.6, 0.05, -0.55);
    rightAileron.material = blue;
    rightAileron.parent = this.root;

    const hTail = MeshBuilder.CreateBox('horizontal-tail', { width: 3.2, height: 0.1, depth: 0.8 }, scene);
    hTail.position.set(0, 0.25, -4.1);
    hTail.material = white;
    hTail.parent = this.root;

    const vTail = MeshBuilder.CreateBox('vertical-tail', { width: 0.16, height: 1.45, depth: 0.75 }, scene);
    vTail.position.set(0, 0.95, -4.05);
    vTail.material = blue;
    vTail.parent = this.root;

    this.propeller = MeshBuilder.CreateBox('propeller', { width: 2.3, height: 0.08, depth: 0.08 }, scene);
    this.propeller.position.z = 3.55;
    this.propeller.material = dark;
    this.propeller.parent = this.root;

    for (const x of [-1.2, 1.2]) {
      const wheel = MeshBuilder.CreateCylinder(
        `main-wheel-${x}`,
        { diameter: 0.54, height: 0.18, tessellation: 12 },
        scene,
      );
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(x, -0.56, -0.7);
      wheel.material = dark;
      wheel.parent = this.root;
    }

    const noseWheel = MeshBuilder.CreateCylinder(
      'nose-wheel',
      { diameter: 0.42, height: 0.14, tessellation: 12 },
      scene,
    );
    noseWheel.rotation.z = Math.PI / 2;
    noseWheel.position.set(0, -0.58, 2.05);
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
    this.propeller.rotate(Vector3.Forward(), aircraft.engine.rpm * dt * 0.08);
  }
}

function material(scene: Scene, name: string, color: Color3): StandardMaterial {
  const mat = new StandardMaterial(name, scene);
  mat.diffuseColor = color;
  mat.specularColor = new Color3(0.12, 0.13, 0.14);
  return mat;
}
