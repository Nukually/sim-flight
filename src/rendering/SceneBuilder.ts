import {
  Color3,
  Color4,
  DirectionalLight,
  HemisphericLight,
  MeshBuilder,
  Scene,
  StandardMaterial,
  Vector3,
} from '@babylonjs/core';

export function buildScene(scene: Scene): void {
  scene.clearColor = new Color4(0.52, 0.72, 0.9, 1);
  scene.fogMode = Scene.FOGMODE_EXP2;
  scene.fogDensity = 0.0009;
  scene.fogColor = new Color3(0.62, 0.76, 0.88);

  const hemi = new HemisphericLight('sky-light', new Vector3(0, 1, 0), scene);
  hemi.intensity = 0.72;
  hemi.groundColor = new Color3(0.35, 0.42, 0.35);

  const sun = new DirectionalLight('sun', new Vector3(-0.35, -0.9, 0.45), scene);
  sun.intensity = 1.35;

  const groundMat = new StandardMaterial('ground-mat', scene);
  groundMat.diffuseColor = new Color3(0.18, 0.37, 0.22);
  groundMat.specularColor = new Color3(0, 0, 0);
  const ground = MeshBuilder.CreateGround('ground', { width: 6000, height: 6000 }, scene);
  ground.material = groundMat;

  const runwayMat = new StandardMaterial('runway-mat', scene);
  runwayMat.diffuseColor = new Color3(0.12, 0.13, 0.14);
  runwayMat.specularColor = new Color3(0.05, 0.05, 0.05);
  const runway = MeshBuilder.CreateBox('runway', { width: 45, height: 0.04, depth: 2000 }, scene);
  runway.position.set(0, 0.025, 200);
  runway.material = runwayMat;

  const lineMat = new StandardMaterial('runway-line-mat', scene);
  lineMat.diffuseColor = new Color3(0.95, 0.95, 0.85);
  for (let z = -720; z <= 1120; z += 120) {
    const stripe = MeshBuilder.CreateBox(`centerline-${z}`, { width: 1.3, height: 0.055, depth: 44 }, scene);
    stripe.position.set(0, 0.07, z);
    stripe.material = lineMat;
  }

  for (const x of [-23.5, 23.5]) {
    const edge = MeshBuilder.CreateBox(`runway-edge-${x}`, { width: 0.55, height: 0.056, depth: 2000 }, scene);
    edge.position.set(x, 0.075, 200);
    edge.material = lineMat;
  }

  const markerMat = new StandardMaterial('marker-mat', scene);
  markerMat.diffuseColor = new Color3(0.78, 0.28, 0.14);
  for (let i = 0; i < 12; i += 1) {
    const marker = MeshBuilder.CreateCylinder(
      `field-marker-${i}`,
      { diameterTop: 0.2, diameterBottom: 1.2, height: 5, tessellation: 4 },
      scene,
    );
    marker.position.set(i % 2 === 0 ? -80 : 80, 2.5, -650 + i * 155);
    marker.rotation.y = Math.PI / 4;
    marker.material = markerMat;
  }

  const mountainMat = new StandardMaterial('mountain-mat', scene);
  mountainMat.diffuseColor = new Color3(0.28, 0.34, 0.33);
  for (let i = 0; i < 10; i += 1) {
    const mountain = MeshBuilder.CreateCylinder(
      `distant-mountain-${i}`,
      { diameterTop: 0, diameterBottom: 220 + i * 18, height: 120 + i * 12, tessellation: 5 },
      scene,
    );
    mountain.position.set(-950 + i * 220, 55 + i * 4, 1600 + (i % 3) * 180);
    mountain.material = mountainMat;
  }

  const cloudMat = new StandardMaterial('cloud-mat', scene);
  cloudMat.diffuseColor = new Color3(0.94, 0.96, 0.97);
  cloudMat.alpha = 0.74;
  for (let i = 0; i < 18; i += 1) {
    const cloud = MeshBuilder.CreateSphere(`cloud-${i}`, { diameter: 46 + (i % 4) * 15 }, scene);
    cloud.scaling.set(1.8, 0.32, 0.72);
    cloud.position.set(-700 + i * 90, 320 + (i % 5) * 38, -550 + (i % 6) * 250);
    cloud.material = cloudMat;
  }
}
