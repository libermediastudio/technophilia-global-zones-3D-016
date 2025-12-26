
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Globe, GlobeHandle } from './components/visuals/Globe.tsx';
import { SolarSystemMap, SolarSystemMapHandle } from './components/visuals/SolarSystemMap.tsx';

import { SystemNav } from './components/ui/SystemNav.tsx';
import { DetailPanel } from './components/ui/DetailPanel.tsx';
import { CursorHUD } from './components/ui/CursorHUD.tsx';
import { LocationList } from './components/ui/LocationList.tsx';
import { SystemList } from './components/ui/SystemList.tsx';
import { BodyInfo } from './components/ui/BodyInfo.tsx';
import { ActivationOverlay } from './components/ui/ActivationOverlay.tsx';
import { ExitButton } from './components/ui/ExitButton.tsx';

import { SOLAR_SYSTEM_DATA } from './data/constants.ts';
import { City } from './types/index.ts';

type ViewMode = 'ORBIT' | 'SYSTEM';

const App: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeBodyId, setActiveBodyId] = useState<string>('earth');
  const [selectedItem, setSelectedItem] = useState<City | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('ORBIT');
  const [zoomLevel, setZoomLevel] = useState<number>(30);
  const [isHovering, setIsHovering] = useState<boolean>(false);
  const [isActivated, setIsActivated] = useState<boolean>(false);
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  
  // HUD Panel Toggles
  const [infoVisible, setInfoVisible] = useState(true);
  const [listVisible, setListVisible] = useState(true);
  
  const globeRef = useRef<GlobeHandle>(null);
  const mapRef = useRef<SolarSystemMapHandle>(null);
  
  const activeConfig = SOLAR_SYSTEM_DATA.find(b => b.id === activeBodyId) || SOLAR_SYSTEM_DATA[0];

  useEffect(() => {
    const checkDevice = () => {
      const isSmallScreen = window.innerWidth < 1024;
      const hasTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
      setIsMobile(isSmallScreen || hasTouch);
      if (!isSmallScreen && !hasTouch) {
        setIsActivated(true);
        setInfoVisible(true);
        setListVisible(true);
      } else {
        // Default to hidden panels on mobile for better visibility
        setInfoVisible(false);
        setListVisible(false);
      }
    };
    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  const handleActivate = useCallback(async () => {
    setIsTransitioning(true);
    setTimeout(async () => {
      setIsActivated(true);
      setIsTransitioning(false);
      if (containerRef.current && containerRef.current.requestFullscreen) {
        try { await containerRef.current.requestFullscreen(); } catch (err) { console.warn("Fullscreen failed."); }
      }
    }, 1200);
  }, []);

  const handleDeactivate = useCallback(() => {
    if (document.fullscreenElement) document.exitFullscreen();
    setIsActivated(false);
    setIsTransitioning(false);
    setSelectedItem(null);
    setZoomLevel(30);
  }, []);

  useEffect(() => {
    const onFsChange = () => { if (!document.fullscreenElement && isActivated && isMobile) setIsActivated(false); };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, [isActivated, isMobile]);

  const handleZoomChange = (val: number) => {
    setZoomLevel(val);
    if (viewMode === 'ORBIT') globeRef.current?.setZoom(val);
    else mapRef.current?.setZoom(val);
  };

  const handleBodySelection = (id: string) => {
    setActiveBodyId(id);
    setSelectedItem(null);
  };

  const handleMapSelection = (id: string) => {
    setActiveBodyId(id);
    setSelectedItem(null);
    const detailedBodies = ['earth', 'moon', 'mars', 'belt', 'io', 'europa', 'ganymede', 'callisto'];
    if (viewMode === 'SYSTEM' && detailedBodies.includes(id)) {
        setViewMode('ORBIT');
    }
  };

  const handleCitySelect = (city: City) => {
    setSelectedItem(city);
    if (isMobile) {
      setInfoVisible(false);
      setListVisible(false);
    }
  };

  return (
    <div 
      ref={containerRef}
      className={`
        bg-[#121212] selection:bg-[#E42737] selection:text-white transition-all duration-700 ease-in-out
        ${isActivated ? 'fixed inset-0 z-[99999] w-full h-[100dvh]' : 'relative w-full h-[600px] lg:h-screen overflow-hidden'}
        ${isActivated && !isMobile && viewMode === 'ORBIT' && listVisible ? 'cursor-none' : 'cursor-default'}
      `}
    >
      <div className="absolute inset-0 pointer-events-none z-[5] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03]"></div>
      
      {isMobile && (!isActivated || isTransitioning) && (
        <>
          <div className={`scanline z-[100] transition-opacity duration-500 ${isTransitioning ? 'opacity-100' : 'opacity-40'}`} />
          <ActivationOverlay onActivate={handleActivate} isTransitioning={isTransitioning} />
        </>
      )}
      
      {isActivated && isMobile && <ExitButton onDeactivate={handleDeactivate} />}
      {isActivated && !isMobile && viewMode === 'ORBIT' && listVisible && <CursorHUD isHovering={isHovering} />}

      <div 
        className={`
          absolute inset-0 transition-all duration-[1200ms] ease-out z-20
          ${isActivated ? 'opacity-100 scale-100 blur-0 brightness-100' : 'opacity-40 scale-[0.98] blur-[2px] brightness-50 grayscale-[0.5]'}
        `}
      >
        {viewMode === 'ORBIT' ? (
            <div className="absolute inset-0">
              <Globe 
                  ref={globeRef}
                  config={activeConfig} 
                  onSelect={handleCitySelect}
                  selectedCity={selectedItem}
                  onHoverChange={setIsHovering}
                  interactionsEnabled={isActivated}
              />
              <BodyInfo config={activeConfig} isVisible={infoVisible} />
              <LocationList 
                  data={activeConfig.data}
                  onSelect={(city) => { handleCitySelect(city); globeRef.current?.flyTo(city); }} 
                  selectedCity={selectedItem}
                  isVisible={listVisible}
              />
              {selectedItem && <DetailPanel data={selectedItem} onClose={() => setSelectedItem(null)} />}
            </div>
        ) : (
            <div className="absolute inset-0">
               <SolarSystemMap 
                  ref={mapRef}
                  bodies={SOLAR_SYSTEM_DATA} 
                  currentBodyId={activeBodyId}
                  onSelect={handleMapSelection} 
                  onHoverChange={setIsHovering}
                  onZoomAutoChange={setZoomLevel}
                  interactionsEnabled={isActivated}
               />
               <BodyInfo config={activeConfig} isVisible={infoVisible} />
               {/* Usunięto SystemList zgodnie z prośbą użytkownika */}
            </div>
        )}
      </div>

      {(isActivated || (!isMobile && !isTransitioning)) && (
        <div className={`absolute inset-0 pointer-events-none z-40 transition-opacity duration-1000 ${isActivated ? 'opacity-100' : 'opacity-0'}`}>
            <SystemNav 
                bodies={SOLAR_SYSTEM_DATA} 
                currentBodyId={activeBodyId} 
                viewMode={viewMode}
                zoomLevel={zoomLevel}
                onViewModeChange={setViewMode}
                onSelectBody={handleBodySelection}
                onZoomChange={handleZoomChange}
                onToggleInfo={() => setInfoVisible(!infoVisible)}
                onToggleList={() => setListVisible(!listVisible)}
                infoVisible={infoVisible}
                listVisible={listVisible}
                isMobile={isMobile}
            />
        </div>
      )}
    </div>
  );
};

export default App;
