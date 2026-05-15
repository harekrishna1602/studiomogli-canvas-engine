# StudioMogli Canvas Engine

> A real-time cinematic motion engine that transforms audio into living, breathing visual worlds.

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        BROWSER                              │
│                                                             │
│  ┌─────────────┐    ┌──────────────────────────────────┐   │
│  │  Web Audio  │───▶│       AudioEngine.ts              │   │
│  │  API / Mic  │    │  FFT · Beat Detection · BPM       │   │
│  └─────────────┘    └──────────────┬───────────────────┘   │
│                                    │ AnalysisFrame/frame    │
│                                    ▼                        │
│                        ┌───────────────────┐               │
│                        │   Zustand Store    │               │
│                        │  audioData·params  │               │
│                        │  palette·scene·fps │               │
│                        └────────┬──────────┘               │
│                                 │ subscribeWithSelector     │
│          ┌──────────────────────┼──────────────────┐        │
│          ▼                      ▼                  ▼        │
│   ┌──────────┐        ┌──────────────┐    ┌────────────┐   │
│   │LeftPanel │        │ SceneCanvas  │    │RightPanel  │   │
│   │· Upload  │        │ React Three  │    │· Sliders   │   │
│   │· Waveform│        │ Fiber (R3F)  │    │· Palette   │   │
│   │· Scenes  │        │              │    │· Export    │   │
│   │· Analysis│        │ ┌──────────┐ │    └────────────┘   │
│   └──────────┘        │ │ Active   │ │                      │
│                        │ │ Scene   │ │                      │
│                        │ │GLSL/GPU │ │                      │
│                        │ └──────────┘ │                      │
│                        │              │                      │
│                        │ PostFX:      │                      │
│                        │ Bloom+CA+Vig │                      │
│                        └──────────────┘                      │
└─────────────────────────────────────────────────────────────┘
```

---

## Rendering Pipeline

```
AudioFile/Mic
    │
    ▼
Web Audio API
    │ createMediaElementSource / createMediaStreamSource
    ▼
AnalyserNode (FFT 2048)
    │
    ▼
AudioEngine.computeFrame()
    ├── band-pass sum: bass (0–250Hz)
    ├── band-pass sum: mids (250–2kHz)
    ├── band-pass sum: highs (2–8kHz)
    ├── vocal range (300–3400Hz)
    ├── beat detection (adaptive threshold)
    ├── BPM estimation (IOI histogram)
    └── exponential smoothing (α=0.08–0.15)
         │
         ▼
  Zustand Store (setAudioData)
         │
         ▼
  React Three Fiber useFrame()
         │
         ├── uniform upload to ShaderMaterial
         │     ├── uBass, uMids, uHighs, uVocal
         │     ├── uEnergy, uBeatPhase, uTime
         │     └── uPrimaryColor, uColorShift, ...
         │
         ├── camera.position updated each frame
         │
         └── Three.js → WebGL2 → GPU
               ├── Vertex shader: geometry displacement
               ├── Fragment shader: color/alpha
               └── PostProcessing: Bloom + CA + Vignette
```

---

## Audio Analysis Flow

| Band      | Hz Range  | Maps To                        |
|-----------|-----------|--------------------------------|
| Bass      | 0–250     | Terrain height, beat flash     |
| Mids      | 250–2k    | Grid wave, particle turbulence |
| Highs     | 2k–8k     | Fine detail, shimmer           |
| Vocal     | 300–3.4k  | Particle scatter/orbit force   |
| Energy    | Weighted  | Camera, bloom, fog intensity   |
| BeatPhase | Transient | Flash, push, camera jolt       |

---

## Folder Structure

```
studiomogli/
├── app/
│   ├── layout.tsx          Root layout + metadata
│   ├── page.tsx            Landing ↔ App router
│   ├── globals.css         Design tokens + base styles
│   └── api/
│       └── ai-scene/
│           └── route.ts    AI scene gen API stub
│
├── components/
│   ├── landing/
│   │   └── LandingPage.tsx Full marketing landing page
│   ├── engine/
│   │   ├── StudioApp.tsx   3-panel app shell
│   │   ├── SceneCanvas.tsx R3F canvas + postprocessing
│   │   └── FPSTracker.tsx  Global FPS measurement
│   ├── scenes/
│   │   ├── TerrainScene.tsx GLSL topographic terrain
│   │   ├── ParticleScene.tsx GPU particle void
│   │   └── GridScene.tsx   Frequency grid world
│   └── ui/
│       ├── AppHeader.tsx   Status bar + navigation
│       ├── LeftPanel.tsx   Upload, transport, analysis
│       ├── RightPanel.tsx  Params, palette, export
│       └── SceneHUD.tsx    In-canvas HUD overlays
│
├── lib/
│   ├── store.ts            Zustand global state
│   ├── utils.ts            Math/color/format helpers
│   ├── scenes.ts           Scene registry + configs
│   ├── audio/
│   │   ├── AudioEngine.ts  Core Web Audio pipeline
│   │   └── BPMEstimator.ts IOI-based BPM detection
│   ├── export/
│   │   └── ExportEngine.ts MediaRecorder MP4 export
│   └── shaders/
│       ├── terrain.vert    Terrain displacement
│       ├── terrain.frag    Contour line rendering
│       ├── particle.vert   Particle orbital motion
│       ├── particle.frag   Glow/star/ring rendering
│       ├── grid.vert       Grid wave displacement
│       └── grid.frag       Grid line + horizon glow
│
├── hooks/
│   └── index.ts            useAudioEngine, useAnimationFrame,
│                           useFPS, useWaveform, useAudioDropzone
│
├── types/
│   └── shaders.d.ts        GLSL module declarations
│
├── tailwind.config.ts      Design token extension
├── next.config.js          GLSL raw-loader, package opts
├── tsconfig.json           Path aliases (@/*)
└── package.json            All dependencies
```

---

## Getting Started

```bash
# Install
npm install

# Add raw-loader for GLSL
npm install --save-dev raw-loader

# Development
npm run dev

# Production build
npm run build && npm start
```

Open `http://localhost:3000`

---

## Optimization Strategy

### Rendering
- `dpr={[1, 2]}` — capped at 2× for retina without over-rendering
- `powerPreference: 'high-performance'` — requests discrete GPU
- `AdditiveBlending` — GPU-composited glow without overdraw cost
- `depthWrite: false` — transparent geometry skip depth buffer writes
- `BufferGeometry` with typed arrays — zero-copy GPU uploads
- Uniforms updated in `useFrame` (not React renders) — 60fps safe

### Audio
- `smoothingTimeConstant: 0.8` on AnalyserNode — native smoothing
- Additional EMA in `computeFrame` — per-band independent smoothing
- Demo mode with fake data — no audio context required on load

### React
- `subscribeWithSelector` — components only re-render on their slice
- Scene components memoize geometry (`useMemo`) — no re-allocation
- `dynamic(() => import(...), { ssr: false })` — Three.js excluded from SSR bundle
- `useRef` for uniforms — avoids React reconciliation overhead

---

## Future Roadmap

| Feature | Status |
|---------|--------|
| 3 cinematic scenes | ✅ |
| Audio file upload | ✅ |
| Microphone recording | ✅ |
| Real-time analysis | ✅ |
| BPM detection | ✅ |
| Visual parameter controls | ✅ |
| Color palettes | ✅ |
| MP4 export (MediaRecorder) | ✅ |
| AI scene generation | 🔜 `/api/ai-scene` |
| Cloud rendering | 🔜 |
| Collaborative sessions | 🔜 |
| Custom GLSL scene editor | 🔜 |
| NFT/live visual minting | 🔜 |
| Mobile app (React Native) | 🔜 |
| VST plugin bridge | 🔜 |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| UI | React 18 + Tailwind CSS |
| Animation | Framer Motion |
| 3D | Three.js + React Three Fiber |
| Postprocessing | @react-three/postprocessing |
| Audio | Web Audio API |
| State | Zustand (subscribeWithSelector) |
| Types | TypeScript 5 (strict) |
| Shaders | GLSL (inline + .glsl files) |

---

*"A creative operating system for cinematic audio identity."*
