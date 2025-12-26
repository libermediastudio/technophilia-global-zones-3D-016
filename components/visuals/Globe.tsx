
import React, { useEffect, useRef, forwardRef, useImperativeHandle, useState, useCallback } from 'react';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';
import * as THREE from 'three';
import { CelestialBodyConfig, City } from '../../types/index.ts';
import { WORLD_ATLAS_URL } from '../../data/constants.ts';
import { Crosshair } from 'lucide-react';

export interface GlobeHandle {
  setZoom: (value: number) => void;
  flyTo: (city: City) => void;
}

interface GlobeProps {
  config: CelestialBodyConfig;
  onSelect: (city: City) => void;
  selectedCity: City | null;
  onHoverChange?: (isHovering: boolean) => void;
  interactionsEnabled?: boolean;
}

const MONO_STACK = 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace';
const GLOBE_RADIUS = 350;

const isWebGLAvailable = () => {
  try {
    const canvas = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
  } catch (e) {
    return false;
  }
};

export const Globe = forwardRef<GlobeHandle, GlobeProps>(({ 
  config, onSelect, selectedCity, onHoverChange, interactionsEnabled = true
}, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const threeContainerRef = useRef<HTMLDivElement>(null);
  
  const [dims, setDims] = useState({ width: 0, height: 0 });
  const [hoveredItem, setHoveredItem] = useState<City | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [webglAvailable, setWebglAvailable] = useState(true);
  
  const rotationRef = useRef<[number, number, number]>([0, -30, 0]);
  const scaleRef = useRef<number>(350);
  const targetScaleRef = useRef<number>(350);
  const dragRef = useRef<{ startX: number; startY: number; startRot: [number, number, number] } | null>(null);
  const momentumRef = useRef<{ x: number; y: number }>({ x: 0.05, y: 0 }); 
  const isAnimatingRef = useRef(false);
  const lastMoveRef = useRef<{ x: number, y: number, time: number } | null>(null);
  const animationRef = useRef<number>(0);

  const worldDataRef = useRef<any>(null);
  const landDataRef = useRef<any>(null);
  const starfieldRef = useRef<any[]>([]);
  const asteroidFieldRef = useRef<any[]>([]);
  const labelPosRef = useRef<Map<string, { x: number, y: number }>>(new Map());

  // Three.js Refs
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const globeMeshRef = useRef<THREE.Mesh | null>(null);
  
  const textureLoader = useRef(new THREE.TextureLoader());

  const MIN_SCALE = 100;
  const MAX_SCALE = 2000;

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setDims({ width: entry.contentRect.width, height: entry.contentRect.height });
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Three.js Initialization
  useEffect(() => {
    if (!threeContainerRef.current) return;
    
    if (!isWebGLAvailable()) {
      console.warn("[SYSTEM] WebGL context failed. Initializing 2D Fallback.");
      setWebglAvailable(false);
      return;
    }

    try {
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 20000);
      camera.position.z = 1200;
      
      const renderer = new THREE.WebGLRenderer({ 
        antialias: true, 
        alpha: true, 
        logarithmicDepthBuffer: true,
        failIfMajorPerformanceCaveat: false,
        powerPreference: "high-performance"
      });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(threeContainerRef.current.clientWidth, threeContainerRef.current.clientHeight);
      renderer.setClearColor(0x000000, 0); 
      renderer.autoClear = true;
      threeContainerRef.current.appendChild(renderer.domElement);
      
      // Stark directional lighting to create relief shadows
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
      scene.add(ambientLight);
      
      const sunLight = new THREE.DirectionalLight(0xffffff, 6.0);
      sunLight.position.set(1500, 200, 800);
      scene.add(sunLight);

      const rimLight = new THREE.DirectionalLight(0xE42737, 2.0);
      rimLight.position.set(-1000, 0, -500);
      scene.add(rimLight);

      rendererRef.current = renderer;
      sceneRef.current = scene;
      cameraRef.current = camera;
    } catch (e) {
      console.error("[SYSTEM] WebGL Context Error:", e);
      setWebglAvailable(false);
    }

    return () => {
      if (rendererRef.current) {
        rendererRef.current.dispose();
        threeContainerRef.current?.removeChild(rendererRef.current.domElement);
      }
    };
  }, []);

  // Globe Mesh & Texture Update
  useEffect(() => {
    if (!sceneRef.current || !webglAvailable) return;

    if (globeMeshRef.current) {
        sceneRef.current.remove(globeMeshRef.current);
        if (globeMeshRef.current.geometry) globeMeshRef.current.geometry.dispose();
        if (globeMeshRef.current.material) {
            const mats = Array.isArray(globeMeshRef.current.material) ? globeMeshRef.current.material : [globeMeshRef.current.material];
            mats.forEach(m => m.dispose());
        }
        globeMeshRef.current = null;
    }

    if (config.id === 'belt') {
        rendererRef.current?.clear();
        return;
    }

    // High resolution geometry for smooth displacement maps
    const geometry = new THREE.SphereGeometry(GLOBE_RADIUS, 512, 512);
    
    // Tactical Black & Red relief material
    const material = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#050505'),
      emissive: new THREE.Color('#E42737'),
      emissiveIntensity: 0.05, 
      roughness: 0.8,
      metalness: 0.1,
      displacementScale: 35, // High value for deep relief look
      bumpScale: 15
    });

    textureLoader.current.setCrossOrigin('anonymous');

    const loadTexture = (url: string, type: 'map' | 'bumpMap' | 'displacementMap') => {
        textureLoader.current.load(
            url,
            (tex) => {
                console.log(`[SYSTEM] ${type} loaded for ${config.id}`);
                if (type === 'map') {
                    tex.colorSpace = THREE.SRGBColorSpace;
                    // Tint textures to Red/Black aesthetic
                    material.map = tex;
                    material.color.set('#333333');
                    material.emissiveIntensity = 0.02;
                } else if (type === 'bumpMap') {
                    material.bumpMap = tex;
                } else if (type === 'displacementMap') {
                    material.displacementMap = tex;
                }
                material.needsUpdate = true;
            },
            undefined,
            (errorEvent: any) => {
                console.error(`[TEXTURE ERROR] ${type} for ${config.id} failed.`, errorEvent);
                if (type === 'map') {
                    material.color.set('#1a1a1a'); 
                    material.emissiveIntensity = 0.15;
                    material.needsUpdate = true;
                }
            }
        );
    };

    if (config.albedoUrl) loadTexture(config.albedoUrl, 'map');
    if (config.heightMapUrl) {
        loadTexture(config.heightMapUrl, 'bumpMap');
        loadTexture(config.heightMapUrl, 'displacementMap');
    }

    const globe = new THREE.Mesh(geometry, material);
    sceneRef.current.add(globe);
    globeMeshRef.current = globe;

  }, [config.id, config.albedoUrl, config.heightMapUrl, webglAvailable]);

  useImperativeHandle(ref, () => ({
    setZoom: (v) => { targetScaleRef.current = MIN_SCALE + (v / 100) * (MAX_SCALE - MIN_SCALE); },
    flyTo: (city) => {
        if (config.id === 'belt') return;
        isAnimatingRef.current = true;
        momentumRef.current = { x: 0, y: 0 };
        const start = [...rotationRef.current] as [number, number, number];
        const targetRot: [number, number, number] = [-city.lng, -city.lat, 0];
        const interpolate = d3.interpolateArray(start, targetRot);
        const duration = 1500; let startTime: number | null = null;
        const step = (t: number) => {
            if (!startTime) startTime = t;
            const progress = Math.min((t - startTime) / duration, 1);
            rotationRef.current = interpolate(d3.easeCubicOut(progress)) as [number, number, number];
            if (progress < 1) requestAnimationFrame(step);
            else { isAnimatingRef.current = false; momentumRef.current = { x: 0.05, y: 0 }; }
        };
        requestAnimationFrame(step);
    }
  }));

  const findCityAt = useCallback((offsetX: number, offsetY: number) => {
    if (dims.width === 0) return null;
    const proj = d3.geoOrthographic()
      .scale(scaleRef.current)
      .translate([dims.width / 2, dims.height / 2])
      .rotate(rotationRef.current);
      
    return config.data.cities.find(c => {
        const coords = proj([c.lng, c.lat]);
        if (!coords) return false;
        let x = coords[0], y = coords[1];
        if (config.id === 'belt') {
            const center = [dims.width / 2, dims.height / 2];
            x = center[0] + (coords[0] - center[0]) * 2.2;
            y = center[1] + (coords[1] - center[1]) * 2.2;
        }
        const vis = config.id === 'belt' || (d3.geoRotation(rotationRef.current)([c.lng, c.lat])[0] > -90 && d3.geoRotation(rotationRef.current)([c.lng, c.lat])[0] < 90);
        
        if (vis && Math.hypot(x - offsetX, y - offsetY) < 15) return true;
        
        if (vis && labelPosRef.current.has(c.name)) {
            const pos = labelPosRef.current.get(c.name)!;
            const canvas = canvasRef.current;
            if (canvas) {
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.font = `bold 12px ${MONO_STACK}`;
                    const bw = ctx.measureText(c.name).width + 24; const bh = 28;
                    if (offsetX >= pos.x && offsetX <= pos.x + bw && offsetY >= pos.y && offsetY <= pos.y + bh) return true;
                }
            }
        }
        return false;
    });
  }, [dims, config, rotationRef, scaleRef]);

  const render = useCallback((time: number) => {
    const canvas = canvasRef.current; if (!canvas || dims.width === 0) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const { width, height } = dims;
    
    if (canvas.width !== Math.floor(width * dpr) || canvas.height !== Math.floor(height * dpr)) {
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      
      if (rendererRef.current && cameraRef.current) {
        rendererRef.current.setSize(width, height);
        cameraRef.current.aspect = width / height;
        cameraRef.current.updateProjectionMatrix();
      }
    }
    
    if (Math.abs(targetScaleRef.current - scaleRef.current) > 0.1) scaleRef.current += (targetScaleRef.current - scaleRef.current) * 0.1;
    
    if (webglAvailable && rendererRef.current && sceneRef.current && cameraRef.current) {
        if (config.id !== 'belt' && globeMeshRef.current) {
            globeMeshRef.current.rotation.y = (rotationRef.current[0] * Math.PI) / 180;
            globeMeshRef.current.rotation.x = -(rotationRef.current[1] * Math.PI) / 180;
            const zDist = (1200 * 350) / scaleRef.current;
            cameraRef.current.position.z = zDist;
            rendererRef.current.render(sceneRef.current, cameraRef.current);
        } else {
            rendererRef.current.clear();
        }
    }

    ctx.clearRect(0, 0, width, height);
    const proj = d3.geoOrthographic()
      .scale(scaleRef.current)
      .translate([width / 2, height / 2])
      .rotate(rotationRef.current)
      .clipAngle(config.id === 'belt' ? null : 90);
      
    const path = d3.geoPath(proj, ctx);
    const center = [width / 2, height / 2];

    starfieldRef.current.forEach(s => {
        const x = (s.x - rotationRef.current[0] * 2) % width;
        const finalX = x < 0 ? x + width : x;
        ctx.fillStyle = '#334155'; ctx.globalAlpha = s.opacity * 0.3; ctx.fillRect(finalX, s.y % height, 1.5, 1.5);
    });
    ctx.globalAlpha = 1;

    if (config.id === 'belt') {
        asteroidFieldRef.current.forEach(r => {
            const c = proj([r.lng, r.lat]);
            if (c) {
                const back = Math.abs(d3.geoRotation(rotationRef.current)([r.lng, r.lat])[0]) > 90;
                ctx.fillStyle = r.color; ctx.globalAlpha = back ? r.opacity * 0.3 : r.opacity;
                ctx.fillRect(center[0] + (c[0]-center[0])*r.alt, center[1] + (c[1]-center[1])*r.alt, r.size * scaleRef.current * 0.005, r.size * scaleRef.current * 0.005);
            }
        });
        ctx.beginPath(); ctx.arc(center[0], center[1], 2, 0, 2*Math.PI); ctx.fillStyle = '#E42737'; ctx.fill();
    } else if (!webglAvailable) {
        ctx.beginPath(); path({ type: 'Sphere' });
        ctx.fillStyle = '#121212'; ctx.fill();
        ctx.strokeStyle = 'rgba(228, 39, 55, 0.4)'; ctx.lineWidth = 1; ctx.stroke();
        
        const graticule = d3.geoGraticule().step([30, 30]);
        ctx.beginPath(); path(graticule()); ctx.strokeStyle = 'rgba(228, 39, 55, 0.15)'; ctx.stroke();
        
        // CRITICAL FIX: Only draw land data (continents) for Terra/Earth
        if (config.id === 'earth' && landDataRef.current) {
            ctx.beginPath(); path(landDataRef.current);
            ctx.fillStyle = 'rgba(228, 39, 55, 0.08)'; ctx.fill();
        }
    }

    const pulsePhase = (Math.sin(time / 400) + 1) / 2;
    const visible: any[] = [];

    config.data.cities.forEach(city => {
        let x, y, isVis = false;
        const c = proj([city.lng, city.lat]);
        if (config.id === 'belt' && c) {
            x = center[0] + (c[0]-center[0])*2.2; y = center[1] + (c[1]-center[1])*2.2; isVis = true;
        } else if (c) {
            isVis = d3.geoRotation(rotationRef.current)([city.lng, city.lat])[0] > -90 && d3.geoRotation(rotationRef.current)([city.lng, city.lat])[0] < 90;
            if (isVis) { x = c[0]; y = c[1]; }
        }

        if (isVis && x !== undefined && y !== undefined) {
            visible.push({city, x, y});
            const col = city.category === 'ICE' ? '#00FFFF' : city.category === 'AC' ? '#f472b6' : city.category === 'ANOMALY' ? '#ef4444' : city.category === 'MILITARY' ? '#fbbf24' : '#94a3b8';
            const isH = city.name === hoveredItem?.name;
            const isS = selectedCity?.name === city.name;
            
            ctx.beginPath();
            ctx.arc(x, y, (isH || isS ? 6 : 4) + pulsePhase * 8, 0, Math.PI * 2);
            ctx.strokeStyle = col; ctx.globalAlpha = 0.4 * (1 - pulsePhase); ctx.lineWidth = 1; ctx.stroke();
            ctx.globalAlpha = 1;

            ctx.beginPath(); ctx.arc(x, y, isH || isS ? 4 : 2.5, 0, 2*Math.PI); ctx.fillStyle = isH || isS ? '#FFF' : col; ctx.fill();
            
            if (isS) {
                const b = 12; ctx.strokeStyle = '#E42737'; ctx.lineWidth = 1.5; ctx.beginPath();
                ctx.moveTo(x-b, y-b+4); ctx.lineTo(x-b, y-b); ctx.lineTo(x-b+4, y-b);
                ctx.moveTo(x+b-4, y-b); ctx.lineTo(x+b, y-b); ctx.lineTo(x+b, y-b+4);
                ctx.moveTo(x-b, y+b-4); ctx.lineTo(x-b, y+b); ctx.lineTo(x-b+4, y+b);
                ctx.moveTo(x+b-4, y+b); ctx.lineTo(x+b, y+b); ctx.lineTo(x+b, y+b-4);
                ctx.stroke();
            }

            if (!isH && !isS) { 
                ctx.font = `9px ${MONO_STACK}`; ctx.fillStyle = 'rgba(255, 255, 255, 0.4)'; ctx.textAlign = "center"; ctx.fillText(city.name, x, y + 12); 
            }
        }
    });

    visible.forEach(({city, x, y}) => {
        const isHovered = hoveredItem?.name === city.name;
        if (isHovered || selectedCity?.name === city.name) {
            ctx.font = `bold 12px ${MONO_STACK}`;
            const bw = ctx.measureText(city.name).width + 24; const bh = 28;
            if (!labelPosRef.current.has(city.name)) labelPosRef.current.set(city.name, { x: x-bw/2, y: y+25 });
            const cur = labelPosRef.current.get(city.name)!; cur.x += (x-bw/2 - cur.x)*0.2; cur.y += (y+25 - cur.y)*0.2;
            ctx.beginPath(); ctx.strokeStyle = '#FFF'; ctx.lineWidth = 1; ctx.moveTo(x, y+5); ctx.lineTo(cur.x+bw/2, cur.y); ctx.stroke();
            ctx.fillStyle = 'rgba(10,10,10,0.95)'; ctx.beginPath();
            ctx.moveTo(cur.x, cur.y); ctx.lineTo(cur.x+bw, cur.y); ctx.lineTo(cur.x+bw, cur.y+bh-4); ctx.lineTo(cur.x+bw-4, cur.y+bh); ctx.lineTo(cur.x+4, cur.y+bh); ctx.lineTo(cur.x, cur.y+bh-4);
            ctx.closePath(); ctx.fill(); ctx.strokeStyle = '#E42737'; ctx.stroke();
            ctx.fillStyle = '#FFF'; ctx.textAlign = "center"; ctx.textBaseline = "middle";
            ctx.fillText(city.name, cur.x+bw/2, cur.y+bh/2-5);
            ctx.font = `8px ${MONO_STACK}`; ctx.fillStyle = '#E42737'; ctx.fillText(`${city.lat.toFixed(1)} // ${city.lng.toFixed(1)}`, cur.x+bw/2, cur.y+bh/2+7);
        }
    });
  }, [dims, config, hoveredItem, selectedCity, webglAvailable]);

  useEffect(() => {
    const loop = (time: number) => {
        if (!dragRef.current && !isAnimatingRef.current) {
            rotationRef.current[0] += momentumRef.current.x; rotationRef.current[1] += momentumRef.current.y;
            momentumRef.current.y *= 0.92; momentumRef.current.x = (momentumRef.current.x - 0.05) * 0.95 + 0.05;
        }
        render(time); animationRef.current = requestAnimationFrame(loop);
    };
    animationRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationRef.current);
  }, [render]);

  useEffect(() => {
    if (config.id === 'belt') {
        rotationRef.current = [0, -20, 0];
    } else if (config.data.cities.length > 0) {
        const firstCity = config.data.cities[0];
        rotationRef.current = [-firstCity.lng, -firstCity.lat, 0];
    } else {
        rotationRef.current = [0, -30, 0];
    }
    const s = []; for (let i=0; i<400; i++) s.push({ x: Math.random()*2000, y: Math.random()*1000, opacity: Math.random() });
    starfieldRef.current = s;
    
    fetch(WORLD_ATLAS_URL).then(r => r.json()).then(d => {
        worldDataRef.current = d; 
        landDataRef.current = (topojson as any).feature(d, d.objects.countries);
    }).catch(e => console.warn("[SYSTEM] Failed to load world atlas for fallback view."));

    if (config.id === 'belt') {
        const asteroids = []; for (let i = 0; i < 300; i++) asteroids.push({ lng: (Math.random() * 360) - 180, lat: (Math.random() * 40) - 20, alt: 1 + Math.random() * 1.5, size: Math.random() * 3 + 1, color: Math.random() > 0.8 ? '#E42737' : '#334155', opacity: Math.random() });
        asteroidFieldRef.current = asteroids;
    }
  }, [config.id]);

  const handleStart = (clientX: number, clientY: number) => {
    if (!interactionsEnabled) return;
    setIsDragging(true);
    dragRef.current = { startX: clientX, startY: clientY, startRot: [...rotationRef.current] as [number, number, number] };
    lastMoveRef.current = { x: clientX, y: clientY, time: performance.now() }; momentumRef.current = { x: 0, y: 0 };
  };

  const handleMove = (clientX: number, clientY: number, offsetX: number, offsetY: number) => {
    if (!interactionsEnabled) return;
    if (dragRef.current) {
        rotationRef.current = [dragRef.current.startRot[0] + (clientX - dragRef.current.startX) * 0.25, dragRef.current.startRot[1] - (clientY - dragRef.current.startY) * 0.25, dragRef.current.startRot[2]];
        if (lastMoveRef.current) momentumRef.current = { x: (clientX - lastMoveRef.current.x) * 0.2, y: -(clientY - lastMoveRef.current.y) * 0.2 };
        lastMoveRef.current = { x: clientX, y: clientY, time: performance.now() };
    }
    
    const found = findCityAt(offsetX, offsetY);
    if (found !== hoveredItem) { 
        setHoveredItem(found || null); 
        onHoverChange?.(!!found); 
    }
  };

  const handleEnd = () => {
    setIsDragging(false);
    dragRef.current = null;
  };

  const handleInteractionClick = (clientX: number, clientY: number) => {
    if (!interactionsEnabled) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      const offsetX = clientX - rect.left;
      const offsetY = clientY - rect.top;
      const target = findCityAt(offsetX, offsetY);
      if (target) {
        onSelect(target);
      }
    }
  };

  return (
    <div 
      ref={containerRef}
      className={`w-full h-full relative cursor-none ${interactionsEnabled ? 'touch-none pointer-events-auto' : 'touch-auto pointer-events-none'}`} 
      onMouseDown={(e) => handleStart(e.clientX, e.clientY)}
      onMouseMove={(e) => handleMove(e.clientX, e.clientY, e.nativeEvent.offsetX, e.nativeEvent.offsetY)}
      onMouseUp={handleEnd}
      onMouseLeave={handleEnd}
      onTouchStart={(e) => { e.preventDefault(); handleStart(e.touches[0].clientX, e.touches[0].clientY); }}
      onTouchMove={(e) => {
          e.preventDefault();
          const touch = e.touches[0];
          const rect = canvasRef.current?.getBoundingClientRect();
          if (rect) handleMove(touch.clientX, touch.clientY, touch.clientX - rect.left, touch.clientY - rect.top);
      }}
      onTouchEnd={(e) => {
        handleEnd();
        const touch = e.changedTouches[0];
        handleInteractionClick(touch.clientX, touch.clientY);
      }}
      onWheel={(e) => {
        if (interactionsEnabled) {
          targetScaleRef.current = Math.max(MIN_SCALE, Math.min(MAX_SCALE, targetScaleRef.current - e.deltaY * 0.5));
        }
      }} 
      onClick={(e) => handleInteractionClick(e.clientX, e.clientY)}
    >
       <div ref={threeContainerRef} className={`absolute inset-0 z-0 pointer-events-none bg-[#121212] transition-opacity duration-1000 ${webglAvailable ? 'opacity-100' : 'opacity-0'}`} />
       <canvas ref={canvasRef} className="block w-full h-full relative z-10 pointer-events-none" style={{ backgroundColor: 'transparent' }} />

       <div className="absolute top-10 left-6 md:left-10 pointer-events-none z-50 font-mono flex flex-col items-start">
          <div className="flex items-center gap-2 opacity-80">
              <Crosshair size={12} className="text-[#E42737] animate-pulse" />
              <span className="text-[10px] text-[#E42737] font-black tracking-[0.5em] uppercase">SYSTEM.HUD // {config.name} {webglAvailable ? '3D' : '2D'}</span>
          </div>
          {!webglAvailable && (
            <div className="mt-1 text-[8px] text-[#E42737] font-bold tracking-widest opacity-60 uppercase">SYSTEM_INFO: ENGINE_FALLBACK_ACTIVE</div>
          )}
       </div>
    </div>
  );
});
Globe.displayName = "Globe";
