'use client'

/**
 * TerrainScene — Bass-reactive topographic terrain
 *
 * Architecture:
 * - PlaneGeometry (128x128 segments) with custom ShaderMaterial
 * - Terrain displacement in vertex shader via simplex noise
 * - Contour line rendering in fragment shader
 * - Camera: slow cinematic drift + beat-triggered zooms
 * - Postprocessing: Bloom for glow
 */

import { useRef, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useEngineStore } from '@/lib/store'

// Inline shaders (in production, import from .glsl files)
const VERT = /* glsl */ `
uniform float uTime;
uniform float uBass;
uniform float uMids;
uniform float uEnergy;
uniform float uBeatPhase;
uniform float uBassIntensity;
uniform float uTerrainScale;
uniform float uCameraSpeed;

varying vec2  vUv;
varying float vElevation;
varying float vDist;

vec3 mod289v3(vec3 x){return x-floor(x*(1./289.))*289.;}
vec2 mod289v2(vec2 x){return x-floor(x*(1./289.))*289.;}
vec3 permute3(vec3 x){return mod289v3(((x*34.)+1.)*x);}

float snoise(vec2 v){
  const vec4 C=vec4(.211324865405187,.366025403784439,-.577350269189626,.024390243902439);
  vec2 i=floor(v+dot(v,C.yy));
  vec2 x0=v-i+dot(i,C.xx);
  vec2 i1=(x0.x>x0.y)?vec2(1.,0.):vec2(0.,1.);
  vec4 x12=x0.xyxy+C.xxzz;
  x12.xy-=i1;
  i=mod289v2(i);
  vec3 p=permute3(permute3(i.y+vec3(0.,i1.y,1.))+i.x+vec3(0.,i1.x,1.));
  vec3 m=max(.5-vec3(dot(x0,x0),dot(x12.xy,x12.xy),dot(x12.zw,x12.zw)),0.);
  m=m*m*m*m;
  vec3 x=2.*fract(p*C.www)-1.;
  vec3 h=abs(x)-.5;
  vec3 a0=x-floor(x+.5);
  m*=1.79284291400159-.85373472095314*(a0*a0+h*h);
  vec3 g;
  g.x=a0.x*x0.x+h.x*x0.y;
  g.yz=a0.yz*x12.xz+h.yz*x12.yw;
  return 130.*dot(m,g);
}

void main(){
  vUv=uv;
  vDist=length(uv-0.5);
  float t=uTime*uCameraSpeed;
  float n1=snoise(vec2(position.x*1.5*uTerrainScale,position.z*1.5*uTerrainScale)+t*.3);
  float n2=snoise(vec2(position.x*3.*uTerrainScale,position.z*3.*uTerrainScale)+t*.5)*.5;
  float n3=snoise(vec2(position.x*7.*uTerrainScale,position.z*7.*uTerrainScale)+t*1.2)*.25;
  float baseElev=n1+n2+n3;
  float bassLift=uBass*uBassIntensity*2.5;
  float beatBump=uBeatPhase*.8;
  float midsRipple=snoise(vec2(position.x*4.,t*2.+position.z))*uMids*.6;
  float elevation=baseElev*(.4+uEnergy*.8)+bassLift+beatBump+midsRipple;
  vElevation=elevation;
  vec3 disp=position;
  disp.y=elevation;
  gl_Position=projectionMatrix*modelViewMatrix*vec4(disp,1.);
}
`

const FRAG = /* glsl */ `
uniform float uTime;
uniform float uBass;
uniform float uEnergy;
uniform float uBeatPhase;
uniform float uBloomIntensity;
uniform float uFogDensity;
uniform vec3  uPrimaryColor;
uniform vec3  uSecondaryColor;
uniform float uColorShift;

varying vec2  vUv;
varying float vElevation;
varying float vDist;

void main(){
  float spacing=.12-uBass*.04;
  float contour=fract(vElevation/spacing);
  float lw=.04+uBass*.06;
  float line=1.-(smoothstep(0.,lw,contour)*smoothstep(1.,1.-lw,contour));
  float elevN=clamp((vElevation+2.)/4.,0.,1.);
  vec3 col=mix(uPrimaryColor,uSecondaryColor,elevN+uColorShift*.3);
  col+=uPrimaryColor*max(0.,vElevation-.5)*.4*uBloomIntensity;
  col+=uPrimaryColor*uBeatPhase*.3;
  float alpha=line*(.5+uEnergy*.5)*uBloomIntensity;
  alpha*=1.-vDist*uFogDensity*.8;
  float fog=1.-smoothstep(.3,.7,vDist);
  alpha*=fog;
  float bg=(1.-line)*elevN*.04*uEnergy;
  vec3 final=col+uPrimaryColor*bg;
  gl_FragColor=vec4(final,clamp(alpha,0.,1.));
}
`

export default function TerrainScene() {
  const meshRef = useRef<THREE.Mesh>(null)
  const matRef  = useRef<THREE.ShaderMaterial>(null)
  const { camera } = useThree()

  const audioData = useEngineStore((s) => s.audioData)
  const params    = useEngineStore((s) => s.params)
  const palette   = useEngineStore((s) => s.palette)

  const uniforms = useMemo(() => ({
    uTime:         { value: 0 },
    uBass:         { value: 0 },
    uMids:         { value: 0 },
    uEnergy:       { value: 0 },
    uBeatPhase:    { value: 0 },
    uBassIntensity:{ value: 1 },
    uTerrainScale: { value: 1 },
    uCameraSpeed:  { value: 1 },
    uBloomIntensity:{ value: 1 },
    uFogDensity:   { value: 0.6 },
    uPrimaryColor: { value: new THREE.Color(palette.primary[0], palette.primary[1], palette.primary[2]) },
    uSecondaryColor:{ value: new THREE.Color(palette.secondary[0], palette.secondary[1], palette.secondary[2]) },
    uColorShift:   { value: 0 },
  }), [])

  useFrame(({ clock }) => {
    if (!matRef.current) return
    const t = clock.getElapsedTime()
    const u = matRef.current.uniforms

    // Update uniforms from audio + params
    u.uTime.value         = t
    u.uBass.value         = audioData.smoothBass
    u.uMids.value         = audioData.smoothMids
    u.uEnergy.value       = audioData.smoothEnergy
    u.uBeatPhase.value    = audioData.beatPhase
    u.uBassIntensity.value= params.bassIntensity
    u.uTerrainScale.value = params.terrainScale
    u.uCameraSpeed.value  = params.cameraSpeed
    u.uBloomIntensity.value= params.bloomIntensity
    u.uFogDensity.value   = params.fogDensity
    u.uColorShift.value   = params.colorShift
    u.uPrimaryColor.value.setRGB(palette.primary[0], palette.primary[1], palette.primary[2])
    u.uSecondaryColor.value.setRGB(palette.secondary[0], palette.secondary[1], palette.secondary[2])

    // Cinematic camera drift
    const speed = params.cameraSpeed
    camera.position.x = Math.sin(t * 0.12 * speed) * 1.5
    camera.position.z = 5 + Math.cos(t * 0.08 * speed) * 0.5
    camera.position.y = 2.5 + Math.sin(t * 0.06 * speed) * 0.3
                      + audioData.beatPhase * 0.4

    // Look slightly below center
    camera.lookAt(0, -0.5, 0)
  })

  return (
    <>
      {/* Atmospheric fog */}
      <fog attach="fog" args={['#080808', 8, 20]} />

      {/* Terrain mesh — high-resolution plane */}
      <mesh
        ref={meshRef}
        rotation={[-Math.PI / 2.4, 0, 0]}
        position={[0, -1, 0]}
      >
        <planeGeometry args={[14, 14, 128, 128]} />
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

      {/* Second terrain layer, offset for depth */}
      <mesh
        rotation={[-Math.PI / 2.4, 0, 0]}
        position={[0, -2, -4]}
        scale={[1.5, 1.5, 1]}
      >
        <planeGeometry args={[14, 14, 64, 64]} />
        <shaderMaterial
          vertexShader={VERT}
          fragmentShader={FRAG}
          uniforms={{
            ...uniforms,
            uFogDensity: { value: 1.2 },
          }}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide}
        />
      </mesh>
    </>
  )
}
