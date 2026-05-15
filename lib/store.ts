import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'

// ─── Types ───────────────────────────────────────────────────────────────────

export type SceneId = 0 | 1 | 2

export interface AudioData {
  bass: number
  mids: number
  highs: number
  vocal: number
  energy: number
  bpm: number
  beatPhase: number
  // Smoothed versions (for visuals)
  smoothBass: number
  smoothMids: number
  smoothHighs: number
  smoothEnergy: number
  smoothVocal: number
  // Raw FFT
  frequencyData: Uint8Array | null
}

export interface VisualParams {
  bassIntensity: number
  particleDensity: number
  cameraSpeed: number
  bloomIntensity: number
  terrainScale: number
  colorShift: number
  fogDensity: number
  lineWidth: number
}

export type PaletteKey = 'ember' | 'ice' | 'void' | 'bio' | 'crimson' | 'gold' | 'cobalt'

export interface Palette {
  key: PaletteKey
  label: string
  primary: [number, number, number]    // [r, g, b] 0–1
  secondary: [number, number, number]
  hex: string
}

export interface AudioFile {
  name: string
  duration: number
  sizeBytes: number
  type: string
}

export interface EngineState {
  // Navigation
  scene: SceneId
  setScene: (s: SceneId) => void

  // Audio state
  audioData: AudioData
  setAudioData: (patch: Partial<AudioData>) => void

  // Playback
  isPlaying: boolean
  isRecording: boolean
  currentTime: number
  duration: number
  audioFile: AudioFile | null
  setIsPlaying: (v: boolean) => void
  setIsRecording: (v: boolean) => void
  setCurrentTime: (t: number) => void
  setDuration: (d: number) => void
  setAudioFile: (f: AudioFile | null) => void

  // Visual parameters
  params: VisualParams
  setParam: (key: keyof VisualParams, val: number) => void

  // Palette
  palette: Palette
  setPalette: (p: Palette) => void

  // Engine status
  fps: number
  setFps: (f: number) => void
  status: string
  setStatus: (s: string) => void

  // Export
  exportProgress: number
  isExporting: boolean
  setExportProgress: (p: number) => void
  setIsExporting: (v: boolean) => void
}

// ─── Palettes ─────────────────────────────────────────────────────────────────

export const PALETTES: Record<PaletteKey, Palette> = {
  ember:   { key: 'ember',   label: 'Ember',   primary: [1, 0.42, 0],     secondary: [1, 0.7, 0.1],   hex: '#FF6B00' },
  ice:     { key: 'ice',     label: 'Ice',     primary: [0, 0.9, 1],      secondary: [0.2, 0.5, 1],   hex: '#00E5FF' },
  void:    { key: 'void',    label: 'Void',    primary: [0.66, 0.33, 0.97], secondary: [0.4, 0.1, 0.8], hex: '#A855F7' },
  bio:     { key: 'bio',     label: 'Bio',     primary: [0.13, 0.77, 0.37], secondary: [0.3, 1, 0.5],  hex: '#22C55E' },
  crimson: { key: 'crimson', label: 'Crimson', primary: [0.96, 0.25, 0.36], secondary: [1, 0.1, 0.2],  hex: '#F43F5E' },
  gold:    { key: 'gold',    label: 'Gold',    primary: [0.92, 0.71, 0.03], secondary: [1, 0.9, 0.2],  hex: '#EAB308' },
  cobalt:  { key: 'cobalt',  label: 'Cobalt',  primary: [0.1, 0.4, 1],    secondary: [0.3, 0.6, 1],   hex: '#1966FF' },
}

// ─── Default audio data ───────────────────────────────────────────────────────

const defaultAudio: AudioData = {
  bass: 0, mids: 0, highs: 0, vocal: 0, energy: 0,
  bpm: 128, beatPhase: 0,
  smoothBass: 0, smoothMids: 0, smoothHighs: 0,
  smoothEnergy: 0, smoothVocal: 0,
  frequencyData: null,
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useEngineStore = create<EngineState>()(
  subscribeWithSelector((set) => ({
    // Scene
    scene: 0,
    setScene: (s) => set({ scene: s }),

    // Audio data
    audioData: defaultAudio,
    setAudioData: (patch) =>
      set((state) => ({ audioData: { ...state.audioData, ...patch } })),

    // Playback
    isPlaying: false,
    isRecording: false,
    currentTime: 0,
    duration: 0,
    audioFile: null,
    setIsPlaying: (v) => set({ isPlaying: v }),
    setIsRecording: (v) => set({ isRecording: v }),
    setCurrentTime: (t) => set({ currentTime: t }),
    setDuration: (d) => set({ duration: d }),
    setAudioFile: (f) => set({ audioFile: f }),

    // Params
    params: {
      bassIntensity: 1.0,
      particleDensity: 1.0,
      cameraSpeed: 1.0,
      bloomIntensity: 1.2,
      terrainScale: 1.0,
      colorShift: 0.0,
      fogDensity: 0.6,
      lineWidth: 1.0,
    },
    setParam: (key, val) =>
      set((state) => ({ params: { ...state.params, [key]: val } })),

    // Palette
    palette: PALETTES.ember,
    setPalette: (p) => set({ palette: p }),

    // Engine
    fps: 60,
    setFps: (f) => set({ fps: f }),
    status: 'READY',
    setStatus: (s) => set({ status: s }),

    // Export
    exportProgress: 0,
    isExporting: false,
    setExportProgress: (p) => set({ exportProgress: p }),
    setIsExporting: (v) => set({ isExporting: v }),
  }))
)
