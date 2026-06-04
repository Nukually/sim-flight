import type { WorldMetrics } from '../simulation/World';
import type { WorldState } from '../simulation/WorldState';
import { defaultAircraftConfig } from '../app/Config';
import { knotsFromMetersPerSecond, radToDeg } from '../math/Units';

export class Hud {
  readonly root: HTMLDivElement;
  private readonly values = new Map<string, HTMLSpanElement>();
  private readonly warning: HTMLDivElement;

  constructor(parent: HTMLElement) {
    this.root = document.createElement('div');
    this.root.className = 'hud';

    const top = document.createElement('div');
    top.className = 'hud-top';
    this.root.append(top);

    const tiles: [string, string][] = [
      ['airspeed', 'Airspeed'],
      ['altitude', 'Altitude'],
      ['verticalSpeed', 'V/S'],
      ['heading', 'Heading'],
      ['attitude', 'Pitch/Roll'],
      ['autopilot', 'Autopilot'],
      ['power', 'Power'],
      ['trim', 'Trim/Flap'],
      ['aoa', 'AoA'],
      ['gload', 'G Load'],
    ];

    for (const [key, label] of tiles) {
      const tile = document.createElement('div');
      tile.className = 'hud-tile';
      const labelEl = document.createElement('span');
      labelEl.className = 'hud-label';
      labelEl.textContent = label;
      const valueEl = document.createElement('span');
      valueEl.className = 'hud-value';
      valueEl.textContent = '-';
      tile.append(labelEl, valueEl);
      top.append(tile);
      this.values.set(key, valueEl);
    }

    const attitude = document.createElement('div');
    attitude.className = 'attitude';
    const horizon = document.createElement('div');
    horizon.className = 'attitude-horizon';
    horizon.dataset.horizon = 'true';
    const center = document.createElement('div');
    center.className = 'center-mark';
    attitude.append(horizon, center);
    this.root.append(attitude);

    this.warning = document.createElement('div');
    this.warning.className = 'warning hidden';
    this.root.append(this.warning);
    parent.append(this.root);
  }

  update(state: WorldState): void {
    const aircraft = state.aircraft;
    this.set('airspeed', `${knotsFromMetersPerSecond(aircraft.derived.airspeed).toFixed(0)} kt`);
    this.set('altitude', `${aircraft.derived.altitude.toFixed(0)} m`);
    this.set('verticalSpeed', `${aircraft.derived.verticalSpeed.toFixed(1)} m/s`);
    this.set('heading', `${aircraft.derived.heading.toFixed(0)} deg`);
    this.set(
      'attitude',
      `${radToDeg(aircraft.derived.pitch).toFixed(0)} / ${radToDeg(aircraft.derived.roll).toFixed(0)} deg`,
    );
    this.set(
      'autopilot',
      autopilotText(state),
    );
    this.set(
      'power',
      `${(aircraft.engine.throttle * 100).toFixed(0)}% N1 ${aircraft.engine.rpm.toFixed(0)}`,
    );
    this.set(
      'trim',
      `${(aircraft.controls.trim * 100).toFixed(0)}% / ${((aircraft.controls.flap / defaultAircraftConfig.surfaces.flapMaxRad) * 100).toFixed(0)}%`,
    );
    this.set('aoa', `${radToDeg(aircraft.derived.angleOfAttack).toFixed(1)} deg`);
    this.set('gload', `${aircraft.derived.loadFactor.toFixed(2)} g`);

    const horizon = this.root.querySelector<HTMLElement>('[data-horizon="true"]');
    if (horizon) {
      const pitchOffset = radToDeg(aircraft.derived.pitch) * 2.2;
      horizon.style.transform = `translateY(${pitchOffset}px) rotate(${-radToDeg(aircraft.derived.roll)}deg)`;
    }

    const message = state.mission.hasCrashed
      ? state.mission.message
      : aircraft.derived.isStalling
        ? 'STALL'
        : '';
    this.warning.textContent = message;
    this.warning.classList.toggle('hidden', message.length === 0);
  }

  setVisible(visible: boolean): void {
    this.root.classList.toggle('hidden', !visible);
  }

  private set(key: string, value: string): void {
    const el = this.values.get(key);
    if (el) {
      el.textContent = value;
    }
  }
}

export class DebugOverlay {
  readonly root: HTMLDivElement;

  constructor(parent: HTMLElement) {
    this.root = document.createElement('div');
    this.root.className = 'debug-overlay hidden';
    parent.append(this.root);
  }

  update(state: WorldState, metrics: WorldMetrics, fps: number): void {
    const d = state.aircraft.derived;
    const c = d.coefficients;
    const f = d.forces;
    this.root.replaceChildren(
      row('FPS', fps.toFixed(0)),
      row('Physics tick', `${state.tick}`),
      row('Physics cost', `${metrics.lastPhysicsCostMs.toFixed(3)} ms`),
      row('Alpha / Beta', `${radToDeg(d.angleOfAttack).toFixed(2)} / ${radToDeg(d.sideSlip).toFixed(2)} deg`),
      row('CL / CD / CY', `${c.CL.toFixed(3)} / ${c.CD.toFixed(3)} / ${c.CY.toFixed(3)}`),
      row('Cl / Cm / Cn', `${c.Cl.toFixed(3)} / ${c.Cm.toFixed(3)} / ${c.Cn.toFixed(3)}`),
      row('Lift / Drag', `${f.lift.toFixed(0)} / ${f.drag.toFixed(0)} N`),
      row('Thrust / Weight', `${f.thrust.toFixed(0)} / ${f.weight.toFixed(0)} N`),
      row(
        'Autopilot',
        `${state.autopilot.mode} pitch ${radToDeg(state.autopilot.targetPitch).toFixed(1)} roll ${radToDeg(state.autopilot.targetRoll).toFixed(1)} ${activeWaypointText(state)}`,
      ),
      row(
        'Angular vel',
        `${state.aircraft.angularVelocityBody.x.toFixed(2)}, ${state.aircraft.angularVelocityBody.y.toFixed(2)}, ${state.aircraft.angularVelocityBody.z.toFixed(2)}`,
      ),
      row('Mission', state.mission.message),
    );
  }

  setVisible(visible: boolean): void {
    this.root.classList.toggle('hidden', !visible);
  }
}

function autopilotText(state: WorldState): string {
  const waypoint = state.navigation.waypoints[state.navigation.activeIndex];
  if (state.autopilot.mode === 'nav' && waypoint) {
    return `NAV ${waypoint.label}`;
  }
  return `${state.autopilot.mode.toUpperCase()} ${radToDeg(state.autopilot.targetPitch).toFixed(0)} deg`;
}

function activeWaypointText(state: WorldState): string {
  const waypoint = state.navigation.waypoints[state.navigation.activeIndex];
  return waypoint ? `wp ${waypoint.label}` : 'wp none';
}

function row(label: string, value: string): HTMLDivElement {
  const el = document.createElement('div');
  el.className = 'debug-row';
  const left = document.createElement('span');
  left.textContent = label;
  const right = document.createElement('span');
  right.textContent = value;
  el.append(left, right);
  return el;
}
