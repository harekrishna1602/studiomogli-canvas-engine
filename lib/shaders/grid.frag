// grid.frag — Audio Grid Scene Fragment Shader
// Futuristic reactive grid with horizon glow

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

void main() {
  // Grid lines
  vec2 grid = abs(fract(vUv * 24.0) - 0.5);

  float lineThick = uLineWidth * (0.04 + uBass * 0.04);
  float gx = 1.0 - smoothstep(0.0, lineThick, grid.x);
  float gy = 1.0 - smoothstep(0.0, lineThick, grid.y);
  float lines = max(gx, gy);

  // Horizon glow
  float horizonDist = abs(vUv.y - 0.5);
  float horizon = 1.0 - smoothstep(0.0, 0.1, horizonDist);
  horizon *= 0.3 + uEnergy * 0.7;

  // Elevation color
  float elevNorm = clamp((vElevation + 1.0) / 2.0, 0.0, 1.0);
  vec3 col = mix(uPrimaryColor * 0.5, uSecondaryColor, elevNorm + uColorShift * 0.2);

  // Beat pulse rings
  float beatRing = 0.0;
  for (int i = 0; i < 3; i++) {
    float r = 0.1 + float(i) * 0.12;
    float ring = abs(vDist - r * (1.0 + uBeatPhase * 0.2));
    beatRing += (1.0 - smoothstep(0.0, 0.015, ring)) * uBeatPhase;
  }

  // Final color
  vec3 finalColor = col * (lines + horizon * 0.5) * uBloomIntensity;
  finalColor += uPrimaryColor * beatRing * 0.5;
  finalColor += uPrimaryColor * lines * elevNorm * 0.4;

  float alpha = lines * (0.5 + uEnergy * 0.5)
              + horizon * 0.1
              + beatRing * 0.3;
  alpha = clamp(alpha, 0.0, 1.0);

  // Edge fog
  alpha *= 1.0 - smoothstep(0.35, 0.6, vDist);

  gl_FragColor = vec4(finalColor * uBloomIntensity, alpha);
}
