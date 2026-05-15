'use client'

/**
 * ParticleScene — Voice-reactive particle void
 *
 * Architecture:
 * - BufferGeometry with 8000 instanced points
 * - Custom attributes: aSize, aPhase, aOrbitSpeed, aType
 * - ShaderMaterial with additive blending
 * - Orbital + turbulence forces mapped to vocal/bass
 * - Camera: slow orbit with beat-triggered jolts
 */

import { useRef, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useEngineStore } from '@/lib/store'

const PARTICLE_COUNT = 8000

const VERT = /* glsl */ `
uniform float uTime;
uniform float uBass;
uniform float uVocal;
uniform float uEnergy;
uniform float uBeatPhase;
uniform float uParticleDensity;
uniform float uCameraSpeed;
uniform vec3  uPrimaryColor;
uniform vec3  uSecondaryColor;
uniform float uColorShift;

attribute float aSize;
attribute float aPhase;
attribute float aOrbitSpeed;
attribute float aType;

varying float vAlpha;
varying float vType;
varying vec3  vColor;

float hash(float n){return fract(sin(n)*43758.5453123);}

void main(){
  vType=aType;
  float t=uTime*uCameraSpeed;
  float phase=aPhase;
  float orbitR=.5+hash(phase*7.3)*2.5;
  float angle=t*aOrbitSpeed*.4+phase*6.2831;
  float tiltX=cos(angle)*orbitR*.2;
  float tiltY=sin(angle*1.3)*orbitR*.1+hash(phase*3.7)*.2-.1;
  float tiltZ=sin(angle)*orbitR*.2;
  vec3 p=position;
  p.x+=tiltX;p.y+=tiltY;p.z+=tiltZ;
  p.x+=sin(position.x*3.+t*1.5+phase)*uVocal*.4;
  p.y+=cos(position.y*2.+t*1.2+phase*1.3)*uBass*.3;
  p.z+=sin(position.z*4.+t*.9+phase*2.1)*uEnergy*.2;
  p+=normalize(position)*uBeatPhase*length(position)*.15;
  vec4 mv=modelViewMatrix*vec4(p,1.);
  gl_Position=projectionMatrix*mv;
  gl_PointSize=aSize*(1.+uVocal*2.*uParticleDensity+uBeatPhase*.5)*(300./-mv.z);
  float dc=length(p.xz)/3.;
  vAlpha=clamp(1.-dc*.5,0.,1.)*(.4+uEnergy*.6);
  float ct=hash(phase*5.1)+uColorShift;
  vColor=mix(uPrimaryColor,uSecondaryColor,fract(ct));
  vColor=mix(vColor,vec3(1.),uVocal*.2);
}
`

const FRAG = /* glsl */ `
varying float vAlpha;
varying float vType;
varying vec3  vColor;
uniform float uBloomIntensity;

void main(){
  vec2 uv=gl_PointCoord-.5;
  float d=length(uv);
  float alpha;
  if(vType<.5){
    alpha=1.-smoothstep(0.,.5,d);
    alpha=pow(alpha,1.5);
  }else if(vType<1.5){
    alpha=1.-smoothstep(.3,.5,d);
    float spike=max(1.-abs(uv.x)*12.-abs(uv.y)*2.,1.-abs(uv.y)*12.-abs(uv.x)*2.);
    alpha=max(alpha,clamp(spike,0.,1.)*.6);
  }else{
    float ring=abs(d-.35);
    alpha=(1.-smoothstep(0.,.06,ring))*(1.-smoothstep(0.,.5,d));
  }
  vec3 col=vColor*uBloomIntensity;
  col+=vColor*pow(max(0.,1.-d*2.),3.)*.5;
  gl_FragColor=vec4(col,alpha*vAlpha);
}
`

export default function ParticleScene() {
  const geoRef  = useRef<THREE.BufferGeometry>(null)
  const matRef  = useRef<THREE.ShaderMaterial>(null)
  const { camera } = useThree()

  const audioData = useEngineStore((s) => s.audioData)
  const params    = useEngineStore((s) => s.params)
  const palette   = useEngineStore((s) => s.palette)

  // Build particle geometry attributes
  const { positions, sizes, phases, orbitSpeeds, types } = useMemo(() => {
    const positions   = new Float32Array(PARTICLE_COUNT * 3)
    const sizes       = new Float32Array(PARTICLE_COUNT)
    const phases      = new Float32Array(PARTICLE_COUNT)
    const orbitSpeeds = new Float32Array(PARTICLE_COUNT)
    const types       = new Float32Array(PARTICLE_COUNT)

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      // Spherical distribution
      const theta = Math.random() * Math.PI * 2
      const phi   = Math.acos(2 * Math.random() - 1)
      const r     = 0.1 + Math.random() * 3.0

      positions[i * 3]     = r * Math.sin(phi) * Math.cos(theta)
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.5
      positions[i * 3 + 2] = r * Math.cos(phi)

      sizes[i]       = 1.5 + Math.random() * 3.0
      phases[i]      = Math.random() * Math.PI * 2
      orbitSpeeds[i] = (Math.random() - 0.5) * 2.0
      types[i]       = Math.floor(Math.random() * 3)
    }

    return { positions, sizes, phases, orbitSpeeds, types }
  }, [])

  const uniforms = useMemo(() => ({
    uTime:           { value: 0 },
    uBass:           { value: 0 },
    uVocal:          { value: 0 },
    uEnergy:         { value: 0 },
    uBeatPhase:      { value: 0 },
    uParticleDensity:{ value: 1 },
    uCameraSpeed:    { value: 1 },
    uBloomIntensity: { value: 1 },
    uPrimaryColor:   { value: new THREE.Color(palette.primary[0], palette.primary[1], palette.primary[2]) },
    uSecondaryColor: { value: new THREE.Color(palette.secondary[0], palette.secondary[1], palette.secondary[2]) },
    uColorShift:     { value: 0 },
  }), [])

  useFrame(({ clock }) => {
    if (!matRef.current) return
    const t = clock.getElapsedTime()
    const u = matRef.current.uniforms

    u.uTime.value          = t
    u.uBass.value          = audioData.smoothBass
    u.uVocal.value         = audioData.smoothVocal
    u.uEnergy.value        = audioData.smoothEnergy
    u.uBeatPhase.value     = audioData.beatPhase
    u.uParticleDensity.value = params.particleDensity
    u.uCameraSpeed.value   = params.cameraSpeed
    u.uBloomIntensity.value = params.bloomIntensity
    u.uColorShift.value    = params.colorShift
    u.uPrimaryColor.value.setRGB(palette.primary[0], palette.primary[1], palette.primary[2])
    u.uSecondaryColor.value.setRGB(palette.secondary[0], palette.secondary[1], palette.secondary[2])

    // Orbital camera
    const speed = params.cameraSpeed
    camera.position.x = Math.sin(t * 0.15 * speed) * 4
    camera.position.y = Math.sin(t * 0.09 * speed) * 1.5
    camera.position.z = 5 + Math.cos(t * 0.07 * speed) * 1.5
                      + audioData.beatPhase * 0.8

    camera.lookAt(0, 0, 0)
  })

  return (
    <>
      <fog attach="fog" args={['#080808', 5, 14]} />
      <points>
        <bufferGeometry ref={geoRef}>
          <bufferAttribute attach="attributes-position"   array={positions}   itemSize={3} count={PARTICLE_COUNT} />
          <bufferAttribute attach="attributes-aSize"      array={sizes}       itemSize={1} count={PARTICLE_COUNT} />
          <bufferAttribute attach="attributes-aPhase"     array={phases}      itemSize={1} count={PARTICLE_COUNT} />
          <bufferAttribute attach="attributes-aOrbitSpeed" array={orbitSpeeds} itemSize={1} count={PARTICLE_COUNT} />
          <bufferAttribute attach="attributes-aType"      array={types}       itemSize={1} count={PARTICLE_COUNT} />
        </bufferGeometry>
        <shaderMaterial
          ref={matRef}
          vertexShader={VERT}
          fragmentShader={FRAG}
          uniforms={uniforms}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </>
  )
}
