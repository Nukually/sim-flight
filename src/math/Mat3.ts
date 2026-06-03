import type { Vec3 } from './Vec3';

export type DiagonalInertia = {
  ixx: number;
  iyy: number;
  izz: number;
};

export function multiplyDiagonalInertia(inertia: DiagonalInertia, omega: Vec3): Vec3 {
  return {
    x: inertia.ixx * omega.x,
    y: inertia.iyy * omega.y,
    z: inertia.izz * omega.z,
  };
}

export function divideByDiagonalInertia(value: Vec3, inertia: DiagonalInertia): Vec3 {
  return {
    x: value.x / inertia.ixx,
    y: value.y / inertia.iyy,
    z: value.z / inertia.izz,
  };
}
