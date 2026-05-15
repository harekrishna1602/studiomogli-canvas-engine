/**
 * AudioEngine — Core Web Audio API analysis pipeline
 *
 * Responsibilities:
 * - Initialize AudioContext + AnalyserNode
 * - Load and decode audio files
 * - Connect media element or microphone stream
 * - Real-time FFT analysis: bass / mids / highs / vocal / energy
 * - Beat detection via energy thresholding
 * - BPM estimation via inter-onset-interval analysis
 * - Smooth all values for visual consumption
 * - Emit analyzed data frame-by-frame via callback
 */

export interface AnalysisFrame {
  bass: number
  mids: number
  highs: number
  vocal: number
  energy: number
  bpm: number
  beatPhase: number
  smoothBass: number
  smoothMids: number
  smoothHighs: number
  smoothEnergy: number
  smoothVocal: number
  frequencyData: Uint8Array
  waveformData: Uint8Array
  currentTime: number
  duration: number
}

type AnalysisCallback = (frame: AnalysisFrame) => void

export class AudioEngine {
  private ctx: AudioContext | null = null
  private analyser: AnalyserNode | null = null
  private gainNode: GainNode | null = null
  private sourceNode: MediaElementAudioSourceNode | null = null
  private streamSource: MediaStreamAudioSourceNode | null = null
  private mediaElement: HTMLAudioElement | null = null
  private mediaStream: MediaStream | null = null

  // Analysis buffers
  private freqData: Uint8Array = new Uint8Array(1024)
  private timeData: Uint8Array = new Uint8Array(1024)

  // Smooth state
  private smooth = {
    bass: 0, mids: 0, highs: 0, energy: 0, vocal: 0, beatPhase: 0,
  }

  // Beat detection
  private beatHistory: number[] = []
  private lastBeatTime = 0
  private beatIntervals: number[] = []
  private bpmEstimate = 128
  private beatPhase = 0

  // Animation
  private rafId: number | null = null
  private onFrame: AnalysisCallback | null = null
  private isRunning = false

  // ─── Init ──────────────────────────────────────────────────────────────────

  init(): void {
    if (this.ctx) return
    this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
    this.analyser = this.ctx.createAnalyser()
    this.analyser.fftSize = 2048
    this.analyser.smoothingTimeConstant = 0.8
    this.gainNode = this.ctx.createGain()
    this.gainNode.gain.value = 1.0
    this.analyser.connect(this.gainNode)
    this.gainNode.connect(this.ctx.destination)
    this.freqData = new Uint8Array(this.analyser.frequencyBinCount)
    this.timeData = new Uint8Array(this.analyser.frequencyBinCount)
  }

  // ─── Audio File Loading ────────────────────────────────────────────────────

  loadFile(file: File): HTMLAudioElement {
    this.init()
    this.disconnectSource()

    const el = new Audio()
    el.src = URL.createObjectURL(file)
    el.crossOrigin = 'anonymous'
    this.mediaElement = el

    const src = this.ctx!.createMediaElementSource(el)
    this.sourceNode = src
    src.connect(this.analyser!)

    return el
  }

  async loadMicrophone(): Promise<void> {
    this.init()
    this.disconnectSource()

    this.mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
      },
    })

    this.streamSource = this.ctx!.createMediaStreamSource(this.mediaStream)
    this.streamSource.connect(this.analyser!)
  }

  stopMicrophone(): void {
    this.mediaStream?.getTracks().forEach((t) => t.stop())
    this.streamSource?.disconnect()
    this.streamSource = null
    this.mediaStream = null
  }

  // ─── Playback Control ─────────────────────────────────────────────────────

  async play(): Promise<void> {
    if (this.ctx?.state === 'suspended') await this.ctx.resume()
    await this.mediaElement?.play()
  }

  pause(): void {
    this.mediaElement?.pause()
  }

  stop(): void {
    if (this.mediaElement) {
      this.mediaElement.pause()
      this.mediaElement.currentTime = 0
    }
  }

  seek(time: number): void {
    if (this.mediaElement) this.mediaElement.currentTime = time
  }

  setVolume(v: number): void {
    if (this.gainNode) this.gainNode.gain.value = v
  }

  // ─── Analysis Loop ────────────────────────────────────────────────────────

  startAnalysis(cb: AnalysisCallback): void {
    this.onFrame = cb
    this.isRunning = true
    this.loop()
  }

  stopAnalysis(): void {
    this.isRunning = false
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId)
      this.rafId = null
    }
  }

  private loop = (): void => {
    if (!this.isRunning) return
    this.rafId = requestAnimationFrame(this.loop)

    if (!this.analyser) {
      this.emitDemo()
      return
    }

this.analyser.getByteFrequencyData(
  this.freqData as unknown as Uint8Array<ArrayBuffer>
);

this.analyser.getByteTimeDomainData(
  this.timeData as unknown as Uint8Array<ArrayBuffer>
);

const frame = this.computeFrame();

this.onFrame?.(frame);
};
  // ─── Frame Computation ────────────────────────────────────────────────────

  private computeFrame(): AnalysisFrame {
    const bins = this.freqData.length
    const nyquist = this.ctx!.sampleRate / 2
    const binHz = nyquist / bins

    // Frequency band boundaries (Hz → bin index)
    const bassEnd   = Math.floor(250 / binHz)   // 0–250 Hz
    const midsEnd   = Math.floor(2000 / binHz)  // 250–2000 Hz
    const highsEnd  = Math.floor(8000 / binHz)  // 2000–8000 Hz
    const vocalStart = Math.floor(300 / binHz)
    const vocalEnd   = Math.floor(3400 / binHz) // VOIP vocal range

    let bassSum = 0, midsSum = 0, highsSum = 0, vocalSum = 0

    for (let i = 0; i < bassEnd; i++)  bassSum  += this.freqData[i]
    for (let i = bassEnd; i < midsEnd; i++) midsSum  += this.freqData[i]
    for (let i = midsEnd; i < highsEnd; i++) highsSum += this.freqData[i]
    for (let i = vocalStart; i < vocalEnd; i++) vocalSum += this.freqData[i]

    const bass  = bassSum  / bassEnd / 255
    const mids  = midsSum  / (midsEnd  - bassEnd) / 255
    const highs = highsSum / (highsEnd - midsEnd) / 255
    const vocal = vocalSum / (vocalEnd - vocalStart) / 255
    const energy = bass * 0.5 + mids * 0.3 + highs * 0.2

    // Smooth (exponential moving average)
    const FAST = 0.15, SLOW = 0.08
    this.smooth.bass   += (bass   - this.smooth.bass)   * FAST
    this.smooth.mids   += (mids   - this.smooth.mids)   * FAST
    this.smooth.highs  += (highs  - this.smooth.highs)  * FAST
    this.smooth.energy += (energy - this.smooth.energy) * SLOW
    this.smooth.vocal  += (vocal  - this.smooth.vocal)  * FAST

    // Beat detection
    this.detectBeat(bass, energy)

    return {
      bass, mids, highs, vocal, energy,
      bpm: this.bpmEstimate,
      beatPhase: this.beatPhase,
      smoothBass:   this.smooth.bass,
      smoothMids:   this.smooth.mids,
      smoothHighs:  this.smooth.highs,
      smoothEnergy: this.smooth.energy,
      smoothVocal:  this.smooth.vocal,
      frequencyData: new Uint8Array(this.freqData),
      waveformData:  new Uint8Array(this.timeData),
      currentTime: this.mediaElement?.currentTime ?? 0,
      duration:    this.mediaElement?.duration ?? 0,
    }
  }

  // ─── Beat Detection ───────────────────────────────────────────────────────

  private detectBeat(bass: number, energy: number): void {
    // Adaptive threshold beat detection
    const now = performance.now()
    const threshold = 0.45

    if (bass > threshold && now - this.lastBeatTime > 300) {
      const interval = now - this.lastBeatTime
      if (interval > 0 && interval < 2000) {
        this.beatIntervals.push(interval)
        if (this.beatIntervals.length > 8) this.beatIntervals.shift()
        // Estimate BPM from median interval
        const sorted = [...this.beatIntervals].sort((a, b) => a - b)
        const median = sorted[Math.floor(sorted.length / 2)]
        this.bpmEstimate = Math.round(60000 / median)
        this.bpmEstimate = Math.max(60, Math.min(200, this.bpmEstimate))
      }
      this.beatPhase = 1.0
      this.lastBeatTime = now
    }

    // Decay beat phase
    this.beatPhase *= 0.88
  }

  // ─── Demo Mode (no audio) ─────────────────────────────────────────────────

  private demoTime = 0
  private emitDemo(): void {
    this.demoTime += 0.025
    const t = this.demoTime
    const bass  = Math.abs(Math.sin(t * 0.8)) * 0.4 + Math.abs(Math.sin(t * 2.1)) * 0.2
    const mids  = Math.abs(Math.sin(t * 1.3 + 1)) * 0.3 + 0.15
    const highs = Math.abs(Math.sin(t * 3.1 + 2)) * 0.2 + 0.1
    const vocal = mids * 0.6 + highs * 0.4
    const energy = bass * 0.5 + mids * 0.3 + highs * 0.2
    const FAST = 0.08
    this.smooth.bass   += (bass   - this.smooth.bass)   * FAST
    this.smooth.mids   += (mids   - this.smooth.mids)   * FAST
    this.smooth.highs  += (highs  - this.smooth.highs)  * FAST
    this.smooth.energy += (energy - this.smooth.energy) * FAST
    this.smooth.vocal  += (vocal  - this.smooth.vocal)  * FAST
    if (bass > 0.45 && performance.now() - this.lastBeatTime > 400) {
      this.beatPhase = 0.9
      this.lastBeatTime = performance.now()
    }
    this.beatPhase *= 0.88
    // Fake frequency data for grid scene
    const fakeFreq = new Uint8Array(1024)
    for (let i = 0; i < 1024; i++) {
      fakeFreq[i] = Math.floor(
        Math.abs(Math.sin(i * 0.05 + t * 2)) * 180 * (1 - i / 1024) +
        Math.random() * 20
      )
    }
    this.onFrame?.({
      bass, mids, highs, vocal, energy,
      bpm: this.bpmEstimate,
      beatPhase: this.beatPhase,
      smoothBass: this.smooth.bass, smoothMids: this.smooth.mids,
      smoothHighs: this.smooth.highs, smoothEnergy: this.smooth.energy,
      smoothVocal: this.smooth.vocal,
      frequencyData: fakeFreq,
      waveformData: new Uint8Array(1024).fill(128),
      currentTime: 0, duration: 0,
    })
  }

  // ─── Waveform Extraction ──────────────────────────────────────────────────

  async extractWaveform(file: File, sampleCount = 512): Promise<Float32Array> {
    const tmpCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
    const buffer = await file.arrayBuffer()
    const decoded = await tmpCtx.decodeAudioData(buffer)
    const data = decoded.getChannelData(0)
    const step = Math.floor(data.length / sampleCount)
    const waveform = new Float32Array(sampleCount)
    for (let i = 0; i < sampleCount; i++) {
      let max = 0
      for (let j = 0; j < step; j++) {
        max = Math.max(max, Math.abs(data[i * step + j] ?? 0))
      }
      waveform[i] = max
    }
    await tmpCtx.close()
    return waveform
  }

  // ─── Cleanup ──────────────────────────────────────────────────────────────

  private disconnectSource(): void {
    this.sourceNode?.disconnect()
    this.sourceNode = null
    if (this.mediaElement) {
      this.mediaElement.pause()
      this.mediaElement.src = ''
      this.mediaElement = null
    }
  }

  destroy(): void {
    this.stopAnalysis()
    this.stopMicrophone()
    this.disconnectSource()
    this.ctx?.close()
    this.ctx = null
  }

  // ─── Getters ──────────────────────────────────────────────────────────────

  get audioElement(): HTMLAudioElement | null { return this.mediaElement }
  get isContextReady(): boolean { return !!this.ctx }
  get sampleRate(): number { return this.ctx?.sampleRate ?? 44100 }
}

// Singleton
export const audioEngine = new AudioEngine()
