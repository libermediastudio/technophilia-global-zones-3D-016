# Tech Stack & Architecture

## 📦 Core Libraries
Na podstawie `package.json` oraz plików źródłowych:

*   **Runtime/Framework**: `React 18.2.0`, `ReactDOM 18.2.0` (Zgodność z Vercel/Lucide)
*   **Transpilacja (Dev)**: `@babel/standalone` (w wersji przeglądarkowej "standalone") oraz `vite` (w wersji build).
*   **Wizualizacja danych / Grafika**:
    *   `d3 @ 7.9.0` (Głównie moduły `d3-geo`, `d3-selection`, `d3-transition`).
    *   `topojson-client @ 3.1.0` (Obsługa danych mapy świata).
*   **Ikony**: `lucide-react @ 0.263.1`.
*   **Style**: `Tailwind CSS` (ładowany przez CDN w HTML lub npm w buildzie).

## 🗂 Struktura Katalogów (`src` concept)

Choć projekt działa w strukturze płaskiej lub hybrydowej, logiczna architektura wygląda następująco:

```text
/
├── index.html              # Entry point (HTML + Babel Script + ImportMap)
├── index.tsx               # React Entry point (Mounting root)
├── App.tsx                 # Główny komponent orkiestrujący widoki
├── types.ts                # Definicje typów TypeScript (Interfaces: City, Planet, Config)
├── constants.ts            # Stałe dane (EARTH_DATA, SOLAR_SYSTEM_DATA, Colors)
├── metadata.json           # Konfiguracja projektu/uprawnień
├── package.json            # Zależności i skrypty budowania
│
└── components/             # Komponenty UI i Logiczne
    ├── Globe.tsx           # Widok 3D Planety (D3.js integration)
    ├── SolarSystemMap.tsx  # Widok Systemu (Canvas 2D rendering)
    ├── CursorHUD.tsx       # Warstwa celownika myszy
    ├── SystemNav.tsx       # Dolna nawigacja i zoom
    ├── LocationList.tsx    # Prawa lista lokalizacji/celów
    ├── SystemList.tsx      # Prawa lista planet (widok systemu)
    ├── DetailPanel.tsx     # Okno szczegółów (po kliknięciu)
    ├── BodyInfo.tsx        # Panel statystyk ciała niebieskiego
    ├── Controls.tsx        # Instrukcja obsługi (rozwijana)
    └── Legend.tsx          # Legenda kolorów (rozwijana)
```

## ⚙️ Kluczowe mechanizmy
1.  **D3 + React**: React zarządza drzewem DOM i stanem aplikacji, D3/Canvas przejmuje kontrolę nad elementem `<canvas>` wewnątrz `useEffect` i `useRef`.
2.  **Physics Loop**: W `Globe.tsx` zaimplementowana jest pętla fizyki (`requestAnimationFrame`) dla efektu inercji przy obracaniu globem oraz płynnego zoomu.
3.  **Hybrid Compatibility**: Kod jest napisany tak, aby mógł działać bez procesu budowania (Node.js/standalone HTML) oraz w procesie CI/CD (Vercel/Vite).
