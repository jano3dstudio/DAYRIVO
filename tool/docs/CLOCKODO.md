# Clockodo in DAYRIVO

Stand: 17.09.2026. Jona hat den ersten echten Lesetest bestätigt: Kunden und Projekte sind sichtbar. Die anschließende Einbindung in DAYRIVO ist implementiert und mit isoliertem Browser, echtem Loopback-Dienst und künstlichen API-Antworten geprüft. Ihre erste Nutzung mit Jonas echten Daten steht noch aus.

## Start mit dem bestehenden Planer

1. Den bisherigen Planer neu laden. Browserprofil und `index.html`-Pfad beibehalten.
2. **Settings → Clockodo → Clockodo starten**. Eine eventuelle Browser-/Windows-Frage mit **Öffnen** bestätigen. Voraussetzung: Windows und Node.js 22 oder neuer im PATH. Der Direktstart ist für Jonas aktuellen Windows-Benutzer eingerichtet. Auf einem anderen PC einmal `tool/clockodo/Direktstart-einrichten.cmd` ausführen.
3. Im Windows-Dialog die Benutzer-E-Mail und den API-Key eingeben; Strg+V funktioniert im verdeckten Schlüsselfeld. Die optionale E-Mail-Vorauswahl liegt in `tool/clockodo/local-settings.json`, ausgeschlossen von Git. Dort wird kein Key gespeichert.
4. Nach erfolgreicher Anmeldung verbindet sich der bereits geöffnete Planer automatisch. Kein CMD-Fenster und kein Kopieren eines Codes nötig. Der Status wechselt zu **Verbunden · Kunden und Projekte lesen**. Bei abgebrochener Anmeldung oder fehlender Browser-Unterstützung die aufklappbare Hilfe unter dem Startbutton nutzen. Die App wartet maximal zwei Minuten; nach später abgeschlossener Anmeldung Settings → Clockodo erneut öffnen.
5. Einen Eintrag mit der Kategorie **Kunde** öffnen. Unter **Kundendetails → Aus Clockodo wählen** zuerst Kunde, dann Projekt auswählen. Seiten lassen sich mit den Pfeilen durchblättern. Archivierte Datensätze sind sichtbar, aber nicht neu auswählbar. Ein Kunde kann auch ohne Projekt übernommen werden.
6. **Auswahl übernehmen** füllt zunächst nur den Eintragsdialog. Erst **Eintrag speichern** übernimmt die Zuordnung und die beiden benötigten Stammdatensätze. Abbrechen verändert keine gespeicherten Einträge oder Stammdaten.

Beim Direktstart läuft der lokale Dienst ohne zusätzliches Verbindungsfenster. **Settings → Clockodo → Verbindung trennen** beendet ihn. Nach maximal vier Stunden endet die Sitzung automatisch; das bloße Schließen des Browser-Tabs beendet den Dienst nicht sofort. Bereits gespeicherte Kunden-/Projektzuordnungen bleiben offline lesbar. Nur eine direkte Sitzung gleichzeitig; vor einem Wechsel in ein anderes Browserprofil die alte Sitzung trennen.

Manueller Rückfallweg: `DAYRIVO-Clockodo.cmd` starten, anmelden, **Verbindung kopieren** und unter der aufklappbaren Hilfe einfügen. Bei diesem Weg das Verbindungsfenster offen lassen; sein Schließen beendet die Sitzung. Optional öffnet **Im Standardbrowser öffnen** den Planer mit gekoppelter Sitzung. Nur verwenden, wenn dies das bisher genutzte Browserprofil ist; unterschiedliche Browserprofile besitzen getrennte Planungsdaten. Direktstart und manuelles Einfügen vermeiden einen Profilwechsel.

Die einmalige Einrichtung registriert ausschließlich `dayrivo-clockodo` unter `HKCU\Software\Classes`. Ziel ist der feste lokale Launcher, aufgerufen mit `-File`; Startlinks akzeptieren nur `dayrivo-clockodo://connect/` plus 64 zufällige Hex-Zeichen. Keine Autostart-/Firewall-Änderung. Rücknahme: `powershell.exe -NoProfile -File tool/clockodo/Register-DirectStart.ps1 -Action Uninstall`. Vor einem Projektumzug am alten Pfad entfernen und am neuen Pfad erneut einrichten. Fremde Belegung des Protokollnamens wird nicht überschrieben. Grundlage: [Microsoft URI-Aktivierung](https://learn.microsoft.com/en-us/windows/apps/develop/launch/handle-uri-activation).

Der frühere reine Konsolentest `Clockodo-Test.cmd` bleibt für Diagnose verfügbar. Er zeigt Daten nur in CMD und verbindet den Planer nicht.

## Was gespeichert wird

- Nur gewählte Kunden/Projekte: lokale stabile ID, Name, Aktivstatus, externe Clockodo-ID und Projekt-Kunden-Zuordnung. Kein Komplettimport.
- Bestehende lokale Datensätze werden nicht allein anhand gleicher Namen umgewidmet. Namenskonflikte bekommen einen eindeutigen Clockodo-Zusatz. Bereits importierte externe IDs bleiben stabil.
- `settings.clockodoAccount` enthält einen SHA-256-Wert der normalisierten Clockodo-Benutzer-E-Mail. Er verhindert das unbeabsichtigte Mischen verschiedener Benutzer bei weiteren Importen. Er ist kein Authentifizierungsmittel und anonymisiert eine bekannte E-Mail nicht zuverlässig. Account-Wechsel ist in diesem ersten Schritt nicht unterstützt.
- Die kurzlebige lokale Sitzung liegt ausschließlich in `sessionStorage` des Browser-Tabs, nicht in Planungsdaten oder Backups. Beim optionalen Browserstart wird sie zunächst im URL-Fragment übergeben und daraus wieder entfernt. Der Clockodo-API-Key kommt nie in den Browser.

## Grenzen und Schutz

Nur Kundenjobs mit der stabilen Kategorie-ID `Kunde` erhalten die Auswahl; Umbenennen dieser Kategorie erhält die ID. AI/Firma, Spiel, Admin, Familie, Schule, Sport und Privat bleiben ohne Clockodo-Auswahl. Andere eigene Kategorien sind noch nicht freischaltbar.

Es werden ausschließlich GET-Abfragen für `/api/v3/customers` und `/api/v4/projects` gesendet. Projekte werden mit `filter[customers_id]` abgefragt; fremde Zuordnungen werden abgelehnt. Keine Zeiterfassung, kein Senden von Plan- oder Ist-Zeit, keine Leistungssynchronisation, Mitarbeiterdaten oder Abwesenheiten.

Der Dienst hört nur auf `127.0.0.1`: Direktstart auf Port 18744, manueller Start auf einem zufällig zugewiesenen Port. Jede Datenabfrage braucht den zufälligen Sitzungsschlüssel; Host und Browser-Origin werden geprüft. Beim Direktstart erzeugt der Browser diesen Schlüssel mit WebCrypto und übergibt ihn über den Startlink. Das ist ein kurzlebiges lokales Sitzungstoken, kein Clockodo-API-Key. Ein belegter Port wird nicht übernommen und kein fremder Prozess beendet. Der erlaubte `null`-Origin stammt vom lokalen Datei-Planer und ist allein keine Authentifizierung. Ein gehosteter Planer wird in dieser ersten Fassung nicht unterstützt. Es gibt keinen universellen API-Proxy. Der einzige lokale POST beendet die Sitzung.

E-Mail und Key werden über stdin an den Node-Prozess übergeben, nicht als Kommandozeilenargumente oder Umgebungsvariablen. Der API-Key bleibt für die Sitzung im Arbeitsspeicher und wird nicht in Dateien gespeichert. An Clockodo wird er über HTTPS gesendet. Weiterleitungen sind gesperrt; ein Upstream-Aufruf hat 20 Sekunden Zeitlimit. Fehlerausgaben enthalten keine Schlüssel, Header oder Rohantworten. Der persönliche Key selbst behält die Clockodo-Benutzerrechte; die Beschränkung auf Lesen wird durch unseren Client umgesetzt.

## Prüfungen

- `npm test`: einschließlich lokaler/externer Identität, Namenskonflikten, Projektzuordnung, erlaubten Routen, Host/Origin/Token-Prüfung und GET-only.
- `npm run test:browser`: Kopplung, Auswählen, Abbrechen, Speichern, Neuladen, Kundenwechsel ohne Projekt, Scope, Trennen, Offline-Fehler, Englisch und schmale Ansicht. Nur isolierte Profile und künstliche Datensätze.
- Windows: `powershell.exe -STA -NoProfile -ExecutionPolicy RemoteSigned -File tests/clockodo-dialog.test.ps1` und entsprechend `tests/clockodo-launcher.test.ps1` aus `tool/`. Der Launcher-Test ersetzt die API vollständig und prüft Prozessstart, stdin, die Datei-URL und lokalen Status. Die Dialogansichten wurden als Offline-Bitmap geprüft.
- Direktstart: `tests/clockodo-direct-browser.test.cjs` simuliert ausschließlich die Übergabe an Windows und prüft echte Loopback-Kopplung, Neuladen, Trennen, erhaltene Planerdaten und DE/EN/mobile Darstellung. Der PowerShell-Test prüft zusätzlich gültige/ungültige URI-Werte sowie den echten Launcher-Prozess mit künstlicher API. Der registrierte Windows-Startlink wurde separat real geöffnet: Anmeldefenster bestätigt, ohne Zugangsdaten geschlossen und Prozessende geprüft. Browser-Rückfrage und echte Anmeldung sind damit nicht als gemeinsam durchlaufener Nutzertest belegt.

## Später

Leistungen, Vorschau der tatsächlich erfassten Zeit, explizite Freigabe und Schutz vor doppelten Übertragungen sind weitere separate Schritte. Planzeit wird nicht automatisch als Ist-Zeit gesendet. Lokale Stammdaten: [MASTER_DATA.md](MASTER_DATA.md).

Quellen: [offizielle Dokumentation](https://docs.clockodo.com/), [OpenAPI](https://docs.clockodo.com/openapi.yaml), Dokumentstand 15.09.2026, geprüft 17.09.2026. Aktuelle Listen liefern `data` und `paging`; keine alten v2-Beispiele übernehmen.
