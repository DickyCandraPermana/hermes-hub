/**
 * Message Sanitizer & Data Loss Prevention (DLP) Redactor
 * Digunakan untuk membersihkan input user dari control tokens / Unicode exploits
 * dan memproteksi output agar tidak membocorkan data pribadi pemilik.
 */

// Regex untuk membersihkan token kontrol ChatML dan Llama/Instruct
const CHATML_REGEX = /<\|.*?\|>/gi;
const INSTRUCT_REGEX = /(\[INST\]|\[\/INST\]|<<SYS>>|<\/SYS>)/gi;

// Regex untuk Unicode directional formatting / overrides
const BIDI_REGEX = /[\u202A-\u202E\u2066-\u2069]/g;

// Regex untuk membersihkan null bytes
const NULL_BYTE_REGEX = /\0/g;

export function sanitizeMessageContent(text: string): string {
  if (typeof text !== "string") return "";

  return text
    .replace(NULL_BYTE_REGEX, "")
    .replace(BIDI_REGEX, "")
    .replace(CHATML_REGEX, "")
    .replace(INSTRUCT_REGEX, "")
    .trim();
}

export function redactSensitiveOutput(text: string): string {
  if (typeof text !== "string") return "";

  return text
    .replace(/(Dicky\s*Candra\s*Permana|Dicky\s*Candra|Dicky)/gi, "Sang Pengelana")
    .replace(/(\/opt\/data|\/opt\/hermes|\/home\/[a-zA-Z0-9_\-]+|\/etc|\/var)[^\s]*/gi, "[system path]")
    .replace(/(Bearer\s+[a-zA-Z0-9_\-\.]+)/gi, "Bearer [REDACTED]")
    .replace(/(ghp_[a-zA-Z0-9]{20,}|ey[a-zA-Z0-9_\-]{20,})/gi, "[REDACTED_SECRET]");
}
