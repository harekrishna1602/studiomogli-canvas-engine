'use client'

import dynamic from 'next/dynamic'
import { useAudioEngine } from '@/hooks'
import LeftPanel  from '@/components/ui/LeftPanel'
import RightPanel from '@/components/ui/RightPanel'
import AppHeader  from '@/components/ui/AppHeader'
import FPSTracker from '@/components/engine/FPSTracker'

const SceneCanvas = dynamic(() => import('@/components/engine/SceneCanvas'), {
  ssr: false,
  loading: () => (
    <div style={{ width:'100%', height:'100%', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', background:'#080808', gap:16 }}>
      <div style={{ width:36, height:36, border:'2px solid rgba(255,107,0,0.2)', borderTopColor:'var(--orange)', borderRadius:'50%', animation:'spin 1s linear infinite' }} />
      <div style={{ fontFamily:'var(--font-mono)', fontSize:10, color:'rgba(255,107,0,0.5)', letterSpacing:'0.25em', textTransform:'uppercase' }}>INITIALIZING ENGINE…</div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  ),
})

export default function StudioApp({ onBack }: { onBack: () => void }) {
  useAudioEngine()
  return (
    <div style={{ display:'grid', gridTemplateColumns:'280px 1fr 260px', gridTemplateRows:'56px 1fr', height:'100vh', width:'100vw', overflow:'hidden', background:'var(--bg)' }}>
      <FPSTracker />
      <AppHeader onBack={onBack} />
      <aside style={{ borderRight:'1px solid var(--border)', overflow:'hidden', gridRow:2, gridColumn:1, minHeight:0 }}>
        <LeftPanel />
      </aside>
      <main style={{ gridRow:2, gridColumn:2, position:'relative', overflow:'hidden', background:'#000', minHeight:0, minWidth:0 }}>
        <SceneCanvas />
      </main>
      <aside style={{ borderLeft:'1px solid var(--border)', overflow:'hidden', gridRow:2, gridColumn:3, minHeight:0 }}>
        <RightPanel />
      </aside>
    </div>
  )
}
