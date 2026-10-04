"use client";

import React, { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Send,
  Sparkles,
  Bot,
  User,
  Calendar,
  Mail,
  GitBranch,
  Cloud,
  Palette,
  Terminal,
  RefreshCw,
  Copy,
  Check,
  ChevronRight,
  Menu,
  X,
  Zap,
} from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

interface CalendarEvent {
  summary?: string;
  start?: { dateTime?: string; date?: string };
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [calendarLoading, setCalendarLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  useEffect(() => {
    fetchCalendar();
  }, []);

  const fetchCalendar = async () => {
    setCalendarLoading(true);
    try {
      const res = await fetch("/api/calendar");
      const data = await res.json();
      setCalendarEvents(data.events || []);
    } catch {
      // ignore
    } finally {
      setCalendarLoading(false);
    }
  };

  const handleSend = async (overridePrompt?: string) => {
    const textToSend = overridePrompt || input;
    if (!textToSend.trim() || loading) return;

    const userMsg: Message = {
      role: "user",
      content: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    if (!overridePrompt) setInput("");
    setLoading(true);

    const assistantMsg: Message = {
      role: "assistant",
      content: "",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages([...newMessages, assistantMsg]);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      if (!response.body) throw new Error("No body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const dataStr = line.slice(6).trim();
            if (dataStr === "[DONE]") continue;

            try {
              const parsed = JSON.parse(dataStr);
              const delta = parsed.choices?.[0]?.delta?.content;
              if (delta) {
                accumulated += delta;
                setMessages((prev) => {
                  const updated = [...prev];
                  updated[updated.length - 1] = {
                    ...updated[updated.length - 1],
                    content: accumulated,
                  };
                  return updated;
                });
              }
            } catch {
              // ignore partial json
            }
          }
        }
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Gagal menghubungi agen.";
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          ...updated[updated.length - 1],
          content: `⚠️ Terjadi kesalahan: ${message}`,
        };
        return updated;
      });
    } finally {
      setLoading(false);
      setTimeout(() => textareaRef.current?.focus(), 50);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="flex h-screen bg-[#070b12] text-slate-100 overflow-hidden font-sans">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? "w-80" : "w-0 -translate-x-full"
        } transition-all duration-300 ease-in-out bg-[#0c1220] border-r border-slate-800/80 flex flex-col z-30 shrink-0 md:relative absolute h-full`}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Bot className="w-4 h-4 text-slate-950 font-bold" />
            </div>
            <div>
              <h1 className="font-semibold text-sm tracking-wide text-white">Hermes Hub</h1>
              <p className="text-[10px] text-emerald-400 font-mono">● LIVE RUNTIME</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden p-1.5 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sidebar Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Quick Actions */}
          <div>
            <h2 className="text-[11px] font-semibold text-slate-400 tracking-wider uppercase mb-2.5">
              Quick Shortcuts
            </h2>
            <div className="space-y-1.5">
              {[
                {
                  label: "Briefing Jadwal & Email Hari Ini",
                  icon: Calendar,
                  prompt: "Berikan ringkasan briefing jadwal hari ini dari Google Calendar dan email masuk terbaru.",
                },
                {
                  label: "Cek Status Deployment Vercel",
                  icon: Cloud,
                  prompt: "Cek status deployment project saya di Vercel saat ini.",
                },
                {
                  label: "Cek Repositori GitHub",
                  icon: GitBranch,
                  prompt: "Tampilkan update terbaru dari repo github saya.",
                },
                {
                  label: "Review Design System (Stitch)",
                  icon: Palette,
                  prompt: "Tampilkan screen dan tokens dari project Nutritrack Design System di Google Stitch.",
                },
              ].map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(item.prompt)}
                  className="w-full text-left p-2.5 rounded-lg bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 text-xs text-slate-300 hover:text-emerald-300 transition flex items-center gap-2.5 group"
                >
                  <item.icon className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-400 shrink-0" />
                  <span className="truncate flex-1">{item.label}</span>
                  <ChevronRight className="w-3 h-3 text-slate-600 group-hover:text-emerald-400 shrink-0" />
                </button>
              ))}
            </div>
          </div>

          {/* Connected Services */}
          <div>
            <h2 className="text-[11px] font-semibold text-slate-400 tracking-wider uppercase mb-2.5">
              Connected Infrastructure
            </h2>
            <div className="space-y-2">
              {[
                { name: "Google Calendar & Mail", status: "Connected", icon: Mail },
                { name: "GitHub CLI (`gh`)", status: "Active", icon: GitBranch },
                { name: "Vercel Deployments", status: "Connected", icon: Cloud },
                { name: "Google Stitch MCP", status: "Connected", icon: Palette },
                { name: "Neon Postgres / Supabase", status: "Available", icon: Terminal },
              ].map((svc, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2 rounded-lg bg-slate-900/40 border border-slate-800/60 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <svc.icon className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-slate-300">{svc.name}</span>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    {svc.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Google Calendar Snippet */}
          <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                Agenda Google
              </span>
              <button
                onClick={fetchCalendar}
                className="p-1 hover:text-white text-slate-400 transition"
              >
                <RefreshCw className={`w-3 h-3 ${calendarLoading ? "animate-spin" : ""}`} />
              </button>
            </div>
            {calendarEvents.length === 0 ? (
              <p className="text-[11px] text-slate-400 italic">Tidak ada agenda dalam 7 hari ke depan.</p>
            ) : (
              <div className="space-y-1.5">
                {calendarEvents.slice(0, 3).map((ev, idx) => (
                  <div key={idx} className="text-[11px] p-1.5 bg-slate-800/50 rounded border border-slate-700/50">
                    <p className="font-medium text-slate-200">{ev.summary}</p>
                    <p className="text-[10px] text-slate-400">{ev.start?.dateTime || ev.start?.date}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-slate-800 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-emerald-400">
            DP
          </div>
          <div className="flex-1 truncate">
            <p className="text-xs font-medium text-slate-200 truncate">Dicky Candra Permana</p>
            <p className="text-[10px] text-slate-400 truncate">candrapermanadicky@gmail.com</p>
          </div>
        </div>
      </aside>

      {/* Main Chat Interface */}
      <main className="flex-1 flex flex-col h-full bg-[#070b12] relative overflow-hidden">
        {/* Top Navigation */}
        <header className="h-14 border-b border-slate-800/80 bg-[#090e18]/80 backdrop-blur-md px-4 flex items-center justify-between shrink-0 z-20">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm text-slate-100">Hermes Autonomous Agent</span>
                <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Ready
                </span>
              </div>
              <p className="text-[10px] text-slate-400">Model: hermes-combo • Protocol: OpenAI Stream</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setMessages([])}
              className="px-2.5 py-1 text-xs text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition"
            >
              Reset Chat
            </button>
          </div>
        </header>

        {/* Messages Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
          {messages.length === 0 ? (
            <div className="max-w-xl mx-auto my-auto text-center py-16 space-y-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600/20 to-teal-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto shadow-2xl shadow-emerald-950">
                <Zap className="w-8 h-8 text-emerald-400" />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-bold text-white tracking-tight">Halo, Dicky!</h2>
                <p className="text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
                  Ini adalah personal cockpit Hermes Anda. Terhubung langsung ke mesin server, GitHub,
                  Vercel, Google Calendar, dan Stitch.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left pt-4">
                {[
                  {
                    title: "📅 Daily Briefing",
                    desc: "Cek jadwal Google Calendar & email masuk terbaru.",
                    prompt: "Tolong berikan briefing agenda jadwal dan email hari ini.",
                  },
                  {
                    title: "🚀 Status Vercel",
                    desc: "Periksa status build & deployment semua project.",
                    prompt: "Bagaimana status deployment project saya di Vercel saat ini?",
                  },
                  {
                    title: "🎨 Google Stitch Design",
                    desc: "Akses design tokens & screen Nutritrack.",
                    prompt: "Tampilkan screen dan tokens dari project Nutritrack Design System di Stitch.",
                  },
                  {
                    title: "💻 Git & Terminal",
                    desc: "Periksa repositori atau jalankan perintah di server.",
                    prompt: "Bantu saya inspect status git dan repo aktif saat ini.",
                  },
                ].map((card, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(card.prompt)}
                    className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-emerald-500/40 hover:bg-slate-800/60 transition group text-left"
                  >
                    <p className="font-semibold text-xs text-slate-200 group-hover:text-emerald-300">
                      {card.title}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{card.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg, index) => (
              <div
                key={index}
                className={`flex gap-3 max-w-3xl ${
                  msg.role === "user" ? "ml-auto justify-end" : "mr-auto justify-start"
                }`}
              >
                {msg.role === "assistant" && (
                  <div className="w-7 h-7 rounded-lg bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center shrink-0 mt-0.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                )}

                <div
                  className={`relative group rounded-2xl px-4 py-3 text-sm max-w-[85%] sm:max-w-xl ${
                    msg.role === "user"
                      ? "bg-emerald-600 text-white rounded-br-none shadow-md shadow-emerald-950/20"
                      : "bg-[#0f172a] border border-slate-800/90 text-slate-200 rounded-bl-none shadow-sm"
                  }`}
                >
                  {msg.role === "assistant" ? (
                    <div className="markdown-body">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {msg.content || "..."}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  )}

                  <div className="flex items-center justify-between gap-4 mt-1.5 pt-1 border-t border-slate-700/30 text-[10px] text-slate-400">
                    <span>{msg.timestamp}</span>
                    {msg.role === "assistant" && msg.content && (
                      <button
                        onClick={() => copyToClipboard(msg.content, index)}
                        className="hover:text-white flex items-center gap-1 opacity-0 group-hover:opacity-100 transition"
                      >
                        {copiedIndex === index ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" /> Copied
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" /> Copy
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {msg.role === "user" && (
                  <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 mt-0.5">
                    <User className="w-3.5 h-3.5 text-slate-300" />
                  </div>
                )}
              </div>
            ))
          )}

          {loading && messages[messages.length - 1]?.role !== "assistant" && (
            <div className="flex gap-3 max-w-3xl mr-auto items-center text-xs text-slate-400">
              <div className="w-7 h-7 rounded-lg bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center shrink-0 animate-pulse">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <span className="italic">Hermes sedang memproses respon...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-slate-800/80 bg-[#090e18]/80 backdrop-blur-md shrink-0">
          <div className="max-w-3xl mx-auto">
            <div className="relative rounded-2xl bg-[#0e1626] border border-slate-700/70 focus-within:border-emerald-500/60 focus-within:ring-1 focus-within:ring-emerald-500/30 transition shadow-lg">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ketik instruksi, tanya agenda, cek deployment, atau minta buatkan kode..."
                rows={1}
                className="w-full bg-transparent px-4 py-3.5 text-sm text-slate-100 placeholder-slate-400 focus:outline-none resize-none max-h-36 overflow-y-auto"
                style={{ minHeight: "48px" }}
              />
              <div className="flex items-center justify-between px-3 pb-2 pt-1 border-t border-slate-800/50">
                <span className="text-[10px] text-slate-500">
                  <kbd className="px-1 py-0.5 bg-slate-800 rounded text-slate-400 font-mono">Enter</kbd> kirim • <kbd className="px-1 py-0.5 bg-slate-800 rounded text-slate-400 font-mono">Shift+Enter</kbd> baris baru
                </span>
                <button
                  onClick={() => handleSend()}
                  disabled={!input.trim() || loading}
                  className={`p-2 rounded-xl transition ${
                    input.trim() && !loading
                      ? "bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold shadow-md shadow-emerald-500/20"
                      : "bg-slate-800 text-slate-500 cursor-not-allowed"
                  }`}
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
