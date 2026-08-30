'use client';

import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Send, Bot, User, Sparkles, AlertTriangle, Layers, Copy, Check, CornerDownLeft } from 'lucide-react';

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

const SUGGESTED_QUERIES = [
  "How is our pipeline looking this quarter?",
  "How is the energy sector performing?",
  "Which sector has the strongest pipeline?",
  "What is our expected revenue?",
  "How much money is receivable?",
  "What work orders are delayed?",
  "Prepare a leadership update.",
  "Are there any data quality issues?"
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
    <div className="flex flex-col h-[calc(100vh-210px)] min-h-[500px] bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-xl mx-auto py-8">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 mb-4 shadow-sm">
              <Sparkles className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">
              Ask any Business Intelligence question
            </h3>
            <p className="text-sm text-slate-500 mb-6 max-w-md">
              The agent queries live Monday.com Deals & Work Orders boards to produce deterministic executive insights.
            </p>

            <div className="w-full">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5 text-left">
                Suggested Executive Prompts
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left">
                {SUGGESTED_QUERIES.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => onSendMessage(q)}
                    className="text-xs text-slate-700 bg-slate-50 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 border border-slate-200/80 rounded-xl p-2.5 transition text-left flex items-center justify-between group shadow-sm"
                  >
                    <span className="truncate mr-2">{q}</span>
                    <CornerDownLeft className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 flex-shrink-0" />
                  </button>
                ))}
              </div>
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
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white flex-shrink-0 shadow-sm mt-0.5 font-bold text-xs">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[88%] sm:max-w-[80%] rounded-2xl px-4 py-3.5 shadow-sm text-sm ${
                    isUser
                      ? 'bg-blue-600 text-white rounded-br-none'
                      : 'bg-slate-50 border border-slate-200/90 text-slate-900 rounded-bl-none'
                  }`}
                >
                  {isUser ? (
                    <p className="whitespace-pre-wrap leading-relaxed">{m.content}</p>
                  ) : (
                    <div>
                      <div className="prose prose-sm max-w-none text-slate-800 prose-headings:text-slate-900 prose-headings:font-bold prose-h1:text-lg prose-h2:text-base prose-h3:text-sm prose-p:my-1.5 prose-ul:my-1.5 prose-li:my-0.5 prose-strong:text-slate-900">
                        <ReactMarkdown>{m.content}</ReactMarkdown>
                      </div>

                      {/* Sources & Metadata Footer */}
                      <div className="mt-3 pt-2.5 border-t border-slate-200/70 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                        <div className="flex items-center gap-2">
                          {m.sources && m.sources.length > 0 && (
                            <span className="flex items-center gap-1 bg-white px-2 py-0.5 rounded border border-slate-200 text-[11px] font-medium text-slate-600">
                              <Layers className="w-3 h-3 text-blue-600" />
                              Sources: {m.sources.join(', ')}
                            </span>
                          )}
                          <span className="text-[10px] text-slate-400">{m.timestamp}</span>
                        </div>

                        <button
                          onClick={() => copyToClipboard(m.id, m.content)}
                          className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-800 transition px-1.5 py-0.5 rounded hover:bg-slate-200/60"
                          title="Copy response"
                        >
                          {copiedId === m.id ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span className="text-emerald-600">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </div>

                      {/* Data Quality Notice */}
                      {m.dataQuality && m.dataQuality.length > 0 && (
                        <div className="mt-2.5 bg-amber-50/80 border border-amber-200 rounded-lg p-2 text-xs text-amber-800 flex items-start gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
                          <div className="text-[11px] leading-tight">
                            <span className="font-semibold">Data Quality Warning:</span>{' '}
                            {m.dataQuality.slice(0, 2).join(' ')}
                            {m.dataQuality.length > 2 && ` (+${m.dataQuality.length - 2} more notes)`}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {isUser && (
                  <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center text-white flex-shrink-0 shadow-sm mt-0.5 text-xs font-semibold">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })
        )}

        {loading && (
          <div className="flex gap-3 items-start">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white flex-shrink-0 shadow-sm text-xs">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-2xl rounded-bl-none px-4 py-3 shadow-sm flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-600 animate-bounce"></div>
              <div className="w-2 h-2 rounded-full bg-blue-600 animate-bounce [animation-delay:0.2s]"></div>
              <div className="w-2 h-2 rounded-full bg-blue-600 animate-bounce [animation-delay:0.4s]"></div>
              <span className="text-xs text-slate-500 ml-2 font-medium">
                Analyzing live monday.com data...
              </span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <div className="p-3.5 sm:p-4 bg-slate-50 border-t border-slate-200">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask anything about pipeline, revenue, delayed orders, sector performance..."
            disabled={loading}
            className="flex-1 bg-white border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2.5 rounded-xl font-medium shadow-sm transition flex items-center gap-1.5 flex-shrink-0"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline text-xs">Ask Agent</span>
          </button>
        </form>

        {messages.length > 0 && (
          <div className="flex justify-between items-center mt-2 px-1 text-[11px] text-slate-400">
            <span>Powered by live monday.com GraphQL & Python deterministic analytics</span>
            <button
              onClick={onClearMessages}
              className="text-slate-400 hover:text-slate-600 underline transition"
            >
              Clear conversation
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
