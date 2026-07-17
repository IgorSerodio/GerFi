import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Filter, Search, X } from "lucide-react";
import { CustomDatePicker } from "@/components/ui/CustomDatePicker";
import { DateRange } from "@/features/reports/hooks/useLogisticsData";
import { Location } from "@/features/queue/types";
import { User } from "@/features/users/types";

interface LogisticsFilterBarProps {
  activeView: "charts" | "timeline";
  range: DateRange;
  setRange: (r: DateRange) => void;
  timelineDate: string;
  setTimelineDate: (d: string) => void;
  locationId: number | "all";
  setLocationId: (l: number | "all") => void;
  locations: Location[];
  attendants: string[];
  setAttendants: React.Dispatch<React.SetStateAction<string[]>>;
  users: User[];
}

export function LogisticsFilterBar({
  activeView,
  range,
  setRange,
  timelineDate,
  setTimelineDate,
  locationId,
  setLocationId,
  locations,
  attendants,
  setAttendants,
  users,
}: LogisticsFilterBarProps) {
  const [attendantSearch, setAttendantSearch] = useState("");
  const [isAttendantDropdownOpen, setIsAttendantDropdownOpen] = useState(false);
  const attendantDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (attendantDropdownRef.current && !attendantDropdownRef.current.contains(event.target as Node)) {
        setIsAttendantDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
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
  );
}
