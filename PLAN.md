# Detailed Technical Roadmap: Náš stát (Our State)

Tento dokument slouží jako detailní architektonický plán pro vývojový tým (Oompa Loompas), odvozený z high-level vize.

## Phase 1: "The Instant Pulse MVP" (Zlatý Tiket)

**Architektonický cíl:** Plně funkční lokální vývojové prostředí v Dockeru, základní Next.js aplikace, bezpečná autentizace (Google, Email) přes Supabase a napojení na MapTiler.

### Epic 1.1: Základní infrastruktura a Setup (Foundation)

- [x] **Story 1.1.1: Inicializace Next.js a repozitáře**
  - [x] Vytvořit novou Next.js aplikaci (App Router, TypeScript, Tailwind CSS).

  - [x] Nastavit ESLint, Prettier.

- [x] **Story 1.1.2: Lokální vývojové prostředí (Docker)**
  - [x] Vytvořit `Dockerfile` a `docker-compose.yml` pro lokální běh Next.js aplikace.
  - [x] Zajistit, aby se změny v kódu okamžitě projevovaly i uvnitř kontejneru (hot-reloading).
- [x] **Story 1.1.3: Kostra dokumentace (README)**
  - [x] Vytvořit `README.md` s instrukcemi pro lokální spuštění přes Docker (hotovo, průběžně aktualizovat).
  - [x] Připravit sekce pro budoucí dokumentaci produkčního a testovacího nasazení.

### Epic 1.2: Databáze a Autentizace (Supabase)

- [x] **Story 1.2.1: Supabase Projekt & Schéma**
  - [x] Založit Supabase projekt.
  - [x] Vytvořit základní SQL tabulky: `users`, `reports` (s podporou PostGIS pro lokaci - lat, lng), `topics`, `votes`.
  - [x] Nastavit Row Level Security (RLS), aby data mohl číst každý, ale zapisovat jen přihlášený uživatel.
- [x] **Story 1.2.2: Autentizace uživatelů**
  - [x] Integrovat `@supabase/ssr` pro Next.js.
  - [x] Implementovat přihlášení pomocí Emailu/Hesla.
  - [x] Implementovat přihlášení pomocí Google OAuth.
  - [x] Vytvořit jednoduché UI pro login/registraci.

### Epic 1.3: Geografické hlášení (MapTiler)

- [x] **Story 1.3.1: Integrace mapy**
  - [x] Integrovat MapTiler pomocí maplibregl nebo react-map-gl.
  - [x] Zobrazit mapu s možností navigace (pan, zoom).
- [x] **Story 1.3.2: Vkládání "špendlíků" (Reports)**
  - [x] Umožnit uživateli kliknout do mapy a umístit špendlík.
  - [x] Vytvořit formulář (drawer/modal) pro přidání hodnocení (1-5 hvězd, text, kategorie) k dané lokaci.
  - [x] Uložit data do Supabase (vyžaduje přihlášení z Epicu 1.2).
- [x] **Story 1.3.3: Zobrazení existujících hlášení**
  - [x] Načíst hlášení ze Supabase a zobrazit je jako body na mapě (např. barevně odlišené podle hodnocení).

- [x] **Story 1.3.4: Refactor and Polish Reports (Issue #6 cleanup)**
  - [x] Fix linter failures by removing `any` types in `ReportsClient.test.tsx` and `reports/page.tsx`.
  - [x] Replace `window.location.reload()` with `useRouter().refresh()` in `ReportsClient.tsx`.
  - [x] Implement robust `zod` validation in `createReport` server action.

### Epic 1.4: Tématické hlášení a Dashboard

- [x] **Story 1.4.1: Feed témat**
  - [x] Vytvořit UI pro zobrazení seznamu aktuálních témat bez geografické vazby.
  - [x] Umožnit přihlášeným uživatelům hlasovat (palec nahoru/dolů) a přidat komentář.
- [x] **Story 1.4.2: Základní Pulse Dashboard**
  - [x] Jednoduchá analytická stránka zobrazující agregovaná data (např. nejnovější hlášení, nejvíce diskutovaná témata).

- [x] **Story 1.4.3: Refactor and Polish Topics (Issue #9 cleanup)**
  - [x] Implement toggleable voting (removing a vote when clicking the same type again).
  - [x] Implement Optimistic UI for voting and commenting.
  - [x] Replace `alert()` with better error feedback in the UI.
  - [x] Add comprehensive tests for Topics and Pulse Dashboard.

---

## Phase 2: "The Analytics Factory" (Pro Úředníky a Média)

### Epic 2.1: Přístupnost a veřejné čtení

- [x] **Story 2.1.1: Veřejné čtení bez přihlášení (Issue #12)**
  - [x] Upravit middleware (`src/utils/supabase/proxy.ts`), aby `/reports` a `/topics` (GET) byly veřejně přístupné.
  - [x] Ověřit, že RLS politiky v Supabase povolují SELECT bez autentizace (již bylo nastaveno).
  - [x] Na stránce `/topics` skrýt hlasovací tlačítka pro nepřihlášené — zobrazit read-only počty hlasů a odkaz na přihlášení.
  - [x] Napsat testy pro middleware (veřejné vs. chráněné routes) v `src/utils/supabase/proxy.test.ts`.



_(Detailní plánování bude následovat po dokončení Fáze 1)_

## Phase 3: "The Omnipresent Pulse" (Rozšíření)

_(Detailní plánování bude následovat po dokončení Fáze 2)_
