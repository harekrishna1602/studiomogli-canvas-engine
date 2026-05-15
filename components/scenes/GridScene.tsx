'use client'

/**
 * GridScene — Futuristic frequency-reactive grid world
 *
 * Architecture:
 * - High-segment PlaneGeometry with GLSL wave displacement
 * - Frequency data mapped to a DataTexture for per-column reactivity
 * - Scan lines, beat pulse rings, horizon glow
 * - Camera: tracking shot with slow pan
 */

import { useRef, useMemo, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useEngineStore } from '@/lib/store'

const VERT = /* glsl */ `
uniform float uTime;
uniform float uBass;
uniform float uMids;
uniform float uHighs;
uniform float uEnergy;
uniform float uBeatPhase;
uniform float uCameraSpeed;
uniform float uTerrainScale;
uniform sampler2D uFreqTexture;

varying vec2  vUv;
varying float vElevation;
varying float vDist;

void main(){
  vUv=uv;
  vDist=length(uv-.5);
  float t=uTime*uCameraSpeed;
  float freq=texture2D(uFreqTexture,vec2(uv.x,.5)).r;
  float w1=sin(uv.x*8.+t*2.)*uMids*.3*uTerrainScale;
  float w2=sin(uv.y*6.+t*1.5)*uBass*.5*uTerrainScale;
  float w3=sin(uv.x*20.+t*4.)*uHighs*.15;
  float fd=freq*uBass*.8*uTerrainScale;
  float bp=uBeatPhase*.25;
  float elev=w1+w2+w3+fd+bp;
  vElevation=elev;
  vec3 p=position;
  p.y+=elev;
  gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);
}
`

const FRAG = /* glsl */ `
uniform float uTime;
uniform float uBass;
uniform float uEnergy;
uniform float uBeatPhase;
uniform float uBloomIntensity;
uniform vec3  uPrimaryColor;
uniform vec3  uSecondaryColor;
uniform float uColorShift;
uniform float uLineWidth;

varying vec2  vUv;
varying float vElevation;
varying float vDist;

void main(){
  vec2 g=abs(fract(vUv*24.)-.5);
  float lt=uLineWidth*(.04+uBass*.04);
  float gx=1.-smoothstep(0.,lt,g.x);
  float gy=1.-smoothstep(0.,lt,g.y);
  float lines=max(gx,gy);
  float hd=abs(vUv.y-.5);
  float horizon=(1.-smoothstep(0.,.1,hd))*(.3+uEnergy*.7);
  float elevN=clamp((vElevation+1.)/2.,0.,1.);
  vec3 col=mix(uPrimaryColor*.5,uSecondaryColor,elevN+uColorShift*.2);
  float beatRing=0.;
  for(int i=0;i<3;i++){
    float r=.1+float(i)*.12;
    float ring=abs(vDist-r*(1.+uBeatPhase*.2));
    beatRing+=(1.-smoothstep(0.,.015,ring))*uBeatPhase;
  }
  vec3 final=col*(lines+horizon*.5)*uBloomIntensity;
  final+=uPrimaryColor*beatRing*.5;
  final+=uPrimaryColor*lines*elevN*.4;
  float alpha=lines*(.5+uEnergy*.5)+horizon*.1+beatRing*.3;
  alpha=clamp(alpha,0.,1.)*(1.-smoothstep(.35,.6,vDist));
  gl_FragColor=vec4(final*uBloomIntensity,alpha);
}
`

export default function GridScene() {
  const matRef  = useRef<THREE.ShaderMaterial>(null)
  const { camera } = useThree()

  const audioData = useEngineStore((s) => s.audioData)
  const params    = useEngineStore((s) => s.params)
  const palette   = useEngineStore((s) => s.palette)

  // Frequency data texture (1D, 512 wide)
  const freqTexture = useMemo(() => {
    const tex = new THREE.DataTexture(
      new Uint8Array(512 * 4),
      512, 1,
      THREE.RGBAFormat,
      THREE.UnsignedByteType,
    )
    tex.needsUpdate = true
    return tex
  }, [])

  const uniforms = useMemo(() => ({
    uTime:          { value: 0 },
    uBass:          { value: 0 },
    uMids:          { value: 0 },
    uHighs:         { value: 0 },
    uEnergy:        { value: 0 },
    uBeatPhase:     { value: 0 },
    uCameraSpeed:   { value: 1 },
    uTerrainScale:  { value: 1 },
    uBloomIntensity:{ value: 1 },
    uLineWidth:     { value: 1 },
    uColorShift:    { value: 0 },
    uPrimaryColor:  { value: new THREE.Color(palette.primary[0], palette.primary[1], palette.primary[2]) },
    uSecondaryColor:{ value: new THREE.Color(palette.secondary[0], palette.secondary[1], palette.secondary[2]) },
    uFreqTexture:   { value: freqTexture },
  }), [freqTexture])

  useFrame(({ clock }) => {
    if (!matRef.current) return
    const t = clock.getElapsedTime()
    const u = matRef.current.uniforms

    u.uTime.value         = t
    u.uBass.value         = audioData.smoothBass
    u.uMids.value         = audioData.smoothMids
    u.uHighs.value        = audioData.smoothHighs
    u.uEnergy.value       = audioData.smoothEnergy
    u.uBeatPhase.value    = audioData.beatPhase
    u.uCameraSpeed.value  = params.cameraSpeed
    u.uTerrainScale.value = params.terrainScale
    u.uBloomIntensity.value = params.bloomIntensity
    u.uLineWidth.value    = params.lineWidth
    u.uColorShift.value   = params.colorShift
    u.uPrimaryColor.value.setRGB(palette.primary[0], palette.primary[1], palette.primary[2])
    u.uSecondaryColor.value.setRGB(palette.secondary[0], palette.secondary[1], palette.secondary[2])

    // Update frequency texture
    if (audioData.frequencyData) {
      const data = freqTexture.image.data as Uint8Array
      const fd = audioData.frequencyData
      for (let i = 0; i < 512; i++) {
        const v = fd[Math.floor(i * fd.length / 512)] ?? 0
        data[i * 4]     = v
        data[i * 4 + 1] = v
        data[i * 4 + 2] = v
        data[i * 4 + 3] = 255
      }
      freqTexture.needsUpdate = true
    }

    // Cinematic tracking camera
    const speed = params.cameraSpeed
    camera.position.x = Math.sin(t * 0.08 * speed) * 2
    camera.position.y = 3 + Math.sin(t * 0.05 * speed) * 0.5 + audioData.beatPhase * 0.6
    camera.position.z = 6 + Math.cos(t * 0.06 * speed) * 1.5
    camera.lookAt(0, -0.5, 0)
  })

  return (
    <>
      <fog attach="fog" args={['#080808', 6, 18]} />
      <mesh rotation={[-Math.PI / 2.2, 0, 0]} position={[0, -1, 0]}>
        <planeGeometry args={[16, 16, 96, 96]} />
        <shaderMaterial
          ref={matRef}
          vertexShader={VERT}
          fragmentShader={FRAG}
          uniforms={uniforms}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide}
        />
      </mesh>
    </>
  )
}
