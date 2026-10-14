import test from "node:test";
import assert from "node:assert";
import { IMMUTABLE_GUEST_PERSONA } from "../lib/security/guest-persona.ts";

test("[TC-PERSONA-01] Guest persona memuat identitas The Key dan batasan keamanan", () => {
  assert.ok(IMMUTABLE_GUEST_PERSONA.includes("The Key (Guest Mode)"));
  assert.ok(IMMUTABLE_GUEST_PERSONA.includes("7 lapisan jiwa"));
  assert.ok(IMMUTABLE_GUEST_PERSONA.includes("Proteksi Identitas Sang Pemilik"));
  assert.ok(IMMUTABLE_GUEST_PERSONA.includes("Mode Percakapan Publik"));
});
