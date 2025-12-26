# Style Guide & Design System

Projekt wykorzystuje estetykę **Cyberpunk / Tactical HUD**. Opiera się na ciemnym tle, wysokim kontraście i monospacyjnych fontach. Style są realizowane głównie przez klasy użytkowe Tailwind CSS.

## 🎨 Paleta Kolorów

### Główne
*   **Background**: `#121212` (Głęboka czerń/szarość) - Tło aplikacji i paneli.
*   **Primary Accent**: `#E42737` (Intensywna Czerwień) - Elementy interaktywne, ramki, celownik, aktywne stany.
*   **Secondary Accent**: `#00FFFF` (Cyan / Electric Blue) - Elementy typu ICE, statusy "OPTIMAL".

### Statusowe (zdefiniowane w `constants.ts` i kodzie)
*   **ICE NODE**: `#00FFFF` (Cyan)
*   **AC POST**: `#F472B6` (Różowy / Magenta)
*   **WILD/CLF**: `#94a3b8` (Slate 400 - Szary błękit)
*   **ANOMALY / WARNING**: `#ef4444` (Czerwony)
*   **Dimmed Text**: `#64748b` (Slate 500)

## 🔤 Typografia

W całym projekcie wymuszony jest krój monospacyjny dla zachowania technicznego charakteru.

*   **Font Family**: `ui-monospace`, `SFMono-Regular`, `Menlo`, `Monaco`, `Consolas`, `"Liberation Mono"`, `"Courier New"`, `monospace`.
*   **Wielkości tekstu**:
    *   Nagłówki sekcji: `text-xs` (12px) z `tracking-[0.2em]` (rozstrzelone litery).
    *   Etykiety na mapie: `bold 12px` (Canvas context).
    *   Tekst poboczny: `text-[10px]` lub `text-[9px]`.
    *   Dane liczbowe: Często `font-bold`.

## 🧩 Elementy UI (Design Tokens)

### Panele i Okna
*   **Tło**: `bg-[#121212]/80` (Półprzezroczyste).
*   **Efekt szkła**: `backdrop-blur-sm`.
*   **Obramowanie**: `border-b` lub pełne `border` w kolorze `#E42737]/50`.
*   **Cień**: `shadow-[0_0_20px_rgba(0,0,0,0.5)]` (Mocny glow).
*   **Kształt**: Brak zaokrągleń (`rounded-none` domyślnie), ostre krawędzie.

### Przyciski i Listy
*   **Stan spoczynku**: Przezroczyste lub bardzo ciemne tło, tekst Slate/Dimmed Red.
*   **Hover**: Podświetlenie tła (`bg-[#E42737]/10`), rozjaśnienie tekstu.
*   **Active**: Pełne lub częściowe wypełnienie kolorem akcentu, pogrubiony tekst, dodatkowy znacznik (np. `border-l-2`).

### Animacje
*   **Fade In**: `@keyframes fadeIn` (0.5s ease-out).
*   **Spin**: Wolne obroty dla elementów tła.
*   **Pulse**: Używany dla markerów na mapie.
