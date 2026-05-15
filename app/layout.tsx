import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'StudioMogli — Cinematic Audio Engine',
  description:
    'A real-time cinematic motion engine that transforms audio into living, breathing visual worlds. Built for creators who refuse to be ordinary.',
  keywords: ['audio visualizer', 'cinematic', 'music visualization', 'spotify canvas', 'audio reactive'],
  authors: [{ name: 'StudioMogli' }],
  openGraph: {
    title: 'StudioMogli Canvas Engine',
    description: 'Cinematic Audio-Reactive Visual Engine',
    type: 'website',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#080808',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="noise-overlay">
      <body>{children}</body>
    </html>
  )
}
