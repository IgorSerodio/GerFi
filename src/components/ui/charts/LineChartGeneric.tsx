import React from "react";
import { LineChart, Line, XAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export interface LineChartGenericProps {
  data: any[];
  xKey: string;
  yKey: string;
  name: string;
  color?: string;
}

export function LineChartGeneric({ data, xKey, yKey, name, color = "#f59e0b" }: LineChartGenericProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ecfdf5" />
        <XAxis dataKey={xKey} axisLine={false} tickLine={false} tick={{ fill: "#065f46", fontSize: 9 }} />
        <Tooltip formatter={(value) => [`${value} min`, name]} />
        <Line type="monotone" dataKey={yKey} name={name} stroke={color} strokeWidth={3} dot={{ r: 4 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}
