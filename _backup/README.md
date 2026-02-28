# Náš stát (Our State) - Vývojová dokumentace

Vítejte v technické dokumentaci projektu "Náš stát". Tento dokument slouží vývojářům pro rychlé zorientování, spuštění projektu a nasazení.

## Požadavky

- [Docker](https://www.docker.com/) a Docker Compose
- (Alternativně) Node.js 20+ a npm/pnpm pro běh bez Dockeru

## 🚀 Lokální spuštění (Vývoj)

Pro maximální izolaci a konzistenci používáme pro lokální vývoj Docker.

1.  **Klonování repozitáře:**

    ```bash
    git clone git@github.com:Nas-Stat/nas-stat.git
    cd nas-stat
    ```

2.  **Nastavení prostředí:**
    - Zkopírujte vzorový soubor s proměnnými prostředí (bude vytvořen v Epic 1.1).
    - `cp .env.example .env.local`
    - Vyplňte potřebné klíče (Supabase URL, Supabase Anon Key, MapTiler Key).

3.  **Spuštění přes Docker Compose:**

    ```bash
    docker-compose up -d --build
    ```

    _Aplikace poběží na `http://localhost:3000` a změny v kódu se projeví automaticky (hot-reload)._

4.  **Zastavení kontejnerů:**
    ```bash
    docker-compose down
    ```

## ☁️ Nasazení (Deployment)

_(Tato sekce bude postupně doplňována)_

### Testovací prostředí (Staging)

- **Platforma:** [Bude určeno - např. Vercel / Cloudflare Pages]
- **Větev:** `develop` (nebo automatické náhledy pro každý Pull Request)
- **Postup:** ...

### Produkční prostředí (Production)

- **Platforma:** [Bude určeno]
- **Větev:** `main`
- **Postup:** ...

---

## Architektura a Technologie

- **Frontend/Backend:** Next.js (App Router)
- **Databáze & Auth:** Supabase (PostgreSQL)
- **Mapy:** MapTiler
- **Styling:** Tailwind CSS
