# Surreal Organic Dreamscape (Froerybell Vibe) Portfolio Specification

**Status:** Approved  
**Date:** 2026-10-16  
**Target:** `/portfolio` in `hermes-hub` (Next.js 16.3.8 App Router, React 19.2.8, Vanilla Three.js)  
**Persona Resonance:** Froerybell (*Freaky amoeba fairy thinkerbell*) & ThearinaZs (*The Endless Sequence*)  

---

## 1. Vision & Core Philosophy

The previous cyber-brutalist implementation felt too rigid, clunky, and boxy—resembling a 90s terminal hacker dashboard rather than an Awwwards Site of the Year interactive masterpiece.

This redesign completely overhauls the experience into **Surreal Organic Dreamscape**:
1. **Fluid Liquid Glass & Amorphous Metaball (Layer 0):** An organic, breathing fluid entity governed by continuous 3D simplex noise deformation, dynamic touch ripples, and thin-film pearlescent chromatic dispersion (lavender haze, iridescent mint, champagne rose, soft moonstone white).
2. **Bioluminescent Spore Field:** 15,000 luminous drifting spores with soft harmonic motion, creating a mesmerizing underwater/celestial atmosphere.
3. **Editorial Stream & Floating Glass Pills (Layer 2):** Complete elimination of boxy, 2-column cards. Replaced with an airy, high-fashion editorial stream featuring frosted glass pills (`backdrop-blur-3xl bg-white/[0.04] border-white/10 rounded-3xl`), generous whitespace, and delicate micro-typography.
4. **Crystalline Ethereal Audio:** Replaces aggressive 8-bit saw waves with meditative pentatonic crystal bowl harmonics synthesized procedurally via the Web Audio API.
5. **Absolute Privacy:** Strict zero-leakage guarantee regarding the author's real identity. All projects are grounded in verifiable technical achievements with persona codenames.

---

## 2. Technical Architecture & Component Hierarchy

```
app/portfolio/page.tsx (Client Component Orchestrator)
 ├── PortfolioCanvas (Three.js WebGL Engine, z: 0)
 │    ├── OrganicJellyMesh (Icosahedron + Thin-Film Pearlescent Shader)
 │    ├── DynamicRippleSystem (Pointer/Touch velocity impulse buffer)
 │    └── SporeField (15,000 GPU instanced floating bioluminescent spores)
 ├── EtherealGlowOverlay (Soft vignette & subtle chromatic refraction, z: 10)
 └── EditorialLayout (z: 20, pointer-events-none container)
      ├── EtherealHeader (Editorial title, Froerybell archetype badge, sound toggle)
      ├── ProjectEditorialStream (Fluid, airy frosted glass cards with generous margin)
      ├── ProjectDossierSheet (Floating fluid drawer with deep technical architecture)
      └── FloatingFluidDock (Pill dock: Ripple pulse, Chromatic shift, Project drawer, Sound)
```

---

## 3. Shaders & Visual Engine

### A. Pearlescent Thin-Film Jelly Shader
- **Vertex Shader:** Multi-octave continuous domain noise with dynamic vertex displacement:
  $$P_{new} = P + N \cdot (\text{snoise}(P \cdot \text{scale} + t) \cdot \text{strength} + \text{rippleImpulse})$$
- **Fragment Shader:** High-order view-dependent Fresnel with thin-film chromatic dispersion:
  $$\text{Fresnel} = (1.0 - \vec{N} \cdot \vec{V})^{3.2}$$
  Interpolates through chromatic anchors:
  - Moonstone Violet: `#D8B4FE`
  - Iridescent Mint: `#6EE7B7`
  - Peach Champagne: `#FDBA74`
  - Ethereal Rose: `#FDA4AF`
- **TBDR Mobile Optimization:** Zero `discard` instructions in particle/spore shaders. Dynamic DPR capped at 1.0 on mobile to maintain 60–120 FPS.

---

## 4. Grounded Project Catalog

1. **`FRO-01` — Kraft Heinz OMS Algorithmic Pipeline**
   - *Domain:* Supply Chain Intelligence & 77-Chunk Vector RAG
   - *Metrics:* `< 2.4s` Solver Runtime • `77 Chunks` Vector Knowledge • `45,000+` SKUs
2. **`FRO-02` — The Key Hub Autonomous Console**
   - *Domain:* Distributed Multi-Agent Runtime & Real-Time SSE
   - *Metrics:* `18ms` First Token • `Zero Leak` DLP Stream • `10 Subagents`
3. **`FRO-03` — Universal Central API Gateway**
   - *Domain:* Headless Protocol Mesh & Zero-Trust
   - *Metrics:* `99.99%` Uptime • `< 22ms` Edge Routing • `5 MCP Bridges`
4. **`FRO-04` — Distributed Mesh & Edge Cloud**
   - *Domain:* Autonomous Edge Tunnels & Infrastructure
   - *Metrics:* `0 Exposed Ports` • `HTTP/3` Routing • `< 35ms` Global Latency
