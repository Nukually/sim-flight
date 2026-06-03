import { FreeCamera, Vector3 } from '@babylonjs/core';
import type { Scene } from '@babylonjs/core';
import type { AircraftState } from '../simulation/WorldState';
import type { CameraOrbitDelta } from '../input/MouseInput';
import { clamp } from '../math/Scalar';
import { getForward, getUp } from '../math/Quat';

export type CameraMode = 'chase' | 'cockpit' | 'orbit';

export class CameraSystem {
  readonly camera: FreeCamera;
  mode: CameraMode = 'chase';
  private orbitYaw = 0;
  private orbitPitch = 0.24;
  private smoothedPosition = new Vector3(0, 8, -20);

  constructor(scene: Scene) {
    this.camera = new FreeCamera('camera', this.smoothedPosition, scene);
    this.camera.minZ = 0.5;
    this.camera.maxZ = 5000;
    this.camera.fov = 0.88;
  }

  update(aircraft: AircraftState, delta: CameraOrbitDelta, dt: number): void {
    if (Math.abs(delta.yaw) > 0 || Math.abs(delta.pitch) > 0) {
      this.mode = 'orbit';
    }

    this.orbitYaw += delta.yaw;
    this.orbitPitch = clamp(this.orbitPitch + delta.pitch, -0.25, 1.05);

    const position = new Vector3(
      aircraft.position.x,
      aircraft.position.y,
      aircraft.position.z,
    );
    const forward = getForward(aircraft.rotation);
    const up = getUp(aircraft.rotation);
    const forwardBabylon = new Vector3(forward.x, forward.y, forward.z).normalize();
    const upBabylon = new Vector3(up.x, up.y, up.z).normalize();
    const target = position.add(forwardBabylon.scale(8)).add(upBabylon.scale(1.6));

    let desired: Vector3;
    if (this.mode === 'cockpit') {
      desired = position.add(forwardBabylon.scale(1.45)).add(upBabylon.scale(0.85));
    } else if (this.mode === 'orbit') {
      const radius = 24;
      desired = position.add(
        new Vector3(
          Math.sin(this.orbitYaw) * Math.cos(this.orbitPitch) * radius,
          7 + Math.sin(this.orbitPitch) * radius,
          -Math.cos(this.orbitYaw) * Math.cos(this.orbitPitch) * radius,
        ),
      );
    } else {
      desired = position.add(forwardBabylon.scale(-24)).add(upBabylon.scale(8));
    }

    const t = 1 - Math.exp(-dt * 4.5);
    this.smoothedPosition = Vector3.Lerp(this.smoothedPosition, desired, t);
    this.camera.position.copyFrom(this.smoothedPosition);
    this.camera.setTarget(target);
  }

  cycleMode(): void {
    this.mode = this.mode === 'chase' ? 'cockpit' : this.mode === 'cockpit' ? 'orbit' : 'chase';
  }
}
