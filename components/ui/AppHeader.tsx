'use client'

import { motion } from 'framer-motion'
import { useEngineStore } from '@/lib/store'

interface AppHeaderProps {
  onBack: () => void
}

export default function AppHeader({ onBack }: AppHeaderProps) {
  const status      = useEngineStore((s) => s.status)
  const isPlaying   = useEngineStore((s) => s.isPlaying)
  const isRecording = useEngineStore((s) => s.isRecording)
  const fps         = useEngineStore((s) => s.fps)

  const dotColor = isRecording
    ? '#ef4444'
    : isPlaying
      ? '#22c55e'
      : 'rgba(255,107,0,0.5)'

  return (
    <header
      style={{
        gridColumn: '1 / -1',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
        height: 56,
        borderBottom: '1px solid var(--border)',
        background: 'var(--bg)',
        position: 'relative',
        zIndex: 30,
        flexShrink: 0,
      }}
    >
      {/* Logo */}
      <div
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          userSelect: 'none',
        }}
      >
        <span style={{ color: 'var(--orange)' }}>Studio</span>
        <span style={{ color: 'var(--text-muted)' }}>Mogli</span>
      </div>

      {/* Center status cluster */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        {/* Status indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <motion.div
            animate={{
              background: dotColor,
              boxShadow:
                isPlaying
                  ? [
                      '0 0 0px rgba(34,197,94,0)',
                      '0 0 8px rgba(34,197,94,0.9)',
                      '0 0 0px rgba(34,197,94,0)',
                    ]
                  : isRecording
                    ? [
                        '0 0 0px rgba(239,68,68,0)',
                        '0 0 8px rgba(239,68,68,0.9)',
                        '0 0 0px rgba(239,68,68,0)',
                      ]
                    : 'none',
            }}
            transition={
              isPlaying || isRecording
                ? { duration: 1.2, repeat: Infinity }
                : {}
            }
            style={{ width: 6, height: 6, borderRadius: '50%', flexShrink: 0 }}
          />
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              color: 'var(--text-muted)',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
            }}
          >
            {status}
          </span>
        </div>

        {/* FPS badge */}
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 9,
            color: 'var(--text-dim)',
            letterSpacing: '0.15em',
            borderLeft: '1px solid var(--border)',
            paddingLeft: 16,
          }}
        >
          {fps} FPS
        </div>
      </div>

      {/* Right controls */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        {/* Engine version tag */}
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 9,
            color: 'var(--text-dim)',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            border: '1px solid var(--border)',
            padding: '4px 10px',
          }}
        >
          WebGL2 · R3F
        </div>

        <button
          onClick={onBack}
          style={{
            background: 'transparent',
            border: '1px solid var(--border)',
            color: 'var(--text-muted)',
            fontFamily: 'var(--font-display)',
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            padding: '0 16px',
            height: 32,
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--border-glow)'
            e.currentTarget.style.color = 'var(--orange)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--border)'
            e.currentTarget.style.color = 'var(--text-muted)'
          }}
        >
          ← Exit Studio
        </button>
      </div>
    </header>
  )
}
