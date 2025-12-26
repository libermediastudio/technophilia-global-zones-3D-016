
import React, { useState } from 'react';
import { Crosshair, MapPin, Search } from 'lucide-react';
import { GlobeData, City } from '../types.ts';

interface LocationListProps {
  data: GlobeData;
  onSelect: (city: City) => void;
  selectedCity: City | null;
}

export const LocationList: React.FC<LocationListProps> = ({ data, onSelect, selectedCity }) => {
  const [searchQuery, setSearchQuery] = useState('');

  if (!data.cities || data.cities.length === 0) return null;

  const filteredCities = data.cities.filter(city => 
    city.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (city.faction && city.faction.toLowerCase().includes(searchQuery.toLowerCase())) ||
    city.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="absolute top-24 right-6 w-64 pointer-events-none z-30 font-mono hidden md:block">
       {/* Header */}
       <div className="bg-[#121212]/80 backdrop-blur-sm p-2 pointer-events-auto border-b border-[#E42737]/50 mb-2 shadow-[0_0_20px_rgba(0,0,0,0.5)]">
           <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#E42737]/20">
              <div className="flex items-center gap-2 text-[#E42737]">
                <Crosshair size={14} />
                <span className="text-xs font-bold tracking-[0.2em]">TARGET LIST</span>
              </div>
              <div className="text-[10px] text-slate-500">{filteredCities.length} DETECTED</div>
           </div>
           
           {/* Search Input */}
           <div className="relative">
                <input 
                    type="text" 
                    placeholder="SEARCH TARGET..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-black/50 border border-[#E42737]/30 text-[#E42737] text-xs p-1 pl-2 pr-7 outline-none focus:border-[#E42737] placeholder:text-slate-600 uppercase tracking-wider transition-colors"
                />
                <Search size={12} className="absolute right-2 top-1/2 transform -translate-y-1/2 text-slate-500" />
           </div>
       </div>

       {/* List Container - Fixed Height relative to viewport to leave room for Entity Data below */}
       {/* Removed no-scrollbar, added custom red scrollbar styling */}
       <div className="max-h-[30vh] overflow-y-auto pr-1 space-y-1 bg-[#121212]/80 backdrop-blur-sm p-2 border-b border-[#E42737]/50 shadow-[0_0_20px_rgba(0,0,0,0.5)] pointer-events-auto [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-[#121212] [&::-webkit-scrollbar-thumb]:bg-[#E42737]">
          {filteredCities.map((city) => {
            const isSelected = selectedCity?.name === city.name;
            
            return (
              <button
                key={city.name}
                onClick={() => onSelect(city)}
                className={`
                  w-full text-left p-2 border-l-2 transition-all duration-300 relative group
                  ${isSelected 
                    ? 'bg-red-900/30 border-[#E42737] pl-4' 
                    : 'bg-[#121212]/60 border-transparent hover:border-[#E42737]/50 hover:bg-red-900/10 hover:pl-3'
                  }
                `}
              >
                <div className="flex justify-between items-center">
                  <span className={`text-xs tracking-wider ${isSelected ? 'text-white font-bold' : 'text-slate-400 group-hover:text-red-200'}`}>
                    {city.name}
                  </span>
                  {isSelected && <MapPin size={12} className="text-[#E42737]" />}
                </div>
                
                {/* Decoration for active item */}
                {isSelected && (
                   <div className="absolute top-0 right-0 w-1 h-1 bg-[#E42737]"></div>
                )}
                
                <div className="flex justify-between mt-1 opacity-60">
                    <span className="text-[8px] text-[#E42737]">{city.category}</span>
                    {/* Hide faction if it is the same as category to avoid duplication */}
                    {city.faction && city.faction !== city.category && (
                        <span className="text-[8px] text-slate-500">{city.faction}</span>
                    )}
                </div>
              </button>
            );
          })}
          
          {filteredCities.length === 0 && (
             <div className="p-4 text-center text-[10px] text-slate-500 italic border-l-2 border-slate-800 bg-[#121212]/60">
                NO TARGETS FOUND
             </div>
          )}
          
          {/* Footer decoration inside the list block */}
          <div className="h-1 w-full bg-[#E42737]/20 mt-2 flex justify-end">
              <div className="w-1/3 h-full bg-[#E42737]/50"></div>
          </div>
       </div>
    </div>
  );
};
