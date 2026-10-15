import * as THREE from 'three';
import {
  ORGANIC_JELLY_VERTEX_SHADER,
  ORGANIC_JELLY_FRAGMENT_SHADER,
  BIO_SPORE_VERTEX_SHADER,
  BIO_SPORE_FRAGMENT_SHADER
} from './shaders.ts';
import { resolvePerformanceTier, PerformanceTier, FRESNEL_PALETTES, getPaletteByKey } from './performance.ts';

export interface EngineTelemetry {
  fps: number;
  particles: number;
  coords: string;
  tier: string;
}

export interface EngineCallbacks {
  onTelemetry?: (data: EngineTelemetry) => void;
  onRipple?: () => void;
}

export class PortfolioEngine {
  private canvas: HTMLCanvasElement;
  private callbacks: EngineCallbacks;

  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;

  private jellyMesh!: THREE.Mesh;
  private jellyMat!: THREE.ShaderMaterial;

  private sporeGeo!: THREE.BufferGeometry;
  private sporeMat!: THREE.ShaderMaterial;
  private spores!: THREE.Points;

  private raycaster = new THREE.Raycaster();
  private interactionPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
  private pointerNdc = new THREE.Vector2(0, 0);
  private targetPointerWorld = new THREE.Vector3(0, 0, 0);
  private targetCameraPos = new THREE.Vector3(0, 0, 11);

  private tier: PerformanceTier;
  private rafId: number | null = null;
  private isDestroyed = false;
  private isPaused = false;

  private rippleTime = 999.0;
  private rippleIntensity = 0.0;
  private rippleOrigin = new THREE.Vector3(0, 0, 0);

  private lastTime = performance.now();
  private frameCount = 0;
  private fpsTimer = 0;
  private currentFps = 60;

  constructor(canvas: HTMLCanvasElement, callbacks: EngineCallbacks = {}) {
    this.canvas = canvas;
    this.callbacks = callbacks;

    const isMobile =
      typeof window !== 'undefined' &&
      (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || window.innerWidth < 768);
    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio : 1;
    const width = typeof window !== 'undefined' ? window.innerWidth : 1280;

    this.tier = resolvePerformanceTier({
      isMobile,
      devicePixelRatio: dpr,
      screenWidth: width
    });

    this.scene = new THREE.Scene();
    // Midnight amethyst dreamscape fog
    this.scene.fog = new THREE.FogExp2(0x0c0a17, 0.032);

    const aspect = typeof window !== 'undefined' ? window.innerWidth / window.innerHeight : 16 / 9;
    this.camera = new THREE.PerspectiveCamera(55, aspect, 0.1, 100);
    this.camera.position.set(0, 0, 11);

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: this.tier.tier >= 2,
      powerPreference: 'high-performance',
      stencil: false,
      depth: true,
      alpha: true
    });

    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, this.tier.maxDpr));

    this.initOrganicJelly();
    this.initSpores();
    this.bindEvents();
    this.startLoop();
  }

  private initOrganicJelly() {
    const geo = new THREE.IcosahedronGeometry(2.7, this.tier.monolithSubdivisions);
    const initialPalette = FRESNEL_PALETTES[0];

    this.jellyMat = new THREE.ShaderMaterial({
      transparent: true,
      uniforms: {
        uTime: { value: 0 },
        uNoiseDensity: { value: 1.25 },
        uNoiseStrength: { value: 0.65 },
        uRippleOrigin: { value: new THREE.Vector3(0, 0, 0) },
        uRippleTime: { value: 999.0 },
        uRippleIntensity: { value: 0.0 },
        uBaseColor: { value: new THREE.Color('#161026') },
        uFresnelColor: { value: new THREE.Color(initialPalette.hex) },
        uSecondaryColor: { value: new THREE.Color(initialPalette.secondaryHex) }
      },
      vertexShader: ORGANIC_JELLY_VERTEX_SHADER,
      fragmentShader: ORGANIC_JELLY_FRAGMENT_SHADER
    });

    this.jellyMesh = new THREE.Mesh(geo, this.jellyMat);
    const isMobile = window.innerWidth < 768;
    this.jellyMesh.position.set(isMobile ? 0 : 3.0, isMobile ? 1.2 : 0, 0);
    this.scene.add(this.jellyMesh);
  }

  private initSpores() {
    const count = this.tier.particleCount;
    this.sporeGeo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    const scale = new Float32Array(count);
    const phase = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      pos[i * 3 + 0] = (Math.random() - 0.5) * 40;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 40;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 30;
      scale[i] = Math.random() * 0.8 + 0.3;
      phase[i] = Math.random() * Math.PI * 2;
    }

    this.sporeGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    this.sporeGeo.setAttribute('aScale', new THREE.BufferAttribute(scale, 1));
    this.sporeGeo.setAttribute('aPhase', new THREE.BufferAttribute(phase, 1));

    const initialPalette = FRESNEL_PALETTES[0];

    this.sporeMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uPointer: { value: new THREE.Vector3(0, 0, 0) },
        uRippleTime: { value: 999.0 },
        uRippleIntensity: { value: 0.0 },
        uColorA: { value: new THREE.Color(initialPalette.hex) },
        uColorB: { value: new THREE.Color(initialPalette.secondaryHex) }
      },
      vertexShader: BIO_SPORE_VERTEX_SHADER,
      fragmentShader: BIO_SPORE_FRAGMENT_SHADER
    });

    this.spores = new THREE.Points(this.sporeGeo, this.sporeMat);
    this.scene.add(this.spores);
  }

  public triggerRipple(origin?: THREE.Vector3, intensity: number = 1.0) {
    if (origin) {
      this.rippleOrigin.copy(origin);
    } else {
      this.rippleOrigin.copy(this.targetPointerWorld);
    }
    this.rippleTime = 0.0;
    this.rippleIntensity = intensity;

    if (this.callbacks.onRipple) {
      this.callbacks.onRipple();
    }
  }

  // Alias for backward compatibility with dock button
  public triggerWarp(strength: number = 1.2) {
    this.triggerRipple(new THREE.Vector3(0, 0, 0), strength);
  }

  public setFresnelColor(paletteKeyOrHex: string) {
    const palette = getPaletteByKey(paletteKeyOrHex);
    const prim = new THREE.Color(palette.hex);
    const sec = new THREE.Color(palette.secondaryHex);

    if (this.jellyMat) {
      this.jellyMat.uniforms.uFresnelColor.value = prim;
      this.jellyMat.uniforms.uSecondaryColor.value = sec;
    }
    if (this.sporeMat) {
      this.sporeMat.uniforms.uColorA.value = prim;
      this.sporeMat.uniforms.uColorB.value = sec;
    }
  }

  private handlePointer = (clientX: number, clientY: number) => {
    const rect = this.canvas.getBoundingClientRect();
    this.pointerNdc.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    this.pointerNdc.y = -((clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.pointerNdc, this.camera);
    const hit = new THREE.Vector3();
    if (this.raycaster.ray.intersectPlane(this.interactionPlane, hit)) {
      this.targetPointerWorld.copy(hit);
    }
  };

  private onPointerMove = (e: PointerEvent) => {
    this.handlePointer(e.clientX, e.clientY);
  };

  private onPointerDown = (e: PointerEvent) => {
    this.handlePointer(e.clientX, e.clientY);
    this.triggerRipple(this.targetPointerWorld, 1.25);
  };

  private onTouchMove = (e: TouchEvent) => {
    if (e.touches.length > 0) {
      this.handlePointer(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  private onTouchStart = (e: TouchEvent) => {
    if (e.touches.length > 0) {
      this.handlePointer(e.touches[0].clientX, e.touches[0].clientY);
      this.triggerRipple(this.targetPointerWorld, 1.25);
    }
  };

  private onScroll = () => {
    const scrollY = window.scrollY;
    const maxScroll = Math.max(document.body.scrollHeight - window.innerHeight, 1);
    const progress = Math.min(Math.max(scrollY / maxScroll, 0), 1);

    const isMobile = window.innerWidth < 768;
    this.targetCameraPos.z = 11 - progress * 4.0;
    this.targetCameraPos.y = -progress * 2.5;
    this.targetCameraPos.x = isMobile ? 0 : Math.sin(progress * Math.PI) * 2.2;

    if (this.jellyMesh) {
      this.jellyMesh.rotation.y = progress * Math.PI * 1.5;
    }
  };

  private onResize = () => {
    if (this.isDestroyed) return;
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);

    const isMobile = window.innerWidth < 768;
    if (this.jellyMesh) {
      this.jellyMesh.position.set(isMobile ? 0 : 3.0, isMobile ? 1.2 : 0, 0);
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
    this.isPaused = true;
  };

  private onContextRestored = () => {
    this.isPaused = false;
    this.lastTime = performance.now();
  };

  private bindEvents() {
    window.addEventListener('pointermove', this.onPointerMove, { passive: true });
    window.addEventListener('pointerdown', this.onPointerDown, { passive: true });
    window.addEventListener('touchmove', this.onTouchMove, { passive: true });
    window.addEventListener('touchstart', this.onTouchStart, { passive: true });
    window.addEventListener('scroll', this.onScroll, { passive: true });
    window.addEventListener('resize', this.onResize);
    document.addEventListener('visibilitychange', this.onVisibilityChange);

    this.canvas.addEventListener('webglcontextlost', this.onContextLost, false);
    this.canvas.addEventListener('webglcontextrestored', this.onContextRestored, false);
  }

  private unbindEvents() {
    window.removeEventListener('pointermove', this.onPointerMove);
    window.removeEventListener('pointerdown', this.onPointerDown);
    window.removeEventListener('touchmove', this.onTouchMove);
    window.removeEventListener('touchstart', this.onTouchStart);
    window.removeEventListener('scroll', this.onScroll);
    window.removeEventListener('resize', this.onResize);
    document.removeEventListener('visibilitychange', this.onVisibilityChange);

    this.canvas.removeEventListener('webglcontextlost', this.onContextLost);
    this.canvas.removeEventListener('webglcontextrestored', this.onContextRestored);
  }

  private startLoop() {
    const animate = (currentTime: number) => {
      if (this.isDestroyed) return;
      this.rafId = requestAnimationFrame(animate);

      if (this.isPaused) return;

      const delta = (currentTime - this.lastTime) / 1000;
      this.lastTime = currentTime;

      // Telemetry calculation
      this.frameCount++;
      this.fpsTimer += delta;

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

      // Update uniforms
      this.jellyMat.uniforms.uTime.value = elapsed;
      this.sporeMat.uniforms.uTime.value = elapsed;

      // Ripple propagation and decay
      if (this.rippleIntensity > 0) {
        this.rippleTime += delta;
        this.jellyMat.uniforms.uRippleTime.value = this.rippleTime;
        this.jellyMat.uniforms.uRippleIntensity.value = this.rippleIntensity;
        this.jellyMat.uniforms.uRippleOrigin.value.copy(this.rippleOrigin);

        this.sporeMat.uniforms.uRippleTime.value = this.rippleTime;
        this.sporeMat.uniforms.uRippleIntensity.value = this.rippleIntensity;

        if (this.rippleTime > 2.5) {
          this.rippleIntensity = 0;
        }
      }

      // Smooth pointer follower
      this.sporeMat.uniforms.uPointer.value.lerp(this.targetPointerWorld, 0.15);

      // Camera smooth interpolation
      this.camera.position.lerp(this.targetCameraPos, 0.05);
      this.camera.lookAt(0, 0, 0);

      // Organic fluid breathing & floating rotation
      if (this.jellyMesh) {
        this.jellyMesh.rotation.x = Math.sin(elapsed * 0.25) * 0.35 + elapsed * 0.05;
        this.jellyMesh.rotation.y = elapsed * 0.12;
        this.jellyMesh.position.y += Math.sin(elapsed * 1.2) * 0.003;
      }

      // Spore galaxy slow revolution
      if (this.spores) {
        this.spores.rotation.y = elapsed * 0.02;
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

    if (this.jellyMesh) {
      this.jellyMesh.geometry.dispose();
      this.jellyMat.dispose();
      this.scene.remove(this.jellyMesh);
    }

    if (this.spores) {
      this.sporeGeo.dispose();
      this.sporeMat.dispose();
      this.scene.remove(this.spores);
    }

    this.renderer.dispose();
    this.renderer.forceContextLoss();
  }
}
