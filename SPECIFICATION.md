# Vision: Náš stát (Our State) - The Pulsometer of Society

## 1. The Core Purpose (Why?)
Občané dnes nemají efektivní, rychlý a moderní způsob, jak poskytovat zpětnou vazbu k akcím státní správy a samosprávy mimo volební cykly. "Náš stát" mění tuto dynamiku. Aplikace přináší model hodnocení známý z komerční sféry (Uber, Airbnb, Google Maps) do veřejného sektoru.

Cílem není vytvořit jen digitální podatelnu stížností, ale **pulzující ekosystém zpětné vazby**, kde:
*   Občané mohou okamžitě chválit i kritizovat.
*   Úředníci a politici získávají analytická data v reálném čase.
*   Média mají přístup k trendům a náladám ve společnosti.

## 2. Market Segments (The Tasters)
*   **Občané:** Hledají jednoduchost a rychlost. Chtějí pocit, že jejich hlas je zaznamenán a má váhu.
*   **Veřejná správa (Úředníci, Politici):** Potřebují filtrovat "šum" od podstatných informací. Vyžadují nástroje pro analýzu sentimentu a agregaci problémů, ideálně za pomoci AI.
*   **Média a analytici:** Hledají zdroje pro reportáže a pochopení občanské spokojenosti v regionech a tématech.

## 3. The Golden Ticket: "Instant Pulse MVP" (Phase 1)
Pro první fázi vývoje se zaměříme na největší hodnotu s nejmenším třením.

### Klíčové vlastnosti MVP:
1.  **Geografická zpětná vazba (Map-based):**
    *   Integrace MapTiler.
    *   Uživatel může označit lokaci (např. rozbitá silnice, skvěle upravený park).
    *   Rychlé hodnocení (škála nespokojenosti/spokojenosti) + volitelný textový komentář/foto.
2.  **Tématická zpětná vazba (Non-geographic):**
    *   Feed "Aktuální celostátní/krajská témata" (např. nový zákon, reforma školství).
    *   Možnost vyjádřit sentiment a komentovat.
3.  **Základní veřejný Dashboard:**
    *   Zobrazení "Trending" problémů a témat (co lidi aktuálně nejvíce pálí nebo těší).
    *   Teplotní mapa (Heatmap) spokojenosti.
4.  **Status řešení:**
    *   Základní indikace, zda se problémem už někdo oficiálně zabývá (např. "Přijato k řešení", "Vyřešeno").

## 4. Design & User Experience Guidelines
*   **Extrémní jednoduchost:** Žádné byrokratické formuláře. Interakce musí být rychlá, intuitivní, srovnatelná s lajkováním na sociálních sítích.
*   **Vizuální čistota:** Moderní, nerušivý design. Důraz na jasnou typografii a barvy (zelená pro pozitivní, červená pro negativní).
*   **Odměňující interakce:** Uživatel musí mít vizuální pocit, že jeho hlas "zapadl do systému" (mikrointerakce, animace při odeslání).

## 5. High-Level Architecture Strategy (For The Squirrel)
*   **Přístup:** Mobile-first webová aplikace (PWA - Progressive Web App) pro maximální dosah a minimální náklady na distribuci (odpadá nutnost schvalování v App Storech v první fázi), s možností snadného překlopení do nativní aplikace později.
*   **Technologie (Doporučení k validaci):** Moderní JS/TS framework (např. Next.js, Nuxt), MapTiler pro mapy.
*   **Infrastruktura:** Serverless architektura (např. Supabase/Firebase, Vercel/Cloudflare) pro minimalizaci nákladů na údržbu a levný provoz, který škáluje s počtem uživatelů.
