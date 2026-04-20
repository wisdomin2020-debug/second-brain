"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lightbulb, CheckSquare, FolderKanban, RefreshCw, Inbox, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";

type MemoryType = "idea" | "task" | "project";

interface Memory {
  id: string;
  text: string;
  type: MemoryType;
  created_at: string;
  summary?: string;
  details?: string;
  status?: string;
}

const TYPE_META: Record<MemoryType, { label: string; color: string; bg: string; Icon: React.ElementType }> = {
  idea: {
    label: "Idea",
    color: "text-indigo-400",
    bg: "bg-indigo-500/10 border-indigo-500/20",
    Icon: Lightbulb,
  },
  task: {
    label: "Task",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10 border-emerald-500/20",
    Icon: CheckSquare,
  },
  project: {
    label: "Project",
    color: "text-fuchsia-400",
    bg: "bg-fuchsia-500/10 border-fuchsia-500/20",
    Icon: FolderKanban,
  },
  document: {
    label: "Draft",
    color: "text-sky-400",
    bg: "bg-sky-500/10 border-sky-500/20",
    Icon: ExternalLink,
  },
};

function timeAgo(dateStr: string) {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export function MemoryFeed({
  initialMemories,
  userId,
}: {
  initialMemories: Memory[];
  userId: string;
}) {
  const [memories, setMemories] = useState<Memory[]>(initialMemories);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch(`/api/memories?user_id=${userId}`);
      if (res.ok) {
        const json = await res.json();
        setMemories(json.memories || []);
      }
    } finally {
      setIsRefreshing(false);
    }
  }, [userId]);

  useEffect(() => {
    const handler = () => refresh();
    window.addEventListener("brain:captured", handler);
    return () => window.removeEventListener("brain:captured", handler);
  }, [refresh]);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="flex flex-col rounded-3xl bg-neutral-900 border border-neutral-800 shadow-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-800 bg-neutral-950">
        <span className="text-base font-bold text-white/90 tracking-tight">Recent Memories</span>
        <button
          onClick={refresh}
          disabled={isRefreshing}
          className="p-1.5 rounded-lg text-neutral-500 hover:text-white hover:bg-white/5 transition-all disabled:opacity-40"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* List */}
      <ul className="flex flex-col divide-y divide-neutral-800/60 max-h-[500px] overflow-y-auto custom-scrollbar">
        <AnimatePresence initial={false}>
          {memories.length === 0 ? (
            <motion.li
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center gap-2 py-12 text-neutral-600 text-sm"
            >
              <Inbox className="w-8 h-8 opacity-30" />
              <span>No memories yet.</span>
            </motion.li>
          ) : (
            memories.map((m) => {
              const meta = TYPE_META[m.type] ?? TYPE_META.idea;
              const { Icon } = meta;
              const isExpanded = expandedId === m.id;

              return (
                <motion.li
                  key={m.id}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col group overflow-hidden"
                >
                  <div 
                    onClick={() => toggleExpand(m.id)}
                    className="flex items-center gap-3 px-5 py-4 cursor-pointer hover:bg-white/[0.03] transition-colors"
                  >
                    <div className={`p-2 rounded-xl border ${meta.bg} shrink-0 shadow-sm`}>
                      <Icon className={`w-4 h-4 ${meta.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-neutral-200 truncate group-hover:text-white transition-colors">
                        {m.text}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] uppercase tracking-wider font-bold text-neutral-600">{meta.label}</span>
                        <span className="w-1 h-1 rounded-full bg-neutral-800" />
                        <span className="text-[10px] text-neutral-600 font-medium">
                          {isMounted ? timeAgo(m.created_at) : "recently"}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-neutral-600" /> : <ChevronDown className="w-4 h-4 text-neutral-600 opacity-0 group-hover:opacity-100 transition-opacity" />}
                    </div>
                  </div>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="px-5 pb-5 pt-1 overflow-hidden"
                      >
                        <div className="pl-11 flex flex-col gap-4">
                          <div className="p-4 rounded-2xl bg-black/40 border border-neutral-800/50 text-sm text-neutral-400 leading-relaxed">
                            {m.summary || m.text}
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <button 
                              onClick={async () => {
                                const btn = document.getElementById(`gen-btn-${m.id}`);
                                if (btn) btn.innerText = "Generating...";
                                try {
                                  const res = await fetch('/api/generate', {
                                    method: 'POST',
                                    body: JSON.stringify({ content: m.summary || m.text, type: 'social_post' })
                                  });
                                  const json = await res.json();
                                  if (json.success) {
                                    alert("Draft generated successfully! Check your documents.");
                                    window.dispatchEvent(new Event("brain:captured")); // Refresh list
                                  }
                                } catch (e) {
                                  alert("Failed to generate draft.");
                                } finally {
                                  if (btn) btn.innerText = "Generate Draft";
                                }
                              }}
                              id={`gen-btn-${m.id}`}
                              className="flex-1 py-2 px-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold hover:bg-indigo-500/20 transition-all flex items-center justify-center gap-2"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              Generate Draft
                            </button>
                            {m.type === 'task' && (
                              <button className="flex-1 py-2 px-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold hover:bg-emerald-500/20 transition-all flex items-center justify-center gap-2">
                                <CheckSquare className="w-3.5 h-3.5" />
                                Mark as Done
                              </button>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.li>
              );
            })
          )}
        </AnimatePresence>
      </ul>
    </div>
  );
}
