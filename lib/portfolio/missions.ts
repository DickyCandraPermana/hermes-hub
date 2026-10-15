export interface MissionKpi {
  label: string;
  value: string;
  subtext: string;
}

export interface Mission {
  id: string;
  code: string;
  title: string;
  domain: string;
  accentColor: string;
  classification: string;
  clearance: 'OMEGA';
  tagline: string;
  summary: string;
  metrics: MissionKpi[];
  blueprint: string;
  operationalChallenge: string;
  algorithmicSolution: string;
  techStack: string[];
  externalUrl?: string;
}

export const MISSIONS: Mission[] = [
  {
    id: 'oms',
    code: 'MSN-01',
    title: 'Kraft Heinz OMS Algorithmic Pipeline',
    domain: 'SUPPLY CHAIN OPTIMIZATION & VECTOR RAG',
    accentColor: '#00F0FF',
    classification: 'ENTERPRISE DISTRIBUTION ENGINE',
    clearance: 'OMEGA',
    tagline: 'Automated order allocation & 77-chunk Gemini vector knowledge base.',
    summary: 'High-throughput enterprise distribution engine reconciling multi-warehouse stock allocations against strict fleet constraints and pallet tier limits.',
    metrics: [
      { label: 'EXECUTION TIME', value: '< 2.4s', subtext: 'Down from 45m manual VBA runs' },
      { label: 'VECTOR INDEX', value: '77 CHUNKS', subtext: 'Gemini 768-dim semantic knowledge base' },
      { label: 'DISPATCH VOLUME', value: '45,000+ SKUs', subtext: 'Continuous batch processing' }
    ],
    blueprint: `
[ERP / SAP Ingest] ---> [Dynamic Buffer Splitter] ---> [Constraint Satisfaction Solver]
                                                                  │
                                                        [Gemini 768-dim RAG Engine]
                                                                  │
                                                                  ▼
                                                      [Zero-Discrepancy Manifest]
    `.trim(),
    operationalChallenge: 'Legacy enterprise supply chains suffered 40-minute manual workbook locks and human dispatch errors across thousands of SKU permutations under variable truck weight caps.',
    algorithmicSolution: 'Engineered an in-memory combinatorial allocation heuristic backed by a 77-chunk Gemini vector knowledge base. Vectorized lookup delivers immediate regulatory context, while the solver guarantees 99.4% volumetric bin-packing accuracy in sub-3-second execution runs.',
    techStack: ['Python', 'VBA v16.0', 'Gemini Vector Embeddings', 'Pandas', 'OpenPyXL']
  },
  {
    id: 'keyhub',
    code: 'MSN-02',
    title: 'The Key Hub Autonomous Console',
    domain: 'MULTI-AGENT DISTRIBUTED RUNTIME',
    accentColor: '#00FF66',
    classification: 'AUTONOMOUS OPERATIONAL COCKPIT',
    clearance: 'OMEGA',
    tagline: 'Subprocess orchestrator with real-time SSE reasoning & KaTeX parser.',
    summary: 'Mission control console orchestrating parallel coding sub-agents, live thinking trace isolation, DLP data anonymization, and mathematical stream rendering.',
    metrics: [
      { label: 'STREAM LATENCY', value: '18ms TTFT', subtext: 'Real-time Server-Sent Events' },
      { label: 'TOKEN REASONING', value: 'ZERO LEAK', subtext: 'State-machine boundary isolation' },
      { label: 'AGENT CAPACITY', value: '10 SUBAGENTS', subtext: 'Parallel isolated background workers' }
    ],
    blueprint: `
[User Directives] ---> [The Key Supervisor Engine]
                               │
            ┌──────────────────┼──────────────────┐
            ▼                  ▼                  ▼
     [Architect Agent]  [Auditor Agent]   [Governance Agent]
            │                  │                  │
            └──────────────────┴──────────────────┘
                               │
            [StreamParser: Reasoning vs Output] ---> [KaTeX UI]
    `.trim(),
    operationalChallenge: 'Autonomous agents frequently leak internal reasoning traces into final user outputs and collapse under rapid streaming SSE chunks when mathematical formulas are split mid-token.',
    algorithmicSolution: 'Built a deterministic buffer-based StreamParser finite state machine that separates deep-thinking tokens from final synthesis. Integrated an AST-based KaTeX delimiter normalizer and strict DLP sanitization filters.',
    techStack: ['Next.js 16', 'React 19', 'TypeScript', 'KaTeX', 'Tailwind CSS v4', 'Server-Sent Events']
  },
  {
    id: 'gateway',
    code: 'MSN-03',
    title: 'Universal Central API Gateway',
    domain: 'HEADLESS PROTOCOL BRIDGE & ZERO-TRUST',
    accentColor: '#FF5500',
    classification: 'PRIVATE EDGE REVERSE PROXY',
    clearance: 'OMEGA',
    tagline: 'Unified headless MCP server caller & bidirectional task bridge.',
    summary: 'High-speed edge routing layer connecting Vercel edge runtime, VPS system daemons, Tailscale userspace mesh, and headless OAuth token lifecycle managers.',
    metrics: [
      { label: 'UPTIME RATE', value: '99.99%', subtext: 'Global edge distribution' },
      { label: 'EDGE ROUTING', value: '< 22ms', subtext: 'Vercel to VPS SOCKS5 bridge' },
      { label: 'ACTIVE MCPS', value: '5 SERVERS', subtext: 'Todoist, Notion, Globalping, Cloudflare' }
    ],
    blueprint: `
[Edge Clients] ---> [Central Gateway (api.thearinazs.my.id)]
                               │
                               ▼
                    [SOCKS5 / Tailscale Mesh]
                               │
            ┌──────────────────┴──────────────────┐
            ▼                                     ▼
 [Headless OAuth Broker]               [Bidirectional DB Bridge]
 [Loopback PTY Automation]             [SQLite WAL Sync Engine]
    `.trim(),
    operationalChallenge: 'Decoupled edge microservices required secure traversal across private NAT networks to invoke local Model Context Protocol tools without exposing unauthenticated TCP ports.',
    algorithmicSolution: 'Designed a unified reverse-proxy bridge with Bearer token validation and headless PTY loopback automation that completes OAuth 2.0 PKCE handshakes in non-interactive server environments.',
    techStack: ['FastAPI', 'Cloudflare Tunnels', 'Tailscale SOCKS5', 'SQLite WAL', 'PTY Automation']
  },
  {
    id: 'mesh',
    code: 'MSN-04',
    title: 'Distributed Mesh & Edge Cloud',
    domain: 'HYBRID CLOUD & EDGE INFRASTRUCTURE',
    accentColor: '#B500FF',
    classification: 'MULTI-TIER INFRASTRUCTURE MESH',
    clearance: 'OMEGA',
    tagline: 'Self-healing edge proxy with automated security scans & CI/CD delivery.',
    summary: 'Resilient developer infrastructure connecting remote developer workstations, automated learning pipelines, and instant cloud edge deployments.',
    metrics: [
      { label: 'MESH NODES', value: '4 RUNTIMES', subtext: 'Edge, VPS, Workstation, Android' },
      { label: 'DEPLOY SPEED', value: '25 SECONDS', subtext: 'Git push to global edge CDN' },
      { label: 'THREAT SCAN', value: '100% CLEAN', subtext: 'Automated supply chain integrity' }
    ],
    blueprint: `
[Git Repository] ---> [Automated TDD Test Suite] ---> [Zero-Downtime Edge Deploy]
                               │
                               ▼
            [Continuous Security Audit & Dependency Verifier]
    `.trim(),
    operationalChallenge: 'Coordinating cross-device workflows across mobile devices, headless servers, and developer laptops required manual port forwarding and insecure credential sharing.',
    algorithmicSolution: 'Implemented an automated userspace mesh daemon with automated GitHub delivery pipelines, encrypted secret vaults, and continuous background security scanners.',
    techStack: ['Linux', 'Cloudflare Workers', 'Vercel Edge', 'Docker', 'Bash']
  }
];

export function getMissionById(idOrAlias: string): Mission | undefined {
  const query = idOrAlias.toLowerCase().trim();
  return MISSIONS.find(m => 
    m.id.toLowerCase() === query || 
    m.code.toLowerCase() === query ||
    m.id.toLowerCase().includes(query)
  );
}
