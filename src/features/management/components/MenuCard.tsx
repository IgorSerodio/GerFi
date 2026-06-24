import React from "react";
import { ArrowLeft } from "lucide-react";

interface MenuCardProps {
  onClick: () => void;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  disabled?: boolean;
}

export default function MenuCard({ onClick, title, description, icon, color, disabled }: MenuCardProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`group relative flex flex-col p-8 bg-white rounded-[40px] shadow-sm border border-emerald-100/50 hover:border-emerald-500/50 hover:shadow-2xl hover:shadow-emerald-950/5 transition-all duration-500 overflow-hidden text-left w-full cursor-pointer disabled:opacity-40 disabled:pointer-events-none`}
    >
      <div
        className={`w-16 h-16 ${color} rounded-2xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-500 mb-6`}
      >
        {icon}
      </div>

      <h3 className="text-2xl font-black text-sefaz-dark tracking-tighter leading-none mb-3 group-hover:text-emerald-600 transition-colors uppercase">
        {title}
      </h3>
      <p className="text-xs text-sefaz-accent font-medium opacity-60 leading-relaxed">
        {description}
      </p>

      <div className="absolute bottom-8 right-8 opacity-0 group-hover:opacity-100 -translate-x-4 group-hover:translate-x-0 transition-all duration-500">
        <ArrowLeft className="h-6 w-6 text-emerald-500 rotate-180" />
      </div>
    </button>
  );
}
