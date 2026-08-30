'use client';

import React from 'react';
import { RefreshCw, ShieldAlert, Settings, Database, Activity } from 'lucide-react';

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
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
        {/* Left: Brand & Title */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 font-bold text-lg">
            S
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-900 leading-tight">
                Skylark Drones
              </h1>
              <span className="bg-blue-50 text-blue-700 text-xs font-semibold px-2 py-0.5 rounded-full border border-blue-200">
                BI Executive Agent
              </span>
            </div>
            <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Monday.com Source of Truth • {dealsCount} Deals • {woCount} Work Orders
            </p>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={onOpenDataQuality}
            className="flex items-center gap-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-lg transition"
            title="Inspect Data Quality"
          >
            <ShieldAlert className="w-4 h-4 text-amber-600" />
            <span className="hidden sm:inline">Data Quality</span>
          </button>

          <button
            onClick={onOpenSettings}
            className="flex items-center gap-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-lg transition"
            title="API & Board Configuration"
          >
            <Settings className="w-4 h-4 text-slate-600" />
            <span className="hidden sm:inline">Settings</span>
          </button>

          <button
            onClick={onSync}
            disabled={isSyncing}
            className={`flex items-center gap-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60 px-3.5 py-2 rounded-lg shadow-sm transition ${
              isSyncing ? 'cursor-not-allowed' : ''
            }`}
            title="Sync Live Data from Monday.com"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Syncing...' : 'Sync Monday.com'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
