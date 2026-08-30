'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { MetricCards, MetricsData } from '@/components/MetricCards';
import { ChatInterface, Message } from '@/components/ChatInterface';
import { DataQualityModal } from '@/components/DataQualityModal';
import { SettingsModal } from '@/components/SettingsModal';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function HomePage() {
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [loadingMetrics, setLoadingMetrics] = useState<boolean>(true);
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
      const [healthRes, metricsRes, dqRes] = await Promise.all([
        fetch(`${API_BASE}/health`).then((r) => r.json()).catch(() => null),
        fetch(`${API_BASE}/metrics`).then((r) => r.json()).catch(() => null),
        fetch(`${API_BASE}/data-quality`).then((r) => r.json()).catch(() => null),
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
    } catch (err) {
      console.error('Error fetching dashboard state:', err);
    } finally {
      setLoadingMetrics(false);
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
        content: `**Error:** ${err.message || 'Unable to connect to the backend analytics service. Please verify backend is running on http://localhost:8000.'}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setChatLoading(false);
    }
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

        {/* Chat Section */}
        <ChatInterface
          messages={messages}
          loading={chatLoading}
          onSendMessage={handleSendMessage}
          onClearMessages={() => setMessages([])}
        />
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
