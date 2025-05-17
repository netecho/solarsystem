# Solar System 3D Simulation

This project provides a simple 3D visualization of the solar system built with [Three.js](https://threejs.org/). It renders the Sun, planets and their moons with controls for adjusting the view and simulation speed. The interface supports both desktop and mobile devices.

## Prerequisites

- A modern web browser with JavaScript enabled and WebGL support (Chrome, Firefox, Safari, Edge, etc.).
- Optionally, a small HTTP server if you want to avoid potential cross-origin restrictions when opening files directly from disk.

## Running the Demo

1. Clone or download this repository.
2. Open `index.html` in your browser. You can double‑click the file or serve it via a local web server.
3. If textures or other resources fail to load when opened directly, start a simple server from the project directory and browse to `index.html` from that server. For example using Python 3:

   ```bash
   python3 -m http.server 8000
   ```

   Then visit `http://localhost:8000/index.html` in your browser.

## Usage

Use your mouse (or touch on mobile) to rotate, zoom and explore the planets. Additional controls are available in the on-screen panel.

Enjoy exploring the solar system!
=======
# solarsystem

## Running tests

A validation script ensures `index.html` parses correctly and that any local
asset references exist. Run it with:

```bash
python3 validate_html.py
```

The same script runs automatically in CI when you open a pull request or push
changes.

