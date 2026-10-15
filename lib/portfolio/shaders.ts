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

export const MONOLITH_VERTEX_SHADER = /* glsl */ `
  uniform float uTime;
  uniform float uNoiseDensity;
  uniform float uNoiseStrength;
  varying vec3 vNormal;
  varying vec3 vViewPosition;

  ${SIMPLEX_3D_CHUNK}

  void main() {
    vNormal = normalize(normalMatrix * normal);
    vec3 pos = position;
    float noise = snoise(pos * uNoiseDensity + vec3(0.0, 0.0, uTime * 0.35));
    pos += normal * (noise * uNoiseStrength);
    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    vViewPosition = -mvPosition.xyz;
    gl_Position = projectionMatrix * mvPosition;
  }
`;

export const MONOLITH_FRAGMENT_SHADER = /* glsl */ `
  uniform vec3 uBaseColor;
  uniform vec3 uFresnelColor;
  varying vec3 vNormal;
  varying vec3 vViewPosition;

  void main() {
    vec3 normal = normalize(vNormal);
    vec3 viewDir = normalize(vViewPosition);
    
    // Smooth high-order Fresnel curve
    float fresnel = clamp(1.0 - dot(normal, viewDir), 0.0, 1.0);
    float fresnelPow = pow(fresnel, 2.8);

    // Specular Highlight Glint
    vec3 lightDir = normalize(vec3(1.0, 2.0, 1.5));
    vec3 halfVec = normalize(lightDir + viewDir);
    float spec = pow(max(dot(normal, halfVec), 0.0), 32.0);

    vec3 finalColor = mix(uBaseColor, uFresnelColor, fresnelPow) + (spec * 0.85);
    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

export const PARTICLE_VERTEX_SHADER = /* glsl */ `
  uniform float uTime;
  uniform vec3 uMouse;
  uniform float uWarp;
  attribute float scale;
  varying float vDistance;

  void main() {
    vec3 pos = position;

    // Magnetic mouse / pointer interaction
    float d = distance(pos.xy, uMouse.xy);
    vDistance = d;
    if (d < 5.0) {
      vec2 dir = normalize(pos.xy - uMouse.xy);
      pos.xy += dir * (5.0 - d) * 1.35;
    }

    // Zero-G Radial Warp Shockwave
    if (uWarp > 0.0) {
      pos += normalize(pos) * sin(uWarp * 3.14159) * 6.5;
    }

    // Ambient floating harmonic drift
    pos.z += sin(uTime * 1.5 + pos.x) * 0.45;

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_PointSize = scale * (22.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

// Branchless TBDR-Compliant Particle Shader (Zero Discard for Mobile 120 FPS)
export const PARTICLE_FRAGMENT_SHADER = /* glsl */ `
  varying float vDistance;

  void main() {
    float dist = length(gl_PointCoord - vec2(0.5));
    // Branchless soft circular falloff without discard instruction
    float alpha = clamp(0.5 - dist, 0.0, 1.0) * 2.0;
    alpha = alpha * alpha; // Quadratic easing

    vec3 cyan = vec3(0.0, 0.94, 1.0);
    vec3 amber = vec3(1.0, 0.33, 0.0);
    vec3 col = mix(cyan, amber, clamp(vDistance / 6.0, 0.0, 1.0));

    gl_FragColor = vec4(col * alpha, alpha * 0.85);
  }
`;
