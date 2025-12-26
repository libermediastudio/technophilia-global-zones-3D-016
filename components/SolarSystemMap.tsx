
import React, { useEffect, useRef, forwardRef, useImperativeHandle, useState } from 'react';
import { CelestialBodyConfig } from '../types.ts';
import { Crosshair } from 'lucide-react';

export interface SolarSystemMapHandle {
  setZoom: (value: number) => void;
}

interface SolarSystemMapProps {
  bodies: CelestialBodyConfig[];
  currentBodyId: string;
  onSelect: (id: string) => void;
  onHoverChange?: (isHovering: boolean) => void;
}

interface Star {
  x: number;
  y: number;
  opacity: number;
}

interface BeltParticle {
  angle: number;
  offset: number;
  y: number;
  opacity: number;
}

const ORBIT_CONFIG: Record<string, { distance: number; speed: number; startAngle: number; size: number; color: string }> = {
    mercury: { distance: 60, speed: 1.5, startAngle: 20, size: 3, color: '#A5A5A5' },
    venus: { distance: 90, speed: 1.1, startAngle: 160, size: 5, color: '#E3BB76' },
    earth: { distance: 130, speed: 0.8, startAngle: -45, size: 5.5, color: '#4F97E5' },
    moon: { distance: 15, speed: 6.0, startAngle: 90, size: 1.5, color: '#DDDDDD' }, 
    mars: { distance: 170, speed: 0.6, startAngle: 130, size: 4, color: '#E42737' },
    belt: { distance: 220, speed: 0.2, startAngle: 220, size: 4, color: '#555' },
    jupiter: { distance: 300, speed: 0.15, startAngle: -15, size: 12, color: '#C99039' },
    saturn: { distance: 400, speed: 0.1, startAngle: 70, size: 10, color: '#EAD6B8' },
    uranus: { distance: 500, speed: 0.06, startAngle: 280, size: 7, color: '#D1E7E7' },
    neptune: { distance: 600, speed: 0.04, startAngle: 10, size: 7, color: '#5B5DDF' },
    io: { distance: 20, speed: 4.0, startAngle: 0, size: 1, color: '#F8F' },
    europa: { distance: 25, speed: 3.0, startAngle: 0, size: 1, color: '#AFA' },
    ganymede: { distance: 30, speed: 2.0, startAngle: 0, size: 1.5, color: '#AAF' },
    callisto: { distance: 35, speed: 1.0, startAngle: 0, size: 1.2, color: '#FFA' },
};

export const SolarSystemMap = forwardRef<SolarSystemMapHandle, SolarSystemMapProps>(({ bodies, currentBodyId, onSelect, onHoverChange }, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>(0);
  
  const rotationRef = useRef({ x: 60, y: 0 });
  const zoomRef = useRef(0.6);
  const dragRef = useRef<{ startX: number; startY: number; startRot: {x: number, y: number} } | null>(null);
  const hoveredBodyRef = useRef<string | null>(null);
  const wasHoveringRef = useRef<boolean>(false);

  // Stores interpolated positions for smooth animation: map[id] = {x, y}
  const labelPosRef = useRef<Map<string, { x: number, y: number }>>(new Map());

  const [width, setWidth] = useState(window.innerWidth);
  const [height, setHeight] = useState(window.innerHeight);
  const [starfield, setStarfield] = useState<Star[]>([]);
  const [beltParticles, setBeltParticles] = useState<BeltParticle[]>([]);

  const jovianMoons = ['io', 'europa', 'ganymede', 'callisto'];
  const targetIds = ['earth', 'moon', 'mars', 'belt', 'io', 'europa', 'ganymede', 'callisto'];
  
  useImperativeHandle(ref, () => ({
    setZoom: (value: number) => {
        const minZ = 0.3;
        const maxZ = 4.5;
        zoomRef.current = minZ + (value / 100) * (maxZ - minZ);
    }
  }));

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        setWidth(containerRef.current.clientWidth);
        setHeight(containerRef.current.clientHeight);
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const stars: Star[] = [];
    for (let i = 0; i < 400; i++) {
      stars.push({ x: Math.random() * 2000, y: Math.random() * 1000, opacity: Math.random() });
    }
    setStarfield(stars);

    const beltParts: BeltParticle[] = [];
    for (let i = 0; i < 1200; i++) {
        beltParts.push({
            angle: Math.random() * Math.PI * 2,
            offset: (Math.random() - 0.5) * 24,
            y: (Math.random() - 0.5) * 3,
            opacity: Math.random() * 0.6 + 0.2
        });
    }
    setBeltParticles(beltParts);
  }, []);

  const project3D = (x: number, y: number, z: number, cx: number, cy: number, rotX: number, rotY: number, scale: number) => {
      const radY = (rotY * Math.PI) / 180;
      const cosY = Math.cos(radY);
      const sinY = Math.sin(radY);
      const x1 = x * cosY - z * sinY;
      const z1 = z * cosY + x * sinY;

      const radX = (rotX * Math.PI) / 180;
      const cosX = Math.cos(radX);
      const sinX = Math.sin(radX);
      const y2 = y * cosX - z1 * sinX;
      const z2 = z1 * cosX + y * sinX;

      const fov = 1000; 
      const scaleProjected = (fov / (fov + z2)) * scale;
      
      return { x: cx + x1 * scaleProjected, y: cy + y2 * scaleProjected, scale: scaleProjected, z: z2 };
  };

  const checkCollision = (box1: any, box2: any) => {
      return (box1.x < box2.x + box2.w &&
              box1.x + box1.w > box2.x &&
              box1.y < box2.y + box2.h &&
              box1.y + box1.h > box2.y);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const startTime = performance.now();

    const render = (time: number) => {
        ctx.clearRect(0, 0, width, height);
        ctx.fillStyle = '#121212'; 
        ctx.fillRect(0, 0, width, height);

        const offsetX = rotationRef.current.y * 2;
        starfield.forEach(star => {
            const x = (star.x - offsetX) % width;
            const finalX = x < 0 ? x + width : x;
            ctx.fillStyle = '#333';
            ctx.globalAlpha = star.opacity * 0.4;
            ctx.fillRect(finalX, star.y % height, 1.5, 1.5);
        });
        ctx.globalAlpha = 1.0;
        
        const cx = width / 2;
        const cy = height / 2;
        const t = (time - startTime) * 0.00001953125; 
        
        // --- ORBITS & BODIES CALCULATION ---
        const renderQueue: any[] = [];
        const auUnit = 130;

        // Draw AU Rings
        for (let i = 1; i <= 5; i++) {
            const radius = auUnit * i;
            const auPoints = [];
            for (let j = 0; j <= 60; j++) {
                const a = (j / 60) * Math.PI * 2;
                const ox = Math.cos(a) * radius;
                const oz = Math.sin(a) * radius;
                auPoints.push(project3D(ox, 0, oz, cx, cy, rotationRef.current.x, rotationRef.current.y, zoomRef.current));
            }
            ctx.beginPath();
            auPoints.forEach((p, idx) => idx === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
            ctx.closePath();
            ctx.strokeStyle = 'rgba(228, 39, 55, 0.08)'; 
            ctx.lineWidth = 1;
            ctx.setLineDash([]);
            ctx.stroke();
            
            // Label
            const labelPos = auPoints[Math.floor(auPoints.length * 0.75)]; 
            if (labelPos) {
                ctx.fillStyle = 'rgba(228, 39, 55, 0.3)';
                ctx.font = "10px ui-monospace, monospace";
                ctx.textAlign = "center";
                ctx.fillText(`${i}.0 AU`, labelPos.x, labelPos.y);
            }
        }

        // Sun
        const sunPos = project3D(0, 0, 0, cx, cy, rotationRef.current.x, rotationRef.current.y, zoomRef.current);
        const sunGlow = ctx.createRadialGradient(sunPos.x, sunPos.y, 0, sunPos.x, sunPos.y, 45 * sunPos.scale);
        sunGlow.addColorStop(0, 'rgba(255, 255, 255, 0.12)'); 
        sunGlow.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = sunGlow;
        ctx.beginPath(); ctx.arc(sunPos.x, sunPos.y, 45 * sunPos.scale, 0, Math.PI * 2); ctx.fill();
        const sunCore = ctx.createRadialGradient(sunPos.x, sunPos.y, 0, sunPos.x, sunPos.y, 12 * sunPos.scale);
        sunCore.addColorStop(0, '#FFFFFF'); sunCore.addColorStop(1, '#CCCCCC'); 
        ctx.fillStyle = sunCore; ctx.beginPath(); ctx.arc(sunPos.x, sunPos.y, 12 * sunPos.scale, 0, Math.PI * 2); ctx.fill();

        // Process Bodies
        Object.keys(ORBIT_CONFIG).forEach(key => {
            if (['moon', 'io', 'europa', 'ganymede', 'callisto'].includes(key)) return;

            const config = ORBIT_CONFIG[key];
            const angle = config.startAngle * (Math.PI/180) + (t * config.speed);
            const px = Math.cos(angle) * config.distance;
            const pz = Math.sin(angle) * config.distance;
            
            const isSelected = currentBodyId === key;
            const isBelt = key === 'belt';

            if (isBelt) {
                const baseColor = isSelected ? '#E42737' : 'rgba(100, 116, 139, 0.5)'; 
                beltParticles.forEach(p => {
                    const pAngle = p.angle + (t * config.speed * 0.5);
                    const r = config.distance + p.offset;
                    const bx = Math.cos(pAngle) * r;
                    const bz = Math.sin(pAngle) * r;
                    const bProj = project3D(bx, p.y, bz, cx, cy, rotationRef.current.x, rotationRef.current.y, zoomRef.current);
                    ctx.fillStyle = baseColor;
                    ctx.globalAlpha = p.opacity * (isSelected ? 1 : 0.4); 
                    const size = Math.max(0.8, 1.3 * bProj.scale);
                    ctx.fillRect(bProj.x, bProj.y, size, size);
                });
                ctx.globalAlpha = 1.0;
            } else {
                const orbitPoints = [];
                for (let i = 0; i <= 60; i++) {
                    const a = (i / 60) * Math.PI * 2;
                    const ox = Math.cos(a) * config.distance;
                    const oz = Math.sin(a) * config.distance;
                    orbitPoints.push(project3D(ox, 0, oz, cx, cy, rotationRef.current.x, rotationRef.current.y, zoomRef.current));
                }
                ctx.beginPath();
                orbitPoints.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
                ctx.closePath();
                ctx.strokeStyle = isSelected ? '#E42737' : 'rgba(100, 116, 139, 0.15)'; 
                ctx.lineWidth = isSelected ? 1.5 : 1; 
                ctx.setLineDash([]);
                ctx.stroke();
            }

            const proj = project3D(px, 0, pz, cx, cy, rotationRef.current.x, rotationRef.current.y, zoomRef.current);
            renderQueue.push({ type: 'planet', id: key, x: proj.x, y: proj.y, z: proj.z, scale: proj.scale, config: config, parent: null });

            if (key === 'earth') {
                const mConf = ORBIT_CONFIG['moon'];
                const mA = mConf.startAngle * (Math.PI/180) + (t * mConf.speed);
                const mx = px + Math.cos(mA) * mConf.distance;
                const mz = pz + Math.sin(mA) * mConf.distance;
                const mProj = project3D(mx, 0, mz, cx, cy, rotationRef.current.x, rotationRef.current.y, zoomRef.current);
                renderQueue.push({ type: 'planet', id: 'moon', x: mProj.x, y: mProj.y, z: mProj.z, scale: mProj.scale, config: mConf, parent: 'earth' });
            }
            if (key === 'jupiter') {
                jovianMoons.forEach((mId, idx) => {
                    const mConf = ORBIT_CONFIG[mId];
                    const dist = 30 + (idx * 10);
                    const mA = (idx * 45 * Math.PI/180) + (t * mConf.speed) + mConf.startAngle;
                    const mx = px + Math.cos(mA) * dist;
                    const mz = pz + Math.sin(mA) * dist;
                    const mProj = project3D(mx, 0, mz, cx, cy, rotationRef.current.x, rotationRef.current.y, zoomRef.current);
                    renderQueue.push({ type: 'planet', id: mId, x: mProj.x, y: mProj.y, z: mProj.z, scale: mProj.scale, config: { ...mConf, size: 2 }, parent: 'jupiter' });
                });
            }
        });

        // SORT Back-to-Front for rendering bodies
        renderQueue.sort((a, b) => b.z - a.z);
        (canvas as any).hitRegions = renderQueue; 

        // 1. RENDER PLANETS FIRST (So labels always go on top)
        const occupiedSpaces: any[] = []; // {x,y,w,h}

        renderQueue.forEach(obj => {
            const isTarget = targetIds.includes(obj.id);
            const isHovered = hoveredBodyRef.current === obj.id && isTarget;
            const isSelected = currentBodyId === obj.id;
            const isBelt = obj.id === 'belt';
            
            let radius = Math.max(1, obj.config.size * obj.scale); 
            
            // Mark occupied space for the planet itself (with buffer)
            occupiedSpaces.push({
                x: obj.x - radius - 5,
                y: obj.y - radius - 5,
                w: radius * 2 + 10,
                h: radius * 2 + 10
            });

            ctx.beginPath();
            if (isBelt) {
                const s = radius * 2;
                ctx.save(); ctx.translate(obj.x, obj.y); ctx.rotate(Math.PI / 4); ctx.rect(-s/2, -s/2, s, s); ctx.restore();
            } else {
                ctx.arc(obj.x, obj.y, radius, 0, Math.PI * 2);
            }
            
            ctx.fillStyle = isTarget ? (isHovered ? '#FFFFFF' : '#E42737') : '#334155';
            ctx.fill();

            if (isTarget) {
                const timeSec = time / 1000;
                const pulseFreq = 2.5; 
                const pulsePhase = (Math.sin(timeSec * pulseFreq) + 1) / 2;
                const expansionMax = 8;
                const currentExpand = 4 + (pulsePhase * expansionMax);
                const currentOpacity = 0.35 * (1 - pulsePhase); 

                ctx.beginPath();
                if (isBelt) {
                    const s = (radius * 2) + (currentExpand * 2);
                    ctx.save(); ctx.translate(obj.x, obj.y); ctx.rotate(Math.PI / 4); ctx.rect(-s/2, -s/2, s, s);
                    ctx.fillStyle = `rgba(228, 39, 55, ${currentOpacity})`; ctx.fill();
                    ctx.strokeStyle = `rgba(228, 39, 55, ${currentOpacity + 0.1})`; ctx.lineWidth = 1; ctx.stroke(); ctx.restore();
                } else {
                    ctx.arc(obj.x, obj.y, radius + currentExpand, 0, Math.PI * 2);
                    ctx.fillStyle = `rgba(228, 39, 55, ${currentOpacity})`; ctx.fill();
                    ctx.strokeStyle = `rgba(228, 39, 55, ${currentOpacity + 0.1})`; ctx.lineWidth = 1; ctx.stroke();
                }

                if (isHovered) {
                    ctx.shadowBlur = 10; ctx.shadowColor = '#FFFFFF'; ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 1;
                    if (isBelt) {
                        const s = radius * 2; ctx.save(); ctx.translate(obj.x, obj.y); ctx.rotate(Math.PI / 4); ctx.strokeRect(-s/2, -s/2, s, s); ctx.restore();
                    } else { ctx.stroke(); }
                    ctx.shadowBlur = 0;
                }
            } else {
                ctx.strokeStyle = '#1e293b'; ctx.lineWidth = 1; ctx.stroke();
            }
        });

        // 2. RENDER LABELS (HUD LAYER)
        // Sort Front-to-Back for allocation (Small Z = close) so close labels get priority
        const labelQueue = renderQueue.filter(obj => targetIds.includes(obj.id) || (!obj.parent && obj.scale > 0.5));
        labelQueue.sort((a, b) => a.z - b.z); 

        // Set font once for measuring
        ctx.font = "bold 12px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, \"Liberation Mono\", \"Courier New\", monospace";

        labelQueue.forEach(obj => {
            const isHovered = hoveredBodyRef.current === obj.id && targetIds.includes(obj.id);
            const isTarget = targetIds.includes(obj.id);
            const isSelected = currentBodyId === obj.id;
            const color = isSelected ? '#FFFFFF' : (isTarget ? (isHovered ? '#FFFFFF' : '#E42737') : '#475569');

            let displayName = obj.id.toUpperCase();
            if (obj.id === 'earth') displayName = 'TERRA';
            if (obj.id === 'moon') displayName = 'LUNA';

            const textMetrics = ctx.measureText(displayName);
            const boxWidth = textMetrics.width + 16;
            const boxHeight = 20;
            const radius = Math.max(1, obj.config.size * obj.scale) + 4;

            // Positioning candidates: Bottom, Top, Right, Left
            const candidates = [
                { x: obj.x - boxWidth / 2, y: obj.y + radius + 15, w: boxWidth, h: boxHeight, type: 'bottom', ax: obj.x, ay: obj.y + radius },
                { x: obj.x - boxWidth / 2, y: obj.y - radius - boxHeight - 15, w: boxWidth, h: boxHeight, type: 'top', ax: obj.x, ay: obj.y - radius },
                { x: obj.x + radius + 15, y: obj.y - boxHeight / 2, w: boxWidth, h: boxHeight, type: 'right', ax: obj.x + radius, ay: obj.y },
                { x: obj.x - radius - boxWidth - 15, y: obj.y - boxHeight / 2, w: boxWidth, h: boxHeight, type: 'left', ax: obj.x - radius, ay: obj.y }
            ];

            let bestPos = candidates[0];
            let foundSafe = false;

            for (const cand of candidates) {
                let collision = false;
                for (const space of occupiedSpaces) {
                    if (checkCollision(cand, space)) {
                        collision = true;
                        break;
                    }
                }
                if (!collision) {
                    bestPos = cand;
                    foundSafe = true;
                    break;
                }
            }

            // Reserve space even if we overlap (worst case, overlapping is better than disappearing)
            occupiedSpaces.push(bestPos);

            // Lerp Animation
            if (!labelPosRef.current.has(obj.id)) {
                labelPosRef.current.set(obj.id, { x: bestPos.x, y: bestPos.y });
            }
            const currentPos = labelPosRef.current.get(obj.id)!;
            const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
            currentPos.x = lerp(currentPos.x, bestPos.x, 0.15);
            currentPos.y = lerp(currentPos.y, bestPos.y, 0.15);

            // Draw Line
            ctx.beginPath();
            ctx.strokeStyle = isTarget ? color : 'rgba(71, 85, 105, 0.2)';
            ctx.lineWidth = 1;
            
            // Anchor line from body to floating box
            // Note: bestPos anchor points (ax, ay) are static, but box is moving. 
            // We draw line to currentPos to keep it attached visually.
            if (bestPos.type === 'bottom') {
                ctx.moveTo(obj.x, obj.y + radius); ctx.lineTo(currentPos.x + boxWidth/2, currentPos.y);
            } else if (bestPos.type === 'top') {
                ctx.moveTo(obj.x, obj.y - radius); ctx.lineTo(currentPos.x + boxWidth/2, currentPos.y + boxHeight);
            } else if (bestPos.type === 'right') {
                ctx.moveTo(obj.x + radius, obj.y); ctx.lineTo(currentPos.x, currentPos.y + boxHeight/2);
            } else {
                ctx.moveTo(obj.x - radius, obj.y); ctx.lineTo(currentPos.x + boxWidth, currentPos.y + boxHeight/2);
            }
            ctx.stroke();

            // Draw Box
            if (isTarget) {
                if (isHovered) {
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'; ctx.fillRect(currentPos.x, currentPos.y, boxWidth, boxHeight);
                    ctx.fillStyle = '#000000';
                } else {
                    ctx.fillStyle = 'rgba(20, 20, 20, 0.6)'; ctx.fillRect(currentPos.x, currentPos.y, boxWidth, boxHeight);
                    ctx.strokeStyle = 'rgba(228, 39, 55, 0.3)'; ctx.strokeRect(currentPos.x, currentPos.y, boxWidth, boxHeight);
                    ctx.fillStyle = color;
                }
            } else {
                ctx.fillStyle = color;
            }

            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(displayName, currentPos.x + boxWidth/2, currentPos.y + boxHeight/2);
        });
    };

    animationRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationRef.current);
  }, [width, height, currentBodyId, starfield, beltParticles]);

  const handleMouseDown = (e: React.MouseEvent) => {
      dragRef.current = { startX: e.clientX, startY: e.clientY, startRot: { ...rotationRef.current } };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
      if (dragRef.current) {
          const dx = e.clientX - dragRef.current.startX;
          const dy = e.clientY - dragRef.current.startY;
          rotationRef.current.y = dragRef.current.startRot.y + dx * 0.5;
          rotationRef.current.x = Math.max(10, Math.min(90, dragRef.current.startRot.x + dy * 0.5));
          return;
      }
      if (canvasRef.current) {
          const rect = canvasRef.current.getBoundingClientRect();
          const mx = e.clientX - rect.left;
          const my = e.clientY - rect.top;
          const hitRegions = (canvasRef.current as any).hitRegions || [];
          let found = null;
          for (let i = 0; i < hitRegions.length; i++) {
              const obj = hitRegions[i];
              if (Math.sqrt((mx - obj.x)**2 + (my - obj.y)**2) < 20 * obj.scale) { found = obj.id; break; }
          }
          if (found && !targetIds.includes(found)) found = null;
          
          if (hoveredBodyRef.current !== found) {
              hoveredBodyRef.current = found;
              canvasRef.current.style.cursor = found ? 'pointer' : 'none';
          }
          const isHovering = !!found;
          if (wasHoveringRef.current !== isHovering) {
              wasHoveringRef.current = isHovering;
              if (onHoverChange) onHoverChange(isHovering);
          }
      }
  };

  const handleMouseUp = () => { dragRef.current = null; };
  const handleClick = () => { if (hoveredBodyRef.current) onSelect(hoveredBodyRef.current); };
  const handleWheel = (e: React.WheelEvent) => {
      const delta = -e.deltaY * 0.001;
      zoomRef.current = Math.max(0.3, Math.min(4.5, zoomRef.current + delta));
  };

  return (
    <div ref={containerRef} className="absolute inset-0 z-20 overflow-hidden bg-[#121212] font-mono animate-fade-in cursor-none">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(228,39,55,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(228,39,55,0.05)_1px,transparent_1px)] bg-[size:100px_100px] pointer-events-none"></div>
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_0%,#000000_90%)]"></div>
      <div className="absolute top-4 left-0 w-full text-center pointer-events-none z-10 select-none">
        <h1 className="text-4xl md:text-6xl font-serif text-[#E42737] tracking-widest opacity-80" style={{ textShadow: '0 0 20px rgba(228, 39, 55, 0.5)' }}>TECHNOPHILIA</h1>
      </div>
      <canvas ref={canvasRef} width={width} height={height} className="w-full h-full block relative z-10"
        onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}
        onClick={handleClick} onWheel={handleWheel} />
      <div className="absolute bottom-10 right-10 text-right pointer-events-none z-50">
          <div className="flex items-center gap-2 mb-1 justify-end">
             <div className="text-[#E42737] text-xs font-bold tracking-[0.2em]">TACTICAL MAP</div>
             <Crosshair size={14} className="text-[#E42737]" />
          </div>
          <div className="h-[1px] w-32 bg-[#E42737]/30 mb-2 ml-auto"></div>
          <div className="text-slate-500 text-[10px] font-mono tracking-wider">SECTOR: SOL // 3D VIEW</div>
          <div className="text-slate-500 text-[10px] font-mono tracking-wider">PROJECTION: ISOMETRIC</div>
      </div>
    </div>
  );
});
SolarSystemMap.displayName = "SolarSystemMap";
