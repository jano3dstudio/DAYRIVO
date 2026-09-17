# AGENTS.md — DAYRIVO

## Einstieg und Struktur

Der stabile Einstieg liegt eine Ebene höher: `../index.html`. Alle App-Dateien liegen hier unter `tool/`: JavaScript in `js/`, CSS in `css/`, Assets in `assets/`, Sprache in `locales/`, Dokumentation in `docs/`. Befehle aus diesem Verzeichnis ausführen: `npm test`, `npm run test:browser`, `npm run test:landing`. Aktueller UI-Stand: `docs/UI_REFINEMENTS.md`. Root-Dateipfad und Speicherkennung `jsOfficeWeek_v1` erhalten; Tests nur mit isolierten Browserprofilen.

## Auftrag

Entwickle Jona Week als schlanke persönliche Arbeitsoberfläche für Jona. Das Tool soll administrative Reibung reduzieren, nicht neue Pflegearbeit erzeugen.

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
