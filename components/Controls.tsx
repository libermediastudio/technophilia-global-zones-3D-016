
import React, { useState } from 'react';
import { MousePointer2, Move, ZoomIn, Command, ChevronUp, ChevronDown } from 'lucide-react';

export const Controls: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative font-mono pointer-events-auto">
        {/* Expanded Content */}
        {isOpen && (
            <div className="absolute bottom-full left-0 mb-2 w-56 bg-[#121212]/90 backdrop-blur-sm p-2 border border-[#E42737]/50 shadow-[0_0_20px_rgba(0,0,0,0.5)] animate-fade-in">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#E42737]/20">
                    <span className="text-[10px] font-bold tracking-[0.2em] text-[#E42737]">INSTRUCTION</span>
                </div>
                <div className="space-y-1">
                    <div className="flex items-center gap-3 p-1">
                        <Move size={12} className="text-[#E42737]" />
                        <span className="text-[9px] text-slate-300 tracking-wider">DRAG TO ROTATE</span>
                    </div>
                    <div className="flex items-center gap-3 p-1">
                        <ZoomIn size={12} className="text-[#E42737]" />
                        <span className="text-[9px] text-slate-300 tracking-wider">SCROLL TO ZOOM</span>
                    </div>
                    <div className="flex items-center gap-3 p-1">
                        <MousePointer2 size={12} className="text-[#E42737]" />
                        <span className="text-[9px] text-slate-300 tracking-wider">HOVER/CLICK TARGET</span>
                    </div>
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
            <Command size={14} />
            <span className="text-[10px] font-bold tracking-widest hidden sm:inline">GUIDE</span>
            {isOpen ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
        </button>
    </div>
  );
};
