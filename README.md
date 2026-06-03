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

## MVP Scope

The implementation includes fixed-step flight dynamics, keyboard/mouse/gamepad input, simplified aerodynamic and ground models, stall behavior, HUD/debug overlays, live tuning, replay recording, Free Flight, Landing Challenge, and automated functional tests.
