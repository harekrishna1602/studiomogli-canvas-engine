// terrain.vert — Terrain Pulse Scene Vertex Shader
// Bass-reactive topographic terrain displacement

uniform float uTime;
uniform float uBass;
uniform float uMids;
uniform float uEnergy;
uniform float uBeatPhase;
uniform float uBassIntensity;
uniform float uTerrainScale;
uniform float uCameraSpeed;

varying vec2 vUv;
varying float vElevation;
varying float vDistFromCenter;

// Classic 2D noise
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                      -0.577350269189626, 0.024390243902439);
  vec2 i = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod289(i);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0))
    + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy),
    dot(x12.zw,x12.zw)), 0.0);
  m = m*m;
  m = m*m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0*a0+h*h);
  vec3 g;
  g.x  = a0.x  * x0.x  + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

void main() {
  vUv = uv;

  // Distance from center for perspective fade
  vDistFromCenter = length(uv - 0.5);

  float t = uTime * uCameraSpeed;

  // Multi-octave noise terrain
  float n1 = snoise(vec2(position.x * 1.5 * uTerrainScale, position.z * 1.5 * uTerrainScale) + t * 0.3);
  float n2 = snoise(vec2(position.x * 3.0 * uTerrainScale, position.z * 3.0 * uTerrainScale) + t * 0.5) * 0.5;
  float n3 = snoise(vec2(position.x * 7.0 * uTerrainScale, position.z * 7.0 * uTerrainScale) + t * 1.2) * 0.25;

  float baseElevation = n1 + n2 + n3;

  // Audio reactive displacement
  float bassLift    = uBass  * uBassIntensity * 2.5;
  float beatBump    = uBeatPhase * 0.8;
  float midsRipple  = snoise(vec2(position.x * 4.0, t * 2.0 + position.z)) * uMids * 0.6;

  float elevation = baseElevation * (0.4 + uEnergy * 0.8)
                  + bassLift
                  + beatBump
                  + midsRipple;

  vElevation = elevation;

  vec3 displaced = position;
  displaced.y = elevation;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
}
