# PROJECT KNOWLEDGE BASE

**Generated:** 2026-01-18
**Branch:** main

## OVERVIEW

3D interactive solar system simulation using Three.js. Vanilla web app with Chinese UI, CDN dependencies, no build system.

## STRUCTURE

```
solarsystem/
├── index.html      # Entry point, loads CDN libs + app.js
├── js/
│   └── app.js      # Monolithic logic (~2000 lines): scene, planets, UI, chat
├── css/
│   └── style.css   # Styling + responsive/mobile overrides
├── README.md
└── LICENSE
```

## WHERE TO LOOK

| Task | Location | Notes |
|------|----------|-------|
| Planet data (names, orbits, colors) | `js/app.js:44-154` | `PLANET_DATA` object |
| Scene initialization | `js/app.js:190-302` | `init()` function |
| Animation loop | `js/app.js:1513-1547` | `animate()` function |
| Mobile detection/optimization | `js/app.js:304-449` | `checkMobileDevice()`, `setupMobileControls()` |
| Earth surface view | `js/app.js:998-1050` | `positionCameraOnEarthSurface()` |
| Chat/AI responses | `js/app.js:1651-1833` | `setupChatFeature()`, `generateResponse()` |
| Responsive styles | `css/style.css:257-517` | Media queries for mobile |

## CONVENTIONS

| Category | Convention |
|----------|------------|
| Indentation | 4 spaces |
| JS naming | `camelCase` functions/vars, `UPPER_SNAKE_CASE` constants |
| CSS naming | `kebab-case` IDs and classes |
| Comments | Chinese (Simplified) |
| UI text | Chinese (Simplified) |

## ANTI-PATTERNS (THIS PROJECT)

- **NO ES modules** - All code in global scope via single `app.js`
- **NO package manager** - Dependencies via CDN `<script>` tags
- **NO local assets** - Textures hot-linked from `threejs.org` (may break)
- **NO build/lint/test tooling** - Manual browser refresh workflow

## UNIQUE STYLES

- **Mobile speed reduction**: `MOBILE_SPEED_FACTOR = 0.5` halves animation on mobile
- **Texture fallback**: `loadTextureWithFallback()` creates solid color canvas if CDN fails
- **Dual chat interface**: Desktop sidebar chat + mobile bottom drawer chat
- **PIP view**: Picture-in-picture solar system overview (desktop only)

## COMMANDS

```bash
# No build system - open index.html directly in browser
# Or use any static server:
npx serve .
python -m http.server 8000
```

## NOTES

- **Three.js version**: 0.132.2 (pinned via CDN)
- **Touch gestures**: Hammer.js handles pinch/rotate on mobile
- **AI chat is mock**: `generateResponse()` uses hardcoded pattern matching, not real API
- **Monolith risk**: `app.js` mixes data, rendering, UI, chat - refactor if adding features
