import test from "node:test";
import assert from "node:assert";
import { StreamParser } from "../lib/stream-parser.ts";

test("[TC-STREAM-01] Prevents answer from leaking into reasoning when reasoning_content transitions to content", () => {
  const parser = new StreamParser();

  // Phase 1: Thinking tokens via dedicated reasoning_content
  parser.processDelta({ reasoning_content: "Memikirkan langkah 1...\n" });
  parser.processDelta({ reasoning_content: "Langkah 2: Selesai." });
  assert.strictEqual(parser.isThinking, true);
  assert.strictEqual(parser.accumulatedContent, "");
  assert.strictEqual(
    parser.accumulatedReasoning,
    "Memikirkan langkah 1...\nLangkah 2: Selesai."
  );

  // Phase 2: Model transitions to main answer via content
  parser.processDelta({ content: "Halo! Ini adalah jawaban utama yang benar." });
  assert.strictEqual(parser.isThinking, false);
  assert.strictEqual(
    parser.accumulatedContent,
    "Halo! Ini adalah jawaban utama yang benar."
  );
  assert.strictEqual(
    parser.accumulatedReasoning,
    "Memikirkan langkah 1...\nLangkah 2: Selesai."
  );

  parser.processDelta({ content: " Dan ini kelanjutannya." });
  assert.strictEqual(
    parser.accumulatedContent,
    "Halo! Ini adalah jawaban utama yang benar. Dan ini kelanjutannya."
  );
  assert.strictEqual(parser.isThinking, false);

  const result = parser.finish();
  assert.strictEqual(result.isThinking, false);
});

test("[TC-STREAM-02] Correctly isolates <think>...</think> tags inside content stream", () => {
  const parser = new StreamParser();

  parser.processDelta({
    content: "<think>Rencana: jawab singkat.</think>Jawaban langsung.",
  });
  assert.strictEqual(parser.accumulatedReasoning, "Rencana: jawab singkat.");
  assert.strictEqual(parser.accumulatedContent, "Jawaban langsung.");
  assert.strictEqual(parser.isThinking, false);
});

test("[TC-STREAM-03] Handles <think> and </think> tags split across chunk boundaries", () => {
  const parser = new StreamParser();

  parser.processDelta({ content: "Prolog. <thi" });
  assert.strictEqual(parser.accumulatedContent, "Prolog. ");

  parser.processDelta({ content: "nk>Proses pemikiran panjang..." });
  assert.strictEqual(parser.isThinking, true);
  assert.strictEqual(parser.accumulatedReasoning, "Proses pemikiran panjang...");

  parser.processDelta({ content: " lanjut mikir...</th" });
  assert.strictEqual(
    parser.accumulatedReasoning,
    "Proses pemikiran panjang... lanjut mikir..."
  );

  parser.processDelta({ content: "ink>Epilog jawaban final." });
  assert.strictEqual(parser.isThinking, false);
  assert.strictEqual(parser.accumulatedContent, "Prolog. Epilog jawaban final.");
  assert.strictEqual(
    parser.accumulatedReasoning,
    "Proses pemikiran panjang... lanjut mikir..."
  );
});

test("[TC-STREAM-04] Standard model with pure content without reasoning", () => {
  const parser = new StreamParser();

  parser.processDelta({ content: "Halo, saya The Key!" });
  assert.strictEqual(parser.isThinking, false);
  assert.strictEqual(parser.accumulatedReasoning, "");
  assert.strictEqual(parser.accumulatedContent, "Halo, saya The Key!");

  const result = parser.finish();
  assert.strictEqual(result.content, "Halo, saya The Key!");
  assert.strictEqual(result.reasoning, "");
});

test("[TC-STREAM-05] Preserves trailing text with angle bracket when finished", () => {
  const parser = new StreamParser();

  parser.processDelta({ content: "Contoh nilai x <" });
  parser.finish();
  assert.strictEqual(parser.accumulatedContent, "Contoh nilai x <");
  assert.strictEqual(parser.accumulatedReasoning, "");
});
