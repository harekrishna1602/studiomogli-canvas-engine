'use client'

/**
 * SceneCanvas — Main Three.js render surface
 *
 * Wraps:
 * - Canvas with WebGL2 renderer
 * - Postprocessing: Bloom + ChromaticAberration + Vignette
 * - Scene switcher (Terrain / Particles / Grid)
 * - HUD overlay elements
 * - FPS counter
 */

import { useRef, Suspense, forwardRef } from 'react'
import { Canvas } from '@react-three/fiber'
import { EffectComposer, Bloom, ChromaticAberration, Vignette } from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'
import * as THREE from 'three'
import { useEngineStore } from '@/lib/store'
import TerrainScene from '@/components/scenes/TerrainScene'
import ParticleScene from '@/components/scenes/ParticleScene'
import GridScene from '@/components/scenes/GridScene'
import SceneHUD from '@/components/ui/SceneHUD'

interface SceneCanvasProps {
  className?: string
}

const SCENES = [TerrainScene, ParticleScene, GridScene]

function PostFX() {
  const bloomIntensity = useEngineStore((s) => s.params.bloomIntensity)
  const beatPhase = useEngineStore((s) => s.audioData.beatPhase)
  const energy = useEngineStore((s) => s.audioData.smoothEnergy)

  return (
    <EffectComposer>
      <Bloom
        intensity={bloomIntensity * 1.5 + beatPhase * 0.5}
        luminanceThreshold={0.1}
        luminanceSmoothing={0.9}
        mipmapBlur
      />
      <ChromaticAberration
        blendFunction={BlendFunction.NORMAL}
        offset={new THREE.Vector2(
          0.0008 + energy * 0.001 + beatPhase * 0.002,
          0.0004 + energy * 0.0005
        )}
        radialModulation={false}
        modulationOffset={0.0}
      />
      <Vignette
        offset={0.4}
        darkness={0.6 + energy * 0.2}
        eskil={false}
        blendFunction={BlendFunction.NORMAL}
      />
    </EffectComposer>
  )
}

function ActiveScene() {
  const scene = useEngineStore((s) => s.scene)
  const SceneComponent = SCENES[scene]
  return <SceneComponent />
}

export default function SceneCanvas({ className }: SceneCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  return (
    <div className={`relative w-full h-full bg-black ${className ?? ''}`}>
      <Canvas
        ref={canvasRef}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: 'high-performance',
          stencil: false,
          depth: true,
        }}
        dpr={[1, 2]}
        camera={{
          fov: 60,
          near: 0.1,
          far: 100,
          position: [0, 2, 6],
        }}
        style={{ background: '#080808' }}
      >
        <Suspense fallback={null}>
          <ActiveScene />
          <PostFX />
        </Suspense>
      </Canvas>

      {/* HUD overlaid on canvas */}
      <SceneHUD canvasRef={canvasRef} />
    </div>
  )
}
