'use client'

import { useRef, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useEngineStore } from '@/lib/store'
import { useFPS } from '@/hooks'

const SCENE_NAMES = ['Terrain Pulse', 'Particle Void', 'Audio Grid']
const CAMERA_MODES = ['FLOAT', 'ORBIT', 'SCAN']

interface SceneHUDProps {
  canvasRef: React.RefObject<HTMLCanvasElement>
}

export default function SceneHUD({ canvasRef }: SceneHUDProps) {
  const scene    = useEngineStore((s) => s.scene)
  const audioData = useEngineStore((s) => s.audioData)
  const status   = useEngineStore((s) => s.status)
  const fps      = useFPS()
  const [lastScene, setLastScene] = useState(scene)
  const [showSceneTag, setShowSceneTag] = useState(false)

  // Flash scene name on change
  useEffect(() => {
    if (scene !== lastScene) {
      setLastScene(scene)
      setShowSceneTag(true)
      const t = setTimeout(() => setShowSceneTag(false), 2500)
      return () => clearTimeout(t)
    }
  }, [scene, lastScene])

  return (
    <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 20 }}>

      {/* Top-left HUD */}
      <div className="absolute top-4 left-4" style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'rgba(255,107,0,0.55)', lineHeight: 2, letterSpacing: '0.12em' }}>
        <div>SCENE_ID · {String(scene + 1).padStart(3, '0')}</div>
        <div>RENDER · LIVE</div>
        <div>FPS · {fps}</div>
        <div style={{ color: 'rgba(255,107,0,0.35)' }}>ENGINE · WEBGL2</div>
      </div>

      {/* Top-right BPM */}
      <div className="absolute top-4 right-4 text-right">
        <motion.div
          key={audioData.bpm}
          initial={{ opacity: 0.4, y: -4 }}
          animate={{ opacity: 0.8, y: 0 }}
          transition={{ duration: 0.3 }}
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 42,
            fontWeight: 800,
            color: 'var(--orange)',
            lineHeight: 1,
            letterSpacing: '-0.02em',
          }}
        >
          {audioData.bpm}
        </motion.div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'rgba(136,136,128,0.7)', letterSpacing: '0.25em', textTransform: 'uppercase' }}>
          BPM
        </div>
      </div>

      {/* Bottom-left camera mode */}
      <div className="absolute bottom-4 left-4" style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'rgba(136,136,128,0.5)', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
        CAM · {CAMERA_MODES[scene]} MODE · AUTO
      </div>

      {/* Bottom-right status */}
      <div className="absolute bottom-4 right-4 flex items-center gap-2">
        <motion.div
          animate={{ opacity: status === 'PLAYING' || status === 'RECORDING' ? [1, 0.3] : 1 }}
          transition={{ duration: 0.8, repeat: Infinity, repeatType: 'reverse' }}
          style={{ width: 5, height: 5, borderRadius: '50%', background: status === 'RECORDING' ? '#ef4444' : status === 'PLAYING' ? '#22c55e' : 'rgba(255,107,0,0.5)' }}
        />
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'rgba(136,136,128,0.6)', letterSpacing: '0.2em' }}>
          {status}
        </span>
      </div>

      {/* Scene change overlay */}
      <AnimatePresence>
        {showSceneTag && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-x-0 flex items-center justify-center"
            style={{ top: '42%' }}
          >
            <div style={{
              background: 'rgba(8,8,8,0.6)',
              border: '1px solid rgba(255,107,0,0.2)',
              backdropFilter: 'blur(12px)',
              padding: '12px 32px',
            }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'rgba(255,107,0,0.5)', letterSpacing: '0.3em', marginBottom: 4, textTransform: 'uppercase' }}>
                SCENE {String(scene + 1).padStart(2, '0')}
              </div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.02em' }}>
                {SCENE_NAMES[scene]}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Beat flash */}
      <motion.div
        animate={{ opacity: audioData.beatPhase * 0.07 }}
        transition={{ duration: 0 }}
        style={{
          position: 'absolute', inset: 0,
          background: `radial-gradient(ellipse at center, rgba(255,107,0,0.15) 0%, transparent 70%)`,
          pointerEvents: 'none',
        }}
      />
    </div>
  )
}
