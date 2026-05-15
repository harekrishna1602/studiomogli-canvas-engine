'use client'

import { useRef, useCallback, useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useEngineStore, SceneId } from '@/lib/store'
import { useAudioEngine, useAudioDropzone, useWaveform } from '@/hooks'

// ─── WaveformDisplay ──────────────────────────────────────────────────────────

function WaveformDisplay({ waveform, progress }: { waveform: Float32Array | null, progress: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !waveform) return
    const ctx = canvas.getContext('2d')!
    const W = canvas.offsetWidth * devicePixelRatio
    const H = canvas.offsetHeight * devicePixelRatio
    canvas.width = W; canvas.height = H
    ctx.clearRect(0, 0, W, H)
    const mid = H / 2
    ctx.strokeStyle = 'rgba(255,107,0,0.5)'
    ctx.lineWidth = 1
    ctx.beginPath()
    for (let i = 0; i < W; i++) {
      const idx = Math.floor(i / W * waveform.length)
      const v = waveform[idx] * mid * 0.9
      ctx.moveTo(i, mid - v)
      ctx.lineTo(i, mid + v)
    }
    ctx.stroke()
    // Playhead overlay
    const px = progress * W
    ctx.fillStyle = 'rgba(255,107,0,0.15)'
    ctx.fillRect(0, 0, px, H)
    // Playhead line
    ctx.strokeStyle = 'rgba(255,107,0,0.9)'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.moveTo(px, 0); ctx.lineTo(px, H)
    ctx.stroke()
  }, [waveform, progress])

  if (!waveform) {
    return (
      <div style={{ height: 48, background: 'var(--bg-surface)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 8 }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-dim)', letterSpacing: '0.2em' }}>NO WAVEFORM</span>
      </div>
    )
  }

  return (
    <div style={{ height: 48, background: 'var(--bg-surface)', border: '1px solid var(--border)', marginTop: 8, position: 'relative', overflow: 'hidden' }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
    </div>
  )
}

// ─── AnalysisMetric ────────────────────────────────────────────────────────────

function AnalysisMetric({ label, value, bar }: { label: string, value: string, bar?: number }) {
  return (
    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', padding: '10px 12px' }}>
      <div style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 4 }}>{label}</div>
      <motion.div
        animate={{ color: (bar ?? 0) > 0.6 ? 'var(--orange)' : 'var(--text)' }}
        style={{ fontFamily: 'var(--font-mono)', fontSize: 16, fontWeight: 500 }}
      >
        {value}
      </motion.div>
      {bar !== undefined && (
        <div style={{ height: 2, background: 'var(--bg-surface3)', marginTop: 6 }}>
          <motion.div
            animate={{ width: `${Math.min(bar * 100, 100)}%` }}
            transition={{ duration: 0.1 }}
            style={{ height: '100%', background: 'var(--orange)', minWidth: 2 }}
          />
        </div>
      )}
    </div>
  )
}

// ─── SceneItem ────────────────────────────────────────────────────────────────

function SceneItem({ id, name, mode, active, onSelect }: {
  id: SceneId, name: string, mode: string, active: boolean, onSelect: () => void
}) {
  return (
    <motion.div
      onClick={onSelect}
      whileHover={{ x: 2 }}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '10px 12px',
        border: `1px solid ${active ? 'var(--orange)' : 'var(--border)'}`,
        background: active ? 'var(--orange-dim)' : 'transparent',
        cursor: 'pointer',
        position: 'relative',
        transition: 'border-color 0.2s, background 0.2s',
      }}
    >
      {active && (
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 2, background: 'var(--orange)' }} />
      )}
      <motion.div
        animate={{ boxShadow: active ? '0 0 8px rgba(255,107,0,0.8)' : 'none' }}
        style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--orange)', opacity: active ? 1 : 0.35, flexShrink: 0 }}
      />
      <div>
        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.05em', color: 'var(--text)' }}>{name}</div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', marginTop: 1 }}>{mode}</div>
      </div>
    </motion.div>
  )
}

// ─── Main LeftPanel ───────────────────────────────────────────────────────────

const SCENES: Array<{ name: string, mode: string }> = [
  { name: 'Terrain Pulse',  mode: 'BASS-REACTIVE TERRAIN'   },
  { name: 'Particle Void',  mode: 'VOICE-REACTIVE PARTICLES' },
  { name: 'Audio Grid',     mode: 'FREQUENCY GRID WORLD'    },
]

export default function LeftPanel() {
  const scene       = useEngineStore((s) => s.scene)
  const setScene    = useEngineStore((s) => s.setScene)
  const audioData   = useEngineStore((s) => s.audioData)
  const isPlaying   = useEngineStore((s) => s.isPlaying)
  const isRecording = useEngineStore((s) => s.isRecording)
  const audioFile   = useEngineStore((s) => s.audioFile)
  const currentTime = useEngineStore((s) => s.currentTime)
  const duration    = useEngineStore((s) => s.duration)
  const setAudioFile = useEngineStore((s) => s.setAudioFile)

  const [rawFile, setRawFile] = useState<File | null>(null)
  const { waveform } = useWaveform(rawFile)
  const { loadFile, play, pause, stop, startRecording, stopRecording } = useAudioEngine()

  const handleFile = useCallback(async (file: File) => {
    setRawFile(file)
    await loadFile(file)
    setAudioFile({ name: file.name, duration: 0, sizeBytes: file.size, type: file.type })
  }, [loadFile, setAudioFile])

  const { isDragging, onDragOver, onDragLeave, onDrop, onChange } = useAudioDropzone(handleFile)

  const progress = duration > 0 ? currentTime / duration : 0

  const sectionStyle = {
    paddingBottom: 24,
    marginBottom: 24,
    borderBottom: '1px solid var(--border)',
  }

  const labelStyle = {
    fontSize: 9,
    color: 'var(--text-muted)',
    letterSpacing: '0.25em',
    textTransform: 'uppercase' as const,
    marginBottom: 14,
    paddingBottom: 8,
    borderBottom: '1px solid var(--border)',
  }

  return (
    <div style={{ padding: 20, overflowY: 'auto', height: '100%' }}>

      {/* ── Audio Source ── */}
      <div style={sectionStyle}>
        <div style={labelStyle}>Audio Source</div>

        {/* Upload zone */}
        <div
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          style={{
            border: `1px dashed ${isDragging ? 'var(--orange)' : 'var(--border-glow)'}`,
            background: isDragging ? 'var(--orange-dim)' : 'transparent',
            padding: '20px 16px',
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s',
            position: 'relative',
          }}
        >
          <input
            type="file"
            accept="audio/*"
            onChange={onChange}
            style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }}
          />
          <div style={{ fontSize: 20, opacity: 0.4, marginBottom: 8 }}>◈</div>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>Drop audio file</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)' }}>MP3 · WAV · AAC · FLAC</div>
        </div>

        {/* Mic record */}
        <motion.button
          onClick={isRecording ? stopRecording : startRecording}
          whileTap={{ scale: 0.98 }}
          style={{
            width: '100%',
            marginTop: 6,
            background: 'transparent',
            border: `1px solid ${isRecording ? '#ef4444' : 'var(--border-glow)'}`,
            color: isRecording ? '#ef4444' : 'var(--text)',
            fontFamily: 'var(--font-display)',
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            padding: '9px 0',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            transition: 'all 0.2s',
          }}
        >
          <motion.div
            animate={isRecording ? { opacity: [1, 0.2] } : { opacity: 1 }}
            transition={isRecording ? { duration: 0.8, repeat: Infinity, repeatType: 'reverse' } : {}}
            style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor' }}
          />
          {isRecording ? 'Recording… (click to stop)' : 'Record Microphone'}
        </motion.button>

        {/* File info */}
        {audioFile && (
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', padding: '10px 12px', marginTop: 8 }}>
            <div style={{ fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: 3 }}>{audioFile.name}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)' }}>
              {(audioFile.sizeBytes / 1024 / 1024).toFixed(2)} MB · {audioFile.type.split('/')[1]?.toUpperCase()}
            </div>
          </div>
        )}

        {/* Waveform */}
        <WaveformDisplay waveform={waveform} progress={progress} />

        {/* Transport */}
        <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
          <button
            onClick={isPlaying ? pause : play}
            style={{
              flex: 1,
              background: isPlaying ? 'var(--orange)' : 'transparent',
              border: `1px solid ${isPlaying ? 'var(--orange)' : 'var(--border)'}`,
              color: isPlaying ? '#000' : 'var(--text)',
              fontFamily: 'var(--font-display)',
              fontSize: 10, fontWeight: 600,
              letterSpacing: '0.1em', textTransform: 'uppercase',
              padding: '8px 4px', cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {isPlaying ? '⏸ PAUSE' : '▶ PLAY'}
          </button>
          <button
            onClick={stop}
            style={{
              flex: 1, background: 'transparent',
              border: '1px solid var(--border)', color: 'var(--text)',
              fontFamily: 'var(--font-display)',
              fontSize: 10, fontWeight: 600,
              letterSpacing: '0.1em', textTransform: 'uppercase',
              padding: '8px 4px', cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            ■ STOP
          </button>
        </div>
      </div>

      {/* ── Scene ── */}
      <div style={sectionStyle}>
        <div style={labelStyle}>Scene</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {SCENES.map((s, i) => (
            <SceneItem
              key={i}
              id={i as SceneId}
              name={s.name}
              mode={s.mode}
              active={scene === i}
              onSelect={() => setScene(i as SceneId)}
            />
          ))}
        </div>
      </div>

      {/* ── Analysis ── */}
      <div>
        <div style={labelStyle}>Audio Analysis</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
          <AnalysisMetric label="BPM" value={String(audioData.bpm)} />
          <AnalysisMetric label="Energy" value={`${Math.round(audioData.smoothEnergy * 100)}%`} />
          <AnalysisMetric label="Bass"  value={String(Math.round(audioData.bass  * 100))} bar={audioData.smoothBass} />
          <AnalysisMetric label="Mids"  value={String(Math.round(audioData.mids  * 100))} bar={audioData.smoothMids} />
          <AnalysisMetric label="Highs" value={String(Math.round(audioData.highs * 100))} bar={audioData.smoothHighs} />
          <AnalysisMetric label="Vocal" value={String(Math.round(audioData.vocal * 100))} bar={audioData.smoothVocal} />
        </div>
      </div>
    </div>
  )
}
