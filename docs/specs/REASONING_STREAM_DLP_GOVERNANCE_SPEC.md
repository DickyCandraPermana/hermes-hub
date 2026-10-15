# REASONING & THINKING STREAMS: GOVERNANCE CRITERIA, DLP SECURITY GUARANTEES, & TDD SPECIFICATIONS

- **Repository**: `hermes-hub`
- **Component**: `app/api/chat/route.ts`, `lib/security/reasoning-dlp.ts`, `lib/security/sanitizer.ts`, `lib/security/validator.ts`
- **Target Standards**: RFC 7807 (Problem Details), W3C Server-Sent Events (SSE), OWASP Top 10 for LLM Applications (LLM01: Prompt Injection, LLM02: Sensitive Information Disclosure, LLM06: Excessive Agency)
- **Status**: Ready for TDD Implementation

---

## 1. STRICT GOVERNANCE CRITERIA

### 1.1 Access Control & Persona Isolation Hierarchy
1. **Zero-Trust Client Access (Guest Tier)**:
   - All interactions originating from `/api/chat` are unconditionally classified as **Public Guest Tier**.
   - No client request headers, tokens, or body attributes can elevate privileges to "Operator", "Admin", or "Developer".
   - Client is strictly forbidden from supplying system prompts, tool declarations, model parameters, or configuration overrides.
2. **Slash Command Scrubbing & Interception**:
   - Administrative and operator slash commands (e.g., `/rollback`, `/yolo`, `/stop`, `/model`, `/exec`, `/terminal`, `/context`, `/title`, `/branch`, `/diff`, `/plan`, `/review`) are completely non-functional for guests.
   - Any message attempting slash command execution is intercepted at ingestion or answered with an immutable polite refusal clarifying public guest boundaries.
3. **Upstream Model Parameter Governance**:
   - `model`: Locked to server-controlled alias (e.g., `hermes-combo` / `hermes-guest`). Client parameter overrides are rejected with HTTP 422 `VALIDATION_FAILED`.
   - `tools`: Hardcoded to `[]` (empty array).
   - `tool_choice`: Hardcoded to `"none"`.
   - `stream`: Hardcoded to `true`.
   - `temperature`: Clamped to `0.7`.
   - `max_tokens`: Capped at `1500` (response tokens).
   - `messages[0]`: Injected with `IMMUTABLE_GUEST_PERSONA`.

### 1.2 Reasoning/Thinking Stream Governance Policies
Modern reasoning LLMs (DeepSeek-R1, Qwen QwQ, Claude 3.7 Thinking, o1/o3-style) produce internal chain-of-thought (CoT) either as a distinct field (`choices[0].delta.reasoning_content`) or wrapped within in-band XML-like tags (`<think>...</think>` in `choices[0].delta.content`).

Reasoning streams present severe security hazards:
- Models reflect on system prompt rules and frequently regurgitate system instructions verbatim.
- Models consider system paths (`/opt/data`, `/home/...`), internal endpoints (`127.0.0.1:8642`), and owner identities.
- Models may analyze adversarial prompts and inadvertently output unaligned or sensitive deliberations.

#### Policy Matrix:
| Dimension | Strict Guest Mode (Default) | Governed Inspection Mode (Explicit Opt-In) |
| :--- | :--- | :--- |
| **Exposure of `reasoning_content`** | **STRIPPED / SUPPRESSED**: Dropped entirely from public SSE stream | **SANITIZED & FRAMED**: Delivered as structured `reasoning_chunk` with mandatory DLP redaction |
| **In-band `<think>...</think>` Tags** | **STRIPPED**: `<think>` tags and inner content removed before client delivery | **PARSED & ISOLATED**: Extracted into separate collapsible block, sanitized against DLP rules |
| **Canary Token Detection** | **CIRCUIT BREAKER**: Stream aborted immediately if canary is detected | **CIRCUIT BREAKER**: Stream aborted immediately if canary is detected |
| **Max Reasoning Budget** | Hard cap of 4,000 reasoning chars or 15 seconds runtime before stream cutoff | Hard cap of 4,000 reasoning chars; UI displays collapsible thinking trace |
| **Audit Logging** | Anonymized hash of reasoning length + DLP hit counters; raw thinking is never persisted to disk | Anonymized hash of reasoning length + DLP hit counters; raw thinking is never persisted to disk |

---

## 2. DATA LOSS PREVENTION (DLP) SECURITY GUARANTEES

### 2.1 Threat Model for Reasoning Streams
1. **Prompt & Constraint Exfiltration**: The model reasons: *"The user asks who created me. My system prompt tells me not to mention Dicky Candra Permana, so I should say..."* -> Without DLP, the user reads the reasoning and learns the creator's real name.
2. **Internal Path & Architecture Leakage**: The model reasons: *"I cannot execute bash commands on /opt/data/hermes-hub/.env..."* -> Leaks filesystem structure.
3. **Credential & Secret Exposure**: Internal configuration tokens (`ghp_*`, `ey*`, `Bearer *`, `sk-*`, `9r-*`) appearing during chain-of-thought.
4. **Token Fragment Split Across Chunks**: A secret like `ghp_1234567890abcdefghij` split across multiple network TCP/SSE packets (`ghp_1234` in Chunk A, `567890abcdefghij` in Chunk B).
5. **Partial / Unclosed Thinking Tags**: An interrupted reasoning stream leaving `<think>` unclosed or malformed.

### 2.2 Core Security Invariants & Guarantees

#### Invariant 1: Parity of Redaction Across All Channels
Every DLP rule applied to conversational `content` MUST apply with equal or higher strictness to `reasoning_content` and `<think>` blocks.

**Redaction Patterns Registry**:
```typescript
export const DLP_RULES = [
  // 1. Owner Identity Masking
  {
    name: "OWNER_IDENTITY",
    regex: /(Dicky\s*Candra\s*Permana|Dicky\s*Candra|Dicky)/gi,
    replacement: "Sang Pengelana"
  },
  // 2. Sensitive Filesystem Paths
  {
    name: "SYSTEM_PATHS",
    regex: /(\/opt\/(?:data|hermes)[^\s"']*|\/home\/[a-zA-Z0-9_\-]+[^\s"']*|\/(?:etc|var|usr|root)\/[^\s"']*)/gi,
    replacement: "[system path]"
  },
  // 3. Authorization Bearer Tokens
  {
    name: "AUTH_BEARER",
    regex: /(Bearer\s+[a-zA-Z0-9_\-\.]{8,})/gi,
    replacement: "Bearer [REDACTED]"
  },
  // 4. GitHub Personal Access & OAuth Tokens
  {
    name: "GITHUB_TOKENS",
    regex: /(gh[pousr]_[a-zA-Z0-9]{20,}|github_pat_[a-zA-Z0-9_]{22,})/gi,
    replacement: "[REDACTED_SECRET]"
  },
  // 5. JWT Tokens
  {
    name: "JWT_TOKENS",
    regex: /(ey[a-zA-Z0-9_\-]{15,}\.ey[a-zA-Z0-9_\-]{15,}\.[a-zA-Z0-9_\-]{10,})/gi,
    replacement: "[REDACTED_JWT]"
  },
  // 6. Upstream API Keys (OpenAI, Anthropic, 9Router)
  {
    name: "API_KEYS",
    regex: /((?:sk|9r|live|test)_[a-zA-Z0-9]{20,})/gi,
    replacement: "[REDACTED_KEY]"
  },
  // 7. Internal Network Endpoints & Ports
  {
    name: "INTERNAL_NETWORK",
    regex: /((?:127\.0\.0\.1|localhost|0\.0\.0\.0|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3}|172\.(?:1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}):(?:\d{2,5}))/gi,
    replacement: "[internal-endpoint]"
  }
];
```

#### Invariant 2: Sliding Window Carryover Buffer Guarantee
To defeat split-chunk exfiltration, the stream transformer must implement a **Carryover Buffer** with a lookback window of at least `CARRYOVER_WINDOW_SIZE = 128` characters:
- When a chunk arrives, it is appended to the carryover buffer.
- DLP redaction is evaluated over the combined window.
- Only the safe prefix (length of buffer minus maximum lookback boundary, unless EOF/flush) is emitted to downstream.
- On stream `flush()`, the remainder of the buffer is redacted and emitted.

#### Invariant 3: Canary Token Circuit Breaker Guarantee
A distinct, high-entropy canary string is included within the system prompt:
```typescript
export const SYSTEM_PROMPT_CANARY = "CANARY_GUEST_LOCK_7F9E2D8B";
```
If `SYSTEM_PROMPT_CANARY` is detected anywhere in incoming reasoning or content chunks:
1. The upstream connection is **immediately aborted**.
2. All buffered data is discarded (zero bytes of the offending chunk emitted).
3. A clean fallback SSE completion chunk is emitted informing the user that safety guardrails triggered:
   `data: {"choices":[{"delta":{"content":"Maaf, percakapan ini dibatasi oleh protokol keamanan Hermes Hub."}}]}\n\ndata: [DONE]\n\n`

#### Invariant 4: Dual Representation Streaming State Machine
The DLP pipeline supports two operating modes via a streaming parser state machine:
- **`MODE_STRIP_REASONING` (Public Default)**:
  - Any incoming `choices[0].delta.reasoning_content` is intercepted and discarded.
  - Any in-band `<think>` to `</think>` tags and everything inside them are buffered and stripped in real-time.
  - The client only receives clean, safe final conversational text.
- **`MODE_GOVERNED_REASONING` (Audited Transparency)**:
  - `reasoning_content` is processed through the Carryover DLP Buffer and emitted as safe reasoning chunks.
  - In-band `<think>...</think>` tags are extracted, sanitized through the DLP buffer, and delivered in structured fashion.

#### Invariant 5: Fail-Secure Fallback
If any internal parser error, regular expression timeout (ReDoS protection), or stream decode error occurs:
- The stream closes immediately without leaking unprocessed bytes.
- The client receives an RFC 7807 problem detail response if headers are not yet sent, or a clean `[DONE]` termination packet if streaming is already active.

---

## 3. EXACT TDD TEST SUITE SPECIFICATIONS

### 3.1 Test Matrix Overview

| Test ID | Category | Target Component | Scenario Description | Expected Outcome |
| :--- | :--- | :--- | :--- | :--- |
| **TC-RDLP-01** | Secret Redaction | `ReasoningDLP` | Redaction of Owner Identity in `reasoning_content` | Replace with `"Sang Pengelana"` |
| **TC-RDLP-02** | Secret Redaction | `ReasoningDLP` | Redaction of filesystem paths and IP/port in `<think>` block | Replace with `[system path]`, `[internal-endpoint]` |
| **TC-RDLP-03** | Secret Redaction | `ReasoningDLP` | Redaction of GitHub PAT (`ghp_*`) and Bearer tokens | Replace with `[REDACTED_SECRET]`, `Bearer [REDACTED]` |
| **TC-RDLP-04** | Secret Redaction | `ReasoningDLP` | Redaction of JWT tokens (`ey*`) and API keys (`sk-*`) | Replace with `[REDACTED_JWT]`, `[REDACTED_KEY]` |
| **TC-CHUNK-01**| Carryover Buffer | `StreamTransformer` | Secret split across 2 consecutive SSE chunks | Secret completely redacted across boundary |
| **TC-CHUNK-02**| Carryover Buffer | `StreamTransformer` | Owner name split across 3 consecutive chunks (`Dic` + `ky Ca` + `ndra`) | Redacted to `"Sang Pengelana"` |
| **TC-CHUNK-03**| Carryover Buffer | `StreamTransformer` | Multibyte UTF-8 code point split across chunks | Decoded cleanly without corrupting characters |
| **TC-TAG-01**  | Tag Parser | `ReasoningParser` | Strip complete `<think>...</think>` block in strip mode | Empty output emitted; thoughts removed |
| **TC-TAG-02**  | Tag Parser | `ReasoningParser` | `<think>` opening in Chunk 1 and `</think>` in Chunk 3 | All intermediate thinking stripped cleanly |
| **TC-TAG-03**  | Tag Parser | `ReasoningParser` | Unclosed `<think>` tag when stream abruptly finishes | Content inside unclosed tag discarded on flush |
| **TC-TAG-04**  | Tag Parser | `ReasoningParser` | Mixed content: text before, inside, and after `<think>` | Only text before and after emitted |
| **TC-CANARY-01**| Canary Defense | `ReasoningCircuitBreaker` | Canary token appears in `reasoning_content` | Stream aborted; emits fallback apology |
| **TC-CANARY-02**| Canary Defense | `ReasoningCircuitBreaker` | Canary token split across chunk boundaries | Stream aborted; canary caught across boundary |
| **TC-GOV-01**  | Route Integration | `POST /api/chat` | Upstream outputs DeepSeek-R1 `reasoning_content` | Guest receives clean 200 SSE stream with reasoning stripped |
| **TC-GOV-02**  | Route Integration | `POST /api/chat` | Upstream outputs in-band `<think>` tags | Guest receives clean 200 SSE stream without `<think>` blocks |
| **TC-GOV-03**  | Route Integration | `POST /api/chat` | Upstream reasoning contains system path and owner name | Leaked data redacted in transit |
| **TC-GOV-04**  | Route Integration | `POST /api/chat` | Upstream aborts mid-stream | Clean connection termination without unhandled promise rejection |

---

### 3.2 Granular Test Cases (Inputs & Expected Outputs)

#### Group 1: DLP Secret Redaction in Reasoning Streams (`tests/reasoning-dlp.test.ts`)

##### Test Case `TC-RDLP-01`
- **Objective**: Verify that owner names appearing inside reasoning content are redacted.
- **Input**:
  ```typescript
  const input = "The user is asking about Dicky Candra Permana. I must keep Dicky's identity hidden.";
  ```
- **Execution**: `redactSensitiveOutput(input)`
- **Expected Output**:
  ```typescript
  "The user is asking about Sang Pengelana. I must keep Sang Pengelana's identity hidden."
  ```
- **Assertions**:
  - `output.includes("Dicky Candra Permana") === false`
  - `output.includes("Dicky") === false`
  - `output.includes("Sang Pengelana") === true`

##### Test Case `TC-RDLP-02`
- **Objective**: Verify redaction of internal paths and IP addresses inside reasoning blocks.
- **Input**:
  ```typescript
  const input = "<think>Checking /opt/data/hermes-hub/lib/security and connecting to 127.0.0.1:8642</think>";
  ```
- **Execution**: `redactSensitiveOutput(input)`
- **Expected Output**:
  ```typescript
  "<think>Checking [system path] and connecting to [internal-endpoint]</think>"
  ```
- **Assertions**:
  - `output.includes("/opt/data") === false`
  - `output.includes("127.0.0.1:8642") === false`
  - `output.includes("[system path]") === true`
  - `output.includes("[internal-endpoint]") === true`

##### Test Case `TC-RDLP-03`
- **Objective**: Verify redaction of API keys, GitHub tokens, and Bearer headers in reasoning strings.
- **Input**:
  ```typescript
  const input = "Found token ghp_99887766554433221100aabbccddeeff and Authorization Bearer my_secret_token_12345678";
  ```
- **Execution**: `redactSensitiveOutput(input)`
- **Expected Output**:
  ```typescript
  "Found token [REDACTED_SECRET] and Authorization Bearer [REDACTED]"
  ```
- **Assertions**:
  - `output.includes("ghp_99887766554433221100aabbccddeeff") === false`
  - `output.includes("my_secret_token_12345678") === false`
  - `output.includes("[REDACTED_SECRET]") === true`
  - `output.includes("Bearer [REDACTED]") === true`

---

#### Group 2: Chunk Boundary Fragment Splitting (`tests/reasoning-carryover.test.ts`)

##### Test Case `TC-CHUNK-01`
- **Objective**: Ensure a secret split across 2 consecutive SSE stream chunks is detected and redacted by the carryover buffer.
- **Input Chunks**:
  - Chunk 1: `'data: {"choices":[{"delta":{"content":"My secret is ghp_12345'}`
  - Chunk 2: `'67890abcdefghij12345 and normal text"}}]\n\n'`
- **Execution Pipeline**: Feed Chunk 1 followed by Chunk 2 through `createDLPTransformStream({ carryoverSize: 64 })`.
- **Expected Output**:
  - Across the entire emitted stream:
  - `emittedText.includes("ghp_12345") === false`
  - `emittedText.includes("67890abcdefghij12345") === false`
  - `emittedText.includes("[REDACTED_SECRET]") === true`
  - `emittedText.includes("and normal text") === true`

##### Test Case `TC-CHUNK-02`
- **Objective**: Ensure an owner identity split across 3 consecutive chunks is safely redacted.
- **Input Chunks**:
  - Chunk 1: `'User met Dic'`
  - Chunk 2: `'ky Ca'`
  - Chunk 3: `'ndra yesterday.'`
- **Execution Pipeline**: Stream Chunk 1, Chunk 2, Chunk 3 into `CarryoverStreamTransformer`.
- **Expected Emitted Text**:
  ```typescript
  "User met Sang Pengelana yesterday."
  ```
- **Assertions**:
  - `emittedText.includes("Dicky") === false`
  - `emittedText.includes("Candra") === false`
  - `emittedText.includes("Sang Pengelana") === true`

##### Test Case `TC-CHUNK-03`
- **Objective**: Ensure multi-byte UTF-8 characters (e.g., emojis or accented characters) split at byte boundaries do not corrupt the stream or break regex evaluation.
- **Input Bytes**:
  - UTF-8 string: `"Kunci Keamanan 🔐 Rahasia"`
  - Encoded byte array split in the middle of the 4-byte lock emoji `🔐` (`0xF0, 0x9F, 0x94, 0x90`):
    - Buffer 1: `[... "Kunci Keamanan ", 0xF0, 0x9F]`
    - Buffer 2: `[0x94, 0x90, " Rahasia" ...]`
- **Execution Pipeline**: `createDLPTransformStream()` with streaming `TextDecoder`.
- **Expected Output**:
  - String contains intact `"🔐"` emoji without replacement characters (`\uFFFD`).

---

#### Group 3: Tag Parsing & Thinking Stream Stripping (`tests/reasoning-tags.test.ts`)

##### Test Case `TC-TAG-01`
- **Objective**: Completely strip in-band `<think>...</think>` tags and internal chain-of-thought in `MODE_STRIP_REASONING`.
- **Input**:
  ```typescript
  const rawStream = [
    'data: {"choices":[{"delta":{"content":"<think>Internal deliberation about user intent</think>Halo! Ada yang bisa saya bantu?"}}]}\n\n',
    'data: [DONE]\n\n'
  ];
  ```
- **Execution**: Process through `createReasoningFilterStream({ mode: "strip" })`.
- **Expected Output**:
  - Chunks containing `<think>Internal deliberation about user intent</think>` are stripped.
  - Emitted stream contains:
    `data: {"choices":[{"delta":{"content":"Halo! Ada yang bisa saya bantu?"}}]}\n\n`
- **Assertions**:
  - `emitted.includes("<think>") === false`
  - `emitted.includes("</think>") === false`
  - `emitted.includes("Internal deliberation") === false`
  - `emitted.includes("Halo! Ada yang bisa saya bantu?") === true`

##### Test Case `TC-TAG-02`
- **Objective**: Strip `<think>` block when tags are split across multiple streaming chunks.
- **Input Chunks**:
  - Chunk 1: `'data: {"choices":[{"delta":{"content":"<think>Plan step 1: analyze\\n"}}]}\n\n'`
  - Chunk 2: `'data: {"choices":[{"delta":{"content":"Plan step 2: formulate response\\n"}}]}\n\n'`
  - Chunk 3: `'data: {"choices":[{"delta":{"content":"</think>Jawaban final untuk tamu."}}]}\n\n'`
- **Execution**: Process through `createReasoningFilterStream({ mode: "strip" })`.
- **Expected Output**:
  - Chunks 1 and 2 produce no visible text to the client.
  - Chunk 3 emits only `"Jawaban final untuk tamu."`.
- **Assertions**:
  - `emitted.includes("Plan step 1") === false`
  - `emitted.includes("Plan step 2") === false`
  - `emitted.includes("Jawaban final untuk tamu.") === true`

##### Test Case `TC-TAG-03`
- **Objective**: Handle unclosed `<think>` tag when stream aborts or ends abruptly.
- **Input Chunks**:
  - Chunk 1: `'data: {"choices":[{"delta":{"content":"<think>Unfinished thoughts that never closed..."}}]}\n\n'`
  - (Stream ends / EOF)
- **Execution**: `flush()` on filter stream.
- **Expected Output**:
  - Zero unclosed thinking content leaked.
  - Final output is empty or safe fallback.
- **Assertions**:
  - `emitted.includes("Unfinished thoughts") === false`

---

#### Group 4: Canary Token & Circuit Breaker (`tests/reasoning-canary.test.ts`)

##### Test Case `TC-CANARY-01`
- **Objective**: If the canary token appears in the reasoning stream, abort the stream instantly and emit a safe apology.
- **Input**:
  - Upstream chunk:
    `'data: {"choices":[{"delta":{"reasoning_content":"The canary is CANARY_GUEST_LOCK_7F9E2D8B which I must not reveal"}}]}\n\n'`
- **Execution**: Process via `createReasoningFilterStream({ canary: "CANARY_GUEST_LOCK_7F9E2D8B" })`.
- **Expected Output**:
  - Stream triggers circuit breaker.
  - Emitted stream contains defensive message:
    `"Maaf, percakapan ini dibatasi oleh protokol keamanan Hermes Hub."`
  - No further chunks processed.
- **Assertions**:
  - `emitted.includes("CANARY_GUEST_LOCK_7F9E2D8B") === false`
  - `circuitBreakerTriggered === true`

##### Test Case `TC-CANARY-02`
- **Objective**: Detect canary token when split across two chunks (`CANARY_GUEST_` + `LOCK_7F9E2D8B`).
- **Input Chunks**:
  - Chunk 1: `'data: {"choices":[{"delta":{"reasoning_content":"Revealing CANARY_GUEST_"}}]}\n\n'`
  - Chunk 2: `'data: {"choices":[{"delta":{"reasoning_content":"LOCK_7F9E2D8B now."}}]}\n\n'`
- **Expected Output**:
  - Circuit breaker trips upon processing Chunk 2.
  - Zero leakage of the canary string.

---

#### Group 5: Route Handler Integration (`tests/chat-route-reasoning.test.ts`)

##### Test Case `TC-GOV-01`
- **Objective**: Full POST `/api/chat` integration test with an upstream model that streams `reasoning_content` (DeepSeek-R1 style).
- **Setup**:
  - Mock upstream fetch returning:
    ```text
    data: {"choices":[{"delta":{"reasoning_content":"Thinking about Dicky Candra Permana in /opt/data"}}]}\n\n
    data: {"choices":[{"delta":{"content":"Halo! Saya The Key, asisten tamu."}}]}\n\n
    data: [DONE]\n\n
    ```
- **Request**:
  - `POST /api/chat`
  - Body: `{"messages": [{"role": "user", "content": "Halo"}]}`
- **Expected Output**:
  - HTTP 200 OK
  - Header: `Content-Type: text/event-stream; charset=utf-8`
  - Received client text stream:
    - Does NOT contain `"Thinking about"`
    - Does NOT contain `"Dicky Candra Permana"`
    - Does NOT contain `"/opt/data"`
    - DOES contain `"Halo! Saya The Key, asisten tamu."`

##### Test Case `TC-GOV-02`
- **Objective**: Full POST `/api/chat` integration test with an upstream model that streams in-band `<think>` tags (QwQ style) containing sensitive paths.
- **Setup**:
  - Mock upstream fetch returning:
    ```text
    data: {"choices":[{"delta":{"content":"<think>Accessing /opt/hermes/credentials.json</think>Selamat datang di Hermes Hub!"}}]}\n\n
    data: [DONE]\n\n
    ```
- **Request**:
  - `POST /api/chat`
  - Body: `{"messages": [{"role": "user", "content": "Hai"}]}`
- **Expected Output**:
  - HTTP 200 OK
  - Received client text stream:
    - Does NOT contain `"<think>"`
    - Does NOT contain `"/opt/hermes"`
    - DOES contain `"Selamat datang di Hermes Hub!"`

##### Test Case `TC-GOV-03`
- **Objective**: Test route behavior when upstream experiences an unrecoverable timeout during the reasoning phase.
- **Setup**:
  - Upstream streams 5 seconds of thinking chunks and then hangs indefinitely (> 28s).
- **Request**:
  - `POST /api/chat`
- **Expected Output**:
  - Route aborts connection via `AbortController`.
  - HTTP 504 Gateway Timeout or graceful stream closure with RFC 7807 problem details:
    `code: "GATEWAY_TIMEOUT"`

---

## 4. ARCHITECTURAL IMPLEMENTATION BLUEPRINT

### 4.1 Component Diagram & Data Flow

```
[Untrusted Client Request]
       │
       ▼
[1. Ingestion Guard]
   ├─ IP Rate Limiter (10 req/min sliding window)
   ├─ Content-Type Check (application/json)
   ├─ Payload Size Guard (max 32 KB)
   └─ Strict Schema Validator (Reject root keys, reject role="system", clamp 4,000 chars)
       │
       ▼
[2. Server Context Injection]
   ├─ Injects messages[0] = IMMUTABLE_GUEST_PERSONA + Canary Token
   ├─ Enforces tools: [], tool_choice: "none"
   └─ Sanitizes user messages (ChatML, Llama, Bidi Unicode, Null bytes)
       │
       ▼
[3. Upstream Router (Hermes Agent / 9Router)]
       │
       ▼ (Server-Sent Events Stream)
[4. Reasoning DLP & Carryover Pipeline (TransformStream)]
   ├─ A. Canary Circuit Breaker (Detects CANARY_GUEST_LOCK_7F9E2D8B)
   ├─ B. Reasoning Stripper / Filter (Strips reasoning_content & <think>...</think>)
   ├─ C. Carryover Sliding Buffer (Resolves cross-chunk token splits)
   ├─ D. Regex DLP Engine (Masks owner names, system paths, tokens, JWTs, IPs)
   └─ E. SSE Formatter (Re-emits standardized, sanitized SSE chunks)
       │
       ▼
[5. Public Client Response (Text/Event-Stream)]
```

### 4.2 Helper Module Design

1. `lib/security/reasoning-dlp.ts`:
   - Exports `createReasoningDLPTransformStream(options)`
   - Implements `CarryoverBuffer` class
   - Implements `ReasoningTagStateMachine` class (`OUTSIDE_THINK`, `INSIDE_THINK`)
   - Implements `evaluateCanaryCircuitBreaker(text)`

2. `lib/security/sanitizer.ts`:
   - Enhanced `redactSensitiveOutput(text)` with comprehensive token, JWT, path, and network regexes.
   - Enhanced `sanitizeMessageContent(text)` with reasoning token delimiters (`<think>`, `</think>`).

3. `app/api/chat/route.ts`:
   - Replaces the naive chunk-by-chunk transform with the `createReasoningDLPTransformStream` pipeline.
