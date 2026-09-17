# DAYRIVO auf GitHub

Stand: 17.09.2026. Lokales Repository: `JS_GitHub/DAYRIVO`. Verbundenes Ziel: `https://github.com/jano3dstudio/DAYRIVO.git`. Das Repository soll privat bleiben; GitHub Pages und eine Open-Source-Lizenz sind nicht aktiviert. Der Upload erfolgt erst mit Push; eine Remote-Adresse allein bedeutet noch keinen hochgeladenen Quellcode.

## Die drei Begriffe

- **Changes**: Dateien, die seit dem letzten gesicherten Stand geändert wurden.
- **Commit**: Speichert einen benannten Entwicklungsstand lokal auf deinem Rechner.
- **Push origin**: Lädt deine lokalen Commits zu GitHub hoch. **Fetch origin** prüft Änderungen auf GitHub, **Pull origin** übernimmt sie auf den Rechner.

## In GitHub Desktop

1. Repository **DAYRIVO**, Branch **main** auswählen.
2. Wenn Änderungen vorhanden sind: prüfen, eine kurze Summary schreiben und **Commit to main** drücken.
3. **Push origin** drücken. Wenn der Knopf noch nicht angeboten wird, zunächst **Fetch origin** verwenden.
4. Unter **Repository → View on GitHub** den Quellcode und das Kennzeichen **Private** prüfen. Für dieses Projekt keine öffentliche Veröffentlichung auswählen.

## Was gehört hinein?

Aktueller App-Code, Tests, Dokumentation und ausgewählte Landingpage-Medien. Die `.gitignore` schließt npm-Cache, node_modules, persönliche Backups, lokale Clockodo-Einstellungen, Schlüsseldateien und erzeugte Test-/Arbeitsdateien aus. Diese Dateien bleiben auf dem Rechner. Die `.gitattributes` setzt LF für Web-Dateien und CRLF für Windows-Starter. Persönliche Projektbezüge in Dokumenten und Vorlagen gehören vor einer späteren öffentlichen Freigabe separat geprüft.

GitHub sichert den **Quellcode**, nicht automatisch deine im Browser gespeicherten Wochen. Der bisherige Planer-Pfad bleibt erhalten. Vor einem Wechsel in die neue Kopie ein JSON-Backup im bisherigen Planer erstellen und gegebenenfalls dort importieren. Der Windows-Clockodo-Startlink zeigt weiterhin auf den bisherigen funktionierenden App-Ordner; erst bei einem tatsächlichen Umzug gezielt neu registrieren.

## Prüfungen

Aus `tool/`: `npm ci`, `npm test`, `npm run test:browser`, `npm run test:landing`. 38 Modell-/Integrationstests im neuen Ordner geprüft. Der übernommene Programmcode stimmt mit der zuvor in fünf Browser-Suites geprüften Fassung überein. Zugangsdaten-Musterscan und Dateiliste vor dem Commit geprüft; kein vollständiger Sicherheits-Audit. GitHub Actions verwendet Chromium und muss nach dem ersten Push gesondert überprüft werden.

Auf einem neuen Rechner benötigt nur die lokale Clockodo-Anbindung Windows und Node.js 22+. Anleitung: [Clockodo](CLOCKODO.md). Der Planer startet über die `index.html` im Root. [Projektübersicht](../README.md).
