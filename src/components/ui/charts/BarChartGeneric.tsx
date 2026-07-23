import React from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

export interface BarChartGenericProps {
  data: Record<string, unknown>[];
  xKey: string;
  yKey: string;
  name: string;
  color?: string;
}

export function BarChartGeneric({ data, xKey, yKey, name, color = "#3b82f6" }: BarChartGenericProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ecfdf5" />
        <XAxis dataKey={xKey} axisLine={false} tickLine={false} tick={{ fill: "#065f46", fontSize: 9 }} />
        <YAxis axisLine={false} tickLine={false} tick={{ fill: "#065f46", fontSize: 9 }} />
        <Tooltip formatter={(value) => [value, name]} />
        <Legend wrapperStyle={{ fontSize: 10, color: "#065f46" }} />
        <Bar dataKey={yKey} name={name} fill={color} radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
