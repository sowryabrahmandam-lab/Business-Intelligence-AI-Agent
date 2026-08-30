'use client';

import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Send, Bot, User, Sparkles, AlertTriangle, Layers, Copy, Check, CornerDownLeft, ArrowRight, Zap, Target, TrendingUp, Clock, FileCheck } from 'lucide-react';

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
    color: 'text-blue-600 bg-blue-50 border-blue-100',
    queries: [
      'How is our pipeline looking this quarter?',
      'Which sector has the strongest pipeline?',
      'What is our expected revenue?',
    ],
  },
  {
    category: 'Revenue & Cash Flow',
    icon: Target,
    color: 'text-emerald-600 bg-emerald-50 border-emerald-100',
    queries: [
      'How much money is receivable?',
      'What is our collection performance?',
      'How is the energy sector performing?',
    ],
  },
  {
    category: 'Operations & Delays',
    icon: Clock,
    color: 'text-amber-600 bg-amber-50 border-amber-100',
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
    <div className="flex flex-col h-[calc(100vh-210px)] min-h-[520px] bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Scrollable Message Thread */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-2xl mx-auto py-6">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white mb-4 shadow-lg shadow-blue-500/20">
              <Sparkles className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 tracking-tight mb-1.5">
              Skylark Business Intelligence Copilot
            </h3>
            <p className="text-sm text-slate-500 mb-6 max-w-md">
              Ask natural-language questions to retrieve live, deterministic business intelligence from Monday.com Deals and Work Orders.
            </p>

            {/* Categorized Prompt Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 w-full text-left">
              {CATEGORIZED_PROMPTS.map((cat, idx) => {
                const CatIcon = cat.icon;
                return (
                  <div
                    key={idx}
                    className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 shadow-2xs flex flex-col justify-between"
                  >
                    <div className="flex items-center gap-2 mb-2.5">
                      <div className={`p-1.5 rounded-lg border ${cat.color}`}>
                        <CatIcon className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs font-bold text-slate-800">{cat.category}</span>
                    </div>

                    <div className="space-y-1.5">
                      {cat.queries.map((q, qIdx) => (
                        <button
                          key={qIdx}
                          onClick={() => onSendMessage(q)}
                          className="w-full text-left text-[11px] font-medium text-slate-700 bg-white hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 p-2 rounded-xl border border-slate-200/70 shadow-2xs transition flex items-center justify-between group"
                        >
                          <span className="truncate mr-1.5">{q}</span>
                          <CornerDownLeft className="w-3 h-3 text-slate-400 group-hover:text-blue-600 flex-shrink-0" />
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          messages.map((m) => {
            const isUser = m.role === 'user';
            return (
              <div
                key={m.id}
                className={`flex gap-3 sm:gap-4 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white flex-shrink-0 shadow-md shadow-blue-500/15 mt-0.5 font-bold text-xs">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[90%] sm:max-w-[82%] rounded-2xl px-5 py-4 shadow-2xs text-sm ${
                    isUser
                      ? 'bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-br-none font-medium'
                      : 'bg-slate-50/80 border border-slate-200 text-slate-900 rounded-bl-none'
                  }`}
                >
                  {isUser ? (
                    <p className="whitespace-pre-wrap leading-relaxed">{m.content}</p>
                  ) : (
                    <div>
                      <div className="prose prose-sm max-w-none text-slate-800 prose-headings:text-slate-900 prose-headings:font-bold prose-h1:text-lg prose-h2:text-base prose-h3:text-sm prose-p:my-2 prose-ul:my-2 prose-li:my-0.5 prose-strong:text-slate-900">
                        <ReactMarkdown>{m.content}</ReactMarkdown>
                      </div>

                      {/* Footer Metadata */}
                      <div className="mt-3.5 pt-3 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                        <div className="flex items-center gap-2">
                          {m.sources && m.sources.length > 0 && (
                            <span className="inline-flex items-center gap-1 bg-white px-2.5 py-0.5 rounded-md border border-slate-200 text-[11px] font-semibold text-slate-700 shadow-2xs">
                              <Layers className="w-3 h-3 text-blue-600" />
                              Sources: {m.sources.join(', ')}
                            </span>
                          )}
                          <span className="text-[11px] text-slate-400 font-medium">{m.timestamp}</span>
                        </div>

                        <button
                          onClick={() => copyToClipboard(m.id, m.content)}
                          className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-slate-800 transition px-2 py-1 rounded-md hover:bg-slate-200/60"
                        >
                          {copiedId === m.id ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span className="text-emerald-600 font-semibold">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy Answer</span>
                            </>
                          )}
                        </button>
                      </div>

                      {/* Data Quality Notice */}
                      {m.dataQuality && m.dataQuality.length > 0 && (
                        <div className="mt-2.5 bg-amber-50/90 border border-amber-200/80 rounded-xl p-2.5 text-xs text-amber-900 flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                          <div className="text-[11px] leading-relaxed">
                            <span className="font-bold">Data Quality Notice:</span>{' '}
                            {m.dataQuality.slice(0, 2).join(' ')}
                            {m.dataQuality.length > 2 && ` (+${m.dataQuality.length - 2} more audit logs)`}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {isUser && (
                  <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center text-white flex-shrink-0 shadow-md mt-0.5 text-xs font-semibold">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })
        )}

        {loading && (
          <div className="flex gap-3 items-start">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white flex-shrink-0 shadow-md text-xs">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-2xl rounded-bl-none px-4 py-3 shadow-2xs flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-600 animate-bounce"></div>
              <div className="w-2 h-2 rounded-full bg-blue-600 animate-bounce [animation-delay:0.2s]"></div>
              <div className="w-2 h-2 rounded-full bg-blue-600 animate-bounce [animation-delay:0.4s]"></div>
              <span className="text-xs text-slate-600 font-semibold ml-2">
                Querying live Monday.com boards & executing deterministic models...
              </span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <div className="p-4 bg-slate-50/80 border-t border-slate-200">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about pipeline value, expected revenue, delayed orders, sector win rates..."
            disabled={loading}
            className="flex-1 bg-white border border-slate-300 focus:border-blue-500 focus:ring-3 focus:ring-blue-100 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition shadow-2xs disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 text-white px-5 py-3 rounded-xl font-bold shadow-md shadow-blue-500/20 transition flex items-center gap-2 flex-shrink-0 cursor-pointer disabled:cursor-not-allowed text-xs"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">Ask AI</span>
          </button>
        </form>

        <div className="flex justify-between items-center mt-2 px-1 text-[11px] text-slate-400">
          <span className="flex items-center gap-1">
            <Zap className="w-3 h-3 text-amber-500" />
            100% Deterministic Python Analytics • Live Monday.com Source of Truth
          </span>
          {messages.length > 0 && (
            <button
              onClick={onClearMessages}
              className="text-slate-400 hover:text-slate-600 underline transition cursor-pointer"
            >
              Reset Chat
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
