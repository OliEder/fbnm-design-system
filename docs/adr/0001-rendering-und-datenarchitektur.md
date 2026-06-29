# ADR-0001: Rendering- & Datenarchitektur (SSG aus der BBB-API)

- **Status:** Accepted
- **Datum:** 2026-06-29

## Kontext

Die Website der Fibalon Baskets Neumarkt zeigt überwiegend Spieldaten
(Spielpläne, Ergebnisse, Box-Scores, Tabellen). Diese Daten stammen zu ~90 %
aus der Basketball-Bund-API (BBB). Charakteristisch:

- **Abgeschlossene Spiele sind unveränderlich** — ein Endstand oder Box-Score
  ändert sich nach Spielende nicht mehr.
- Geplante/künftige Daten (Termine, aktuelle Tabelle) ändern sich selten.
- Nur das **laufende** Spiel ist echt „live".

Hosting ist Standard-Webspace (Hetzner) mit PHP + MariaDB — kein Node-Server
für die Auslieferung.

## Entscheidung

1. **Static Site Generation (Astro SSG) als Standard.** ~90 % der Seiten sind
   statisches HTML, gebaut zur Build-Zeit. Kein Server zur Laufzeit für die
   Auslieferung.
2. **Spieldaten werden zur Build-Zeit gezogen**, nicht im Browser. Der
   Astro-Build liest die Daten (siehe ADR-0002) und rendert sie in statisches
   HTML.
3. **Komponenten nehmen Daten ausschließlich als typisierte Props** entgegen —
   kein `fetch` im Browser. Datenbeschaffung passiert im Astro-Frontmatter.
4. **Möglichst kein Client-JS.** Interaktive UI (Tabs, Mega-Menü) ist CSS-only
   gelöst; JS nur als optionales Progressive Enhancement. Ausnahme: Live-Daten
   (ADR-0003).
5. **Rebuild-Strategie:** Build nach Spieltag bzw. periodisch (nightly), um neue
   Ergebnisse/Termine zu übernehmen.

## Konsequenzen

**Positiv**
- Schnell, günstig, robust; keine Laufzeit-Abhängigkeit von API/DB bei der
  Auslieferung. Ausfall der BBB-API beeinträchtigt bestehende Seiten nicht.
- Minimaler Angriffs-/Wartungsaufwand (statische Dateien).
- Barrierefreiheit/Performance durch HTML-first.

**Negativ / Aufwand**
- Daten sind nur so frisch wie der letzte Build → Rebuild-Trigger nötig.
- Echte Live-Aktualität erfordert einen separaten, dünnen dynamischen Pfad
  (ADR-0003).

## Bezug

- Datenpersistenz/-quelle: ADR-0002
- Live-Daten: ADR-0003
- Bestehende Grundlage: `packages/design-system/src/lib/bbb-ical.ts`
  (BBB-iCal → typisierte `Game[]`, Build-Zeit), `lib/live-score-adapter.ts`.
