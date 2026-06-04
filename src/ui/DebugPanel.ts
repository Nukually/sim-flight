import GUI from 'lil-gui';
import type { AircraftConfig } from '../flight/AircraftConfig';
import { cloneAircraftConfig } from '../flight/AircraftConfig';

const STORAGE_KEY = 'skyloop-aircraft-config';

export class DebugPanel {
  readonly gui: GUI;
  private config: AircraftConfig;
  private visible = false;

  constructor(config: AircraftConfig, onChange: (config: AircraftConfig) => void) {
    this.config = loadConfig(config);
    this.gui = new GUI({ title: 'Flight Tuning' });
    this.gui.hide();

    const aircraft = this.gui.addFolder('Aircraft');
    aircraft.add(this.config, 'mass', 2500, 9000, 25).onChange(() => this.emit(onChange));

    const lift = this.gui.addFolder('Aero / Lift');
    lift.add(this.config.aero, 'CL0', -0.2, 0.6, 0.01).onChange(() => this.emit(onChange));
    lift.add(this.config.aero, 'CLAlpha', 3, 7, 0.05).onChange(() => this.emit(onChange));
    lift.add(this.config.aero, 'CLMaxAfterStall', 0.25, 1.2, 0.01).onChange(() => this.emit(onChange));
    lift.add(this.config.aero, 'CLElevator', -1, 1, 0.01).onChange(() => this.emit(onChange));
    lift.add(this.config.aero, 'CLFlap', 0, 1.2, 0.01).onChange(() => this.emit(onChange));

    const drag = this.gui.addFolder('Aero / Drag');
    drag.add(this.config.aero, 'CD0', 0.01, 0.12, 0.001).onChange(() => this.emit(onChange));
    drag.add(this.config.aero, 'inducedDragK', 0.01, 0.12, 0.001).onChange(() => this.emit(onChange));
    drag.add(this.config.aero, 'CDFlap', 0, 0.4, 0.01).onChange(() => this.emit(onChange));

    const pitch = this.gui.addFolder('Aero / Pitch');
    pitch.add(this.config.aero, 'Cm0', -0.15, 0.15, 0.005).onChange(() => this.emit(onChange));
    pitch.add(this.config.aero, 'CmAlpha', 0.2, 2.2, 0.02).onChange(() => this.emit(onChange));
    pitch.add(this.config.aero, 'CmElevator', -2.5, -0.2, 0.02).onChange(() => this.emit(onChange));
    pitch.add(this.config.aero, 'Cmq', -16, -1, 0.1).onChange(() => this.emit(onChange));

    const roll = this.gui.addFolder('Aero / Roll');
    roll.add(this.config.aero, 'ClAileron', 0.05, 0.5, 0.01).onChange(() => this.emit(onChange));
    roll.add(this.config.aero, 'ClRudder', -0.12, 0.12, 0.005).onChange(() => this.emit(onChange));
    roll.add(this.config.aero, 'Clp', -1.3, -0.1, 0.01).onChange(() => this.emit(onChange));

    const yaw = this.gui.addFolder('Aero / Yaw');
    yaw.add(this.config.aero, 'CYBeta', -1.6, -0.2, 0.02).onChange(() => this.emit(onChange));
    yaw.add(this.config.aero, 'CYRudder', 0, 0.45, 0.01).onChange(() => this.emit(onChange));
    yaw.add(this.config.aero, 'CnBeta', 0, 0.35, 0.01).onChange(() => this.emit(onChange));
    yaw.add(this.config.aero, 'CnRudder', -0.3, 0.2, 0.01).onChange(() => this.emit(onChange));
    yaw.add(this.config.aero, 'CnAileron', -0.12, 0.08, 0.005).onChange(() => this.emit(onChange));
    yaw.add(this.config.aero, 'Cnr', -0.6, -0.02, 0.01).onChange(() => this.emit(onChange));

    const control = this.gui.addFolder('Control / Keyboard Assist');
    control.add(this.config.control, 'keyboardPressRate', 0.25, 2.5, 0.05).onChange(() => this.emit(onChange));
    control.add(this.config.control, 'keyboardReturnRate', 0.5, 4, 0.05).onChange(() => this.emit(onChange));
    control.add(this.config.control, 'keyboardPitchLimit', 0.2, 1, 0.01).onChange(() => this.emit(onChange));
    control.add(this.config.control, 'keyboardRollLimit', 0.2, 1, 0.01).onChange(() => this.emit(onChange));
    control.add(this.config.control, 'surfaceExpo', 1, 2.5, 0.05).onChange(() => this.emit(onChange));

    const assist = this.gui.addFolder('Control / Stability Assist');
    assist.add(this.config.control, 'pitchDampingAssist', 0, 1.2, 0.02).onChange(() => this.emit(onChange));
    assist.add(this.config.control, 'pitchAttitudeAssist', 0, 0.6, 0.01).onChange(() => this.emit(onChange));
    assist.add(this.config.control, 'rollDampingAssist', 0, 1.2, 0.02).onChange(() => this.emit(onChange));
    assist.add(this.config.control, 'rollLevelAssist', 0, 1.5, 0.02).onChange(() => this.emit(onChange));
    assist.add(this.config.control, 'yawDamperAssist', 0, 1.2, 0.02).onChange(() => this.emit(onChange));
    assist.add(this.config.control, 'turnCoordinationAssist', 0, 0.6, 0.01).onChange(() => this.emit(onChange));
    assist.add(this.config.control, 'sideSlipAssist', 0, 1.5, 0.02).onChange(() => this.emit(onChange));

    const autopilot = this.gui.addFolder('Control / Autopilot');
    autopilot.add(this.config.autopilot, 'engageAirspeed', 28, 80, 0.5).onChange(() => this.emit(onChange));
    autopilot.add(this.config.autopilot, 'engageAltitude', 0.5, 20, 0.5).onChange(() => this.emit(onChange));
    autopilot.add(this.config.autopilot, 'waypointRadius', 30, 500, 5).onChange(() => this.emit(onChange));
    autopilot.add(this.config.autopilot, 'headingKp', 0.2, 2.5, 0.05).onChange(() => this.emit(onChange));
    autopilot.add(this.config.autopilot, 'pitchKp', 0.5, 5, 0.05).onChange(() => this.emit(onChange));
    autopilot.add(this.config.autopilot, 'pitchKd', 0, 3, 0.05).onChange(() => this.emit(onChange));
    autopilot.add(this.config.autopilot, 'rollKp', 0.5, 4, 0.05).onChange(() => this.emit(onChange));
    autopilot.add(this.config.autopilot, 'rollKd', 0, 2, 0.05).onChange(() => this.emit(onChange));

    const engine = this.gui.addFolder('Engine');
    engine.add(this.config.engine, 'engineCount', 1, 4, 1).onChange(() => this.emit(onChange));
    engine.add(this.config.engine, 'maxThrust', 8000, 50000, 100).onChange(() => this.emit(onChange));
    engine.add(this.config.engine, 'engineTimeConstant', 0.2, 4, 0.05).onChange(() => this.emit(onChange));
    engine.add(this.config.engine, 'thrustLapseAtMaxSpeed', 0.35, 0.9, 0.01).onChange(() => this.emit(onChange));

    const wind = this.gui.addFolder('Environment / Wind');
    wind.add(this.config.environment, 'windX', -12, 12, 0.1).name('Wind X').onChange(() => this.emit(onChange));
    wind.add(this.config.environment, 'windY', -4, 4, 0.1).name('Wind Y').onChange(() => this.emit(onChange));
    wind.add(this.config.environment, 'windZ', -12, 12, 0.1).name('Wind Z').onChange(() => this.emit(onChange));

    const actions = {
      export: () => {
        navigator.clipboard?.writeText(JSON.stringify(this.config, null, 2));
      },
      import: () => {
        const raw = window.prompt('Paste tuning JSON');
        if (!raw) {
          return;
        }
        try {
          this.config = mergeConfig(this.config, JSON.parse(raw) as Partial<AircraftConfig>);
          this.emit(onChange);
        } catch {
          window.alert('Invalid tuning JSON');
        }
      },
      save: () => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.config));
      },
      reset: () => {
        localStorage.removeItem(STORAGE_KEY);
        window.location.reload();
      },
    };
    const debug = this.gui.addFolder('Debug');
    debug.add(actions, 'export').name('Copy JSON');
    debug.add(actions, 'import').name('Import JSON');
    debug.add(actions, 'save').name('Save local');
    debug.add(actions, 'reset').name('Reset config');

    onChange(cloneAircraftConfig(this.config));
  }

  getConfig(): AircraftConfig {
    return cloneAircraftConfig(this.config);
  }

  toggle(): void {
    this.visible = !this.visible;
    if (this.visible) {
      this.gui.show();
    } else {
      this.gui.hide();
    }
  }

  destroy(): void {
    this.gui.destroy();
  }

  private emit(onChange: (config: AircraftConfig) => void): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.config));
    onChange(cloneAircraftConfig(this.config));
  }
}

function loadConfig(defaultConfig: AircraftConfig): AircraftConfig {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return cloneAircraftConfig(defaultConfig);
  }

  try {
    return mergeConfig(defaultConfig, JSON.parse(raw) as Partial<AircraftConfig>);
  } catch {
    return cloneAircraftConfig(defaultConfig);
  }
}

function mergeConfig(base: AircraftConfig, patch: Partial<AircraftConfig>): AircraftConfig {
  const next = cloneAircraftConfig(base);
  return {
    ...next,
    ...patch,
    inertia: { ...next.inertia, ...patch.inertia },
    aero: { ...next.aero, ...patch.aero },
    engine: { ...next.engine, ...patch.engine },
    surfaces: { ...next.surfaces, ...patch.surfaces },
    stall: { ...next.stall, ...patch.stall },
    control: { ...next.control, ...patch.control },
    autopilot: { ...next.autopilot, ...patch.autopilot },
    ground: { ...next.ground, ...patch.ground },
    environment: { ...next.environment, ...patch.environment },
  };
}
