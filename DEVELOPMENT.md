# DAYRIVO · Weiterentwicklung

Stand: 21.09.2026. Diese Anleitung wurde gegen lokale Quellen und Build-Scripts
abgeglichen. Sie ist kein neuer Nachweis einer Installation auf einem fremden PC.
Produktpruefungen und visuelle Abnahme stehen in den unten verlinkten Belegen.

## 1. Einstieg

App-Hauptordner relativ zu dieser Datei: `.`. Git-Repository: dieser
Ordner. Quellen relativ zu dieser Datei: `tool`. Zuerst
[tool/AGENTS.md](<tool/AGENTS.md>) und [PROJECT_MAP.json](PROJECT_MAP.json) lesen. Bestehende
Pfade, Daten und uncommitted Aenderungen erhalten. **Alle folgenden Befehle
aus dem Quellordner `tool` ausfuehren**, nicht aus einem beliebigen cwd.

## 2. Voraussetzungen

Windows x64, .NET Framework 4.8, WebView2 Runtime. Entwicklung: Node >=22; Browsertests: npm ci installiert das per package-lock.json festgelegte Playwright 1.62.1. Desktop-Abhaengigkeiten sind in desktop/dependencies.json festgelegt: WebView2 1.0.2903.40 und Node 22.22.3 samt Lizenzen. Sie fehlen im reinen Git-Checkout und muessen passend zum Manifest unter desktop/.deps bereitgestellt werden; der Build prueft SHA256. Keine beliebige neuere node.exe einsetzen.

SDK-Ziel relativ zum App-Hauptordner: `tool/desktop/.deps`. Benoetigt werden
Core.dll, WinForms.dll (jeweils mit Praefix Microsoft.Web.WebView2),
WebView2Loader.dll und LICENSE.txt. Die genaue gemeinsame Wiederherstellung
steht in [DEPENDENCIES.md](<../jano-app-kit/DEPENDENCIES.md>).
SDK zum Kompilieren und installierte WebView2 Runtime zum Starten sind getrennt.

## 3. Bauen und starten

Fuer Kandidaten einen neuen Ausgabeordner verwenden; nicht ueber die laufende
oder ausgelieferte EXE bauen. Kein Build-Befehl hier startet einen Upload.

```powershell
$devOut = Join-Path ([IO.Path]::GetTempPath()) ("jano-dayrivo-" + [guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $devOut | Out-Null
$candidate = Join-Path $devOut 'candidate.exe'
& .\desktop\build.ps1 -OutputPath $candidate
```

Startweg des bestehenden Lieferstands: [DAYRIVO.exe](<DAYRIVO.exe>).
Den Kandidaten erst nach den passenden Tests uebernehmen. Paketorte und
Liefer-Scripts sind in PROJECT_MAP.json und der bisherigen README benannt.

## 4. Aufbau und gemeinsame Module

js/, css/ und locales/ bilden die gemeinsame Planeroberflaeche. desktop/Desktop.cs und NativeStore.cs stellen Fenster und persistente Desktop-Daten; clockodo/ ist die optionale Backend-Anbindung. Der Browser-Einstieg bleibt ../index.html.

Modulstand und Migrationsgrenzen: [tool/app-kit.plan.json](<tool/app-kit.plan.json>).
Second Brain bleibt die Referenz fuer die Abstimmung gemeinsamer Bausteine.
Eine Modulvorbereitung bedeutet keine aktive Uebernahme oder Designfreigabe.

## 5. Pruefen

```powershell
npm test
# Separat, nach npm ci und mit installiertem Edge:
npm run test:browser
```

desktop/tests/ und desktop/VERIFICATION.md beschreiben den isolierten Desktop-/Maustest; Browsertests allein sind kein EXE-Nachweis.

Erwartung: Die genannten Tests laufen ohne Fehler/mit Exitcode 0 durch.
Fehlende Laufzeiten, Browser oder Fixtures als fehlende Voraussetzung melden,
nicht als bestandenen Test. GUI-/Host-/Netztests bleiben gesonderte Schritte.
Testausgaben duerfen nur synthetische Inhalte enthalten. Nach einer UI-Aenderung
die tatsaechliche Kandidaten-App inklusive Fensterbedienung pruefen.

## 6. Daten und Konfiguration

%LOCALAPPDATA%/DAYRIVO/desktop: planner.json, vorheriger Stand und backups/. Rechnungsentwuerfe separat unter %LOCALAPPDATA%/DAYRIVO/billing. Browserdaten mit jsOfficeWeek_v1 bleiben getrennt; kein automatischer Abgleich. Nur synthetische Wochenplaene fuer Tests; keine realen Clockodo-Buchungen.

Echte Zugangsdaten nicht in .env-Beispiele, Logs, Screenshots oder Git aufnehmen.
Es gibt durch diese Dokumentationspflege keine neue globale .env-Konfiguration.
Bestehende Profile vor einer beauftragten Migration sichern; keine Migration
allein zum Einrichten des Entwicklungsplatzes ausfuehren.

## 7. Stand, offene Punkte und Zusammenarbeit

Desktop und Browser verwenden getrennte Speicher. Ein Rechnerwechsel braucht neben Quellen die manifestgerechten Build-Abhaengigkeiten. Allgemeine Neuinstallation ausserhalb des vorhandenen Arbeitsplatzes erneut pruefen.

Massgebliche bestehende Quellen (keine zweite Statuschronik):

- [tool/desktop/README.md](<tool/desktop/README.md>)
- [tool/desktop/VERIFICATION.md](<tool/desktop/VERIFICATION.md>)
- [tool/desktop/dependencies.json](<tool/desktop/dependencies.json>)
- [tool/package.json](<tool/package.json>)

Keine Projektlizenz am Repository-Einstieg gefunden. Diese Anleitung vergibt keine Nutzungsrechte; Lizenzentscheidung vor externer Weitergabe mit Jona klaeren. Bestehende Drittanbieterhinweise gelten weiterhin.

Arbeitsablauf fuer kleine Aenderungen, Nachweise und Uebergaben:
[CONTRIBUTING_APPS.md](<../jano-app-kit/CONTRIBUTING_APPS.md>).
Fuer neue Entwickler zuerst die risikoarmen Checks ausfuehren, dann eine kleine
Aenderung im eigenen Arbeitsstand. Abschluss mit geaenderten Dateien,
ausgefuehrten Tests, offen gebliebenen Pruefungen und genauem Kandidatenpfad.
