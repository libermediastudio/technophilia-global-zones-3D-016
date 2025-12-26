
import React from 'react';
import { X } from 'lucide-react';

interface ExitButtonProps {
  onDeactivate: () => void;
}

export const ExitButton: React.FC<ExitButtonProps> = ({ onDeactivate }) => {
  return (
    <div className="fixed z-[999999] pointer-events-none animate-fade-in"
         style={{ 
           top: 'max(1rem, env(safe-area-inset-top))', 
           right: 'max(1rem, env(safe-area-inset-right))' 
         }}>
        <div className="flex items-center gap-2 md:gap-4">
            <div className="hidden sm:flex flex-col items-end">
                <span className="text-[10px] text-[#E42737] font-black tracking-[0.2em]">MISSION ACTIVE</span>
                <span className="text-[8px] text-slate-500 font-mono">ENCRYPTED LINK</span>
            </div>
            <button 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onDeactivate();
              }}
              className="flex items-center justify-center w-8 h-8 md:w-12 md:h-12 bg-[#E42737] text-black shadow-[0_0_20px_rgba(228,39,55,0.4)] transition-all hover:scale-110 active:scale-90 pointer-events-auto border border-white/20"
              title="Terminate session"
            >
              <X className="w-4 h-4 md:w-6 md:h-6" strokeWidth={3} />
            </button>
        </div>
    </div>
  );
};
