"use client";

import { useState, useEffect } from "react";
import {
  MessageSquare,
  CheckCircle,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  Wrench,
  Phone,
  Clock,
  Timer,
  Search,
  Filter,
  Bot,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { apiClient } from "@/lib/api-client";

// ─── Types ───────────────────────────────────────────────────────────────────

type ConversationStatus = "active" | "completed" | "abandoned";
type Intent = "booking" | "cancellation" | "inquiry" | "event";

interface ToolCall {
  name: string;
  result: string;
  timestamp: string;
}

interface Message {
  id: string;
  sender: "customer" | "ai";
  text: string;
  timestamp: string;
  toolCall?: ToolCall;
  tool_call?: ToolCall;
}

interface Conversation {
  id: string;
  customer_id: string;
  customer_name: string;
  customer_phone: string;
  channel: string;
  intent: Intent;
  status: ConversationStatus;
  started_at: string;
  ended_at: string | null;
  resolved: boolean;
  messages: Message[];
}

interface AIStats {
  total: number;
  resolved: number;
  abandoned: number;
  success_rate: number;
  avg_messages: number;
  intent_distribution: { intent: string; count: number }[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const intentConfig: Record<string, { label: string; color: string; bg: string; border: string }> = {
  booking:      { label: "Booking",      color: "text-emerald-400", bg: "bg-emerald-500/15", border: "border-emerald-500/30" },
  cancellation: { label: "Cancellation", color: "text-red-400",     bg: "bg-red-500/15",     border: "border-red-500/30" },
  inquiry:      { label: "Inquiry",      color: "text-blue-400",    bg: "bg-blue-500/15",    border: "border-blue-500/30" },
  event:        { label: "Event",        color: "text-purple-400",  bg: "bg-purple-500/15",  border: "border-purple-500/30" },
};

const statusConfig: Record<ConversationStatus, { label: string; color: string; bg: string; border: string; pulse: boolean }> = {
  active:    { label: "Active",    color: "text-emerald-400", bg: "bg-emerald-500/15", border: "border-emerald-500/30", pulse: true },
  completed: { label: "Completed", color: "text-blue-400",    bg: "bg-blue-500/15",    border: "border-blue-500/30",    pulse: false },
  abandoned: { label: "Abandoned", color: "text-red-400",     bg: "bg-red-500/15",     border: "border-red-500/30",     pulse: false },
};

function getConversationDuration(startedAt: string, endedAt: string | null): string {
  const start = new Date(startedAt).getTime();
  const end = endedAt ? new Date(endedAt).getTime() : Date.now();
  const diffMs = end - start;
  const mins = Math.floor(diffMs / 60000);
  const secs = Math.floor((diffMs % 60000) / 1000);
  return `${mins}m ${secs.toString().padStart(2, "0")}s`;
}

function getTimeFromTimestamp(ts: string): string {
  try {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return ts;
  }
}

function getToolsUsed(messages: Message[]): string[] {
  const tools = new Set<string>();
  messages.forEach((m) => {
    const tc = m.toolCall || m.tool_call;
    if (tc?.name) tools.add(tc.name);
  });
  return Array.from(tools);
}

function getLastTextMessage(messages: Message[]): string {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].text) return messages[i].text;
  }
  return "";
}

// ─── Stat Card Component ─────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon: Icon,
  iconColor,
  pulse,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
  iconColor: string;
  pulse?: boolean;
}) {
  return (
    <div className="rounded-xl border border-[#222] bg-[#1a1a1a] p-6 flex items-center gap-4">
      <div className={cn("flex h-12 w-12 items-center justify-center rounded-lg", iconColor === "emerald" ? "bg-emerald-500/15" : iconColor === "blue" ? "bg-blue-500/15" : "bg-[#222]")}>
        <Icon className={cn("h-6 w-6", iconColor === "emerald" ? "text-emerald-400" : iconColor === "blue" ? "text-blue-400" : "text-white")} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-[#a1a1aa]">{label}</p>
        <div className="flex items-center gap-2">
          <p className="text-2xl font-bold text-white">{value}</p>
          {pulse && (
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Conversation Card Component ─────────────────────────────────────────────

function ConversationCard({ conversation }: { conversation: Conversation }) {
  const [expanded, setExpanded] = useState(false);
  const intent = intentConfig[conversation.intent] || intentConfig.inquiry;
  const status = statusConfig[conversation.status] || statusConfig.completed;
  const messages = conversation.messages || [];
  const toolsUsed = getToolsUsed(messages);
  const lastMessage = getLastTextMessage(messages);
  const duration = getConversationDuration(conversation.started_at, conversation.ended_at);
  const startTime = getTimeFromTimestamp(conversation.started_at);

  return (
    <div
      className={cn(
        "rounded-xl border bg-[#1a1a1a] transition-all duration-200",
        expanded ? "border-[#333]" : "border-[#222] hover:border-[#333]"
      )}
    >
      {/* Card Header — Clickable */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-5 text-left"
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:gap-6">
          {/* Left: Customer Info */}
          <div className="flex items-center gap-3 lg:w-[220px] shrink-0">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/15">
              <User className="h-5 w-5 text-emerald-400" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white truncate" dir="rtl">
                {conversation.customer_name}
              </p>
              <div className="flex items-center gap-1.5 text-xs text-[#52525b]">
                <Phone className="h-3 w-3" />
                <span>{conversation.customer_phone}</span>
              </div>
            </div>
            {/* WhatsApp Badge */}
            <span className="ml-auto lg:ml-2 flex items-center gap-1 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
              <MessageSquare className="h-3 w-3" />
              {conversation.channel || "WhatsApp"}
            </span>
          </div>

          {/* Center: Intent, Preview, Count */}
          <div className="flex-1 min-w-0 space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={cn("inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium", intent.color, intent.bg, intent.border)}>
                {intent.label}
              </span>
              <span className="text-xs text-[#52525b] flex items-center gap-1">
                <MessageSquare className="h-3 w-3" />
                {messages.length} messages
              </span>
            </div>
            <p className="text-sm text-[#a1a1aa] truncate" dir="rtl">
              {lastMessage}
            </p>
          </div>

          {/* Right: Status, Time, Duration, Expand */}
          <div className="flex items-center gap-4 lg:w-[260px] shrink-0 justify-between lg:justify-end">
            <div className="flex flex-col items-end gap-1">
              <span className={cn("inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[11px] font-medium", status.color, status.bg, status.border)}>
                {status.pulse && (
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  </span>
                )}
                {status.label}
              </span>
              <div className="flex items-center gap-3 text-[11px] text-[#52525b]">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {startTime}
                </span>
                <span className="flex items-center gap-1">
                  <Timer className="h-3 w-3" />
                  {duration}
                </span>
              </div>
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#222] bg-[#111] text-[#52525b]">
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </div>
          </div>
        </div>

        {/* Tool Badges */}
        {toolsUsed.length > 0 && (
          <div className="mt-3 flex items-center gap-2 flex-wrap">
            <Wrench className="h-3 w-3 text-[#52525b]" />
            {toolsUsed.map((tool) => (
              <span
                key={tool}
                className="rounded-md bg-[#111] border border-[#222] px-2 py-0.5 text-[10px] font-mono text-[#52525b]"
              >
                {tool}
              </span>
            ))}
          </div>
        )}
      </button>

      {/* Expanded: Chat Thread */}
      {expanded && (
        <div className="border-t border-[#222] p-5">
          {/* Collapse button */}
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#52525b]">
              Conversation Thread
            </h4>
            <button
              onClick={() => setExpanded(false)}
              className="flex items-center gap-1.5 rounded-lg border border-[#222] bg-[#111] px-3 py-1.5 text-xs text-[#a1a1aa] transition-all duration-200 hover:border-[#333] hover:text-white"
            >
              <ChevronUp className="h-3 w-3" />
              Collapse
            </button>
          </div>

          {/* Messages */}
          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
            {messages.map((msg, idx) => {
              const tc = msg.toolCall || msg.tool_call;
              // Tool call message
              if (tc) {
                return (
                  <div key={msg.id || idx} className="flex justify-center">
                    <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 max-w-md w-full">
                      <div className="flex items-center gap-2 mb-1">
                        <Wrench className="h-3.5 w-3.5 text-amber-400" />
                        <span className="text-xs font-mono font-semibold text-amber-400">
                          {tc.name}
                        </span>
                      </div>
                      <p className="text-[11px] font-mono text-amber-300/70">
                        {tc.result}
                      </p>
                      <p className="text-[10px] text-[#52525b] mt-1">{tc.timestamp}</p>
                    </div>
                  </div>
                );
              }

              // Customer message
              if (msg.sender === "customer") {
                return (
                  <div key={msg.id || idx} className="flex justify-end">
                    <div className="max-w-[75%]">
                      <div className="rounded-xl rounded-tr-sm border border-emerald-500/30 bg-emerald-500/20 px-4 py-3">
                        <p className="text-sm text-white" dir="rtl">{msg.text}</p>
                      </div>
                      <p className="text-[10px] text-[#52525b] mt-1 text-right">{msg.timestamp}</p>
                    </div>
                  </div>
                );
              }

              // AI message
              return (
                <div key={msg.id || idx} className="flex justify-start">
                  <div className="max-w-[75%]">
                    <div className="flex items-start gap-2">
                      <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#222]">
                        <Bot className="h-3.5 w-3.5 text-[#a1a1aa]" />
                      </div>
                      <div>
                        <div className="rounded-xl rounded-tl-sm border border-[#2a2a2a] bg-[#1a1a1a] px-4 py-3">
                          <p className="text-sm text-[#a1a1aa]" dir="rtl">{msg.text}</p>
                        </div>
                        <p className="text-[10px] text-[#52525b] mt-1">{msg.timestamp}</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Waiting indicator for active conversations */}
            {conversation.status === "active" && (
              <div className="flex justify-end">
                <div className="rounded-xl border border-[#222] bg-[#111] px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#52525b] animate-bounce [animation-delay:0ms]" />
                    <span className="h-1.5 w-1.5 rounded-full bg-[#52525b] animate-bounce [animation-delay:150ms]" />
                    <span className="h-1.5 w-1.5 rounded-full bg-[#52525b] animate-bounce [animation-delay:300ms]" />
                  </div>
                  <p className="text-[10px] text-[#52525b] mt-1">Waiting for customer reply...</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function AIMonitorPage() {
  const [statusFilter, setStatusFilter] = useState<"all" | ConversationStatus>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [totalConversations, setTotalConversations] = useState(0);
  const [aiStats, setAIStats] = useState<AIStats | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch conversations and AI stats
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [convRes, aiRes] = await Promise.all([
          apiClient.get<{ data: Conversation[]; pagination: { total: number } }>(
            "/conversations?page=1&limit=50"
          ),
          apiClient.get<{ data: AIStats }>("/analytics/ai"),
        ]);
        setConversations(convRes.data || []);
        setTotalConversations(convRes.pagination?.total || convRes.data?.length || 0);
        setAIStats(aiRes.data);
      } catch (err) {
        console.error("Failed to fetch AI monitor data:", err);
        setConversations([]);
        setAIStats(null);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // Client-side filtering
  const filtered = conversations.filter((c) => {
    if (statusFilter !== "all" && c.status !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const lastMsg = getLastTextMessage(c.messages || []);
      return (
        (c.customer_name || "").toLowerCase().includes(q) ||
        (c.customer_name || "").includes(searchQuery) ||
        (c.customer_phone || "").includes(q) ||
        (c.intent || "").includes(q) ||
        lastMsg.includes(searchQuery) ||
        lastMsg.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const activeCount = conversations.filter((c) => c.status === "active").length;

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-[#222] rounded" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-xl border border-[#222] bg-[#1a1a1a] p-6 h-24" />
          ))}
        </div>
        <div className="rounded-xl border border-[#222] bg-[#1a1a1a] p-4 h-16" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-xl border border-[#222] bg-[#1a1a1a] p-5 h-28" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-white">AI Monitor</h1>
          {activeCount > 0 && (
            <span className="flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              Active
            </span>
          )}
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Conversations"
          value={aiStats ? `${aiStats.total}` : `${totalConversations}`}
          icon={MessageSquare}
          iconColor="default"
        />
        <StatCard
          label="Resolved"
          value={aiStats ? `${aiStats.resolved}` : "0"}
          icon={CheckCircle}
          iconColor="blue"
        />
        <StatCard
          label="Active Now"
          value={`${activeCount}`}
          icon={MessageSquare}
          iconColor="emerald"
          pulse={activeCount > 0}
        />
        <StatCard
          label="Success Rate"
          value={aiStats ? `${aiStats.success_rate}%` : "0%"}
          icon={TrendingUp}
          iconColor="emerald"
        />
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center rounded-xl border border-[#222] bg-[#1a1a1a] p-4">
        <div className="flex items-center gap-2 text-[#52525b]">
          <Filter className="h-4 w-4" />
          <span className="text-xs font-medium uppercase tracking-wider">Filters</span>
        </div>

        {/* Status Dropdown */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as "all" | ConversationStatus)}
          className="rounded-lg border border-[#222] bg-[#111] px-3 py-2 text-sm text-white outline-none transition-all duration-200 focus:border-emerald-500/50 hover:border-[#333]"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
          <option value="abandoned">Abandoned</option>
        </select>

        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#52525b]" />
          <input
            type="text"
            placeholder="Search by name, phone, or message..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-[#222] bg-[#111] pl-9 pr-3 py-2 text-sm text-white placeholder:text-[#52525b] outline-none transition-all duration-200 focus:border-emerald-500/50 hover:border-[#333]"
          />
        </div>

        {/* Date Range */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="From date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-28 rounded-lg border border-[#222] bg-[#111] px-3 py-2 text-sm text-white placeholder:text-[#52525b] outline-none transition-all duration-200 focus:border-emerald-500/50 hover:border-[#333]"
          />
          <span className="text-[#52525b] text-xs">to</span>
          <input
            type="text"
            placeholder="To date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-28 rounded-lg border border-[#222] bg-[#111] px-3 py-2 text-sm text-white placeholder:text-[#52525b] outline-none transition-all duration-200 focus:border-emerald-500/50 hover:border-[#333]"
          />
        </div>
      </div>

      {/* Conversation List */}
      <div className="space-y-4">
        {conversations.length === 0 ? (
          <div className="rounded-xl border border-[#222] bg-[#1a1a1a] p-12 text-center">
            <Bot className="mx-auto h-12 w-12 text-[#52525b] mb-4" />
            <p className="text-sm text-[#a1a1aa] font-medium mb-2">No conversations yet</p>
            <p className="text-xs text-[#52525b] max-w-md mx-auto">
              Conversations will appear here once the WhatsApp bot starts receiving messages.
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-xl border border-[#222] bg-[#1a1a1a] p-12 text-center">
            <MessageSquare className="mx-auto h-10 w-10 text-[#52525b] mb-3" />
            <p className="text-sm text-[#52525b]">No conversations match your filters.</p>
          </div>
        ) : (
          filtered.map((conv) => <ConversationCard key={conv.id} conversation={conv} />)
        )}
      </div>

      {/* Footer Summary */}
      <div className="flex items-center justify-between rounded-xl border border-[#222] bg-[#1a1a1a] px-5 py-3">
        <p className="text-xs text-[#52525b]">
          Showing {filtered.length} of {totalConversations} conversations
        </p>
        <p className="text-xs text-[#52525b]">
          Last updated: {new Date().toLocaleTimeString()}
        </p>
      </div>
    </div>
  );
}
