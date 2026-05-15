'use client'

import { useCallback, useState } from 'react'
import { motion } from 'framer-motion'
import { useEngineStore, PALETTES, PaletteKey, VisualParams } from '@/lib/store'
import { ExportEngine, ExportFormat, ExportQuality } from '@/lib/export/ExportEngine'

// ─── ParamSlider ──────────────────────────────────────────────────────────────

interface SliderProps {
  label: string
  paramKey: keyof VisualParams
  min?: number
  max?: number
  step?: number
}

function ParamSlider({ label, paramKey, min = 0, max = 2, step = 0.05 }: SliderProps) {
  const value    = useEngineStore((s) => s.params[paramKey])
  const setParam = useEngineStore((s) => s.setParam)

  const pct = ((value - min) / (max - min)) * 100

  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
          {label}
        </span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--orange)' }}>
          {value.toFixed(2)}
        </span>
      </div>
      <input
        type="range"
        min={min} max={max} step={step}
        value={value}
        onChange={(e) => setParam(paramKey, parseFloat(e.target.value))}
        className="slider"
        style={{
          ['--progress' as any]: `${pct}%`,
        }}
      />
    </div>
  )
}

// ─── PaletteSelector ─────────────────────────────────────────────────────────

function PaletteSelector() {
  const palette    = useEngineStore((s) => s.palette)
  const setPalette = useEngineStore((s) => s.setPalette)

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
      {(Object.keys(PALETTES) as PaletteKey[]).map((key) => {
        const p = PALETTES[key]
        const active = palette.key === key
        return (
          <motion.button
            key={key}
            onClick={() => setPalette(p)}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            title={p.label}
            style={{
              width: 28, height: 28,
              background: p.hex,
              border: 'none',
              cursor: 'pointer',
              position: 'relative',
              outline: active ? `2px solid ${p.hex}` : 'none',
              outlineOffset: 3,
            }}
          />
        )
      })}
    </div>
  )
}

// ─── ExportButton ────────────────────────────────────────────────────────────

interface ExportBtnProps {
  label: string
  dimensions: string
  format: ExportFormat
  quality: ExportQuality
}

function ExportButton({ label, dimensions, format, quality }: ExportBtnProps) {
  const [running, setRunning] = useState(false)
  const [progress, setProgress] = useState(0)
  const [statusMsg, setStatusMsg] = useState('')

  const handleClick = useCallback(() => {
    if (running) return
    setRunning(true)
    setProgress(0)

    const engine = new ExportEngine()
    engine.startExport(
      document.querySelector('canvas')!,
      null,
      { format, quality, fps: 60, durationMs: 10_000 },
      (pct, msg) => { setProgress(pct); setStatusMsg(msg) },
      (blob, filename) => {
        ExportEngine.download(blob, filename)
        setRunning(false)
        setProgress(0)
        setStatusMsg('')
      },
    )

    // Simulate for demo purposes
    let pct = 0
    const iv = setInterval(() => {
      pct += 2.5
      setProgress(Math.min(pct, 100))
      setStatusMsg(`RENDERING · ${Math.round(Math.min(pct, 100))}%`)
      if (pct >= 100) {
        clearInterval(iv)
        setStatusMsg('COMPLETE')
        setTimeout(() => { setRunning(false); setProgress(0); setStatusMsg('') }, 2000)
      }
    }, 80)
  }, [running, format, quality])

  return (
    <div>
      <motion.button
        onClick={handleClick}
        whileHover={{ borderColor: 'var(--orange)' }}
        style={{
          width: '100%',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '12px 14px',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          cursor: 'pointer',
          color: 'var(--text)',
          transition: 'border-color 0.2s',
          fontFamily: 'inherit',
          opacity: running ? 0.7 : 1,
        }}
      >
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textAlign: 'left', textTransform: 'uppercase' }}>{label}</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', marginTop: 2 }}>{dimensions}</div>
        </div>
        <span style={{ fontSize: 12, color: 'var(--orange)' }}>{running ? '⟳' : '↓'}</span>
      </motion.button>

      {running && (
        <div>
          <div style={{ height: 2, background: 'var(--bg-surface3)', marginTop: 4, overflow: 'hidden' }}>
            <motion.div
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.1 }}
              style={{ height: '100%', background: 'var(--orange)' }}
            />
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', marginTop: 4 }}>{statusMsg}</div>
        </div>
      )}
    </div>
  )
}

// ─── Main RightPanel ──────────────────────────────────────────────────────────

export default function RightPanel() {
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
    marginBottom: 16,
    paddingBottom: 8,
    borderBottom: '1px solid var(--border)',
  }

  return (
    <div style={{ padding: 20, overflowY: 'auto', height: '100%' }}>

      {/* ── Visual Parameters ── */}
      <div style={sectionStyle}>
        <div style={labelStyle}>Visual Parameters</div>
        <ParamSlider label="Bass Intensity"   paramKey="bassIntensity"  min={0} max={3}  step={0.05} />
        <ParamSlider label="Particle Density" paramKey="particleDensity" min={0.1} max={3} step={0.05} />
        <ParamSlider label="Camera Speed"     paramKey="cameraSpeed"    min={0.1} max={3} step={0.05} />
        <ParamSlider label="Bloom Intensity"  paramKey="bloomIntensity" min={0} max={3}  step={0.05} />
        <ParamSlider label="Terrain Scale"    paramKey="terrainScale"   min={0.2} max={3} step={0.05} />
        <ParamSlider label="Color Shift"      paramKey="colorShift"     min={0} max={1}  step={0.01} />
        <ParamSlider label="Fog Density"      paramKey="fogDensity"     min={0} max={2}  step={0.05} />
        <ParamSlider label="Line Width"       paramKey="lineWidth"      min={0.2} max={3} step={0.05} />
      </div>

      {/* ── Color Palette ── */}
      <div style={sectionStyle}>
        <div style={labelStyle}>Color Palette</div>
        <PaletteSelector />
        <div style={{ marginTop: 12, fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-dim)', letterSpacing: '0.15em' }}>
          {useEngineStore.getState().palette.label.toUpperCase()} PALETTE ACTIVE
        </div>
      </div>

      {/* ── Export ── */}
      <div>
        <div style={labelStyle}>Export</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <ExportButton label="MP4 Landscape"  dimensions="1920 × 1080 · HD"   format="landscape" quality="fhd" />
          <ExportButton label="Vertical Short"  dimensions="1080 × 1920 · 9:16" format="vertical"  quality="fhd" />
          <ExportButton label="Spotify Canvas"  dimensions="720 × 900 · 4:5"    format="canvas"    quality="hd" />
          <ExportButton label="Square Loop"     dimensions="1080 × 1080 · 1:1"  format="square"    quality="fhd" />
        </div>

        <div style={{ marginTop: 16, padding: 12, background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 8 }}>Render Quality</div>
          <div style={{ display: 'flex', gap: 4 }}>
            {(['hd', 'fhd', '4k'] as ExportQuality[]).map((q) => (
              <button
                key={q}
                style={{
                  flex: 1, padding: '6px 0',
                  background: q === 'fhd' ? 'var(--orange)' : 'transparent',
                  border: `1px solid ${q === 'fhd' ? 'var(--orange)' : 'var(--border)'}`,
                  color: q === 'fhd' ? '#000' : 'var(--text-muted)',
                  fontFamily: 'var(--font-display)', fontSize: 9,
                  fontWeight: 700, letterSpacing: '0.2em',
                  textTransform: 'uppercase', cursor: 'pointer',
                }}
              >
                {q.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
