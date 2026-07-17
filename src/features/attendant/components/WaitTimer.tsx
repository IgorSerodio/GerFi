import React, { useState, useEffect } from "react";
import { Clock } from "lucide-react";
import { getDiffInMs } from "@/utils/timeUtils";

interface WaitTimerProps {
  createdAt: string;
  calledAt?: string;
  expectedTimeNormal: number;
  expectedTimePriority: number;
  priority: "Normal" | "Prioritário";
  className?: string;
}

export default function WaitTimer({
  createdAt,
  calledAt,
  expectedTimeNormal,
  expectedTimePriority,
  priority,
  className = "",
}: WaitTimerProps) {
  const [now, setNow] = useState(() => Date.now());

  const elapsedMs = getDiffInMs(createdAt, calledAt || now);

  useEffect(() => {
    if (!calledAt) {
      const interval = setInterval(() => {
        setNow(Date.now());
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [calledAt]);

  const expectedTimeMinutes = priority === "Prioritário" ? expectedTimePriority : expectedTimeNormal;
  const expectedMs = expectedTimeMinutes * 60 * 1000;

  const totalSeconds = Math.floor(elapsedMs / 1000);
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  const timeStr = `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;

  let colorClass = "text-emerald-500";
  let bgClass = "bg-emerald-50 border-emerald-200";

  if (elapsedMs <= expectedMs / 3) {
    colorClass = "text-emerald-600";
    bgClass = "bg-emerald-50 border-emerald-200";
  } else if (elapsedMs <= (expectedMs / 3) * 2) {
    colorClass = "text-yellow-600";
    bgClass = "bg-yellow-50 border-yellow-200";
  } else if (elapsedMs <= expectedMs) {
    colorClass = "text-orange-600";
    bgClass = "bg-orange-50 border-orange-200";
  } else {
    colorClass = "text-red-600 animate-pulse";
    bgClass = "bg-red-50 border-red-200";
  }

  return (
    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full border ${bgClass} ${colorClass} ${className}`}>
      <Clock size={12} />
      <span className="text-[10px] font-black font-mono tracking-wider">{timeStr}</span>
    </div>
  );
}
