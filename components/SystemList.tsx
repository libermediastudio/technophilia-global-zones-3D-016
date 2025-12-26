
import React, { useState } from 'react';
import { Crosshair, Globe, Search, ArrowRight } from 'lucide-react';
import { CelestialBodyConfig } from '../types.ts';

interface SystemListProps {
  bodies: CelestialBodyConfig[];
  onSelect: (id: string) => void;
}

export const SystemList: React.FC<SystemListProps> = ({ bodies, onSelect }) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter out the "inactive" visual-only bodies as requested
  const excludedIds = ['mercury', 'venus', 'jupiter', 'saturn', 'uranus', 'neptune'];
  
  const filteredBodies = bodies.filter(body => 
    !excludedIds.includes(body.id) &&
    (body.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
     body.type.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="absolute top-24 right-6 w-64 pointer-events-none z-30 font-mono hidden md:block">
       {/* Header */}
       <div className="bg-[#121212]/80 backdrop-blur-sm p-2 pointer-events-auto border-b border-[#E42737]/50 mb-2 shadow-[0_0_20px_rgba(0,0,0,0.5)]">
           <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#E42737]/20">
              <div className="flex items-center gap-2 text-[#E42737]">
                <Globe size={14} />
                <span className="text-xs font-bold tracking-[0.2em]">SYSTEM TARGETS</span>
              </div>
              <div className="text-[10px] text-slate-500">{filteredBodies.length} ZONES</div>
           </div>
           
           {/* Search Input */}
           <div className="relative">
                <input 
                    type="text" 
                    placeholder="SEARCH SECTOR..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-black/50 border border-[#E42737]/30 text-[#E42737] text-xs p-1 pl-2 pr-7 outline-none focus:border-[#E42737] placeholder:text-slate-600 uppercase tracking-wider transition-colors"
                />
                <Search size={12} className="absolute right-2 top-1/2 transform -translate-y-1/2 text-slate-500" />
           </div>
       </div>

       {/* List Container - Fixed Height */}
       <div className="max-h-[30vh] overflow-y-auto pr-1 space-y-1 bg-[#121212]/80 backdrop-blur-sm p-2 border-b border-[#E42737]/50 shadow-[0_0_20px_rgba(0,0,0,0.5)] pointer-events-auto [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-[#121212] [&::-webkit-scrollbar-thumb]:bg-[#E42737]">
          {filteredBodies.map((body) => {
            return (
              <button
                key={body.id}
                onClick={() => onSelect(body.id)}
                className="w-full text-left p-2 border-l-2 transition-all duration-300 relative group bg-[#121212]/60 border-transparent hover:border-[#E42737]/50 hover:bg-red-900/10 hover:pl-3"
              >
                <div className="flex justify-between items-center">
                  <span className="text-xs tracking-wider text-slate-300 group-hover:text-white font-bold transition-colors">
                    {body.name}
                  </span>
                  <ArrowRight size={12} className="text-[#E42737] opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                
                <div className="flex justify-between mt-1 opacity-60">
                    <span className="text-[8px] text-[#E42737] uppercase">{body.type}</span>
                    <span className="text-[8px] text-slate-500">{body.stats?.population || 'UNINHABITED'}</span>
                </div>
              </button>
            );
          })}
          
          {filteredBodies.length === 0 && (
             <div className="p-4 text-center text-[10px] text-slate-500 italic border-l-2 border-slate-800 bg-[#121212]/60">
                NO SECTORS FOUND
             </div>
          )}

          {/* Footer decoration */}
          <div className="h-1 w-full bg-[#E42737]/20 mt-2 flex justify-end">
              <div className="w-1/3 h-full bg-[#E42737]/50"></div>
          </div>
       </div>
    </div>
  );
};
