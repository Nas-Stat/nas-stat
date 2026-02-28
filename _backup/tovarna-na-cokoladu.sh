#!/bin/bash

# Autonomní Pipeline: Oompa-Loompa (Dělník) & The-Squirrel (Architekt)
# Běží v cyklu, dokud existují otevřené tickety na GitHubu.

echo ">>> Startuji autonomní továrnu na kód..."

while true; do
  # 1. Zjistíme číslo prvního (nejstaršího) otevřeného ticketu
  ISSUE_ID=$(gh issue list --state open --search "sort:created-asc" --limit 1 --json number -q '.[0].number')

  # 2. Kontrola, zda zbývají nějaké úkoly
  if [ -z "$ISSUE_ID" ] || [ "$ISSUE_ID" == "null" ]; then
    echo ">>> Všechny tickety jsou hotové! Oompa-loompa i veverka končí směnu."
    break
  fi

  echo ""
  echo "============================================================"
  echo ">>> ZPRACOVÁVÁM TICKET: #$ISSUE_ID"
  echo "============================================================"

  # 3. FÁZE: Dělník (Oompa-Loompa)
  # Načte projekt přes tvůj 2TB tarif, vyřeší ticket, napíše testy a pushne kód.
  echo ">>> [1/2] Oompa-Loompa začíná pracovat na implementaci..."
  gemini --model gemini-3-flash-preview --yolo -p "Skill: oompa-loompa. Task: Resolve GitHub issue #$ISSUE_ID, write tests, document, and push changes."

  # 4. FÁZE: Architekt (The-Squirrel)
  # Přísně zkontroluje práci. Pokud je vše perfektní, issue zavře (Close).
  # Tím v příští iteraci smyčky 'gh issue list' vybere další ticket.
  # Pokud architekt najde chybu, issue nechá otevřené a dělník na něm v příštím kole začne znovu pracovat podle feedbacku.
  echo ">>> [2/2] Architekt (The-Squirrel) nastupuje na review..."
  gemini --model gemini-3-pro-preview --yolo -p "Skill: the-squirrel. Task: Review work for issue #$ISSUE_ID. If it meets all standards, close the issue. If not, leave a comment with feedback and keep it open."

  echo ">>> Kolo pro ticket #$ISSUE_ID dokončeno. Kontroluji další úkoly..."
  
  # Krátká pauza pro synchronizaci stavu s GitHubem
  sleep 5
done
