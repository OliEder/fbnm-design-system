# ADR-0003: Live-Daten-Transport (PHP-Polling, kein WASM/WebSocket)

- **Status:** Accepted
- **Datum:** 2026-06-29

## Kontext

Das laufende Spiel ist der einzige Fall, der nicht durch SSG (ADR-0001)
abgedeckt ist — der Spielstand muss sich beim Besucher aktualisieren, ohne
Rebuild. Hosting ist Standard-Shared-Webspace (Hetzner, PHP + MariaDB).

Geprüfte Transport-Optionen auf Shared-Hosting:

| Ansatz       | Webspace-tauglich        | Latenz | Bemerkung |
|--------------|--------------------------|--------|-----------|
| **Polling**  | ✅ Standard              | ~N s   | Browser-JS fragt PHP-Endpoint alle N s |
| Long-Polling | ⚠️ bindet PHP-Worker     | ~1 s   | auf Shared-Hosting heikel |
| SSE          | ⚠️ lange Verbindungen    | ~1 s   | Shared-Hosting-Limits |
| WebSocket    | ❌ meist nicht möglich   | <1 s   | braucht eigenen Prozess/Port |

Zur Frage **WASM:** WASM ist eine Browser-**Rechen**-Technologie, kein
Transport. Es läuft im Browser (nicht auf dem Webspace) und kann von sich aus
nichts abrufen, was JS nicht auch kann — es ruft `fetch` sogar erst über JS auf.
Für „Spielstand alle 30 s holen" gibt es nichts zu beschleunigen; WASM brächte
nur Komplexität und Bundle-Größe ohne Nutzen.

## Entscheidung

1. **Live-Score per Polling.** Leichtes Browser-JS fragt alle ~15–30 s einen
   schlanken **PHP-Endpoint** (`live-score.php`), der aus MariaDB liest.
2. **Kein WASM, kein WebSocket, kein SSE/Long-Polling.** Für einen
   Basketball-Live-Score ist Sekunden-Latenz völlig ausreichend; Polling ist
   robust und shared-hosting-freundlich.
3. **Dünner dynamischer Rand:** Live ist die bewusste Ausnahme vom „kein
   Client-JS"-Prinzip (ADR-0001). Umfang minimal — der bestehende `LiveTicker`
   (~1 KB JS) ist das Vorbild.

## Datenfluss

```
Live-Erfassung ──► MariaDB ◄── live-score.php (liest) ◄── Browser-Polling (JS, ~20 s)
                                                                  │
                                                          LiveTicker (vorhanden)
```

## Konsequenzen

**Positiv**
- Funktioniert auf Standard-Shared-Hosting ohne Sonderkonfiguration.
- Minimaler JS-Footprint; klare Grenze zwischen statisch und live.
- Gleicher Stack (PHP + MariaDB) wie der Daten-Ingest (ADR-0002).

**Negativ / Aufwand**
- Latenz im Sekundenbereich (für den Zweck unkritisch).
- Polling erzeugt periodische Requests (gering, da nur während Live-Spielen
  aktiv schaltbar).

## Bezug

- Rendering/SSG: ADR-0001
- Persistenz/MariaDB: ADR-0002
- Bestehende Grundlage: `packages/design-system/src/components/LiveTicker/`,
  `lib/live-score-adapter.ts`.
