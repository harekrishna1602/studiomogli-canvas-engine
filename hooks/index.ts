/**
 * hooks/index.ts — All custom hooks for StudioMogli
 */

import { useEffect, useRef, useCallback, useState } from 'react'
import { audioEngine, AnalysisFrame } from '@/lib/audio/AudioEngine'
import { useEngineStore } from '@/lib/store'

// ─── useAudioEngine ───────────────────────────────────────────────────────────

/**
 * Connects AudioEngine to the Zustand store.
 * Starts the analysis loop and feeds frames into global state.
 */
export function useAudioEngine() {
  const setAudioData = useEngineStore((s) => s.setAudioData)
  const setCurrentTime = useEngineStore((s) => s.setCurrentTime)
  const setDuration = useEngineStore((s) => s.setDuration)
  const setStatus = useEngineStore((s) => s.setStatus)
  const isRunning = useRef(false)

  useEffect(() => {
    if (isRunning.current) return
    isRunning.current = true

    audioEngine.startAnalysis((frame: AnalysisFrame) => {
      setAudioData({
        bass:         frame.bass,
        mids:         frame.mids,
        highs:        frame.highs,
        vocal:        frame.vocal,
        energy:       frame.energy,
        bpm:          frame.bpm,
        beatPhase:    frame.beatPhase,
        smoothBass:   frame.smoothBass,
        smoothMids:   frame.smoothMids,
        smoothHighs:  frame.smoothHighs,
        smoothEnergy: frame.smoothEnergy,
        smoothVocal:  frame.smoothVocal,
        frequencyData: frame.frequencyData,
      })
      if (frame.duration > 0) {
        setCurrentTime(frame.currentTime)
        setDuration(frame.duration)
      }
    })

    return () => {
      audioEngine.stopAnalysis()
      isRunning.current = false
    }
  }, [setAudioData, setCurrentTime, setDuration])

  const loadFile = useCallback(async (file: File) => {
    const el = audioEngine.loadFile(file)
    setStatus('AUDIO LOADED')
    el.addEventListener('ended', () => {
      useEngineStore.getState().setIsPlaying(false)
      setStatus('READY')
    })
    return el
  }, [setStatus])

  const play = useCallback(async () => {
    await audioEngine.play()
    useEngineStore.getState().setIsPlaying(true)
    setStatus('PLAYING')
  }, [setStatus])

  const pause = useCallback(() => {
    audioEngine.pause()
    useEngineStore.getState().setIsPlaying(false)
    setStatus('PAUSED')
  }, [setStatus])

  const stop = useCallback(() => {
    audioEngine.stop()
    useEngineStore.getState().setIsPlaying(false)
    setStatus('STOPPED')
  }, [setStatus])

  const startRecording = useCallback(async () => {
    await audioEngine.loadMicrophone()
    useEngineStore.getState().setIsRecording(true)
    setStatus('RECORDING')
  }, [setStatus])

  const stopRecording = useCallback(() => {
    audioEngine.stopMicrophone()
    useEngineStore.getState().setIsRecording(false)
    setStatus('READY')
  }, [setStatus])

  return { loadFile, play, pause, stop, startRecording, stopRecording }
}

// ─── useAnimationFrame ────────────────────────────────────────────────────────

/**
 * Calls callback every animation frame with delta time and elapsed time.
 */
export function useAnimationFrame(
  callback: (delta: number, elapsed: number) => void,
  active = true,
) {
  const rafRef = useRef<number | null>(null)
  const lastTimeRef = useRef<number | null>(null)
  const elapsedRef = useRef(0)
  const cbRef = useRef(callback)
  cbRef.current = callback

  useEffect(() => {
    if (!active) return

    const tick = (time: number) => {
      const last = lastTimeRef.current ?? time
      const delta = Math.min((time - last) / 1000, 0.05) // cap at 50ms
      elapsedRef.current += delta
      lastTimeRef.current = time
      cbRef.current(delta, elapsedRef.current)
      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
      lastTimeRef.current = null
    }
  }, [active])
}

// ─── useFPS ───────────────────────────────────────────────────────────────────

export function useFPS(): number {
  const [fps, setFps] = useState(60)
  const samples = useRef<number[]>([])
  const last = useRef(performance.now())

  useAnimationFrame(() => {
    const now = performance.now()
    const dt = now - last.current
    last.current = now
    samples.current.push(1000 / dt)
    if (samples.current.length > 30) samples.current.shift()
    const avg = samples.current.reduce((a, b) => a + b, 0) / samples.current.length
    setFps(Math.round(avg))
  })

  return fps
}

// ─── useWaveform ──────────────────────────────────────────────────────────────

export function useWaveform(file: File | null) {
  const [waveform, setWaveform] = useState<Float32Array | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!file) return
    setLoading(true)
    audioEngine.extractWaveform(file, 512).then((data) => {
      setWaveform(data)
      setLoading(false)
    })
  }, [file])

  return { waveform, loading }
}

// ─── useDropzone ──────────────────────────────────────────────────────────────

export function useAudioDropzone(onFile: (file: File) => void) {
  const [isDragging, setIsDragging] = useState(false)

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const onDragLeave = useCallback(() => setIsDragging(false), [])

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file?.type.startsWith('audio/')) onFile(file)
  }, [onFile])

  const onChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) onFile(file)
  }, [onFile])

  return { isDragging, onDragOver, onDragLeave, onDrop, onChange }
}
