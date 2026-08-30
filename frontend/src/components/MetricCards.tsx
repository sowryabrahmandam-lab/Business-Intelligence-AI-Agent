'use client';

import React from 'react';
import { motion } from 'framer-motion';
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
      subtitle: 'Open commercial funnel',
      icon: TrendingUp,
      accent: 'text-blue-400',
      iconBg: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
      pill: 'Forward Value',
      pillBg: 'bg-blue-500/10 text-blue-300 border-blue-500/20',
      glow: 'group-hover:shadow-blue-500/10',
    },
    {
      title: 'Expected Revenue',
      value: formatCurrency(metrics?.expected_revenue),
      subtitle: 'Probability-weighted',
      icon: DollarSign,
      accent: 'text-emerald-400',
      iconBg: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
      pill: 'Weighted',
      pillBg: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
      glow: 'group-hover:shadow-emerald-500/10',
    },
    {
      title: 'Active Deals',
      value: metrics ? `${metrics.active_deals}` : '0',
      subtitle: 'Deals in negotiation',
      icon: Briefcase,
      accent: 'text-indigo-400',
      iconBg: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400',
      pill: 'In Funnel',
      pillBg: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20',
      glow: 'group-hover:shadow-indigo-500/10',
    },
    {
      title: 'Active Work Orders',
      value: metrics ? `${metrics.active_work_orders}` : '0',
      subtitle: 'Executing projects',
      icon: FileText,
      accent: 'text-purple-400',
      iconBg: 'bg-purple-500/10 border-purple-500/20 text-purple-400',
      pill: 'Executing',
      pillBg: 'bg-purple-500/10 text-purple-300 border-purple-500/20',
      glow: 'group-hover:shadow-purple-500/10',
    },
    {
      title: 'Receivables',
      value: formatCurrency(metrics?.amount_receivable),
      subtitle: 'Pending cash collection',
      icon: AlertCircle,
      accent: 'text-amber-400',
      iconBg: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
      pill: 'AR Exposure',
      pillBg: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
      glow: 'group-hover:shadow-amber-500/10',
    },
    {
      title: 'Delayed Orders',
      value: metrics ? `${metrics.delayed_work_orders}` : '0',
      subtitle: 'Past target date',
      icon: Clock,
      accent: metrics && metrics.delayed_work_orders > 0 ? 'text-rose-400' : 'text-slate-400',
      iconBg: metrics && metrics.delayed_work_orders > 0 ? 'bg-rose-500/15 border-rose-500/30 text-rose-400' : 'bg-slate-800 border-slate-700 text-slate-400',
      pill: metrics && metrics.delayed_work_orders > 0 ? 'Critical' : 'Nominal',
      pillBg: metrics && metrics.delayed_work_orders > 0 ? 'bg-rose-500/15 text-rose-300 border-rose-500/30' : 'bg-slate-800 text-slate-400 border-slate-700',
      glow: 'group-hover:shadow-rose-500/10',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-5">
      {cards.map((card, i) => {
        const Icon = card.icon;
        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
            whileHover={{ y: -3 }}
            className={`group relative bg-slate-900/80 backdrop-blur-xl hover:bg-slate-850 p-4 rounded-2xl border border-slate-800 hover:border-slate-700 shadow-md ${card.glow} transition-all duration-300 flex flex-col justify-between`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className={`p-2 rounded-xl border ${card.iconBg}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${card.pillBg}`}>
                  {card.pill}
                </span>
              </div>
              <p className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">
                {card.title}
              </p>
            </div>

            <div className="mt-2.5">
              <div className="text-xl font-black text-white tracking-tight">
                {loading ? (
                  <div className="h-7 w-20 bg-slate-800 animate-pulse rounded my-0.5"></div>
                ) : (
                  card.value
                )}
              </div>
              <p className="text-[11px] text-slate-400 truncate mt-0.5 font-medium">{card.subtitle}</p>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};
