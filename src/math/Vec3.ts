export type Vec3 = {
  x: number;
  y: number;
  z: number;
};

export const Vec3Zero: Vec3 = { x: 0, y: 0, z: 0 };

export function vec3(x = 0, y = 0, z = 0): Vec3 {
  return { x, y, z };
}

export function add(a: Vec3, b: Vec3): Vec3 {
  return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z };
}

export function sub(a: Vec3, b: Vec3): Vec3 {
  return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
}

export function scale(a: Vec3, s: number): Vec3 {
  return { x: a.x * s, y: a.y * s, z: a.z * s };
}

export function dot(a: Vec3, b: Vec3): number {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

export function cross(a: Vec3, b: Vec3): Vec3 {
  return {
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x,
  };
}

export function length(a: Vec3): number {
  return Math.sqrt(dot(a, a));
}

export function lengthSquared(a: Vec3): number {
  return dot(a, a);
}

export function normalize(a: Vec3): Vec3 {
  const len = length(a);
  if (len < 1e-8) {
    return vec3();
  }
  return scale(a, 1 / len);
}

export function clampLength(a: Vec3, maxLength: number): Vec3 {
  const len = length(a);
  if (len <= maxLength || len < 1e-8) {
    return a;
  }
  return scale(a, maxLength / len);
}

export function cloneVec3(a: Vec3): Vec3 {
  return { x: a.x, y: a.y, z: a.z };
}

export function lerpVec3(a: Vec3, b: Vec3, t: number): Vec3 {
  return {
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t,
    z: a.z + (b.z - a.z) * t,
  };
}

export function projectOnPlane(a: Vec3, normal: Vec3): Vec3 {
  return sub(a, scale(normal, dot(a, normal)));
}
