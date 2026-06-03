export function airDensityAtAltitude(altitudeMeters: number): number {
  return 1.225 * Math.exp(-Math.max(0, altitudeMeters) / 8500);
}
