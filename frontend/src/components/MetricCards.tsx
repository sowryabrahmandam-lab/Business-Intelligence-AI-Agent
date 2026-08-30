'use client';

import React from 'react';
import { TrendingUp, DollarSign, Briefcase, FileText, AlertCircle, Clock } from 'lucide-react';

export interface MetricsData {
  total_pipeline_value: number;
  expected_revenue: number;
  active_deals: number;
  active_work_orders: number;
  amount_receivable: number;
  delayed_work_orders: number;
}

interface MetricCardsProps {
  metrics: MetricsData | null;
  loading: boolean;
}

export const MetricCards: React.FC<MetricCardsProps> = ({ metrics, loading }) => {
  const formatCurrency = (val: number | undefined) => {
    if (val === undefined || isNaN(val)) return '₹0';
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(2)} L`;
    return `₹${val.toLocaleString('en-IN')}`;
  };

  const cards = [
    {
      title: 'Total Pipeline',
      value: formatCurrency(metrics?.total_pipeline_value),
      subtitle: 'Open commercial deals',
      icon: TrendingUp,
      accent: 'text-blue-600',
      iconBg: 'bg-blue-50 border-blue-100',
      pill: 'Forward Value',
      pillBg: 'bg-blue-50 text-blue-700 border-blue-200/60',
    },
    {
      title: 'Expected Revenue',
      value: formatCurrency(metrics?.expected_revenue),
      subtitle: 'Probability-weighted pipeline',
      icon: DollarSign,
      accent: 'text-emerald-600',
      iconBg: 'bg-emerald-50 border-emerald-100',
      pill: 'Weighted',
      pillBg: 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
    },
    {
      title: 'Active Deals',
      value: metrics ? `${metrics.active_deals}` : '0',
      subtitle: 'Deals in negotiation',
      icon: Briefcase,
      accent: 'text-indigo-600',
      iconBg: 'bg-indigo-50 border-indigo-100',
      pill: 'In Funnel',
      pillBg: 'bg-indigo-50 text-indigo-700 border-indigo-200/60',
    },
    {
      title: 'Active Work Orders',
      value: metrics ? `${metrics.active_work_orders}` : '0',
      subtitle: 'In-progress operations',
      icon: FileText,
      accent: 'text-purple-600',
      iconBg: 'bg-purple-50 border-purple-100',
      pill: 'Executing',
      pillBg: 'bg-purple-50 text-purple-700 border-purple-200/60',
    },
    {
      title: 'Receivables',
      value: formatCurrency(metrics?.amount_receivable),
      subtitle: 'Pending cash collection',
      icon: AlertCircle,
      accent: 'text-amber-600',
      iconBg: 'bg-amber-50 border-amber-100',
      pill: 'AR Exposure',
      pillBg: 'bg-amber-50 text-amber-700 border-amber-200/60',
    },
    {
      title: 'Delayed Orders',
      value: metrics ? `${metrics.delayed_work_orders}` : '0',
      subtitle: 'Past target delivery date',
      icon: Clock,
      accent: metrics && metrics.delayed_work_orders > 0 ? 'text-red-600' : 'text-slate-600',
      iconBg: metrics && metrics.delayed_work_orders > 0 ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-200',
      pill: metrics && metrics.delayed_work_orders > 0 ? 'Critical' : 'Nominal',
      pillBg: metrics && metrics.delayed_work_orders > 0 ? 'bg-red-50 text-red-700 border-red-200' : 'bg-slate-50 text-slate-600 border-slate-200',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 mb-6">
      {cards.map((card, i) => {
        const Icon = card.icon;
        return (
          <div
            key={i}
            className="group relative bg-white hover:bg-slate-50/50 p-4 rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-slate-300 transition-all duration-200 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className={`p-2 rounded-xl border ${card.iconBg} ${card.accent}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${card.pillBg}`}>
                  {card.pill}
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-500 tracking-wide uppercase">
                {card.title}
              </p>
            </div>

            <div className="mt-2.5">
              <div className="text-xl font-extrabold text-slate-900 tracking-tight">
                {loading ? (
                  <div className="h-7 w-20 bg-slate-200 animate-pulse rounded my-0.5"></div>
                ) : (
                  card.value
                )}
              </div>
              <p className="text-[11px] text-slate-500 truncate mt-0.5 font-medium">{card.subtitle}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};
