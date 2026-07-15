import React from 'react';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function TimelineScrubber({ timelineData, onDateSelect }) {
  if (!timelineData || timelineData.length === 0) return null;

  // Group data by year
  const grouped = timelineData.reduce((acc, curr) => {
    if (!acc[curr.year]) acc[curr.year] = [];
    acc[curr.year].push(curr);
    return acc;
  }, {});

  const years = Object.keys(grouped).sort((a, b) => b - a);

  return (
    <div className="fixed right-0 top-1/2 -translate-y-1/2 z-[40] w-12 py-8 flex flex-col items-center pointer-events-none">
      <div className="bg-black/60 backdrop-blur-xl rounded-l-2xl border-y border-l border-white/5 py-4 px-1.5 flex flex-col gap-6 pointer-events-auto max-h-[80vh] overflow-y-auto no-scrollbar shadow-2xl">
        {years.map(year => (
          <div key={year} className="flex flex-col items-center gap-1.5 group cursor-pointer relative" onClick={() => onDateSelect(year)}>
            <span className="text-[10px] font-black text-white/40 group-hover:text-primary transition-colors tracking-tighter" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
              {year}
            </span>
            <div className="flex flex-col gap-1.5 py-1">
              {grouped[year].sort((a,b) => b.month - a.month).map((m) => (
                <div 
                  key={m.month}
                  onClick={(e) => { e.stopPropagation(); onDateSelect(year, m.month); }}
                  className="w-1.5 h-1.5 rounded-full bg-white/20 hover:bg-primary hover:scale-150 transition-all relative group/month"
                >
                  {/* Tooltip for the month */}
                  <div className="absolute right-full mr-4 top-1/2 -translate-y-1/2 opacity-0 group-hover/month:opacity-100 pointer-events-none transition-all duration-200 bg-surface border border-white/10 px-2 py-1 rounded shadow-2xl translate-x-2 group-hover/month:translate-x-0">
                    <span className="text-[11px] font-bold text-white whitespace-nowrap">{MONTHS[m.month - 1]} {year}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
