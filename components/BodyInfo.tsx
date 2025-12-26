
import React from 'react';
import { Wind, Users, Thermometer, ArrowDown, Globe, Info } from 'lucide-react';
import { CelestialBodyConfig } from '../types.ts';

interface BodyInfoProps {
  config: CelestialBodyConfig;
}

export const BodyInfo: React.FC<BodyInfoProps> = ({ config }) => {
  return (
    <div className="absolute top-24 left-6 w-64 pointer-events-none z-30 font-mono hidden md:block">
        {/* Container matching DetailPanel aesthetics */}
        <div className="pointer-events-auto bg-[#121212]/80 backdrop-blur-sm p-2 border-b border-[#E42737]/50 shadow-[0_0_20px_rgba(0,0,0,0.5)]">
            
            {/* Header */}
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#E42737]/20">
                <div className="flex items-center gap-2 text-[#E42737]">
                  <Globe size={14} />
                  <span className="text-xs font-bold tracking-[0.2em]">SYSTEM INFO</span>
                </div>
            </div>

            <div className="space-y-3">
                
                {/* Name Block */}
                <div className="bg-[#121212]/60 p-2 border-l-2 border-[#E42737] relative">
                    <div className="flex justify-between items-start">
                        <div>
                            <h2 className="text-sm font-bold text-white tracking-widest">{config.name}</h2>
                            <span className="text-[9px] text-[#E42737] block mt-0.5 uppercase">{config.type}</span>
                        </div>
                    </div>
                    {/* Decorative corner */}
                    <div className="absolute top-0 right-0 w-1 h-1 bg-[#E42737] opacity-50"></div>
                </div>

                {/* Compact Stats Grid */}
                {config.stats && (
                    <div className="grid grid-cols-1 gap-1">
                        <div className="bg-[#121212]/40 p-1.5 flex justify-between items-center border-l-2 border-slate-700 hover:border-cyan-500 transition-colors">
                            <div className="flex items-center gap-2 text-slate-500">
                                <Users size={10} />
                                <span className="text-[9px] tracking-wider">POPULATION</span>
                            </div>
                            <span className="text-[10px] text-[#00FFFF] tracking-widest">{config.stats.population}</span>
                        </div>
                        
                        <div className="bg-[#121212]/40 p-1.5 flex justify-between items-center border-l-2 border-slate-700 hover:border-white transition-colors">
                            <div className="flex items-center gap-2 text-slate-500">
                                <Thermometer size={10} />
                                <span className="text-[9px] tracking-wider">TEMP</span>
                            </div>
                            <span className="text-[10px] text-white tracking-widest">{config.stats.temperature}</span>
                        </div>

                        <div className="bg-[#121212]/40 p-1.5 flex justify-between items-center border-l-2 border-slate-700 hover:border-slate-400 transition-colors">
                            <div className="flex items-center gap-2 text-slate-500">
                                <ArrowDown size={10} />
                                <span className="text-[9px] tracking-wider">GRAVITY</span>
                            </div>
                            <span className="text-[10px] text-slate-300 tracking-widest">{config.stats.gravity}</span>
                        </div>

                        <div className="bg-[#121212]/40 p-1.5 flex justify-between items-center border-l-2 border-slate-700 hover:border-slate-400 transition-colors">
                            <div className="flex items-center gap-2 text-slate-500">
                                <Wind size={10} />
                                <span className="text-[9px] tracking-wider">ATMO</span>
                            </div>
                            <span className="text-[10px] text-slate-300 tracking-widest">{config.stats.atmosphere}</span>
                        </div>
                    </div>
                )}

                {/* Description */}
                <div className="pt-1">
                    <div className="flex items-center gap-2 mb-1 opacity-70">
                        <Info size={10} className="text-[#E42737]" />
                        <span className="text-[9px] text-[#E42737] tracking-widest">DESCRIPTION</span>
                    </div>
                    <div className="text-[10px] text-slate-400 leading-relaxed border-t border-[#E42737]/20 pt-2">
                        {config.description || "Data corrupted."}
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
