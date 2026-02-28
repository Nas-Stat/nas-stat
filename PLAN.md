# High-Level Roadmap: Náš stát (Our State)

## Phase 1: "The Instant Pulse MVP" (Zlatý Tiket)
Cíl: Dostat aplikaci co nejrychleji mezi lidi, ověřit zájem (trakci) a posbírat první data.

*   **Milestone 1.1: Základní infrastruktura & Design System**
    *   Výběr moderního, levného a škálovatelného tech stacku (Next.js/React, Supabase, Vercel/Cloudflare).
    *   Návrh čistého, minimalistického UI zaměřeného na extrémní rychlost interakce (mobile-first).
*   **Milestone 1.2: Geografické hlášení (MapTiler)**
    *   Integrace mapových podkladů.
    *   Možnost přidat "špendlík", vybrat kategorii problému/pochvaly a udělit hodnocení (1-5 hvězd).
*   **Milestone 1.3: Tématické hlášení**
    *   Vytvoření feedu "Aktuální témata" (zákony, události bez konkrétní lokace).
    *   Možnost hlasování (sentiment) a základního komentování.
*   **Milestone 1.4: Veřejný "Pulse" Dashboard**
    *   Jednoduchá agregovaná zobrazení: "Co nejvíc pálí / těší občany dnes".
    *   Základní heatmapa na mapě republiky.

## Phase 2: "The Analytics Factory" (Pro Úředníky a Média)
Cíl: Přetavit nasbíraná data v užitečný nástroj pro veřejnou správu. Zpoplatnit prémiové analytické funkce pro organizace, novináře.

*   **Milestone 2.1: Úřednický Dashboard (B2G/B2B)**
    *   Přihlášení pro ověřené instituce (obce, kraje, ministerstva).
    *   Filtrování dat podle regionů, kompetencí a témat.
*   **Milestone 2.2: AI Sentiment Analysis**
    *   Nasazení AI pro automatické štítkování komentářů (např. agresivita, konstruktivní návrh, urgence).
    *   Generování denních/týdenních shrnutí ("TL;DR co se děje ve vaší obci").
*   **Milestone 2.3: Uzavření smyčky (Feedback Loop)**
    *   Funkce pro úředníky: "Přijato k řešení", "Vyřešeno", "Zamítnuto s odůvodněním".
    *   Notifikace občanům, kteří problém nahlásili nebo sledovali.

## Phase 3: "The Omnipresent Pulse" (Rozšíření)
Cíl: Stát se standardem pro zpětnou vazbu ve státě.

*   **Milestone 3.1: Nativní mobilní aplikace**
    *   Překlopení PWA do plnohodnotných iOS a Android aplikací (push notifikace, offline režim, lepší integrace s fotoaparátem a GPS).
*   **Milestone 3.2: Integrace s eGovernmentem**
    *   Volitelné přihlášení přes BankID / NIA pro "ověřená" hodnocení s vyšší vahou (pro úředníky, kteří chtějí eliminovat trolly).
*   **Milestone 3.3: Média API**
    *   Zpřístupnění datových feedů (API) pro zpravodajské portály (např. widgety "Nálada ve společnosti podle Náš stát" do článků).

---
**Poznámka pro The Squirrel (Tech Lead):**
Tato roadmapa je strategický plán. Tvým úkolem je vzít Fázi 1 (Zlatý tiket), analyzovat proveditelnost zvolených technologií (Next.js, MapTiler, Supabase) a rozpadnout ji na konkrétní technické úkoly (epics a stories). Zajímají mě rychlé výhry a minimální provozní náklady.