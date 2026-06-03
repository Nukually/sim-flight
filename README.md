# SkyLoop MVP

Web flight simulation MVP based on `web_flight_mvp_design.docx`.

## Run

```bash
npm install
npm run dev -- --port 5173
```

Open `http://127.0.0.1:5173/`.

## Test

```bash
npm test
npm run build
npm audit
```

## Controls

Keyboard input uses a softened virtual stick by default. Hold keys briefly for small corrections; releasing the keys lets the stability assist damp pitch/yaw and roll the wings back toward level.

- `W/S` or arrow up/down: pitch
- `A/D` or arrow left/right: roll
- `Q/E`: rudder
- `+/-`: throttle up/down
- `1/2/3`: throttle 0/50/100%
- `F/V`: flap down/up
- `[` and `]`: pitch trim
- `Space`: brake
- `H`: HUD
- `F1`: debug panel
- `F2`: reset
- `F3`: record replay
- `F4`: play replay
- `C`: camera mode

For takeoff, use `3` for full throttle, wait until roughly `60 kt`, then hold a small amount of `S` until the aircraft lifts off. Avoid holding full pitch for more than a moment; the flight control assist works best with short corrections.

## MVP Scope

The implementation includes fixed-step flight dynamics, keyboard/mouse/gamepad input, wind-axis aerodynamic force resolution, induced drag, adverse yaw, yaw damping, keyboard stability assist, ground models, stall behavior, HUD/debug overlays, live tuning, replay recording, Free Flight, Landing Challenge, and automated functional tests.

## Flight Model Notes

The flight model follows the MVP design while borrowing practical fixed-wing principles from FAA and NASA references: lift/drag are aerodynamic forces tied to motion through air, density affects aircraft performance, drag includes a lift-induced component, and coordinated turns need yaw/roll coupling rather than ailerons alone.

- NASA Glenn: Four Forces on an Airplane
- NASA Glenn: What is Drag?
- FAA PHAK: Principles of Flight, Aerodynamics of Flight, Flight Controls
