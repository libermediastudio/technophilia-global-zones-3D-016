
import React, { useEffect, useState } from 'react';
import { X, Activity } from 'lucide-react';
import { City } from '../../types/index.ts';

interface DetailPanelProps {
  data: City;
  onClose: () => void;
}

export const DetailPanel: React.FC<DetailPanelProps> = ({ data, onClose }) => {
  const [typedDesc, setTypedDesc] = useState('');

  useEffect(() => {
    setTypedDesc('');
    const fullText = data.description || 'No data available.';
    let i = 0;
    const interval = setInterval(() => {
        setTypedDesc(fullText.substring(0, i + 1));
        i++;
        if (i >= fullText.length) clearInterval(interval);
    }, 15);
    return () => clearInterval(interval);
  }, [data]);

  const statusColor = data.status?.includes('OPTIMAL') || data.status?.includes('ONLINE') ? 'text-cyan-400' : 'text-red-500';

  return (
    <div className="absolute z-50 w-[240px] font-mono pointer-events-none top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 md:top-24 md:right-72 md:left-auto md:translate-x-0 md:translate-y-0">
      <div className="pointer-events-auto flex flex-col items-start">
         <div className="w-full flex justify-between items-center mb-4 pb-1 border-b border-white/10">
            <span className="text-[9px] font-black tracking-[0.3em] text-[#E42737]">EXTRACTED.DAT</span>
            <button 
              onClick={onClose} 
              className="bg-[#E42737] text-black hover:bg-white transition-all flex items-center justify-center w-5 h-5 shadow-[0_0_10px_rgba(228,39,55,0.3)]"
            >
              <X size={10} strokeWidth={4} />
            </button>
         </div>

         <div className="w-full space-y-4">
            <div>
                <h2 className="text-sm font-black text-white tracking-widest uppercase">{data.name}</h2>
                <div className="flex items-center gap-2 mt-1">
                    <Activity size={8} className={statusColor} />
                    <span className={`text-[9px] font-bold tracking-widest ${statusColor}`}>{data.status || 'UNK'}</span>
                </div>
            </div>

            <div className="space-y-1 text-[9px] border-l border-white/10 pl-3">
                <div className="flex justify-between">
                    <span className="text-white/20 uppercase">TYPE</span>
                    <span className="text-white/60">{data.type || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-white/20 uppercase">POP</span>
                    <span className="text-white/60">{data.population || '0'}</span>
                </div>
            </div>

            <div className="text-[10px] text-white/50 leading-relaxed font-medium border-t border-white/5 pt-3">
                {typedDesc}
                <span className="inline-block w-1 h-2.5 bg-[#E42737] ml-1 animate-pulse"></span>
            </div>
         </div>
      </div>
    </div>
  );
};
