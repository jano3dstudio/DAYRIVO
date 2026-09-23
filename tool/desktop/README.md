# Optional in Second Brain · 22.09.2026

Standalone remains available. See [WORKSPACE.md](WORKSPACE.md) for installation,
data continuity and the optional workspace sidecar.

# DAYRIVO Desktop · Windows x64

Die bestehende HTML/CSS/JS-Oberfläche läuft unverändert in einer eigenen WebView2-App. Native Fensterbasis: fest übernommene JANO App-Kit-Version 0.2.0, Quellen in kit/. Akzeptiertes DAYRIVO-Icon und bestehende Looks bleiben erhalten. Keine Web-Veröffentlichung durch diesen Build.

## Start und Daten

DAYRIVO.exe starten. Windows 10/11 x64, .NET Framework 4.8 und Microsoft Edge WebView2 Runtime werden benötigt. WebView2 ist auf diesem Entwicklungs-PC vorhanden; für andere PCs: https://developer.microsoft.com/microsoft-edge/webview2/ . Node.js wird mitgeliefert, kein separater Node-Installer oder Clockodo-Protokollstarter nötig. Die EXE ist noch nicht digital signiert.

Fester Datenordner: %LOCALAPPDATA%/DAYRIVO/desktop. planner.json ist maßgeblich; die Speicherung erfolgt atomar über eine temporäre Datei mit Flush und Replace. planner.json.previous hält den vorigen Stand. Pro Tag wird der erste vorhandene Stand zusätzlich unter backups/ gesichert; Backup im Menü schreibt eine eigene JSON-Datei dorthin. Diese Dateien werden nicht automatisch gelöscht. Vor Import und Reset gibt es separate Sicherungen. Eine zweite App-Instanz greift nicht parallel auf denselben Datenordner zu.

Der Browserbestand wird nicht automatisch aus Chrome/Edge ausgelesen. Im bisherigen Browserplaner Backup anlegen. Beim ersten Desktop-Start **Browserplan importieren** anklicken, die JSON-Datei auswählen und die bestehende Wiederherstellungsübersicht bestätigen. Später geht dies über Settings → Backup wiederherstellen. Neue Desktop- und Browseränderungen synchronisieren sich nicht automatisch. Der ursprüngliche Datei-Einstieg bleibt erhalten. Vorhandene Rechnungsentwürfe bleiben im bisherigen separaten Ordner %LOCALAPPDATA%/DAYRIVO/billing.

## Clockodo und Sicherheit

Settings → Clockodo → Verbinden öffnet einen nativen, verdeckten Eingabedialog. E-Mail und Key werden über stdin an den mitgelieferten Node-Prozess übergeben, nicht als Prozessargument oder Browserinhalt. Keine dauerhafte Speicherung der Zugangsdaten. Pro Sitzung eigener freier Loopback-Port; bereits laufende Browser-Dienste werden weder übernommen noch beendet. Der Desktop-Host leitet nur explizit freigegebene Routen weiter und hält den echten Sitzungsschlüssel nativ. Im Browserteil liegt lediglich eine bedeutungslose Sitzungsmarkierung.

Bei Trennen/App-Ende endet der eigene Dienst; auch beim Verlust des Elternprozesses schließt dessen stdin und der Dienst beendet sich. Nur Clockodo-Lesezugriffe und lokale Entwurfsaktionen des bisherigen Piloten. Zeitschreiben und Rechnungs-PDFs sind damit nicht neu implementiert.

WebView2 erlaubt nur das lokale virtuelle Origin dayrivo.local und eingebettete Ressourcen. Externe Navigation läuft bei direktem Nutzerklick im Standardbrowser. Kein allgemeiner Dateizugriff über das Hostobjekt: nur drei feste Plan-Speicherplätze. Der lokale Datenordner ist nicht verschlüsselt und sollte in die persönliche Datensicherung aufgenommen werden. Es gibt noch keinen automatischen Updater.

## Reproduzierbarer Build

build.ps1 ausführen. Benötigt Windows-.NET-Compiler und .deps mit WebView2 SDK 1.0.2903.40 (Core/WinForms/Loader samt Lizenz) sowie Node 22.22.3 x64 samt NODE-LICENSE.txt. Die verwendeten Binärprüfsummen stehen in dependencies.json. Quellen werden aus ../../index.html und ../js, css, locales, assets, clockodo gelesen. .build und .deps sind Entwicklungsdateien, keine Nutzerdaten. Das Paket enthält keine lokalen Einstellungen, API-Keys, Backups oder Testdaten.

tests/start-qa.ps1 startet die gebaute EXE mit isoliertem Profil und künstlichen Clockodo-Antworten. PASS.txt und echte WebView2-/Dialogbilder belegen den jeweiligen Lauf. Echte Kontodaten werden in diesem Test nicht verwendet. Bestehende Browser-Modelltests bleiben maßgeblich für die Planungslogik.
