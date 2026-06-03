export function degToRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

export function radToDeg(rad: number): number {
  return (rad * 180) / Math.PI;
}

export function knotsFromMetersPerSecond(value: number): number {
  return value * 1.9438444924;
}
