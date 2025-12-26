
import React, { useEffect, useRef } from 'react';

interface CursorHUDProps {
  isHovering?: boolean;
}

export const CursorHUD: React.FC<CursorHUDProps> = ({ isHovering = false }) => {
  const cursorRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const xLineRef = useRef<HTMLDivElement>(null);
  const yLineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateCursor = (e: MouseEvent) => {
      const x = e.clientX;
      const y = e.clientY;

      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;
      }
      if (xLineRef.current) {
        xLineRef.current.style.transform = `translate3d(${x}px, 0, 0) translateX(-50%)`;
      }
      if (yLineRef.current) {
        yLineRef.current.style.transform = `translate3d(0, ${y}px, 0) translateY(-50%)`;
      }
      if (textRef.current) {
         if (!isHovering) {
            textRef.current.innerText = `TGT: ${x.toString().padStart(4, '0')} // ${y.toString().padStart(4, '0')}`;
         } else {
            textRef.current.innerText = "LOCK ACQUIRED";
         }
      }
    };

    window.addEventListener('mousemove', updateCursor);
    return () => window.removeEventListener('mousemove', updateCursor);
  }, [isHovering]);

  return (
    <div className="fixed inset-0 pointer-events-none z-[60] overflow-hidden">
      <div ref={xLineRef} className={`absolute top-0 left-0 h-full w-[1px] bg-[#E42737] transition-opacity duration-300 ${isHovering ? 'opacity-60 shadow-[0_0_10px_#E42737]' : 'opacity-20'}`}></div>
      <div ref={yLineRef} className={`absolute top-0 left-0 w-full h-[1px] bg-[#E42737] transition-opacity duration-300 ${isHovering ? 'opacity-60 shadow-[0_0_10px_#E42737]' : 'opacity-20'}`}></div>

      <div ref={cursorRef} className="absolute top-0 left-0 will-change-transform w-16 h-16 flex items-center justify-center">
        <div className={`absolute w-6 h-6 border-[1.5px] shadow-[0_0_10px_rgba(228,39,55,0.2)] transition-all duration-300 ease-out ${isHovering ? 'rotate-45 scale-75 border-white bg-white/20' : 'rotate-0 scale-100 border-[#E42737] bg-red-500/5'}`}></div>
        
        <div className={`absolute inset-0 transition-all duration-300 ${isHovering ? 'scale-100 opacity-100' : 'scale-150 opacity-0'}`}>
            <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-[#E42737]"></div>
            <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-[#E42737]"></div>
            <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-[#E42737]"></div>
            <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-[#E42737]"></div>
        </div>
        
        <div className={`absolute rounded-full bg-[#E42737] shadow-[0_0_4px_#E42737] transition-all duration-300 ${isHovering ? 'w-1 h-1 bg-white' : 'w-1 h-1'}`}></div>

        <div ref={textRef} className={`absolute top-10 left-10 text-[9px] font-mono tracking-widest whitespace-nowrap px-1.5 py-0.5 border-l-2 transition-all duration-300 ${isHovering ? 'bg-[#E42737] text-black border-white font-bold translate-x-1' : 'bg-black/70 text-[#E42737] border-[#E42737] backdrop-blur-sm'}`}>INIT...</div>
      </div>
    </div>
  );
};
