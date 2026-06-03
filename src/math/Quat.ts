import { add, cross, dot, scale, type Vec3, vec3 } from './Vec3';

export type Quat = {
  w: number;
  x: number;
  y: number;
  z: number;
};

export function quatIdentity(): Quat {
  return { w: 1, x: 0, y: 0, z: 0 };
}

export function quatFromAxisAngle(axis: Vec3, angleRad: number): Quat {
  const half = angleRad * 0.5;
  const s = Math.sin(half);
  return normalizeQuat({
    w: Math.cos(half),
    x: axis.x * s,
    y: axis.y * s,
    z: axis.z * s,
  });
}

export function quatFromForwardUp(forward: Vec3, up: Vec3): Quat {
  const f = normalizeSafe(forward, vec3(0, 0, 1));
  const r = normalizeSafe(cross(up, f), vec3(1, 0, 0));
  const u = cross(f, r);
  const m00 = r.x;
  const m01 = u.x;
  const m02 = f.x;
  const m10 = r.y;
  const m11 = u.y;
  const m12 = f.y;
  const m20 = r.z;
  const m21 = u.z;
  const m22 = f.z;
  const trace = m00 + m11 + m22;

  if (trace > 0) {
    const s = Math.sqrt(trace + 1) * 2;
    return normalizeQuat({
      w: 0.25 * s,
      x: (m21 - m12) / s,
      y: (m02 - m20) / s,
      z: (m10 - m01) / s,
    });
  }

  if (m00 > m11 && m00 > m22) {
    const s = Math.sqrt(1 + m00 - m11 - m22) * 2;
    return normalizeQuat({
      w: (m21 - m12) / s,
      x: 0.25 * s,
      y: (m01 + m10) / s,
      z: (m02 + m20) / s,
    });
  }

  if (m11 > m22) {
    const s = Math.sqrt(1 + m11 - m00 - m22) * 2;
    return normalizeQuat({
      w: (m02 - m20) / s,
      x: (m01 + m10) / s,
      y: 0.25 * s,
      z: (m12 + m21) / s,
    });
  }

  const s = Math.sqrt(1 + m22 - m00 - m11) * 2;
  return normalizeQuat({
    w: (m10 - m01) / s,
    x: (m02 + m20) / s,
    y: (m12 + m21) / s,
    z: 0.25 * s,
  });
}

export function multiplyQuat(a: Quat, b: Quat): Quat {
  return {
    w: a.w * b.w - a.x * b.x - a.y * b.y - a.z * b.z,
    x: a.w * b.x + a.x * b.w + a.y * b.z - a.z * b.y,
    y: a.w * b.y - a.x * b.z + a.y * b.w + a.z * b.x,
    z: a.w * b.z + a.x * b.y - a.y * b.x + a.z * b.w,
  };
}

export function normalizeQuat(q: Quat): Quat {
  const len = Math.sqrt(q.w * q.w + q.x * q.x + q.y * q.y + q.z * q.z);
  if (len < 1e-8) {
    return quatIdentity();
  }
  return {
    w: q.w / len,
    x: q.x / len,
    y: q.y / len,
    z: q.z / len,
  };
}

export function lerpQuat(a: Quat, b: Quat, t: number): Quat {
  const sign = a.w * b.w + a.x * b.x + a.y * b.y + a.z * b.z < 0 ? -1 : 1;
  return normalizeQuat({
    w: a.w + (b.w * sign - a.w) * t,
    x: a.x + (b.x * sign - a.x) * t,
    y: a.y + (b.y * sign - a.y) * t,
    z: a.z + (b.z * sign - a.z) * t,
  });
}

export function conjugateQuat(q: Quat): Quat {
  return { w: q.w, x: -q.x, y: -q.y, z: -q.z };
}

export function rotateVecByQuat(q: Quat, v: Vec3): Vec3 {
  const qv = vec3(q.x, q.y, q.z);
  const t = scale(cross(qv, v), 2);
  return add(add(v, scale(t, q.w)), cross(qv, t));
}

export function inverseRotateVecByQuat(q: Quat, v: Vec3): Vec3 {
  return rotateVecByQuat(conjugateQuat(q), v);
}

export function integrateBodyAngularVelocity(q: Quat, omegaBody: Vec3, dt: number): Quat {
  const omegaQuat: Quat = { w: 0, x: omegaBody.x, y: omegaBody.y, z: omegaBody.z };
  const dq = multiplyQuat(q, omegaQuat);
  return normalizeQuat({
    w: q.w + 0.5 * dq.w * dt,
    x: q.x + 0.5 * dq.x * dt,
    y: q.y + 0.5 * dq.y * dt,
    z: q.z + 0.5 * dq.z * dt,
  });
}

export function getForward(q: Quat): Vec3 {
  return rotateVecByQuat(q, vec3(0, 0, 1));
}

export function getRight(q: Quat): Vec3 {
  return rotateVecByQuat(q, vec3(1, 0, 0));
}

export function getUp(q: Quat): Vec3 {
  return rotateVecByQuat(q, vec3(0, 1, 0));
}

export function toEuler(q: Quat): { pitch: number; roll: number; yaw: number } {
  const forward = getForward(q);
  const up = getUp(q);
  const pitch = Math.asin(Math.max(-1, Math.min(1, forward.y)));
  const yaw = Math.atan2(forward.x, forward.z);
  const right = getRight(q);
  const roll = Math.atan2(dot(right, vec3(0, 1, 0)), dot(up, vec3(0, 1, 0)));
  return { pitch, roll, yaw };
}

function normalizeSafe(value: Vec3, fallback: Vec3): Vec3 {
  const len = Math.sqrt(dot(value, value));
  if (len < 1e-8) {
    return fallback;
  }
  return scale(value, 1 / len);
}
