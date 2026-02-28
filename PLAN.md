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
- [ ] **Story 1.2.2: Autentizace uživatelů**
  - [ ] Integrovat `@supabase/ssr` pro Next.js.
  - [ ] Implementovat přihlášení pomocí Emailu/Hesla.
  - [ ] Implementovat přihlášení pomocí Google OAuth.
  - [ ] Vytvořit jednoduché UI pro login/registraci.

### Epic 1.3: Geografické hlášení (MapTiler)

- [ ] **Story 1.3.1: Integrace mapy**
  - [ ] Integrovat MapTiler pomocí maplibregl nebo react-map-gl.
  - [ ] Zobrazit mapu s možností navigace (pan, zoom).
- [ ] **Story 1.3.2: Vkládání "špendlíků" (Reports)**
  - [ ] Umožnit uživateli kliknout do mapy a umístit špendlík.
  - [ ] Vytvořit formulář (drawer/modal) pro přidání hodnocení (1-5 hvězd, text, kategorie) k dané lokaci.
  - [ ] Uložit data do Supabase (vyžaduje přihlášení z Epicu 1.2).
- [ ] **Story 1.3.3: Zobrazení existujících hlášení**
  - [ ] Načíst hlášení ze Supabase a zobrazit je jako body na mapě (např. barevně odlišené podle hodnocení).

### Epic 1.4: Tématické hlášení a Dashboard

- [ ] **Story 1.4.1: Feed témat**
  - [ ] Vytvořit UI pro zobrazení seznamu aktuálních témat bez geografické vazby.
  - [ ] Umožnit přihlášeným uživatelům hlasovat (palec nahoru/dolů) a přidat komentář.
- [ ] **Story 1.4.2: Základní Pulse Dashboard**
  - [ ] Jednoduchá analytická stránka zobrazující agregovaná data (např. nejnovější hlášení, nejvíce diskutovaná témata).

---

## Phase 2: "The Analytics Factory" (Pro Úředníky a Média)

_(Detailní plánování bude následovat po dokončení Fáze 1)_

## Phase 3: "The Omnipresent Pulse" (Rozšíření)

_(Detailní plánování bude následovat po dokončení Fáze 2)_
