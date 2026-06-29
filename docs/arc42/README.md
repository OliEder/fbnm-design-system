# Architekturdokumentation — FBNM Design System & Website

Dokumentiert nach [**arc42**](https://arc42.org). Diese Datei ist das
Gesamtbild der Architektur; einzelne Entscheidungen mit Begründung liegen als
**ADRs** unter [`../adr/`](../adr/) und werden in Kapitel 9 referenziert.

> Stand: 2026-06-29. Lebendes Dokument — bei Architekturänderungen aktualisieren
> bzw. einen neuen ADR anlegen.

---

## 1. Einführung und Ziele

Website der **Fibalon Baskets Neumarkt (FBNM)** auf Basis eines eigenen
Design-Systems. Zeigt Spielpläne, Ergebnisse, Statistiken, Tabellen, Team- und
Spielberichtsseiten.

**Qualitätsziele (priorisiert)**

| # | Ziel | Motivation |
|---|------|-----------|
| 1 | **Performance & Robustheit** | ~90 % statische Seiten, kaum Client-JS; Ausfall externer Dienste darf bestehende Seiten nicht beeinträchtigen. |
| 2 | **Barrierefreiheit (WCAG 2.2 AA/AAA)** | Vereinsseite für alle; durchgängig getestet (axe + Playwright). |
| 3 | **Geringe Betriebskosten/-komplexität** | Standard-Webspace (Hetzner), kein dedizierter App-Server für die Auslieferung. |
| 4 | **Datenhistorie** | Spieldaten dauerhaft für Statistiken bewahren, unabhängig von der BBB-API. |

## 2. Randbedingungen

- **Hosting:** Hetzner Standard-Webspace mit PHP + MariaDB. Kein Node-Runtime
  für die Auslieferung; keine WebSockets.
- **Primäre Datenquelle:** Basketball-Bund-API (BBB) — Live-Sicht, kein Archiv.
- **Tech-Stack:** Astro (SSG), TypeScript, Astro-Komponenten; PHP für den
  dynamischen Rand (Ingest + Live).
- **Sprache:** Deutsch (Inhalte, UI, Doku).

## 3. Kontextabgrenzung

```
            ┌────────────────────┐
   BBB-API ─┤  FBNM-System       ├─ Besucher (Browser)
 (extern)   │                    │
            │  Build / Ingest /  │
            │  Live-Endpoint     │
            └────────────────────┘
```

- **BBB-API → System:** liefert Spielpläne/Ergebnisse (Build-Zeit-Ingest + Live).
- **System → Besucher:** statisches HTML (SSG) + schlanker Live-Endpoint.
- **System-intern:** MariaDB als Historie (nicht nach außen exponiert).

## 4. Lösungsstrategie

| Ziel | Strategie | Verweis |
|------|-----------|---------|
| Performance/Robustheit | Astro **SSG**; Daten zur Build-Zeit; Komponenten erhalten Daten als Props | ADR-0001 |
| Geringe Komplexität | Statische Auslieferung; DB nur intern; dünner PHP-Rand | ADR-0001/0002 |
| Datenhistorie | **MariaDB als System of Record**; Fakten speichern, Aggregate ableiten | ADR-0002 |
| Live ohne Server | **PHP-Polling** aus MariaDB; kein WASM/WebSocket | ADR-0003 |
| Datenlücken (Breitensport) | Werte `null`-fähig; erfasste Spalten dynamisch zeigen; robuste abgeleitete Metriken | ADR-0004 |
| Barrierefreiheit | CSS-only-Interaktion, WCAG-Tests in CI | Kap. 8 |

## 5. Bausteinsicht

**Monorepo (pnpm):**

- `packages/design-system/` — wiederverwendbares Design-System
  - `src/components/` — Astro-Komponenten (Button, Card, GameCard, GameSchedule,
    Hero, LeagueStandings, MatchStats, Navigation [+Mega-Menü], Subnav,
    Spielbericht + Teile, StatsTable, LiveTicker, PlayerCard, Footer …)
  - `src/styles/` — Tokens & globale Styles (`tokens.css`, WCAG-dokumentiert)
  - `src/tokens/` — Token-Werte als TS
  - `src/lib/` — `bbb-ical.ts` (BBB-Feed → `Game[]`, Build-Zeit),
    `live-score-adapter.ts` (Live-Pfad)
- `apps/docs/` — Astro-Doku-/Demo-App (Komponenten-Katalog, Beispielseiten)
- `apps/web/` — (Platzhalter für die produktive Website)
- `tests/e2e/` — Playwright + axe-core (Barrierefreiheit/Verhalten)

**Geplant (siehe ADR-0002/0003):** PHP-Ingest-Job, `live-score.php`,
MariaDB-Schema.

## 6. Laufzeitsicht

**Build (Standardfall):** Astro-Frontmatter liest Spieldaten (Build-Zeit, aus
MariaDB bzw. BBB) → rendert statisches HTML → Deploy auf Webspace.

**Daten-Ingest (periodisch):** PHP-Cron zieht BBB-API → schreibt
neue/finalisierte Spiele append-only in MariaDB.

**Live-Spiel:** Browser-JS pollt `live-score.php` (~20 s) → liest aktuellen
Stand aus MariaDB → aktualisiert `LiveTicker`.

## 7. Verteilungssicht

- **Build/CI:** erzeugt statische Artefakte (Astro SSG). Rebuild nach Spieltag /
  nightly.
- **Hetzner-Webspace:** statische Dateien (Auslieferung) + PHP (Ingest-Cron,
  Live-Endpoint) + MariaDB (Persistenz, intern).
- **Besucher:** lädt statisches HTML; nur bei Live-Spielen leichtes Polling.

## 8. Querschnittliche Konzepte

- **Barrierefreiheit:** WCAG 2.2, Ziel AAA wo möglich. Farb-Kontraste in
  `tokens.css` dokumentiert; Interaktion (Tabs, Mega-Menü) **CSS-only** mit
  nativer Tastatur; getestet via axe + Playwright (auch mit deaktiviertem JS).
- **Progressive Enhancement:** Grundfunktion ohne JS; JS nur als Verbesserung.
- **Design-Tokens:** zentrale CSS-Variablen (`--fbnm-*`) als einzige
  Farb-/Spacing-/Typo-Quelle.
- **Datenfluss-Prinzip:** Fakten persistieren, Aggregate ableiten; Daten als
  Props, kein Browser-`fetch` (außer Live).
- **Datenqualität (Breitensport):** Scouting-Werte sind oft lückenhaft. Statistik-
  Werte sind `null`-fähig; `null` (nicht erfasst) ≠ `0` (null erzielt). Komponenten
  blenden nicht erfasste Spalten dynamisch aus. Abgeleitete Metriken (GB, ±, Form,
  Punkte-Schnitte) werden nur bei vorhandenen Eingaben berechnet. Siehe ADR-0004.

## 9. Architekturentscheidungen (ADRs)

| ADR | Titel | Status |
|-----|-------|--------|
| [0001](../adr/0001-rendering-und-datenarchitektur.md) | Rendering- & Datenarchitektur (SSG aus der BBB-API) | Accepted |
| [0002](../adr/0002-persistenz-spieldaten.md) | Persistenz von Spieldaten (MariaDB als System of Record) | Accepted |
| [0003](../adr/0003-live-daten-transport.md) | Live-Daten-Transport (PHP-Polling, kein WASM/WebSocket) | Accepted |
| [0004](../adr/0004-umgang-mit-lueckenhaften-statistikdaten.md) | Umgang mit lückenhaften Statistikdaten (Breitensport) | Accepted |

## 10. Qualitätsanforderungen

- **Barrierefreiheit:** 0 axe-Verstöße (wcag2a/aa, wcag21, wcag22aa) auf allen
  Seiten; Kernfunktionen ohne JS bedienbar.
- **Performance:** keine externen JS-Bundles; inline-JS pro Seite < ~2 KB.
- **Robustheit:** Ausfall BBB-API/MariaDB beeinträchtigt ausgelieferte
  statische Seiten nicht.
- **Datenintegrität:** finalisierte Spiele append-only, unveränderlich.

## 11. Risiken und technische Schulden

- **BBB-API-Granularität unklar:** Liefert sie Box-Scores je Spieler? Bestimmt,
  welche Statistiken überhaupt möglich sind. *(offen)*
- **Lückenhafte Scouting-Daten (Breitensport):** Reb/Ast/Stl/Blk/Min meist nicht
  erfasst; verlässlich nur Endstände + oft Punkte/Spieler. Modell/UI darauf
  ausgelegt (ADR-0004). `MatchStats`/`BoxScore` müssen noch auf dynamische
  Spalten + `null`-Semantik umgestellt werden.
- **BBB-API-Änderungen:** treffen den Ingest (nicht die ausgelieferte Seite) →
  Mapping-Schicht kapseln.
- **Schema noch offen:** MariaDB-Datenmodell (ADR-0002) ist noch zu entwerfen.
- **Demo-Seiten nutzen hartkodierte Beispieldaten** — noch nicht an echte
  Build-Zeit-Datenquelle angebunden.
- **Rebuild-Automatisierung** (Trigger nach Spieltag) noch nicht umgesetzt.

## 12. Glossar

| Begriff | Bedeutung |
|---------|-----------|
| **BBB** | Basketball-Bund; liefert die Spieldaten-API/Feeds |
| **SSG** | Static Site Generation — HTML zur Build-Zeit erzeugt |
| **System of Record** | maßgebliche, dauerhafte Datenquelle (hier: MariaDB) |
| **Fakt vs. Aggregat** | unveränderliches Ergebnis vs. daraus berechneter Wert (Tabelle, Schnitt) |
| **Progressive Enhancement** | Grundfunktion ohne JS, JS verbessert nur |
| **ADR** | Architecture Decision Record — einzelne Entscheidung mit Begründung |
| **arc42** | Vorlage für Architekturdokumentation (dieses Dokument) |
