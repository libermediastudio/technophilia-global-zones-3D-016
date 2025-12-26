# AI Development Rules

**Status Projektu: STABLE / FINAL RELEASE CANDIDATE**

Ponieważ projekt jest w fazie końcowej, priorytetem jest **STABILNOŚĆ**.

1.  **Zero Nowych Zależności**: Nie dodawaj nowych bibliotek npm ani skryptów CDN, chyba że jest to krytycznie niezbędne do naprawy błędu. Korzystaj z tego, co jest w `tech-stack.md` (React, D3, Lucide, Tailwind).
2.  **Spójność Stylów**: Przed dodaniem nowego elementu UI sprawdź `style-guide.md`. Używaj istniejącej palety kolorów (`#E42737`, `#121212`, `#00FFFF`) i fontów monospacyjnych. Nie wprowadzaj zaokrąglonych rogów (`rounded`), chyba że element tego wymaga (np. kropki statusu).
3.  **Dokumentacja**: Po każdym wdrożeniu nowej funkcji lub istotnej poprawce, zaktualizuj `docs/project-roadmap.md` odznaczając odpowiednie pole lub dodając nową pozycję.
4.  **Bezpieczeństwo Kodu**: Nie usuwaj istniejących zabezpieczeń (np. `error boundaries`, sprawdzania `if (!rootElement)`).
5.  **Struktura**: Trzymaj się ustalonego podziału na komponenty w folderze `components/`. Nie wrzucaj logiki biznesowej do `App.tsx`, jeśli może być w osobnym pliku.

**Cel: Utrzymanie wysokiej jakości, wydajności i spójności wizualnej bez "over-engineeringu" na ostatniej prostej.**
