import type { MissionMode } from '../simulation/WorldState';

export type MenuActions = {
  reset: () => void;
  toggleHud: () => void;
  toggleDebug: () => void;
  cycleCamera: () => void;
  saveReplay: () => void;
  playReplay: () => void;
  enableAudio: () => void;
  setMode: (mode: MissionMode) => void;
};

export function createControlStrip(parent: HTMLElement, actions: MenuActions): HTMLDivElement {
  const strip = document.createElement('div');
  strip.className = 'control-strip';

  strip.append(
    button('Reset', actions.reset),
    button('HUD', actions.toggleHud),
    button('Debug', actions.toggleDebug),
    button('Camera', actions.cycleCamera),
    button('Record', actions.saveReplay),
    button('Replay', actions.playReplay),
    button('Audio', actions.enableAudio),
  );

  const mode = document.createElement('select');
  mode.ariaLabel = 'Mode';
  const free = new Option('Free Flight', 'free-flight');
  const landing = new Option('Landing Challenge', 'landing-challenge');
  mode.append(free, landing);
  mode.addEventListener('change', () => actions.setMode(mode.value as MissionMode));
  strip.append(mode);

  parent.append(strip);
  return strip;
}

function button(label: string, onClick: () => void): HTMLButtonElement {
  const element = document.createElement('button');
  element.type = 'button';
  element.textContent = label;
  element.addEventListener('click', onClick);
  return element;
}
