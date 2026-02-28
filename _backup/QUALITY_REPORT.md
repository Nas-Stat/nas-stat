# Squirrel's Quality Report: Náš stát

- **Status:** 🟡 SUSPICIOUS NUT (Dobrá vize, ale zatím žádný kód a pár architektonických pastí)

## Executive Summary

Vize v `SPECIFICATION.md` a byznys plán v `RESEARCH.md` dávají smysl. Zvolený tech-stack pro MVP (Next.js, Supabase, MapTiler, Vercel) je moderní, efektivní a umožňuje rychlou iteraci s minimálními náklady na provoz. Z architektonického hlediska je to "Good Nut". Nicméně, chybí nám jakýkoliv kód k auditu a v samotném plánu je několik technických pastí, které musíme vyřešit dříve, než Oompa Loompas začnou psát první řádky.

## Critical Issues (Showstoppers - k vyřešení před vývojem)

1.  **Ochrana API a Dat (Spam & Trolling):** Plán požaduje "extrémní jednoduchost", ale bez autentizace bude naše Supabase databáze okamžitě zaplavena spamem a boty. Pro MVP musíme zavést alespoň základní omezení (Rate Limiting na IP adresu) a zvážit povinné, ale bleskové přihlášení (např. Google/Apple Auth, nebo anonymní sessions svázané s device ID).
2.  **Ochrana MapTiler klíčů:** API klíč pro MapTiler musí být striktně omezen pouze na naši produkční doménu, jinak riskujeme, že jej někdo zneužije a my budeme platit obří účty.
3.  **Absence repozitáře a CI/CD:** Sice máme iniciovaný Git a dokumenty na GitHubu, ale chybí nám kostra aplikace (Next.js setup), lintery (ESLint), formátovače (Prettier) a nastavené GitHub Actions pro automatické nasazení na Vercel/Cloudflare.

## Code Smells & Improvements (Architektonická doporučení)

- **PWA a Next.js:** Stavět PWA nad Next.js může být ošidné, pokud se příliš spoléháme na Server-Side Rendering (SSR). Pro hladký chod mapy (MapTiler) a budoucí offline funkce budeme muset většinu interaktivních částí (zobrazování a přidávání špendlíků) psát jako klientské komponenty (`"use client"`).
- **Struktura databáze:** Bude klíčové správně navrhnout schéma v Supabase, abychom mohli využívat PostGIS pro efektivní geografické dotazy (např. "najdi všechny stížnosti v okruhu 5 km").
- **Rozpad na úkoly (Pro Oompa Loompas):** `PLAN.md` je příliš high-level. Fáze 1 se musí rozpadnout na technické tickety (např. 1. Init Next.js, 2. Setup Supabase & Auth, 3. Map Component integration).

## Test Coverage Analysis

- **Stav:** 0% (Žádný kód neexistuje)
- **Požadavek pro MVP:** Až začneme psát, budu vyžadovat alespoň základní E2E testy (např. pomocí Playwright), které ověří kritickou cestu: _Uživatel otevře mapu -> Klikne -> Přidá stížnost -> Stížnost se uloží do DB._
