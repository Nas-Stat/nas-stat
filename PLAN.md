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

- [x] **Story 2.1.2: Stránkování a filtrování hlášení (Issue #13)**
  - [x] Implementovat stránkování (offset-based, PAGE_SIZE=20) v `src/app/reports/page.tsx`.
  - [x] Přidat URL parametry `?page=`, `?status=`, `?category=` pro filtrování.
  - [x] Upravit `ReportsClient.tsx` — přidat ovládací prvky pro filtry (status, kategorie) a navigaci stránek.
  - [x] Supabase dotaz omezit pomocí `.range()` a `.eq()` pro aktivní filtry.
  - [x] Zachovat kompatibilitu s mapovým pohledem (heatmapa/piny) — mapa zobrazuje aktuálně filtrované záznamy.
  - [x] Napsat testy pro logiku filtrování a stránkování.


### Epic 2.2: Admin panel

- [x] **Story 2.2.1: Admin panel — správa hlášení (Issue #14)**
  - [x] Navrhnout a přidat admin role — tabulka `admins` (supabase/migrations/20260301000000_add_admin_role.sql)
  - [x] Vytvořit migraci pro admin role
  - [x] Vytvořit `src/app/admin/page.tsx` — Server Component s přehledem hlášení
  - [x] Vytvořit `src/app/admin/AdminClient.tsx` — Client Component pro změnu statusu hlášení
  - [x] Vytvořit `src/app/admin/actions.ts` — Server Action pro update statusu s Zod validací
  - [x] Middleware ochrání `/admin` — pouze přihlášení uživatelé s admin rolí
  - [x] Napsat testy pro admin actions a middleware

- [x] **Story 2.2.2: Moderace obsahu (Issue #15)**
  - [x] Přidat tlačítko "Smazat" u každého tématu v admin panelu
  - [x] Přidat tlačítko "Smazat" u každého komentáře v admin panelu
  - [x] Vytvořit Server Actions `deleteTopic` a `deleteComment` v `src/app/admin/actions.ts`
  - [x] Implementovat potvrzovací dialog před smazáním (`window.confirm`)
  - [x] Zajistit kaskádové mazání (hlasy a komentáře tématu) v akci
  - [x] RLS: smazání povoleno pouze pro admin roli (migrace `20260301000001_admin_delete_policies.sql`)
  - [x] Napsat testy pro delete actions (12 nových testů)

### Epic 2.4: CI/CD Pipeline a Staging

- [x] **Story 2.4.1: CI/CD pipeline a staging nasazení (Issue #17)**
  - [x] Vytvořit `.github/workflows/ci.yml` — lint + test + build při každém PR
  - [x] Vytvořit `.github/workflows/deploy.yml` — deploy na staging při merge do `main`
  - [x] Napsat testy pro validaci struktury workflow souborů
  - [x] Zdokumentovat postup nasazení v README

## Phase 3: "The Omnipresent Pulse" (Rozšíření)

_(Detailní plánování bude následovat po dokončení Fáze 2)_
