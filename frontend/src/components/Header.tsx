'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, ShieldAlert, Settings, Sparkles, Activity, Layers, ArrowUpRight } from 'lucide-react';

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
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-xl border-b border-slate-800/80 shadow-md text-white"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
        {/* Left: Branding */}
        <div className="flex items-center gap-3.5">
          <motion.div
            whileHover={{ scale: 1.05, rotate: 3 }}
            className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-blue-600 to-purple-700 text-white font-black text-lg shadow-lg shadow-indigo-500/25 ring-1 ring-white/20"
          >
            S
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-slate-900 rounded-full ring-2 ring-emerald-400/40 animate-pulse"></span>
          </motion.div>

          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-base font-extrabold text-white tracking-tight">
                Skylark Drones
              </h1>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 shadow-xs">
                <Sparkles className="w-3 h-3 text-indigo-400" />
                Executive BI Copilot
              </span>
            </div>

            <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400 font-medium">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                Monday.com Live
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-slate-300 font-semibold">{dealsCount} Deals</span>
              <span className="text-slate-600">•</span>
              <span className="text-slate-300 font-semibold">{woCount} Work Orders</span>
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onOpenDataQuality}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-300 bg-slate-800/90 hover:bg-slate-700/90 hover:text-white border border-slate-700/80 transition cursor-pointer shadow-xs"
            title="Inspect Data Integrity Audit"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Data Audit</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onOpenSettings}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-300 bg-slate-800/90 hover:bg-slate-700/90 hover:text-white border border-slate-700/80 transition cursor-pointer shadow-xs"
            title="API Keys & Board Config"
          >
            <Settings className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">Config</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={onSync}
            disabled={isSyncing}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:from-blue-700 active:to-indigo-700 disabled:opacity-50 shadow-md shadow-blue-500/25 transition cursor-pointer disabled:cursor-not-allowed border border-blue-400/20"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Syncing...' : 'Sync Live'}</span>
          </motion.button>
        </div>
      </div>
    </motion.header>
  );
};
