# AGENTS.md — DAYRIVO

## Einstieg und Struktur

Der stabile Einstieg liegt eine Ebene höher: `../index.html`. Alle App-Dateien liegen hier unter `tool/`: JavaScript in `js/`, CSS in `css/`, Assets in `assets/`, Sprache in `locales/`, Dokumentation in `docs/`. Befehle aus diesem Verzeichnis ausführen: `npm test`, `npm run test:browser`, `npm run test:landing`. Aktueller UI-Stand: `docs/UI_REFINEMENTS.md`. Root-Dateipfad und Speicherkennung `jsOfficeWeek_v1` erhalten; Tests nur mit isolierten Browserprofilen.

## Auftrag

Entwickle DAYRIVO als schlanke persönliche Arbeitsoberfläche für Jona. Das Tool soll administrative Reibung reduzieren, nicht neue Pflegearbeit erzeugen.

## Nutzerkontext

Jona ist seit über 21 Jahren selbstständig, Familienvater von drei Kindern und arbeitet mit 3D, Video, Unreal Engine, AI und Kundenprojekten. THE GRAVITY COMPLEX ist sein langfristiges Game-Projekt.

Die Woche soll Rollen trennen und Kontextwechsel reduzieren.

## Leitprinzipien

- Simple > clever.
- Desktop-first; responsive/mobile brauchbar, aber nicht primäres Ziel.
- Lokale Nutzung ist zunächst ausreichend.
- Keine API-Secrets im Frontend oder in `localStorage`.
- Clockodo nicht nachbauen.
- Erst echte wiederkehrende Reibung automatisieren.
- Datenexport/Backup muss möglich bleiben.
- Keine Funktion hinzufügen, nur weil sie technisch möglich ist.
- Bestehende Basiswoche bewahren.
- UI soll wie ein hochwertiges Game-/Production-Tool wirken, nicht wie generisches SaaS.

## Kernfunktionen

- Kalenderwochen wechseln.
- Neue KW aus einer Basisvorlage erzeugen.
- Jede KW behält eigenen Zustand.
- Blöcke anlegen/editieren/löschen.
- Blöcke abhaken.
- Kategorien: Kunde, AI/Firma, Spiel, Familie, Sport, Pause, Routine, Schule, Admin, Puffer.
- Planzeit und Ist-Zeit getrennt.
- Bei Kunde: Kunde, Projekt, Leistung, Beschreibung.
- Wochen-/Monatsstatistik.
- JSON Backup/Restore.

## Clockodo

Später sichere lokale Backend-Schicht verwenden. Frontend darf keinen Clockodo-Key enthalten.

Ziel:
- Kunden/Projekte/Leistungen lesen.
- Ist-Zeit nach Freigabe als Zeiteintrag schreiben.
- Optional Start/Stop.
- Clockodo bleibt vorerst Source of Truth für Kundenzeiten.

## Nicht jetzt

- Clockodo ersetzen.
- vollständige Buchhaltung bauen.
- komplexe Multiuser-Architektur.
- Cloud-Infrastruktur ohne konkreten Bedarf.

## Gemeinsame Modulbauweise vorbereiten · 21.09.2026

Vor Arbeiten an gemeinsamen UI-Bausteinen `app-kit.plan.json` lesen und
`./Check-AppKit.ps1` ausfuehren. Der Plan verweist auf die zentrale Kit-Quelle;
Ablauf dort in `ADOPTION.md`. Second Brain bleibt die Referenz zur Abstimmung.
Diese Vorbereitung aktiviert keine neuen Module. Bestehende aktive `kit.ref.json`
und ansonsten bisherige Pins gelten bis zur gezielten Migration weiter.
Fenster, Buttons, Schriftgroessen, Rundungen, Looks, Dialoggriffe und Arbeitsanzeige
zentral weiterentwickeln; Produktlogik, Nutzerdaten und Host-Regeln erhalten.
Ein erfolgreicher Vorbereitungscheck ist keine Build-, UI- oder Designfreigabe.

## Ablage-Wegweiser · 21.09.2026

Siehe [../PROJECT_MAP.json](../PROJECT_MAP.json). Quell-, Build-, Start- und Datenpfade sind erhalten.
Der README-Einstieg im App-Hauptordner fuehrt zu allen aktuellen Arbeitsstellen.

## Entwickler-Einstieg · 21.09.2026

[../DEVELOPMENT.md](../DEVELOPMENT.md) beschreibt Voraussetzungen, konkrete Build-/Testbefehle,
Datenablage, Modulgrenzen und offene Punkte. Vor Weiterarbeit zuerst dort lesen;
vorhandene Produktregeln und fachliche Nachweise bleiben massgeblich.
