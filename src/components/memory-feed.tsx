"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lightbulb, CheckSquare, FolderKanban, RefreshCw, Inbox } from "lucide-react";

type MemoryType = "idea" | "task" | "project";

interface Memory {
  id: string;
  text: string;
  type: MemoryType;
  created_at: string;
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
    color: "text-amber-400",
    bg: "bg-amber-500/10 border-amber-500/20",
    Icon: CheckSquare,
  },
  project: {
    label: "Project",
    color: "text-fuchsia-400",
    bg: "bg-fuchsia-500/10 border-fuchsia-500/20",
    Icon: FolderKanban,
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

  // Expose refresh so parent can call after a new capture
  useEffect(() => {
    // Listen for a custom event dispatched by QuickCapture on success
    const handler = () => refresh();
    window.addEventListener("brain:captured", handler);
    return () => window.removeEventListener("brain:captured", handler);
  }, [refresh]);

  return (
    <div className="flex flex-col rounded-3xl bg-neutral-900 border border-neutral-800 shadow-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-800 bg-neutral-950">
        <span className="text-base font-bold text-white/90 tracking-tight">Recent Memories</span>
        <button
          onClick={refresh}
          disabled={isRefreshing}
          title="Refresh"
          className="p-1.5 rounded-lg text-neutral-500 hover:text-white hover:bg-white/5 transition-all disabled:opacity-40"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* List */}
      <ul className="flex flex-col divide-y divide-neutral-800/60 max-h-[340px] overflow-y-auto">
        <AnimatePresence initial={false}>
          {memories.length === 0 ? (
            <motion.li
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center gap-2 py-12 text-neutral-600 text-sm"
            >
              <Inbox className="w-8 h-8 opacity-30" />
              <span>No memories yet — capture something above!</span>
            </motion.li>
          ) : (
            memories.map((m) => {
              const meta = TYPE_META[m.type] ?? TYPE_META.idea;
              const { Icon } = meta;
              return (
                <motion.li
                  key={m.id}
                  layout
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center gap-3 px-5 py-3.5 group hover:bg-white/[0.02] transition-colors cursor-default"
                >
                  <div className={`p-1.5 rounded-lg border ${meta.bg} shrink-0`}>
                    <Icon className={`w-3.5 h-3.5 ${meta.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-neutral-200 truncate group-hover:text-white transition-colors">
                      {m.text}
                    </p>
                    <p className="text-xs text-neutral-600 mt-0.5">{timeAgo(m.created_at)}</p>
                  </div>
                  <span
                    className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-full border ${meta.bg} ${meta.color}`}
                  >
                    {meta.label}
                  </span>
                </motion.li>
              );
            })
          )}
        </AnimatePresence>
      </ul>
    </div>
  );
}
