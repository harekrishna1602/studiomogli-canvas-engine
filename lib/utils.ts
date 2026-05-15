import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

// ─── Tailwind class merge ─────────────────────────────────────────────────────

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ─── Time formatting ──────────────────────────────────────────────────────────

export function formatTime(seconds: number): string {
  if (!isFinite(seconds)) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`
}

// ─── Color utilities ──────────────────────────────────────────────────────────

/** Convert [r,g,b] 0–1 floats to hex string */
export function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (v: number) => Math.round(v * 255).toString(16).padStart(2, '0')
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

/** Linear interpolate between two [r,g,b] triples */
export function lerpColor(
  a: [number, number, number],
  b: [number, number, number],
  t: number,
): [number, number, number] {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]
}

// ─── Math helpers ────────────────────────────────────────────────────────────

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

export function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1)
  return t * t * (3 - 2 * t)
}

export function mapRange(
  value: number,
  inMin: number, inMax: number,
  outMin: number, outMax: number,
): number {
  return outMin + ((value - inMin) / (inMax - inMin)) * (outMax - outMin)
}

// ─── Audio helpers ────────────────────────────────────────────────────────────

/** Exponential moving average smoothing */
export function ema(current: number, target: number, alpha: number): number {
  return current + (target - current) * alpha
}

/** Convert linear amplitude to dB */
export function linearToDb(amplitude: number): number {
  return 20 * Math.log10(Math.max(amplitude, 1e-9))
}

/** Normalize frequency bin value from 0–255 to 0–1 */
export function normalizeBin(value: number): number {
  return value / 255
}

// ─── Random helpers ───────────────────────────────────────────────────────────

export function randomRange(min: number, max: number): number {
  return min + Math.random() * (max - min)
}

export function randomSign(): number {
  return Math.random() > 0.5 ? 1 : -1
}

/** Seeded hash (deterministic random) */
export function hash(n: number): number {
  return Math.abs(Math.sin(n * 127.1 + 311.7) * 43758.5453123) % 1
}

// ─── Device detection ─────────────────────────────────────────────────────────

export function getDevicePixelRatio(): number {
  return Math.min(window.devicePixelRatio ?? 1, 2)
}

export function isHighPerformance(): boolean {
  // Heuristic: 4+ CPU cores and device pixel ratio ≤ 2
  const cores = navigator.hardwareConcurrency ?? 4
  return cores >= 4
}
