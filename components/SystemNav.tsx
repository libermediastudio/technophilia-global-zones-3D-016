
import React from 'react';
import { LayoutGrid, Orbit } from 'lucide-react';
import { CelestialBodyConfig } from '../types.ts';

interface SystemNavProps {
  bodies: CelestialBodyConfig[];
  currentBodyId: string;
  viewMode: 'ORBIT' | 'SYSTEM';
  zoomLevel: number;
  onSelectBody: (id: string) => void;
  onViewModeChange: (mode: 'ORBIT' | 'SYSTEM') => void;
  onZoomChange: (value: number) => void;
}

export const SystemNav: React.FC<SystemNavProps> = ({ 
  bodies, 
  currentBodyId, 
  viewMode,
  zoomLevel,
  onSelectBody, 
  onViewModeChange,
  onZoomChange
}) => {
  // Only these specific bodies should have navigation links
  const targetLinkIds = ['earth', 'moon', 'mars', 'belt', 'io', 'europa', 'ganymede', 'callisto'];
  
  const visibleBodies = bodies.filter(b => targetLinkIds.includes(b.id));

  return (
    <div className="absolute bottom-8 left-0 w-full z-40 pointer-events-none flex flex-col items-center justify-center px-4">
      
      {/* Zoom Slider - Positioned Above */}
      <div className="pointer-events-auto mb-3 flex items-center gap-4 bg-[#121212] border border-[#E42737]/50 px-4 py-2 shadow-[0_0_15px_rgba(0,0,0,0.8)]">
         <span className="text-[10px] text-[#E42737] font-mono tracking-widest font-bold">ZOOM</span>
         <input 
            type="range" 
            min="0" 
            max="100" 
            value={zoomLevel} 
            onChange={(e) => onZoomChange(parseInt(e.target.value))}
            className="
              w-48 h-[2px] bg-[#E42737]/30 appearance-none cursor-pointer focus:outline-none 
              
              [&::-webkit-slider-thumb]:appearance-none 
              [&::-webkit-slider-thumb]:w-3 
              [&::-webkit-slider-thumb]:h-4 
              [&::-webkit-slider-thumb]:bg-[#121212] 
              [&::-webkit-slider-thumb]:border 
              [&::-webkit-slider-thumb]:border-[#E42737] 
              [&::-webkit-slider-thumb]:shadow-[0_0_8px_rgba(228,39,55,0.6)] 
              [&::-webkit-slider-thumb]:transition-all
              [&::-webkit-slider-thumb]:hover:bg-[#E42737]
              [&::-webkit-slider-thumb]:hover:shadow-[0_0_12px_#E42737]

              [&::-moz-range-thumb]:appearance-none
              [&::-moz-range-thumb]:w-3 
              [&::-moz-range-thumb]:h-4 
              [&::-moz-range-thumb]:bg-[#121212] 
              [&::-moz-range-thumb]:border 
              [&::-moz-range-thumb]:border-[#E42737] 
              [&::-moz-range-thumb]:rounded-none
              [&::-moz-range-thumb]:shadow-[0_0_8px_rgba(228,39,55,0.6)]
              [&::-moz-range-thumb]:transition-all
              [&::-moz-range-thumb]:hover:bg-[#E42737]
            "
         />
         <span className="text-[10px] text-[#E42737] font-mono w-8 text-right font-bold">{zoomLevel}%</span>
      </div>

      {/* Main Container */}
      <div className="pointer-events-auto bg-[#121212] border border-[#E42737]/50 flex gap-1 p-1 max-w-full items-center shadow-[0_0_20px_rgba(0,0,0,0.5)]">
        
        {/* VIEW MODE TOGGLE SWITCH */}
        <div className="flex bg-black/50 border border-[#E42737]/30 p-0.5 shrink-0">
            <button 
                onClick={() => onViewModeChange('ORBIT')}
                className={`
                    flex items-center gap-2 px-3 py-1 text-xs font-mono tracking-widest transition-all
                    ${viewMode === 'ORBIT' ? 'bg-[#E42737] text-black font-bold' : 'text-[#E42737] hover:bg-[#E42737]/10'}
                `}
                title="ORBIT VIEW"
            >
                <Orbit size={14} />
                <span className="hidden sm:inline">ORBIT</span>
            </button>
            <button 
                onClick={() => onViewModeChange('SYSTEM')}
                className={`
                    flex items-center gap-2 px-3 py-1 text-xs font-mono tracking-widest transition-all
                    ${viewMode === 'SYSTEM' ? 'bg-[#E42737] text-black font-bold' : 'text-[#E42737] hover:bg-[#E42737]/10'}
                `}
                title="SYSTEM MAP"
            >
                <LayoutGrid size={14} />
                <span className="hidden sm:inline">SYSTEM</span>
            </button>
        </div>

        {/* Separator */}
        <div className="w-[1px] h-4 bg-[#E42737]/50 mx-1 shrink-0"></div>

        {/* Planet Navigation - Flex Wrap / Horizontal Scroll Hidden */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar max-w-[calc(100vw-200px)] md:max-w-2xl px-1">
          {visibleBodies.map((body) => {
            const isActive = body.id === currentBodyId;
            return (
              <button
                key={body.id}
                onClick={() => onSelectBody(body.id)}
                className={`
                  flex items-center justify-center px-3 py-1 text-[10px] md:text-xs font-mono tracking-widest transition-all whitespace-nowrap shrink-0 border border-transparent
                  ${isActive 
                    ? 'bg-[#E42737]/10 text-[#E42737] font-bold border-[#E42737]' 
                    : 'text-[#E42737] hover:bg-[#E42737]/10 hover:border-[#E42737]/30'
                  }
                `}
              >
                {body.name}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
