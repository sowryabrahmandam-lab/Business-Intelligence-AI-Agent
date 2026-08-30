'use client';

import React, { createContext, useContext } from 'react';
import {
  ResponsiveContainer,
  BarChart as RechartsBarChart,
  Bar as RechartsBar,
  XAxis as RechartsXAxis,
  YAxis as RechartsYAxis,
  CartesianGrid as RechartsGrid,
  Tooltip as RechartsTooltip,
  Legend as RechartsLegend,
  ComposedChart as RechartsComposedChart,
  Line as RechartsLine,
  Area as RechartsArea,
  PieChart as RechartsPieChart,
  Pie as RechartsPie,
  Cell as RechartsCell,
} from 'recharts';

interface ChartContextProps {
  xDataKey?: string;
  data?: any[];
  layout?: 'horizontal' | 'vertical';
}

const ChartContext = createContext<ChartContextProps>({});

export const BarChart = ({
  data,
  xDataKey,
  children,
  layout = 'horizontal',
  height = 280,
  margin,
  className = '',
}: {
  data: any[];
  xDataKey?: string;
  children: React.ReactNode;
  layout?: 'horizontal' | 'vertical';
  height?: number | string;
  margin?: any;
  className?: string;
}) => {
  const defaultMargin = layout === 'vertical'
    ? { top: 10, right: 25, left: 105, bottom: 20 }
    : { top: 10, right: 10, left: 10, bottom: 25 };

  return (
    <ChartContext.Provider value={{ data, xDataKey, layout }}>
      <div className={`w-full ${className}`} style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <RechartsBarChart data={data} layout={layout} margin={margin || defaultMargin}>
            {children}
          </RechartsBarChart>
        </ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  );
};

export const Bar = ({
  dataKey,
  fill = '#3b82f6',
  name,
  radius,
  yAxisId,
  barSize = 16,
  lineCap,
  children,
}: {
  dataKey: string;
  fill?: string;
  name?: string;
  radius?: any;
  yAxisId?: string;
  barSize?: number;
  lineCap?: string;
  children?: React.ReactNode;
}) => {
  const ctx = useContext(ChartContext);
  let finalRadius = radius;
  if (!finalRadius) {
    finalRadius = ctx.layout === 'vertical' ? [0, 6, 6, 0] : [6, 6, 0, 0];
  }
  return (
    <RechartsBar
      dataKey={dataKey}
      fill={fill}
      name={name || dataKey}
      radius={finalRadius}
      yAxisId={yAxisId}
      barSize={barSize}
    >
      {children}
    </RechartsBar>
  );
};

export const BarXAxis = ({
  dataKey,
  type,
  tickFormatter,
  angle,
  textAnchor,
  tick = { fontSize: 10, fill: '#94a3b8' },
}: {
  dataKey?: string;
  type?: 'number' | 'category';
  tickFormatter?: (val: any) => string;
  angle?: number;
  textAnchor?: any;
  tick?: any;
}) => {
  const ctx = useContext(ChartContext);
  const isVertical = ctx.layout === 'vertical';
  const finalType = type || (isVertical ? 'number' : 'category');
  const finalDataKey = dataKey || (isVertical ? undefined : ctx.xDataKey);

  return (
    <RechartsXAxis
      type={finalType}
      dataKey={finalDataKey}
      tickFormatter={tickFormatter}
      angle={angle}
      textAnchor={textAnchor}
      tick={tick}
    />
  );
};

export const BarYAxis = ({
  dataKey,
  type,
  width = 110,
  tickFormatter,
  orientation = 'left',
  yAxisId = 'left',
  tick = { fontSize: 11, fill: '#cbd5e1' },
}: {
  dataKey?: string;
  type?: 'number' | 'category';
  width?: number;
  tickFormatter?: (val: any) => string;
  orientation?: 'left' | 'right';
  yAxisId?: string;
  tick?: any;
}) => {
  const ctx = useContext(ChartContext);
  const isVertical = ctx.layout === 'vertical';
  const finalType = type || (isVertical ? 'category' : 'number');

  return (
    <RechartsYAxis
      type={finalType}
      dataKey={dataKey}
      width={isVertical ? width : undefined}
      tickFormatter={tickFormatter}
      orientation={orientation}
      yAxisId={yAxisId}
      tick={tick}
    />
  );
};

export const Grid = ({
  horizontal = true,
  vertical = false,
  strokeDasharray = '3 3',
  stroke = '#334155',
}: {
  horizontal?: boolean;
  vertical?: boolean;
  strokeDasharray?: string;
  stroke?: string;
}) => {
  return (
    <RechartsGrid
      horizontal={horizontal}
      vertical={vertical}
      strokeDasharray={strokeDasharray}
      stroke={stroke}
    />
  );
};

export const ChartTooltip = ({
  formatter,
  labelFormatter,
  contentStyle = { backgroundColor: '#0f172a', borderRadius: '12px', border: '1px solid #334155', color: '#fff', fontSize: '12px' },
}: {
  formatter?: any;
  labelFormatter?: any;
  contentStyle?: any;
}) => {
  const customLabelFormatter = (label: any, payload?: any) => {
    if (labelFormatter) return labelFormatter(label, payload);
    if (payload && payload.length > 0) {
      const item = payload[0].payload;
      return item?.stage || item?.account || item?.sector || label;
    }
    return label;
  };

  return (
    <RechartsTooltip
      formatter={formatter}
      labelFormatter={customLabelFormatter}
      contentStyle={contentStyle}
    />
  );
};

export const ChartLegend = ({ wrapperStyle = { fontSize: '11px', paddingTop: '8px', color: '#cbd5e1' } }: { wrapperStyle?: any }) => {
  return <RechartsLegend wrapperStyle={wrapperStyle} />;
};

export {
  RechartsComposedChart as ComposedChart,
  RechartsLine as Line,
  RechartsArea as Area,
  RechartsPieChart as PieChart,
  RechartsPie as Pie,
  RechartsCell as Cell,
  ResponsiveContainer,
};
