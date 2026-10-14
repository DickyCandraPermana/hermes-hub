import test from "node:test";
import assert from "node:assert";
import { GET } from "../app/api/status/route.ts";

test("[TC-STATUS-01] Status endpoint tidak membocorkan nama asli pemilik", async () => {
  const res = await GET();
  assert.strictEqual(res.status, 200);
  const data = await res.json();

  assert.strictEqual(data.user, "Sang Pengelana");
  assert.strictEqual(data.persona, "Guest Mode");
  assert.strictEqual(data.agent, "The Key");
  assert.strictEqual(JSON.stringify(data).includes("Dicky"), false);
});
