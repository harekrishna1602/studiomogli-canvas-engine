'use client'

import { useEffect, useRef } from 'react'
import { useEngineStore } from '@/lib/store'

/**
 * FPSTracker — measures real render FPS and writes to global store.
 * Mount once at the app root.
 */
export default function FPSTracker() {
  const setFps = useEngineStore((s) => s.setFps)
  const samples = useRef<number[]>([])
  const last    = useRef(performance.now())
  const rafRef  = useRef<number | null>(null)

  useEffect(() => {
    const tick = () => {
      rafRef.current = requestAnimationFrame(tick)
      const now = performance.now()
      const dt  = now - last.current
      last.current = now
      if (dt > 0) {
        samples.current.push(1000 / dt)
        if (samples.current.length > 30) samples.current.shift()
        const avg =
          samples.current.reduce((a, b) => a + b, 0) / samples.current.length
        setFps(Math.round(avg))
      }
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    }
  }, [setFps])

  return null
}
