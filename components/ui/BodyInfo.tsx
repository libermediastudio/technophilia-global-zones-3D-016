
import React from 'react';
import { Wind, Users, Thermometer, ArrowDown } from 'lucide-react';
import { CelestialBodyConfig } from '../../types/index.ts';

interface BodyInfoProps {
  config: CelestialBodyConfig;
  isVisible?: boolean;
}

export const BodyInfo: React.FC<BodyInfoProps> = ({ config, isVisible = true }) => {
  if (!isVisible) return null;

  return (
    <div className="absolute top-24 left-2 md:left-10 w-[46%] sm:w-[240px] pointer-events-none z-30 font-mono animate-fade-in">
        <div className="flex flex-col items-start">
            {/* Panel Title */}
            <div className="mb-2">
               <span className="text-[8px] md:text-[9px] font-black tracking-[0.2em] md:tracking-[0.4em] text-[#E42737] uppercase">SYSTEM_INFO</span>
            </div>

            <div className="mb-4">
                <h2 className="text-xs md:text-sm font-black text-white tracking-[0.1em] md:tracking-[0.2em] uppercase leading-none truncate max-w-full">{config.name}</h2>
                <span className="text-[7px] md:text-[8px] text-[#E42737] block mt-1 font-bold tracking-[0.2em] md:tracking-[0.4em] uppercase opacity-80">{config.type}</span>
            </div>

            <div className="w-full space-y-3">
                {config.stats && (
                    <div className="space-y-1.5 border-l border-white/10 pl-2 md:pl-3">
                        {[
                            { icon: Users, label: 'POP', value: config.stats.population, color: '#00FFFF' },
                            { icon: Thermometer, label: 'TEMP', value: config.stats.temperature, color: '#FFF' },
                            { icon: ArrowDown, label: 'GRV', value: config.stats.gravity, color: '#94a3b8' },
                            { icon: Wind, label: 'ATMO', value: config.stats.atmosphere, color: '#94a3b8' }
                        ].map((stat, idx) => (
                            <div key={idx} className="flex flex-col md:flex-row md:justify-between items-start md:items-center py-0.5 gap-0.5 md:gap-0">
                                <span className="text-[7px] md:text-[8px] text-white/30 tracking-[0.1em] md:tracking-[0.2em] uppercase font-bold">{stat.label}</span>
                                <span className="text-[9px] md:text-[10px] font-bold tracking-widest truncate max-w-full" style={{ color: stat.color }}>{stat.value}</span>
                            </div>
                        ))}
                    </div>
                )}

                <div className="pt-2">
                    <div className="text-[8px] md:text-[10px] text-white/40 leading-relaxed font-medium lowercase italic line-clamp-4 md:line-clamp-none">
                        {config.description || "data.corrupted"}
                    </div>
                </div>
            </div>
            
            <div className="mt-4 w-6 md:w-8 h-[1px] bg-[#E42737]"></div>
        </div>
    </div>
  );
};
