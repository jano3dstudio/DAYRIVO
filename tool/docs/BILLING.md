# Monatsabschluss und Rechnungsvorbereitung

Stand 17.09.2026: lokaler Pilot implementiert, mit künstlichen Daten geprüft. Echter Abgleich mit Jonas Clockodo-Monatsübersicht sowie eigene PDF-/E-Rechnungserzeugung stehen aus. Eine Billomat-Anbindung ist ausdrücklich nicht vorgesehen. Keine fertigen Rechnungen und keine Live-Abrechnungen erzeugt.

## Start

Im bisherigen lokalen DAYRIVO-Planer neu laden, die Clockodo-Sitzung trennen und den aktualisierten Dienst erneut starten. Links unter Auswertung: **Monatsabschluss**. Node.js 22.13 oder neuer; geprüft mit 22.22.3. Die GitHub-Pages-Ausgabe blendet den Einstieg aus, da dort kein freigegebener lokaler Dienst erreichbar ist.

1. Kunde und Monat auswählen. Auch archivierte Kunden sind lesbar.
2. Monat laden: Projekte, offene Zeitbuchungen, Pauschaleinträge und verfügbare Clockodo-Beträge ansehen. Projektkopf zeigt alle erfassten Stunden; darunter stehen nur offene, auswählbare Buchungen. Die aufklappbaren Details unterscheiden nicht abrechenbar, bereits abgerechnet, in Entwurf reserviert und laufende Uhr.
3. Ganze Projekte oder einzelne Buchungen auswählen, Entwurf benennen, speichern. Mehrere Entwürfe desselben Kunden sind möglich. Noch nicht ausgewählte Buchungen bleiben offen.
4. Für die nächste Auswahl den Monat neu laden. Reservierte Buchungen sind gesperrt. Entwurf auflösen gibt sie frei; der alte Entwurf bleibt in der Datenbank mit Status `released` erhalten.

Ein Entwurf ist ausschließlich eine interne Rechnungsauswahl. Er ist keine Rechnung, besitzt keine Rechnungsnummer und wird nicht versandt. Fehlende Beträge verhindern die Vorschau nicht, müssen aber vor einer späteren Rechnung geklärt werden. Beträge werden ohne erfundene Währung angezeigt.

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

Die lokale HTTP-Sitzung behält Host-, Origin- und Bearer-Prüfung. Neue lokale Routen: GET `/billing/month`, GET/POST `/billing/drafts`, POST `/billing/release`. Lokale POSTs schreiben nur die eigene DB. Keine generischen Fremd-URLs oder Änderungen des Clockodo-Abrechnungsstatus.

## Nächste Stufen: eigene Rechnungserzeugung

Verbindliche Produktentscheidung vom 17.09.2026: **keine Billomat-Anbindung**. DAYRIVO erzeugt und verwaltet die Rechnungsdateien selbst. Bestehende Rechnungen dürfen als Layout-/Datenreferenz dienen; dafür sind weder Billomat-Zugang noch API nötig. Diese Stufen sind geplant, noch nicht implementiert.

### 1. Echter Monatsabgleich und Vorlagen

Ein Kunde, ein abgeschlossener Monat, Screenshot/Export aus Clockodo. Zeiten, offener/bereits abgerechneter Anteil, Pauschalen, Budgetfall, Währung und Rundung vergleichen. Unterschiede zuerst erklären. Danach eine vorhandene Rechnung als Layoutreferenz übernehmen und anhand künstlicher Beispieldaten abstimmen.

Für die erste Ausgabe benötigt: bestätigte Aussteller- und Empfängerdaten, Steuerdaten und zutreffende Steuerfälle, Bankverbindung, Zahlungsziel, Währung, Leistungszeitraum und gewünschter Nummernkreis samt bisheriger Nummerierung. Keine Angaben aus Namen oder Clockodo-Zeitbuchungen erraten. Keine pauschale Steuer-Voreinstellung ohne Bestätigung.

### 2. Ein Rechnungsmodell für Vorschau, PDF und XML

Der bestehende Entwurf bleibt eine Quellenauswahl. Ein separates, versioniertes Rechnungsmodell enthält Aussteller/Empfänger als Momentaufnahme, Positionen mit Beschreibung, Menge, Einheit, Einzelpreis, Steuerzuordnung und sourceEntryIds, Leistungszeitraum, Zahlungsbedingungen, Währung und gegebenenfalls Nachlässe/Zuschläge. Die Zuordnung mehrerer Projekte zu einer Rechnung bleibt frei wählbar; Kunden werden nicht vermischt.

Quelldaten unverändert erhalten, Rechnungswerte und begründete Overrides separat speichern. Rechnungsbeträge dezimalgenau nach dokumentierten Rundungsregeln berechnen; Geld nicht mit binären Fließkomma-Zwischensummen abrechnen. Positions-, Steuer- und Gesamtsummen müssen konsistent sein. Fehlende Preise und ungeklärte Steuerfälle blockieren die Fertigstellung. Darstellung und XML stammen aus demselben Modell.

### 3. Zielformat: ZUGFeRD mit Profil EN 16931

Geplant ist ein lesbares PDF/A-3 mit eingebetteter Rechnungs-XML im ZUGFeRD-Profil EN 16931. Ein normales Browser-Druck-PDF ist kein Ersatz für diese Ausgabe. FeRD führt zum Recherchezeitpunkt ZUGFeRD 2.5.2; vor Implementierung Spezifikation, Generator und Validator auf eine konkret unterstützte gemeinsame Version festlegen und dokumentieren. Keine selbst erfundene XML-Struktur und kein bloßes Anhängen beliebiger XML an ein PDF.

Erzeugung im lokalen Dienst mit geprüften Bibliotheken; der Browser zeigt Vorschau und Download. Generator-Auswahl, Abhängigkeiten und deren Lizenzen sind noch offen. Ein zusätzlicher XRechnung-Export kann später für konkrete Empfängeranforderungen ergänzt werden. Empfängerprofile einschließlich Pflichtreferenzen und Übermittlungsweg gesondert prüfen.

### 4. Prüfen, fertigstellen und aufbewahren

Ablauf: Auswahl → Rechnungsdetails → klar als Entwurf markierte Vorschau → Prüfen → ausdrücklich Fertigstellen → Original herunterladen. Entwürfe bekommen keine endgültige Rechnungsnummer. Die spätere Finalisierung reserviert eine eindeutige Nummer dauerhaft und wiederholbar; parallele Klicks und Neustarts dürfen keine Duplikate erzeugen. Fehlgeschlagene Ausgabe mit reservierter Nummer bleibt als wiederaufnehmbarer Vorgang protokolliert, Nummern nicht still neu vergeben.

Vor Freigabe: Pflichtangaben, Beträge und Referenzen prüfen; XML gegen passende XSD und Schematron-Regeln validieren; PDF/A-Konformität und ZUGFeRD-Einbettung prüfen; sichtbare Rechnung mit XML abgleichen. Fehler verhindern den Status fertiggestellt. Validierungsbericht mit Format-/Validatorversion sichern. Visuelle Prüfung mit langen Positionen, mehreren Seiten, Umlauten und realistischen Steuerfällen zusätzlich durchführen. Ein bestandener technischer Validator allein bestätigt nicht die Richtigkeit sämtlicher Geschäftsdaten oder die gesamte rechtliche Konformität.

Finalisierte Rechnung mit Nummer, Datum, Modell, Originaldatei, Prüfergebnis und Hash unverändert archivieren. Spätere Quelldatenänderungen ändern den Beleg nicht. Korrektur/Storno referenziert das Original; kein Überschreiben ausgestellter Rechnungen. Wiederherstellung einschließlich Nummernstand, Reservierungen und Originalen testen. Das bestehende Entwurfs-Backup ist noch kein vollständiges Rechnungsarchiv.

Versenden und Clockodo als abgerechnet markieren bleiben separate, künftig ausdrücklich ausgelöste Aktionen. Es gibt aktuell weder Versand noch finale Rechnungen noch eine Änderung des Clockodo-Abrechnungsstatus. Online-Nutzung benötigt später ein getrennt abgesichertes Backend; den lokalen Dienst nicht für beliebige Web-Origins öffnen.

## Prüfungen und Quellen

`npm run test:billing`: DST/Monatsgrenzen, vollständige Pagination, echte Sekunden, fehlend vs. null Euro, laufend/bereits abgerechnet, Reservierung und Rollback, Kontotrennung, Neustart, Backup, Quelle erneut prüfen, HTTP-Authentifizierung und GET-only upstream. Isolierter Browser: Projekt-/Einzelauswahl, Speichern/Wiederöffnen, Sperren, Auflösen, Planerdaten unverändert, DE/EN und Mobile. Screenshots in `tests/artifacts/billing-*.png` (ignoriert).

Geprüfte Quellen am 17.09.2026: [Clockodo OpenAPI](https://docs.clockodo.com/openapi.yaml), [BMF E-Rechnungs-FAQ](https://www.bundesfinanzministerium.de/Content/DE/FAQ/e-rechnung.html), [FeRD technische FAQ](https://www.ferd-net.de/faqs/technisches-zur-e-rechnung), [FeRD Formatversionen](https://www.ferd-net.de/downloads/veroeffentlichungen). API-Beschreibung belegt Möglichkeiten, keinen funktionierenden Live-Kontozugriff.
