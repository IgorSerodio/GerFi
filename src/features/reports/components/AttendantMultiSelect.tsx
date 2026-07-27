import React, { useState, useRef, useEffect } from "react";
import { User } from "@/features/users/types";
import { motion, AnimatePresence } from "motion/react";
import { Search, X } from "lucide-react";

interface AttendantMultiSelectProps {
  users: User[];
  selectedAttendants: string[];
  onChange: (attendants: string[]) => void;
}

export function AttendantMultiSelect({
  users,
  selectedAttendants,
  onChange,
}: AttendantMultiSelectProps) {
  const [attendantSearch, setAttendantSearch] = useState("");
  const [isAttendantDropdownOpen, setIsAttendantDropdownOpen] = useState(false);
  const attendantDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        attendantDropdownRef.current &&
        !attendantDropdownRef.current.contains(event.target as Node)
      ) {
        setIsAttendantDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="space-y-2 relative" ref={attendantDropdownRef}>
      <label className="text-[10px] font-black text-sefaz-accent uppercase tracking-widest pl-2 font-display">
        Servidores
      </label>

      <div className="w-full p-2 bg-emerald-50/50 rounded-2xl border border-emerald-100 min-h-[56px] flex flex-wrap gap-2 items-center">
        {selectedAttendants.map((attName) => (
          <div
            key={attName}
            className="flex items-center gap-1 bg-sefaz-accent text-white px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-tight"
          >
            {attName}
            <button
              onClick={() =>
                onChange(selectedAttendants.filter((a) => a !== attName))
              }
              className="ml-1 hover:text-emerald-200 cursor-pointer"
            >
              <X size={12} />
            </button>
          </div>
        ))}

        <div className="flex-1 min-w-[120px] flex items-center gap-2 px-2">
          <Search size={14} className="text-emerald-400" />
          <input
            type="text"
            value={attendantSearch}
            onChange={(e) => {
              setAttendantSearch(e.target.value);
              setIsAttendantDropdownOpen(true);
            }}
            onFocus={() => setIsAttendantDropdownOpen(true)}
            placeholder={
              selectedAttendants.length === 0
                ? "Buscar servidor..."
                : "Adicionar mais..."
            }
            className="w-full bg-transparent outline-none font-bold text-xs text-sefaz-dark placeholder:text-emerald-300"
          />
        </div>
      </div>

      <AnimatePresence>
        {isAttendantDropdownOpen && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="absolute z-10 w-full mt-2 bg-white border border-emerald-100 rounded-2xl shadow-xl max-h-[250px] overflow-y-auto custom-scrollbar"
          >
            {users
              .filter(
                (u) =>
                  !selectedAttendants.includes(u.name) &&
                  (u.name.toLowerCase().includes(attendantSearch.toLowerCase()) ||
                    u.matricula
                      ?.toLowerCase()
                      .includes(attendantSearch.toLowerCase()))
              )
              .map((user) => (
                <button
                  key={user.id}
                  onClick={() => {
                    onChange([...selectedAttendants, user.name]);
                    setAttendantSearch("");
                    setIsAttendantDropdownOpen(false);
                  }}
                  className="w-full text-left px-4 py-3 hover:bg-emerald-50/50 border-b border-emerald-50 last:border-0 transition-colors cursor-pointer"
                >
                  <div className="text-xs font-black text-sefaz-dark uppercase tracking-tight">
                    {user.name}
                  </div>
                  <div className="text-[10px] font-bold text-sefaz-accent opacity-60 mt-0.5">
                    Matrícula: {user.matricula}
                  </div>
                </button>
              ))}
            {users.filter(
              (u) =>
                !selectedAttendants.includes(u.name) &&
                (u.name.toLowerCase().includes(attendantSearch.toLowerCase()) ||
                  u.matricula
                    ?.toLowerCase()
                    .includes(attendantSearch.toLowerCase()))
            ).length === 0 && (
              <div className="px-4 py-4 text-xs font-bold text-center text-sefaz-accent opacity-60">
                Nenhum servidor encontrado
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
