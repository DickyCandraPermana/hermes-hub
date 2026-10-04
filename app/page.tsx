"use client";

import React, { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
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
  Trash2,
} from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
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

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Panels state
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const [inspectorTab, setInspectorTab] = useState<"agenda" | "vercel" | "stitch">("agenda");

  // Attachments state
  const [attachments, setAttachments] = useState<AttachmentItem[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Command palette state
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [commandQuery, setCommandQuery] = useState("");

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

  useEffect(() => {
    fetchWorkspaceData();
  }, []);

  // Keyboard shortcut for Cmd+K and Esc
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      } else if (e.key === "Escape") {
        setCommandPaletteOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

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

  // Handle message sending with SSE streaming
  const sendMessage = async (overrideText?: string) => {
    const textToSend = overrideText || input;
    if ((!textToSend.trim() && attachments.length === 0) || loading) return;

    const time = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

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
      let accumulatedContent = "";

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");
          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const dataStr = line.replace("data: ", "").trim();
              if (dataStr === "[DONE]") break;
              try {
                const parsed = JSON.parse(dataStr);
                const delta = parsed.choices?.[0]?.delta?.content || "";
                accumulatedContent += delta;
                setMessages((prev) => {
                  const updated = [...prev];
                  const last = updated[updated.length - 1];
                  if (last && last.role === "assistant") {
                    last.content = accumulatedContent;
                  }
                  return updated;
                });
              } catch {
                // Ignore parse errors from chunk boundaries
              }
            }
          }
        }
      }
    } catch (err: any) {
      setMessages((prev) => {
        const updated = [...prev];
        const last = updated[updated.length - 1];
        if (last && last.role === "assistant") {
          last.content = `[Gagal terhubung ke Hermes: ${err.message}]`;
        }
        return updated;
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Commands for palette
  const commands = [
    {
      label: "Briefing Pagi (Kalender & Gmail)",
      category: "Action",
      action: () => {
        setCommandPaletteOpen(false);
        sendMessage("Cek jadwal Google Calendar hari ini dan email unread terbaru di Gmail.");
      },
    },
    {
      label: "Cek Status Deployment Vercel",
      category: "Action",
      action: () => {
        setCommandPaletteOpen(false);
        sendMessage("Cek status semua deployment project Vercel saya saat ini.");
      },
    },
    {
      label: "Tampilkan Screen Nutritrack (Google Stitch)",
      category: "Design",
      action: () => {
        setCommandPaletteOpen(false);
        sendMessage("Jelaskan 5 screen di project Nutritrack Design System di Stitch dan token warnanya.");
      },
    },
    {
      label: "Buka Inspector Deck: Agenda",
      category: "View",
      action: () => {
        setCommandPaletteOpen(false);
        setInspectorOpen(true);
        setInspectorTab("agenda");
      },
    },
    {
      label: "Buka Inspector Deck: Vercel",
      category: "View",
      action: () => {
        setCommandPaletteOpen(false);
        setInspectorOpen(true);
        setInspectorTab("vercel");
      },
    },
    {
      label: "Buka Inspector Deck: Stitch Screens",
      category: "View",
      action: () => {
        setCommandPaletteOpen(false);
        setInspectorOpen(true);
        setInspectorTab("stitch");
      },
    },
    {
      label: "Clear Chat / New Thread",
      category: "Session",
      action: () => {
        setCommandPaletteOpen(false);
        setMessages([]);
      },
    },
  ];

  const filteredCommands = commands.filter((c) =>
    c.label.toLowerCase().includes(commandQuery.toLowerCase())
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

      {/* 1. LEFT SIDEBAR (Desktop relative, Mobile fixed drawer) */}
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
                ▲ HERMES
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
          </div>

          {/* Connected Services Stack (Restrained Monochrome) */}
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
        {/* Top Hairline Header - Fully responsive for mobile */}
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
              <span className="text-[#ededed] font-medium hidden sm:inline">hermes-gateway</span>
              <span className="text-[#ededed] font-medium sm:hidden">hermes</span>
              <span className="text-[#555555] text-[10px] sm:text-xs">:8642</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Quick Command Trigger - Compact on mobile */}
            <button
              onClick={() => setCommandPaletteOpen(true)}
              className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-2.5 py-1 rounded text-xs font-mono bg-[#0c0c0c] hover:bg-[#141414] border border-[#1f1f1f] text-[#888888] hover:text-[#ededed] transition"
            >
              <Command size={12} />
              <span className="hidden sm:inline">Search</span>
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
            /* Clean Empty State: True Operate Surface */
            <div className="max-w-2xl mx-auto mt-8 sm:mt-16 text-center space-y-5 sm:space-y-6">
              <div className="space-y-1.5 sm:space-y-2">
                <div className="text-[11px] font-mono tracking-widest text-[#666666] uppercase">
                  Terminal Mode
                </div>
                <h1 className="text-xl sm:text-2xl font-medium tracking-tight text-white">
                  Hermes Autonomous Workspace
                </h1>
                <p className="text-xs sm:text-sm text-[#888888] max-w-md mx-auto leading-relaxed px-2">
                  Interaksi langsung dengan runtime server, Google Cloud Workspace, Vercel deployments, dan Stitch MCP.
                </p>
              </div>

              {/* Minimalist prompt suggestions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left pt-2 max-w-lg mx-auto">
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

                <button
                  onClick={() =>
                    sendMessage(
                      "Tampilkan 5 screen di project Nutritrack Design System di Stitch dan ringkas layoutnya."
                    )
                  }
                  className="p-3 rounded border border-[#1a1a1a] hover:border-[#333333] bg-[#080808] hover:bg-[#0f0f0f] transition group"
                >
                  <div className="text-xs font-mono text-[#cccccc] group-hover:text-white flex items-center justify-between">
                    <span>Google Stitch</span>
                    <span className="text-[#555555] font-mono text-[10px]">03</span>
                  </div>
                  <div className="text-[11px] text-[#666666] mt-1">
                    Inspect Nutritrack screens & tokens
                  </div>
                </button>

                <button
                  onClick={() =>
                    sendMessage(
                      "Jelaskan arsitektur kode client ini dan bagaimana ia melakukan SSE stream ke port 8642."
                    )
                  }
                  className="p-3 rounded border border-[#1a1a1a] hover:border-[#333333] bg-[#080808] hover:bg-[#0f0f0f] transition group"
                >
                  <div className="text-xs font-mono text-[#cccccc] group-hover:text-white flex items-center justify-between">
                    <span>System Runtime</span>
                    <span className="text-[#555555] font-mono text-[10px]">04</span>
                  </div>
                  <div className="text-[11px] text-[#666666] mt-1">
                    Inspect local API SSE gateway
                  </div>
                </button>
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
                          <span>▲</span> HERMES
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

                    <div className="markdown-body">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {msg.content || (loading && idx === messages.length - 1 ? "..." : "")}
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

        {/* Bottom Dock Input Bar with Attachment Preview */}
        <div className="p-2.5 sm:p-4 border-t border-[#1a1a1a] bg-black shrink-0">
          <div className="max-w-3xl mx-auto">
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
                    sendMessage();
                  }
                }}
                placeholder="Tulis pesan atau instruksi untuk Hermes..."
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

        {/* Tab Switcher */}
        <div className="grid grid-cols-3 border-b border-[#1a1a1a] text-xs font-mono bg-[#080808]">
          <button
            onClick={() => setInspectorTab("agenda")}
            className={`py-2 text-center transition border-b-2 ${
              inspectorTab === "agenda"
                ? "border-white text-white bg-[#0e0e0e]"
                : "border-transparent text-[#666666] hover:text-[#cccccc]"
            }`}
          >
            Agenda
          </button>
          <button
            onClick={() => setInspectorTab("vercel")}
            className={`py-2 text-center transition border-b-2 ${
              inspectorTab === "vercel"
                ? "border-white text-white bg-[#0e0e0e]"
                : "border-transparent text-[#666666] hover:text-[#cccccc]"
            }`}
          >
            Vercel
          </button>
          <button
            onClick={() => setInspectorTab("stitch")}
            className={`py-2 text-center transition border-b-2 ${
              inspectorTab === "stitch"
                ? "border-white text-white bg-[#0e0e0e]"
                : "border-transparent text-[#666666] hover:text-[#cccccc]"
            }`}
          >
            Stitch
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
                placeholder="Ketik perintah atau navigasi..."
                value={commandQuery}
                onChange={(e) => setCommandQuery(e.target.value)}
                className="w-full bg-transparent text-xs text-[#ededed] placeholder-[#555555] focus:outline-none"
              />
              <kbd className="text-[10px] bg-[#141414] text-[#666666] px-1.5 py-0.5 rounded border border-[#222222]">
                ESC
              </kbd>
            </div>

            <div className="max-h-72 overflow-y-auto p-1.5 space-y-1">
              {filteredCommands.length === 0 ? (
                <div className="p-4 text-center text-xs text-[#666666]">
                  Tidak ada perintah yang cocok
                </div>
              ) : (
                filteredCommands.map((cmd, i) => (
                  <button
                    key={i}
                    onClick={cmd.action}
                    className="w-full text-left px-3 py-2 rounded text-xs hover:bg-[#141414] flex items-center justify-between text-[#cccccc] hover:text-white transition group"
                  >
                    <span>{cmd.label}</span>
                    <span className="text-[10px] text-[#555555] group-hover:text-[#888888] uppercase">
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
