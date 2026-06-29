# Architecture Decision Records (ADR)

Dieser Ordner dokumentiert wesentliche Architekturentscheidungen des
FBNM-Design-Systems — *warum* etwas so gebaut ist, nicht nur *wie*.

Format: [Michael Nygard's ADR](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions).
Jede Entscheidung ist eine eigene, fortlaufend nummerierte Datei und wird nicht
mehr verändert, sobald sie „Accepted" ist — spätere Änderungen entstehen als
**neuer** ADR, der den alten per Status `Superseded by ADR-NNNN` ablöst.

## Status-Werte

- **Proposed** — zur Diskussion
- **Accepted** — gilt
- **Superseded by ADR-NNNN** — durch eine neuere Entscheidung ersetzt
- **Deprecated** — nicht mehr relevant

## Index

| ADR | Titel | Status |
|-----|-------|--------|
| [0001](0001-rendering-und-datenarchitektur.md) | Rendering- & Datenarchitektur (SSG aus der BBB-API) | Accepted |
| [0002](0002-persistenz-spieldaten.md) | Persistenz von Spieldaten (MariaDB als System of Record) | Accepted |
| [0003](0003-live-daten-transport.md) | Live-Daten-Transport (PHP-Polling, kein WASM/WebSocket) | Accepted |
| [0004](0004-umgang-mit-lueckenhaften-statistikdaten.md) | Umgang mit lückenhaften Statistikdaten (Breitensport) | Accepted |
