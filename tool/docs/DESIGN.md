# Design Direction

## Bestätigter Stand – 16.09.2026

### JANO Branding

- Original-Logo lokal unter `assets/jano-logo-2024.png` als historische Branding-Referenz.
- Exakt aus den opaken Logopixeln übernommene Akzentfarbe: **#3CFF91**. Primäraktionen mit dunkler Schrift, Fokusrahmen, Daueranzeige, aktive Navigation, Textauswahl und dezente Statusdetails verwenden diese Farbe.
- Logo im Desktop-Header geometrisch mittig, App-Titel links und Menü rechts an den Kalenderkanten. Auf kleinen Displays sitzt das Logo zentriert in einer eigenen Kopfzeile.
- Dunkle, kompakte Produktionsoberfläche; Tagesfarben bleiben separat editierbar und werden durch das Branding nicht überschrieben.

### Bedienung und Layout

- Links eine schmale Seitenleiste mit Woche / Monat / Auswertung, Wochenfortschritt, Plan-festhalten und Presets. Rechts die jeweilige Arbeitsansicht. Auf kleinen Displays werden die Ansichten zu horizontalen Reitern; ausführliche Kennzahlen stehen unter Auswertung.
- Monatsübersicht mit vier Bereichskarten: Arbeit, Sport, Privat, Pausen / Puffer. Monatssummen und abgehakte Planzeiten exakt als Stunden:Minuten; Karten filtern die Tagesfelder. Tageskacheln zeigen farblich getrennte Bereichssummen statt einzelner Titel, dazu Kalenderwochen und zurückgenommene Wochenenden. Bereichsfarben sind unabhängig von Wochentagsfarben; Arbeit folgt der Akzentfarbe. Auf schmalen Displays stehen Karten zweispaltig und Tageszeiten mit Farbpunkten ohne wiederholte Beschriftung. Direkter Sprung zur Woche; keine künstliche Vorbelegung unbekannter Wochen. Unbekannte Kategorien erhalten bei Bedarf eine zusätzliche Karte Sonstiges.
- Auswertung zeigt standardmäßig nur abgehakte Einträge: bei Arbeit die manuell erfasste Dauer, bei anderen Bereichen gekennzeichnete Planzeit. Honorar ausschließlich aus erfasster Arbeit; fehlende Zeiten separat nennen. Der Editor bietet „Erfasste Arbeitszeit“ als aufklappbares Feld H:MM und getrennte Plan-/Ist-Wertvorschau. Der Ausgangsplanvergleich bleibt separat aufklappbar; seine Prozentzahl heißt **Planerfüllung**.
- „Nächste Woche“ öffnet einen kompakten Dialog mit Preset-Dropdown, Datumsbereich und Zeitvorschau. Bestehende Wochen erhalten eine vorausgewählte Beibehalten-Option; Ersetzen braucht Bestätigung. Mobile Nutzung über das Menü.
- Quick-To-dos nutzen den rechten Teil des Tageskopfs mit maximal zwei Zeilen, direkten Häkchen sowie Plus und Anzahl offener Einträge. Unter 235 px verfügbarer Kopfbreite reduziert sich die Darstellung auf Anzahl/Plus. Headerhöhe und Zeitraster bleiben unverändert. Der linke Tagesbutton öffnet weiterhin Presets/Farbe/Subline; der separate Reminderdialog verwaltet datumsspezifische Erinnerungen. Keine Zeit- oder Geldwerte an Erinnerungen.

- Nahezu volle Fensterbreite ohne starres Breitenmaximum: 16 px Außenrand am Desktop, 10 px mobil. Gemeinsame bündige Kanten bleiben erhalten.
- Kompakter 62-px-Header, ruhige Flächen, zurückhaltende Rahmen, feinere Typografie und reduzierte Bedienelemente. Logo und JANO-Akzent bleiben unverändert.
- Kalender nutzt die restliche Fensterhöhe und skaliert das gemeinsame Zeitraster automatisch. Keine „Ganzer Tag“-/Zoom-Buttons. Grenzen von 48–84 Pixeln pro Stunde vermeiden Überdehnung und zu enge Reihen; kurze reguläre Einträge erhöhen bei Bedarf das Minimum. Blöcke unter 48 Pixeln Gesamthöhe zeigen Titel und Zeit einzeilig. Bei zu wenig Platz bleibt Scrollraum; beim Fensterwechsel bleibt die sichtbare Uhrzeit möglichst stabil.
- Kurze Einträge verwenden eine horizontale Titelzeile mit kleiner Uhrzeit; sekundäre Details erscheinen erst bei mehr Höhe. Uhrzeiten werden bei schmalen Desktopspalten zugunsten des Titels ausgeblendet, bleiben im Hovertext und Editor verfügbar.
- Layout geprüft bei 1920×1080, 1366×768, 2560×1440 und 390×844. Verschieben und Größenänderung rechnen mit dem aktuellen Maßstab; Zeitsprünge bleiben 15 Minuten.

- Produktname im Header: **JS OFFICE WEEK 1.0**. Header und Kalender teilen dieselben linken/rechten Außenkanten.
- Ausschließlich dunkle Oberfläche; Light/Dark und globale Farbauswahl entfernt.
- Fünf Tage mit gemeinsamem vertikalem Zeitraster und Stundenachse links, positionsgetreue Start- und Endzeiten.
- Tageskopf bearbeitet Farbe und Subline für diesen Wochentag. Tagesfarbe ist an Kopf und Blöcken sichtbar.
- Einträge direkt anklicken; kleiner Dialog mit Titel, Tag/Kategorie, Von/Bis, berechneter Dauer und Beschreibung.
- Kunde/Projekt/Leistung optional und eingeklappt, nur bei Kategorie Kunde. Keine Preise, Rechnungen, Gäste oder Meetingfunktionen aus den Referenzen übernehmen.
- Hover-Plus unter dem letzten Tagesblock; Unterkante ziehen zum Verlängern/Verkürzen.
- Eintrag ziehen zum Verschieben innerhalb eines Tages und zwischen den Tagen. Vorschau und Eintrag übernehmen die Farbe des Zieltags; kurzer Klick öffnet den Editor. 15-Minuten-Raster für Planung, Verschieben und Größenänderung.
- Von/Bis als kompakte, scrollbar bedienbare Viertelstundenlisten: gewählte Zeit mittig, sichtbarer Ausschnitt ±2 Stunden, maximal 376 px hoch. Tastaturbedienung und Escape unterstützt. Änderung von Von setzt Bis auf +1 Stunde (begrenzt auf das Tagesende 23:45). Vorhandene abweichende Zeiten sind als „bestehend“ markiert und bleiben beim Öffnen unverändert.
- Wochenpresets über eigenen Button in der Seitenleiste und im Menü. Separater Bearbeitungsmodus mit Preset-Namen, Hinweisbalken und Rückkehr zur Kalenderwoche; keine Datumsangaben an den Preset-Tagesköpfen. Die Verwaltung bietet eigene Vorlagen, Kopieren, Standardauswahl, Anwenden und Löschen.
- Das echte `•••`-Menü enthält Eintrag erstellen, Ordner verbinden und Backup wiederherstellen.
- Clockodo und Google Kalender sind Interaktionsreferenzen. Jonas Wunsch nach einer schlanken persönlichen Oberfläche hat Vorrang.

Die nachfolgenden Abschnitte dokumentieren die ursprüngliche Richtung; obige Entscheidungen ersetzen widersprechende ältere Details.

Referenz: vom Nutzer bereitgestellte Screenshots eines dunklen Game-Planner/Production-Tools.

## Charakter

- fast schwarzer Hintergrund
- kompakte Top-Navigation
- hohe Informationsdichte
- präzise dünne Borders
- dunkle Cards mit leichter Abstufung
- kleine Status-Pills
- Akzentfarbe sparsam
- eher Unreal/Developer/Game Tool als SaaS-Dashboard
- keine großen dekorativen KPI-Kacheln
- keine prominente Theme-Konfiguration

## Desktop

Primäransicht: fünf Tages-Spalten.

Oben:
- JONA WEEK
- Week / später Month / Invoices
- KW-Navigation
- Heute
- Clockodo-Status
- `•••` Einstellungen

## Mobile

Sekundär.
- Mo/Di/Mi/Do/Fr Tabs
- nur ein Tag gleichzeitig
- große Touch-Ziele

## Settings

Im Tageskopf steht die Auswahl **Tagespreset** über den bisherigen Einstellungen. Eine kompakte Liste zeigt Zeiten und Titel vor dem Anwenden; die eigene Vorlagenverwaltung bleibt eingeklappt. Anwenden erfolgt mit Speichern und bei bestehenden Einträgen nach Bestätigung. Neue Einträge übernehmen die Farbe des Zieltags.

**Looks** oben rechts bündelt Akzentfarbe, Wochentagsfarben und Rahmen. Standard: dezente gestrichelte Linie um die gesamte Oberfläche sowie Dialoge; alternativ durchgezogen oder ohne Rahmen. Nahezu volle Inhaltsbreite bleibt erhalten. Farbänderungen erscheinen als Live-Vorschau und werden erst mit Übernehmen gespeichert. Die Preset-Verwaltung ist aufklappbar: Anlegen, Aktualisieren/Umbenennen, Löschen, Einzel-/Sammelexport und Import. Die Bedienakzente folgen der gewählten Farbe; Text auf gefüllten Akzentflächen wechselt je nach Helligkeit zwischen Schwarz und Weiß.

Im `•••` Menü:
- Eintrag erstellen
- Backup-Ordner verbinden
- Backup wiederherstellen
- später Clockodo Settings

## Farben

Tagesfarben ordnen Einträge ihrem Wochentag zu. Die frei wählbare Akzentfarbe kennzeichnet Bedienung und Fortschritt; Farbpresets bündeln diese Gestaltung.
