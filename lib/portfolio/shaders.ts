export const SIMPLEX_3D_CHUNK = /* glsl */ `
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

  float snoise(vec3 v) {
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i  = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    i = mod289(i);
    vec4 p = permute(permute(permute(
              i.z + vec4(0.0, i1.z, i2.z, 1.0))
            + i.y + vec4(0.0, i1.y, i2.y, 1.0))
            + i.x + vec4(0.0, i1.x, i2.x, 1.0));
    float n_ = 0.142857142857;
    vec3  ns = n_ * D.wyz - D.xzx;
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
    vec4 x = x_ *ns.x + ns.yyyy;
    vec4 y = y_ *ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);
    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
    p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
  }
`;

// Organic Amorphous Jelly Vertex Shader with dynamic touch ripples
export const ORGANIC_JELLY_VERTEX_SHADER = /* glsl */ `
  uniform float uTime;
  uniform float uNoiseDensity;
  uniform float uNoiseStrength;
  uniform vec3 uRippleOrigin;
  uniform float uRippleTime;
  uniform float uRippleIntensity;
  
  varying vec3 vNormal;
  varying vec3 vViewPosition;
  varying vec3 vWorldPosition;
  varying float vDisplacement;

  ${SIMPLEX_3D_CHUNK}

  void main() {
    vNormal = normalize(normalMatrix * normal);
    vec3 pos = position;

    // Continuous 3D domain simplex noise morphing
    float slowTime = uTime * 0.45;
    float n1 = snoise(pos * uNoiseDensity + vec3(0.0, slowTime * 0.5, slowTime * 0.3));
    float n2 = snoise(pos * (uNoiseDensity * 1.8) - vec3(slowTime * 0.4, 0.0, slowTime * 0.2)) * 0.45;
    float totalNoise = n1 + n2;

    // Organic ripple pulse triggered by touch/click
    float distToOrigin = distance(pos, uRippleOrigin);
    float rippleWave = sin(distToOrigin * 6.0 - uRippleTime * 8.0);
    float rippleDamp = exp(-distToOrigin * 1.5) * exp(-uRippleTime * 2.2);
    float ripple = rippleWave * rippleDamp * uRippleIntensity;

    float displacement = (totalNoise * uNoiseStrength) + ripple;
    vDisplacement = displacement;
    pos += normal * displacement;

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    vViewPosition = -mvPosition.xyz;
    vWorldPosition = (modelMatrix * vec4(pos, 1.0)).xyz;
    gl_Position = projectionMatrix * mvPosition;
  }
`;

// Thin-Film Pearlescent Chromatic Jelly Fragment Shader
export const ORGANIC_JELLY_FRAGMENT_SHADER = /* glsl */ `
  uniform vec3 uBaseColor;
  uniform vec3 uFresnelColor;
  uniform vec3 uSecondaryColor;
  uniform float uTime;

  varying vec3 vNormal;
  varying vec3 vViewPosition;
  varying vec3 vWorldPosition;
  varying float vDisplacement;

  void main() {
    vec3 normal = normalize(vNormal);
    vec3 viewDir = normalize(vViewPosition);

    // High-order smooth Fresnel curve
    float NdotV = clamp(dot(normal, viewDir), 0.0, 1.0);
    float fresnel = pow(1.0 - NdotV, 3.2);

    // Thin-film iridescent chromatic dispersion
    float chromaticPhase = NdotV * 3.14159 + (vDisplacement * 2.5) + (uTime * 0.2);
    vec3 iridescentColor;
    iridescentColor.r = sin(chromaticPhase) * 0.5 + 0.5;
    iridescentColor.g = sin(chromaticPhase + 2.094) * 0.5 + 0.5; // +120 deg
    iridescentColor.b = sin(chromaticPhase + 4.188) * 0.5 + 0.5; // +240 deg

    // Blend between primary base, pearlescent glow, and secondary chromatic hue
    vec3 softPearlescent = mix(uFresnelColor, uSecondaryColor, iridescentColor.g);
    vec3 surface = mix(uBaseColor, softPearlescent, fresnel * 0.85);

    // Dual soft specular highlights (moonstone glint)
    vec3 lightDir1 = normalize(vec3(1.2, 2.0, 1.8));
    vec3 lightDir2 = normalize(vec3(-1.5, -1.0, 0.8));
    
    vec3 half1 = normalize(lightDir1 + viewDir);
    vec3 half2 = normalize(lightDir2 + viewDir);
    
    float spec1 = pow(max(dot(normal, half1), 0.0), 40.0) * 0.65;
    float spec2 = pow(max(dot(normal, half2), 0.0), 24.0) * 0.35;

    vec3 finalGlow = surface + vec3(spec1 + spec2) * (uFresnelColor * 0.5 + 0.5);
    gl_FragColor = vec4(finalGlow, 0.94);
  }
`;

// 15,000 Bioluminescent Deep-Sea Spores Vertex Shader
export const BIO_SPORE_VERTEX_SHADER = /* glsl */ `
  uniform float uTime;
  uniform vec3 uPointer;
  uniform float uRippleTime;
  uniform float uRippleIntensity;
  attribute float aScale;
  attribute float aPhase;

  varying float vAlpha;
  varying vec3 vColor;

  uniform vec3 uColorA;
  uniform vec3 uColorB;

  void main() {
    vec3 pos = position;

    // Harmonic floating ocean wave drift
    float t = uTime * 0.6 + aPhase;
    pos.x += sin(t * 1.2 + pos.y * 0.3) * 0.65;
    pos.y += cos(t * 0.9 + pos.x * 0.4) * 0.55;
    pos.z += sin(t * 1.5 + pos.z * 0.2) * 0.45;

    // Gentle repulsion from touch/pointer
    float dist = distance(pos.xy, uPointer.xy);
    if (dist < 4.5) {
      vec2 pushDir = normalize(pos.xy - uPointer.xy);
      pos.xy += pushDir * (4.5 - dist) * 0.85;
    }

    // Ripple expansion impulse
    if (uRippleIntensity > 0.0 && uRippleTime < 2.0) {
      float rDist = length(pos);
      float shock = sin(rDist * 4.0 - uRippleTime * 6.0) * exp(-uRippleTime * 1.5);
      pos += normalize(pos) * (shock * uRippleIntensity * 1.8);
    }

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_PointSize = aScale * (24.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;

    // Color gradient across spore depth
    float mixFactor = sin(aPhase + uTime * 0.3) * 0.5 + 0.5;
    vColor = mix(uColorA, uColorB, mixFactor);
    vAlpha = clamp(0.35 + sin(t * 2.0) * 0.25, 0.2, 0.95);
  }
`;

// TBDR-Compliant Branchless Spore Fragment Shader (Zero Discard for 120 FPS)
export const BIO_SPORE_FRAGMENT_SHADER = /* glsl */ `
  varying float vAlpha;
  varying vec3 vColor;

  void main() {
    float dist = length(gl_PointCoord - vec2(0.5));
    // Soft gaussian-like circular glow without discard
    float intensity = clamp(0.5 - dist, 0.0, 1.0) * 2.0;
    intensity = intensity * intensity * intensity; // Smooth cubic falloff

    gl_FragColor = vec4(vColor * (intensity * vAlpha), intensity * vAlpha);
  }
`;

// Backward-compatibility aliases
export const MONOLITH_VERTEX_SHADER = ORGANIC_JELLY_VERTEX_SHADER;
export const MONOLITH_FRAGMENT_SHADER = ORGANIC_JELLY_FRAGMENT_SHADER;
export const PARTICLE_VERTEX_SHADER = BIO_SPORE_VERTEX_SHADER;
export const PARTICLE_FRAGMENT_SHADER = BIO_SPORE_FRAGMENT_SHADER;
