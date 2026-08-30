'use client';

import React from 'react';
import { RefreshCw, ShieldAlert, Settings, Sparkles, Activity, Layers } from 'lucide-react';

interface HeaderProps {
  onSync: () => void;
  isSyncing: boolean;
  onOpenDataQuality: () => void;
  onOpenSettings: () => void;
  dealsCount: number;
  woCount: number;
  lastSynced: string | null;
}

export const Header: React.FC<HeaderProps> = ({
  onSync,
  isSyncing,
  onOpenDataQuality,
  onOpenSettings,
  dealsCount,
  woCount,
  lastSynced,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
        {/* Left: Branding */}
        <div className="flex items-center gap-3.5">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-slate-900 text-white font-extrabold text-lg shadow-md shadow-blue-500/15 ring-1 ring-white/20">
            S
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full ring-1 ring-emerald-300"></span>
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-base font-extrabold text-slate-900 tracking-tight">
                Skylark Drones
              </h1>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200/60 shadow-2xs">
                <Sparkles className="w-3 h-3 text-blue-600" />
                Executive BI Copilot
              </span>
            </div>
            <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500 font-medium">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Monday.com Live Sync
              </span>
              <span>•</span>
              <span className="text-slate-600 font-semibold">{dealsCount} Deals</span>
              <span>•</span>
              <span className="text-slate-600 font-semibold">{woCount} Work Orders</span>
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenDataQuality}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200/80 border border-slate-200 transition shadow-2xs"
            title="Inspect Data Integrity Audit"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
            <span className="hidden sm:inline">Data Quality</span>
          </button>

          <button
            onClick={onOpenSettings}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200/80 border border-slate-200 transition shadow-2xs"
            title="API Keys & Board Config"
          >
            <Settings className="w-3.5 h-3.5 text-slate-600" />
            <span className="hidden sm:inline">Settings</span>
          </button>

          <button
            onClick={onSync}
            disabled={isSyncing}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-60 shadow-sm shadow-blue-600/20 transition cursor-pointer disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Syncing...' : 'Sync Live Data'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
