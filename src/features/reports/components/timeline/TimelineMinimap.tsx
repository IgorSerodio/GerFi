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
    <div className="flex items-center mb-8 select-none ml-[200px] mr-[16px] mt-6 gap-4">
      <span className="text-[10px] font-bold text-sefaz-accent opacity-50 uppercase shrink-0">
        {formatTime(0)}
      </span>
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
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-20 flex flex-col items-center cursor-ew-resize group"
          style={{ left: `${startPercent}%` }}
          onMouseDown={() => setIsDragging('start')}
        >
          {/* Label Flutuante */}
          <div className="absolute bottom-full mb-1 flex flex-col items-center">
            <div className="bg-sefaz-dark text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm whitespace-nowrap transition-transform group-hover:scale-110">
              {formatTime(startPercent)}
            </div>
            <div className="w-0 h-0 border-l-[4px] border-r-[4px] border-t-[4px] border-l-transparent border-r-transparent border-t-sefaz-dark"></div>
          </div>
          
          <div className="w-4 h-4 bg-white border-2 border-sefaz-accent rounded-full shadow transition-transform group-hover:scale-125 flex items-center justify-center">
            <div className="w-1 h-2 border-x border-emerald-200" />
          </div>
        </div>

        {/* Handle Final */}
        <div 
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-20 flex flex-col items-center cursor-ew-resize group"
          style={{ left: `${endPercent}%` }}
          onMouseDown={() => setIsDragging('end')}
        >
          {/* Label Flutuante */}
          <div className="absolute bottom-full mb-1 flex flex-col items-center">
            <div className="bg-sefaz-dark text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm whitespace-nowrap transition-transform group-hover:scale-110">
              {formatTime(endPercent)}
            </div>
            <div className="w-0 h-0 border-l-[4px] border-r-[4px] border-t-[4px] border-l-transparent border-r-transparent border-t-sefaz-dark"></div>
          </div>
          
          <div className="w-4 h-4 bg-white border-2 border-sefaz-accent rounded-full shadow transition-transform group-hover:scale-125 flex items-center justify-center">
            <div className="w-1 h-2 border-x border-emerald-200" />
          </div>
        </div>
      </div>
      <span className="text-[10px] font-bold text-sefaz-accent opacity-50 uppercase shrink-0">
        {formatTime(100)}
      </span>
    </div>
  );
}
