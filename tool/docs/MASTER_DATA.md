# Stammdaten

Stand 16.09.2026: lokale Verwaltung im Menü „Stammdaten“ und direkt am Eintragseditor. Kategorien, Kunden, Projekte und Leistungen anlegen, umbenennen, archivieren und reaktivieren. Speicherung im bestehenden Browser-Datensatz und im Gesamtbackup. Optionaler gezielter Clockodo-Import über den lokalen Dienst ist seit 17.09.2026 ergänzt; siehe unten.

## Bedienung

- Kategorien haben einen Namen und den Auswertungsbereich Arbeit, Sport, Privat, Pausen / Puffer oder Sonstiges. Änderungen des Bereichs gelten auch für vorhandene Einträge; Planzeiten und manuell erfasste Minuten werden dabei nicht verändert.
- Kategorien werden beim Umbenennen über ihre stabile ID weiterverwendet. Eigene Namen bleiben beim Sprachwechsel unverändert; unveränderte Standardnamen werden übersetzt.
- Archivieren ersetzt Löschen: vorhandene Einträge und Presets behalten die Zuordnung. Neue Einträge bieten nur aktive Kategorien an; die letzte aktive Kategorie kann nicht archiviert werden.
- Kunden, Projekte und Leistungen werden unter Kundendetails für alle Arbeitskategorien vorgeschlagen. Projekte gehören zu einem Kunden; die Kundenzuordnung bleibt nach Anlage fest.
- Freie Texteingabe bleibt möglich. Eine exakte Auswahl eines Stammdatennamens erhält beim Speichern eine ID-Verknüpfung. Kundenänderungen entfernen die zuvor verknüpfte Projektauswahl.
- Verknüpfte Einträge zeigen den aktuellen Stammdatennamen, behalten aber ihre gespeicherten Textfelder. Bestehende freie Texte werden beim ersten Laden in Vorschläge übernommen, jedoch erst beim Speichern eines Eintrags verknüpft.

## Daten und Migration

`data.masterData` hat eine eigene `version: 1` und vier Listen:

| Liste | Felder |
| --- | --- |
| categories | id, name, active, group |
| customers | id, name, active, externalIds? |
| projects | id, name, active, customerId, externalIds? |
| services | id, name, active, externalIds? |

Standard-Kategorie-IDs entsprechen den bisherigen `item.cat`-Werten, damit bestehende Einträge, Wochenpresets und Ausgangspläne ihre Identität behalten. Neue Kategorien erhalten UUIDs. Namen sind innerhalb einer Liste eindeutig, bei Projekten innerhalb des Kunden. Eintragsfelder `customerId`, `projectId`, `serviceId` sind optional; `customer`, `project`, `service` bleiben als Textbestand erhalten.

Fehlt der Katalog, wird er aus Standardkategorien und den Texten gespeicherter Wochen, Presets und Ausgangspläne aufgebaut. Die Migration ist idempotent und ändert keine Planzeiten, Eintrags-IDs, Ist-Minuten oder Snapshots. Bestehende Fremdkategorien werden bei dieser Migration als Sonstiges übernommen.

Backups validieren Listen, IDs, Kunden-/Projektbeziehungen, externe IDs und Auswertungsbereiche. Doppelte externe IDs und ungültige Referenzen werden abgewiesen. Fehlgeschlagenes Speichern setzt die Stammdaten im Arbeitsspeicher zurück. Die Modellfunktionen liegen in `master-data-model.js`, die Dialog- und Editoranbindung in `master-data.js`.

## Clockodo-Anbindung

`externalIds.clockodo` ist für die externe ID als positive Dezimalzeichenfolge vorgesehen. Interne IDs bleiben unabhängig davon bestehen. Kategorien sind lokale Planungsbereiche; sie werden nicht mit Clockodo-Leistungen gleichgesetzt.

Die lokale Transportschicht lädt Kunden, Projekte und Leistungen. Unter Aus Clockodo importieren werden nur ausgewählte Datensätze über externe IDs abgeglichen und gespeichert; Suchfelder berücksichtigen alle geladenen Seiten. Im Wocheneditor stehen diese Daten danach offline als Vorschläge zur Verfügung. API-Zugangsdaten verbleiben ausschließlich beim Dienst. Ein Abgleich muss Pagination, archivierte Datensätze, Konflikte mit lokalen Änderungen und atomare Speicherung behandeln. Namen allein sind kein sicherer Synchronisierungsschlüssel. Zeiteinträge werden erst nach ausdrücklicher Freigabe übertragen.

Quellen/Weiterführung: [offizielle Clockodo-Dokumentation](https://docs.clockodo.com/), [Kundenmodell](https://www.clockodo.com/en/api/customers/), [Leistungsmodell](https://www.clockodo.com/en/api/services/), [Projektplan](CLOCKODO.md).

## Verifikation

- `node --test tests/planner.test.cjs tests/master-data-model.test.cjs`: Migration, unveränderte Ausgangspläne, Backup-Roundtrip, Referenzen, Duplikate und dynamische Zuordnung in Monats-/Ist-Auswertung.
- `node tests/master-data.test.cjs`: Editorzugang, Kategorien/Kunden/Projekte/Leistungen, Archivierung, Kundenfilter, ID-Verknüpfung, Umbenennen, tatsächliches Honorar, Speicherfehler, DE/EN und mobile Darstellung.
- Browser-, Sprach-, Ist-Zeit- und Monatsgruppentests sichern die bisherigen Abläufe ab.
