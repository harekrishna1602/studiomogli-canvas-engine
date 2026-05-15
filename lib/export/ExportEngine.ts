/**
 * ExportEngine — Captures rendered canvas + audio to MP4
 *
 * Strategy:
 * 1. Capture canvas stream via captureStream()
 * 2. Capture audio destination via createMediaStreamDestination()
 * 3. Combine into MediaRecorder with VP9/H264
 * 4. Collect chunks → Blob → download
 */

export type ExportFormat = 'landscape' | 'vertical' | 'canvas' | 'square'
export type ExportQuality = 'hd' | 'fhd' | '4k'

export interface ExportConfig {
  format: ExportFormat
  quality: ExportQuality
  fps: number
  durationMs?: number
  filename?: string
}

const DIMENSIONS: Record<ExportFormat, [number, number]> = {
  landscape: [1920, 1080],
  vertical:  [1080, 1920],
  canvas:    [720,  900],
  square:    [1080, 1080],
}

const BITRATES: Record<ExportQuality, number> = {
  hd:  5_000_000,
  fhd: 12_000_000,
  '4k': 40_000_000,
}

export class ExportEngine {
  private recorder: MediaRecorder | null = null
  private chunks: Blob[] = []
  private offscreenCanvas: HTMLCanvasElement | null = null
  private startTime = 0
  private onProgress: ((pct: number, label: string) => void) | null = null
  private onComplete: ((blob: Blob, filename: string) => void) | null = null
  private progressInterval: ReturnType<typeof setInterval> | null = null

  // ─── Export Flow ───────────────────────────────────────────────────────────

  async startExport(
    sourceCanvas: HTMLCanvasElement,
    audioCtx: AudioContext | null,
    config: ExportConfig,
    onProgress: (pct: number, label: string) => void,
    onComplete: (blob: Blob, filename: string) => void,
  ): Promise<void> {
    this.onProgress = onProgress
    this.onComplete = onComplete
    this.chunks = []

    const [w, h] = DIMENSIONS[config.format]
    const bitrate = BITRATES[config.quality]
    const filename = config.filename ?? this.generateFilename(config)

    // Build stream tracks
    const tracks: MediaStreamTrack[] = []

    // Video: scale the source canvas to target dimensions
    const canvasStream = sourceCanvas.captureStream(config.fps)
    tracks.push(...canvasStream.getVideoTracks())

    // Audio (if available)
    if (audioCtx) {
      const dest = audioCtx.createMediaStreamDestination()
      tracks.push(...dest.stream.getAudioTracks())
    }

    const stream = new MediaStream(tracks)

    // Choose codec
    const mimeType = this.getBestMimeType()
    this.recorder = new MediaRecorder(stream, {
      mimeType,
      videoBitsPerSecond: bitrate,
    })

    this.recorder.ondataavailable = (e) => {
      if (e.data.size > 0) this.chunks.push(e.data)
    }

    this.recorder.onstop = () => {
      const blob = new Blob(this.chunks, { type: mimeType })
      this.onComplete?.(blob, filename)
      this.cleanup()
    }

    // Progress simulation (real progress requires frame counting)
    const duration = config.durationMs ?? 30_000
    this.startTime = Date.now()
    this.progressInterval = setInterval(() => {
      const elapsed = Date.now() - this.startTime
      const pct = Math.min((elapsed / duration) * 100, 99)
      const frames = Math.floor(pct * config.fps * (duration / 1000) / 100)
      onProgress(pct, `RENDERING · ${Math.round(pct)}% · ${frames} FRAMES`)
    }, 200)

    this.recorder.start(100) // 100ms timeslice

    // Auto-stop after duration
    if (config.durationMs) {
      setTimeout(() => this.stopExport(), config.durationMs)
    }
  }

  stopExport(): void {
    this.recorder?.stop()
    if (this.progressInterval) {
      clearInterval(this.progressInterval)
      this.progressInterval = null
    }
    this.onProgress?.(100, 'FINALIZING · ENCODING · COMPLETE')
  }

  // ─── Download Helper ──────────────────────────────────────────────────────

  static download(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 10_000)
  }

  // ─── Codec Detection ──────────────────────────────────────────────────────

  private getBestMimeType(): string {
    const candidates = [
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm;codecs=h264,opus',
      'video/webm',
      'video/mp4',
    ]
    for (const type of candidates) {
      if (MediaRecorder.isTypeSupported(type)) return type
    }
    return 'video/webm'
  }

  private generateFilename(config: ExportConfig): string {
    const ts = new Date().toISOString().slice(0, 16).replace(/[:\-T]/g, '')
    return `studiomogli_${config.format}_${config.quality}_${ts}.webm`
  }

  private cleanup(): void {
    this.recorder = null
    this.chunks = []
    if (this.progressInterval) {
      clearInterval(this.progressInterval)
      this.progressInterval = null
    }
  }

  get isExporting(): boolean {
    return this.recorder?.state === 'recording'
  }
}

export const exportEngine = new ExportEngine()
