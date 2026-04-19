"use client";

import { useChat } from '@ai-sdk/react';
import { Send, Sparkles, Loader2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { DefaultChatTransport } from 'ai';

export function ChatInterface() {
  const [input, setInput] = useState('');

  // In @ai-sdk/react v3, useChat delegates to a transport layer.
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/chat',
      body: {
        user_id: '00000000-0000-0000-0000-000000000000',
      },
    })
  });

  const isLoading = status === 'streaming' || status === 'submitted';
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;
    setInput('');
    await sendMessage({ text: trimmed });
  };

  return (
    <div className="flex flex-col h-[580px] bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden shadow-2xl relative">
      {/* Header */}
      <div className="flex items-center gap-2 px-6 py-4 border-b border-neutral-800 bg-neutral-950">
        <Sparkles className="w-5 h-5 text-indigo-400" />
        <h3 className="text-lg font-bold text-white/90">Execution Partner</h3>
        {isLoading && (
          <span className="ml-auto flex items-center gap-1.5 text-xs text-neutral-500">
            <Loader2 className="w-3 h-3 animate-spin" />
            Thinking…
          </span>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-neutral-500 text-sm text-center gap-3">
            <Sparkles className="w-8 h-8 opacity-20" />
            <p className="leading-relaxed">
              Ask me to pull up old ideas,<br />
              or generate an ebook from Project ABC.
            </p>
          </div>
        ) : (
          messages.map((m) => (
            <div
              key={m.id}
              className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-5 py-3 ${
                  m.role === 'user'
                    ? 'bg-indigo-600 text-white rounded-tr-sm shadow-md'
                    : 'bg-white/[0.03] text-neutral-200 border border-white/5 rounded-tl-sm'
                }`}
              >
                <div className="whitespace-pre-wrap text-sm leading-relaxed">
                  {m.parts
                    ?.filter((p) => p.type === 'text')
                    .map((p) => (p as any).text)
                    .join('\n')}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-neutral-950 border-t border-neutral-800">
        <form onSubmit={handleSubmit} className="relative flex items-center">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Instruct the agent…"
            disabled={isLoading}
            className="w-full bg-neutral-900 border border-neutral-800 rounded-full px-5 py-3 pr-12 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="absolute right-2 p-2 bg-indigo-600 hover:bg-indigo-500 rounded-full text-white disabled:opacity-50 transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
