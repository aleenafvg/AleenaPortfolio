# Kinetic Letters — Interactive Portfolio

A portfolio-ready React + Three.js demo featuring beveled 3D typography, soft collisions, bouncing, cursor repulsion, and scroll-triggered scattering. This is an original implementation inspired by the general interaction pattern of physics-based 3D portfolio effects; it is not the source code or an exact copy of the paid Framer component.

## Run locally

Requires Node.js 20.19+ or 22.12+.

```bash
npm install
npm run dev
```

Open the local URL printed by Vite (normally `http://localhost:5173`).

Create a production build:

```bash
npm run build
npm run preview
```

## Customize it

- **3D letters, colors and physics:** `src/LetterField.jsx`
  - `PALETTE`: letter colors.
  - `CHARS`: possible glyphs.
  - `count`: desktop/mobile glyph count.
  - `scrollBurst` handling: how strongly scrolling scatters the glyphs.
  - collision response, gravity, damping and pointer repulsion are all in this file.
- **Portfolio copy and sample projects:** `src/App.jsx`
- **Visual styling and responsive layout:** `src/styles.css`
- Replace `hello@example.com`, the sample project rows, and `YOUR NAME` with your own details.

## Performance notes

The canvas is capped at 1.7x device pixel ratio. The glyph count is 39 on desktop and 25 on smaller screens. Collision detection is pairwise, which is suitable for this small number of bodies. Reduce `count` if testing on older mobile devices. The component responds to `prefers-reduced-motion` by disabling the physics impulses and movement.

## Add the component to an existing React portfolio

Copy `src/LetterField.jsx` into your project and render `<LetterField />` once near the top-level layout. Install `three` and ensure Vite can resolve its example font JSON import. The demo's global styles are in `src/styles.css`; copy only the `.letter-field` rule if you are integrating the canvas into an existing design. The canvas reads page scroll and pointer movement at the window level, so it can work behind your own sections.

## Notes

- The demo imports the bold Helvetiker typeface JSON included with Three.js.
- Google Fonts are used for the portfolio typography; the 3D scene itself does not depend on Google Fonts.
- Since the exact original source is not available here, the motion and layout are an independently implemented interpretation rather than a pixel-perfect reproduction.
