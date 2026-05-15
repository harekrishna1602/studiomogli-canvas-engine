// grid.vert — Audio Grid Scene Vertex Shader

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

void main() {
  vUv = uv;

  float t = uTime * uCameraSpeed;

  // Sample frequency texture for per-column reactivity
  float freqSample = texture2D(uFreqTexture, vec2(uv.x, 0.5)).r;

  // Wave displacement
  float wave1 = sin(uv.x * 8.0 + t * 2.0) * uMids * 0.3 * uTerrainScale;
  float wave2 = sin(uv.y * 6.0 + t * 1.5) * uBass  * 0.5 * uTerrainScale;
  float wave3 = sin(uv.x * 20.0 + t * 4.0) * uHighs * 0.15;
  float freqDisplace = freqSample * uBass * 0.8 * uTerrainScale;
  float beatPush     = uBeatPhase * 0.25;

  float elevation = wave1 + wave2 + wave3 + freqDisplace + beatPush;
  vElevation = elevation;
  vDist = length(uv - 0.5);

  vec3 displaced = position;
  displaced.y += elevation;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
}
