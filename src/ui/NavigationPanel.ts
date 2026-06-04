import type { Waypoint, WorldState } from '../simulation/WorldState';

type NavigationPanelActions = {
  setWaypoints: (waypoints: Waypoint[]) => void;
  clearWaypoints: () => void;
};

export class NavigationPanel {
  readonly root: HTMLDivElement;
  private readonly canvas: HTMLCanvasElement;
  private readonly context: CanvasRenderingContext2D;
  private readonly input: HTMLTextAreaElement;
  private readonly status: HTMLDivElement;

  constructor(parent: HTMLElement, private readonly actions: NavigationPanelActions) {
    this.root = document.createElement('div');
    this.root.className = 'nav-panel';

    const header = document.createElement('div');
    header.className = 'nav-panel-header';
    header.textContent = 'Map / Waypoints';

    this.canvas = document.createElement('canvas');
    this.canvas.width = 260;
    this.canvas.height = 180;
    this.context = this.canvas.getContext('2d')!;

    this.input = document.createElement('textarea');
    this.input.ariaLabel = 'Waypoints';
    this.input.placeholder = '0,1200\n600,2200\n-400,3400';
    this.input.value = '0,1600\n500,2600\n-300,3800';

    const controls = document.createElement('div');
    controls.className = 'nav-panel-controls';
    controls.append(
      button('Set', () => this.applyWaypoints()),
      button('Clear', () => {
        this.actions.clearWaypoints();
        this.status.textContent = 'No route';
      }),
    );

    this.status = document.createElement('div');
    this.status.className = 'nav-panel-status';
    this.status.textContent = 'No route';

    this.root.append(header, this.canvas, this.input, controls, this.status);
    parent.append(this.root);
  }

  update(state: WorldState): void {
    this.drawMap(state);
    const active = state.navigation.waypoints[state.navigation.activeIndex];
    if (active) {
      const dx = active.x - state.aircraft.position.x;
      const dz = active.z - state.aircraft.position.z;
      this.status.textContent = `${active.label} ${Math.hypot(dx, dz).toFixed(0)} m`;
    } else if (state.navigation.waypoints.length > 0) {
      this.status.textContent = `Route complete (${state.navigation.reachedCount})`;
    }
  }

  private applyWaypoints(): void {
    const waypoints = parseWaypoints(this.input.value);
    this.actions.setWaypoints(waypoints);
    this.status.textContent = waypoints.length > 0 ? `${waypoints.length} waypoint(s)` : 'No route';
  }

  private drawMap(state: WorldState): void {
    const ctx = this.context;
    const width = this.canvas.width;
    const height = this.canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const scale = 0.055;
    const aircraft = state.aircraft;

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#071018';
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = 'rgba(144, 220, 255, 0.18)';
    ctx.lineWidth = 1;
    for (let x = centerX % 40; x < width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = centerY % 40; y < height; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 3;
    const runwayX = centerX - aircraft.position.x * scale;
    ctx.beginPath();
    ctx.moveTo(runwayX, centerY + (aircraft.position.z + 900) * scale);
    ctx.lineTo(runwayX, centerY + (aircraft.position.z - 1600) * scale);
    ctx.stroke();

    const points = state.navigation.waypoints.map((waypoint) => ({
      x: centerX + (waypoint.x - aircraft.position.x) * scale,
      y: centerY - (waypoint.z - aircraft.position.z) * scale,
      label: waypoint.label,
    }));
    if (points.length > 1) {
      ctx.strokeStyle = '#ffd76a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (const point of points.slice(1)) {
        ctx.lineTo(point.x, point.y);
      }
      ctx.stroke();
    }

    points.forEach((point, index) => {
      ctx.fillStyle = index === state.navigation.activeIndex ? '#79f2a5' : '#ffd76a';
      ctx.beginPath();
      ctx.arc(point.x, point.y, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#eaf8ff';
      ctx.font = '11px system-ui';
      ctx.fillText(point.label, point.x + 7, point.y - 7);
    });

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate((aircraft.derived.heading * Math.PI) / 180);
    ctx.fillStyle = '#6ecbff';
    ctx.beginPath();
    ctx.moveTo(0, -10);
    ctx.lineTo(7, 9);
    ctx.lineTo(0, 5);
    ctx.lineTo(-7, 9);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    ctx.fillStyle = '#9edfff';
    ctx.font = '11px system-ui';
    ctx.fillText(`${aircraft.derived.heading.toFixed(0)} deg`, 8, height - 8);
  }
}

function parseWaypoints(value: string): Waypoint[] {
  return value
    .split(/\n+/)
    .map((line, index) => {
      const [x, z, label] = line.split(',').map((part) => part.trim());
      return {
        x: Number(x),
        z: Number(z),
        label: label || `WP${index + 1}`,
      };
    })
    .filter((waypoint) => Number.isFinite(waypoint.x) && Number.isFinite(waypoint.z));
}

function button(label: string, onClick: () => void): HTMLButtonElement {
  const element = document.createElement('button');
  element.type = 'button';
  element.textContent = label;
  element.addEventListener('click', onClick);
  return element;
}
