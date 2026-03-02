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

Produkční deployment je řízen workflowem `.github/workflows/deploy-production.yml`. Spouští se automaticky při vytvoření git tagu `v*` (např. `git tag v1.0.0 && git push --tags`) nebo manuálně přes GitHub Actions UI.

#### Postup prvního produkčního nasazení

1. **Supabase produkční projekt** — Vytvořte nový Supabase projekt na [supabase.com](https://supabase.com) oddělený od staging prostředí. Spusťte migrace:
   ```bash
   supabase link --project-ref <prod-project-ref>
   supabase db push
   ```
2. **Doména a DNS** — V DNS registrátoru přidejte záznam CNAME `nasstat.cz → cname.vercel-dns.com` (nebo A záznam dle Vercel instrukcí). HTTPS certifikát Vercel zajistí automaticky přes Let's Encrypt.
3. **Vercel projekt** — Propojte repozitář s Vercel projektem pro produkci:
   ```bash
   npm i -g vercel
   vercel login
   vercel link
   ```
4. **MapTiler produkční klíč** — Vytvořte samostatný API klíč omezený na produkční doménu na [maptiler.com](https://maptiler.com).
5. **Monitoring** — Vercel Analytics je integrována automaticky (viditelná na [vercel.com/analytics](https://vercel.com/analytics) po propojení projektu).

#### GitHub Actions secrets pro produkci

V repozitáři přejděte na **Settings → Secrets and variables → Actions** a přidejte:

| Secret | Popis |
|--------|-------|
| `PROD_SUPABASE_URL` | URL produkčního Supabase projektu |
| `PROD_SUPABASE_ANON_KEY` | Anon klíč produkčního Supabase projektu |
| `PROD_SUPABASE_SERVICE_ROLE_KEY` | Service role klíč produkčního Supabase projektu |
| `PROD_MAPTILER_KEY` | MapTiler API klíč omezený na produkční doménu |
| `PROD_RESEND_API_KEY` | Resend API klíč pro odesílání e-mailů |
| `PROD_APP_URL` | Veřejná URL produkce (např. `https://nasstat.cz`) |

Secrets `VERCEL_TOKEN`, `VERCEL_ORG_ID` a `VERCEL_PROJECT_ID` jsou sdílené se staging workflowem.

#### Nasazení nové verze

```bash
git tag v1.2.0
git push --tags   # automaticky spustí deploy-production.yml
```

## Další informace

- **Technologie:** Next.js (App Router), Tailwind CSS, Supabase, MapTiler.
- **Licence:** Všechna práva vyhrazena (zatím).
