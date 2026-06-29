# ADR-0004: Umgang mit lückenhaften Statistikdaten (Breitensport-Realität)

- **Status:** Accepted
- **Datum:** 2026-06-29

## Kontext

Die Qualität der BBB-Daten ist im Breitensport (Jugend, untere Ligen) sehr
ungleich. Klassische Scouting-Werte (Reb/Ast/Stl/Blk/Min, FG%) werden im
Breitensport kaum erfasst.

**Quelle ist einheitlich die BBB-API.** Auch handnotierte Daten landen über den
Spielleiter in der API; der Digitale Spielberichtsbogen (DSB) und die API sind im
Wesentlichen dieselbe Quelle. Der Unterschied liegt nicht in der *Herkunft*,
sondern im **Detailgrad und der Genauigkeit** der gelieferten Daten:

| | DSB (regulärer Ligabetrieb) | Mini-Bereich (bis ~U12, handnotiert → API) |
|--|------------------------------|---------------------------------------------|
| Wer/wann auf dem Feld | ✅ zuverlässig & sauber (seit DSB) | 🟡 nur grob (welches Viertel/Achtel) |
| Punkte | ✅ sauber je Viertel | 🟡 Team-Summe sicher; Trennung je Viertel/Achtel **nicht immer** |
| Team-Fouls / persönl. Fouls | ✅ | 🟡 erfasst, aber oft ungenau |
| Scouting (Reb/Ast/Stl/Blk) | meist nicht | nein |

**Zwei Achsen** der Datenqualität, die das Modell trennen muss:
1. **Vorhanden vs. nicht erfasst** (Lücke) → `null`-Semantik.
2. **Vorhanden, aber unsicher** (z. B. Mini: Punkte je Achtel evtl. unsauber) →
   ein Wert kann da sein und trotzdem nicht voll verlässlich.

Die bisher entworfenen Komponenten (`MatchStats`, `BoxScore`) setzten implizit
einen vollständigen, exakten Box-Score voraus — das ist nicht die Realität.

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

### 6. Verlässlichkeit ist quellen-/kontextabhängig, nicht pauschal
Seit dem DSB sind **Einsatzdaten (wer/wann auf dem Feld)** im regulären
Ligabetrieb zuverlässig — das hebt **Spieler-±** und Einsatzzeiten dort aus dem
„nur wenn erfasst"-Bereich in den verlässlichen. Im **Mini-Bereich** (handnotiert)
bleiben sie grob (nur Viertel/Achtel-Ebene). Verfügbar sind dort zusätzlich
**Team-Fouls und persönliche Fouls** (aber oft ungenau). Eine Metrik ist also
nicht generell „möglich/unmöglich", sondern abhängig davon, was das **konkrete
Spiel** liefert (siehe Punkt 4: nur bei vorhandenen Eingaben berechnen).

### 7. Genauigkeit getrennt von Vorhandensein behandeln
Ein vorhandener Wert ist nicht automatisch exakt (z. B. Mini: Punkte je Achtel
evtl. unsauber getrennt). Wo Genauigkeit nicht gesichert ist, im Zweifel die
**robustere Aggregatebene** zeigen (z. B. Team-Punkte gesamt statt je Achtel)
statt Scheingenauigkeit zu suggerieren.

### 8. Manuelle Nachpflege & Konfliktregel
Handnotierte Mini-Daten kommen i. d. R. ohnehin über die API. Falls darüber
hinaus Werte manuell nachgepflegt werden (sofern vorhanden), gilt: **die
offizielle Quelle (DSB/API) gewinnt, wenn vorhanden** — manuell Nachgepflegtes
ist nur Lückenfüller, bis offizielle Daten vorliegen. Der konkrete
Nachpflege-Pfad (SQL/Admin-Tool vs. Importdatei) ist **noch offen**.

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
