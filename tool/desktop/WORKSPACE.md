# DAYRIVO · optionaler Second-Brain-Reiter · 22.09.2026

DAYRIVO bleibt eine eigenständige Windows-App. Mitgeliefert wird zusätzlich
`DAYRIVO.exe.workspace.json`; beide Dateien im selben Ordner lassen.
In Second Brain 0.9.0 unter Toolbox diese EXE hinzufügen und im Reiter öffnen.
Ohne Second Brain einfach die EXE starten. Ohne JSON bleibt der separate Start möglich.

Planer, Backups und Einstellungen bleiben im bestehenden Desktop-Datenordner
`%LOCALAPPDATA%/DAYRIVO/desktop`. Standalone und eingebettet teilen denselben
Schreibschutz über eine benannte Mutex und öffnen den Bestand nicht gleichzeitig.
Zum Wechsel die bisherige Ansicht schließen. In Second Brain erledigt
„Eigenständig öffnen“ das Schließen der integrierten Ansicht vor dem Programmstart.
Browser-Daten werden nicht automatisch synchronisiert.

`AppModule.cs` implementiert `jano.workspace.v1` für die bestehende DesktopWindow.
Der Build erzeugt die Integrationsdatei mit dem SHA256 der EXE. Es wird kein
Second-Brain-Code in DAYRIVO eingebaut. Bei einem Update EXE und JSON zusammen
austauschen und beide Apps vorher schließen. Kein automatischer Updater.

Build: `tool/desktop/build.ps1 -OutputPath DAYRIVO.exe` im Projektstamm.
Tests und Einschränkungen: VERIFICATION.md. Persönliche UI-Abnahme bleibt offen.
