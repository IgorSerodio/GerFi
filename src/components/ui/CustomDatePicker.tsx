"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface CustomDatePickerProps {
  value: string;
  onChange: (date: string) => void;
  disabled?: boolean;
}

const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

const DAYS = ["D", "S", "T", "Q", "Q", "S", "S"];

export function CustomDatePicker({ value, onChange, disabled = false }: CustomDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  const initialDate = value ? new Date(`${value}T12:00:00`) : new Date();
  const [currentMonth, setCurrentMonth] = useState(initialDate.getMonth());
  const [currentYear, setCurrentYear] = useState(initialDate.getFullYear());
  
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(y => y - 1);
    } else {
      setCurrentMonth(m => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(y => y + 1);
    } else {
      setCurrentMonth(m => m + 1);
    }
  };

  const generateDays = () => {
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    
    const days = [];
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    return days;
  };

  const handleSelectDate = (day: number) => {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    onChange(dateStr);
    setIsOpen(false);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "Selecionar Data";
    const [year, month, day] = dateString.split("-");
    return `${day}/${month}/${year}`;
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className="bg-white px-4 py-2 rounded-xl text-[10px] font-black text-sefaz-dark border-2 border-emerald-50 outline-none hover:border-sefaz-accent focus:border-sefaz-accent uppercase tracking-widest cursor-pointer flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed min-w-[140px] justify-between"
      >
        <div className="flex items-center gap-2">
          <CalendarIcon size={14} className="text-sefaz-accent" />
          {formatDate(value)}
        </div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 mt-2 bg-white rounded-2xl shadow-xl border border-emerald-100 p-4 z-50 w-64"
          >
            <div className="flex justify-between items-center mb-4">
              <button onClick={handlePrevMonth} className="p-1 hover:bg-emerald-50 rounded-lg text-emerald-700 transition-colors cursor-pointer">
                <ChevronLeft size={16} />
              </button>
              <div className="text-xs font-black text-sefaz-dark uppercase tracking-widest">
                {MONTHS[currentMonth]} {currentYear}
              </div>
              <button onClick={handleNextMonth} className="p-1 hover:bg-emerald-50 rounded-lg text-emerald-700 transition-colors cursor-pointer">
                <ChevronRight size={16} />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-2">
              {DAYS.map((day, i) => (
                <div key={i} className="text-center text-[10px] font-bold text-emerald-400">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {generateDays().map((day, i) => {
                if (!day) return <div key={`empty-${i}`} className="p-1" />;
                
                const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const isSelected = value === dateStr;
                const isToday = new Date().toISOString().split('T')[0] === dateStr;

                return (
                  <button
                    key={i}
                    onClick={() => handleSelectDate(day)}
                    className={`relative w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all cursor-pointer ${
                      isSelected
                        ? "bg-sefaz-accent text-white shadow-md shadow-emerald-500/30"
                        : isToday
                        ? "bg-emerald-50 text-emerald-700"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
