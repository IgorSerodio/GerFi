import React from "react";
import { ChevronRight, Lock, ArrowLeft } from "lucide-react";

interface FeatureCardProps {
  onClick: () => void;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  layout?: "horizontal" | "vertical";
  needsLock?: boolean;
  disabled?: boolean;
}

export function FeatureCard({
  onClick,
  title,
  description,
  icon,
  color,
  layout = "horizontal",
  needsLock = false,
  disabled = false,
}: FeatureCardProps) {
  const isHorizontal = layout === "horizontal";
  const activeColor = disabled ? "bg-slate-200 text-slate-400 shadow-none" : `${color} text-white shadow-lg`;
  const showLock = needsLock || disabled;

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`group relative p-8 rounded-[32px] border transition-all duration-500 overflow-hidden text-left w-full flex ${
        isHorizontal ? "flex-row items-center" : "flex-col"
      } ${
        disabled
          ? "bg-slate-50/80 border-slate-200/50 cursor-not-allowed opacity-80 pointer-events-none"
          : "bg-white shadow-sm border-emerald-100/50 hover:border-emerald-500/50 hover:shadow-2xl hover:shadow-emerald-950/5 cursor-pointer"
      }`}
    >
      <div
        className={`flex-shrink-0 w-16 h-16 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-500 ${activeColor} ${
          isHorizontal ? "mr-6" : "mb-6"
        }`}
      >
        {icon}
      </div>

      <div className={isHorizontal ? "flex-1" : ""}>
        <div className={`flex items-center gap-2 ${!isHorizontal ? "mb-3" : "mb-1"}`}>
          <h3 className={`text-2xl font-black tracking-tighter leading-none transition-colors uppercase ${disabled ? "text-slate-400" : "text-sefaz-dark group-hover:text-emerald-600"}`}>
            {title}
          </h3>
          {showLock && <Lock size={12} className={disabled ? "text-slate-400" : "text-sefaz-accent/30"} />}
        </div>
        <p className={`text-sm text-sefaz-accent font-medium opacity-60 ${!isHorizontal ? "leading-relaxed" : "line-clamp-1"}`}>
          {description}
        </p>
      </div>

      {isHorizontal ? (
        <div className="ml-4 opacity-0 group-hover:opacity-100 -translate-x-4 group-hover:translate-x-0 transition-all duration-500">
          <ChevronRight className="h-6 w-6 text-emerald-500" />
        </div>
      ) : (
        <div className="absolute bottom-8 right-8 opacity-0 group-hover:opacity-100 -translate-x-4 group-hover:translate-x-0 transition-all duration-500">
          <ArrowLeft className="h-6 w-6 text-emerald-500 rotate-180" />
        </div>
      )}
    </button>
  );
}
