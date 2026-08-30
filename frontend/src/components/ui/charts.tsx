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
    ? { top: 10, right: 30, left: 10, bottom: 10 }
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
  radius = [4, 4, 0, 0],
  yAxisId,
  lineCap,
  children,
}: {
  dataKey: string;
  fill?: string;
  name?: string;
  radius?: any;
  yAxisId?: string;
  lineCap?: string;
  children?: React.ReactNode;
}) => {
  const ctx = useContext(ChartContext);
  let finalRadius = radius;
  if (lineCap === 'round') {
    finalRadius = ctx.layout === 'vertical' ? [0, 6, 6, 0] : [6, 6, 0, 0];
  }
  return (
    <RechartsBar dataKey={dataKey} fill={fill} name={name || dataKey} radius={finalRadius} yAxisId={yAxisId}>
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
  tick = { fontSize: 10 },
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
  tick = { fontSize: 10 },
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
  stroke = '#f1f5f9',
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
  contentStyle = { backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' },
}: {
  formatter?: any;
  contentStyle?: any;
}) => {
  return <RechartsTooltip formatter={formatter} contentStyle={contentStyle} />;
};

export const ChartLegend = ({ wrapperStyle = { fontSize: '11px', paddingTop: '8px' } }: { wrapperStyle?: any }) => {
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
