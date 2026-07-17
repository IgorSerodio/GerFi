import React from "react";
import { AreaChart, Area, XAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export interface AreaChartGenericProps {
  data: Record<string, unknown>[];
  xKey: string;
  yKey: string;
  name: string;
  color?: string;
  id?: string;
}

export function AreaChartGeneric({ data, xKey, yKey, name, color = "#10b981", id = "chart" }: AreaChartGenericProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data}>
        <defs>
          <linearGradient id={`colorTotal-${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.1} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ecfdf5" />
        <XAxis dataKey={xKey} axisLine={false} tickLine={false} tick={{ fill: "#065f46", fontSize: 9 }} />
        <Tooltip formatter={(value) => [value, name]} />
        <Area type="monotone" dataKey={yKey} name={name} stroke={color} strokeWidth={3} fill={`url(#colorTotal-${id})`} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
