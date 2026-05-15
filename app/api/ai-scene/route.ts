import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/ai-scene
 *
 * Future: AI-powered scene generation from text prompts.
 * Currently returns a structured stub showing the API contract.
 *
 * Body: { prompt: string, mood?: string, bpm?: number }
 * Response: { sceneConfig: SceneGenConfig }
 */

interface SceneGenRequest {
  prompt: string
  mood?: string
  bpm?: number
  palette?: string
}

interface SceneGenConfig {
  sceneName: string
  description: string
  params: {
    bassIntensity: number
    particleDensity: number
    cameraSpeed: number
    bloomIntensity: number
    terrainScale: number
    colorShift: number
    fogDensity: number
  }
  palette: {
    primary: [number, number, number]
    secondary: [number, number, number]
  }
  cameraPath: 'drift' | 'orbit' | 'scan' | 'zoom'
  particleStyle: 'soft' | 'sharp' | 'rings'
  mood: string
}

// Mood → param mapping heuristics
const MOOD_PRESETS: Record<string, Partial<SceneGenConfig['params']>> = {
  energetic:  { bassIntensity: 2.0, cameraSpeed: 1.8, bloomIntensity: 2.0, particleDensity: 2.0 },
  melancholic:{ bassIntensity: 0.7, cameraSpeed: 0.5, bloomIntensity: 0.8, fogDensity: 1.4 },
  epic:       { bassIntensity: 1.8, terrainScale: 2.0, bloomIntensity: 1.6, cameraSpeed: 1.2 },
  ambient:    { bassIntensity: 0.5, cameraSpeed: 0.4, fogDensity: 1.0, bloomIntensity: 1.0 },
  dark:       { bloomIntensity: 0.6, fogDensity: 1.5, colorShift: 0.8 },
  ethereal:   { particleDensity: 1.8, bloomIntensity: 2.2, fogDensity: 0.8, cameraSpeed: 0.6 },
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as SceneGenRequest
    const { prompt, mood = 'energetic', bpm = 128 } = body

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: 'prompt is required' }, { status: 400 })
    }

    // In production: call Anthropic API for scene parameter generation
    // const anthropic = new Anthropic()
    // const response = await anthropic.messages.create({ ... })

    // Stub: derive params from mood
    const moodKey = mood.toLowerCase() as keyof typeof MOOD_PRESETS
    const moodParams = MOOD_PRESETS[moodKey] ?? MOOD_PRESETS.energetic!

    const sceneConfig: SceneGenConfig = {
      sceneName: `AI: ${prompt.slice(0, 40)}`,
      description: `Generated from: "${prompt}"`,
      params: {
        bassIntensity:   moodParams.bassIntensity   ?? 1.0,
        particleDensity: moodParams.particleDensity ?? 1.0,
        cameraSpeed:     moodParams.cameraSpeed     ?? 1.0,
        bloomIntensity:  moodParams.bloomIntensity  ?? 1.2,
        terrainScale:    moodParams.terrainScale    ?? 1.0,
        colorShift:      moodParams.colorShift      ?? 0.0,
        fogDensity:      moodParams.fogDensity      ?? 0.6,
      },
      palette: {
        primary:   [1.0, 0.42, 0.0],
        secondary: [1.0, 0.7, 0.1],
      },
      cameraPath: bpm > 140 ? 'zoom' : bpm > 100 ? 'orbit' : 'drift',
      particleStyle: 'soft',
      mood,
    }

    return NextResponse.json({ sceneConfig }, { status: 200 })
  } catch (err) {
    console.error('[ai-scene]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
