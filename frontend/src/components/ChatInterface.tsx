'use client';

import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User, Sparkles, AlertTriangle, Layers, Copy, Check, CornerDownLeft, Zap, Target, TrendingUp, Clock } from 'lucide-react';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: string[];
  dataQuality?: string[];
  timestamp: string;
}

interface ChatInterfaceProps {
  messages: Message[];
  loading: boolean;
  onSendMessage: (msg: string) => void;
  onClearMessages: () => void;
}

const CATEGORIZED_PROMPTS = [
  {
    category: 'Pipeline & Forecast',
    icon: TrendingUp,
    color: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    queries: [
      'How is our pipeline looking this quarter?',
      'Which sector has the strongest pipeline?',
      'What is our expected revenue?',
    ],
  },
  {
    category: 'Revenue & Cash Flow',
    icon: Target,
    color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    queries: [
      'How much money is receivable?',
      'What is our collection performance?',
      'How is the energy sector performing?',
    ],
  },
  {
    category: 'Operations & Delays',
    icon: Clock,
    color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    queries: [
      'What work orders are delayed?',
      'Compare sector performance.',
      'Prepare a leadership update.',
    ],
  },
];

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  messages,
  loading,
  onSendMessage,
  onClearMessages,
}) => {
  const [input, setInput] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    onSendMessage(input.trim());
    setInput('');
  };

  const copyToClipboard = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.99 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col h-[calc(100vh-215px)] min-h-[520px] bg-slate-900/90 backdrop-blur-2xl rounded-3xl border border-slate-800 shadow-2xl overflow-hidden"
    >
      {/* Scrollable Message Thread */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-2xl mx-auto py-6">
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
              className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-500 via-blue-600 to-purple-600 flex items-center justify-center text-white mb-4 shadow-xl shadow-indigo-500/30 ring-1 ring-white/20"
            >
              <Sparkles className="w-7 h-7" />
            </motion.div>

            <h3 className="text-xl font-black text-white tracking-tight mb-1.5">
              Skylark Executive BI Copilot
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 mb-6 max-w-md">
              Ask natural-language business questions to query live Monday.com Deals and Work Orders with 100% deterministic Python accuracy.
            </p>

            {/* Categorized Prompt Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 w-full text-left">
              {CATEGORIZED_PROMPTS.map((cat, idx) => {
                const CatIcon = cat.icon;
                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + idx * 0.1 }}
                    className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/80 shadow-md flex flex-col justify-between"
                  >
                    <div className="flex items-center gap-2 mb-2.5">
                      <div className={`p-1.5 rounded-lg border ${cat.color}`}>
                        <CatIcon className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs font-bold text-slate-200">{cat.category}</span>
                    </div>

                    <div className="space-y-1.5">
                      {cat.queries.map((q, qIdx) => (
                        <motion.button
                          key={qIdx}
                          whileHover={{ scale: 1.02, x: 2 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => onSendMessage(q)}
                          className="w-full text-left text-[11px] font-medium text-slate-300 bg-slate-900/90 hover:bg-indigo-600/20 hover:text-indigo-200 hover:border-indigo-500/40 p-2.5 rounded-xl border border-slate-700/70 shadow-xs transition flex items-center justify-between group cursor-pointer"
                        >
                          <span className="truncate mr-1.5">{q}</span>
                          <CornerDownLeft className="w-3 h-3 text-slate-500 group-hover:text-indigo-400 flex-shrink-0" />
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {messages.map((m) => {
              const isUser = m.role === 'user';
              return (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  className={`flex gap-3 sm:gap-4 ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  {!isUser && (
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-blue-600 flex items-center justify-center text-white flex-shrink-0 shadow-md shadow-indigo-500/20 mt-0.5 font-bold text-xs">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  <div
                    className={`max-w-[92%] sm:max-w-[84%] rounded-2xl px-5 py-4 shadow-md text-sm ${
                      isUser
                        ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white rounded-br-none font-medium'
                        : 'bg-slate-800/95 border border-slate-700/90 text-slate-100 rounded-bl-none shadow-xl'
                    }`}
                  >
                    {isUser ? (
                      <p className="whitespace-pre-wrap leading-relaxed">{m.content}</p>
                    ) : (
                      <div>
                        <div className="prose prose-invert prose-sm max-w-none text-slate-200 prose-headings:text-white prose-headings:font-bold prose-h1:text-lg prose-h2:text-base prose-h3:text-sm prose-p:my-2 prose-ul:my-2 prose-li:my-0.5 prose-strong:text-indigo-300">
                          <ReactMarkdown>{m.content}</ReactMarkdown>
                        </div>

                        {/* Footer Metadata */}
                        <div className="mt-4 pt-3 border-t border-slate-700/80 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
                          <div className="flex items-center gap-2">
                            {m.sources && m.sources.length > 0 && (
                              <span className="inline-flex items-center gap-1 bg-slate-900/90 px-2.5 py-0.5 rounded-md border border-slate-700 text-[11px] font-semibold text-slate-300">
                                <Layers className="w-3 h-3 text-indigo-400" />
                                Sources: {m.sources.join(', ')}
                              </span>
                            )}
                            <span className="text-[11px] text-slate-500 font-medium">{m.timestamp}</span>
                          </div>

                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => copyToClipboard(m.id, m.content)}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400 hover:text-white transition px-2.5 py-1 rounded-md bg-slate-900/80 hover:bg-slate-700 border border-slate-700/80 cursor-pointer"
                          >
                            {copiedId === m.id ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-400" />
                                <span className="text-emerald-400">Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span>Copy Briefing</span>
                              </>
                            )}
                          </motion.button>
                        </div>

                        {/* Data Quality Notice */}
                        {m.dataQuality && m.dataQuality.length > 0 && (
                          <div className="mt-3 bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 text-xs text-amber-200 flex items-start gap-2.5">
                            <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                            <div className="text-[11px] leading-relaxed">
                              <span className="font-bold text-amber-300">Data Quality Notice:</span>{' '}
                              {m.dataQuality.slice(0, 2).join(' ')}
                              {m.dataQuality.length > 2 && ` (+${m.dataQuality.length - 2} more audit logs)`}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {isUser && (
                    <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-white flex-shrink-0 shadow-md mt-0.5 text-xs font-semibold">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}

        {loading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-3 items-start"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-blue-600 flex items-center justify-center text-white flex-shrink-0 shadow-md text-xs">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl rounded-bl-none px-4 py-3 shadow-lg flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce"></div>
              <div className="w-2 h-2 rounded-full bg-blue-400 animate-bounce [animation-delay:0.2s]"></div>
              <div className="w-2 h-2 rounded-full bg-purple-400 animate-bounce [animation-delay:0.4s]"></div>
              <span className="text-xs text-slate-300 font-semibold ml-2">
                Running deterministic Python models & querying Monday.com...
              </span>
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <div className="p-4 bg-slate-950/80 border-t border-slate-800/90">
        <form onSubmit={handleSubmit} className="flex gap-2.5">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about pipeline value, expected revenue, delayed orders, sector win rates..."
            disabled={loading}
            className="flex-1 bg-slate-900/90 border border-slate-700/80 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none transition shadow-inner disabled:opacity-60"
          />
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={!input.trim() || loading}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:from-blue-700 active:to-indigo-700 disabled:opacity-50 text-white px-5 py-3 rounded-xl font-bold shadow-lg shadow-indigo-500/25 transition flex items-center gap-2 flex-shrink-0 cursor-pointer disabled:cursor-not-allowed text-xs border border-indigo-400/20"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">Ask Copilot</span>
          </motion.button>
        </form>

        <div className="flex justify-between items-center mt-2.5 px-1 text-[11px] text-slate-400">
          <span className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            100% Deterministic Calculations • Direct Monday.com Graph
          </span>
          {messages.length > 0 && (
            <button
              onClick={onClearMessages}
              className="text-slate-400 hover:text-slate-200 underline transition cursor-pointer"
            >
              Clear Conversation
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};
