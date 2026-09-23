<!-- distribution-entry-20260924 -->
# DAYRIVO

Wochenplanung, Aufgaben und lokale Clockodo-Anbindung.

[Website](https://tools.jano3dstudio.de/dayrivo/) · [Repository](https://github.com/jano3dstudio/DAYRIVO) · [Build und Download](DISTRIBUTION.md) · [Entwicklung](DEVELOPMENT.md)

Persoenliches Testprojekt / Prototyp von Jona Fynn Schlegelmilch. Idee, gestalterische Richtung und Optimierung von Jona; KI hat bei Umsetzung und Iterationen unterstuetzt. Kein zugesicherter produktiver Einsatz. Vor wichtigen Arbeiten eigene Sicherungen anlegen.

**Ablage:** Quellen und Anleitungen im Repository; ausfuehrbare Pakete als separate Release-Dateien. Repository bleibt privat. Oeffentliche Freigabe und Lizenzstatus: [PUBLICATION_REVIEW.md](PUBLICATION_REVIEW.md).
<!-- /distribution-entry-20260924 -->

# DAYRIVO · optional im Second-Brain-Reiter

Weiterhin eigenständig nutzbar. Neue optionale Anbindung: [WORKSPACE.md](tool/desktop/WORKSPACE.md).

<!-- workspace-navigation-20260921 -->
## Projekt-Einstieg · DAYRIVO

| Gesucht | Pfad |
| --- | --- |
| Orientierung fuer Agents | [PROJECT_MAP.json](<PROJECT_MAP.json>) |
| Quellcode | [tool](<tool/>) |
| Verbindliche Projektregeln | [tool/AGENTS.md](<tool/AGENTS.md>) |
| Build-Einstieg | [tool/desktop/build.ps1](<tool/desktop/build.ps1>) |
| Pruefstand / Anleitung | [tool/desktop/VERIFICATION.md](<tool/desktop/VERIFICATION.md>) |
| Git-Repository | `.` |
| App starten | `DAYRIVO.exe` (lokaler Start; siehe [Build und Download](DISTRIBUTION.md)) |
| Gemeinsame Module | [tool/app-kit.plan.json](<tool/app-kit.plan.json>) |
| Lokale Pakete / Builds | `tool/dist` |

Ordnung vom 21.09.2026: Bestehende Quell-, Build-, Start- und Datenpfade bleiben
erhalten. Paketordner behalten ihre bisherigen Namen, damit Scripts und alte
Aufgaben weiter passen. Fertige EXEs/Pakete sind lokale Lieferdateien, keine
neuen Git-Quellen. Bewusst gepinnte SDK-Dateien bleiben Build-Abhaengigkeiten.
Vor Git-Aktionen den angegebenen Repository-Ordner verwenden. Aeltere
Entwicklungskopien nicht ungeprueft ueber diesen Stand kopieren. Kein Upload
und keine neue Designfreigabe durch diese Ablagepflege.
<!-- /workspace-navigation-20260921 -->

## Entwickler-Einstieg · 21.09.2026

[DEVELOPMENT.md](DEVELOPMENT.md) beschreibt Voraussetzungen, konkrete Build-/Testbefehle,
Datenablage, Modulgrenzen und offene Punkte. Vor Weiterarbeit zuerst dort lesen;
vorhandene Produktregeln und fachliche Nachweise bleiben massgeblich.


## GitHub-Ablage

DAYRIVO – Wochenplanung, Aufgaben und lokale Clockodo-Anbindung.

Repository: `jano3dstudio/DAYRIVO` (privat). Quellen, Build-Anleitung und Projektregeln werden versioniert. Persönliche Laufzeitdaten, Zugangsdaten und lokale Sicherungen gehören nicht in Git. Bestehende lokale Start- und Quellpfade bleiben erhalten. Der Upload ist eine Quellcodesicherung; technische Prüfstände und persönliche Freigabe stehen separat in der Projektdokumentation.
