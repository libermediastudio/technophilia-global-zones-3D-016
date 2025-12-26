# Project Roadmap: Interactive Global Zones

Stan projektu: **Zaawansowany / Faza końcowa**

## ✅ Zaimplementowane Funkcjonalności (Inventory)

### Core Engine
- [x] **Inicjalizacja React 18** (Tryb StrictMode, struktura komponentowa).
- [x] **Obsługa routingu widoków** (Przełączanie między `ORBIT` a `SYSTEM`).
- [x] **Zarządzanie stanem globalnym** (Wybrane ciało niebieskie, poziom zoomu, hover, selekcja).

### Widok Systemu Słonecznego (Orrery)
- [x] **Rendering Canvas 2D** z symulacją 3D (rzutowanie izometryczne/perspektywiczne).
- [x] **Animacja orbit** (Obliczanie pozycji planet w czasie rzeczywistym).
- [x] **Pas asteroid** (Renderowanie cząsteczkowe z obrotem).
- [x] **Interakcja** (Click-to-select, Hover effect, Zoom scroll).
- [x] **Skala i dystans** (Rysowanie pierścieni AU).

### Widok Orbitalny (Globe)
- [x] **Rendering D3.js** (Projekcja `geoOrthographic`).
- [x] **Dane geograficzne** (Ładowanie `world-atlas` TopoJSON).
- [x] **Interakcja** (Drag-to-rotate, inercja/momentum przy obrocie).
- [x] **Wizualizacja miast/punktów** (Różne kolory dla frakcji ICE, AC, WILD, itp.).
- [x] **Smart Labels** (Etykiety unikające kolizji, linie prowadzące do punktów).
- [x] **Połączenia/Trasy** (Linie przerywane między miastami).

### UI / HUD (Heads-Up Display)
- [x] **Stylistyka Cyberpunk/Sci-Fi** (Kolorystyka, fonty monospace, cienkie ramki).
- [x] **System Navigation** (Dolny pasek z listą ciał niebieskich i suwakiem Zoom).
- [x] **Cursor HUD** (Celownik podążający za kursorem z koordynatami).
- [x] **Location List** (Prawa kolumna z listą celów i wyszukiwarką).
- [x] **Detail Panel** (Okienko ze szczegółami jednostki, efekt pisania tekstu).
- [x] **Body Info** (Lewy panel ze statystykami planety: grawitacja, temperatura itp.).
- [x] **Legend & Controls** (Rozwijane panele informacyjne).
- [x] **Responsywność** (Ukrywanie paneli bocznych na mniejszych ekranach).

---

## 🛠 Final Polish & Fixes (Faza Końcowa)

Poniżej lista elementów do weryfikacji przed ostatecznym wdrożeniem (do uzupełnienia):

- [ ] **Optymalizacja wydajności Canvas**: Sprawdzenie FPS przy dużej liczbie cząsteczek w pasie asteroid.
- [ ] **Testy mobilne**: Weryfikacja obsługi dotyku (Touch Events) dla obracania globusem (obecnie obsługa `onMouseDown`/`MouseMove` może wymagać mapowania na `TouchStart`).
- [ ] **Dostępność (A11y)**: Dodanie atrybutów `aria-label` do przycisków ikonowych (np. w `Controls.tsx`).
- [ ] **Error Handling**: Obsługa błędu ładowania pliku TopoJSON (np. fallback offline).
