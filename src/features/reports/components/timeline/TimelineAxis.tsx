import React from 'react';

export default function TimelineAxis({ minTime, maxTime }: { minTime: number, maxTime: number }) {
  const duration = maxTime - minTime;
  const hours = [];
  
  // Create an array of hour marks
  const startHour = new Date(minTime).getHours();
  const endHour = new Date(maxTime).getHours() + 1; // plus 1 to cover the end
  
  for (let h = startHour; h <= endHour; h++) {
    const markTime = new Date(minTime);
    markTime.setHours(h, 0, 0, 0);
    const timeMs = markTime.getTime();
    if (timeMs >= minTime && timeMs <= maxTime) {
      hours.push(timeMs);
    }
  }

  return (
    <div className="relative h-8 border-b border-emerald-100 mb-4 ml-[200px]">
      {hours.map(time => {
        const percent = ((time - minTime) / duration) * 100;
        const d = new Date(time);
        return (
          <div 
            key={time} 
            className="absolute top-0 bottom-0 border-l border-emerald-100 flex flex-col items-center -translate-x-1/2"
            style={{ left: `${percent}%` }}
          >
            <span className="text-[9px] font-black text-sefaz-accent opacity-50 mt-1 uppercase">
              {d.getHours().toString().padStart(2, '0')}:00
            </span>
          </div>
        );
      })}
    </div>
  );
}
