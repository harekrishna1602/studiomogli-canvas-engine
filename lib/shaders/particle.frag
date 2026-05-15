// particle.frag — Particle Void Scene Fragment Shader

varying float vAlpha;
varying float vType;
varying vec3  vColor;

uniform float uBloomIntensity;

void main() {
  vec2 uv = gl_PointCoord - 0.5;
  float dist = length(uv);

  float alpha;

  if (vType < 0.5) {
    // Soft glow sphere
    alpha = 1.0 - smoothstep(0.0, 0.5, dist);
    alpha = pow(alpha, 1.5);
  } else if (vType < 1.5) {
    // Sharp point / star
    alpha = 1.0 - smoothstep(0.3, 0.5, dist);
    // Diffraction spikes
    float spike = max(
      1.0 - abs(uv.x) * 12.0 - abs(uv.y) * 2.0,
      1.0 - abs(uv.y) * 12.0 - abs(uv.x) * 2.0
    );
    alpha = max(alpha, clamp(spike, 0.0, 1.0) * 0.6);
  } else {
    // Ring particle
    float ring = abs(dist - 0.35);
    alpha = 1.0 - smoothstep(0.0, 0.06, ring);
    alpha *= 1.0 - smoothstep(0.0, 0.5, dist);
  }

  vec3 finalColor = vColor * uBloomIntensity;
  // Inner bloom
  finalColor += vColor * pow(1.0 - dist * 2.0, 3.0) * 0.5;

  gl_FragColor = vec4(finalColor, alpha * vAlpha);
}
