
import React, { useState, useEffect } from 'react';
import { Play, Lock, RefreshCw, Radio } from 'lucide-react';

interface ActivationOverlayProps {
  onActivate: () => void;
  isTransitioning?: boolean;
}

export const ActivationOverlay: React.FC<ActivationOverlayProps> = ({ onActivate, isTransitioning = false }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (isTransitioning) {
      const interval = setInterval(() => {
        setProgress(prev => Math.min(prev + 3, 100));
      }, 30);
      return () => clearInterval(interval);
    } else {
      setProgress(0);
    }
  }, [isTransitioning]);

  return (
    <div className={`
      fixed inset-0 z-[9998] flex items-center justify-center bg-transparent backdrop-blur-none transition-all duration-[1000ms] pointer-events-auto
      ${isTransitioning ? 'opacity-0 scale-110 pointer-events-none' : 'opacity-100 scale-100'}
    `}>
      <div className={`
        flex flex-col items-center gap-8 p-10 border border-[#E42737]/40 bg-[#121212]/40 backdrop-blur-xl shadow-[0_0_80px_rgba(228,39,55,0.3)] font-mono text-center max-w-[90%] w-[400px] relative overflow-hidden group transition-all duration-700
        ${isTransitioning ? 'border-white/50 bg-[#E42737]/10' : ''}
      `}>
        
        {/* Decorative corner brackets */}
        <div className={`absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 transition-colors duration-500 ${isTransitioning ? 'border-white' : 'border-[#E42737]'}`}></div>
        <div className={`absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 transition-colors duration-500 ${isTransitioning ? 'border-white' : 'border-[#E42737]'}`}></div>
        <div className={`absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 transition-colors duration-500 ${isTransitioning ? 'border-white' : 'border-[#E42737]'}`}></div>
        <div className={`absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 transition-colors duration-500 ${isTransitioning ? 'border-white' : 'border-[#E42737]'}`}></div>

        <div className="space-y-4 w-full">
            {!isTransitioning ? (
              <div className="flex items-center justify-center gap-2 text-[#E42737] mb-2 animate-pulse">
                  <Lock size={20} />
                  <h2 className="text-sm font-black tracking-[0.4em]">SYSTEM LOCKED</h2>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2 text-white mb-2">
                  <RefreshCw size={20} className="animate-spin" />
                  <h2 className="text-sm font-black tracking-[0.4em]">ESTABLISHING UPLINK</h2>
              </div>
            )}
            
            <p className={`text-white text-[11px] leading-relaxed uppercase tracking-wider font-bold drop-shadow-md transition-opacity duration-300 ${isTransitioning ? 'opacity-40' : 'opacity-100'}`}>
              Launching the 3D map will lock page scrolling to ensure stable orbital navigation.
            </p>
        </div>
        
        <div className="w-full relative h-16">
            {!isTransitioning ? (
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  onActivate();
                }}
                className="absolute inset-0 flex items-center justify-center gap-4 bg-[#E42737]/10 border-2 border-[#E42737] text-[#E42737] hover:bg-[#E42737] hover:text-black transition-all duration-500 font-black tracking-[0.2em] group shadow-[0_0_20px_rgba(228,39,55,0.2)]"
              >
                <Play size={20} className="fill-current transition-transform group-hover:scale-110" />
                <span className="text-sm">LAUNCH 3D MAP</span>
              </button>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                <div className="w-full bg-white/10 h-1 border border-white/20 relative overflow-hidden">
                    <div 
                      className="absolute top-0 left-0 h-full bg-white transition-all duration-300 ease-out" 
                      style={{ width: `${progress}%` }}
                    ></div>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-white/60 animate-pulse">
                    <Radio size={12} />
                    <span className="tracking-widest uppercase">SYNCING DATA STREAM... {progress}%</span>
                </div>
              </div>
            )}
        </div>
        
        <div className="text-[9px] text-slate-400 tracking-[0.3em] uppercase mt-2 font-bold flex items-center gap-2">
            <div className="w-1 h-1 bg-[#E42737] animate-ping"></div>
            CORE INTERFACE // GRID v4.2.1
        </div>
      </div>
    </div>
  );
};
