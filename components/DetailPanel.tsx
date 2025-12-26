
import React, { useEffect, useState } from 'react';
import { X, Activity, Shield, AlertTriangle, Cpu, Crosshair, FileText, BarChart3 } from 'lucide-react';
import { City } from '../types.ts';

interface DetailPanelProps {
  data: City;
  onClose: () => void;
}

export const DetailPanel: React.FC<DetailPanelProps> = ({ data, onClose }) => {
  const [typedDesc, setTypedDesc] = useState('');

  // Typewriter effect for description
  useEffect(() => {
    setTypedDesc('');
    const fullText = data.description || 'No data available.';
    let i = 0;
    const interval = setInterval(() => {
        setTypedDesc(fullText.substring(0, i + 1));
        i++;
        if (i >= fullText.length) clearInterval(interval);
    }, 20);
    return () => clearInterval(interval);
  }, [data]);

  let icon = <Cpu size={14} className="text-cyan-400" />;
  if (data.faction?.includes('AC')) { icon = <Shield size={14} className="text-pink-400" />; }
  if (data.category === 'ANOMALY') { icon = <AlertTriangle size={14} className="text-red-500" />; }

  const statusColor = data.status?.includes('OPTIMAL') || data.status?.includes('ONLINE') ? 'text-cyan-400' : 'text-red-500';

  return (
    <div className="absolute z-50 w-64 font-mono pointer-events-none
                    top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2
                    md:top-24 md:right-72 md:left-auto md:translate-x-0 md:translate-y-0">
      
      {/* Main Container matching List aesthetics */}
      <div className="pointer-events-auto bg-[#121212]/80 backdrop-blur-sm p-2 border-b border-[#E42737]/50 shadow-[0_0_20px_rgba(0,0,0,0.5)]">
         
         {/* Header */}
         <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#E42737]/20">
            <div className="flex items-center gap-2 text-[#E42737]">
              <FileText size={14} />
              <span className="text-xs font-bold tracking-[0.2em]">ENTITY DATA</span>
            </div>
            <button 
              onClick={onClose}
              className="text-slate-500 hover:text-[#E42737] transition-colors"
            >
              <X size={14} />
            </button>
         </div>

         {/* Content Block */}
         <div className="space-y-3">
            
            {/* Name & ID Block */}
            <div className="bg-[#121212]/60 p-2 border-l-2 border-[#E42737] relative group hover:pl-3 transition-all">
                <div className="flex justify-between items-start">
                    <div>
                        <h2 className="text-sm font-bold text-white tracking-widest">{data.name}</h2>
                        <span className="text-[9px] text-[#E42737] block mt-0.5">ID: {data.faction?.substring(0,3).toUpperCase() || 'UNK'}-{Math.floor(Math.random()*999)}</span>
                    </div>
                    {icon}
                </div>
                {/* Decorative corner */}
                <div className="absolute top-0 right-0 w-1 h-1 bg-[#E42737] opacity-50"></div>
            </div>

            {/* Compact Stats Grid */}
            <div className="grid grid-cols-1 gap-1">
                <div className="bg-[#121212]/40 p-1.5 flex justify-between items-center border-l-2 border-slate-700 hover:border-cyan-500 transition-colors">
                    <span className="text-[9px] text-slate-500 tracking-wider">TYPE</span>
                    <span className="text-[10px] text-slate-300">{data.type || 'N/A'}</span>
                </div>
                <div className="bg-[#121212]/40 p-1.5 flex justify-between items-center border-l-2 border-slate-700 hover:border-cyan-500 transition-colors">
                    <span className="text-[9px] text-slate-500 tracking-wider">POPULATION</span>
                    <span className="text-[10px] text-slate-300">{data.population || '0'}</span>
                </div>
                <div className="bg-[#121212]/40 p-1.5 flex justify-between items-center border-l-2 border-slate-700 hover:border-[#E42737] transition-colors">
                    <span className="text-[9px] text-slate-500 tracking-wider">STATUS</span>
                    <div className="flex items-center gap-1">
                        <Activity size={10} className={statusColor} />
                        <span className={`text-[10px] font-bold ${statusColor}`}>{data.status || 'UNK'}</span>
                    </div>
                </div>
            </div>

            {/* Description Area */}
            <div className="pt-1">
                <div className="flex items-center gap-2 mb-1 opacity-70">
                    <BarChart3 size={10} className="text-[#E42737]" />
                    <span className="text-[9px] text-[#E42737] tracking-widest">INTEL SUMMARY</span>
                </div>
                <div className="text-[10px] text-slate-400 leading-relaxed border-t border-[#E42737]/20 pt-2 min-h-[40px]">
                    {typedDesc}
                    <span className="inline-block w-1 h-3 bg-[#E42737] ml-0.5 animate-pulse align-middle"></span>
                </div>
            </div>

         </div>

         {/* Footer decoration */}
         <div className="h-1 w-full bg-[#E42737]/20 mt-3 flex justify-start">
            <div className="w-1/3 h-full bg-[#E42737]/50"></div>
         </div>
      </div>
    </div>
  );
};
