# Thirst to Thrive

**Every Drop Gives Hope. Every Village Can Thrive.**

Thirst to Thrive is a story-driven educational browser adventure. You play as a young explorer helping Village Kumbala restore its broken water system. There are no enemies to fight: progress comes from finding clean water, recovering tools, repairing the hand pump, and working with the community.

The project uses plain HTML, CSS, and beginner-readable JavaScript. It has no dependencies, backend, build step, canvas, or framework.

## Run the game

Open `index.html` directly, or serve the folder locally:

```powershell
cd F:\Internship26\GloabalCareerAcc\05-charity-water-game-prototype
python -m http.server 8000
```

Then visit `http://localhost:8000`.

## Controls

- Move with `WASD` or the arrow keys.
- Walk near a marked object and press `E` to interact.
- When the game world has focus, Enter and Space also interact.
- On phones and tablets, use the on-screen direction pad and Interact button.
- Use the mission-log button to review completed and upcoming missions.
- Use Pause to resume, restart the current mission, or return to the menu.
- Use the sound button to mute the generated ambience and feedback.

## Mission sequence

1. Find the clean spring.
2. Collect clean water.
3. Find the repair kit.
4. Repair the broken hand pump.
5. Deliver water to the village tank.
6. Celebrate the restored village with Amina.

Short educational facts appear between missions without blocking exploration. The dry environment gradually gains water and plant life as hope increases.

## Project structure

```text
05-charity-water-game-prototype/
├── index.html
├── style.css
├── script.js
├── README.md
├── assets/
│   ├── CREDITS.md
│   └── images/
│       ├── kumbala-savanna.png
│       └── savanna-world.svg
└── img/                      # Original starter assets, retained for reference
```

## How the JavaScript is organized

- `Game` coordinates the game loop and mission progression.
- `Player` stores movement, energy, position, and inventory.
- `Mission` represents one objective and its educational moment.
- `Village` stores hope and community-impact values.
- `UIManager` updates text, progress bars, screens, prompts, and camera position.
- `ObjectManager` tracks interactive world objects and proximity.
- `AudioManager` creates lightweight wind, bird, footstep, water, repair, and celebration feedback with the Web Audio API.

The game loop uses `requestAnimationFrame`. It measures the time between frames so movement remains consistent on faster and slower displays. Interactive scenery uses real DOM buttons rather than canvas, which preserves keyboard access and descriptive labels.

## Accessibility

- Native buttons for every interaction
- Keyboard and touch controls
- Visible focus indicators
- Live regions for mission feedback
- Accessible hope progress bar
- Large interaction targets
- High-contrast text and controls
- Sound mute control
- Reduced-motion support
- Labels and shapes that do not rely on color alone

## Important note

This is an educational experience inspired by charity: water's hope-focused mission and visual identity. In-game actions and impact values do not represent donations or promise real-world outcomes.

See [assets/CREDITS.md](assets/CREDITS.md) for asset information.
