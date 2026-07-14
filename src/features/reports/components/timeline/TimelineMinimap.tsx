import React, { useState, useRef, useEffect } from 'react';

interface TimelineMinimapProps {
  minTime: number;
  maxTime: number;
  onChange: (startPercent: number, endPercent: number) => void;
}

export default function TimelineMinimap({ minTime, maxTime, onChange }: TimelineMinimapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [startPercent, setStartPercent] = useState(0);
  const [endPercent, setEndPercent] = useState(100);
  const [isDragging, setIsDragging] = useState<'start' | 'end' | null>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return;
      
      const rect = containerRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
      const percent = (x / rect.width) * 100;
      
      if (isDragging === 'start') {
        const newStart = Math.min(percent, endPercent - 5); // min 5% window
        setStartPercent(newStart);
        onChange(newStart, endPercent);
      } else if (isDragging === 'end') {
        const newEnd = Math.max(percent, startPercent + 5);
        setEndPercent(newEnd);
        onChange(startPercent, newEnd);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(null);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, startPercent, endPercent, onChange]);

  const formatTime = (percent: number) => {
    const timeMs = minTime + (maxTime - minTime) * (percent / 100);
    const d = new Date(timeMs);
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center gap-4 mb-4 select-none ml-[200px]">
      <div 
        className="relative flex-1 h-2 bg-emerald-50 rounded-full cursor-crosshair border border-emerald-100"
        ref={containerRef}
      >
        {/* Faixa selecionada */}
        <div 
          className="absolute top-0 bottom-0 bg-emerald-300/50 rounded-full"
          style={{ left: `${startPercent}%`, width: `${endPercent - startPercent}%` }}
        />
        
        {/* Handle Inicial */}
        <div 
          className="absolute top-1/2 w-4 h-4 bg-white border-2 border-sefaz-accent rounded-full -translate-y-1/2 -translate-x-1/2 cursor-ew-resize shadow hover:scale-125 transition-transform z-10 flex items-center justify-center"
          style={{ left: `${startPercent}%` }}
          onMouseDown={() => setIsDragging('start')}
          title={formatTime(startPercent)}
        >
          <div className="w-1 h-2 border-x border-emerald-200" />
        </div>

        {/* Handle Final */}
        <div 
          className="absolute top-1/2 w-4 h-4 bg-white border-2 border-sefaz-accent rounded-full -translate-y-1/2 -translate-x-1/2 cursor-ew-resize shadow hover:scale-125 transition-transform z-10 flex items-center justify-center"
          style={{ left: `${endPercent}%` }}
          onMouseDown={() => setIsDragging('end')}
          title={formatTime(endPercent)}
        >
          <div className="w-1 h-2 border-x border-emerald-200" />
        </div>
      </div>
      <div className="flex gap-2 items-center w-[120px] justify-end shrink-0">
        <span className="text-[10px] font-bold text-sefaz-dark bg-emerald-50 px-2 py-0.5 rounded">{formatTime(startPercent)}</span>
        <span className="text-[10px] font-bold text-sefaz-accent opacity-50">-</span>
        <span className="text-[10px] font-bold text-sefaz-dark bg-emerald-50 px-2 py-0.5 rounded">{formatTime(endPercent)}</span>
      </div>
    </div>
  );
}
