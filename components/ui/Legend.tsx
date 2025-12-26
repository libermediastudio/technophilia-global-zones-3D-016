
import React, { useState } from 'react';
import { ChevronUp, ChevronDown, List } from 'lucide-react';

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
        {/* Expanded Content */}
        {isOpen && (
            <div className="absolute bottom-full left-0 mb-2 w-48 bg-[#121212]/95 backdrop-blur-xl p-3 border border-[#E42737]/50 shadow-[0_0_30px_rgba(0,0,0,0.8)] animate-fade-in z-[110]">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#E42737]/20">
                    <span className="text-[10px] font-bold tracking-[0.2em] text-[#E42737]">DATA KEY</span>
                </div>
                <div className="space-y-2">
                    {categories.map((cat) => (
                        <div key={cat.name} className="flex items-center space-x-3">
                            <div className="flex items-center justify-center w-4 h-4">
                                <div 
                                    className="w-2.5 h-2.5 rounded-full border border-white/20"
                                    style={{ backgroundColor: cat.color, boxShadow: `0 0 8px ${cat.color}` }}
                                ></div>
                            </div>
                            <h3 className="text-[9px] text-slate-300 tracking-wider font-bold">{cat.name}</h3>
                        </div>
                    ))}
                </div>
            </div>
        )}

        <button 
            onClick={() => setIsOpen(!isOpen)}
            className={`
                flex items-center justify-center w-12 h-12 transition-all duration-300 border
                ${isOpen ? 'bg-[#E42737] border-[#E42737] text-black shadow-[0_0_20px_#E42737]' : 'bg-[#121212]/90 border-[#E42737]/60 text-[#E42737] hover:bg-[#E42737]/10'}
            `}
        >
            <span className="text-[10px] font-black tracking-widest uppercase">{isOpen ? 'CLOSE' : 'KEY'}</span>
        </button>
    </div>
  );
};
