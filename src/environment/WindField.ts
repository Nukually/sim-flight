import type { EnvironmentState } from '../simulation/WorldState';
import { vec3 } from '../math/Vec3';

export function updateWind(environment: EnvironmentState, time: number): void {
  environment.turbulence = vec3(
    Math.sin(time * 0.73) * 0.15,
    Math.sin(time * 1.13) * 0.06,
    Math.cos(time * 0.41) * 0.12,
  );
}
