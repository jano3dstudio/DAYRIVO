# Monatsabschluss und Rechnungsvorbereitung

Stand 17.09.2026: lokaler Pilot implementiert, mit künstlichen Daten geprüft. Echter Abgleich mit Jonas Clockodo-Monatsübersicht sowie Billomat-Anbindung stehen aus. Keine fertigen Rechnungen und keine Live-Abrechnungen erzeugt.

## Start

Im bisherigen lokalen DAYRIVO-Planer neu laden, die Clockodo-Sitzung trennen und den aktualisierten Dienst erneut starten. Links unter Auswertung: **Monatsabschluss**. Node.js 22.13 oder neuer; geprüft mit 22.22.3. Die GitHub-Pages-Ausgabe blendet den Einstieg aus, da dort kein freigegebener lokaler Dienst erreichbar ist.

1. Kunde und Monat auswählen. Auch archivierte Kunden sind lesbar.
2. Monat laden: Projekte, offene Zeitbuchungen, Pauschaleinträge und verfügbare Clockodo-Beträge ansehen. Projektkopf zeigt alle erfassten Stunden; darunter stehen nur offene, auswählbare Buchungen. Die aufklappbaren Details unterscheiden nicht abrechenbar, bereits abgerechnet, in Entwurf reserviert und laufende Uhr.
3. Ganze Projekte oder einzelne Buchungen auswählen, Entwurf benennen, speichern. Mehrere Entwürfe desselben Kunden sind möglich. Noch nicht ausgewählte Buchungen bleiben offen.
4. Für die nächste Auswahl den Monat neu laden. Reservierte Buchungen sind gesperrt. Entwurf auflösen gibt sie frei; der alte Entwurf bleibt in der Datenbank mit Status `released` erhalten.

Ein Entwurf ist ausschließlich eine interne Rechnungsauswahl. Er ist keine Rechnung, besitzt keine Rechnungsnummer und wird weder versandt noch nach Billomat übertragen. Fehlende Beträge verhindern die Vorschau nicht, müssen aber vor einer späteren Rechnung geklärt werden. Beträge werden ohne erfundene Währung angezeigt.

## Daten und Grenzen

- Clockodo bleibt Quelle der tatsächlichen Kundenbuchungen. Planstunden und Erledigt-Status des Planers werden nicht herangezogen.
- Alle Abfragen an Clockodo sind GET. Der neue Abruf ist `/api/v2/entries` mit Kunde, Monatszeitraum, `enhanced_list=true` und geprüfter vollständiger Pagination; Versionsnummer laut aktueller OpenAPI. Bestehende Kunden-/Projektendpunkte bleiben v3/v4.
- Zeitzone ist zunächst ausdrücklich Europe/Berlin. UTC-Abfragegrenzen berücksichtigen Sommerzeit. Buchungen über einer Monatsgrenze werden angezeigt, aber für Entwürfe gesperrt, bis die gewünschte Zuordnung geklärt ist. Keine stillen Zeitkürzungen.
- Dauer wird in Sekunden erhalten. Geld wird aus Clockodos `revenue` in Cent übernommen, nicht aus gerundeten Stunden neu berechnet. Fehlende Beträge/Stundensätze bleiben null. Budgetprojekte und Rechte können die gelieferten Beträge beeinflussen. Währung, Rundung und Darstellung müssen beim Pilot mit der echten Clockodo-Übersicht verglichen werden.
- Ein kompletter Abruf kann keine transaktionale Momentaufnahme von Clockodo garantieren. Änderungen zwischen Seiten werden soweit erkennbar abgewiesen; vor Entwurfserstellung werden die ausgewählten Buchungen erneut gelesen und mit dem vorherigen Stand verglichen.
- Einträge mit `billable=2` sind gesperrt; nur `billable=1` ist auswählbar. Laufende Uhren sind gesperrt. Pauschalen werden separat durch ihren Typ erhalten; ihre Stunden werden nicht erfunden.
- Erster Pilot pro gewähltem Kunden, kein automatischer Komplettimport sämtlicher Kundendaten und keine Mitarbeiter-/Abwesenheitsauswertung.

## Speicherung, Backup und Rücknahme

SQLite liegt unabhängig vom Git-Projekt unter `%LOCALAPPDATA%/DAYRIVO/billing/<account-hash>.sqlite`. Eine lokale Kontozuordnung per Hash trennt die Bestände; der Hash ist keine Verschlüsselung. Der lokale Windows-Benutzer kann diese Dateien lesen. Keine API-Schlüssel in DB, Browserplanung oder Exporten.

Tabellen: `drafts` enthält unveränderte ausgewählte Quellenzeilen und Status; `reservations` reserviert jede externe Buchungs-ID atomar und eindeutig. Zwei gleichzeitig laufende lokale Sitzungen können dieselbe Buchung nicht doppelt reservieren. Nach Neustart bleiben Entwürfe erhalten. Derselbe Entwurf darf nach einem unklaren Speicherergebnis nicht blind neu erzeugt werden: Liste und Reservierungen prüfen.

Nach Speichern/Auflösen wird zusätzlich ein versioniertes JSON-Backup unter `billing/backup/` geschrieben. Bei Backupfehler bleibt die erfolgreiche Datenbankänderung bestehen und die Oberfläche meldet den Unterschied. Backups werden nicht automatisch gelöscht. Das normale Planer-JSON enthält diese separate Datenbank nicht. Ein Import-/Wiederherstellungsdialog ist noch nicht implementiert; JSON sichert die vollständigen Entwürfe für eine spätere kontrollierte Wiederherstellung. Zum Sichern der SQLite-Datei den Clockodo-Dienst zuvor beenden. Zum Rücknehmen des Piloten App-Dateien aus der Arbeitskopie zurückspielen; Datenbank nicht löschen.

Die lokale HTTP-Sitzung behält Host-, Origin- und Bearer-Prüfung. Neue lokale Routen: GET `/billing/month`, GET/POST `/billing/drafts`, POST `/billing/release`. Lokale POSTs schreiben nur die eigene DB. Keine generischen Fremd-URLs, Billomat-Schreibwege oder Änderungen des Clockodo-Abrechnungsstatus.

## Nächste Stufen

### 1. Echter Monatsabgleich

Ein Kunde, ein abgeschlossener Monat, Screenshot/Export aus Clockodo. Zeiten, offener/bereits abgerechneter Anteil, Pauschalen, Budgetfall, Währung und Rundung vergleichen. Unterschiede zuerst erklären. Erst danach breiter einsetzen.

### 2. Billomat-Entwurf

Vorbereitung anhand einer Rechnungsvorlage und Jonas Projektaufteilung. Stabile Zuordnung Clockodo-Kunden-ID zu Billomat-client_id manuell bestätigen; nicht nur Namen vergleichen. Eine Billomat-template_id pro Vorlage. Rechnungstext, Leistungszeitraum, Zahlungsziel, Währung/Steuern und Stundensatz-/Pauschalregeln aus dem bestehenden Verfahren übernehmen. Preis-Overrides als getrennte Rechnungswerte speichern; Quelldaten erhalten.

Geplanter Auftrag: invoiceDraftId, customerMappingId, templateId, positions (Beschreibung, Menge, Einheit, Einzelpreis, Steuerzuordnung, sourceEntryIds), Leistungszeitraum. Noch kein API-Key-Feld oder sendefähiger Billomat-Adapter.

Vor externem Schreiben: dauerhafte Outbox mit eindeutiger operationId, Billomat-Entwurfs-ID und Status `prepared / creating / created / reconciliation_required`. Bei Timeout zunächst den externen Zustand abgleichen, nicht POST wiederholen. Teilweise angelegte Positionen müssen wieder aufgenommen werden können. IDs und Zwischenstände sichern.

### 3. Fertigstellen

Vorschau und ausdrücklicher Klick auf Fertigstellen. Nummerierung und Originalbeleg zunächst in Billomat. Generieren, Versenden und Clockodo als abgerechnet markieren sind separate Aktionen. Kein automatischer E-Mail-Versand. Quellen nach Rechnung unverändert festhalten; spätere Abweichungen zeigen. Teilabrechnung, Freigaben, Korrektur/Storno und sichere Wiederholungen vor Produktivbetrieb testen. Strukturierte E-Rechnung und Archivierung anhand des tatsächlichen Billomat-Formats prüfen.

### 4. Eigene Ausgabe / Web

Eigene Vorlagen und PDF-Ausgabe als austauschbarer Ausgabekanal. Finalisierung, Nummern, Korrekturen, strukturierte E-Rechnung und Archivierung gemeinsam planen. Für Online-Nutzung später authentifiziertes Backend mit serverseitigen Geheimnissen, Kontentrennung und Backup; nicht einfach den lokalen Dienst für beliebige Web-Origins öffnen.

## Prüfungen und Quellen

`npm run test:billing`: DST/Monatsgrenzen, vollständige Pagination, echte Sekunden, fehlend vs. null Euro, laufend/bereits abgerechnet, Reservierung und Rollback, Kontotrennung, Neustart, Backup, Quelle erneut prüfen, HTTP-Authentifizierung und GET-only upstream. Isolierter Browser: Projekt-/Einzelauswahl, Speichern/Wiederöffnen, Sperren, Auflösen, Planerdaten unverändert, DE/EN und Mobile. Screenshots in `tests/artifacts/billing-*.png` (ignoriert).

Geprüfte Quellen am 17.09.2026: [Clockodo OpenAPI](https://docs.clockodo.com/openapi.yaml), [Billomat Rechnungen](https://www.billomat.com/api/rechnungen/). API-Beschreibung belegt Möglichkeiten, keinen funktionierenden Live-Kontozugriff.
