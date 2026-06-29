# ADR-0004: Umgang mit lückenhaften Statistikdaten (Breitensport-Realität)

- **Status:** Accepted
- **Datum:** 2026-06-29

## Kontext

Die Qualität der BBB-Daten ist im Breitensport (Jugend, untere Ligen) sehr
ungleich. Klassische Scouting-Werte werden selten erfasst, weil an den
Kampfgerichts-Tischen nicht genug geschulte Personen sitzen. Realistische
Verfügbarkeit:

| Qualität | Werte | Verfügbarkeit |
|----------|-------|---------------|
| ✅ fast immer | Endstand, Paarung, Datum, Liga, Sieg/Niederlage | zuverlässig |
| 🟡 oft       | Punkte je Spieler, evtl. Viertel-/Achtel-Stände | teilweise |
| 🔴 selten    | Reb/Ast/Stl/Blk/Min, FG%, Dreier               | meist leer |

Die bisher entworfenen Komponenten (`MatchStats`, `BoxScore`) setzten implizit
einen vollständigen Box-Score voraus — das ist nicht die Realität. Tabellen mit
lauter leeren Spalten wirken kaputt, und Lücken dürfen abgeleitete Statistiken
(Schnitte) nicht verfälschen.

## Entscheidung

### 1. Partielle Daten sind der Normalfall, nicht die Ausnahme
Jeder erfasste Statistik-Wert ist im Datenmodell **nullable**.

### 2. Strikte Null-Semantik: `null` ≠ `0`
- `null` / fehlend = **nicht erfasst** (unbekannt)
- `0` = **nachweislich null erzielt**

Diese Unterscheidung ist verpflichtend, damit Durchschnitte ehrlich bleiben:
ein nicht erfasster Rebound darf nicht als „0 Rebounds" in den Schnitt eingehen.
Aggregate ignorieren `null` (Schnitt = Summe / Anzahl der **erfassten** Spiele).

### 3. Drei Kategorien von Werten
- **Erfasst (roh):** kommen vom Tisch, oft lückenhaft → `null`-fähig.
- **Basis-Fakten:** Endstand, Paarung, Punkte/Spieler → die verlässliche Grundlage.
- **Abgeleitet (berechnet):** aus Basis-Fakten per Query/Build berechnet, daher
  so verlässlich wie ihre Eingaben. Berechnete Werte sind ausdrücklich erwünscht.

### 4. Abgeleitete Werte nur bei vorhandenen Eingaben
Eine abgeleitete Metrik wird **nur** berechnet, wenn ihre Eingaben vorliegen —
sonst entfällt sie (kein Raten, kein Default 0). Beispiele:
- ✅ robust (nur Endstände nötig): GB (Games Behind, bereits in Verwendung),
  Team-Korbdifferenz/±, Bilanz, Form (letzte 5), Heim/Auswärts.
- ✅ robust (nur Punkte nötig): Punkte/Spiel, Top-Scorer, Punkteverlauf.
- ✅ robust: Teilnahme/Einsätze (wer hat gespielt/gepunktet).
- ⚠️ nur wenn erfasst: Spieler-± (braucht Wer-auf-dem-Feld), FG%, Reb/Ast-Schnitte.

### 5. UI: erfasste Spalten dynamisch ein-/ausblenden
Statistik-Komponenten zeigen pro Spiel/Team **nur die Spalten, die tatsächlich
Daten enthalten**. Eine durchgehend leere Spalte (z. B. Rebounds nicht erfasst)
wird komplett ausgeblendet — statt einer Spalte voller „–". Mindestgerüst
(Nr/Name/Punkte) ist immer vorhanden.

## Konsequenzen

**Positiv**
- Ehrliche Statistiken trotz Datenlücken; keine verfälschten Schnitte.
- UI bleibt sauber, egal wie vollständig die Daten sind.
- Verlässliche Mehrwerte (GB, ±, Form, Punkte-Metriken) auch ohne Scouting.
- Mehr Rohdaten → automatisch mehr Spalten/Metriken, ohne Code-Änderung.

**Negativ / Aufwand**
- Komponenten brauchen Logik zur Spalten-Erkennung (welche Spalte hat Daten?).
- Aggregations-Queries müssen `null` konsequent ausschließen.
- Schema: pro Wert `null`-fähig + Herkunft klar (erfasst vs. abgeleitet).

## Auswirkung auf bestehende Komponenten

`MatchStats` und `BoxScore` müssen angepasst werden: feste Spaltensätze →
datengetriebenes Ein-/Ausblenden; Werte `null`-fähig; „bester Rang"/Top-Scorer
nur aus erfassten Werten. (Umsetzung später; hier nur die Entscheidung.)

## Bezug

- Persistenz/Aggregate: ADR-0002 (Fakten speichern, Aggregate ableiten)
- Rendering: ADR-0001
- Offen: konkrete BBB-API-Granularität (welche Felder kommen je Liga/Altersklasse?).
