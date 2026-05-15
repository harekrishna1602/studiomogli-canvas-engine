// terrain.frag — Terrain Pulse Scene Fragment Shader
// Orange topographic contour lines with atmospheric glow

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
varying float vDistFromCenter;

void main() {
  // === Contour Lines ===
  float contourSpacing = 0.12 - uBass * 0.04;
  float contour = fract(vElevation / contourSpacing);

  // Anti-aliased line
  float lineWidth = 0.04 + uBass * 0.06;
  float line = smoothstep(0.0, lineWidth, contour) *
               smoothstep(1.0, 1.0 - lineWidth, contour);

  // Invert to get line on ridge
  line = 1.0 - line;

  // === Color ===
  // Base orange with elevation-driven hue shift
  float elevNorm = clamp((vElevation + 2.0) / 4.0, 0.0, 1.0);
  vec3 lineColor = mix(uPrimaryColor, uSecondaryColor, elevNorm + uColorShift * 0.3);

  // Altitude glow — bright peaks
  lineColor += uPrimaryColor * max(0.0, vElevation - 0.5) * 0.4 * uBloomIntensity;

  // Beat pulse brightens lines
  lineColor += uPrimaryColor * uBeatPhase * 0.3;

  // === Alpha ===
  float alpha = line * (0.5 + uEnergy * 0.5) * uBloomIntensity;
  alpha *= (1.0 - vDistFromCenter * uFogDensity * 0.8);

  // Fog falloff at edges
  float fog = 1.0 - smoothstep(0.3, 0.7, vDistFromCenter);
  alpha *= fog;

  // Minimum background glow between lines
  float bgGlow = (1.0 - line) * elevNorm * 0.04 * uEnergy;
  vec3 finalColor = lineColor + uPrimaryColor * bgGlow;

  gl_FragColor = vec4(finalColor, clamp(alpha, 0.0, 1.0));
}
