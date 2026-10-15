# Organic Dreamscape Portfolio Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Overhaul the `/portfolio` route in `hermes-hub` from the boxy cyber-brutalist theme into a surreal organic dreamscape (Froerybell vibe) with pearlescent liquid glass shaders, 15,000 bioluminescent spores, airy editorial typography, and crystal bowl Web Audio acoustics.

**Architecture:** Vanilla Three.js wrapped in React 19 hooks with procedural thin-film pearlescent GLSL shaders and continuous domain noise, decoupled from React state. UI is structured as a floating editorial stream of frosted glass pills (`backdrop-blur-3xl bg-white/[0.04] border-white/10 rounded-3xl`) with generous negative space, replacing the rigid 2-column boxy grid.

**Tech Stack:** Next.js 16.3.8 (App Router), React 19.2.8, Tailwind CSS v4, Vanilla Three.js r186, Web Audio API.

**Spec:** `docs/superpowers/specs/2026-10-16-organic-dreamscape-portfolio-design.md`

## Global Constraints
- Absolute Zero Privacy Leakage: The user's real name or private credentials must NEVER appear anywhere in code, metadata, or rendered UI.
- React 19 Strict Lifecycle: All Three.js render loops must run outside React state to maintain 60–120 FPS.
- Mobile TBDR Compliance: No `discard` instructions in spore fragment shaders.

## Review Focus
- Touch/mouse ripple propagation on mobile without frame drops.
- Seamless responsive transition from mobile (390px) to desktop (1440px).
- Frosted glass contrast readability against moving 3D background.
- Clean WebGL context cleanup on unmount to prevent leaks.
- Zero audio popping or autoplay blocking on iOS Safari/Android Chrome.

---

### Task 1: Pearlescent Shaders & Crystal Web Audio Engine

**Files:**
- Modify: `lib/portfolio/shaders.ts`
- Modify: `lib/portfolio/audio.ts`
- Modify: `lib/portfolio/performance.ts`
- Test: `tests/portfolio.test.ts`

- [x] **Step 1: Update unit tests for pearlescent palettes and audio frequencies**
- [x] **Step 2: Implement thin-film pearlescent GLSL shaders with chromatic dispersion**
- [x] **Step 3: Implement meditative crystal singing bowl synthesizer in `lib/portfolio/audio.ts`**
- [x] **Step 4: Run unit tests to verify 100% pass rate**
- [x] **Step 5: Commit changes**

---

### Task 2: Organic Jelly & Bioluminescent Spore 3D Engine

**Files:**
- Modify: `lib/portfolio/engine.ts`
- Test: `tests/portfolio.test.ts`

- [x] **Step 1: Replace rigid monolith and wireframe cage with organic morphing jelly and dynamic touch ripple buffer**
- [x] **Step 2: Implement 15,000 bioluminescent spores with soft harmonic drift and branchless falloff**
- [x] **Step 3: Test engine compilation and lifecycle disposal**
- [x] **Step 4: Commit changes**

---

### Task 3: Editorial Stream UI & Floating Frosted Glass Pills

**Files:**
- Create/Modify: `components/portfolio/TacticalHeader.tsx` -> `EtherealHeader.tsx`
- Create/Modify: `components/portfolio/ShowcaseDeck.tsx` -> `EditorialStream.tsx`
- Create/Modify: `components/portfolio/TacticalDock.tsx` -> `FloatingFluidDock.tsx`
- Modify: `components/portfolio/MissionModal.tsx` -> `ProjectDossierDrawer.tsx`
- Modify: `app/portfolio/page.tsx`
- Modify: `app/portfolio/layout.tsx`

- [x] **Step 1: Refactor header into minimalist editorial title with subtle Froerybell badge**
- [x] **Step 2: Replace boxy card grid with fluid vertical editorial stream of frosted glass pills**
- [x] **Step 3: Rebuild floating dock with pill shape, blur, ripple trigger, and palette shifts**
- [x] **Step 4: Update page and layout to pull the organic dreamscape together**
- [x] **Step 5: Run tests and `pnpm build` to verify clean compilation**
- [x] **Step 6: Commit changes**

---

### Task 4: Verification & Live Visual Inspection

**Files:**
- Test via `browser_exec` and `vision_analyze` on mobile (390x844) and desktop (1280x720)

- [x] **Step 1: Deploy to remote main and verify Vercel production edge**
- [x] **Step 2: Inspect desktop screenshot via `vision_analyze` to confirm organic pearlescent jelly and editorial typography**
- [x] **Step 3: Inspect mobile screenshot via `vision_analyze` to ensure flawless touch layout and zero boxiness**
- [x] **Step 4: Final verification pass**
