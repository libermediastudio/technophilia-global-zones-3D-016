
import React, { useState } from 'react';
import { Database, ChevronUp, ChevronDown } from 'lucide-react';

export const Legend: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  const categories = [
    { name: 'ICE NODE', color: '#00FFFF' },
    { name: 'AC POST', color: '#f472b6' },
    { name: 'ANOMALY', color: '#ef4444' },
    { name: 'WILD/CLF', color: '#94a3b8' },
  ];

  return (
    <div className="relative font-mono pointer-events-auto">
        {/* Expanded Content - Positioned Absolute Bottom-Full (Upwards) */}
        {isOpen && (
            <div className="absolute bottom-full left-0 mb-2 w-48 bg-[#121212]/90 backdrop-blur-sm p-2 border border-[#E42737]/50 shadow-[0_0_20px_rgba(0,0,0,0.5)] animate-fade-in">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#E42737]/20">
                    <span className="text-[10px] font-bold tracking-[0.2em] text-[#E42737]">DATA KEY</span>
                </div>
                <div className="space-y-1">
                    {categories.map((cat) => (
                        <div key={cat.name} className="flex items-center space-x-3 p-1">
                            <div className="flex items-center justify-center w-4 h-4">
                                <div 
                                    className="w-2.5 h-2.5 rounded-full shadow-[0_0_5px] border border-white/20"
                                    style={{ backgroundColor: cat.color, boxShadow: `0 0 5px ${cat.color}` }}
                                ></div>
                            </div>
                            <h3 className="text-[9px] text-slate-300 tracking-wider font-bold">{cat.name}</h3>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {/* Toggle Button */}
        <button 
            onClick={() => setIsOpen(!isOpen)}
            className={`
                flex items-center gap-2 px-3 py-3 border transition-all duration-300
                ${isOpen ? 'bg-[#E42737] border-[#E42737] text-black' : 'bg-[#121212] border-[#E42737]/50 text-[#E42737] hover:bg-[#E42737]/10'}
            `}
        >
            <Database size={14} />
            <span className="text-[10px] font-bold tracking-widest hidden sm:inline">LEGEND</span>
            {isOpen ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
        </button>
    </div>
  );
};
