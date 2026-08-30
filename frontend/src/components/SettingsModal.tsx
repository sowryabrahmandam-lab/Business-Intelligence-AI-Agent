'use client';

import React, { useState } from 'react';
import { X, Settings, Key, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onSaved,
}) => {
  const [token, setToken] = useState('');
  const [dealsBoardId, setDealsBoardId] = useState('');
  const [woBoardId, setWoBoardId] = useState('');
  const [openaiKey, setOpenaiKey] = useState('');
  const [saving, setSaving] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [testing, setTesting] = useState(false);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch('http://localhost:8000/monday/test');
      const data = await res.json();
      setTestResult(data);
    } catch (e: any) {
      setTestResult({ error: `Connection failed: ${e.message}` });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: any = {};
      if (token) payload.monday_api_token = token;
      if (dealsBoardId) payload.monday_deals_board_id = dealsBoardId;
      if (woBoardId) payload.monday_work_orders_board_id = woBoardId;
      if (openaiKey) payload.openai_api_key = openaiKey;

      const res = await fetch('http://localhost:8000/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        onSaved();
        onClose();
      } else {
        alert('Failed to save configuration.');
      }
    } catch (e: any) {
      alert(`Error saving configuration: ${e.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-100 text-blue-700">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Credentials & Board Configuration
              </h3>
              <p className="text-xs text-slate-500">
                Set or update Monday.com and OpenAI credentials
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-4 text-sm">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Monday.com API Token
            </label>
            <input
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Leave blank to keep existing environment token"
              className="w-full bg-slate-50 border border-slate-300 focus:border-blue-500 focus:bg-white rounded-xl px-3.5 py-2 text-xs text-slate-900 outline-none transition"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Deals Board ID
              </label>
              <input
                type="text"
                value={dealsBoardId}
                onChange={(e) => setDealsBoardId(e.target.value)}
                placeholder="e.g. 1234567890"
                className="w-full bg-slate-50 border border-slate-300 focus:border-blue-500 focus:bg-white rounded-xl px-3.5 py-2 text-xs text-slate-900 outline-none transition"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Work Orders Board ID
              </label>
              <input
                type="text"
                value={woBoardId}
                onChange={(e) => setWoBoardId(e.target.value)}
                placeholder="e.g. 9876543210"
                className="w-full bg-slate-50 border border-slate-300 focus:border-blue-500 focus:bg-white rounded-xl px-3.5 py-2 text-xs text-slate-900 outline-none transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              OpenAI API Key
            </label>
            <input
              type="password"
              value={openaiKey}
              onChange={(e) => setOpenaiKey(e.target.value)}
              placeholder="sk-..."
              className="w-full bg-slate-50 border border-slate-300 focus:border-blue-500 focus:bg-white rounded-xl px-3.5 py-2 text-xs text-slate-900 outline-none transition"
            />
          </div>

          {/* Test connection output */}
          <div className="pt-2">
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={testing}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${testing ? 'animate-spin' : ''}`} />
              <span>{testing ? 'Testing Live Connection...' : 'Test Current Connection (/monday/test)'}</span>
            </button>

            {testResult && (
              <div className="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-700">Deals Board:</span>
                  <span className={testResult.deals?.connected ? 'text-emerald-600 font-semibold' : 'text-red-600 font-semibold'}>
                    {testResult.deals?.connected ? `Connected (${testResult.deals.item_count} items)` : (testResult.deals?.error || 'Disconnected')}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-700">Work Orders Board:</span>
                  <span className={testResult.work_orders?.connected ? 'text-emerald-600 font-semibold' : 'text-red-600 font-semibold'}>
                    {testResult.work_orders?.connected ? `Connected (${testResult.work_orders.item_count} items)` : (testResult.work_orders?.error || 'Disconnected')}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-200 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-sm transition"
            >
              {saving ? 'Saving...' : 'Save & Sync'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
