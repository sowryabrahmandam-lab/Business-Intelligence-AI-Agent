'use client';

import React from 'react';
import { X, ShieldAlert, CheckCircle2, AlertTriangle, FileSpreadsheet } from 'lucide-react';

interface DataQualityModalProps {
  isOpen: boolean;
  onClose: () => void;
  dqReport: any;
}

export const DataQualityModal: React.FC<DataQualityModalProps> = ({
  isOpen,
  onClose,
  dqReport,
}) => {
  if (!isOpen) return null;

  const dealsDq = dqReport?.deals || {};
  const woDq = dqReport?.work_orders || {};
  const warnings = dqReport?.combined_warnings || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-100 text-amber-700">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Data Quality & Integrity Report
              </h3>
              <p className="text-xs text-slate-500">
                Live evaluation of Monday.com Deals & Work Orders boards
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

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm">
          {/* Summary Grid */}
          <div className="grid grid-cols-2 gap-4">
            {/* Deals Health */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
              <div className="flex items-center gap-2 font-bold text-slate-800 text-xs uppercase tracking-wider">
                <FileSpreadsheet className="w-4 h-4 text-blue-600" />
                Deals Board Health
              </div>
              <div className="space-y-1 text-xs text-slate-600">
                <div className="flex justify-between py-0.5 border-b border-slate-200/60">
                  <span>Total Records:</span>
                  <span className="font-semibold text-slate-900">{dealsDq.total_records ?? 0}</span>
                </div>
                <div className="flex justify-between py-0.5 border-b border-slate-200/60">
                  <span>Missing Values:</span>
                  <span className="font-semibold text-amber-600">{dealsDq.missing_deal_value_count ?? 0}</span>
                </div>
                <div className="flex justify-between py-0.5 border-b border-slate-200/60">
                  <span>Missing Close Dates:</span>
                  <span className="font-semibold text-amber-600">{dealsDq.missing_effective_dates_count ?? 0}</span>
                </div>
                <div className="flex justify-between py-0.5">
                  <span>Potential Duplicates:</span>
                  <span className="font-semibold text-slate-900">{dealsDq.potential_duplicates_count ?? 0}</span>
                </div>
              </div>
            </div>

            {/* Work Orders Health */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
              <div className="flex items-center gap-2 font-bold text-slate-800 text-xs uppercase tracking-wider">
                <FileSpreadsheet className="w-4 h-4 text-purple-600" />
                Work Orders Board Health
              </div>
              <div className="space-y-1 text-xs text-slate-600">
                <div className="flex justify-between py-0.5 border-b border-slate-200/60">
                  <span>Total Records:</span>
                  <span className="font-semibold text-slate-900">{woDq.total_records ?? 0}</span>
                </div>
                <div className="flex justify-between py-0.5 border-b border-slate-200/60">
                  <span>Missing Receivables:</span>
                  <span className="font-semibold text-amber-600">{woDq.missing_receivables_count ?? 0}</span>
                </div>
                <div className="flex justify-between py-0.5 border-b border-slate-200/60">
                  <span>Missing Collections:</span>
                  <span className="font-semibold text-amber-600">{woDq.missing_collected_count ?? 0}</span>
                </div>
                <div className="flex justify-between py-0.5">
                  <span>Potential Duplicates:</span>
                  <span className="font-semibold text-slate-900">{woDq.potential_duplicates_count ?? 0}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Warnings List */}
          <div>
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700 mb-2">
              Active Warnings & Audit Notes ({warnings.length})
            </h4>
            {warnings.length === 0 ? (
              <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 p-3 rounded-xl">
                <CheckCircle2 className="w-4 h-4" />
                <span>No critical data quality issues detected in live boards.</span>
              </div>
            ) : (
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {warnings.map((w: string, idx: number) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2 p-2.5 rounded-lg bg-amber-50/70 border border-amber-200/70 text-xs text-amber-900"
                  >
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <span>{w}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold shadow-sm transition"
          >
            Close Report
          </button>
        </div>
      </div>
    </div>
  );
};
