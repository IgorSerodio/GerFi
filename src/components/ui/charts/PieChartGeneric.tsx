import React from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

export interface PieChartGenericProps {
  data: any[];
  nameKey: string;
  valueKey: string;
  colors?: string[];
}

const DEFAULT_COLORS = ["#10b981", "#3b82f6", "#6366f1", "#94a3b8", "#f59e0b", "#ef4444"];

export function PieChartGeneric({ data, nameKey, valueKey, colors = DEFAULT_COLORS }: PieChartGenericProps) {
  const pieData = data.length > 0 ? data : [{ [nameKey]: "Sem dados", [valueKey]: 100 }];

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={pieData}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={5}
          dataKey={valueKey}
          nameKey={nameKey}
        >
          {pieData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            borderRadius: "16px",
            border: "none",
            boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
            fontWeight: 800,
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
