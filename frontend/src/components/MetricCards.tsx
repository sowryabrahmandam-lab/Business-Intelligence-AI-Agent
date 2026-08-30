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
      subtitle: 'Open deals pipeline value',
      icon: TrendingUp,
      color: 'text-blue-600',
      bg: 'bg-blue-50 border-blue-100',
    },
    {
      title: 'Expected Revenue',
      value: formatCurrency(metrics?.expected_revenue),
      subtitle: 'Weighted probability pipeline',
      icon: DollarSign,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50 border-emerald-100',
    },
    {
      title: 'Active Deals',
      value: metrics ? `${metrics.active_deals}` : '0',
      subtitle: 'Deals in negotiation / stage',
      icon: Briefcase,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50 border-indigo-100',
    },
    {
      title: 'Active Work Orders',
      value: metrics ? `${metrics.active_work_orders}` : '0',
      subtitle: 'In progress / ongoing execution',
      icon: FileText,
      color: 'text-purple-600',
      bg: 'bg-purple-50 border-purple-100',
    },
    {
      title: 'Amount Receivable',
      value: formatCurrency(metrics?.amount_receivable),
      subtitle: 'Pending uncollected billing',
      icon: AlertCircle,
      color: 'text-amber-600',
      bg: 'bg-amber-50 border-amber-100',
    },
    {
      title: 'Delayed Work Orders',
      value: metrics ? `${metrics.delayed_work_orders}` : '0',
      subtitle: 'Past target delivery date',
      icon: Clock,
      color: metrics && metrics.delayed_work_orders > 0 ? 'text-red-600' : 'text-slate-600',
      bg: metrics && metrics.delayed_work_orders > 0 ? 'bg-red-50 border-red-200 ring-1 ring-red-300' : 'bg-slate-50 border-slate-200',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 mb-6">
      {cards.map((card, i) => {
        const Icon = card.icon;
        return (
          <div
            key={i}
            className={`p-3.5 rounded-xl border transition duration-200 shadow-sm bg-white hover:shadow ${card.bg}`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                {card.title}
              </span>
              <Icon className={`w-4 h-4 ${card.color}`} />
            </div>
            <div className="text-lg font-bold text-slate-900 tracking-tight">
              {loading ? (
                <div className="h-6 w-20 bg-slate-200 animate-pulse rounded my-0.5"></div>
              ) : (
                card.value
              )}
            </div>
            <p className="text-[10px] text-slate-500 truncate mt-0.5">{card.subtitle}</p>
          </div>
        );
      })}
    </div>
  );
};
