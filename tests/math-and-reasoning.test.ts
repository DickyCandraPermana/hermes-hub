import test from "node:test";
import assert from "node:assert";
import { normalizeMathDelimiters } from "../lib/math.ts";

test("[TC-MATH-01] Normalizes LaTeX display math \\[ ... \\] to $$ ... $$", () => {
  const input = "Formula: \\[\\sum_{i=1}^n i = \\frac{n(n+1)}{2}\\]";
  const output = normalizeMathDelimiters(input);
  assert.ok(output.includes("$$\n\\sum_{i=1}^n i = \\frac{n(n+1)}{2}\n$$"));
});

test("[TC-MATH-02] Normalizes LaTeX inline math \\( ... \\) to $...$", () => {
  const input = "Given \\(x + y = z\\) is linear.";
  const output = normalizeMathDelimiters(input);
  assert.strictEqual(output, "Given $x + y = z$ is linear.");
});

test("[TC-MATH-03] Escapes currency amounts to prevent math delimiter collision", () => {
  const input = "Prices range between $10 and $20. Subscriptions are $5/mo.";
  const output = normalizeMathDelimiters(input);
  assert.ok(output.includes("\\$10 and \\$20."));
  assert.ok(output.includes("\\$5/mo."));
});

test("[TC-MATH-04] Preserves genuine math with dollar signs untouched", () => {
  const input = "Pythagoras: $a^2 + b^2 = c^2$ and $E = mc^2$";
  const output = normalizeMathDelimiters(input);
  assert.strictEqual(output, "Pythagoras: $a^2 + b^2 = c^2$ and $E = mc^2$");
});

test("[TC-MATH-05] Preserves code blocks and inline code containing dollar signs", () => {
  const input = "Run `echo $PATH` or script:\n```bash\n$x = 100\necho $x\n```";
  const output = normalizeMathDelimiters(input);
  assert.strictEqual(output, input);
});

test("[TC-MATH-06] Handles empty or null input gracefully", () => {
  assert.strictEqual(normalizeMathDelimiters(""), "");
});
