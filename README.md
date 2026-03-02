# Náš stát (Our State)

Náš stát je komunitní platforma pro hlášení a sledování stavu veřejného prostoru v České republice. Projekt umožňuje občanům interaktivně mapovat podněty k veřejnému prostoru a sledovat "puls" své lokality.

## Klíčové vlastnosti (MVP Phase 1)

- **Geografické hlášení:** Uživatelé mohou umístit špendlík do mapy a nahlásit problém nebo pochvalu k určitému místu (např. rozbitá lavička, nový park).
- **Tématický feed:** Prostor pro diskusi o celospolečenských tématech (např. zákony, reformy) bez vazby na konkrétní místo.
- **Pulse Dashboard:** Přehledná analytika v reálném čase zobrazující "teplotu" veřejného mínění, nejnovější hlášení a populární témata.
- **Interaktivní mapy:** Integrace MapTileru pro vizualizaci podnětů přímo v terénu.
- **Hlasování a komentáře:** Možnost vyjádřit podporu nebo nesouhlas (optimistic UI) a diskutovat s ostatními uživateli.
- **Bezpečná autentizace:** Přihlášení přes e-mail nebo Google (Supabase Auth).

## Running with Docker

Projekt je připraven pro snadný lokální běh v Dockeru, což zajišťuje stejné prostředí pro všechny vývojáře.

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/)

### Development

Spuštění vývojového serveru s podporou hot-reloadingu:

```bash
docker-compose up --build
```

Aplikace bude následně dostupná na [http://localhost:3000](http://localhost:3000).

## Supabase Setup

Tento projekt využívá Supabase pro databázi a autentizaci. Pro nastavení lokálního prostředí:

1. Zkopírujte soubor `.env.example` do `.env`:
   ```bash
   cp .env.example .env
   ```
2. Doplňte hodnoty pro `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` a `SUPABASE_SERVICE_ROLE_KEY`. Pro lokální běh přes Supabase CLI můžete použít výchozí hodnoty z `.env.example`.
3. Pokud máte nainstalované Supabase CLI, můžete spustit lokální stack:
   ```bash
   supabase start
   ```
4. Schéma databáze je definováno v `supabase/migrations/`.

## CI/CD Pipeline

Projekt používá GitHub Actions pro automatizované kontroly kvality a nasazení.

### Continuous Integration (`.github/workflows/ci.yml`)

Spouští se při každém Pull Requestu na větev `main`:

1. **Lint** — `npm run lint` (ESLint)
2. **Test** — `npm run test` (Vitest)
3. **Build** — `npm run build` (ověření produkčního buildu)

PR nelze sloučit, dokud všechny kroky neprojdou.

### Continuous Deployment (`.github/workflows/deploy.yml`)

Spouští se automaticky při merge (push) do větve `main` a nasadí aplikaci na staging přes Vercel CLI.

#### Nastavení GitHub Actions secrets

V repozitáři přejděte na **Settings → Secrets and variables → Actions** a přidejte:

| Secret | Popis |
|--------|-------|
| `VERCEL_TOKEN` | API token z [vercel.com/account/tokens](https://vercel.com/account/tokens) |
| `VERCEL_ORG_ID` | Nalezne se v `.vercel/project.json` po spuštění `vercel link` |
| `VERCEL_PROJECT_ID` | Nalezne se v `.vercel/project.json` po spuštění `vercel link` |
| `STAGING_SUPABASE_URL` | URL staging Supabase projektu |
| `STAGING_SUPABASE_ANON_KEY` | Anon klíč staging Supabase projektu |
| `STAGING_SUPABASE_SERVICE_ROLE_KEY` | Service role klíč staging Supabase projektu |
| `STAGING_MAPTILER_KEY` | MapTiler API klíč pro staging |
| `STAGING_RESEND_API_KEY` | Resend API klíč pro odesílání e-mailů |
| `STAGING_APP_URL` | Veřejná URL staging prostředí (např. `https://nas-stat-staging.vercel.app`) |

#### První nastavení Vercel projektu

```bash
npm i -g vercel
vercel login
vercel link          # propojí lokální repo s Vercel projektem, vytvoří .vercel/project.json
```

Hodnoty `VERCEL_ORG_ID` a `VERCEL_PROJECT_ID` zkopírujte z `.vercel/project.json` do GitHub secrets.

## Deployment

### Testovací nasazení (Staging)

Automaticky spouštěno při každém merge do `main` přes GitHub Actions workflow `.github/workflows/deploy.yml`.
Viz sekce CI/CD Pipeline výše pro nastavení secrets.

### Produkční nasazení

Pro oddělené produkční prostředí vytvořte separátní Vercel projekt a příslušné GitHub secrets s prefixem `PROD_` místo `STAGING_`. Workflow `.github/workflows/deploy.yml` lze rozšířit o druhý job `deploy-production` spouštěný na tagu nebo manuálně.

## Další informace

- **Technologie:** Next.js (App Router), Tailwind CSS, Supabase, MapTiler.
- **Licence:** Všechna práva vyhrazena (zatím).
