/**
 * BPMEstimator — Robust BPM detection using multiple strategies
 *
 * Strategy 1: Inter-onset interval (IOI) from beat detection
 * Strategy 2: Auto-correlation on energy envelope
 * Strategy 3: Histogram peak of IOI distribution
 */

export class BPMEstimator {
  private intervals: number[] = []
  private lastBeatTime = 0
  private readonly MAX_HISTORY = 16
  private readonly MIN_INTERVAL_MS = 300   // 200 BPM max
  private readonly MAX_INTERVAL_MS = 1500  // 40 BPM min

  // Auto-correlation buffer
  private energyBuffer: number[] = []
  private readonly AC_BUFFER_SIZE = 512

  /**
   * Call this on every audio frame with current energy and bass values.
   * Returns updated BPM estimate when a beat is detected, else null.
   */
  processBeat(bass: number, energy: number, threshold = 0.45): number | null {
    const now = performance.now()

    // Update energy buffer for auto-correlation
    this.energyBuffer.push(energy)
    if (this.energyBuffer.length > this.AC_BUFFER_SIZE) {
      this.energyBuffer.shift()
    }

    // Beat detection: bass spike above threshold with refractory period
    if (bass > threshold && now - this.lastBeatTime > this.MIN_INTERVAL_MS) {
      const interval = now - this.lastBeatTime
      this.lastBeatTime = now

      if (interval < this.MAX_INTERVAL_MS) {
        this.intervals.push(interval)
        if (this.intervals.length > this.MAX_HISTORY) {
          this.intervals.shift()
        }
        return this.estimateBPM()
      }
    }

    return null
  }

  /**
   * Estimate BPM from interval history using histogram peak method.
   */
  private estimateBPM(): number {
    if (this.intervals.length < 2) return 128

    // Build histogram of intervals (20ms buckets)
    const BUCKET = 20
    const histogram: Map<number, number> = new Map()

    for (const interval of this.intervals) {
      // Also consider half-time and double-time harmonics
      const harmonics = [interval, interval * 2, interval / 2]
      for (const h of harmonics) {
        if (h >= this.MIN_INTERVAL_MS && h <= this.MAX_INTERVAL_MS) {
          const bucket = Math.round(h / BUCKET) * BUCKET
          histogram.set(bucket, (histogram.get(bucket) ?? 0) + 1)
        }
      }
    }

    // Find most common interval
    let maxCount = 0
    let bestInterval = 500

    histogram.forEach((count, interval) => {
      if (count > maxCount) {
        maxCount = count
        bestInterval = interval
      }
    })

    const bpm = Math.round(60000 / bestInterval)
    return Math.max(60, Math.min(200, bpm))
  }

  /**
   * Auto-correlation BPM from energy envelope (more accurate, heavier).
   * Returns BPM or null if buffer not large enough.
   */
  autoCorrelationBPM(sampleRate = 60): number | null {
    if (this.energyBuffer.length < this.AC_BUFFER_SIZE) return null

    const buf = this.energyBuffer
    const n = buf.length
    let bestLag = -1
    let bestCorr = -Infinity

    // Test lags corresponding to 60–200 BPM
    const minLag = Math.round((60 / 200) * sampleRate)
    const maxLag = Math.round((60 / 60) * sampleRate)

    for (let lag = minLag; lag <= maxLag; lag++) {
      let corr = 0
      for (let i = 0; i < n - lag; i++) {
        corr += (buf[i] ?? 0) * (buf[i + lag] ?? 0)
      }
      corr /= (n - lag)
      if (corr > bestCorr) {
        bestCorr = corr
        bestLag = lag
      }
    }

    if (bestLag <= 0) return null
    return Math.round((sampleRate / bestLag) * 60)
  }

  reset(): void {
    this.intervals = []
    this.energyBuffer = []
    this.lastBeatTime = 0
  }

  get hasEnoughData(): boolean {
    return this.intervals.length >= 3
  }
}
