# ADR-0002: Persistenz von Spieldaten (MariaDB als System of Record)

- **Status:** Accepted
- **Datum:** 2026-06-29

## Kontext

Die BBB-API ist eine **Live-Sicht auf den aktuellen Zustand**, kein Archiv:

- Tabellen zeigen nur den Jetzt-Stand — „Stand nach Spieltag 7" ist später nicht
  mehr abrufbar.
- iCal-Feeds rollieren; alte Spiele fallen heraus.
- Saisondaten verschwinden beim Saisonwechsel.

Für **Statistiken über Zeit** (Spieler-Karrierewerte, Team-Saisonverlauf,
Spiel-Archiv, Head-to-Head) ist eine eigene persistente Kopie nötig — SSG aus
der API (ADR-0001) holt „was jetzt gilt", bewahrt aber nicht „was damals galt".

Geprüfte Alternativen:

- **JSON/NDJSON-Snapshots im Git** — diffbar, serverlos. Aber: Diffbarkeit bringt
  bei automatisch gezogenen, append-only Daten kaum Nutzen (kein manuelles
  Review), und Snapshots erzeugen massive Redundanz (Stammdaten je Snapshot
  wiederholt).
- **MariaDB** — auf dem Hetzner-Webspace ohnehin vorhanden, kostenneutral.
  Normalisiert Redundanz weg, erlaubt beliebige spätere Auswertungen.

## Entscheidung

1. **MariaDB ist das System of Record** für historische Spieldaten — die
   ohnehin im Webspace enthaltene Datenbank, ohne Zusatzkosten/Extra-Hosting.
2. **Strikte Rollentrennung:** Die DB dient der **Persistenz**, **nicht** der
   Laufzeit-Auslieferung der Website. Der Astro-Build **liest** zur Build-Zeit
   aus der DB und erzeugt statisches HTML. Die ausgelieferte Seite spricht nie
   mit der DB → das „kein Server für die Auslieferung"-Prinzip (ADR-0001) bleibt
   intakt.
3. **Fakten speichern, Aggregate ableiten:** Persistiert werden die
   **unveränderlichen Fakten** (Spielergebnisse, Box-Scores). Aggregate
   (Tabellen, Schnitte, Form-Kurven, Stände nach Spieltag N) werden per Query
   **abgeleitet**, nicht als Snapshot gespeichert → keine Redundanz, Statistiken
   später frei definierbar.
4. **Ingest via PHP-Cron:** Ein PHP-Job (Hetzner) zieht periodisch die BBB-API
   und schreibt neue/finalisierte Spiele append-only in die DB. PHP ist für
   Live-Daten (ADR-0003) ohnehin im Stack.

## Datenfluss

```
BBB-API ──(PHP-Cron, Ingest)──► MariaDB (System of Record)
                                     │
                                     │ Build-Zeit-Query (nur lesen)
                                     ▼
                           Astro SSG ──► statisches HTML
```

## Konsequenzen

**Positiv**
- Vollständige, normalisierte Historie unabhängig von API-Rollierung.
- Keine Redundanz; Statistiken nachträglich neu definierbar (Aggregate aus
  Fakten).
- Kostenneutral (DB im Webspace inklusive); Auslieferung bleibt statisch.

**Negativ / Aufwand**
- Schema-Design + Ingest-Logik müssen gepflegt werden.
- Mapping BBB-API → eigenes Schema nötig; API-Änderungen treffen den Ingest
  (aber nicht die ausgelieferte Seite).

## Bezug

- Rendering/SSG: ADR-0001
- Live-Daten/PHP: ADR-0003
- **Datenqualität/Null-Semantik:** ADR-0004 — Statistik-Werte sind `null`-fähig
  (`null` = nicht erfasst ≠ `0`); Aggregate schließen `null` aus. Prägt das Schema.
- Offen (später): konkretes Schema, BBB-API-Granularität (Box-Score je Spieler?),
  Umfang (Mannschaften/Saisons).
