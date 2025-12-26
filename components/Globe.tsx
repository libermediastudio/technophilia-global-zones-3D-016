
import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef, useCallback } from 'react';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';
import { Crosshair } from 'lucide-react';
import { CelestialBodyConfig, City } from '../types.ts';
import { WORLD_ATLAS_URL } from '../constants.ts';

export interface GlobeHandle {
  setZoom: (value: number) => void;
  flyTo: (city: City) => void;
}

interface GlobeProps {
  config: CelestialBodyConfig;
  onSelect: (city: City) => void;
  selectedCity: City | null;
  onHoverChange?: (isHovering: boolean) => void;
}

interface Star {
  x: number;
  y: number;
  opacity: number;
}

interface Asteroid {
  lng: number;
  lat: number;
  alt: number;
  size: number;
  color: string;
  opacity: number;
}

export const Globe = forwardRef<GlobeHandle, GlobeProps>(({ config, onSelect, selectedCity, onHoverChange }, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>(0);
  
  // Interaction State Refs
  const dragRef = useRef<{ startX: number; startY: number; startRot: [number, number, number] } | null>(null);
  const isAnimatingRef = useRef<boolean>(false); // Blocks physics during 'FlyTo'
  
  // Physics Refs
  const targetScaleRef = useRef<number>(350); // For smooth zoom
  const momentumRef = useRef<{ x: number; y: number }>({ x: 0.05, y: 0 }); // Current rotation velocity
  const lastMoveRef = useRef<{ x: number, y: number, time: number } | null>(null);
  const wasHoveringRef = useRef<boolean>(false);

  // Smart Label Refs (Stores interpolated positions for smooth animation)
  const labelPosRef = useRef<Map<string, { x: number, y: number }>>(new Map());

  const [width, setWidth] = useState(window.innerWidth);
  const [height, setHeight] = useState(window.innerHeight);
  const [rotation, setRotation] = useState<[number, number, number]>([0, -30, 0]);
  const [scale, setScale] = useState(350);
  const [hoveredItem, setHoveredItem] = useState<City | null>(null);
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(null);
  
  const [worldData, setWorldData] = useState<any>(null);
  const [landData, setLandData] = useState<any>(null);
  const [starfield, setStarfield] = useState<Star[]>([]);
  const [asteroidField, setAsteroidField] = useState<Asteroid[]>([]);

  const shiftY = 0; 
  const MIN_SCALE = 100;
  const MAX_SCALE = 2000;

  // Collision Helper
  const checkCollision = (box1: {x: number, y: number, w: number, h: number}, box2: {x: number, y: number, w: number, h: number}) => {
      return (box1.x < box2.x + box2.w &&
              box1.x + box1.w > box2.x &&
              box1.y < box2.y + box2.h &&
              box1.y + box1.h > box2.y);
  };

  // --- PHYSICS LOOP ---
  const startPhysicsLoop = useCallback(() => {
    const loop = () => {
        // 1. Smooth Zoom Interpolation
        setScale(currentScale => {
            const diff = targetScaleRef.current - currentScale;
            if (Math.abs(diff) < 0.1) return currentScale;
            return currentScale + diff * 0.1; // Lerp factor 0.1 for smoothness
        });

        // 2. Rotation Physics
        if (!dragRef.current && !isAnimatingRef.current) {
            // Apply Momentum
            setRotation(r => [
                r[0] + momentumRef.current.x,
                r[1] + momentumRef.current.y,
                r[2]
            ]);

            // Friction / Decay
            momentumRef.current.y *= 0.92;
            const baseSpeed = 0.05;
            const friction = 0.95;
            momentumRef.current.x = (momentumRef.current.x - baseSpeed) * friction + baseSpeed;
        }
        
        animationRef.current = requestAnimationFrame(loop);
    };
    
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    animationRef.current = requestAnimationFrame(loop);
  }, []);

  useImperativeHandle(ref, () => ({
    setZoom: (value: number) => {
        const newScale = MIN_SCALE + (value / 100) * (MAX_SCALE - MIN_SCALE);
        targetScaleRef.current = newScale;
    },
    flyTo: (city: City) => {
        if (config.id === 'belt') return;

        if (animationRef.current) cancelAnimationFrame(animationRef.current);

        isAnimatingRef.current = true;
        momentumRef.current = { x: 0, y: 0 };
        
        const startRot = [...rotation] as [number, number, number];
        const targetLng = -city.lng;
        const targetLat = -city.lat;
        
        const r0 = startRot[0];
        const r1 = targetLng;
        const delta = ((r1 - r0) % 360 + 540) % 360 - 180;
        const finalTargetLng = r0 + delta;
        
        const targetRot: [number, number, number] = [finalTargetLng, targetLat, 0];
        const interpolate = d3.interpolateArray(startRot, targetRot);
        
        const duration = 1500;
        let startTime: number | null = null;

        const step = (timestamp: number) => {
            if (!startTime) startTime = timestamp;
            const progress = Math.min((timestamp - startTime) / duration, 1);
            const ease = d3.easeCubicOut(progress);
            
            setRotation(interpolate(ease) as [number, number, number]);

            if (progress < 1) {
                animationRef.current = requestAnimationFrame(step);
            } else {
                isAnimatingRef.current = false;
                momentumRef.current = { x: 0.05, y: 0 }; 
                startPhysicsLoop();
            }
        };
        
        animationRef.current = requestAnimationFrame(step);
    }
  }));

  // Resize Handler
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        setWidth(containerRef.current.clientWidth);
        setHeight(containerRef.current.clientHeight);
      } else {
        setWidth(window.innerWidth);
        setHeight(window.innerHeight);
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Initialize Stars
  useEffect(() => {
    const stars: Star[] = [];
    for (let i = 0; i < 400; i++) {
      stars.push({
        x: Math.random() * 2000,
        y: Math.random() * 1000,
        opacity: Math.random()
      });
    }
    setStarfield(stars);
  }, []);

  // Initialize Asteroids & Camera Position for new body
  useEffect(() => {
    if (config.id === 'belt') {
        const asteroids: Asteroid[] = [];
        for (let i = 0; i < 300; i++) {
            const lng = (Math.random() * 360) - 180;
            const lat = (Math.random() * 40) - 20;
            asteroids.push({
                lng,
                lat,
                alt: 1 + Math.random() * 1.5,
                size: Math.random() * 3 + 1,
                color: Math.random() > 0.8 ? '#E42737' : '#64748b',
                opacity: Math.random()
            });
        }
        setAsteroidField(asteroids);
        targetScaleRef.current = 250;
        setScale(250);
        setRotation([0, -20, 0]); 
        momentumRef.current = { x: 0.05, y: 0 };
    } else {
        setAsteroidField([]);
        if (targetScaleRef.current < 300) {
            targetScaleRef.current = 350;
            setScale(350);
        }

        if (config.data.cities.length > 0) {
            const firstCity = config.data.cities[0];
            setRotation([-firstCity.lng, -firstCity.lat, 0]);
        } else {
            setRotation([0, -30, 0]);
        }
        momentumRef.current = { x: 0.05, y: 0 };
    }
  }, [config.id]);

  // Load World Data
  useEffect(() => {
    if (!worldData) {
        fetch(WORLD_ATLAS_URL)
            .then(res => res.json())
            .then(data => {
                setWorldData(data);
                if ((topojson as any).feature) {
                    setLandData((topojson as any).feature(data, data.objects.countries));
                }
            })
            .catch(err => console.error("Failed to load atlas", err));
    }
  }, [worldData]);

  // MAIN LOOP: Physics (Inertia) & Smooth Zoom
  useEffect(() => {
    if (!isAnimatingRef.current) {
        startPhysicsLoop();
    }
    return () => {
        if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [startPhysicsLoop]);

  // Mouse Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    dragRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        startRot: rotation
    };
    lastMoveRef.current = { x: e.clientX, y: e.clientY, time: performance.now() };
    isAnimatingRef.current = false;
    momentumRef.current = { x: 0, y: 0 }; 
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (dragRef.current) {
        const dx = e.clientX - dragRef.current.startX;
        const dy = e.clientY - dragRef.current.startY;
        const k = 0.25; 
        
        setRotation([
            dragRef.current.startRot[0] + dx * k,
            dragRef.current.startRot[1] - dy * k,
            dragRef.current.startRot[2]
        ]);

        const now = performance.now();
        if (lastMoveRef.current) {
            const dt = now - lastMoveRef.current.time;
            if (dt > 0) {
                const moveX = e.clientX - lastMoveRef.current.x;
                const moveY = e.clientY - lastMoveRef.current.y;
                momentumRef.current = { 
                    x: moveX * 0.2,
                    y: -moveY * 0.2 
                };
            }
        }
        lastMoveRef.current = { x: e.clientX, y: e.clientY, time: now };
    }

    setCursorPos({ x: e.clientX, y: e.clientY });
    
    const projection = d3.geoOrthographic()
        .scale(scale)
        .translate([width / 2, height / 2 - shiftY])
        .rotate(rotation)
        .clipAngle(config.id === 'belt' ? null : 90);
    
    let found: City | null = null;
    const cities = config.data?.cities || [];
    
    for (const city of cities) {
        const coords = projection([city.lng, city.lat]);
        if (coords) {
             const r = d3.geoRotation(rotation);
             const isVisible = config.id === 'belt' ? true : (r([city.lng, city.lat])[0] > -90 && r([city.lng, city.lat])[0] < 90);
             
             if (isVisible) {
                 const dx = coords[0] - e.nativeEvent.offsetX; 
                 const dy = coords[1] - e.nativeEvent.offsetY;
                 if (dx * dx + dy * dy < 100) { 
                     found = city;
                     break;
                 }
             }
        }
    }
    setHoveredItem(found);

    const isHovering = !!found;
    if (wasHoveringRef.current !== isHovering) {
        wasHoveringRef.current = isHovering;
        if (onHoverChange) onHoverChange(isHovering);
    }
  };

  const handleMouseUp = () => {
    dragRef.current = null;
    lastMoveRef.current = null;
  };

  const handleWheel = (e: React.WheelEvent) => {
    const delta = -e.deltaY * 0.5;
    targetScaleRef.current = Math.max(MIN_SCALE, Math.min(MAX_SCALE, targetScaleRef.current + delta));
  };

  const handleClick = (e: React.MouseEvent) => {
      if (hoveredItem) {
          onSelect(hoveredItem);
      }
  };

  // --- RENDER LOGIC ---
  const renderGlobe = useCallback((context: CanvasRenderingContext2D) => {
    context.clearRect(0, 0, width, height);
    
    const projection = d3.geoOrthographic()
      .scale(scale)
      .translate([width / 2, height / 2 - shiftY])
      .rotate(rotation)
      .clipAngle(config.id === 'belt' ? null : 90);

    const path = d3.geoPath(projection, context);
    const center = [width / 2, height / 2 - shiftY];

    // BACKGROUND
    context.fillStyle = '#121212';
    context.fillRect(0, 0, width, height);

    // Starfield
    starfield.forEach(star => {
        const x = (star.x - rotation[0] * 2) % width;
        const finalX = x < 0 ? x + width : x;
        context.fillStyle = '#64748b';
        context.globalAlpha = star.opacity * 0.5;
        context.fillRect(finalX, star.y % height, 2, 2);
    });
    context.globalAlpha = 1.0;

    // --- DRAW PLANET/BELT ---
    if (config.id === 'belt') {
        context.beginPath();
        context.arc(center[0], center[1], 2, 0, 2 * Math.PI);
        context.fillStyle = '#E42737';
        context.globalAlpha = 0.5;
        context.fill();
        context.globalAlpha = 1.0;

        asteroidField.forEach(rock => {
            const coords = projection([rock.lng, rock.lat]);
            if (coords) {
                const dx = coords[0] - center[0];
                const dy = coords[1] - center[1];
                const x = center[0] + dx * rock.alt;
                const y = center[1] + dy * rock.alt;

                const rotator = d3.geoRotation(rotation);
                const [rLng, rLat] = rotator([rock.lng, rock.lat]);
                const isBack = Math.abs(rLng) > 90;

                context.fillStyle = rock.color;
                context.globalAlpha = isBack ? rock.opacity * 0.3 : rock.opacity;
                const drawSize = isBack ? rock.size * 0.7 : rock.size;
                context.fillRect(x, y, drawSize * scale * 0.005, drawSize * scale * 0.005);
            }
        });
        context.globalAlpha = 1.0;
    } else {
        // Sphere Background
        context.beginPath(); path({ type: 'Sphere' });
        context.fillStyle = 'rgba(18, 18, 18, 0.95)'; context.fill();

        if (config.id !== 'earth') {
            context.beginPath(); path({ type: 'Sphere' });
            context.fillStyle = 'rgba(228, 39, 55, 0.15)'; context.fill();
        }
        
        const gradient = context.createRadialGradient(width / 2, height / 2 - shiftY, scale * 0.8, width / 2, height / 2 - shiftY, scale * 1.1);
        gradient.addColorStop(0, 'rgba(228, 39, 55, 0)');
        gradient.addColorStop(0.9, 'rgba(228, 39, 55, 0.05)');
        gradient.addColorStop(1, 'rgba(228, 39, 55, 0)');
        context.fillStyle = gradient;
        context.beginPath(); path({ type: 'Sphere' }); context.fill();
        
        context.beginPath(); path({ type: 'Sphere' });
        context.strokeStyle = '#334155'; context.lineWidth = 2; context.stroke();

        if (config.id === 'earth' && landData) {
            const graticule = d3.geoGraticule().step([15, 15]);
            context.beginPath(); path(graticule()); 
            context.strokeStyle = 'rgba(255, 255, 255, 0.05)'; context.lineWidth = 1; context.stroke();

            context.beginPath(); path(landData);
            context.fillStyle = 'rgba(228, 39, 55, 0.15)'; context.fill();
            
            if (config.data.routes) {
                context.strokeStyle = 'rgba(228, 39, 55, 0.6)'; context.lineWidth = 1.5; context.setLineDash([2, 4]);
                config.data.routes.forEach(route => {
                    const c1 = config.data.cities.find(c => c.name === route.from);
                    const c2 = config.data.cities.find(c => c.name === route.to);
                    if (c1 && c2) {
                        const lineString = { type: "LineString", coordinates: [[c1.lng, c1.lat], [c2.lng, c2.lat]] };
                        context.beginPath(); path(lineString as any); context.stroke();
                    }
                });
                context.setLineDash([]);
            }
        } else {
            const graticule = d3.geoGraticule().step([30, 30]);
            context.beginPath(); path(graticule()); 
            context.strokeStyle = 'rgba(228, 39, 55, 0.2)'; context.lineWidth = 1; context.stroke();
        }
    }

    // --- OCCUPIED SPACES TRACKER (For collision avoidance) ---
    const occupiedSpaces: {x: number, y: number, w: number, h: number}[] = [];

    // --- 1. RENDER ALL MARKERS (AND SIMPLE LABELS) FIRST ---
    const visibleCities: {city: City, x: number, y: number}[] = [];

    config.data.cities.forEach(city => {
        let x: number, y: number;
        let isVisible = false;

        if (config.id === 'belt') {
            const cityAlt = 2.2; 
            const coords = projection([city.lng, city.lat]);
            if (coords) {
                const dx = coords[0] - center[0];
                const dy = coords[1] - center[1];
                x = center[0] + dx * cityAlt;
                y = center[1] + dy * cityAlt;
                isVisible = true; 
            } else { return; }
        } else {
            const coords = projection([city.lng, city.lat]);
            const r = d3.geoRotation(rotation);
            isVisible = r([city.lng, city.lat])[0] > -90 && r([city.lng, city.lat])[0] < 90;
            if (coords && isVisible) {
                x = coords[0];
                y = coords[1];
            } else { return; }
        }

        if (isVisible) {
            visibleCities.push({city, x, y});
            
            const isHovered = hoveredItem === city;
            const isSelected = selectedCity?.name === city.name;
            const extraScale = 1.0;

            // Reserve space for the marker itself
            occupiedSpaces.push({ x: x - 6, y: y - 6, w: 12, h: 12 });

            // DRAW MARKER - NOW WITH PULSE
            const baseColor = city.category === 'ICE' ? '#00FFFF' :
                              city.category === 'AC' ? '#f472b6' :
                              city.category === 'ANOMALY' ? '#ef4444' :
                              city.category === 'MILITARY' ? '#fbbf24' : '#94a3b8';

            const time = performance.now();
            const pulseFreq = 2.5; 
            const pulsePhase = (Math.sin(time / 1000 * pulseFreq) + 1) / 2; // 0..1
            
            const radius = (isHovered ? 4 : 2.5) * extraScale;
            const expansionMax = 6;
            const currentExpand = radius + 2 + (pulsePhase * expansionMax);
            const currentOpacity = 0.6 * (1 - pulsePhase); // Fade out

            // Pulse Ring
            context.beginPath();
            context.arc(x, y, currentExpand, 0, 2 * Math.PI);
            context.fillStyle = `rgba(0,0,0,0)`; // Transparent fill
            // Convert hex to rgb for opacity handling (simplified approximation or use hardcoded map if needed)
            // Using globalAlpha instead
            context.save();
            context.strokeStyle = baseColor;
            context.globalAlpha = currentOpacity;
            context.lineWidth = 1;
            context.stroke();
            
            // Optional fill for the pulse
            context.fillStyle = baseColor;
            context.globalAlpha = currentOpacity * 0.3;
            context.fill();
            context.restore();

            // Core Dot
            context.beginPath(); 
            context.arc(x, y, radius, 0, 2 * Math.PI); 
            context.fillStyle = isHovered ? '#FFFFFF' : baseColor;
            context.fill();
            
            // Hover Glow
            if (isHovered) {
                context.shadowBlur = 8;
                context.shadowColor = '#FFFFFF';
                context.strokeStyle = '#FFFFFF';
                context.lineWidth = 1.5;
                context.stroke();
                context.shadowBlur = 0;
            }

            // Draw Bracket for selection
            if (isSelected) {
                const boxSize = 12; const cornerLen = 6;
                context.strokeStyle = '#E42737'; context.lineWidth = 2; context.beginPath();
                context.moveTo(x - boxSize, y - boxSize + cornerLen); context.lineTo(x - boxSize, y - boxSize); context.lineTo(x - boxSize + cornerLen, y - boxSize);
                context.moveTo(x + boxSize - cornerLen, y - boxSize); context.lineTo(x + boxSize, y - boxSize); context.lineTo(x + boxSize, y - boxSize + cornerLen);
                context.moveTo(x - boxSize, y + boxSize - cornerLen); context.lineTo(x - boxSize, y + boxSize); context.lineTo(x - boxSize + cornerLen, y + boxSize);
                context.moveTo(x + boxSize - cornerLen, y + boxSize); context.lineTo(x + boxSize, y + boxSize); context.lineTo(x + boxSize, y + boxSize - cornerLen);
                context.stroke();
            }

            // Simple text label for NON-focused items (UPDATED FONT)
            if (!isHovered && !isSelected) {
                context.font = "9px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, \"Liberation Mono\", \"Courier New\", monospace";
                context.fillStyle = 'rgba(255, 255, 255, 0.5)';
                context.textAlign = "center";
                context.textBaseline = "top"; 
                context.fillText(city.name, x, y + 10);
                
                // Add text area to occupied spaces to avoid overlap
                const textM = context.measureText(city.name);
                occupiedSpaces.push({ x: x - textM.width/2, y: y + 10, w: textM.width, h: 10 });
            }
        }
    });

    // --- 2. RENDER SMART FLOATING LABELS (HOVERED / SELECTED) ---
    // UPDATED FONT for Smart Labels
    context.font = "bold 12px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, \"Liberation Mono\", \"Courier New\", monospace";

    visibleCities.forEach(({city, x, y}) => {
        const isHovered = hoveredItem === city;
        const isSelected = selectedCity?.name === city.name;

        // Only draw Smart Label for hovered or selected items
        if (isHovered || isSelected) {
            
            const name = city.name;
            const nameWidth = context.measureText(name).width;
            const boxWidth = nameWidth + 24;
            const boxHeight = 28;
            const radius = 10; // offset from point

            // Candidates: Bottom, Top, Right, Left relative to marker
            const candidates = [
                { x: x - boxWidth / 2, y: y + radius + 15, w: boxWidth, h: boxHeight, type: 'bottom', ax: x, ay: y + radius },
                { x: x - boxWidth / 2, y: y - radius - boxHeight - 15, w: boxWidth, h: boxHeight, type: 'top', ax: x, ay: y - radius },
                { x: x + radius + 15, y: y - boxHeight / 2, w: boxWidth, h: boxHeight, type: 'right', ax: x + radius, ay: y },
                { x: x - radius - boxWidth - 15, y: y - boxHeight / 2, w: boxWidth, h: boxHeight, type: 'left', ax: x - radius, ay: y }
            ];

            let bestPos = candidates[0];
            
            // Check collision against other markers
            for (const cand of candidates) {
                let collision = false;
                for (const space of occupiedSpaces) {
                    // Ignore self collision (we are in occupiedSpaces, but our own marker is small)
                    if (Math.abs(space.x - (x - 6)) < 1 && Math.abs(space.y - (y - 6)) < 1) continue;

                    if (checkCollision(cand, space)) {
                        collision = true;
                        break;
                    }
                }
                if (!collision) {
                    bestPos = cand;
                    break;
                }
            }

            // Lerp Animation using Ref
            if (!labelPosRef.current.has(city.name)) {
                labelPosRef.current.set(city.name, { x: bestPos.x, y: bestPos.y });
            }
            const currentPos = labelPosRef.current.get(city.name)!;
            const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
            // Slightly faster lerp for response
            currentPos.x = lerp(currentPos.x, bestPos.x, 0.2);
            currentPos.y = lerp(currentPos.y, bestPos.y, 0.2);

            // DRAW CONNECTOR LINE
            context.beginPath();
            context.strokeStyle = '#E42737';
            context.lineWidth = 1;
            
            // Anchor logic: Draw from marker edge (bestPos.ax/ay) to the floating box (currentPos)
            if (bestPos.type === 'bottom') {
                context.moveTo(x, y + radius); context.lineTo(currentPos.x + boxWidth/2, currentPos.y); 
            } else if (bestPos.type === 'top') {
                context.moveTo(x, y - radius); context.lineTo(currentPos.x + boxWidth/2, currentPos.y + boxHeight); 
            } else if (bestPos.type === 'right') {
                context.moveTo(x + radius, y); context.lineTo(currentPos.x, currentPos.y + boxHeight/2);
            } else { // left
                context.moveTo(x - radius, y); context.lineTo(currentPos.x + boxWidth, currentPos.y + boxHeight/2);
            }
            context.stroke();

            // DRAW SCI-FI BOX at currentPos
            const bx = currentPos.x;
            const by = currentPos.y;

            context.fillStyle = 'rgba(10, 10, 10, 0.9)';
            context.beginPath();
            context.moveTo(bx, by); 
            context.lineTo(bx + boxWidth, by); 
            context.lineTo(bx + boxWidth, by + boxHeight - 6); 
            context.lineTo(bx + boxWidth - 6, by + boxHeight); 
            context.lineTo(bx + 6, by + boxHeight); 
            context.lineTo(bx, by + boxHeight - 6); 
            context.closePath();
            context.fill();

            context.strokeStyle = '#E42737';
            context.stroke();

            // Text (UPDATED FONT already set above)
            context.fillStyle = '#FFFFFF';
            context.textBaseline = "middle";
            context.textAlign = "center";
            context.fillText(name, bx + boxWidth/2, by + boxHeight/2 - 4);

            // Subtext (Coords) - UPDATED FONT
            context.font = "8px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, \"Liberation Mono\", \"Courier New\", monospace";
            context.fillStyle = '#E42737';
            context.fillText(`${city.lat.toFixed(1)} // ${city.lng.toFixed(1)}`, bx + boxWidth/2, by + boxHeight - 4);
            
            // Revert font for next iteration if needed (or just ensure it's set correctly next loop)
            context.font = "bold 12px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, \"Liberation Mono\", \"Courier New\", monospace";
            
            // Add to occupied so other selected labels don't overlap (if multiple)
            occupiedSpaces.push({ x: bx, y: by, w: boxWidth, h: boxHeight });
        }
    });

  }, [width, height, worldData, landData, rotation, scale, config, asteroidField, starfield, hoveredItem, cursorPos, selectedCity]);

  // Main Draw Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    if (!context) return;
    
    renderGlobe(context);

  }, [renderGlobe]);

  return (
    <div ref={containerRef} className="w-full h-full relative cursor-none" onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp} onWheel={handleWheel} onClick={handleClick}>
       <canvas 
         ref={canvasRef}
         width={width}
         height={height}
         className="block"
       />
       {/* TACTICAL MAP OVERLAY */}
       <div className="absolute bottom-10 right-10 text-right pointer-events-none z-50">
          <div className="flex items-center gap-2 mb-1 justify-end">
             <div className="text-[#E42737] text-xs font-bold tracking-[0.2em]">TACTICAL MAP</div>
             <Crosshair size={14} className="text-[#E42737]" />
          </div>
          <div className="h-[1px] w-32 bg-[#E42737]/30 mb-2 ml-auto"></div>
          <div className="text-slate-500 text-[10px] font-mono tracking-wider">SECTOR: {config.name} // ORBIT</div>
          <div className="text-slate-500 text-[10px] font-mono tracking-wider">GRID: PLANETARY</div>
       </div>
    </div>
  );
});

Globe.displayName = "Globe";
