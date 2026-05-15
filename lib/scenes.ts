import type { SceneId } from '@/lib/store'

export interface SceneConfig {
  id: SceneId
  name: string
  slug: string
  mode: string
  description: string
  cameraMode: 'FLOAT' | 'ORBIT' | 'SCAN'
  /** Primary audio feature this scene reacts to most */
  primaryReactivity: 'bass' | 'vocal' | 'frequency'
  /** Recommended params for this scene */
  recommendedParams: {
    bassIntensity?: number
    particleDensity?: number
    cameraSpeed?: number
    bloomIntensity?: number
    terrainScale?: number
  }
}

export const SCENES: SceneConfig[] = [
  {
    id: 0,
    name: 'Terrain Pulse',
    slug: 'terrain',
    mode: 'BASS-REACTIVE TERRAIN',
    description: 'Topographic contour lines react to bass frequencies. Orange topology rises and falls with every beat.',
    cameraMode: 'FLOAT',
    primaryReactivity: 'bass',
    recommendedParams: {
      bassIntensity: 1.2,
      terrainScale: 1.0,
      bloomIntensity: 1.4,
      cameraSpeed: 0.8,
    },
  },
  {
    id: 1,
    name: 'Particle Void',
    slug: 'particles',
    mode: 'VOICE-REACTIVE PARTICLES',
    description: '8,000 GPU particles orbit and scatter in response to vocal energy and bass transients.',
    cameraMode: 'ORBIT',
    primaryReactivity: 'vocal',
    recommendedParams: {
      particleDensity: 1.2,
      bloomIntensity: 1.6,
      cameraSpeed: 0.7,
      bassIntensity: 1.0,
    },
  },
  {
    id: 2,
    name: 'Audio Grid',
    slug: 'grid',
    mode: 'FREQUENCY GRID WORLD',
    description: 'Futuristic infinite grid displaced by a live frequency texture. Each column reacts to its own frequency band.',
    cameraMode: 'SCAN',
    primaryReactivity: 'frequency',
    recommendedParams: {
      terrainScale: 1.1,
      bloomIntensity: 1.2,
      cameraSpeed: 0.9,
      bassIntensity: 1.3,
    },
  },
]

export function getScene(id: SceneId): SceneConfig {
  return SCENES[id]!
}
