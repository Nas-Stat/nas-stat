# Náš stát (Our State)

Náš stát je komunitní platforma pro hlášení a sledování stavu veřejného prostoru v České republice. Projekt umožňuje občanům interaktivně mapovat podněty k veřejnému prostoru a sledovat "puls" své lokality.

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

## Deployment

### Testovací nasazení (Staging)
*Dokumentace pro testovací nasazení bude doplněna v rámci Fáze 2.*

### Produkční nasazení
*Dokumentace pro produkční nasazení bude doplněna v rámci Fáze 2.*

## Další informace

- **Technologie:** Next.js (App Router), Tailwind CSS, Supabase, MapTiler.
- **Licence:** Všechna práva vyhrazena (zatím).
