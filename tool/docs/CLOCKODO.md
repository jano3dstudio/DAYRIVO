# Clockodo in DAYRIVO

Stand: 17.09.2026. Ergänzung Monatsabschluss: siehe BILLING.md. Die Eintragsauswahl liest Kunden, Projekte und Leistungen; der neue lokale Pilot liest zusätzlich Kundenbuchungen und speichert interne Entwürfe. Jona hat den ersten echten Lesetest bestätigt: Kunden und Projekte sind sichtbar. Die anschließende Einbindung in DAYRIVO ist implementiert und mit isoliertem Browser, echtem Loopback-Dienst und künstlichen API-Antworten geprüft. Jona bestätigt den Kundenabruf aus der App. Die neue Suche, Leistungsauswahl und der Stammdatenimport sind mit künstlichen Antworten geprüft; der echte Leistungsabruf steht noch aus.

## Start mit dem bestehenden Planer

1. Den bisherigen Planer neu laden. Browserprofil und `index.html`-Pfad beibehalten.
2. **Settings → Clockodo → Clockodo starten**. Eine eventuelle Browser-/Windows-Frage mit **Öffnen** bestätigen. Voraussetzung: Windows und Node.js 22 oder neuer im PATH. Der Direktstart ist für Jonas aktuellen Windows-Benutzer eingerichtet. Auf einem anderen PC einmal `tool/clockodo/Direktstart-einrichten.cmd` ausführen.
3. Im Windows-Dialog die Benutzer-E-Mail und den API-Key eingeben; Strg+V funktioniert im verdeckten Schlüsselfeld. Die optionale E-Mail-Vorauswahl liegt in `tool/clockodo/local-settings.json`, ausgeschlossen von Git. Dort wird kein Key gespeichert.
4. Nach erfolgreicher Anmeldung verbindet sich der bereits geöffnete Planer automatisch. Kein CMD-Fenster und kein Kopieren eines Codes nötig. Der Status wechselt zu **Verbunden · Kunden und Projekte lesen**. Bei abgebrochener Anmeldung oder fehlender Browser-Unterstützung die aufklappbare Hilfe unter dem Startbutton nutzen. Die App wartet maximal zwei Minuten; nach später abgeschlossener Anmeldung Settings → Clockodo erneut öffnen.
5. Einen Eintrag mit der Kategorie **Kunde** öffnen. Unter **Kundendetails → Aus Clockodo wählen** Kunde, Projekt und optional Leistung auswählen. Die Suchfelder filtern nach Namensbestandteilen oder externer ID. Alle Seiten werden vor der Auswahl nacheinander geladen; die Suche ist nicht auf die erste Seite begrenzt. Archivierte Datensätze sind sichtbar, aber nicht neu auswählbar. Ein Kunde kann auch ohne Projekt übernommen werden.
6. **Auswahl übernehmen** füllt zunächst nur den Eintragsdialog. Erst **Eintrag speichern** übernimmt die Zuordnung und die ausgewählten Stammdatensätze. Abbrechen verändert keine gespeicherten Einträge oder Stammdaten.

Beim Direktstart läuft der lokale Dienst ohne zusätzliches Verbindungsfenster. **Settings → Clockodo → Verbindung trennen** beendet ihn. Nach maximal vier Stunden endet die Sitzung automatisch; das bloße Schließen des Browser-Tabs beendet den Dienst nicht sofort. Bereits gespeicherte Kunden-/Projektzuordnungen bleiben offline lesbar. Nur eine direkte Sitzung gleichzeitig; vor einem Wechsel in ein anderes Browserprofil die alte Sitzung trennen.

Manueller Rückfallweg: `DAYRIVO-Clockodo.cmd` starten, anmelden, **Verbindung kopieren** und unter der aufklappbaren Hilfe einfügen. Bei diesem Weg das Verbindungsfenster offen lassen; sein Schließen beendet die Sitzung. Optional öffnet **Im Standardbrowser öffnen** den Planer mit gekoppelter Sitzung. Nur verwenden, wenn dies das bisher genutzte Browserprofil ist; unterschiedliche Browserprofile besitzen getrennte Planungsdaten. Direktstart und manuelles Einfügen vermeiden einen Profilwechsel.

Die einmalige Einrichtung registriert ausschließlich `dayrivo-clockodo` unter `HKCU\Software\Classes`. Ziel ist der feste lokale Launcher, aufgerufen mit `-File`; Startlinks akzeptieren nur `dayrivo-clockodo://connect/` plus 64 zufällige Hex-Zeichen. Keine Autostart-/Firewall-Änderung. Rücknahme: `powershell.exe -NoProfile -File tool/clockodo/Register-DirectStart.ps1 -Action Uninstall`. Vor einem Projektumzug am alten Pfad entfernen und am neuen Pfad erneut einrichten. Fremde Belegung des Protokollnamens wird nicht überschrieben. Grundlage: [Microsoft URI-Aktivierung](https://learn.microsoft.com/en-us/windows/apps/develop/launch/handle-uri-activation).

Der frühere reine Konsolentest `Clockodo-Test.cmd` bleibt für Diagnose verfügbar. Er zeigt Daten nur in CMD und verbindet den Planer nicht.

## Was gespeichert wird

- Nur gewählte Kunden/Projekte/Leistungen: lokale stabile ID, Name, Aktivstatus, externe Clockodo-ID und Projekt-Kunden-Zuordnung. Kein Komplettimport.
- Bestehende lokale Datensätze werden nicht allein anhand gleicher Namen umgewidmet. Namenskonflikte bekommen einen eindeutigen Clockodo-Zusatz. Bereits importierte externe IDs bleiben stabil.
- `settings.clockodoAccount` enthält einen SHA-256-Wert der normalisierten Clockodo-Benutzer-E-Mail. Er verhindert das unbeabsichtigte Mischen verschiedener Benutzer bei weiteren Importen. Er ist kein Authentifizierungsmittel und anonymisiert eine bekannte E-Mail nicht zuverlässig. Account-Wechsel ist in diesem ersten Schritt nicht unterstützt.
- Die kurzlebige lokale Sitzung liegt ausschließlich in `sessionStorage` des Browser-Tabs, nicht in Planungsdaten oder Backups. Beim optionalen Browserstart wird sie zunächst im URL-Fragment übergeben und daraus wieder entfernt. Der Clockodo-API-Key kommt nie in den Browser.

## Grenzen und Schutz

Nur Kundenjobs mit der stabilen Kategorie-ID `Kunde` erhalten die Auswahl; Umbenennen dieser Kategorie erhält die ID. AI/Firma, Spiel, Admin, Familie, Schule, Sport und Privat bleiben ohne Clockodo-Auswahl. Andere eigene Kategorien sind noch nicht freischaltbar.

Für die Eintragsauswahl werden GET-Abfragen für `/api/v3/customers` und `/api/v4/projects` gesendet. Der Monatsabschluss verwendet zusätzlich GET `/api/v2/entries` mit explizitem Kunde-/Monatsfilter und `enhanced_list=true`. Projekte werden mit `filter[customers_id]` abgefragt; fremde Zuordnungen werden abgelehnt. Keine schreibende Zeiterfassung und kein Senden von Plan- oder Ist-Zeit. Keine vollständige Leistungssynchronisation, Mitarbeiterstammdaten oder Abwesenheiten. Leistungsnamen und vorhandene Abrechnungswerte werden mit den Kundenbuchungen gelesen.

Der Dienst hört nur auf `127.0.0.1`: Direktstart auf Port 18744, manueller Start auf einem zufällig zugewiesenen Port. Jede Datenabfrage braucht den zufälligen Sitzungsschlüssel; Host und Browser-Origin werden geprüft. Beim Direktstart erzeugt der Browser diesen Schlüssel mit WebCrypto und übergibt ihn über den Startlink. Das ist ein kurzlebiges lokales Sitzungstoken, kein Clockodo-API-Key. Ein belegter Port wird nicht übernommen und kein fremder Prozess beendet. Der erlaubte `null`-Origin stammt vom lokalen Datei-Planer und ist allein keine Authentifizierung. Ein gehosteter Planer wird in dieser ersten Fassung nicht unterstützt. Es gibt keinen universellen API-Proxy. Lokale POSTs beenden die Sitzung oder speichern/lösen interne Rechnungsentwürfe in der lokalen Datenbank; kein POST an Clockodo und keine externe Rechnungserzeugung.

E-Mail und Key werden über stdin an den Node-Prozess übergeben, nicht als Kommandozeilenargumente oder Umgebungsvariablen. Der API-Key bleibt für die Sitzung im Arbeitsspeicher und wird nicht in Dateien gespeichert. An Clockodo wird er über HTTPS gesendet. Weiterleitungen sind gesperrt; ein Upstream-Aufruf hat 20 Sekunden Zeitlimit. Fehlerausgaben enthalten keine Schlüssel, Header oder Rohantworten. Der persönliche Key selbst behält die Clockodo-Benutzerrechte; die Beschränkung auf Lesen wird durch unseren Client umgesetzt.

## Prüfungen

- `npm test`: einschließlich lokaler/externer Identität, Namenskonflikten, Projektzuordnung, erlaubten Routen, Host/Origin/Token-Prüfung und GET-only.
- `npm run test:browser`: Kopplung, Auswählen, Abbrechen, Speichern, Neuladen, Kundenwechsel ohne Projekt, Scope, Trennen, Offline-Fehler, Englisch und schmale Ansicht. Nur isolierte Profile und künstliche Datensätze.
- Windows: `powershell.exe -STA -NoProfile -ExecutionPolicy RemoteSigned -File tests/clockodo-dialog.test.ps1` und entsprechend `tests/clockodo-launcher.test.ps1` aus `tool/`. Der Launcher-Test ersetzt die API vollständig und prüft Prozessstart, stdin, die Datei-URL und lokalen Status. Die Dialogansichten wurden als Offline-Bitmap geprüft.
- Direktstart: `tests/clockodo-direct-browser.test.cjs` simuliert ausschließlich die Übergabe an Windows und prüft echte Loopback-Kopplung, Neuladen, Trennen, erhaltene Planerdaten und DE/EN/mobile Darstellung. Der PowerShell-Test prüft zusätzlich gültige/ungültige URI-Werte sowie den echten Launcher-Prozess mit künstlicher API. Der registrierte Windows-Startlink wurde separat real geöffnet: Anmeldefenster bestätigt, ohne Zugangsdaten geschlossen und Prozessende geprüft. Browser-Rückfrage und echte Anmeldung sind damit nicht als gemeinsam durchlaufener Nutzertest belegt.

## Später

Leistungen, Vorschau der tatsächlich erfassten Zeit, explizite Freigabe und Schutz vor doppelten Übertragungen sind weitere separate Schritte. Planzeit wird nicht automatisch als Ist-Zeit gesendet. Lokale Stammdaten: [MASTER_DATA.md](MASTER_DATA.md).

Quellen: [offizielle Dokumentation](https://docs.clockodo.com/), [OpenAPI](https://docs.clockodo.com/openapi.yaml), Dokumentstand 15.09.2026, geprüft 17.09.2026. Aktuelle Listen liefern `data` und `paging`; keine alten v2-Beispiele übernehmen.

## Suche und gezielter Stammdatenimport (17.09.2026)

**Settings → Stammdaten → Aus Clockodo importieren** öffnet denselben Suchdialog im Importmodus. Einen Kunden wählen, mehrere relevante Projekte und Leistungen anhaken, dann **In Stammdaten übernehmen**. Die Buttonzahl zählt Kunde plus ausgewählte Projekte und Leistungen. Filterwechsel erhält gesetzte Haken; Kundenwechsel verwirft die Projektauswahl des vorigen Kunden. Abbrechen speichert nichts. Leistungen können auch ohne Kundenwahl importiert werden.

Importe gleichen externe IDs ab, legen keine gleichnamigen lokalen Datensätze still zusammen und aktualisieren ausgewählte bereits importierte Namen. Archivierte Quellendatensätze sind sichtbar, aber nicht auswählbar. Nur die Auswahl wird dauerhaft gespeichert, kein vollständiger Katalog. Die gesamte Auswahl wird zusammen mit der Kontozuordnung in einem Speichervorgang übernommen. Wochen, Einträge, Ist-Zeiten und Ausgangspläne bleiben erhalten.

Danach stehen Kunde, seine Projekte und Leistungen bei **Kundendetails** im Wochen-Eintragseditor als Vorschläge bereit, auch nach Neustart ohne Verbindung. Es werden keine Kalenderblöcke automatisch angelegt. Stammdaten lassen sich anschließend lokal verwalten und archivieren.

Leistungen: GET **/api/v4/services**, Antwort mit data/paging, nach der am 17.09.2026 gelesenen [Clockodo OpenAPI](https://docs.clockodo.com/openapi.yaml). Der lokale Dienst bietet dafür GET /services. API-Schlüssel bleiben dort. Nach Update die bestehende Sitzung trennen und Dienst neu starten. Scheitert der Leistungsabruf, bleibt Kunde/Projekt nutzbar; eine Meldung nennt Dienstversion oder Leserechte als Prüfpunkte.

Die Oberfläche lädt maximal 100 Seiten pro Liste, prüft Gesamtzahl, Seitennummern und doppelte IDs, erkennt geänderte Zählwerte und verwirft unvollständige Listen. Ein kompletter Abruf ist keine transaktionale Momentaufnahme des Fremdsystems. Laufende Abfragen werden nach Schließen nicht in einen neuen Dialog übernommen. Es gibt keine externen Schreibzugriffe.

Gezielter Test: node tests/clockodo-browser.test.cjs nutzt paginierte künstliche Kunden/Projekte/Leistungen über den echten lokalen Dienst. Geprüft: Suche jenseits Seite 1, Mehrfachauswahl über Filter hinweg, wiederholter Import ohne Dubletten, Abbrechen, unveränderte Wochen, Offline-Vorschläge nach Reload, DE/EN und schmale Ansicht. Modelltests prüfen zusätzlich externe Leistungs-IDs und archivierte Datensätze.

## Vorgeschlagener Platz für Zeitübertragung (noch nicht implementiert)

Im Kundenjob unter **Erfasste Arbeitszeit**, direkt nach der manuellen Ist-Zeit: **An Clockodo übertragen**. Ein Klick öffnet zuerst eine Prüfung von Kunde, Projekt, Leistung, Buchungsdatum und tatsächlich erfasster Dauer. Planzeit ist keine Ersatzquelle. Fehlende externe IDs oder Ist-Minuten müssen vorher ergänzt werden; privat und andere nicht freigeschaltete Kategorien erhalten keine Übertragung.

Für die spätere Umsetzung: einen gespeicherten Job übertragen, externe Buchungs-ID und übertragenen Stand dauerhaft sichern, Status am Job anzeigen. Erneuter Klick darf keinen doppelten Zeiteintrag erzeugen. Bei unklarem Netzwerkergebnis erst abgleichen, nicht blind erneut schreiben. Ob eine Tagesdauer oder mehrere tatsächliche Arbeitsintervalle übertragen werden, muss beim Implementieren ausdrücklich im Dialog erkennbar sein. Vorhandene Plan-Startzeiten dürfen nicht als tatsächlicher Arbeitsbeginn ausgegeben werden. Sammelübertragung gegebenenfalls später in der Auswertung ergänzen.
