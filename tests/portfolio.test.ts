import { describe, it } from 'node:test';
import assert from 'node:assert';
import { MISSIONS, getMissionById } from '../lib/portfolio/missions.ts';
import { processCommand } from '../lib/portfolio/terminal.ts';
import { resolvePerformanceTier, FRESNEL_PALETTES } from '../lib/portfolio/performance.ts';

describe('Portfolio Core & Persona Tests', () => {
  it('[TC-PORT-01] Validates mission catalog completeness and schema integrity', () => {
    assert.strictEqual(MISSIONS.length, 4, 'Must have exactly 4 flagship missions');

    for (const mission of MISSIONS) {
      assert.ok(mission.id, 'Mission must have an ID');
      assert.ok(mission.code.length > 0, 'Mission code must be defined');
      assert.ok(mission.title.length > 5, 'Title must be descriptive');
      assert.ok(mission.domain.length > 0, 'Domain must be specified');
      assert.ok(mission.metrics.length >= 3, 'Must have at least 3 KPI metrics');
      assert.ok(mission.blueprint.length > 20, 'Architecture blueprint must be detailed');
      assert.ok(mission.techStack.length >= 3, 'Must have at least 3 tech stack items');
      assert.ok(mission.clearance === 'OMEGA', 'Must carry OMEGA clearance');
    }

    const oms = getMissionById('oms');
    assert.ok(oms, 'Must retrieve OMS mission by alias');
    assert.strictEqual(oms?.id, 'oms');
  });

  it('[TC-PORT-02] Enforces absolute privacy: zero personal/real name leakage in mission data', () => {
    // Prohibited strings (case-insensitive)
    const bannedPatterns = [/dicky/i, /candra/i, /permana/i, /dcandra/i];

    const serializedMissions = JSON.stringify(MISSIONS);
    for (const pattern of bannedPatterns) {
      assert.strictEqual(
        pattern.test(serializedMissions),
        false,
        `Mission data contains prohibited personal name matching ${pattern}`
      );
    }
  });

  it('[TC-PORT-03] Terminal CLI processor executes commands with deterministic outputs', () => {
    // Help command
    const helpResult = processCommand('/help');
    assert.strictEqual(helpResult.success, true);
    assert.ok(helpResult.output.includes('SV-07 TACTICAL FLIGHT INTERFACE') || helpResult.output.includes('INTERFACE'));

    // Telemetry command
    const telemetryResult = processCommand('/telemetry', {
      fps: 60,
      particles: 16000,
      coords: '[0.50, -0.20]',
      tier: 'Desktop Dreamscape'
    });
    assert.strictEqual(telemetryResult.success, true);
    assert.ok(/FPS:\s+60/.test(telemetryResult.output));

    // Mission command
    const missionResult = processCommand('/mission oms');
    assert.strictEqual(missionResult.success, true);
    assert.strictEqual(missionResult.action?.type, 'OPEN_MISSION');
    assert.strictEqual(missionResult.action?.payload, 'oms');

    // Unknown command
    const unknownResult = processCommand('/invalid_cmd');
    assert.strictEqual(unknownResult.success, false);
    assert.ok(unknownResult.output.includes('COMMAND NOT RECOGNIZED'));
  });

  it('[TC-PORT-04] Performance tier resolution assigns correct particle budgets & DPR limits', () => {
    // Desktop high-end
    const desktopTier = resolvePerformanceTier({
      isMobile: false,
      devicePixelRatio: 2,
      screenWidth: 1920
    });
    assert.strictEqual(desktopTier.tier, 3);
    assert.strictEqual(desktopTier.particleCount, 16000);
    assert.strictEqual(desktopTier.monolithSubdivisions, 64);
    assert.strictEqual(desktopTier.maxDpr, 1.5);

    // Mobile viewport
    const mobileTier = resolvePerformanceTier({
      isMobile: true,
      devicePixelRatio: 3,
      screenWidth: 390
    });
    assert.strictEqual(mobileTier.tier, 1);
    assert.strictEqual(mobileTier.particleCount, 8000);
    assert.strictEqual(mobileTier.monolithSubdivisions, 32);
    assert.strictEqual(mobileTier.maxDpr, 1.0);
  });

  it('[TC-PORT-05] Pearlescent palette definition cycles predictably through chromatic anchors', () => {
    assert.ok(FRESNEL_PALETTES.length >= 4, 'Must have at least 4 chromatic color anchors');
    assert.strictEqual(FRESNEL_PALETTES[0].name, 'Lavender Moonstone');
    assert.strictEqual(FRESNEL_PALETTES[0].hex, '#D8B4FE');
    assert.strictEqual(FRESNEL_PALETTES[1].name, 'Iridescent Mint');
    assert.strictEqual(FRESNEL_PALETTES[1].hex, '#6EE7B7');
  });
});
