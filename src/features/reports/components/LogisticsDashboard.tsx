"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  BarChart3,
  TrendingUp,
  Users,
  Clock,
  Activity,
  PieChart as PieIcon,
  LineChart as LineIcon,
  BarChart as BarIcon,
  Filter,
  Search,
  X,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  ResponsiveContainer,
} from "recharts";
import { getLogisticsDashboardDataAction, getReportFiltersDataAction } from "@/features/reports/actions";
import { CustomDatePicker } from "@/components/ui/CustomDatePicker";
import { Location } from "@/features/queue/types";
import { User } from "@/features/users/types";
import { useRef } from "react";
import TimelineView from "./timeline/TimelineView";

type ChartType = "bar" | "line" | "area" | "pie";
type MetricType = "tickets" | "wait_time" | "atendimentos";
type DateRange = "today" | "week" | "month" | "year";

interface DashboardData {
  stats: {
    total: number;
    avgWait: string;
    efficiency: string;
  };
  chartData: Array<{ name: string; value: number }>;
  categoryAggregation: Array<{ name: string; count: number; value: number }>;
  attendantRanking: Array<{ name: string; count: number; avgDuration: number; rating: number }>;
}

export default function LogisticsDashboard({ showHeader = false }: { showHeader?: boolean }) {
  const [chartType, setChartType] = useState<ChartType>("bar");
  const [metric, setMetric] = useState<MetricType>("tickets");
  const [range, setRange] = useState<DateRange>("today");
  const [locationId, setLocationId] = useState<number | "all">("all");
  const [attendants, setAttendants] = useState<string[]>([]);
  
  const [locations, setLocations] = useState<Location[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  
  const [attendantSearch, setAttendantSearch] = useState("");
  const [isAttendantDropdownOpen, setIsAttendantDropdownOpen] = useState(false);
  const attendantDropdownRef = useRef<HTMLDivElement>(null);

  const [activeView, setActiveView] = useState<"charts" | "timeline">("timeline");
  const [timelineDate, setTimelineDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<DashboardData | null>(null);

  const fetchData = React.useCallback(async () => {
    setIsLoading(true);
    const res = await getLogisticsDashboardDataAction(range, metric, locationId, attendants);
    if (res.success && res.data) {
      setData(res.data as DashboardData);
    }
    setIsLoading(false);
  }, [range, metric, locationId, attendants]);

  useEffect(() => {
    const loadFilters = async () => {
      const res = await getReportFiltersDataAction();
      if (res.success && res.data) {
        setLocations(res.data.locations);
        setUsers(res.data.users);
      }
    };
    loadFilters();

    const handleClickOutside = (event: MouseEvent) => {
      if (attendantDropdownRef.current && !attendantDropdownRef.current.contains(event.target as Node)) {
        setIsAttendantDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    setTimeout(() => {
      fetchData();
    }, 0);
  }, [fetchData]);

  // Sincronização em tempo real via Server-Sent Events (SSE)
  useEffect(() => {
    const eventSource = new EventSource("/api/queue/stream");
    
    eventSource.onmessage = () => {
      // heartbeats
    };

    eventSource.addEventListener("update", () => {
      setTimeout(() => {
        fetchData();
      }, 0);
    });

    return () => {
      eventSource.close();
    };
  }, [fetchData]);

  const COLORS = ["#10b981", "#3b82f6", "#6366f1", "#94a3b8"];

  const handleRefresh = () => {
    fetchData();
  };

  const renderChart = () => {
    if (!data || data.chartData.length === 0) {
      return (
        <div className="flex h-full w-full items-center justify-center text-xs font-bold text-emerald-800 uppercase tracking-widest">
          Nenhum dado disponível
        </div>
      );
    }

    if (chartType === "pie") {
      const pieData = data.categoryAggregation.length > 0
        ? data.categoryAggregation
        : [{ name: "Sem dados", value: 100 }];
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
              dataKey="value"
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
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

    if (chartType === "line") {
      return (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data.chartData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ecfdf5" />
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#065f46", fontSize: 10, fontWeight: 700 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#065f46", fontSize: 10, fontWeight: 700 }}
            />
            <Tooltip
              contentStyle={{
                borderRadius: "16px",
                border: "none",
                boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
                fontWeight: 800,
              }}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#10b981"
              strokeWidth={4}
              dot={{ r: 4, fill: "#10b981" }}
            />
          </LineChart>
        </ResponsiveContainer>
      );
    }

    if (chartType === "area") {
      return (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data.chartData}>
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ecfdf5" />
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#065f46", fontSize: 10, fontWeight: 700 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#065f46", fontSize: 10, fontWeight: 700 }}
            />
            <Tooltip
              contentStyle={{
                borderRadius: "16px",
                border: "none",
                boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
                fontWeight: 800,
              }}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#10b981"
              fillOpacity={1}
              fill="url(#colorValue)"
              strokeWidth={3}
            />
          </AreaChart>
        </ResponsiveContainer>
      );
    }

    return (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data.chartData}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ecfdf5" />
          <XAxis
            dataKey="name"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#065f46", fontSize: 10, fontWeight: 700 }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#065f46", fontSize: 10, fontWeight: 700 }}
          />
          <Tooltip
            cursor={{ fill: "#f0fdf4" }}
            contentStyle={{
              borderRadius: "16px",
              border: "none",
              boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
              fontWeight: 800,
            }}
          />
          <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    );
  };

  return (
    <div className="space-y-8">
      {showHeader && (
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-sefaz-dark tracking-tighter uppercase leading-none">
              Inteligência Logística
            </h1>
            <p className="text-sefaz-accent font-bold opacity-60 uppercase tracking-widest text-[10px] mt-1">
              Gestão de Fluxo e Atendimento
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleRefresh}
              className="px-5 py-2.5 bg-sefaz-accent text-white rounded-xl font-bold text-xs shadow-lg shadow-emerald-900/20 flex items-center gap-2 hover:bg-sefaz-dark transition-all active:scale-95"
            >
              <Activity size={16} className={isLoading ? "animate-spin" : ""} /> Atualizar
            </button>
          </div>
        </header>
      )}

      {/* Dynamic Filters Bar */}
      <section className="bg-white p-4 rounded-[32px] border border-emerald-100 shadow-sm flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2 px-4 border-r border-emerald-50">
          <Filter size={14} className="text-sefaz-accent opacity-40" />
          <span className="text-[10px] font-black text-sefaz-accent uppercase tracking-widest">
            Filtros:
          </span>
        </div>

        {activeView === "charts" ? (
          <select
            value={range}
            onChange={(e) => setRange(e.target.value as DateRange)}
            className="bg-white px-4 py-2 rounded-xl text-[10px] font-black text-sefaz-dark border-2 border-emerald-50 outline-none focus:border-sefaz-accent uppercase tracking-widest cursor-pointer"
          >
            <option value="today">Período: Hoje</option>
            <option value="week">Período: Esta Semana</option>
            <option value="month">Período: Este Mês</option>
            <option value="year">Período: Anual</option>
          </select>
        ) : (
          <CustomDatePicker
            value={timelineDate}
            onChange={setTimelineDate}
          />
        )}

        <select
          value={locationId}
          onChange={(e) => setLocationId(e.target.value === "all" ? "all" : Number(e.target.value))}
          className="bg-white px-4 py-2 rounded-xl text-[10px] font-black text-sefaz-dark border-2 border-emerald-50 outline-none focus:border-sefaz-accent uppercase tracking-widest cursor-pointer"
        >
          <option value="all">Local: Todos</option>
          {locations.map((loc) => (
            <option key={loc.id} value={loc.id}>
              Local: {loc.name}
            </option>
          ))}
        </select>

        <div className="relative" ref={attendantDropdownRef}>
          <div className="bg-white px-2 py-1.5 rounded-xl border-2 border-emerald-50 focus-within:border-sefaz-accent flex items-center min-w-[200px] max-w-[300px]">
            {attendants.length > 0 ? (
              <div className="flex gap-1 overflow-x-auto custom-scrollbar items-center flex-1 mr-2">
                {attendants.map((attName) => (
                  <div key={attName} className="flex items-center gap-1 bg-emerald-100 text-sefaz-dark px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase tracking-tight whitespace-nowrap">
                    {attName}
                    <button 
                      onClick={() => setAttendants(prev => prev.filter(a => a !== attName))}
                      className="ml-1 hover:text-emerald-700 cursor-pointer"
                    >
                      <X size={10} />
                    </button>
                  </div>
                ))}
              </div>
            ) : null}
            
            <div className="flex items-center flex-1">
              {attendants.length === 0 && <Search size={14} className="text-emerald-400 mr-2" />}
              <input
                type="text"
                value={attendantSearch}
                onChange={(e) => {
                  setAttendantSearch(e.target.value);
                  setIsAttendantDropdownOpen(true);
                }}
                onFocus={() => setIsAttendantDropdownOpen(true)}
                placeholder={attendants.length === 0 ? "Servidor..." : "..."}
                className="w-full bg-transparent outline-none font-black text-[10px] text-sefaz-dark placeholder:text-emerald-300 uppercase tracking-widest min-w-[60px]"
              />
            </div>
          </div>

          <AnimatePresence>
            {isAttendantDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="absolute z-10 w-[250px] mt-2 bg-white border border-emerald-100 rounded-xl shadow-xl max-h-[200px] overflow-y-auto custom-scrollbar left-0"
              >
                {users
                  .filter(u => 
                    !attendants.includes(u.name) && 
                    (u.name.toLowerCase().includes(attendantSearch.toLowerCase()) || 
                     u.matricula?.toLowerCase().includes(attendantSearch.toLowerCase()))
                  )
                  .map((user) => (
                    <button
                      key={user.id}
                      onClick={() => {
                        setAttendants(prev => [...prev, user.name]);
                        setAttendantSearch("");
                        setIsAttendantDropdownOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-emerald-50/50 border-b border-emerald-50 last:border-0 transition-colors cursor-pointer"
                    >
                      <div className="text-[10px] font-bold text-sefaz-dark uppercase tracking-tight">{user.name}</div>
                      <div className="text-[9px] font-medium text-sefaz-accent opacity-60">Matrícula: {user.matricula}</div>
                    </button>
                  ))}
                {users.filter(u => !attendants.includes(u.name) && (u.name.toLowerCase().includes(attendantSearch.toLowerCase()) || u.matricula?.toLowerCase().includes(attendantSearch.toLowerCase()))).length === 0 && (
                  <div className="px-3 py-2 text-[10px] text-center text-sefaz-accent opacity-60">
                    Nenhum servidor encontrado
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* View Toggle */}
      <div className="flex bg-emerald-50/50 p-1 rounded-xl w-fit">
        <button
          onClick={() => setActiveView("timeline")}
          className={`px-6 py-2.5 rounded-lg text-xs font-black uppercase tracking-tight transition-all ${
            activeView === "timeline"
              ? "bg-sefaz-accent text-white shadow-md"
              : "text-sefaz-accent opacity-60 hover:opacity-100"
          }`}
        >
          Linha do Tempo
        </button>
        <button
          onClick={() => setActiveView("charts")}
          className={`px-6 py-2.5 rounded-lg text-xs font-black uppercase tracking-tight transition-all ${
            activeView === "charts"
              ? "bg-sefaz-accent text-white shadow-md"
              : "text-sefaz-accent opacity-60 hover:opacity-100"
          }`}
        >
          Visão Geral
        </button>
      </div>

      {activeView === "timeline" ? (
        <div className="bg-white p-8 rounded-[40px] shadow-sm border border-emerald-100 relative min-h-[450px]">
          <h3 className="text-xl font-black text-sefaz-dark uppercase tracking-tight mb-6">
            Linha do Tempo de Atendimentos
          </h3>
          <TimelineView locationId={locationId} attendants={attendants} users={users} dateStr={timelineDate} />
        </div>
      ) : (
        <>
          {/* Main Stats Summary */}
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
          label="Tempo Médio"
          color="bg-blue-500"
        />
        <StatCard
          icon={<BarChart3 />}
          value={data?.stats.efficiency ?? "0%"}
          label="Eficiência"
          color="bg-indigo-500"
        />
        <StatCard icon={<Users />} value="Online" label="Sincronismo" color="bg-amber-500" />
      </div>

      {/* Main Visualization Area */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <motion.div
          layout
          className="xl:col-span-2 bg-white p-8 rounded-[40px] shadow-sm border border-emerald-100 relative min-h-[450px]"
        >
          <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-10 gap-4">
            <div>
              <h3 className="text-xl font-black text-sefaz-dark uppercase tracking-tight">
                Evolução do Atendimento
              </h3>
              <p className="text-[10px] font-bold text-sefaz-accent opacity-50 uppercase tracking-widest">
                Baseado nos filtros selecionados
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex bg-emerald-50/50 p-1 rounded-xl">
                {(["tickets", "wait_time", "atendimentos"] as MetricType[]).map((m) => (
                  <button
                    key={m}
                    onClick={() => setMetric(m)}
                    className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-tight transition-all ${
                      metric === m
                        ? "bg-sefaz-accent text-white shadow-md"
                        : "text-sefaz-accent opacity-60 hover:opacity-100"
                    }`}
                  >
                    {m === "tickets" ? "Senhas" : m === "wait_time" ? "T. Espera" : "Concluídos"}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <ChartTypeBtn
                  active={chartType === "bar"}
                  onClick={() => setChartType("bar")}
                  icon={<BarIcon size={16} />}
                  title="Barras"
                />
                <ChartTypeBtn
                  active={chartType === "line"}
                  onClick={() => setChartType("line")}
                  icon={<LineIcon size={16} />}
                  title="Linha"
                />
                <ChartTypeBtn
                  active={chartType === "area"}
                  onClick={() => setChartType("area")}
                  icon={<TrendingUp size={16} />}
                  title="Área"
                />
                <ChartTypeBtn
                  active={chartType === "pie"}
                  onClick={() => setChartType("pie")}
                  icon={<PieIcon size={16} />}
                  title="Pizza"
                />
              </div>
            </div>
          </div>

          <div
            className={`h-[350px] w-full transition-opacity duration-300 ${
              isLoading ? "opacity-20" : "opacity-100"
            }`}
          >
            {renderChart()}
          </div>

          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-10 h-10 border-4 border-emerald-100 border-t-sefaz-accent rounded-full animate-spin" />
            </div>
          )}
        </motion.div>

        <div className="bg-white p-8 rounded-[40px] shadow-sm border border-emerald-100 h-full">
          <h3 className="text-xl font-black text-sefaz-dark mb-6 uppercase tracking-tight">
            Ranking de Serviços
          </h3>
          <div className="space-y-4">
            {data?.categoryAggregation.map((item, i) => (
              <div key={item.name} className="flex flex-col gap-1.5">
                <div className="flex justify-between text-[10px] font-black text-sefaz-accent uppercase tracking-widest">
                  <span>{item.name}</span>
                  <span>{item.value}%</span>
                </div>
                <div className="h-3 bg-emerald-50 rounded-full overflow-hidden border border-emerald-100/50">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${item.value}%` }}
                    className={`h-full ${COLORS[i % COLORS.length]} rounded-full`}
                  />
                </div>
              </div>
            ))}
            {(!data || data.categoryAggregation.length === 0) && (
              <div className="py-12 text-center text-[10px] font-black text-sefaz-accent opacity-20 uppercase tracking-widest">
                Aguardando Dados...
              </div>
            )}
          </div>

          <div className="mt-8 p-6 bg-emerald-50/50 rounded-3xl border border-emerald-100/50">
            <h4 className="text-[10px] font-black text-sefaz-dark uppercase tracking-widest mb-2 flex items-center gap-2">
              <Activity size={12} className="text-sefaz-accent" /> Insights do Dia
            </h4>
            <p className="text-[11px] text-sefaz-accent font-medium leading-relaxed">
              {data && data.categoryAggregation.length > 0 ? (
                <>
                  O serviço de{" "}
                  <strong className="text-sefaz-dark">
                    {data.categoryAggregation[0].name}
                  </strong>{" "}
                  representa a maior demanda atual ({data.categoryAggregation[0].value}%).
                  {parseInt(data.stats.avgWait.replace("min", "")) > 15 ? (
                    <span className="text-amber-700">
                      {" "}
                      Recomendamos reforçar os guichês devido ao alto tempo de espera.
                    </span>
                  ) : (
                    <span> O fluxo está sendo processado com eficiência satisfatória.</span>
                  )}
                </>
              ) : (
                "O sistema está aguardando os primeiros atendimentos do dia para gerar insights automáticos."
              )}
            </p>
          </div>
        </div>
        </div>
        </>
      )}
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
    <div className="bg-white p-6 rounded-[32px] border border-emerald-100 shadow-sm flex items-center gap-6 group hover:shadow-xl hover:shadow-emerald-950/5 transition-all">
      <div
        className={`w-14 h-14 ${color} text-white rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}
      >
        {icon}
      </div>
      <div>
        <p className="text-3xl font-black text-sefaz-dark leading-none mb-1">{value}</p>
        <p className="text-[10px] text-sefaz-accent font-black uppercase tracking-widest opacity-60 leading-none">
          {label}
        </p>
      </div>
    </div>
  );
}

function ChartTypeBtn({
  active,
  onClick,
  icon,
  title,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
        active
          ? "bg-sefaz-accent text-white shadow-md scale-110"
          : "bg-white text-sefaz-accent border border-emerald-100 hover:bg-emerald-50"
      }`}
    >
      {icon}
    </button>
  );
}
