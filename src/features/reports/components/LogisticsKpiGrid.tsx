import React from "react";
import { Activity, Clock, BarChart3 } from "lucide-react";
import { DashboardData } from "@/features/reports/hooks/useLogisticsData";

interface LogisticsKpiGridProps {
  data: DashboardData | null | undefined;
}

export function LogisticsKpiGrid({ data }: LogisticsKpiGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard
        icon={<Activity />}
        value={data?.stats.total ?? 0}
        label="Volume Total"
        color="bg-emerald-500"
      />
      <StatCard
        icon={<Clock />}
        value={data?.stats.avgWait ?? "0min"}
        label="Tempo Médio de Espera"
        color="bg-blue-500"
      />
      <StatCard
        icon={<Clock />}
        value={data?.stats.avgService ?? "0min"}
        label="Tempo Médio de Atend."
        color="bg-purple-500"
      />
      <StatCard
        icon={<BarChart3 />}
        value={data?.stats.efficiency ?? "0%"}
        label="Eficiência"
        color="bg-indigo-500"
      />
    </div>
  );
}

function StatCard({
  icon,
  value,
  label,
  color,
}: {
  icon: React.ReactNode;
  value: string | number;
  label: string;
  color: string;
}) {
  return (
    <div className="bg-white p-6 rounded-[32px] border border-emerald-100 shadow-sm flex items-center gap-4 group hover:shadow-xl hover:shadow-emerald-950/5 transition-all">
      <div
        className={`w-12 h-12 shrink-0 ${color} text-white shadow-lg rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform`}
      >
        {icon}
      </div>
      <div>
        <p className="text-3xl font-black text-sefaz-dark leading-none mb-1">{value}</p>
        <p className="text-[10px] text-sefaz-accent font-black uppercase tracking-widest opacity-60 leading-tight">
          {label}
        </p>
      </div>
    </div>
  );
}
