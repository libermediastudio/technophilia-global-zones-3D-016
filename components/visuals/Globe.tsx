
import React, { useEffect, useRef, forwardRef, useImperativeHandle, useState, useCallback } from 'react';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';
import * as THREE from 'three';
import { CelestialBodyConfig, City } from '../../types.ts';
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
  const momentumRef = useRef<{ x: number; y: number }>({ x: 0.1, y: 0 }); 
  const isAnimatingRef = useRef(false);
  const lastMoveRef = useRef<{ x: number, y: number, time: number } | null>(null);
  const animationRef = useRef<number>(0);

  const landDataRef = useRef<any>(null);
  const starfieldRef = useRef<any[]>([]);
  const asteroidFieldRef = useRef<any[]>([]);

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

  // Three.js Initialization - Ultra stable mode for EGL/tryANGLE
  useEffect(() => {
    if (!threeContainerRef.current) return;
    
    // Clean up to avoid driver exhaustion
    while(threeContainerRef.current.firstChild) threeContainerRef.current.removeChild(threeContainerRef.current.firstChild);

    try {
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(45, threeContainerRef.current.clientWidth / threeContainerRef.current.clientHeight, 1, 10000);
      camera.position.z = 1200;
      
      const renderer = new THREE.WebGLRenderer({ 
        antialias: false, // OFF for stability
        alpha: true,
        stencil: false, // OFF for stability
        depth: true,
        precision: "mediump",
        powerPreference: "high-performance",
        failIfMajorPerformanceCaveat: false
      });
      
      renderer.setPixelRatio(1); 
      renderer.setSize(threeContainerRef.current.clientWidth, threeContainerRef.current.clientHeight);
      threeContainerRef.current.appendChild(renderer.domElement);
      
      // Global Ambient
      scene.add(new THREE.AmbientLight(0xffffff, 0.4));
      
      // Strong directional lights to highlight displacement
      const keyLight = new THREE.DirectionalLight(0xffffff, 5.0);
      keyLight.position.set(1000, 500, 1000);
      scene.add(keyLight);
      
      const fillLight = new THREE.DirectionalLight(0xE42737, 3.0);
      fillLight.position.set(-1000, -200, 500);
      scene.add(fillLight);

      rendererRef.current = renderer;
      sceneRef.current = scene;
      cameraRef.current = camera;
      setWebglAvailable(true);
    } catch (e) {
      console.warn("[SYSTEM] WebGL Failed. Falling back to 2D.", e);
      setWebglAvailable(false);
    }

    return () => {
      if (rendererRef.current) {
        rendererRef.current.dispose();
        rendererRef.current.forceContextLoss();
      }
    };
  }, []);

  // Load Textures and Create Mesh
  useEffect(() => {
    if (!sceneRef.current || !webglAvailable) return;

    if (globeMeshRef.current) {
        sceneRef.current.remove(globeMeshRef.current);
        globeMeshRef.current.geometry.dispose();
        (globeMeshRef.current.material as THREE.Material).dispose();
    }

    if (config.id === 'belt') return;

    const geometry = new THREE.SphereGeometry(GLOBE_RADIUS, 128, 128);
    const material = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#111'),
      metalness: 0.1,
      roughness: 0.8,
      displacementScale: 150, 
      displacementBias: -10,
      emissive: new THREE.Color('#E42737'),
      emissiveIntensity: 0.05
    });

    textureLoader.current.setCrossOrigin('anonymous');
    
    if (config.albedoUrl) {
      textureLoader.current.load(config.albedoUrl, (t) => {
        t.colorSpace = THREE.SRGBColorSpace;
        material.map = t;
        material.color.set('#555');
        material.needsUpdate = true;
      }, undefined, (err) => console.error("Texture Load Fail:", config.albedoUrl));
    }
    
    if (config.heightMapUrl) {
      textureLoader.current.load(config.heightMapUrl, (t) => {
        material.displacementMap = t;
        material.bumpMap = t;
        material.bumpScale = 30;
        material.needsUpdate = true;
      });
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
        const start = [...rotationRef.current] as [number, number, number];
        const target: [number, number, number] = [-city.lng, -city.lat, 0];
        const interpolate = d3.interpolateArray(start, target);
        d3.transition().duration(1500).ease(d3.easeCubicOut)
          .tween("rotate", () => (t: number) => {
            rotationRef.current = interpolate(t) as [number, number, number];
            if (t === 1) isAnimatingRef.current = false;
          });
    }
  }));

  const render = useCallback((time: number) => {
    const canvas = canvasRef.current; if (!canvas || dims.width === 0) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    const { width, height } = dims;
    const dpr = window.devicePixelRatio || 1;

    if (canvas.width !== Math.floor(width * dpr)) {
      canvas.width = Math.floor(width * dpr); canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (rendererRef.current) rendererRef.current.setSize(width, height);
      if (cameraRef.current) { cameraRef.current.aspect = width / height; cameraRef.current.updateProjectionMatrix(); }
    }
    
    if (Math.abs(targetScaleRef.current - scaleRef.current) > 0.1) scaleRef.current += (targetScaleRef.current - scaleRef.current) * 0.1;

    // --- 3D Loop ---
    if (webglAvailable && rendererRef.current && sceneRef.current && cameraRef.current) {
        if (globeMeshRef.current && config.id !== 'belt') {
            globeMeshRef.current.rotation.y = (rotationRef.current[0] * Math.PI) / 180;
            globeMeshRef.current.rotation.x = -(rotationRef.current[1] * Math.PI) / 180;
            cameraRef.current.position.z = (1200 * 350) / scaleRef.current;
            rendererRef.current.render(sceneRef.current, cameraRef.current);
        } else {
            rendererRef.current.clear();
        }
    }

    // --- 2D Layer (HUD + Fallback) ---
    ctx.clearRect(0, 0, width, height);
    const proj = d3.geoOrthographic().scale(scaleRef.current).translate([width/2, height/2]).rotate(rotationRef.current).clipAngle(config.id === 'belt' ? null : 90);
    const path = d3.geoPath(proj, ctx);

    // Stars
    starfieldRef.current.forEach(s => {
        const x = (s.x - rotationRef.current[0] * 2) % width; ctx.fillStyle = '#333'; ctx.globalAlpha = s.opacity * 0.4; ctx.fillRect(x < 0 ? x + width : x, s.y % height, 1.5, 1.5);
    });
    ctx.globalAlpha = 1;

    if (!webglAvailable && config.id !== 'belt') {
        ctx.beginPath(); path({ type: 'Sphere' }); ctx.fillStyle = '#0a0a0a'; ctx.fill();
        ctx.strokeStyle = 'rgba(228, 39, 55, 0.4)'; ctx.lineWidth = 1; ctx.stroke();
        if (config.id === 'earth' && landDataRef.current) {
            ctx.beginPath(); path(landDataRef.current); ctx.fillStyle = 'rgba(228, 39, 55, 0.15)'; ctx.fill();
        }
    } else if (config.id === 'belt') {
        asteroidFieldRef.current.forEach(r => {
            const c = proj([r.lng, r.lat]);
            if (c) {
                const rot = d3.geoRotation(rotationRef.current)([r.lng, r.lat]);
                const isBack = Math.abs(rot[0]) > 90;
                ctx.fillStyle = r.color; ctx.globalAlpha = isBack ? r.opacity * 0.2 : r.opacity;
                ctx.fillRect(width/2 + (c[0]-width/2)*r.alt, height/2 + (c[1]-height/2)*r.alt, r.size * scaleRef.current * 0.005, r.size * scaleRef.current * 0.005);
            }
        });
    }

    // Markers & Labels
    const pulse = (Math.sin(time / 400) + 1) / 2;
    config.data.cities.forEach(city => {
        const c = proj([city.lng, city.lat]);
        const r = d3.geoRotation(rotationRef.current)([city.lng, city.lat]);
        const isVisible = config.id === 'belt' || (r[0] > -90 && r[0] < 90);
        
        if (c && isVisible) {
            const isS = selectedCity?.name === city.name;
            const isH = hoveredItem?.name === city.name;
            const col = city.category === 'ICE' ? '#00FFFF' : city.category === 'AC' ? '#f472b6' : city.category === 'ANOMALY' ? '#ef4444' : '#fbbf24';
            
            ctx.beginPath(); ctx.arc(c[0], c[1], 4 + pulse * 6, 0, Math.PI * 2); ctx.strokeStyle = col; ctx.globalAlpha = 0.3 * (1 - pulse); ctx.stroke();
            ctx.globalAlpha = 1;
            ctx.beginPath(); ctx.arc(c[0], c[1], (isS || isH) ? 4 : 2, 0, Math.PI * 2); ctx.fillStyle = (isS || isH) ? '#FFF' : col; ctx.fill();
            
            if (isS || isH) {
                ctx.font = `bold 12px ${MONO_STACK}`; ctx.fillStyle = '#FFF'; ctx.textAlign = "center";
                ctx.fillText(city.name, c[0], c[1] - 18);
                ctx.font = `8px ${MONO_STACK}`; ctx.fillStyle = '#E42737';
                ctx.fillText(`${city.lat.toFixed(1)} / ${city.lng.toFixed(1)}`, c[0], c[1] - 8);
                if (isS) { ctx.strokeStyle = '#E42737'; ctx.lineWidth = 1; ctx.strokeRect(c[0]-12, c[1]-12, 24, 24); }
            } else {
                ctx.font = `9px ${MONO_STACK}`; ctx.fillStyle = 'rgba(255, 255, 255, 0.4)'; ctx.textAlign = "center";
                ctx.fillText(city.name, c[0], c[1] + 12);
            }
        }
    });

  }, [dims, config, hoveredItem, selectedCity, webglAvailable]);

  useEffect(() => {
    const loop = (time: number) => {
        if (!dragRef.current && !isAnimatingRef.current) {
            rotationRef.current[0] += momentumRef.current.x; rotationRef.current[1] += momentumRef.current.y;
            momentumRef.current.x *= 0.98; momentumRef.current.y *= 0.92;
            if (Math.abs(momentumRef.current.x) < 0.04) momentumRef.current.x = 0.05; 
        }
        render(time); animationRef.current = requestAnimationFrame(loop);
    };
    animationRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationRef.current);
  }, [render]);

  useEffect(() => {
    const s = []; for (let i=0; i<400; i++) s.push({ x: Math.random()*2000, y: Math.random()*1000, opacity: Math.random() });
    starfieldRef.current = s;
    fetch(WORLD_ATLAS_URL).then(r => r.json()).then(d => { landDataRef.current = (topojson as any).feature(d, d.objects.countries); });
    if (config.id === 'belt') {
        const ast = []; for (let i = 0; i < 300; i++) ast.push({ lng: (Math.random() * 360) - 180, lat: (Math.random() * 40) - 20, alt: 1.1 + Math.random() * 1.4, size: Math.random() * 3 + 1, color: Math.random() > 0.8 ? '#E42737' : '#555', opacity: Math.random() });
        asteroidFieldRef.current = ast;
    }
  }, [config.id]);

  const handleStart = (clientX: number, clientY: number) => {
    if (!interactionsEnabled) return;
    setIsDragging(true); dragRef.current = { startX: clientX, startY: clientY, startRot: [...rotationRef.current] };
    momentumRef.current = { x: 0, y: 0 };
    lastMoveRef.current = { x: clientX, y: clientY, time: performance.now() };
  };

  const handleMove = (clientX: number, clientY: number, offsetX: number, offsetY: number) => {
    if (!interactionsEnabled) return;
    if (dragRef.current) {
        const dx = clientX - dragRef.current.startX; const dy = clientY - dragRef.current.startY;
        rotationRef.current = [dragRef.current.startRot[0] + dx * 0.35, dragRef.current.startRot[1] - dy * 0.35, 0];
        if (lastMoveRef.current) {
            const dt = performance.now() - lastMoveRef.current.time;
            if (dt > 0) momentumRef.current = { x: (clientX - lastMoveRef.current.x) / dt * 5, y: -(clientY - lastMoveRef.current.y) / dt * 5 };
        }
        lastMoveRef.current = { x: clientX, y: clientY, time: performance.now() };
    }
    const proj = d3.geoOrthographic().scale(scaleRef.current).translate([dims.width/2, dims.height/2]).rotate(rotationRef.current);
    const found = config.data.cities.find(city => {
        const c = proj([city.lng, city.lat]);
        return c && Math.hypot(c[0] - offsetX, c[1] - offsetY) < 18;
    });
    if (found !== hoveredItem) { setHoveredItem(found || null); onHoverChange?.(!!found); }
  };

  return (
    <div ref={containerRef} className={`w-full h-full relative cursor-none bg-[#050505] overflow-hidden ${interactionsEnabled ? 'touch-none pointer-events-auto' : 'pointer-events-none'}`}
      onMouseDown={(e) => handleStart(e.clientX, e.clientY)}
      onMouseMove={(e) => handleMove(e.clientX, e.clientY, e.nativeEvent.offsetX, e.nativeEvent.offsetY)}
      onMouseUp={() => setIsDragging(false)}
      onWheel={(e) => { if (interactionsEnabled) targetScaleRef.current = Math.max(MIN_SCALE, Math.min(MAX_SCALE, targetScaleRef.current - e.deltaY * 0.6)); }}
      onClick={(e) => {
        const rect = canvasRef.current?.getBoundingClientRect();
        if (rect) {
            const proj = d3.geoOrthographic().scale(scaleRef.current).translate([dims.width/2, dims.height/2]).rotate(rotationRef.current);
            const found = config.data.cities.find(city => {
                const c = proj([city.lng, city.lat]);
                return c && Math.hypot(c[0] - (e.clientX - rect.left), c[1] - (e.clientY - rect.top)) < 18;
            });
            if (found) onSelect(found);
        }
      }}
    >
       <div ref={threeContainerRef} className="absolute inset-0 z-0 pointer-events-none" />
       <canvas ref={canvasRef} className="block w-full h-full relative z-10 pointer-events-none" />
       <div className="absolute top-10 left-10 pointer-events-none z-50 font-mono flex flex-col gap-1">
          <div className="flex items-center gap-2">
              <Crosshair size={12} className="text-[#E42737] animate-pulse" />
              <span className="text-[10px] text-[#E42737] font-black tracking-[0.5em] uppercase">SYSTEM.HUD // {config.name} {webglAvailable ? '3D_ACTIVE' : '2D_FALLBACK'}</span>
          </div>
       </div>
    </div>
  );
});
Globe.displayName = "Globe";
