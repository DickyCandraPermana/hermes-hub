import * as THREE from 'three';
import { MONOLITH_VERTEX_SHADER, MONOLITH_FRAGMENT_SHADER, PARTICLE_VERTEX_SHADER, PARTICLE_FRAGMENT_SHADER } from './shaders.ts';
import { resolvePerformanceTier, PerformanceTier, FRESNEL_PALETTES } from './performance.ts';

export interface EngineTelemetry {
  fps: number;
  particles: number;
  coords: string;
  tier: string;
}

export interface EngineCallbacks {
  onTelemetry?: (data: EngineTelemetry) => void;
}

export class PortfolioEngine {
  private canvas: HTMLCanvasElement;
  private callbacks: EngineCallbacks;

  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;

  private monolithMesh!: THREE.Mesh;
  private cageMesh!: THREE.Mesh;
  private liquidMat!: THREE.ShaderMaterial;
  private cageMat!: THREE.MeshBasicMaterial;

  private particleGeo!: THREE.BufferGeometry;
  private particleMat!: THREE.ShaderMaterial;
  private particles!: THREE.Points;

  private raycaster = new THREE.Raycaster();
  private interactionPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
  private pointerNdc = new THREE.Vector2(0, 0);
  private targetPointerWorld = new THREE.Vector3(0, 0, 0);
  private targetCameraPos = new THREE.Vector3(0, 0, 10);

  private tier: PerformanceTier;
  private rafId: number | null = null;
  private isDestroyed = false;
  private isPaused = false;

  private warpVal = 0.0;
  private lastTime = performance.now();
  private frameCount = 0;
  private fpsTimer = 0;
  private currentFps = 60;

  // Adaptive performance tracking
  private frameTimes = new Float32Array(30);
  private frameIdx = 0;

  constructor(canvas: HTMLCanvasElement, callbacks: EngineCallbacks = {}) {
    this.canvas = canvas;
    this.callbacks = callbacks;

    const isMobile = typeof window !== 'undefined' && (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || window.innerWidth < 768);
    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio : 1;
    const width = typeof window !== 'undefined' ? window.innerWidth : 1280;

    this.tier = resolvePerformanceTier({
      isMobile,
      devicePixelRatio: dpr,
      screenWidth: width
    });

    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x050507, 0.035);

    const aspect = typeof window !== 'undefined' ? window.innerWidth / window.innerHeight : 16 / 9;
    this.camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 100);
    this.camera.position.set(0, 0, 10);

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: this.tier.tier >= 2,
      powerPreference: 'high-performance',
      stencil: false,
      depth: true
    });

    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, this.tier.maxDpr));

    this.initMonolith();
    this.initParticles();
    this.bindEvents();
    this.startLoop();
  }

  private initMonolith() {
    const geo = new THREE.IcosahedronGeometry(2.5, this.tier.monolithSubdivisions);

    this.liquidMat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uNoiseDensity: { value: 1.5 },
        uNoiseStrength: { value: 0.45 },
        uFresnelColor: { value: new THREE.Color(FRESNEL_PALETTES[0].hex) },
        uBaseColor: { value: new THREE.Color('#08080C') }
      },
      vertexShader: MONOLITH_VERTEX_SHADER,
      fragmentShader: MONOLITH_FRAGMENT_SHADER
    });

    this.monolithMesh = new THREE.Mesh(geo, this.liquidMat);
    // Position on right-center for desktop, centered for mobile
    const isMobile = window.innerWidth < 768;
    this.monolithMesh.position.set(isMobile ? 0 : 3.2, isMobile ? 1.5 : 0, 0);
    this.scene.add(this.monolithMesh);

    // Wireframe outer orbital cage
    const cageGeo = new THREE.IcosahedronGeometry(3.05, 2);
    this.cageMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(FRESNEL_PALETTES[0].hex),
      wireframe: true,
      transparent: true,
      opacity: 0.18
    });
    this.cageMesh = new THREE.Mesh(cageGeo, this.cageMat);
    this.monolithMesh.add(this.cageMesh);
  }

  private initParticles() {
    const count = this.tier.particleCount;
    this.particleGeo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    const scale = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      pos[i * 3 + 0] = (Math.random() - 0.5) * 35;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 35;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 25;
      scale[i] = Math.random() * 0.7 + 0.3;
    }

    this.particleGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    this.particleGeo.setAttribute('scale', new THREE.BufferAttribute(scale, 1));

    this.particleMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uMouse: { value: new THREE.Vector3(0, 0, 0) },
        uWarp: { value: 0.0 }
      },
      vertexShader: PARTICLE_VERTEX_SHADER,
      fragmentShader: PARTICLE_FRAGMENT_SHADER
    });

    this.particles = new THREE.Points(this.particleGeo, this.particleMat);
    this.scene.add(this.particles);
  }

  private handlePointer = (clientX: number, clientY: number) => {
    const rect = this.canvas.getBoundingClientRect();
    this.pointerNdc.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    this.pointerNdc.y = -((clientY - rect.top) / rect.height) * 2 + 1;

    // Mathematical Ray-Plane Unprojection against Z=0 (Zero CPU raycasting overhead)
    this.raycaster.setFromCamera(this.pointerNdc, this.camera);
    const hit = new THREE.Vector3();
    if (this.raycaster.ray.intersectPlane(this.interactionPlane, hit)) {
      this.targetPointerWorld.copy(hit);
    }
  };

  private onPointerMove = (e: PointerEvent) => {
    this.handlePointer(e.clientX, e.clientY);
  };

  private onTouchMove = (e: TouchEvent) => {
    if (e.touches.length > 0) {
      this.handlePointer(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  private onScroll = () => {
    const scrollY = window.scrollY;
    const maxScroll = Math.max(document.body.scrollHeight - window.innerHeight, 1);
    const progress = Math.min(Math.max(scrollY / maxScroll, 0), 1);

    const isMobile = window.innerWidth < 768;
    this.targetCameraPos.z = 10 - progress * 4.5;
    this.targetCameraPos.y = -progress * 3.0;
    this.targetCameraPos.x = isMobile ? 0 : Math.sin(progress * Math.PI) * 2.5;

    if (this.monolithMesh) {
      this.monolithMesh.rotation.y = progress * Math.PI * 2;
    }
  };

  private onResize = () => {
    if (this.isDestroyed) return;
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);

    const isMobile = window.innerWidth < 768;
    if (this.monolithMesh) {
      this.monolithMesh.position.set(isMobile ? 0 : 3.2, isMobile ? 1.5 : 0, 0);
    }
  };

  private onVisibilityChange = () => {
    if (document.hidden) {
      this.isPaused = true;
    } else {
      this.isPaused = false;
      this.lastTime = performance.now();
    }
  };

  private onContextLost = (e: Event) => {
    e.preventDefault();
    console.warn('[PORTFOLIO] WebGL Context Disrupted. Pausing renderer.');
    this.isPaused = true;
  };

  private onContextRestored = () => {
    console.info('[PORTFOLIO] WebGL Context Recovered. Resuming pipeline.');
    this.isPaused = false;
    this.lastTime = performance.now();
  };

  private bindEvents() {
    window.addEventListener('pointermove', this.onPointerMove, { passive: true });
    window.addEventListener('pointerdown', this.onPointerMove, { passive: true });
    window.addEventListener('touchmove', this.onTouchMove, { passive: true });
    window.addEventListener('scroll', this.onScroll, { passive: true });
    window.addEventListener('resize', this.onResize);
    document.addEventListener('visibilitychange', this.onVisibilityChange);

    this.canvas.addEventListener('webglcontextlost', this.onContextLost, false);
    this.canvas.addEventListener('webglcontextrestored', this.onContextRestored, false);
  }

  private unbindEvents() {
    window.removeEventListener('pointermove', this.onPointerMove);
    window.removeEventListener('pointerdown', this.onPointerMove);
    window.removeEventListener('touchmove', this.onTouchMove);
    window.removeEventListener('scroll', this.onScroll);
    window.removeEventListener('resize', this.onResize);
    document.removeEventListener('visibilitychange', this.onVisibilityChange);

    this.canvas.removeEventListener('webglcontextlost', this.onContextLost);
    this.canvas.removeEventListener('webglcontextrestored', this.onContextRestored);
  }

  public triggerWarp(strength: number = 1.5) {
    this.warpVal = strength;
  }

  public setFresnelColor(hex: string) {
    const col = new THREE.Color(hex);
    if (this.liquidMat) {
      this.liquidMat.uniforms.uFresnelColor.value = col;
    }
    if (this.cageMat) {
      this.cageMat.color = col;
    }
  }

  private startLoop() {
    const animate = (currentTime: number) => {
      if (this.isDestroyed) return;
      this.rafId = requestAnimationFrame(animate);

      if (this.isPaused) return;

      const delta = (currentTime - this.lastTime) / 1000;
      this.lastTime = currentTime;

      // FPS & Frame Time Tracker
      this.frameCount++;
      this.fpsTimer += delta;
      this.frameTimes[this.frameIdx] = delta * 1000;
      this.frameIdx = (this.frameIdx + 1) % this.frameTimes.length;

      if (this.fpsTimer >= 0.5) {
        this.currentFps = Math.round(this.frameCount / this.fpsTimer);
        this.frameCount = 0;
        this.fpsTimer = 0;

        if (this.callbacks.onTelemetry) {
          this.callbacks.onTelemetry({
            fps: this.currentFps,
            particles: this.tier.particleCount,
            coords: `[${this.pointerNdc.x.toFixed(2)}, ${this.pointerNdc.y.toFixed(2)}]`,
            tier: this.tier.name
          });
        }
      }

      const elapsed = currentTime * 0.001;
      this.liquidMat.uniforms.uTime.value = elapsed;
      this.particleMat.uniforms.uTime.value = elapsed;

      // Pointer lerp
      this.particleMat.uniforms.uMouse.value.lerp(this.targetPointerWorld, 0.2);

      // Warp Shockwave Decay
      if (this.warpVal > 0) {
        this.warpVal -= delta * 1.8;
        if (this.warpVal < 0) this.warpVal = 0;
        this.particleMat.uniforms.uWarp.value = this.warpVal;
      }

      // Smooth Camera Lerp
      this.camera.position.lerp(this.targetCameraPos, 0.05);
      this.camera.lookAt(0, 0, 0);

      // Idle Rotation
      if (this.monolithMesh) {
        this.monolithMesh.rotation.x = elapsed * 0.2;
        this.monolithMesh.rotation.z = elapsed * 0.15;
      }
      if (this.cageMesh) {
        this.cageMesh.rotation.y = -elapsed * 0.4;
      }
      if (this.particles) {
        this.particles.rotation.y = elapsed * 0.03;
      }

      this.renderer.render(this.scene, this.camera);
    };

    this.rafId = requestAnimationFrame(animate);
  }

  public dispose() {
    this.isDestroyed = true;
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }

    this.unbindEvents();

    // Scene Graph Resource Release
    if (this.monolithMesh) {
      this.monolithMesh.geometry.dispose();
      this.liquidMat.dispose();
      this.scene.remove(this.monolithMesh);
    }
    if (this.cageMesh) {
      this.cageMesh.geometry.dispose();
      this.cageMat.dispose();
    }
    if (this.particles) {
      this.particleGeo.dispose();
      this.particleMat.dispose();
      this.scene.remove(this.particles);
    }

    this.renderer.dispose();
    this.renderer.forceContextLoss();
  }
}
