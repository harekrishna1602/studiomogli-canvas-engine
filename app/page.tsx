'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import LandingPage from '@/components/landing/LandingPage'
import StudioApp from '@/components/engine/StudioApp'

export default function Home() {
  const [view, setView] = useState<'landing' | 'app'>('landing')

  return (
    <AnimatePresence mode="wait">
      {view === 'landing' ? (
        <motion.div
          key="landing"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
          style={{ position: 'absolute', inset: 0 }}
        >
          <LandingPage onLaunch={() => setView('app')} />
        </motion.div>
      ) : (
        <motion.div
          key="app"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          style={{ position: 'absolute', inset: 0 }}
        >
          <StudioApp onBack={() => setView('landing')} />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
