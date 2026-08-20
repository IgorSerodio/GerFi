import React from "react";
import { motion } from "motion/react";
import { Ticket } from "@/features/queue/types";
import { getPriorityTextColorClass } from "@/utils/priorityVisuals";

interface TvActiveCallProps {
  currentCall: Ticket;
  ticketWindows?: { name: string; alias?: string | null; label?: string | null }[];
}

export default function TvActiveCall({ currentCall, ticketWindows }: TvActiveCallProps) {
  const currentWindow = ticketWindows?.find(w => w.name === currentCall.guicheName);
  const displayGuiche = currentCall.guicheAlias || currentCall.guicheName;
  const guicheLabel = currentWindow?.label || (displayGuiche?.toLowerCase().includes("guichê") ? "GUICHÊ" : "LOCAL");

  return (
    <motion.div
      key={`call-${currentCall.id}`}
      initial={{ opacity: 0, scale: 0.9, y: 50 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 1.1, y: -50 }}
      transition={{ type: "spring", damping: 15 }}
      className="absolute inset-0 z-50 flex flex-col items-center justify-center text-center bg-white rounded-[60px]"
      style={{ padding: "4cqh 8cqh", gap: "2.5cqh" }}
    >
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex items-center justify-center font-black uppercase tracking-[0.4em] drop-shadow-sm text-emerald-900"
        style={{ fontSize: "min(3.2cqh, 2cqw)", gap: "1.5cqh" }}
      >
        <div
          className="bg-red-500 rounded-full animate-ping"
          style={{ width: "2cqh", height: "2cqh" }}
        />
        <span>SENHA CHAMADA</span>
      </motion.div>

      <div
        className={`relative leading-none font-black tracking-tighter ${getPriorityTextColorClass(currentCall.priority, "text-emerald-950")} ${currentCall.priority === "Prioritário" ? "drop-shadow-[0_20px_50px_rgba(220,38,38,0.3)]" : "drop-shadow-[0_20px_50px_rgba(6,78,59,0.3)]"}`}
        style={{ fontSize: "min(28cqh, 12cqw)" }}
      >
        {currentCall.ticketNumber}
      </div>

      <div
        className="w-full max-w-lg bg-emerald-100 rounded-full overflow-hidden"
        style={{
          height: "1.2cqh",
          marginTop: "0.5cqh",
          marginBottom: "1.5cqh",
        }}
      >
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: "100%" }}
          transition={{ duration: 0.8 }}
          className="h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
        />
      </div>

      <div className="flex items-center" style={{ gap: "8cqh" }}>
        <div className="flex flex-col items-center">
          <span
            className="font-black text-emerald-600/40 uppercase tracking-[0.3em]"
            style={{ fontSize: "min(3.5cqh, 2.2cqw)", marginBottom: "0.8cqh" }}
          >
            DIRIJA-SE AO
          </span>
          <div
            className="flex items-baseline bg-emerald-950 text-white shadow-xl"
            style={{
              gap: "1.5cqh",
              padding: "2cqh 6cqh",
              borderRadius: "4cqh",
            }}
          >
            <span
              className="font-light tracking-widest opacity-60 uppercase"
              style={{ fontSize: "min(4cqh, 2.5cqw)" }}
            >
              {guicheLabel}
            </span>
            <span
              className="font-black leading-none tracking-tighter uppercase whitespace-nowrap"
              style={{ fontSize: displayGuiche?.toLowerCase().includes("guichê") ? "min(14cqh, 8cqw)" : "min(8cqh, 5cqw)", maxWidth: "50cqw", overflow: "hidden", textOverflow: "ellipsis" }}
            >
              {displayGuiche?.toLowerCase().includes("guichê") 
                ? (displayGuiche.split(" ")[1] || "01")
                : displayGuiche}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
