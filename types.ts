
export type LocationCategory = 'ICE' | 'AC' | 'WILD' | 'MILITARY' | 'ANOMALY';
export type BodyID = 'mercury' | 'venus' | 'earth' | 'moon' | 'mars' | 'belt' | 'jupiter' | 'io' | 'europa' | 'ganymede' | 'callisto' | 'saturn' | 'uranus' | 'neptune';

export interface City {
  name: string;
  lat: number;
  lng: number;
  category: LocationCategory;
  faction?: string;
  type?: string;
  population?: string;
  status?: string;
  description?: string;
}

export interface Route {
  from: string;
  to: string;
  type?: string;
  status?: string;
}

export interface GlobeData {
  cities: City[];
  routes?: Route[];
}

export interface BodyStats {
  gravity: string;
  temperature: string;
  population: string;
  atmosphere: string;
}

export interface CelestialBodyConfig {
  id: BodyID;
  name: string;
  type: 'Planet' | 'Moon' | 'Asteroid Belt';
  baseColor: string;
  atmosphereColor: string;
  description?: string;
  stats?: BodyStats;
  data: GlobeData;
}