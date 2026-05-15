// particle.vert — Particle Void Scene Vertex Shader

uniform float uTime;
uniform float uBass;
uniform float uVocal;
uniform float uEnergy;
uniform float uBeatPhase;
uniform float uParticleDensity;
uniform float uCameraSpeed;

attribute float aSize;
attribute float aPhase;
attribute float aOrbitSpeed;
attribute float aType;

varying float vAlpha;
varying float vType;
varying vec3  vColor;

uniform vec3  uPrimaryColor;
uniform vec3  uSecondaryColor;
uniform float uColorShift;

// Hash for randomness
float hash(float n) {
  return fract(sin(n) * 43758.5453123);
}

void main() {
  vType = aType;

  float t = uTime * uCameraSpeed;
  float phase = aPhase;

  // Orbital motion around center
  float orbitR = 0.5 + hash(phase * 7.3) * 2.5;
  float orbitAngle = t * aOrbitSpeed * 0.4 + phase * 6.2831;
  float orbitTilt  = hash(phase * 3.7) * 0.8 - 0.4;

  vec3 orbitPos = position;
  orbitPos.x += cos(orbitAngle) * orbitR * 0.2;
  orbitPos.y += sin(orbitAngle * 1.3) * orbitR * 0.1 + orbitTilt * 0.1;
  orbitPos.z += sin(orbitAngle) * orbitR * 0.2;

  // Vocal/bass reactive turbulence
  float turbX = sin(position.x * 3.0 + t * 1.5 + phase) * uVocal * 0.4;
  float turbY = cos(position.y * 2.0 + t * 1.2 + phase * 1.3) * uBass * 0.3;
  float turbZ = sin(position.z * 4.0 + t * 0.9 + phase * 2.1) * uEnergy * 0.2;

  orbitPos += vec3(turbX, turbY, turbZ);

  // Beat explosion
  float dist = length(position);
  orbitPos += normalize(position) * uBeatPhase * dist * 0.15;

  // Projected position
  vec4 mvPosition = modelViewMatrix * vec4(orbitPos, 1.0);
  gl_Position = projectionMatrix * mvPosition;

  // Size — vocal and bass reactive
  float size = aSize * (0.8 + uVocal * 2.0 * uParticleDensity + uBeatPhase * 0.5);
  gl_PointSize = size * (300.0 / -mvPosition.z);

  // Alpha based on distance from center
  float distCenter = length(orbitPos.xz) / 3.0;
  vAlpha = clamp(1.0 - distCenter * 0.5, 0.0, 1.0) * (0.4 + uEnergy * 0.6);

  // Color mixing
  float colorT = hash(phase * 5.1) + uColorShift;
  vColor = mix(uPrimaryColor, uSecondaryColor, fract(colorT));
  vColor = mix(vColor, vec3(1.0), uVocal * 0.2);
}
