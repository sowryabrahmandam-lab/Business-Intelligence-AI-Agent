'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { MetricCards, MetricsData } from '@/components/MetricCards';
import { ChatInterface, Message } from '@/components/ChatInterface';
import { VisualAnalytics } from '@/components/VisualAnalytics';
import { DataQualityModal } from '@/components/DataQualityModal';
import { SettingsModal } from '@/components/SettingsModal';
import { MessageSquare, BarChart3, Download, Sparkles } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<'chat' | 'charts'>('chat');
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [chartsData, setChartsData] = useState<any>(null);
  const [loadingMetrics, setLoadingMetrics] = useState<boolean>(true);
  const [loadingCharts, setLoadingCharts] = useState<boolean>(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatLoading, setChatLoading] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [dealsCount, setDealsCount] = useState<number>(0);
  const [woCount, setWoCount] = useState<number>(0);
  const [lastSynced, setLastSynced] = useState<string | null>(null);

  const [isDqOpen, setIsDqOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [dqReport, setDqReport] = useState<any>(null);

  // Fetch initial data
  const fetchData = async () => {
    try {
      setLoadingMetrics(true);
      setLoadingCharts(true);
      const [healthRes, metricsRes, dqRes, chartsRes] = await Promise.all([
        fetch(`${API_BASE}/health`).then((r) => r.json()).catch(() => null),
        fetch(`${API_BASE}/metrics`).then((r) => r.json()).catch(() => null),
        fetch(`${API_BASE}/data-quality`).then((r) => r.json()).catch(() => null),
        fetch(`${API_BASE}/charts-data`).then((r) => r.json()).catch(() => null),
      ]);

      if (healthRes) {
        setDealsCount(healthRes.deals_count || 0);
        setWoCount(healthRes.work_orders_count || 0);
        setLastSynced(healthRes.last_synced || null);
      }
      if (metricsRes) {
        setMetrics(metricsRes);
      }
      if (dqRes) {
        setDqReport(dqRes);
      }
      if (chartsRes) {
        setChartsData(chartsRes);
      }
    } catch (err) {
      console.error('Error fetching dashboard state:', err);
    } finally {
      setLoadingMetrics(false);
      setLoadingCharts(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch(`${API_BASE}/sync-monday`, { method: 'POST' });
      if (res.ok) {
        await fetchData();
      }
    } catch (err) {
      console.error('Sync failed:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSendMessage = async (userText: string) => {
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setChatLoading(true);

    try {
      const res = await fetch(`${API_BASE}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userText }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ detail: 'Failed to generate response' }));
        throw new Error(errData.detail || 'Server error');
      }

      const data = await res.json();
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.answer,
        sources: data.sources,
        dataQuality: data.data_quality,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `**Error:** ${err.message || 'Unable to connect to the backend analytics service.'}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleExportBriefing = () => {
    // Generate downloadable markdown executive report
    const lastAiMsg = [...messages].reverse().find((m) => m.role === 'assistant');
    const content = lastAiMsg ? lastAiMsg.content : `# Skylark Drones Leadership Update\n\nGenerated on: ${new Date().toLocaleDateString()}\n\nLive Pipeline: ${metrics?.total_pipeline_value}\nActive Deals: ${metrics?.active_deals}`;
    
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Skylark_Executive_Briefing_${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Top Header */}
      <Header
        onSync={handleSync}
        isSyncing={isSyncing}
        onOpenDataQuality={() => setIsDqOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        dealsCount={dealsCount}
        woCount={woCount}
        lastSynced={lastSynced}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5">
        {/* KPI Top-line Cards */}
        <MetricCards metrics={metrics} loading={loadingMetrics} />

        {/* View Switcher & Actions Bar */}
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center bg-slate-200/80 p-1 rounded-xl shadow-inner">
            <button
              onClick={() => setActiveTab('chat')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'chat'
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>AI Executive Chat</span>
            </button>
            <button
              onClick={() => setActiveTab('charts')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'charts'
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Visual BI Charts</span>
            </button>
          </div>

          <button
            onClick={handleExportBriefing}
            className="flex items-center gap-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 px-3 py-1.5 rounded-lg shadow-sm transition"
            title="Download Executive Markdown Report"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Export Briefing (.md)</span>
          </button>
        </div>

        {/* Content View */}
        {activeTab === 'chat' ? (
          <ChatInterface
            messages={messages}
            loading={chatLoading}
            onSendMessage={handleSendMessage}
            onClearMessages={() => setMessages([])}
          />
        ) : (
          <VisualAnalytics data={chartsData} loading={loadingCharts} />
        )}
      </main>

      {/* Modals */}
      <DataQualityModal
        isOpen={isDqOpen}
        onClose={() => setIsDqOpen(false)}
        dqReport={dqReport}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSaved={fetchData}
      />
    </div>
  );
}
