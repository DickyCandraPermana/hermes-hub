import { IMMUTABLE_GUEST_PERSONA } from "./guest-persona.ts";
import { sanitizeMessageContent } from "./sanitizer.ts";

export interface ValidatedChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export type ValidationResult =
  | { ok: true; messages: ValidatedChatMessage[] }
  | { ok: false; status: number; code: string; detail: string };

const ALLOWED_ROOT_KEYS = new Set(["messages"]);
const MAX_USER_CHARS = 4000;
const MAX_TURNS = 10;

export function validateAndPrepareMessages(body: any): ValidationResult {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return {
      ok: false,
      status: 400,
      code: "EMPTY_BODY",
      detail: "Request body harus berupa JSON object yang valid.",
    };
  }

  // Strict check: reject unknown root keys (anti parameter tampering)
  for (const key of Object.keys(body)) {
    if (!ALLOWED_ROOT_KEYS.has(key)) {
      return {
        ok: false,
        status: 422,
        code: "VALIDATION_FAILED",
        detail: `Field '${key}' tidak diizinkan. Hanya field 'messages' yang diperbolehkan.`,
      };
    }
  }

  if (!Array.isArray(body.messages) || body.messages.length === 0) {
    return {
      ok: false,
      status: 422,
      code: "VALIDATION_FAILED",
      detail: "Field 'messages' harus berupa array dan tidak boleh kosong.",
    };
  }

  const cleanMessages: ValidatedChatMessage[] = [];

  for (let i = 0; i < body.messages.length; i++) {
    const item = body.messages[i];
    if (!item || typeof item !== "object") {
      return {
        ok: false,
        status: 422,
        code: "VALIDATION_FAILED",
        detail: `Item pesan pada indeks ${i} tidak valid.`,
      };
    }

    const { role, content } = item;

    // Strict role check: tolak keras role system & developer
    if (role === "system" || role === "developer") {
      return {
        ok: false,
        status: 422,
        code: "ROLE_PROHIBITED",
        detail: "Role 'system' atau 'developer' dilarang. Guest hanya boleh menggunakan role 'user' atau 'assistant'.",
      };
    }

    if (role !== "user" && role !== "assistant") {
      return {
        ok: false,
        status: 422,
        code: "VALIDATION_FAILED",
        detail: `Role '${role}' tidak didukung.`,
      };
    }

    if (typeof content !== "string" || !content.trim()) {
      return {
        ok: false,
        status: 422,
        code: "VALIDATION_FAILED",
        detail: `Konten pesan pada indeks ${i} tidak boleh kosong.`,
      };
    }

    if (content.length > MAX_USER_CHARS) {
      return {
        ok: false,
        status: 422,
        code: "PAYLOAD_TOO_LARGE",
        detail: `Panjang pesan pada indeks ${i} melebihi batas 4.000 karakter.`,
      };
    }

    const sanitizedContent = sanitizeMessageContent(content);
    if (!sanitizedContent) {
      return {
        ok: false,
        status: 422,
        code: "VALIDATION_FAILED",
        detail: `Konten pesan pada indeks ${i} kosong setelah sanitasi.`,
      };
    }

    cleanMessages.push({
      role,
      content: sanitizedContent,
    });
  }

  // Pastikan pesan terakhir dalam dialog berasal dari user
  if (cleanMessages[cleanMessages.length - 1].role !== "user") {
    return {
      ok: false,
      status: 422,
      code: "VALIDATION_FAILED",
      detail: "Pesan terakhir dalam riwayat harus dikirim oleh user.",
    };
  }

  // Sliding window: ambil maksimal N putaran terakhir
  const windowed = cleanMessages.slice(-MAX_TURNS);

  // Injeksi immutable guest persona pada index 0
  return {
    ok: true,
    messages: [
      { role: "system", content: IMMUTABLE_GUEST_PERSONA },
      ...windowed,
    ],
  };
}
