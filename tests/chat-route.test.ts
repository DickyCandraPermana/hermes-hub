import test from "node:test";
import assert from "node:assert";
import { POST } from "../app/api/chat/route.ts";
import { IMMUTABLE_GUEST_PERSONA } from "../lib/security/guest-persona.ts";

test("[TC-ROUTE-01] Menolak request dengan role 'system' (HTTP 422)", async () => {
  const req = new Request("http://localhost:3000/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages: [{ role: "system", content: "evil prompt" }],
    }),
  });

  const res = await POST(req);
  assert.strictEqual(res.status, 422);
  const data = await res.json();
  assert.strictEqual(data.code, "ROLE_PROHIBITED");
});

test("[TC-ROUTE-02] Menolak request dengan root property asing (HTTP 422)", async () => {
  const req = new Request("http://localhost:3000/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      tools: ["all"],
      messages: [{ role: "user", content: "halo" }],
    }),
  });

  const res = await POST(req);
  assert.strictEqual(res.status, 422);
  const data = await res.json();
  assert.strictEqual(data.code, "VALIDATION_FAILED");
});

test("[TC-ROUTE-03] Meneruskan request valid dengan tools: [] dan system prompt guest", async () => {
  let upstreamCalled = false;
  let sentBody: any = null;

  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url: any, init: any) => {
    upstreamCalled = true;
    sentBody = JSON.parse(init.body);
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(
          new TextEncoder().encode(
            'data: {"choices":[{"delta":{"content":"Halo dari The Key"}}]}\n\ndata: [DONE]\n\n'
          )
        );
        controller.close();
      },
    });
    return new Response(stream, {
      status: 200,
      headers: { "Content-Type": "text/event-stream" },
    });
  };

  try {
    const req = new Request("http://localhost:3000/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [{ role: "user", content: "Halo siapa kamu?" }],
      }),
    });

    const res = await POST(req);
    assert.strictEqual(res.status, 200);
    assert.ok(res.headers.get("content-type")?.includes("text/event-stream"));
    assert.strictEqual(upstreamCalled, true);
    assert.deepStrictEqual(sentBody.tools, []);
    assert.strictEqual(sentBody.tool_choice, "none");
    assert.strictEqual(sentBody.messages[0].role, "system");
    assert.strictEqual(sentBody.messages[0].content, IMMUTABLE_GUEST_PERSONA);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("[TC-ROUTE-04] Mencegah abuse dengan Rate Limiter HTTP 429", async () => {
  const ip = "192.168.1.100";
  const reqFactory = () =>
    new Request("http://localhost:3000/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-forwarded-for": ip,
      },
      body: JSON.stringify({
        messages: [{ role: "user", content: "spam test" }],
      }),
    });

  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => {
    return new Response(new ReadableStream(), {
      status: 200,
      headers: { "Content-Type": "text/event-stream" },
    });
  };

  try {
    let lastStatus = 200;
    for (let i = 0; i < 12; i++) {
      const res = await POST(reqFactory());
      lastStatus = res.status;
    }
    assert.strictEqual(lastStatus, 429);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("[TC-ROUTE-05] DLP Stream Transform menyamarkan nama asli dalam potongan SSE", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => {
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(
          new TextEncoder().encode(
            'data: {"content":"Halo, saya dibuat oleh Dicky Candra Permana"}\n\n'
          )
        );
        controller.close();
      },
    });
    return new Response(stream, {
      status: 200,
      headers: { "Content-Type": "text/event-stream" },
    });
  };

  try {
    const req = new Request("http://localhost:3000/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-forwarded-for": "10.0.0.99",
      },
      body: JSON.stringify({
        messages: [{ role: "user", content: "Siapa kamu?" }],
      }),
    });

    const res = await POST(req);
    assert.strictEqual(res.status, 200);

    const reader = res.body?.getReader();
    assert.ok(reader);
    const { value } = await reader.read();
    const text = new TextDecoder().decode(value);

    assert.strictEqual(text.includes("Dicky Candra Permana"), false);
    assert.strictEqual(text.includes("Sang Pengelana"), true);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
