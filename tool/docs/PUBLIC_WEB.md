# Öffentliche DAYRIVO-Web-Ausgabe

Freigabe durch Jona: 17.09.2026. Entwicklungs-Repository bleibt privat: https://github.com/jano3dstudio/DAYRIVO. Öffentliche Auslieferung separat: https://github.com/jano3dstudio/DAYRIVO-web.

## Erzeugen und prüfen

Aus `tool/`: `npm run build:web` erzeugt `dist/public/index.html`; `npm run test:web` prüft die gebaute Datei per HTTP im isolierten Browser. Die Web-Ausgabe enthält alle benötigten Skripte, Styles und das DAYRIVO-Logo in einer Datei. Kein node_modules, Backend, interner Dokumentationsordner, persönliches Backup oder lokale Clockodo-Einstellung wird veröffentlicht. Der Build entfernt die historische persönliche Basiswoche, alte projektspezifische Untertitel und Look-Namen aus der Auslieferung. Der ausdrücklich gewünschte Urheberhinweis mit öffentlichem LinkedIn-Link bleibt sichtbar.

## Veröffentlichung

Nur die erzeugte `dist/public/index.html` in das öffentliche Repository hochladen. Prüfberichte und Review-Dateien aus dem lokalen Ausgabeordner nicht mit hochladen. GitHub Pages dort mit Branch `main` und Ordner `/(root)` aktivieren. Veröffentlichung und echte URL anschließend kontrollieren. GitHub Pages im privaten Entwicklungs-Repository war im aktuellen Konto ohne Tarifupgrade nicht verfügbar.

Geplante URL, erst nach erfolgreichem Deployment als live behandeln: https://jano3dstudio.github.io/DAYRIVO-web/.

Stand: öffentliches Auslieferungs-Repository erstellt; Datei lokal gebaut und getestet. Chrome-Dateiupload meldet trotz durch Jona bestätigter Dateifreigabe weiterhin Not allowed; der GitHub-Connector lehnt Schreiben mit 403 Resource not accessible by integration ab. Manuelle Upload-Seite mit Commit-Beschreibung für Jona vorbereitet. Noch kein Upload, Pages-Deployment oder Live-Test bestätigt.

## Unterschiede zur lokalen Version

- Wochen und Einstellungen werden im Browser unter der jeweiligen Website-Adresse gespeichert. Kein Konto, keine Cloud-Synchronisierung und kein automatisches Übernehmen der lokalen Daten. JSON-Backup kann bewusst importiert werden.
- Clockodo ist in der Web-Ausgabe ein Hinweis auf die lokale Version. Keine API-Schlüssel, lokalen Startlinks oder Loopback-Aufrufe enthalten.
- Neue Nutzer wählen eine der allgemeinen Wochenvorlagen. Es werden keine gespeicherten Wochen des Entwicklers mitgeliefert.
- Öffentliche HTML-/JavaScript-Ausgabe ist für Besucher einsehbar. Das private Repository schützt interne Arbeitsdateien und Historie, nicht den ausgelieferten Browser-Code.

## Weitere Änderungen

Die Entwicklung bleibt im privaten Repository. Nach Änderungen neu bauen und testen, dann die öffentliche Auslieferungsdatei aktualisieren. Git-Commit, GitHub-Upload und Website-Deployment sind jeweils getrennt zu bestätigen. Keine Cross-Repository-Zugangsschlüssel für unbeaufsichtigte Veröffentlichung angelegt.
