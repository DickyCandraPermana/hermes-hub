"use client";

import React, { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { normalizeMathDelimiters } from "../lib/math";
import { StreamParser } from "../lib/stream-parser";
import {
  Send,
  Calendar,
  Mail,
  Cloud,
  Layers,
  Search,
  Check,
  Copy,
  ChevronRight,
  ChevronLeft,
  Sidebar as SidebarIcon,
  PanelRight,
  Plus,
  RefreshCw,
  ExternalLink,
  Command,
  X,
  GitBranch,
  Paperclip,
  Image as ImageIcon,
  FileText,
  Terminal,
  Zap,
  Sparkles,
  Radio,
  Database,
} from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
  reasoning?: string;
  isThinking?: boolean;
  timestamp: string;
  attachments?: { name: string; isImage: boolean; preview?: string }[];
}

interface AttachmentItem {
  name: string;
  type: string;
  size: number;
  isImage: boolean;
  content: string; // text or base64 dataUrl
  preview?: string;
}

interface WorkspaceData {
  calendar: any[];
  emails: any[];
  deployments: any[];
  stitch: any[];
  github: any[];
}

interface TelegramCommand {
  command: string;
  description: string;
  category: string;
}

// 62 Canonical Telegram Bot Commands
const TELEGRAM_COMMANDS: TelegramCommand[] = [
  { command: "/status", description: "Show session, model, token, and context info", category: "Runtime" },
  { command: "/usage", description: "Show token usage, cost, and rate limits", category: "Runtime" },
  { command: "/context", description: "Show detailed context window usage gauge and stats", category: "Runtime" },
  { command: "/model", description: "Switch model (session-scoped; --global to persist)", category: "Runtime" },
  { command: "/new", description: "Start a fresh session with clean context and history", category: "Session" },
  { command: "/sessions", description: "Browse and resume previous sessions", category: "Session" },
  { command: "/resume", description: "Resume a previously-named session", category: "Session" },
  { command: "/save", description: "Export the current conversation", category: "Session" },
  { command: "/undo", description: "Back up N user turns and re-prompt (default 1)", category: "Session" },
  { command: "/retry", description: "Retry the last message (resend to agent)", category: "Session" },
  { command: "/compress", description: "Compress conversation context (keep recent N turns)", category: "Session" },
  { command: "/branch", description: "Branch the current session into a new thread", category: "Session" },
  { command: "/title", description: "Set a custom title for the current session", category: "Session" },
  { command: "/diff", description: "Show git changes in the working directory", category: "Git" },
  { command: "/plan", description: "Write an implementation plan to .key/plans/", category: "Agents" },
  { command: "/review", description: "Spawn an independent subagent to review code/PR", category: "Agents" },
  { command: "/agents", description: "Show active agents and running tasks", category: "Agents" },
  { command: "/bg", description: "Run a prompt in a separate background session", category: "Agents" },
  { command: "/stop", description: "Kill all running background processes", category: "Control" },
  { command: "/pause", description: "Pause new work globally (emergency stop)", category: "Control" },
  { command: "/rollback", description: "List or restore filesystem checkpoints", category: "Control" },
  { command: "/approve", description: "Approve a pending dangerous command", category: "Approvals" },
  { command: "/deny", description: "Deny a pending dangerous command", category: "Approvals" },
  { command: "/yolo", description: "Toggle YOLO mode (skip dangerous command approvals)", category: "Approvals" },
  { command: "/approvals", description: "Show or set persistent command approval mode", category: "Approvals" },
  { command: "/goal", description: "Set a standing goal The Key works on across turns", category: "Workflow" },
  { command: "/subgoal", description: "Add extra criteria on the active goal", category: "Workflow" },
  { command: "/loop", description: "Re-run a prompt on a recurring interval", category: "Workflow" },
  { command: "/heartbeat", description: "Set a recurring prompt when session is idle", category: "Workflow" },
  { command: "/steer", description: "Inject a course-correction message without stopping", category: "Workflow" },
  { command: "/btw", description: "Ask a side question without interrupting flow", category: "Workflow" },
  { command: "/queue", description: "Queue a prompt for the next turn", category: "Workflow" },
  { command: "/memory", description: "Review memory writes / toggle approval gate", category: "Memory" },
  { command: "/refine", description: "Review conversation and save lessons to memory/skills", category: "Memory" },
  { command: "/learn", description: "Learn a reusable skill from dirs, URLs, or notes", category: "Skills" },
  { command: "/bundles", description: "List skill bundles and aliases", category: "Skills" },
  { command: "/commands", description: "Browse all commands and skills paginated", category: "System" },
  { command: "/help", description: "Show available commands and documentation", category: "System" },
  { command: "/update", description: "Update The Key agent core to the latest version", category: "System" },
  { command: "/restart", description: "Gracefully restart gateway after active runs", category: "System" },
  { command: "/debug", description: "Upload debug report (system info + logs)", category: "System" },
  { command: "/profile", description: "Show active profile name and home directory", category: "System" },
  { command: "/whoami", description: "Show slash command access level (admin/user)", category: "System" },
  { command: "/fast", description: "Toggle fast mode (Priority Processing)", category: "System" },
  { command: "/reasoning", description: "Manage reasoning effort and display", category: "System" },
  { command: "/voice", description: "Toggle voice mode", category: "System" },
  { command: "/egress", description: "Show Docker egress proxy status", category: "System" },
  { command: "/init", description: "Generate or update AGENTS.md project instructions", category: "System" },
  { command: "/curator", description: "Background skill maintenance and health check", category: "System" },
];

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [expandedReasoning, setExpandedReasoning] = useState<Record<number, boolean>>({});

  const toggleReasoning = (index: number) => {
    setExpandedReasoning((prev) => ({
      ...prev,
      [index]: prev[index] === false ? true : false,
    }));
  };

  // Panels state
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const [inspectorTab, setInspectorTab] = useState<"agenda" | "logs" | "radar" | "vercel" | "stitch" | "commands">("agenda");

  // Daily Logs & Radar State
  const [dailyLogs, setDailyLogs] = useState<any[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [semanticQuery, setSemanticQuery] = useState("");
  const [semanticSearching, setSemanticSearching] = useState(false);
  const [radarDigests, setRadarDigests] = useState<any[]>([]);
  const [radarLoading, setRadarLoading] = useState(false);

  // Attachments state
  const [attachments, setAttachments] = useState<AttachmentItem[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Command palette state
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [commandQuery, setCommandQuery] = useState("");

  // Inspector commands filter
  const [commandFilterQuery, setCommandFilterQuery] = useState("");

  // Slash auto-complete state
  const [slashMenuOpen, setSlashMenuOpen] = useState(false);
  const [slashFiltered, setSlashFiltered] = useState<TelegramCommand[]>([]);

  // Workspace data
  const [workspace, setWorkspace] = useState<WorkspaceData>({
    calendar: [],
    emails: [],
    deployments: [],
    stitch: [],
    github: [],
  });
  const [workspaceLoading, setWorkspaceLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Responsive sidebar initial state
  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth >= 1024) {
      setSidebarOpen(true);
    }
  }, []);

  // Fetch workspace status & inspector data
  const fetchWorkspaceData = async () => {
    setWorkspaceLoading(true);
    try {
      const res = await fetch("/api/workspace");
      if (res.ok) {
        const data = await res.json();
        setWorkspace(data);
      }
    } catch (e) {
      console.error("Fetch workspace error:", e);
    } finally {
      setWorkspaceLoading(false);
    }
  };

  const fetchDailyLogs = async () => {
    setLogsLoading(true);
    try {
      const res = await fetch("/api/logs?limit=15");
      if (res.ok) {
        const data = await res.json();
        setDailyLogs(data.logs || []);
      }
    } catch (e) {
      console.error("Fetch logs error:", e);
    } finally {
      setLogsLoading(false);
    }
  };

  const performSemanticSearch = async () => {
    if (!semanticQuery.trim()) {
      fetchDailyLogs();
      return;
    }
    setSemanticSearching(true);
    try {
      const res = await fetch("/api/logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: semanticQuery.trim(), limit: 5 }),
      });
      if (res.ok) {
        const data = await res.json();
        setDailyLogs(data.results || []);
      }
    } catch (e) {
      console.error("Semantic search error:", e);
    } finally {
      setSemanticSearching(false);
    }
  };

  const fetchRadarDigests = async () => {
    setRadarLoading(true);
    try {
      const res = await fetch("/api/radar");
      if (res.ok) {
        const data = await res.json();
        setRadarDigests(data.digests || []);
      }
    } catch (e) {
      console.error("Fetch radar error:", e);
    } finally {
      setRadarLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkspaceData();
    fetchDailyLogs();
    fetchRadarDigests();
  }, []);

  // Keyboard shortcut for Cmd+K and Esc
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      } else if (e.key === "Escape") {
        setCommandPaletteOpen(false);
        setSlashMenuOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Slash command trigger detection
  useEffect(() => {
    if (input.startsWith("/")) {
      const query = input.slice(1).toLowerCase().trim();
      const filtered = TELEGRAM_COMMANDS.filter(
        (c) =>
          c.command.toLowerCase().includes(query) ||
          c.description.toLowerCase().includes(query)
      );
      setSlashFiltered(filtered.slice(0, 8));
      setSlashMenuOpen(filtered.length > 0);
    } else {
      setSlashMenuOpen(false);
    }
  }, [input]);

  // Scroll chat to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Adjust textarea height dynamically
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        200
      )}px`;
    }
  }, [input]);

  // Handle file uploads
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const isImg = file.type.startsWith("image/");
      const reader = new FileReader();

      if (isImg) {
        reader.onload = (event) => {
          const res = event.target?.result as string;
          setAttachments((prev) => [
            ...prev,
            {
              name: file.name,
              type: file.type,
              size: file.size,
              isImage: true,
              content: res,
              preview: res,
            },
          ]);
        };
        reader.readAsDataURL(file);
      } else {
        reader.onload = (event) => {
          const res = event.target?.result as string;
          setAttachments((prev) => [
            ...prev,
            {
              name: file.name,
              type: file.type,
              size: file.size,
              isImage: false,
              content: res || `[File binary: ${file.name} (${file.size} bytes)]`,
            },
          ]);
        };
        reader.readAsText(file);
      }
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  // Select a slash command
  const selectSlashCommand = (cmd: TelegramCommand) => {
    setSlashMenuOpen(false);
    if (cmd.command === "/new") {
      setMessages([]);
      setInput("");
      return;
    }
    // Set the command and execute
    sendMessage(cmd.command);
  };

  // Handle message sending with SSE streaming
  const sendMessage = async (overrideText?: string) => {
    const textToSend = overrideText || input;
    if ((!textToSend.trim() && attachments.length === 0) || loading) return;

    const time = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    // Special client-side handling for /new
    if (textToSend.trim() === "/new") {
      setMessages([]);
      setInput("");
      setAttachments([]);
      return;
    }

    // Build payload with attachments if present
    let finalPrompt = textToSend.trim();
    const currentAttachments = [...attachments];

    if (currentAttachments.length > 0) {
      currentAttachments.forEach((att) => {
        if (att.isImage) {
          finalPrompt += `\n\n[Lampiran Gambar: ${att.name}] (${att.content.slice(0, 100)}...)`;
        } else {
          finalPrompt += `\n\n--- Isi File: ${att.name} ---\n\`\`\`\n${att.content.slice(0, 8000)}\n\`\`\`\n`;
        }
      });
    }

    const userMessage: Message = {
      role: "user",
      content: textToSend.trim() || `[Mengirim ${currentAttachments.length} lampiran]`,
      timestamp: time,
      attachments: currentAttachments.map((a) => ({
        name: a.name,
        isImage: a.isImage,
        preview: a.preview,
      })),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    if (!overrideText) setInput("");
    setAttachments([]);
    setSlashMenuOpen(false);
    setLoading(true);

    const assistantMessage: Message = {
      role: "assistant",
      content: "",
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setMessages([...newMessages, assistantMessage]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages.map((m, idx) => ({
            role: m.role,
            content: idx === newMessages.length - 1 ? finalPrompt : m.content,
          })),
        }),
      });

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }

      if (!res.body) {
        throw new Error("No response body received");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let done = false;
      let lineBuffer = "";
      const streamParser = new StreamParser();

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          const chunk = decoder.decode(value, { stream: true });
          lineBuffer += chunk;
          const lines = lineBuffer.split("\n");
          lineBuffer = lines.pop() || "";

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const dataStr = line.replace("data: ", "").trim();
              if (dataStr === "[DONE]") break;
              try {
                const parsed = JSON.parse(dataStr);
                const delta = parsed.choices?.[0]?.delta;
                if (delta) {
                  streamParser.processDelta(delta);
                  setMessages((prev) => {
                    const updated = [...prev];
                    const last = updated[updated.length - 1];
                    if (last && last.role === "assistant") {
                      last.content = streamParser.accumulatedContent;
                      last.reasoning = streamParser.accumulatedReasoning;
                      last.isThinking = streamParser.isThinking;
                    }
                    return updated;
                  });
                }
              } catch {
                // Ignore parse errors from chunk boundaries
              }
            }
          }
        }
      }

      const finalState = streamParser.finish();
      setMessages((prev) => {
        const updated = [...prev];
        const last = updated[updated.length - 1];
        if (last && last.role === "assistant") {
          last.content = finalState.content;
          last.reasoning = finalState.reasoning;
          last.isThinking = false;
        }
        return updated;
      });
    } catch (err: any) {
      setMessages((prev) => {
        const updated = [...prev];
        const last = updated[updated.length - 1];
        if (last && last.role === "assistant") {
          last.content = `[Gagal terhubung ke The Key: ${err.message}]`;
          last.isThinking = false;
        }
        return updated;
      });
    } finally {
      setLoading(false);
      setMessages((prev) => {
        const updated = [...prev];
        const last = updated[updated.length - 1];
        if (last && last.role === "assistant") {
          last.isThinking = false;
        }
        return updated;
      });
    }
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Commands for palette (Action shortcuts + Full Telegram Bot Commands)
  const paletteCommands = [
    {
      label: "Briefing Pagi (Kalender & Gmail)",
      command: "/briefing",
      category: "Action",
      action: () => {
        setCommandPaletteOpen(false);
        sendMessage("Cek jadwal Google Calendar hari ini dan email unread terbaru di Gmail.");
      },
    },
    {
      label: "Cek Status Deployment Vercel",
      command: "/vercel",
      category: "Action",
      action: () => {
        setCommandPaletteOpen(false);
        sendMessage("Cek status semua deployment project Vercel saya saat ini.");
      },
    },
    {
      label: "Buka Inspector Deck: Telegram Commands",
      command: "/commands",
      category: "View",
      action: () => {
        setCommandPaletteOpen(false);
        setInspectorOpen(true);
        setInspectorTab("commands");
      },
    },
    ...TELEGRAM_COMMANDS.map((tc) => ({
      label: `${tc.command} — ${tc.description}`,
      command: tc.command,
      category: tc.category,
      action: () => {
        setCommandPaletteOpen(false);
        sendMessage(tc.command);
      },
    })),
  ];

  const filteredPaletteCommands = paletteCommands.filter(
    (c) =>
      c.label.toLowerCase().includes(commandQuery.toLowerCase()) ||
      c.command.toLowerCase().includes(commandQuery.toLowerCase())
  );

  const filteredInspectorCommands = TELEGRAM_COMMANDS.filter(
    (c) =>
      c.command.toLowerCase().includes(commandFilterQuery.toLowerCase()) ||
      c.description.toLowerCase().includes(commandFilterQuery.toLowerCase()) ||
      c.category.toLowerCase().includes(commandFilterQuery.toLowerCase())
  );

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-black text-[#ededed] font-sans antialiased selection:bg-[#333333] selection:text-white relative">
      {/* Mobile Sidebar Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-xs z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* 1. LEFT SIDEBAR */}
      <aside
        className={`${
          sidebarOpen ? "translate-x-0 w-64" : "-translate-x-full w-0"
        } lg:translate-x-0 ${
          sidebarOpen ? "lg:w-64" : "lg:w-0"
        } fixed lg:relative inset-y-0 left-0 z-40 transition-all duration-200 ease-in-out border-r border-[#1a1a1a] bg-[#050505] flex flex-col justify-between overflow-hidden shrink-0`}
      >
        <div className="flex flex-col h-full">
          {/* Top Brand Bar */}
          <div className="h-12 px-4 border-b border-[#1a1a1a] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-white text-xs font-mono font-medium tracking-widest uppercase">
                ▲ THE KEY
              </span>
              <span className="text-[10px] font-mono text-[#888888] border border-[#222222] px-1.5 py-0.5 rounded">
                CLI/API
              </span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="text-[#666666] hover:text-[#ededed] p-1 transition"
              title="Close sidebar"
            >
              <ChevronLeft size={16} />
            </button>
          </div>

          {/* New Thread CTA */}
          <div className="p-3">
            <button
              onClick={() => {
                setMessages([]);
                if (window.innerWidth < 1024) setSidebarOpen(false);
              }}
              className="w-full flex items-center justify-between px-3 py-2 text-xs font-mono bg-[#0c0c0c] hover:bg-[#141414] border border-[#1f1f1f] hover:border-[#333333] text-[#ededed] rounded transition"
            >
              <span className="flex items-center gap-2">
                <Plus size={14} className="text-[#888888]" />
                New Thread
              </span>
              <span className="text-[10px] text-[#555555]">⌘N</span>
            </button>
          </div>

          {/* Thread List / History */}
          <div className="flex-1 overflow-y-auto px-3 space-y-1">
            <div className="text-[11px] font-mono uppercase tracking-wider text-[#555555] px-2 py-1">
              Active Context
            </div>
            <button className="w-full text-left px-2.5 py-2 rounded text-xs border border-[#262626] bg-[#111111] text-white font-medium truncate flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] shrink-0" />
              <span>General Session</span>
            </button>

            {/* Quick Command Menu trigger in sidebar */}
            <div className="pt-3">
              <div className="text-[11px] font-mono uppercase tracking-wider text-[#555555] px-2 py-1">
                Bot Commands ({TELEGRAM_COMMANDS.length})
              </div>
              <button
                onClick={() => {
                  setInspectorOpen(true);
                  setInspectorTab("commands");
                  if (window.innerWidth < 1024) setSidebarOpen(false);
                }}
                className="w-full text-left px-2.5 py-2 rounded text-xs border border-[#1a1a1a] hover:border-[#333333] bg-[#080808] hover:bg-[#111111] text-[#aaaaaa] hover:text-white transition flex items-center justify-between"
              >
                <span className="flex items-center gap-1.5 font-mono">
                  <Terminal size={12} className="text-[#10b981]" />
                  <span>Browse Commands</span>
                </span>
                <span className="text-[10px] text-[#555555]">/</span>
              </button>
            </div>
          </div>

          {/* Connected Services Stack */}
          <div className="border-t border-[#1a1a1a] p-3 space-y-2 bg-[#050505]">
            <div className="text-[10px] font-mono uppercase tracking-wider text-[#555555] px-1 flex items-center justify-between">
              <span>Environment</span>
              <span className="text-[#10b981] flex items-center gap-1 font-mono text-[9px]">
                <span className="w-1 h-1 rounded-full bg-[#10b981]" />
                ONLINE
              </span>
            </div>

            <div className="space-y-1.5 font-mono text-[11px] text-[#888888]">
              <div className="flex items-center justify-between px-2 py-1 rounded bg-[#0a0a0a] border border-[#141414]">
                <span className="flex items-center gap-1.5 text-[#cccccc]">
                  <Mail size={12} className="text-[#888888]" /> Google WS
                </span>
                <span className="text-[10px] text-[#10b981]">Linked</span>
              </div>

              <div className="flex items-center justify-between px-2 py-1 rounded bg-[#0a0a0a] border border-[#141414]">
                <span className="flex items-center gap-1.5 text-[#cccccc]">
                  <Cloud size={12} className="text-[#888888]" /> Vercel
                </span>
                <span className="text-[10px] text-[#10b981]">5 Ready</span>
              </div>

              <div className="flex items-center justify-between px-2 py-1 rounded bg-[#0a0a0a] border border-[#141414]">
                <span className="flex items-center gap-1.5 text-[#cccccc]">
                  <Layers size={12} className="text-[#888888]" /> Stitch MCP
                </span>
                <span className="text-[10px] text-[#10b981]">2 Projects</span>
              </div>

              <div className="flex items-center justify-between px-2 py-1 rounded bg-[#0a0a0a] border border-[#141414]">
                <span className="flex items-center gap-1.5 text-[#cccccc]">
                  <GitBranch size={12} className="text-[#888888]" /> GitHub CLI
                </span>
                <span className="text-[10px] text-[#10b981]">Auth'd</span>
              </div>
            </div>

            {/* User identifier */}
            <div className="pt-1 border-t border-[#141414] flex items-center justify-between text-xs text-[#888888]">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-[#1a1a1a] text-[10px] font-mono flex items-center justify-center text-white border border-[#2a2a2a]">
                  DP
                </div>
                <span className="text-[11px] text-[#cccccc] font-medium">Dicky Candra</span>
              </div>
              <span className="text-[10px] font-mono text-[#555555]">v2026.10</span>
            </div>
          </div>
        </div>
      </aside>

      {/* 2. MAIN CENTER CONSOLE */}
      <main className="flex-1 flex flex-col h-full min-w-0 bg-black relative">
        {/* Top Hairline Header */}
        <header className="h-12 border-b border-[#1a1a1a] px-3 sm:px-4 flex items-center justify-between shrink-0 bg-black/90 backdrop-blur z-10">
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-[#888888] hover:text-white p-1 rounded hover:bg-[#111111] transition"
              title="Toggle sidebar"
            >
              <SidebarIcon size={16} />
            </button>

            <div className="flex items-center gap-1.5 font-mono text-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]" />
              <span className="text-[#ededed] font-medium hidden sm:inline">the-key-gateway</span>
              <span className="text-[#ededed] font-medium sm:hidden">the-key</span>
              <span className="text-[#555555] text-[10px] sm:text-xs">:8642</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Quick Command Trigger */}
            <button
              onClick={() => setCommandPaletteOpen(true)}
              className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-2.5 py-1 rounded text-xs font-mono bg-[#0c0c0c] hover:bg-[#141414] border border-[#1f1f1f] text-[#888888] hover:text-[#ededed] transition"
            >
              <Command size={12} />
              <span className="hidden sm:inline">Commands</span>
              <kbd className="text-[9px] sm:text-[10px] bg-[#1a1a1a] text-[#aaaaaa] px-1 py-0.2 rounded border border-[#262626]">
                ⌘K
              </kbd>
            </button>

            {/* Toggle Inspector Deck */}
            <button
              onClick={() => setInspectorOpen(!inspectorOpen)}
              className={`p-1.5 sm:px-2 sm:py-1 rounded border transition flex items-center gap-1.5 text-xs font-mono ${
                inspectorOpen
                  ? "bg-[#161616] border-[#333333] text-white"
                  : "bg-transparent border-[#1f1f1f] text-[#888888] hover:text-white hover:border-[#2a2a2a]"
              }`}
              title="Toggle Inspector"
            >
              <PanelRight size={14} />
              <span className="hidden sm:inline">Inspector</span>
            </button>
          </div>
        </header>

        {/* Chat / Operate Stream */}
        <div className="flex-1 overflow-y-auto px-3 sm:px-6 md:px-8 py-4 sm:py-6 space-y-5">
          {messages.length === 0 ? (
            /* Clean Empty State */
            <div className="max-w-2xl mx-auto mt-8 sm:mt-16 text-center space-y-5 sm:space-y-6">
              <div className="space-y-1.5 sm:space-y-2">
                <div className="text-[11px] font-mono tracking-widest text-[#666666] uppercase">
                  Terminal Mode
                </div>
                <h1 className="text-xl sm:text-2xl font-medium tracking-tight text-white">
                  The Key Autonomous Workspace
                </h1>
                <p className="text-xs sm:text-sm text-[#888888] max-w-md mx-auto leading-relaxed px-2">
                  Interaksi langsung dengan runtime server, Google Cloud Workspace, Vercel deployments, dan Stitch MCP.
                </p>
              </div>

              {/* Minimalist prompt suggestions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left pt-2 max-w-lg mx-auto">
                <button
                  onClick={() => sendMessage("/status")}
                  className="p-3 rounded border border-[#1a1a1a] hover:border-[#333333] bg-[#080808] hover:bg-[#0f0f0f] transition group"
                >
                  <div className="text-xs font-mono text-[#cccccc] group-hover:text-white flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Terminal size={12} className="text-[#10b981]" />
                      /status
                    </span>
                    <span className="text-[#555555] font-mono text-[10px]">INFO</span>
                  </div>
                  <div className="text-[11px] text-[#666666] mt-1">
                    Cek model, token usage, dan memori
                  </div>
                </button>

                <button
                  onClick={() => sendMessage("/diff")}
                  className="p-3 rounded border border-[#1a1a1a] hover:border-[#333333] bg-[#080808] hover:bg-[#0f0f0f] transition group"
                >
                  <div className="text-xs font-mono text-[#cccccc] group-hover:text-white flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <GitBranch size={12} className="text-[#10b981]" />
                      /diff
                    </span>
                    <span className="text-[#555555] font-mono text-[10px]">GIT</span>
                  </div>
                  <div className="text-[11px] text-[#666666] mt-1">
                    Lihat uncommitted changes git repo
                  </div>
                </button>

                <button
                  onClick={() =>
                    sendMessage(
                      "Cek jadwal Google Calendar hari ini dan email unread terbaru di Gmail."
                    )
                  }
                  className="p-3 rounded border border-[#1a1a1a] hover:border-[#333333] bg-[#080808] hover:bg-[#0f0f0f] transition group"
                >
                  <div className="text-xs font-mono text-[#cccccc] group-hover:text-white flex items-center justify-between">
                    <span>Google Workspace</span>
                    <span className="text-[#555555] font-mono text-[10px]">01</span>
                  </div>
                  <div className="text-[11px] text-[#666666] mt-1">
                    Cek agenda Calendar & unread Gmail
                  </div>
                </button>

                <button
                  onClick={() =>
                    sendMessage(
                      "Cek status deployment semua project Vercel saya dan laporkan domain aktifnya."
                    )
                  }
                  className="p-3 rounded border border-[#1a1a1a] hover:border-[#333333] bg-[#080808] hover:bg-[#0f0f0f] transition group"
                >
                  <div className="text-xs font-mono text-[#cccccc] group-hover:text-white flex items-center justify-between">
                    <span>Vercel Projects</span>
                    <span className="text-[#555555] font-mono text-[10px]">02</span>
                  </div>
                  <div className="text-[11px] text-[#666666] mt-1">
                    Cek status production & domain live
                  </div>
                </button>
              </div>

              {/* Bot commands hint */}
              <div className="text-[11px] font-mono text-[#555555] pt-2">
                Ketik <span className="text-[#ededed] bg-[#141414] px-1 py-0.5 rounded border border-[#222222]">/</span> untuk membuka daftar 62 perintah The Key bot
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-5">
              {messages.map((msg, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-mono text-[#555555] px-1">
                    <span className="flex items-center gap-1.5">
                      {msg.role === "user" ? (
                        <span className="text-[#cccccc] font-medium">YOU</span>
                      ) : (
                        <span className="text-white font-medium flex items-center gap-1">
                          <span>▲</span> THE KEY
                        </span>
                      )}
                    </span>
                    <span>{msg.timestamp}</span>
                  </div>

                  <div
                    className={`rounded-md p-3.5 sm:p-4 transition text-sm ${
                      msg.role === "user"
                        ? "bg-[#0a0a0a] border border-[#1f1f1f] text-[#ededed]"
                        : "bg-transparent border border-[#141414] text-[#d4d4d4]"
                    }`}
                  >
                    {/* Render message attachments preview if any */}
                    {msg.attachments && msg.attachments.length > 0 && (
                      <div className="mb-3 flex flex-wrap gap-2">
                        {msg.attachments.map((att, aIdx) => (
                          <div
                            key={aIdx}
                            className="flex items-center gap-2 p-1.5 rounded bg-[#111111] border border-[#222222] text-xs font-mono text-[#cccccc]"
                          >
                            {att.isImage && att.preview ? (
                              <img
                                src={att.preview}
                                alt={att.name}
                                className="w-7 h-7 object-cover rounded border border-[#333333]"
                              />
                            ) : (
                              <FileText size={14} className="text-[#888888]" />
                            )}
                            <span className="truncate max-w-[120px]">{att.name}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Thinking Process Collapsible Log */}
                    {msg.role === "assistant" && msg.reasoning && (
                      <div className="mb-3 rounded-lg border border-[#222222] bg-[#0c0c0c] overflow-hidden text-xs">
                        <button
                          type="button"
                          onClick={() => toggleReasoning(idx)}
                          className="w-full flex items-center justify-between px-3 py-2 text-[#888888] hover:text-[#ededed] hover:bg-[#141414] transition-colors cursor-pointer select-none"
                        >
                          <div className="flex items-center gap-2">
                            <Sparkles className={`w-3.5 h-3.5 ${msg.isThinking ? "text-amber-400 animate-pulse" : "text-[#666666]"}`} />
                            <span className="font-medium text-[#cccccc]">
                              {msg.isThinking ? "The Key sedang berpikir..." : "Log Pemikiran (Thinking Process)"}
                            </span>
                            {msg.isThinking && (
                              <span className="flex h-1.5 w-1.5 relative">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-500"></span>
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 text-[11px] text-[#666666]">
                            <span>{expandedReasoning[idx] !== false ? "Sembunyikan" : "Tampilkan"}</span>
                            <ChevronRight className={`w-3.5 h-3.5 transition-transform duration-200 ${expandedReasoning[idx] !== false ? "rotate-90" : ""}`} />
                          </div>
                        </button>
                        {expandedReasoning[idx] !== false && (
                          <div className="px-3.5 py-3 border-t border-[#1a1a1a] bg-[#080808]/70 text-[#999999] font-mono text-[11.5px] leading-relaxed max-h-96 overflow-y-auto whitespace-pre-wrap selection:bg-amber-500/20 selection:text-amber-200">
                            {msg.reasoning}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="markdown-body">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm, remarkMath]}
                        rehypePlugins={[[rehypeKatex, { throwOnError: false, strict: false }]]}
                      >
                        {normalizeMathDelimiters(msg.content) || (loading && idx === messages.length - 1 ? "..." : "")}
                      </ReactMarkdown>
                    </div>

                    {msg.role === "assistant" && msg.content && (
                      <div className="mt-3 pt-2 border-t border-[#141414] flex items-center justify-end gap-2">
                        <button
                          onClick={() => copyToClipboard(msg.content, idx)}
                          className="flex items-center gap-1 text-[11px] font-mono text-[#666666] hover:text-[#cccccc] transition px-1.5 py-0.5 rounded hover:bg-[#111111]"
                        >
                          {copiedIndex === idx ? (
                            <>
                              <Check size={11} className="text-[#10b981]" />
                              <span>COPIED</span>
                            </>
                          ) : (
                            <>
                              <Copy size={11} />
                              <span>COPY</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Bottom Dock Input Bar with Slash Command Popover & Attachment Preview */}
        <div className="p-2.5 sm:p-4 border-t border-[#1a1a1a] bg-black shrink-0 relative">
          <div className="max-w-3xl mx-auto relative">
            {/* Slash Command Auto-complete Popover */}
            {slashMenuOpen && slashFiltered.length > 0 && (
              <div className="absolute bottom-full left-0 right-0 mb-2 bg-[#080808] border border-[#262626] rounded-lg shadow-2xl overflow-hidden font-mono z-40 max-h-60 overflow-y-auto">
                <div className="px-3 py-1.5 bg-[#0e0e0e] border-b border-[#1a1a1a] flex items-center justify-between text-[10px] text-[#777777] uppercase tracking-wider">
                  <span>The Key Bot Commands</span>
                  <span>{slashFiltered.length} matches</span>
                </div>
                <div className="p-1 space-y-0.5">
                  {slashFiltered.map((cmd, i) => (
                    <button
                      key={i}
                      onClick={() => selectSlashCommand(cmd)}
                      className="w-full text-left px-2.5 py-1.5 rounded hover:bg-[#141414] flex items-center justify-between group transition text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-white font-medium">{cmd.command}</span>
                        <span className="text-[#666666] truncate max-w-[280px] sm:max-w-md text-[11px]">
                          {cmd.description}
                        </span>
                      </div>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#111111] text-[#888888] border border-[#222222] uppercase">
                        {cmd.category}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Hidden native file input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept="image/*,.txt,.md,.json,.js,.ts,.tsx,.css,.py,.pdf,.csv"
              multiple
              className="hidden"
            />

            <div className="bg-[#080808] border border-[#1f1f1f] focus-within:border-[#333333] rounded-lg p-2.5 transition flex flex-col gap-2">
              {/* Attachment Preview Row */}
              {attachments.length > 0 && (
                <div className="flex flex-wrap gap-2 pb-1.5 border-b border-[#141414]">
                  {attachments.map((att, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-1.5 px-2 py-1 rounded bg-[#111111] border border-[#262626] text-xs font-mono text-[#ededed]"
                    >
                      {att.isImage ? (
                        <img
                          src={att.preview}
                          alt={att.name}
                          className="w-5 h-5 object-cover rounded border border-[#333333]"
                        />
                      ) : (
                        <FileText size={12} className="text-[#888888]" />
                      )}
                      <span className="truncate max-w-[130px]">{att.name}</span>
                      <button
                        onClick={() => removeAttachment(i)}
                        className="text-[#666666] hover:text-[#ef4444] p-0.5 ml-0.5 transition"
                        title="Remove"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    if (slashMenuOpen && slashFiltered.length > 0) {
                      selectSlashCommand(slashFiltered[0]);
                    } else {
                      sendMessage();
                    }
                  } else if (e.key === "Escape") {
                    setSlashMenuOpen(false);
                  }
                }}
                placeholder="Tulis pesan atau ketik '/' untuk melihat perintah The Key..."
                rows={1}
                disabled={loading}
                className="w-full bg-transparent text-sm text-[#ededed] placeholder-[#555555] focus:outline-none resize-none leading-relaxed"
              />

              <div className="flex items-center justify-between pt-1 border-t border-[#141414] text-[11px] font-mono text-[#555555]">
                <div className="flex items-center gap-2 sm:gap-3">
                  {/* Attachment Trigger Button */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-1 rounded text-[#888888] hover:text-white hover:bg-[#141414] transition flex items-center gap-1"
                    title="Attach image or file"
                  >
                    <Paperclip size={13} />
                    <span className="text-[10px] hidden sm:inline">Attach</span>
                  </button>

                  {/* Slash command quick pill */}
                  <button
                    type="button"
                    onClick={() => {
                      setInput("/");
                      textareaRef.current?.focus();
                    }}
                    className="p-1 rounded text-[#888888] hover:text-white hover:bg-[#141414] transition flex items-center gap-1"
                    title="Open slash commands"
                  >
                    <Terminal size={12} />
                    <span className="text-[10px] hidden sm:inline">Commands (/)</span>
                  </button>

                  <span className="hidden sm:inline">Enter to send</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => sendMessage()}
                    disabled={loading || (!input.trim() && attachments.length === 0)}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-mono font-medium transition ${
                      (input.trim() || attachments.length > 0) && !loading
                        ? "bg-white text-black hover:bg-[#e0e0e0]"
                        : "bg-[#141414] text-[#444444] cursor-not-allowed"
                    }`}
                  >
                    {loading ? (
                      <>
                        <RefreshCw size={12} className="animate-spin" />
                        <span>STREAMING</span>
                      </>
                    ) : (
                      <>
                        <Send size={12} />
                        <span>SEND</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* 3. RIGHT COLLAPSIBLE INSPECTOR DECK */}
      <aside
        className={`${
          inspectorOpen ? "w-80" : "w-0"
        } transition-all duration-200 ease-in-out border-l border-[#1a1a1a] bg-[#050505] flex flex-col overflow-hidden shrink-0 z-20`}
      >
        <div className="h-12 px-4 border-b border-[#1a1a1a] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-xs font-mono text-[#888888]">
            <PanelRight size={14} />
            <span className="text-white font-medium uppercase tracking-wider">Inspector</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={fetchWorkspaceData}
              disabled={workspaceLoading}
              className="text-[#666666] hover:text-white p-1 transition"
              title="Refresh data"
            >
              <RefreshCw size={14} className={workspaceLoading ? "animate-spin" : ""} />
            </button>
            <button
              onClick={() => setInspectorOpen(false)}
              className="text-[#666666] hover:text-white p-1 transition"
              title="Close panel"
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Tab Switcher - 6 Equal Tabs (Agenda, Logs, Radar, Vercel, Stitch, Commands) */}
        <div className="grid grid-cols-6 border-b border-[#1a1a1a] text-xs font-mono bg-[#080808]">
          <button
            onClick={() => setInspectorTab("agenda")}
            className={`py-2 text-center transition border-b-2 text-[10px] ${
              inspectorTab === "agenda"
                ? "border-white text-white bg-[#0e0e0e]"
                : "border-transparent text-[#666666] hover:text-[#cccccc]"
            }`}
          >
            Agenda
          </button>
          <button
            onClick={() => setInspectorTab("logs")}
            className={`py-2 text-center transition border-b-2 text-[10px] ${
              inspectorTab === "logs"
                ? "border-white text-white bg-[#0e0e0e]"
                : "border-transparent text-[#666666] hover:text-[#cccccc]"
            }`}
          >
            Logs
          </button>
          <button
            onClick={() => setInspectorTab("radar")}
            className={`py-2 text-center transition border-b-2 text-[10px] ${
              inspectorTab === "radar"
                ? "border-white text-white bg-[#0e0e0e]"
                : "border-transparent text-[#666666] hover:text-[#cccccc]"
            }`}
          >
            Radar
          </button>
          <button
            onClick={() => setInspectorTab("vercel")}
            className={`py-2 text-center transition border-b-2 text-[10px] ${
              inspectorTab === "vercel"
                ? "border-white text-white bg-[#0e0e0e]"
                : "border-transparent text-[#666666] hover:text-[#cccccc]"
            }`}
          >
            Vercel
          </button>
          <button
            onClick={() => setInspectorTab("stitch")}
            className={`py-2 text-center transition border-b-2 text-[10px] ${
              inspectorTab === "stitch"
                ? "border-white text-white bg-[#0e0e0e]"
                : "border-transparent text-[#666666] hover:text-[#cccccc]"
            }`}
          >
            Stitch
          </button>
          <button
            onClick={() => setInspectorTab("commands")}
            className={`py-2 text-center transition border-b-2 text-[10px] ${
              inspectorTab === "commands"
                ? "border-white text-white bg-[#0e0e0e]"
                : "border-transparent text-[#666666] hover:text-[#cccccc]"
            }`}
          >
            Cmds
          </button>
        </div>

        {/* Inspector Tab Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs font-mono">
          {inspectorTab === "agenda" && (
            <div className="space-y-4">
              {/* Google Calendar Section */}
              <div className="space-y-2">
                <div className="text-[11px] uppercase tracking-wider text-[#666666] flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-[#cccccc]">
                    <Calendar size={12} /> Today's Agenda
                  </span>
                  <span className="text-[10px] text-[#555555]">
                    {workspace.calendar.length} events
                  </span>
                </div>
                {workspace.calendar.length === 0 ? (
                  <div className="p-3 rounded border border-[#141414] bg-[#0a0a0a] text-[#666666] text-center text-[11px]">
                    Tidak ada agenda kalender hari ini
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {workspace.calendar.map((ev, i) => (
                      <div
                        key={i}
                        className="p-2.5 rounded border border-[#1a1a1a] bg-[#0a0a0a] text-[#ededed]"
                      >
                        <div className="font-medium truncate">{ev.summary}</div>
                        <div className="text-[10px] text-[#666666] mt-0.5">
                          {ev.start?.dateTime || ev.start?.date || "All Day"}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Gmail Unread Section */}
              <div className="space-y-2 pt-2 border-t border-[#141414]">
                <div className="text-[11px] uppercase tracking-wider text-[#666666] flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-[#cccccc]">
                    <Mail size={12} /> Unread Emails
                  </span>
                  <span className="text-[10px] text-[#10b981]">
                    {workspace.emails.length} new
                  </span>
                </div>
                {workspace.emails.length === 0 ? (
                  <div className="p-3 rounded border border-[#141414] bg-[#0a0a0a] text-[#666666] text-center text-[11px]">
                    Inbox bersih (tidak ada unread)
                  </div>
                ) : (
                  <div className="space-y-2">
                    {workspace.emails.map((m, i) => (
                      <div
                        key={i}
                        className="p-2.5 rounded border border-[#1a1a1a] bg-[#0a0a0a] space-y-1"
                      >
                        <div className="text-white font-medium truncate text-[11px]">
                          {m.subject || "(No Subject)"}
                        </div>
                        <div className="text-[10px] text-[#888888] truncate">
                          {m.from}
                        </div>
                        <div className="text-[10px] text-[#555555] line-clamp-2 leading-relaxed">
                          {m.snippet}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Logs Tab (Daily Activity & Semantic Vector RAG Search) */}
          {inspectorTab === "logs" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] text-[#666666]">
                  <span className="flex items-center gap-1.5 text-[#cccccc]">
                    <Database size={12} /> Neon PostgreSQL Activity Logs
                  </span>
                  <button
                    onClick={fetchDailyLogs}
                    disabled={logsLoading}
                    className="hover:text-white transition"
                    title="Refresh logs from Neon DB"
                  >
                    <RefreshCw size={11} className={logsLoading ? "animate-spin" : ""} />
                  </button>
                </div>

                <div className="relative">
                  <input
                    type="text"
                    value={semanticQuery}
                    onChange={(e) => setSemanticQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") performSemanticSearch();
                    }}
                    placeholder="Semantic search (e.g. 'kickoff meeting', 'revisi invoice')..."
                    className="w-full bg-[#0a0a0a] border border-[#1a1a1a] rounded px-3 py-2 text-xs text-white placeholder-[#555555] focus:outline-none focus:border-[#444444] pr-16"
                  />
                  <button
                    onClick={performSemanticSearch}
                    disabled={semanticSearching || !semanticQuery.trim()}
                    className="absolute right-1 top-1 bottom-1 px-2 bg-[#141414] hover:bg-[#222222] text-[#aaaaaa] hover:text-white rounded text-[10px] flex items-center gap-1 transition border border-[#222222] disabled:opacity-40"
                  >
                    <Sparkles size={10} className="text-emerald-400" />
                    {semanticSearching ? "..." : "Search"}
                  </button>
                </div>
                {semanticQuery && (
                  <div className="flex items-center justify-between text-[10px] text-[#666666] px-1">
                    <span>Hasil pencarian semantik (vektor kosinus Google pgvector)</span>
                    <button
                      onClick={() => {
                        setSemanticQuery("");
                        fetchDailyLogs();
                      }}
                      className="text-[#888888] hover:text-white underline"
                    >
                      Reset
                    </button>
                  </div>
                )}
              </div>

              {logsLoading || semanticSearching ? (
                <div className="text-center py-8 text-[#555555]">Memuat data dari Neon PostgreSQL...</div>
              ) : dailyLogs.length === 0 ? (
                <div className="p-4 border border-[#1a1a1a] rounded bg-[#0a0a0a] text-[#666666] text-center">
                  Belum ada riwayat aktivitas yang cocok.
                </div>
              ) : (
                <div className="space-y-3">
                  {dailyLogs.map((log: any) => (
                    <div
                      key={log.id}
                      className="border border-[#1a1a1a] rounded bg-[#080808] p-3 space-y-2 hover:border-[#333333] transition"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-white font-medium text-xs flex items-center gap-1.5">
                          📅 {log.log_date}
                        </span>
                        <div className="flex items-center gap-1.5">
                          {log.similarity !== undefined && (
                            <span className="px-1.5 py-0.5 rounded bg-emerald-950/60 border border-emerald-800/60 text-emerald-400 text-[10px]">
                              {(log.similarity * 100).toFixed(0)}% match
                            </span>
                          )}
                          <span className="px-1.5 py-0.5 rounded bg-[#141414] border border-[#222222] text-[#888888] text-[10px]">
                            {log.device}
                          </span>
                        </div>
                      </div>
                      <div className="text-[#aaaaaa] text-[11px] prose prose-invert max-w-none prose-sm leading-relaxed border-t border-[#141414] pt-2">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {log.summary_markdown}
                        </ReactMarkdown>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Radar Tab (Autonomous Tech Radar Digests) */}
          {inspectorTab === "radar" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-[11px] text-[#666666]">
                <span className="flex items-center gap-1.5 text-[#cccccc]">
                  <Radio size={12} className="text-emerald-400" /> Autonomous Tech Radar
                </span>
                <button
                  onClick={fetchRadarDigests}
                  disabled={radarLoading}
                  className="hover:text-white transition"
                  title="Refresh radar digests"
                >
                  <RefreshCw size={11} className={radarLoading ? "animate-spin" : ""} />
                </button>
              </div>

              {radarLoading ? (
                <div className="text-center py-8 text-[#555555]">Memuat update radar ekosistem...</div>
              ) : radarDigests.length === 0 ? (
                <div className="p-4 border border-[#1a1a1a] rounded bg-[#0a0a0a] text-[#666666] text-center">
                  Belum ada update radar terbaru.
                </div>
              ) : (
                <div className="space-y-3">
                  {radarDigests.map((r: any) => (
                    <div
                      key={r.file}
                      className="border border-[#1a1a1a] rounded bg-[#080808] p-3 space-y-2 hover:border-[#333333] transition"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-white font-medium text-xs font-mono">
                          📦 {r.repo}
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-emerald-950/50 border border-emerald-800/40 text-emerald-400 text-[10px]">
                          Monitored
                        </span>
                      </div>
                      <div className="text-[#aaaaaa] text-[11px] prose prose-invert max-w-none prose-sm leading-relaxed border-t border-[#141414] pt-2">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {r.content}
                        </ReactMarkdown>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {inspectorTab === "vercel" && (
            <div className="space-y-3">
              <div className="text-[11px] uppercase tracking-wider text-[#666666] flex items-center justify-between">
                <span>Production Deployments</span>
                <span className="text-[10px] text-[#10b981]">
                  {workspace.deployments.length} Active
                </span>
              </div>

              {workspace.deployments.length === 0 ? (
                <div className="p-3 rounded border border-[#141414] bg-[#0a0a0a] text-[#666666] text-center text-[11px]">
                  Memuat status Vercel...
                </div>
              ) : (
                <div className="space-y-2">
                  {workspace.deployments.map((d, i) => (
                    <div
                      key={i}
                      className="p-2.5 rounded border border-[#1a1a1a] bg-[#0a0a0a] space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-white font-medium">{d.name}</span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#064e3b] text-[#34d399] border border-[#059669]/30">
                          {d.state}
                        </span>
                      </div>
                      <a
                        href={`https://${d.url}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] text-[#888888] hover:text-white flex items-center gap-1 truncate"
                      >
                        <ExternalLink size={10} />
                        <span className="truncate">{d.url}</span>
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {inspectorTab === "stitch" && (
            <div className="space-y-4">
              <div className="text-[11px] uppercase tracking-wider text-[#666666]">
                Connected Stitch Projects
              </div>

              {workspace.stitch.map((proj, i) => (
                <div
                  key={i}
                  className="p-3 rounded border border-[#1a1a1a] bg-[#0a0a0a] space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-white font-medium text-[11px]">
                      {proj.name}
                    </span>
                    <span className="text-[9px] px-1 py-0.5 rounded bg-[#111111] text-[#888888] border border-[#222222]">
                      {proj.type}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="text-[10px] text-[#666666]">Screens ({proj.screens.length}):</div>
                    <ul className="space-y-1 pl-1">
                      {proj.screens.map((scr: string, sIdx: number) => (
                        <li
                          key={sIdx}
                          onClick={() => {
                            sendMessage(
                              `Tampilkan detail screen "${scr}" dari project "${proj.name}" di Stitch.`
                            );
                          }}
                          className="text-[11px] text-[#aaaaaa] hover:text-white cursor-pointer flex items-center gap-1.5 py-0.5 rounded hover:bg-[#141414] px-1"
                        >
                          <ChevronRight size={10} className="text-[#555555]" />
                          <span className="truncate">{scr}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Tab 4: Commands (Bot Slash Commands List) */}
          {inspectorTab === "commands" && (
            <div className="space-y-3">
              <div className="text-[11px] uppercase tracking-wider text-[#666666] flex items-center justify-between">
                <span>Bot Commands</span>
                <span className="text-[10px] text-[#10b981]">
                  {TELEGRAM_COMMANDS.length} Available
                </span>
              </div>

              {/* Filter search */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Filter command..."
                  value={commandFilterQuery}
                  onChange={(e) => setCommandFilterQuery(e.target.value)}
                  className="w-full bg-[#0a0a0a] border border-[#1f1f1f] rounded px-2.5 py-1.5 text-xs text-[#ededed] placeholder-[#555555] focus:outline-none focus:border-[#333333]"
                />
              </div>

              {/* Commands List */}
              <div className="space-y-1.5">
                {filteredInspectorCommands.map((cmd, i) => (
                  <div
                    key={i}
                    className="p-2 rounded border border-[#1a1a1a] bg-[#0a0a0a] hover:border-[#2a2a2a] transition flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-white font-medium text-xs">{cmd.command}</span>
                        <span className="text-[8px] px-1 py-0.2 rounded bg-[#111111] text-[#777777] border border-[#222222] uppercase">
                          {cmd.category}
                        </span>
                      </div>
                      <div className="text-[10px] text-[#777777] truncate mt-0.5">
                        {cmd.description}
                      </div>
                    </div>
                    <button
                      onClick={() => sendMessage(cmd.command)}
                      className="px-2 py-1 rounded bg-[#141414] hover:bg-white hover:text-black text-[#cccccc] text-[10px] font-medium transition shrink-0"
                    >
                      Run
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* 4. COMMAND PALETTE MODAL (CMD+K) */}
      {commandPaletteOpen && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-start justify-center pt-20 p-4"
          onClick={() => setCommandPaletteOpen(false)}
        >
          <div
            className="w-full max-w-lg bg-[#080808] border border-[#222222] rounded-lg shadow-2xl overflow-hidden font-mono"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 px-3 py-2.5 border-b border-[#1a1a1a]">
              <Search size={14} className="text-[#666666]" />
              <input
                type="text"
                autoFocus
                placeholder="Ketik command (/status, /diff, /new, /model...)..."
                value={commandQuery}
                onChange={(e) => setCommandQuery(e.target.value)}
                className="w-full bg-transparent text-xs text-[#ededed] placeholder-[#555555] focus:outline-none"
              />
              <kbd className="text-[10px] bg-[#141414] text-[#666666] px-1.5 py-0.5 rounded border border-[#222222]">
                ESC
              </kbd>
            </div>

            <div className="max-h-80 overflow-y-auto p-1.5 space-y-1">
              {filteredPaletteCommands.length === 0 ? (
                <div className="p-4 text-center text-xs text-[#666666]">
                  Tidak ada command yang cocok
                </div>
              ) : (
                filteredPaletteCommands.map((cmd, i) => (
                  <button
                    key={i}
                    onClick={cmd.action}
                    className="w-full text-left px-3 py-2 rounded text-xs hover:bg-[#141414] flex items-center justify-between text-[#cccccc] hover:text-white transition group"
                  >
                    <span className="truncate pr-2">{cmd.label}</span>
                    <span className="text-[10px] text-[#555555] group-hover:text-[#888888] uppercase shrink-0">
                      {cmd.category}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
