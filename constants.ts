
import { CelestialBodyConfig, GlobeData } from './types.ts';

export const WORLD_ATLAS_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

// --- COLORS (HUD THEME) ---
const COLORS = {
  ICE: '#00FFFF',   // Electric Cyan
  BUFFER_DOT: '#0e7490', // Dark Cyan/Teal for background dots
  AC: '#F472B6',    // Hot Pink / Magenta (Accent)
  WILD: '#94a3b8',  // Slate (Dimmed)
  ANOMALY: '#ef4444' // Red (Error/Warning)
};

// --- EARTH DATA ---
const EARTH_DATA: GlobeData = {
  cities: [
    { name: 'NY-PRIME', lat: 40.7, lng: -74.0, category: 'ICE', faction: 'ICE', type: 'Node.Finance', population: '80M', status: 'ONLINE', description: 'Primary data-exchange hub for Atlantic sector.' },
    { name: 'LONDON SPIRE', lat: 51.5, lng: -0.1, category: 'ICE', faction: 'ICE', type: 'Node.Finance', population: '60M', status: 'ONLINE', description: 'Secondary processing core.' },
    { name: 'EURO-FORGE', lat: 50.9, lng: 6.9, category: 'ICE', faction: 'ICE', type: 'Node.Manufacture', population: '45M', status: 'ACTIVE', description: 'Automated fabrication complex.' },
    { name: 'TOKYO METROPLEX', lat: 35.6, lng: 139.6, category: 'ICE', faction: 'ICE', type: 'Node.Tech', population: '90M', status: 'OPTIMAL', description: 'Pac-Rim master server location.' },
    { name: 'SHANGHAI LINK', lat: 31.2, lng: 121.4, category: 'ICE', faction: 'ICE', type: 'Node.Tech', population: '75M', status: 'OPTIMAL', description: 'Asia-Pacific logistics router.' },
    { name: 'SF-SILICON', lat: 37.7, lng: -122.4, category: 'ICE', faction: 'ICE', type: 'Node.Cyber', population: '40M', status: 'OPTIMAL', description: 'Legacy code repository and AI training ground.' },
    { name: 'GENEWA ENCLAVE', lat: 46.2, lng: 6.1, category: 'AC', faction: 'AC', type: 'Diplomacy.IO', population: '850K', status: 'MONITORED', description: 'Neutral data haven.' },
    { name: 'SINGAPUR PORT', lat: 1.35, lng: 103.8, category: 'AC', faction: 'AC', type: 'Uplink.Orbit', population: '1.2M', status: 'MONITORED', description: 'Primary orbital elevator uplink.' },
    { name: 'SVALBARD VAULT', lat: 78.2, lng: 15.6, category: 'AC', faction: 'AC', type: 'Storage.Cold', population: '150K', status: 'CRITICAL', description: 'Biological backup archive.' },
    { name: 'FILTER (GANGES)', lat: 22.5, lng: 89.5, category: 'WILD', faction: 'River Clans', type: 'Habitation.Dense', population: '30M', status: 'OVERLOAD', description: 'Unregulated biomass concentration.' },
    { name: 'PINE GAP', lat: -23.7, lng: 133.9, category: 'MILITARY', faction: 'CLF', type: 'Signal.Source', population: '150K', status: 'ENCRYPTED', description: 'Rogue signal detected.' },
    { name: 'WARSAW ZERO', lat: 52.2, lng: 21.0, category: 'ANOMALY', faction: 'NULL', type: 'Zone.Exclusion', population: '0', status: 'RADIATION', description: 'Data corruption epicenter.' },
  ],
  routes: [
    { from: 'NY-PRIME', to: 'LONDON SPIRE' },
    { from: 'LONDON SPIRE', to: 'EURO-FORGE' },
    { from: 'TOKYO METROPLEX', to: 'SHANGHAI LINK' },
    { from: 'TOKYO METROPLEX', to: 'SF-SILICON' },
  ]
};

export const SOLAR_SYSTEM_DATA: CelestialBodyConfig[] = [
  {
    id: 'mercury', 
    name: 'MERCURY', 
    type: 'Planet', 
    baseColor: '#121212', 
    atmosphereColor: 'rgba(255, 100, 100, 0.1)', 
    description: 'Scorched rock close to Sol. Massive solar arrays harvest raw energy for the system.', 
    stats: { gravity: '3.7 m/s²', temperature: '167°C', population: '15K', atmosphere: 'NONE' }, 
    data: { cities: [{ name: 'HELIOS-1', lat: 0, lng: 0, category: 'ICE', faction: 'Energy Corp' }] }
  },
  {
    id: 'venus', 
    name: 'VENUS', 
    type: 'Planet', 
    baseColor: '#121212', 
    atmosphereColor: 'rgba(255, 100, 0, 0.2)', 
    description: 'Toxic atmosphere and extreme pressure. Floating cloud-cities serve as chemical processing plants.', 
    stats: { gravity: '8.87 m/s²', temperature: '464°C', population: '1.2M', atmosphere: 'CO2/N2' }, 
    data: { cities: [{ name: 'AEROHAVEN', lat: 10, lng: 20, category: 'AC', faction: 'Cloud Walkers' }] } 
  },
  {
    id: 'earth',
    name: 'TERRA',
    type: 'Planet',
    baseColor: '#121212',
    atmosphereColor: 'rgba(0, 255, 255, 0.2)',
    description: 'The cradle of humanity and the central hub of the ICE Network. Heavily urbanized and regulated.',
    stats: { gravity: '9.81 m/s²', temperature: '14.9°C', population: '12.5B', atmosphere: 'N2/O2/Ar' },
    data: EARTH_DATA
  },
  {
    id: 'moon',
    name: 'LUNA',
    type: 'Moon',
    baseColor: '#121212',
    atmosphereColor: 'rgba(0,0,0,0)',
    description: 'Industrial mining zone for Helium-3. Low-gravity manufacturing and orbital shipyards.',
    stats: { gravity: '1.62 m/s²', temperature: '-23°C', population: '250K', atmosphere: 'NONE' },
    data: { cities: [{ name: 'HEL-3 MINES', lat: 0.6, lng: 23.4, category: 'ICE', faction: 'ICE', type: 'Extraction', population: '25K', status: 'ACTIVE' }, { name: 'TYCHO NODE', lat: -43.3, lng: -11.3, category: 'WILD', faction: 'CLF', type: 'Hidden', status: 'HOSTILE' }] }
  },
  {
    id: 'mars',
    name: 'MARS',
    type: 'Planet',
    baseColor: '#121212',
    atmosphereColor: 'rgba(244, 114, 182, 0.1)',
    description: 'Terraforming project in progress. The Red Planet serves as the secondary capital of the system.',
    stats: { gravity: '3.72 m/s²', temperature: '-63°C', population: '52M', atmosphere: 'CO2/Ar' },
    data: { cities: [{ name: 'NEW UTOPIA', lat: -14.6, lng: -78.5, category: 'AC', faction: 'AC', type: 'Colony', population: '52M', status: 'STABLE' }] }
  },
  {
    id: 'belt',
    name: 'BELT',
    type: 'Asteroid Belt',
    baseColor: '#121212',
    atmosphereColor: 'rgba(0,0,0,0)',
    description: 'A lawless frontier of loose rocks and rogue factions. Rich in rare minerals, poor in laws.',
    stats: { gravity: '~0 m/s²', temperature: '-73°C', population: '3.1M', atmosphere: 'NONE' },
    data: { cities: [{ name: 'CERES STN', lat: 0, lng: 0, category: 'WILD', faction: 'CLF' }] }
  },
  {
    id: 'jupiter',
    name: 'JUPITER',
    type: 'Planet',
    baseColor: '#121212',
    atmosphereColor: 'rgba(234, 179, 8, 0.2)',
    description: 'The Gas Giant. Gravitational anchor of the outer system. Atmosphere extraction stations orbit in the upper layers.',
    stats: { gravity: '24.79 m/s²', temperature: '-108°C', population: '0', atmosphere: 'H2/He' },
    data: { cities: [] }
  },
  {
    id: 'io',
    name: 'IO',
    type: 'Moon',
    baseColor: '#121212',
    atmosphereColor: 'rgba(234, 179, 8, 0.1)',
    description: 'Volcanically active hellscape. Geothermal energy production and hazardous waste disposal.',
    stats: { gravity: '1.79 m/s²', temperature: '-130°C', population: '2K', atmosphere: 'SO2' },
    data: { cities: [{ name: 'MACA', lat: -18, lng: -104, category: 'ANOMALY' }] }
  },
  {
    id: 'europa',
    name: 'EUROPA',
    type: 'Moon',
    baseColor: '#121212',
    atmosphereColor: 'rgba(0, 255, 255, 0.1)',
    description: 'An icy shell covering a subsurface ocean. Research stations monitor the alien depths.',
    stats: { gravity: '1.31 m/s²', temperature: '-160°C', population: '45K', atmosphere: 'O2 (Trace)' },
    data: { cities: [{ name: 'TETHYS', lat: -15, lng: 100, category: 'MILITARY' }] }
  },
  {
    id: 'ganymede',
    name: 'GANYMEDE',
    type: 'Moon',
    baseColor: '#121212',
    atmosphereColor: 'rgba(0,0,0,0)',
    description: 'The largest moon in the system. A major trade hub for the outer planets fleet.',
    stats: { gravity: '1.43 m/s²', temperature: '-163°C', population: '85K', atmosphere: 'O2 (Trace)' },
    data: { cities: [{ name: 'ARGUS', lat: 45, lng: -120, category: 'MILITARY' }] }
  },
  {
    id: 'callisto',
    name: 'CALLISTO',
    type: 'Moon',
    baseColor: '#121212',
    atmosphereColor: 'rgba(0,0,0,0)',
    description: 'Jupiter\'s outermost moon. The dead surface hides deep military black-sites.',
    stats: { gravity: '1.24 m/s²', temperature: '-139°C', population: '12K', atmosphere: 'CO2 (Trace)' },
    data: { cities: [{ name: 'EYE', lat: 15, lng: 56, category: 'MILITARY' }] }
  },
  {
    id: 'saturn',
    name: 'SATURN',
    type: 'Planet',
    baseColor: '#121212',
    atmosphereColor: 'rgba(200, 200, 100, 0.2)',
    description: 'The Ringed Giant. Home to orbital refineries and gas extraction platforms.',
    stats: { gravity: '10.44 m/s²', temperature: '-139°C', population: '800K', atmosphere: 'H2/He' },
    data: { cities: [{ name: 'TITAN ORBITAL', lat: 0, lng: 0, category: 'ICE', faction: 'ICE' }] }
  },
  {
    id: 'uranus',
    name: 'URANUS',
    type: 'Planet',
    baseColor: '#121212',
    atmosphereColor: 'rgba(100, 200, 255, 0.2)',
    description: 'The Ice Giant. Remote cooling stations and long-range sensor arrays.',
    stats: { gravity: '8.69 m/s²', temperature: '-195°C', population: '5K', atmosphere: 'H2/He/CH4' },
    data: { cities: [{ name: 'OBSERVATORY-X', lat: 45, lng: 0, category: 'AC', faction: 'AC' }] }
  },
  {
    id: 'neptune',
    name: 'NEPTUNE',
    type: 'Planet',
    baseColor: '#121212',
    atmosphereColor: 'rgba(0, 0, 255, 0.2)',
    description: 'The Windy Planet. The furthest outpost of human civilization. A gateway to the unknown.',
    stats: { gravity: '11.15 m/s²', temperature: '-201°C', population: '200', atmosphere: 'H2/He/CH4' },
    data: { cities: [{ name: 'TRITON OUTPOST', lat: 0, lng: 0, category: 'MILITARY', faction: 'Deep Nav' }] }
  }
];