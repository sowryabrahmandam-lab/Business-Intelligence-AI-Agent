'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  BarChart,
  Bar,
  BarXAxis,
  BarYAxis,
  Grid,
  ChartTooltip,
  ChartLegend,
  ComposedChart,
  Line,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from '@bklitui/ui/charts';
import { TrendingUp, PieChart as PieIcon, Users, Activity, CheckCircle, Clock } from 'lucide-react';

interface VisualAnalyticsProps {
  data: any;
  loading: boolean;
}

export const VisualAnalytics: React.FC<VisualAnalyticsProps> = ({ data, loading }) => {
  if (loading || !data) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-[calc(100vh-220px)] min-h-[500px]">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-slate-900/80 rounded-2xl p-6 border border-slate-800 shadow-md animate-pulse flex flex-col justify-between">
            <div className="h-6 w-40 bg-slate-800 rounded"></div>
            <div className="h-48 bg-slate-850 rounded-xl"></div>
          </div>
        ))}
      </div>
    );
  }

  const formatCurrency = (val: number) => {
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(1)}Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
    return `₹${val.toLocaleString('en-IN')}`;
  };

  const sectors = data.sectors || [];
  const funnel = data.funnel || [];
  const executionPie = data.execution_breakdown || [];
  const topAccounts = data.top_ar_accounts || [];
  const gauges = data.gauges || {};

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="space-y-4 overflow-y-auto max-h-[calc(100vh-215px)] pr-1"
    >
      {/* Top Gauges Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <motion.div
          whileHover={{ y: -2 }}
          className="bg-slate-900/85 backdrop-blur-xl p-4 rounded-2xl border border-slate-800 shadow-md flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-500/15 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Collection Efficiency</p>
            <p className="text-lg font-black text-white">{gauges.collection_efficiency_pct}%</p>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ y: -2 }}
          className="bg-slate-900/85 backdrop-blur-xl p-4 rounded-2xl border border-slate-800 shadow-md flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Project Delivery Rate</p>
            <p className="text-lg font-black text-white">{gauges.delivery_rate_pct}%</p>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ y: -2 }}
          className="bg-slate-900/85 backdrop-blur-xl p-4 rounded-2xl border border-slate-800 shadow-md flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-xl bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-bold">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active In-Progress</p>
            <p className="text-lg font-black text-white">{gauges.active_count} Projects</p>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ y: -2 }}
          className="bg-slate-900/85 backdrop-blur-xl p-4 rounded-2xl border border-rose-500/30 shadow-md flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-xl bg-rose-500/15 text-rose-400 border border-rose-500/30 flex items-center justify-center font-bold">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-rose-400 uppercase tracking-wider">Delayed Projects</p>
            <p className="text-lg font-black text-rose-300">{gauges.delayed_count} Critical</p>
          </div>
        </motion.div>
      </div>

      {/* Grid of 4 Core Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 1. Composed Chart: Sector Comparison (Bars + Line) */}
        <div className="bg-slate-900/85 backdrop-blur-xl p-5 rounded-2xl border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h4 className="text-sm font-bold text-white">Sector Performance (Composed Chart)</h4>
              <p className="text-xs text-slate-400">Pipeline Value vs Billed Revenue vs Active Projects</p>
            </div>
            <TrendingUp className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={sectors} margin={{ top: 10, right: 15, left: 10, bottom: 25 }}>
                <Grid horizontal stroke="#334155" strokeDasharray="3 3" />
                <BarXAxis dataKey="sector" tick={{ fontSize: 10, fill: '#94a3b8' }} angle={-20} textAnchor="end" />
                <BarYAxis yAxisId="left" tickFormatter={formatCurrency} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <BarYAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <ChartTooltip
                  formatter={(val: any, name?: any) =>
                    name === 'Active Projects' ? [val, name || ''] : [formatCurrency(Number(val)), name || '']
                  }
                />
                <ChartLegend wrapperStyle={{ fontSize: '11px', paddingTop: '8px', color: '#cbd5e1' }} />
                <Bar yAxisId="left" dataKey="pipeline" name="Pipeline (₹)" fill="#6366f1" barSize={16} lineCap="round" />
                <Bar yAxisId="left" dataKey="billed" name="Billed (₹)" fill="#10b981" barSize={16} lineCap="round" />
                <Line yAxisId="right" type="monotone" dataKey="activeProjects" name="Active Projects" stroke="#f59e0b" strokeWidth={2.5} dot={{ r: 4 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 2. Revenue & Cash Flow Funnel Chart */}
        <div className="bg-slate-900/85 backdrop-blur-xl p-5 rounded-2xl border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h4 className="text-sm font-bold text-white">Revenue & Cash Conversion Funnel</h4>
              <p className="text-xs text-slate-400">Lifecycle from Pipeline to Cash Collected</p>
            </div>
            <Activity className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="h-72 w-full">
            <BarChart data={funnel} layout="vertical" height={280} margin={{ top: 10, right: 30, left: 110, bottom: 25 }}>
              <Grid horizontal={false} vertical={true} stroke="#334155" strokeDasharray="3 3" />
              <BarXAxis type="number" tickFormatter={formatCurrency} tick={{ fontSize: 10, fill: '#94a3b8' }} />
              <BarYAxis type="category" dataKey="stage" width={110} tick={{ fontSize: 11, fill: '#cbd5e1' }} />
              <ChartTooltip formatter={(val: any) => [formatCurrency(Number(val)), 'Value']} />
              <Bar dataKey="value" name="Amount (₹)" barSize={18} lineCap="round">
                {funnel.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </div>
        </div>

        {/* 3. Work Order Execution Status (Ring / Donut Chart) */}
        <div className="bg-slate-900/85 backdrop-blur-xl p-5 rounded-2xl border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h4 className="text-sm font-bold text-white">Operations & Work Order Status (Ring Chart)</h4>
              <p className="text-xs text-slate-400">Distribution of 176 Work Orders</p>
            </div>
            <PieIcon className="w-4 h-4 text-purple-400" />
          </div>
          <div className="h-72 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={executionPie}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  label={({ name, percent }: any) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`}
                  labelLine={false}
                >
                  {executionPie.map((entry: any, index: number) => (
                    <Cell key={`pie-cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <ChartTooltip
                  formatter={(val: any) => [`${val} orders`, 'Count']}
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: '1px solid #334155', color: '#fff', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 4. Top Accounts by Receivables Exposure */}
        <div className="bg-slate-900/85 backdrop-blur-xl p-5 rounded-2xl border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h4 className="text-sm font-bold text-white">Top Accounts with Overdue Receivables</h4>
              <p className="text-xs text-slate-400">Highest Outstanding Balances (AR Priority)</p>
            </div>
            <Users className="w-4 h-4 text-amber-400" />
          </div>
          <div className="h-72 w-full">
            <BarChart data={topAccounts} layout="vertical" height={280} margin={{ top: 10, right: 30, left: 110, bottom: 25 }}>
              <Grid horizontal={false} vertical={true} stroke="#334155" strokeDasharray="3 3" />
              <BarXAxis type="number" tickFormatter={formatCurrency} tick={{ fontSize: 10, fill: '#94a3b8' }} />
              <BarYAxis type="category" dataKey="account" width={110} tick={{ fontSize: 11, fill: '#cbd5e1' }} />
              <ChartTooltip formatter={(val: any) => [formatCurrency(Number(val)), 'Outstanding Receivable']} />
              <Bar dataKey="receivable" fill="#f59e0b" barSize={18} lineCap="round" />
            </BarChart>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
