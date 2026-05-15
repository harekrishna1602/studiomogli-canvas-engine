'use client'

import { useRef, useEffect } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'

// ─── Animated Background Canvas ───────────────────────────────────────────────

function HeroCanvas() {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current!
    const ctx = canvas.getContext('2d')!
    let raf: number
    let t = 0

    const lines: Array<{ y: number, phase: number, speed: number }> = []
    for (let i = 0; i < 30; i++) {
      lines.push({ y: Math.random(), phase: Math.random() * Math.PI * 2, speed: 0.2 + Math.random() * 0.4 })
    }

    const resize = () => {
      canvas.width  = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    const draw = () => {
      raf = requestAnimationFrame(draw)
      t += 0.006
      const W = canvas.width, H = canvas.height
      ctx.clearRect(0, 0, W, H)
      ctx.fillStyle = '#080808'
      ctx.fillRect(0, 0, W, H)

      const bass = Math.abs(Math.sin(t * 0.85)) * 0.45

      lines.forEach((ln) => {
        const yBase = ln.y * H
        ctx.beginPath()
        const segs = 100
        for (let s = 0; s <= segs; s++) {
          const x = (s / segs) * W
          const nx = (s / segs) * 5
          const y = yBase
            + Math.sin(nx * 2 + t * ln.speed + ln.phase) * 28 * (0.5 + bass)
            + Math.sin(nx * 5 + t * 1.5 + ln.phase)      * 10
          s === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
        }
        const alpha = 0.03 + bass * 0.1 + ln.y * 0.05
        ctx.strokeStyle = `rgba(255,107,0,${alpha})`
        ctx.lineWidth = 0.5 + bass * 1.2
        ctx.stroke()
      })

      // Fog
      const fog = ctx.createLinearGradient(0, 0, 0, H)
      fog.addColorStop(0,   'rgba(8,8,8,0.85)')
      fog.addColorStop(0.3, 'rgba(8,8,8,0)')
      fog.addColorStop(0.7, 'rgba(8,8,8,0)')
      fog.addColorStop(1,   'rgba(8,8,8,0.95)')
      ctx.fillStyle = fog
      ctx.fillRect(0, 0, W, H)
    }
    draw()

    return () => {
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <canvas
      ref={ref}
      style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', zIndex: 0, opacity: 0.8 }}
    />
  )
}

// ─── Feature Card ─────────────────────────────────────────────────────────────

function FeatureCard({ num, title, desc }: { num: string, title: string, desc: string }) {
  return (
    <motion.div
      whileHover={{ background: 'rgba(14,14,14,1)' }}
      style={{
        background: 'rgba(8,8,8,1)',
        padding: '48px 40px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <motion.div
        initial={{ scaleX: 0 }}
        whileHover={{ scaleX: 1 }}
        transition={{ duration: 0.3 }}
        style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 1,
          background: 'linear-gradient(90deg, transparent, rgba(255,107,0,0.6), transparent)',
          transformOrigin: 'left',
        }}
      />
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'rgba(255,107,0,0.5)', letterSpacing: '0.2em', marginBottom: 24 }}>{num}</div>
      <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 12, lineHeight: 1.2 }}>{title}</div>
      <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.7 }}>{desc}</div>
    </motion.div>
  )
}

// ─── Price Card ───────────────────────────────────────────────────────────────

function PriceCard({
  tier, amount, cycle, features, featured, onCta, ctaLabel,
}: {
  tier: string, amount: string, cycle: string, features: string[],
  featured?: boolean, onCta: () => void, ctaLabel: string,
}) {
  return (
    <div style={{
      background: featured ? 'var(--bg-surface)' : 'var(--bg)',
      padding: 40, position: 'relative',
    }}>
      {featured && (
        <div style={{
          position: 'absolute', top: -1, left: '50%', transform: 'translateX(-50%)',
          background: 'var(--orange)', color: '#000',
          fontSize: 9, fontWeight: 700, letterSpacing: '0.2em',
          padding: '4px 18px', textTransform: 'uppercase',
          whiteSpace: 'nowrap',
        }}>
          MOST POPULAR
        </div>
      )}
      <div style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.25em', textTransform: 'uppercase', marginBottom: 14 }}>{tier}</div>
      <div style={{ fontSize: 48, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1, marginBottom: 4 }}>
        <sup style={{ fontSize: 20, fontWeight: 400, color: 'var(--text-muted)', verticalAlign: 'top', marginTop: 8, display: 'inline-block' }}>$</sup>
        {amount}
      </div>
      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 32 }}>{cycle}</div>
      <ul style={{ listStyle: 'none', marginBottom: 40 }}>
        {features.map((f, i) => (
          <li key={i} style={{
            fontSize: 13, color: 'var(--text-muted)', padding: '8px 0',
            borderBottom: '1px solid var(--border)', display: 'flex', gap: 10,
          }}>
            <span style={{ color: 'var(--orange)', flexShrink: 0 }}>—</span>{f}
          </li>
        ))}
      </ul>
      <motion.button
        onClick={onCta}
        whileHover={{ background: 'var(--orange)', borderColor: 'var(--orange)', color: '#000' }}
        style={{
          width: '100%', padding: 14,
          background: featured ? 'var(--orange)' : 'transparent',
          border: `1px solid ${featured ? 'var(--orange)' : 'var(--border-glow)'}`,
          color: featured ? '#000' : 'var(--text)',
          fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 600,
          letterSpacing: '0.15em', textTransform: 'uppercase', cursor: 'pointer',
          transition: 'all 0.25s',
        }}
      >
        {ctaLabel}
      </motion.button>
    </div>
  )
}

// ─── Mini Scene Previews ──────────────────────────────────────────────────────

function ScenePreview({ index, title, mode, onClick }: {
  index: number, title: string, mode: string, onClick: () => void
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    let raf: number, t = Math.random() * 100

    const draw = () => {
      raf = requestAnimationFrame(draw)
      t += 0.016
      const W = canvas.offsetWidth, H = canvas.offsetHeight
      if (canvas.width !== W || canvas.height !== H) { canvas.width = W; canvas.height = H }
      if (!W || !H) return
      ctx.clearRect(0, 0, W, H)
      ctx.fillStyle = '#0a0a0a'
      ctx.fillRect(0, 0, W, H)
      const b = Math.abs(Math.sin(t * 0.7)) * 0.4

      if (index === 0) {
        // Terrain
        for (let i = 0; i < 14; i++) {
          ctx.beginPath()
          const yb = (i / 14) * H
          for (let s = 0; s <= 50; s++) {
            const x = (s / 50) * W
            const y = yb + Math.sin(s * 0.5 + t * (0.3 + i * 0.04) + i) * 16 * (0.3 + b)
            s === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
          }
          ctx.strokeStyle = `rgba(255,107,0,${0.04 + (i / 14) * 0.3 + b * 0.2})`
          ctx.lineWidth = 0.5 + b * 1.5
          ctx.stroke()
        }
      } else if (index === 1) {
        // Particles
        for (let i = 0; i < 140; i++) {
          const px = (Math.sin(i * 2.4 + t * 0.3) * 0.38 + 0.5) * W
          const py = (Math.cos(i * 1.7 + t * 0.25) * 0.38 + 0.5) * H
          ctx.beginPath()
          ctx.arc(px, py, 0.5 + b * 2, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(255,107,0,${0.25 + b * 0.5})`
          ctx.fill()
        }
        // Orbital rings
        for (let i = 0; i < 3; i++) {
          ctx.beginPath()
          ctx.arc(W/2, H/2, (0.12 + i * 0.08) * Math.min(W,H), 0, Math.PI * 2)
          ctx.strokeStyle = `rgba(255,107,0,${0.04 + b * 0.1})`
          ctx.lineWidth = 0.5
          ctx.stroke()
        }
      } else {
        // Grid
        for (let r = 0; r <= 16; r++) {
          ctx.beginPath()
          for (let c = 0; c <= 14; c++) {
            const x = (c / 14) * W
            const y = (r / 16) * H + Math.sin(c * 0.4 + t * 1.5) * b * 14
            c === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
          }
          ctx.strokeStyle = `rgba(255,107,0,${0.04 + (r / 16) * 0.22 + b * 0.12})`
          ctx.lineWidth = 0.5
          ctx.stroke()
        }
      }

      // Fog
      const fog = ctx.createLinearGradient(0, 0, 0, H)
      fog.addColorStop(0, 'rgba(10,10,10,0.7)')
      fog.addColorStop(0.25, 'rgba(10,10,10,0)')
      fog.addColorStop(0.75, 'rgba(10,10,10,0)')
      fog.addColorStop(1, 'rgba(10,10,10,0.85)')
      ctx.fillStyle = fog
      ctx.fillRect(0, 0, W, H)
    }

    draw()
    return () => cancelAnimationFrame(raf)
  }, [index])

  return (
    <motion.div
      onClick={onClick}
      whileHover={{ y: -6, borderColor: 'rgba(255,107,0,0.5)' }}
      style={{
        aspectRatio: '9/16',
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        position: 'relative',
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'border-color 0.3s',
      }}
    >
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        padding: 16,
        background: 'linear-gradient(transparent, rgba(0,0,0,0.92))',
      }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'rgba(255,107,0,0.6)', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 4 }}>
          SCENE {String(index + 1).padStart(2, '0')}
        </div>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{title}</div>
      </div>
    </motion.div>
  )
}

// ─── Main LandingPage ─────────────────────────────────────────────────────────

interface LandingPageProps { onLaunch: () => void }

export default function LandingPage({ onLaunch }: LandingPageProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  const features = [
    { num: '01 / AUDIO ENGINE', title: 'Deep Audio Analysis', desc: 'Real-time FFT extracts BPM, bass, mids, highs, vocal energy and silence detection — intelligently mapped to every visual parameter at 60fps.' },
    { num: '02 / RENDERING',    title: 'WebGL Scene System',  desc: 'Three cinematic scenes with procedural GLSL shaders, React Three Fiber, postprocessing bloom and chromatic aberration for cinematic depth.' },
    { num: '03 / EXPORT',       title: 'Multi-Format Output', desc: 'Export MP4, Spotify Canvas (4:5), YouTube Shorts (9:16), and square loops at 1080p or 4K. Frame-perfect audio-visual sync.' },
    { num: '04 / CAMERA',       title: 'Auto Camera Paths',   desc: 'Choreographed camera motion reacts to musical structure. Slow drift during verses, dramatic jolts on beats, depth pulls on drops.' },
    { num: '05 / PARTICLES',    title: '8K Particle System',  desc: 'GPU-instanced particle simulation. Whispers scatter particles into delicate constellations; peaks trigger explosive formations.' },
    { num: '06 / FUTURE',       title: 'AI Scene Generation', desc: 'Coming: describe a mood in words, receive a fully generated cinematic world. Text-to-visual storytelling via multimodal AI.' },
  ]

  const scenes = [
    { title: 'Terrain Pulse', mode: 'Bass-reactive topographic terrain' },
    { title: 'Particle Void', mode: 'Voice-reactive particle system' },
    { title: 'Audio Grid',    mode: 'Frequency-reactive grid world' },
  ]

  const plans = [
    { tier: 'Free', amount: '0', cycle: 'forever', ctaLabel: 'Start Free', features: ['3 cinematic scenes', '720p export', 'Watermarked output', '10 renders/month'] },
    { tier: 'Creator', amount: '19', cycle: 'per month', ctaLabel: 'Get Creator', featured: true, features: ['All scenes + presets', '1080p + 4K export', 'No watermark', 'Unlimited renders', 'Custom palettes'] },
    { tier: 'Studio', amount: '79', cycle: 'per month', ctaLabel: 'Contact Sales', features: ['Everything in Creator', 'AI scene generation', 'Cloud rendering', 'Team collaboration', 'API access'] },
  ]

  return (
    <div
      ref={containerRef}
      className="landing-container"
      style={{ position: 'relative', fontFamily: 'var(--font-display)' }}
    >
      <HeroCanvas />

      {/* Nav */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '18px 40px',
        borderBottom: '1px solid var(--border)',
        background: 'rgba(8,8,8,0.7)', backdropFilter: 'blur(12px)',
      }}>
        <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase' }}>
          <span style={{ color: 'var(--orange)' }}>Studio</span>
          <span style={{ color: 'var(--text-muted)' }}>Mogli</span>
        </div>
        <div style={{ display: 'flex', gap: 32 }}>
          {['Engine', 'Scenes', 'Pricing', 'Studio'].map((l) => (
            <a key={l} href="#" style={{ fontSize: 11, color: 'var(--text-muted)', textDecoration: 'none', letterSpacing: '0.1em', textTransform: 'uppercase', transition: 'color 0.2s' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
            >{l}</a>
          ))}
        </div>
        <motion.button
          onClick={onLaunch}
          whileHover={{ background: '#fff' }}
          whileTap={{ scale: 0.97 }}
          style={{
            background: 'var(--orange)', color: '#000',
            border: 'none', padding: '10px 24px',
            fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700,
            letterSpacing: '0.15em', textTransform: 'uppercase', cursor: 'pointer',
          }}
        >
          Launch Studio →
        </motion.button>
      </nav>

      {/* Hero */}
      <section style={{ position: 'relative', zIndex: 1, minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '120px 40px 80px', textAlign: 'center' }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--orange)', letterSpacing: '0.3em', textTransform: 'uppercase', marginBottom: 32, opacity: 0.75 }}
        >
          Cinematic Audio Engine · v1.0
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.8 }}
          style={{ fontSize: 'clamp(52px, 9vw, 104px)', fontWeight: 800, lineHeight: 0.92, letterSpacing: '-0.03em', marginBottom: 28 }}
        >
          Your Sound.<br />
          <span style={{ color: 'var(--orange)' }}>Rendered.</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          style={{ fontSize: 16, color: 'var(--text-muted)', maxWidth: 460, lineHeight: 1.7, marginBottom: 48, fontWeight: 400 }}
        >
          A real-time cinematic motion engine that transforms audio into living, breathing visual worlds. Built for creators who refuse to be ordinary.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.75 }}
          style={{ display: 'flex', gap: 16, alignItems: 'center' }}
        >
          <motion.button
            onClick={onLaunch}
            whileHover={{ background: '#fff', y: -3 }}
            whileTap={{ scale: 0.97 }}
            style={{ background: 'var(--orange)', color: '#000', border: 'none', padding: '16px 44px', fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer', transition: 'all 0.25s' }}
          >
            Open Studio Free →
          </motion.button>
          <motion.button
            whileHover={{ borderColor: 'var(--orange)', color: 'var(--orange)' }}
            style={{ background: 'transparent', color: 'var(--text)', border: '1px solid var(--border-glow)', padding: '15px 32px', fontFamily: 'var(--font-display)', fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer', transition: 'all 0.25s' }}
          >
            Watch Demo
          </motion.button>
        </motion.div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          style={{ display: 'flex', gap: 60, marginTop: 80, paddingTop: 40, borderTop: '1px solid var(--border)' }}
        >
          {[{ n: '3', l: 'Cinematic Scenes' }, { n: '60', l: 'FPS Real-time' }, { n: '4K', l: 'Export Ready' }].map(({ n, l }) => (
            <div key={l} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 36, fontWeight: 700, color: 'var(--orange)', lineHeight: 1 }}>{n}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.2em', textTransform: 'uppercase', marginTop: 6 }}>{l}</div>
            </div>
          ))}
        </motion.div>
      </section>

      {/* Scroll content */}
      <div style={{ position: 'relative', zIndex: 1, padding: '0 40px 120px' }}>

        {/* Features */}
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'rgba(255,107,0,0.6)', letterSpacing: '0.3em', textTransform: 'uppercase', marginBottom: 16 }}>Core Technology</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 1, background: 'var(--border)', marginBottom: 80 }}>
          {features.map((f) => (
            <FeatureCard key={f.num} {...f} />
          ))}
        </div>

        {/* Scene previews */}
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'rgba(255,107,0,0.6)', letterSpacing: '0.3em', textTransform: 'uppercase', marginBottom: 16 }}>Scene Library</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 80 }}>
          {scenes.map((s, i) => (
            <ScenePreview key={i} index={i} title={s.title} mode={s.mode} onClick={onLaunch} />
          ))}
        </div>

        {/* Pricing */}
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'rgba(255,107,0,0.6)', letterSpacing: '0.3em', textTransform: 'uppercase', marginBottom: 16 }}>Pricing</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 1, background: 'var(--border)', marginBottom: 80 }}>
          {plans.map((p) => (
            <PriceCard key={p.tier} {...p} onCta={onLaunch} />
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer style={{ position: 'relative', zIndex: 1, borderTop: '1px solid var(--border)', padding: '32px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>© 2025 StudioMogli. Built for creators.</p>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-dim)', letterSpacing: '0.2em' }}>CINEMATIC · AUDIO · ENGINE</p>
      </footer>
    </div>
  )
}
