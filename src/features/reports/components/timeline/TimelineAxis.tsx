import React from 'react';

export default function TimelineAxis({ minTime, maxTime }: { minTime: number, maxTime: number }) {
  const duration = maxTime - minTime;
  
  const min1 = 60 * 1000;
  const min5 = 5 * min1;
  const min10 = 10 * min1;
  const min15 = 15 * min1;
  const min30 = 30 * min1;
  
  // target roughly 12 marks
  const targetStep = duration / 12;
  
  let stepMinutes = 60;
  if (targetStep <= min1) stepMinutes = 1;
  else if (targetStep <= min5) stepMinutes = 5;
  else if (targetStep <= min10) stepMinutes = 10;
  else if (targetStep <= min15) stepMinutes = 15;
  else if (targetStep <= min30) stepMinutes = 30;
  else stepMinutes = 60;

  const marks = [];
  
  const d = new Date(minTime);
  // Arredonda para baixo para o múltiplo mais próximo do step (ex: se step é 15, e hora é 14:23, vira 14:15)
  const currentMinutes = d.getMinutes();
  const alignedMinutes = Math.floor(currentMinutes / stepMinutes) * stepMinutes;
  d.setMinutes(alignedMinutes, 0, 0);
  
  let currentMark = d.getTime();
  
  while (currentMark <= maxTime) {
    if (currentMark >= minTime) {
      marks.push(currentMark);
    }
    currentMark += stepMinutes * 60 * 1000;
  }

  return (
    <div className="relative h-8 border-b border-emerald-100 mb-4 ml-[200px]">
      {marks.map(time => {
        const percent = ((time - minTime) / duration) * 100;
        const dateObj = new Date(time);
        const label = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        return (
          <div 
            key={time} 
            className="absolute top-0 bottom-0 border-l border-emerald-100 flex flex-col items-center -translate-x-1/2"
            style={{ left: `${percent}%` }}
          >
            <span className="text-[9px] font-black text-sefaz-accent opacity-50 mt-1 uppercase">
              {label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
