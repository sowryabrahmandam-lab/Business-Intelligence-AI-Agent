'use client';

import React from 'react';
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
          <div key={i} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm animate-pulse flex flex-col justify-between">
            <div className="h-6 w-40 bg-slate-200 rounded"></div>
            <div className="h-48 bg-slate-100 rounded-xl"></div>
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
    <div className="space-y-4 overflow-y-auto max-h-[calc(100vh-210px)] pr-1">
      {/* Top Gauges Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase">Collection Efficiency</p>
            <p className="text-lg font-bold text-slate-900">{gauges.collection_efficiency_pct}%</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase">Project Delivery Rate</p>
            <p className="text-lg font-bold text-slate-900">{gauges.delivery_rate_pct}%</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase">Active In-Progress</p>
            <p className="text-lg font-bold text-slate-900">{gauges.active_count} Projects</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-red-200 bg-red-50/40 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center font-bold">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-red-600 uppercase">Delayed Projects</p>
            <p className="text-lg font-bold text-red-900">{gauges.delayed_count} Critical</p>
          </div>
        </div>
      </div>

      {/* Grid of 4 Core Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 1. Composed Chart: Sector Comparison (Bars + Line) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-sm font-bold text-slate-900">Sector Performance (Composed Chart)</h4>
              <p className="text-xs text-slate-500">Pipeline Value vs Billed Revenue vs Active Projects</p>
            </div>
            <TrendingUp className="w-4 h-4 text-blue-600" />
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={sectors} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                <Grid horizontal strokeDasharray="3 3" />
                <BarXAxis dataKey="sector" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" />
                <BarYAxis yAxisId="left" tickFormatter={formatCurrency} />
                <BarYAxis yAxisId="right" orientation="right" />
                <ChartTooltip
                  formatter={(val: any, name?: any) =>
                    name === 'Active Projects' ? [val, name || ''] : [formatCurrency(Number(val)), name || '']
                  }
                />
                <ChartLegend />
                <Bar yAxisId="left" dataKey="pipeline" name="Pipeline (₹)" fill="#3b82f6" lineCap="round" />
                <Bar yAxisId="left" dataKey="billed" name="Billed (₹)" fill="#10b981" lineCap="round" />
                <Line yAxisId="right" type="monotone" dataKey="activeProjects" name="Active Projects" stroke="#f59e0b" strokeWidth={2.5} dot={{ r: 4 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 2. Revenue & Cash Flow Funnel Chart */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-sm font-bold text-slate-900">Revenue & Cash Conversion Funnel</h4>
              <p className="text-xs text-slate-500">Lifecycle from Pipeline to Cash Collected</p>
            </div>
            <Activity className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="h-64 w-full">
            <BarChart data={funnel} layout="vertical" margin={{ top: 10, right: 20, left: 30, bottom: 10 }}>
              <Grid horizontal strokeDasharray="3 3" />
              <BarXAxis tickFormatter={formatCurrency} />
              <BarYAxis dataKey="stage" tick={{ fontSize: 10 }} />
              <ChartTooltip formatter={(val: any) => [formatCurrency(Number(val)), 'Value']} />
              <Bar dataKey="value" name="Amount (₹)" lineCap="round">
                {funnel.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </div>
        </div>

        {/* 3. Work Order Execution Status (Ring / Donut Chart) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-sm font-bold text-slate-900">Operations & Work Order Status (Ring Chart)</h4>
              <p className="text-xs text-slate-500">Distribution of 176 Work Orders</p>
            </div>
            <PieIcon className="w-4 h-4 text-purple-600" />
          </div>
          <div className="h-64 w-full flex items-center justify-center">
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
                <ChartTooltip formatter={(val: any) => [`${val} orders`, 'Count']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 4. Top Accounts by Receivables Exposure */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-sm font-bold text-slate-900">Top Accounts with Overdue Receivables</h4>
              <p className="text-xs text-slate-500">Highest Outstanding Balances (AR Priority)</p>
            </div>
            <Users className="w-4 h-4 text-amber-600" />
          </div>
          <div className="h-64 w-full">
            <BarChart data={topAccounts} layout="vertical" margin={{ top: 10, right: 20, left: 30, bottom: 10 }}>
              <Grid horizontal strokeDasharray="3 3" />
              <BarXAxis tickFormatter={formatCurrency} />
              <BarYAxis dataKey="account" tick={{ fontSize: 10 }} />
              <ChartTooltip formatter={(val: any) => [formatCurrency(Number(val)), 'Outstanding Receivable']} />
              <Bar dataKey="receivable" fill="#f59e0b" lineCap="round" />
            </BarChart>
          </div>
        </div>
      </div>
    </div>
  );
};
