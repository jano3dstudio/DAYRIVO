# DAYRIVO 1.0

Lokaler Wochenplaner für Jona. Ziel: persönliche Wochenplanung und später direkte Clockodo-Zeiterfassung in einer Oberfläche.

## Aktueller Stand

Stand 17.09.2026: lokale Desktop-App mit dem stabilen Einstieg `index.html` im Root und den übrigen Dateien unter `tool/`. Kein Server, keine Installation und keine externen Abhängigkeiten für die Nutzung. Daten werden automatisch im Browser gespeichert.

DAYRIVO Branding: D-Signet vor dem links ausgerichteten Schriftzug (`tool/assets/dayform-mark.png`), Standardakzent `#3CFF91`. Tagesfarben bleiben unabhängig editierbar. Unten links führt der Autorenhinweis zum LinkedIn-Profil von Jona Fynn Schlegelmilch.

## Neu in DAYRIVO

Aktuelle Ergänzungen und die neue Ordnerstruktur: [UI-Pass](UI_REFINEMENTS.md).

- **Woche und Tag:** Der Kreis zeigt den gewählten Tag, darunter zeigt ein Balken die Woche aus festgehaltenen Tagesplänen. Ein Schloss kennzeichnet gespeicherte Tagespläne. Ein Klick darauf zeigt ursprüngliche und aktuelle Planung einschließlich hinzugefügter, entfernter und verschobener Einträge.
- **Titel verwalten:** über Settings oder direkt neben Titeltyp. Wenige Basics sind sichtbar, weitere Vorschläge lassen sich hinzufügen, umbenennen, ausblenden und zurückholen. Verknüpfte Einträge und eingefrorene Pläne gehen beim Ausblenden nicht verloren.
- **Zeitübersicht:** Familie, Privat/Alltag, Sport, Pausen und Arbeit statt jeder einzelnen Kategorie. Es sind ausdrücklich geplante Wochenstunden.
- **Tageszeitraum:** in Settings → Planung & Daten konfigurierbar, auch über den Link unten rechts erreichbar. Einträge außerhalb erweitern die Ansicht automatisch; 15-Minuten-Raster unverändert.
- Die Kopfmitte zeigt den zeitlich ersten offenen Eintrag des ausgewählten Tages. Ein Klick öffnet ihn. Auf schmalen Displays wird diese Zusatzinformation ausgeblendet.

- Neue Nutzer wählen Fokuswoche, Balance, Projekt-Endspurt, Urlaub oder eine leere Woche. Bestehende Wochen und persönliche Vorlagen bleiben erhalten.
- **Tag starten** hält morgens den Plan des gewählten Tages fest, bevor etwas abgehakt wird. Der Wochenbalken fasst nur gestartete Tage zusammen. Ursprüngliche Dauern bestimmen das Gewicht; verschobene Aufgaben werden nicht doppelt gezählt. Frühere Wochen-Ausgangspläne bleiben gespeichert.
- **Titeltyp** verbindet Standardtitel mit ihrer Kategorie. Änderungen gelten für verknüpfte Einträge und Vorlagen; Zeiten, Beschreibungen und festgehaltene Ausgangspläne bleiben eigenständig. **Eigener Titel** löst die Verbindung für einen Eintrag.
- **Settings → Planung & Daten** kann die aktuelle Woche oder alle Wochen leeren. Umfang wird angezeigt, Bestätigung mit RESET; vorherige Daten werden lokal zur Wiederherstellung gesichert. Presets, Looks und Stammdaten bleiben erhalten. Backup vor dem Zurücksetzen ist separat erreichbar.
- **Looks** enthält Rainbow, Neon Arcade, Electric Sunset, Glacier, Candy Pop und Acid Night. **Eigener Look** hält die eigene Mischung auch beim Durchprobieren anderer Presets fest; **Übernehmen** speichert diese zusätzlich zum aktiven Look. Benannte Presets werden weiterhin bewusst aktualisiert.
- Eintragsklick bearbeitet, Ziehen verschiebt, der große Haken unten rechts erledigt. Animationen respektieren die Systemeinstellung für reduzierte Bewegung.

## Bedienung

- Einträge zeigen links oben ein 32-Pixel-Linien-Icon und unten rechts einen großen Erledigt-Haken mit Einrast-Animation und radialem Konfetti am Klickpunkt der Checkbox; bei Tastaturbedienung aus deren Mitte. Icon und Text beginnen bei kurzen und langen Blöcken an denselben Positionen; auch „Ohne Icon“ behält dessen Platz. Die Zeit steht immer einzeilig über dem einzeiligen Titel. Ein Klick auf das Icon oder die Icon-Auswahl neben dem Titel im Editor öffnet 16 Symbole, „Automatisch“ nach Kategorie und „Ohne Icon“. Änderungen werden erst mit dem Eintrag gespeichert. Die Auswahl bleibt beim Verschieben, in Wochen-/Tagespresets und im Backup erhalten.

- In **Nächste Woche** zeigt die Vorschau **Leben** oberhalb von **Arbeit**, jeweils mit Bereichssumme und einzelnen Kategoriezeiten. Alle Planzeiten des ausgewählten Presets bzw. der beibehaltenen Woche zählen, unabhängig vom Erledigt-Status. Die Zuordnung folgt den Stammdaten: Arbeit steht separat, die übrigen Kategorien unter Leben.

- **Menü → Stammdaten** verwaltet Kategorien, Kunden, Projekte und Leistungen. Im Eintragseditor führt **Verwalten** neben Kategorie direkt dorthin. Kategorien bekommen einen Auswertungsbereich; Kunden-/Projekt-/Leistungsvorschläge stehen unter Kundendetails bereit. Archivieren bewahrt bestehende Zuordnungen. Details und Vorbereitung der späteren Clockodo-Anbindung: [Stammdaten](MASTER_DATA.md).

- Oben rechts wählt **Deutsch / English** die Oberflächensprache. Die Einstellung bleibt nach Neuladen erhalten und wird im Gesamtbackup mitgeführt. Wochentage, Kategorien, Dialoge, Hinweise und Datums-/Zahlenformate wechseln mit. Eigene Einträge, Beschreibungen, Tagesuntertitel und Preset-Namen werden nicht übersetzt.

- Links wechseln **Woche**, **Monat** und **Auswertung** zwischen den Ansichten. Wochenpresets und Wochenfortschritt liegen ebenfalls in der Seitenleiste; auf dem Handy stehen die drei Ansichten als kompakte Reiter oben und Presets weiterhin im Settings-Menü bereit.
- Die Oberfläche nutzt nahezu die gesamte Fensterbreite, auch auf Ultrawide-Monitoren. Header und Kalender bleiben bündig.
- Der Kalender passt den Zeitmaßstab automatisch an Fensterhöhe und geplanten Zeitraum an – ohne Zoom-Buttons. Alle fünf Tage nutzen denselben Maßstab, mobil der ausgewählte Tag. Reguläre Blöcke ab 15 Minuten bekommen mindestens 40 Pixel Rasterhöhe für das große Icon und zwei Textzeilen. Der kürzeste Block bestimmt die nötige Mindestdichte (bis 160 Pixel pro Stunde bei Viertelstundenterminen); darüber wächst die Ansicht nur soweit die Fensterhöhe es verlangt, höchstens auf 84 Pixel pro Stunde. Lange Tage dürfen scrollen. Änderungen der Fenstergröße verändern keine Planungsdaten; alte manuelle Zoomwerte werden ignoriert.
- Auch kurze Blöcke zeigen die Uhrzeit über dem Titel. Bei schmalen Spalten wird Text einzeilig mit Auslassungspunkten gekürzt. Vollständige Zeit, Dauer und Beschreibung sind per Hover und im Editor erreichbar.
- `index.html` im bisherigen Desktop-Browser öffnen bzw. die vorhandene Seite neu laden. Für Datei-Backups Microsoft Edge oder Google Chrome verwenden.
- Eintrag anklicken: Titel, Tag, Kategorie, Von/Bis und Beschreibung bearbeiten. Die Dauer wird berechnet. Kundendetails (Kunde, Projekt, Leistung) sind optional aufklappbar; noch keine Clockodo-Verbindung.
- Tageskopf anklicken: Farbe und Subline ändern. Diese Einstellungen gelten für den Wochentag in allen Wochen.
- Alle Tage nutzen denselben Zeitmaßstab. Überlappende Einträge stehen nebeneinander.
- Unter dem letzten Block jeder Spalte erscheint beim Darüberfahren ein Plus. Alternativ eine freie Stelle im Zeitraster doppelklicken oder im Settings-Menü „Eintrag erstellen“ wählen.
- Eintrag gedrückt halten und ziehen: innerhalb eines Tages oder in eine andere Tagesspalte verschieben. Die Vorschau und der abgelegte Eintrag übernehmen die Farbe des Zieltags. Dauer, Kategorie, Kundendetails und Erledigt-Status bleiben erhalten. Ein kurzer Klick öffnet weiterhin den Editor.
- Während des Ziehens zeigt eine kleine Anzeige neben dem Mauszeiger die neue Startzeit und die Verschiebung in Minuten gegenüber der ursprünglichen Startzeit, z. B. **10:15 | +45 Min.** Beim Wechsel der Spalte steht zusätzlich der Zieltag dabei; der Minutenwert beschreibt weiterhin die Uhrzeitverschiebung. Die Anzeige folgt dem Viertelstundenraster einschließlich automatischem Scrollen, bleibt innerhalb des Fensters und verschwindet beim Ablegen, Abbrechen oder außerhalb des gültigen Zielbereichs.
- Von/Bis öffnen eine kompakte Viertelstundenliste mit der gewählten Zeit mittig und einem sichtbaren Fenster von ±2 Stunden. Weitere Zeiten sind durch Scrollen erreichbar, außerdem per Pfeiltasten, Bild auf/ab und Pos1/Ende. Enter übernimmt, Escape bricht die Auswahl ab.
- Eine geänderte Von-Zeit setzt Bis automatisch auf eine Stunde später. Bis bleibt anschließend frei anpassbar. Kurz vor Tagesende wird auf 23:45 begrenzt; reguläre Startzeiten reichen bis 23:30. Vorhandene Sonderzeiten (z. B. 08:20) bleiben beim Öffnen unverändert und sind als „bestehend“ auswählbar. Vertikales Ziehen rastet die Startzeit auf das 15-Minuten-Raster ein und behält die Dauer bei; rein horizontales Verschieben verändert keine Zeiten.
- Oberkante eines Blocks am eingeblendeten Pfeil ziehen: Startzeit ändern, Endzeit bleibt stehen. Unterkante ziehen: Endzeit ändern. Beide Griffe rasten in 15-Minuten-Schritten ein und unterstützen fokussiert Pfeil hoch/runter. Escape bricht die Größenänderung ab. Die manuell erfasste Arbeitszeit bleibt unverändert. Loslassen außerhalb des Kalenders bricht das Verschieben ab.
- Der heutige Tag ist in seiner Kalenderwoche mit einem dünnen Akzentrahmen am Zeitraster und einem Akzentpunkt am Namen markiert. Jeder Tageskopf einschließlich Quick-To-dos hat einen eigenen 4-Pixel-Rahmen in Tagesfarbe, bündig mit der vollen Eintragsbreite. Am unteren sichtbaren Kalenderrand bleibt ein gleich breiter Farbstreifen fest stehen. Einträge blenden beim Scrollen oben und unten weich aus. In anderen Wochen und beim Bearbeiten von Presets gibt es keine Heute-Markierung.
- **Nächste Woche** öffnet zunächst eine Dropdown-Auswahl der Wochenpresets mit Datum, Anzahl und Zeitvorschau. Erst **Woche öffnen** legt die Woche aus der gewählten Vorlage an; Abbrechen ändert nichts. Existiert sie bereits, ist **Bestehende Woche beibehalten** vorausgewählt. Ein anderes Preset ersetzt vorhandene Einträge und den Ausgangsplan nur nach Bestätigung. Auf kleinen Displays ist die Aktion im Settings-Menü erreichbar. Vor/Zurück und Heute blättern weiterhin direkt; dabei neu angelegte Wochen verwenden das Standardpreset. Neue Einträge aus Vorlagen beginnen ohne Erledigt-Häkchen.

## Looks und Farbpresets

Oben rechts öffnet **Looks** die Gestaltung. Akzentfarbe, fünf Tagesfarben und der Rahmen (gestrichelt, durchgezogen oder aus) werden sofort als Vorschau sichtbar. Standard ist ein dezenter gestrichelter Rahmen um die Oberfläche und die Dialoge. **Übernehmen** speichert; Abbrechen, × oder Escape verwirft sämtliche Änderungen dieses Dialogs.

Das Studio-Fenster zeigt die Palette als kleine Wochenvorschau und große anklickbare Farbfelder. Der dunkle Farbeditor bietet eine Sättigungs-/Helligkeitsfläche, Farbtonregler, Bisher/Neu, validierte HEX-Eingabe und Kopieren/Einfügen. Die Farbfläche lässt sich auch mit den Pfeiltasten bedienen; Umschalt vergrößert die Schritte. Bis zu 16 gemerkte Farben stehen allen Look-Farbfeldern zur Verfügung. **Farbe übernehmen** übernimmt nur in den Entwurf; erst **Übernehmen** im Looks-Fenster speichert Look und Palette dauerhaft, auch im Gesamtbackup. Abbrechen auf jeder Ebene verwirft deren Änderungen. **Standard** setzt die Look-Werte im Entwurf zurück und behält gemerkte Farben sowie eigene Presets.

Die Kopfleiste folgt der Reihenfolge **Nächste Woche → Settings → Looks → Backup → Sprache → Speicherstatus**. Auf schmalen Displays bleiben Nächste Woche in den Optionen und der Speicherstatus wie bisher ausgeblendet.

Unter **Presets verwalten** lassen sich benannte Farbkombinationen neu anlegen, mit **Aktualisieren** ändern oder umbenennen und löschen. Änderungen an der Preset-Liste werden ebenfalls mit **Übernehmen** gespeichert. Farben aus dem Tageskopf und aus Looks verwenden dieselben Tageseinstellungen; Tagesuntertitel und Wocheninhalte bleiben davon unabhängig. Ein gespeichertes Farbpreset wird nur durch **Aktualisieren** geändert.

**Preset exportieren** schreibt den gerade angezeigten Look; **Alle exportieren** schreibt die gesamte Preset-Liste. Exportdateien landen ohne Download unter `looks/` im verbundenen Projektordner. Beim ersten Mal den Projektordner auswählen (Edge/Chrome). **Importieren** liest diese JSON-Dateien, ergänzt Presets mit neuen IDs und nummeriert gleiche Namen; vorhandene Presets werden nicht überschrieben. Die Looks-Dateien enthalten ausschließlich Gestaltung, keine Kalenderdaten. Vollständige Backups enthalten zusätzlich den aktiven Look und alle Farbpresets.

## Wochenpresets

Der Button **Wochenpresets** links in der Seitenleiste (auch im Settings-Menü) öffnet die Vorlagenverwaltung. Die bisherige Basiswoche wird automatisch als **Standardwoche** übernommen. Bereits geplante Kalenderwochen bleiben dabei unverändert.

- **Anlegen:** Name vergeben, z. B. Urlaub. Leere Woche, aktuelle Kalenderwoche oder gewähltes Preset als Ausgangspunkt wählen.
- **Bearbeiten:** Das Preset öffnet sich separat im bekannten Zeitraster. Einträge anlegen, ändern, verschieben oder löschen; Änderungen werden nur in der Vorlage gespeichert. Der Hinweisbalken und „/ Preset“ kennzeichnen diesen Modus. „Zur Kalenderwoche“ kehrt zum Plan zurück. Tagesfarben und Subline bleiben globale Einstellungen.
- **Standard:** „Für neue Kalenderwochen verwenden“ bestimmt die Vorlage für neu angelegte Wochen. Bereits besuchte Wochen ändern sich nicht.
- **Anwenden:** Kopiert das gewählte Preset auf die aktuell ausgewählte Kalenderwoche. Sind dort Einträge vorhanden, wird das Ersetzen bestätigt. Die Kopie erhält neue IDs, leere Arbeitsnotizen und keine Erledigt-Häkchen. Spätere Änderungen an Woche und Preset sind unabhängig.
- **Löschen:** Entfernt nur das Preset; bereits geplante Wochen bleiben erhalten. Mindestens eine Vorlage bleibt bestehen. Wird das Standardpreset gelöscht, wird eine verbleibende Vorlage zum Standard.

Sämtliche Presets und die Standardauswahl sind in Backups enthalten. Ältere Backups ohne Presets werden beim Einlesen um die vorhandene Basisvorlage ergänzt.

## Tagespresets

Ein Klick auf den **Tageskopf** öffnet neben Farbe und Subline die Auswahl **Tagespreset**. Zunächst stehen die fünf Tage des Standard-Wochenpresets als unabhängige Vorlagen bereit. Auswahl zeigt Einträge und Planstunden; **Speichern** übernimmt die Vorlage nur auf diesen Tag der geöffneten Woche. Vorhandene Einträge werden nach Bestätigung ersetzt. Abbrechen oder „Einträge beibehalten“ verändert die Tagesplanung nicht.

Unter **Eigene Tagespresets** lässt sich der aktuelle Tag benennen und sofort als Vorlage speichern, beispielsweise „Kundentag“, „Fokus-Tag“ oder ein leerer „Freier Tag“. Das Speichern einer Vorlage verändert den ursprünglichen Tag nicht. Die gespeicherten Vorlagen stehen in jedem Tageskopf bereit und lassen sich dort löschen; angelegte Kalendertage bleiben erhalten.

Die übernommenen Einträge erhalten neue IDs, übernehmen die Farbe des Zieltags und starten ohne Erledigt-Häkchen oder alte Arbeitsnotizen. Uhrzeiten, Titel, Beschreibung und Kundendetails werden kopiert. Tagesfarbe und Subline bleiben unabhängig von der Vorlage. Auch beim Bearbeiten eines Wochenpresets lassen sich einzelne Tage aus Tagespresets zusammensetzen; Kalenderwochen bleiben dabei unverändert.

Tagespresets sind in vollständigen Backups enthalten. Ein bereits festgehaltener Ausgangsplan bleibt beim Austausch eines Tages unverändert: Ersetzte Ausgangseinträge gelten als entfernt, neue Einträge als zusätzlich. Deshalb den Tagesplan möglichst vor dem morgendlichen Festhalten zusammenstellen.

## Quick-To-dos im Tageskopf

Rechts neben Tag und Subline stehen kompakte Erinnerungen ohne Zeitblock. **＋** öffnet die Eingabe; Enter fügt eine Erinnerung hinzu. Bis zu zwei Zeilen werden direkt im Tageskopf gezeigt und lassen sich dort abhaken. Die Zahl daneben zählt offene To-dos und öffnet die vollständige Liste. In der Liste einen Text anklicken, um ihn zu bearbeiten; **×** löscht ihn. Erledigte Zeilen bleiben durchgestrichen, offene werden beim Öffnen/Neuzeichnen zuerst einsortiert. Während des Abhakens bleibt die angeklickte Zeile stabil.

Auf schmalen Spalten werden nur Anzahl und Plus eingeblendet. Die Höhe des Tageskopfs und die Zeitskala bleiben gleich. Erinnerungen gehören zur konkreten Kalenderwoche und zum Tag, werden lokal und im JSON-Backup gespeichert, zählen nicht zu Planerfüllung/Zeiten/Honoraren und werden nicht in neue Wochen oder Presets kopiert. Das Anwenden eines Wochen- oder Tagespresets lässt vorhandene Erinnerungen bestehen. Im Preset-Editor sind die Tageserinnerungen ausgeblendet.

## Ausgangsplan und Auswertung

1. Morgens den Tag planen und **Tag starten → Tagesplan festhalten** wählen (links oder in Auswertung). Pro Tag ist ein Ausgangsplan möglich; bereits erledigte Aufgaben verhindern einen nachträglichen Tagesstart. Die Woche fasst die festgehaltenen Tage zusammen.
2. Im Lauf der Woche erledigte Einträge abhaken. Verschieben, Kürzen und Löschen verändern den gespeicherten Ausgangsplan nicht.
3. **Auswertung** zeigt ausschließlich abgehakte Einträge: bei Arbeit die manuell erfasste Dauer, bei Sport/Privat/Pausen weiterhin die ausdrücklich als Planzeit markierte Dauer. Das Honorar verwendet nur erfasste Arbeitszeit. Unter **Vergleich mit dem Ausgangsplan** lässt sich der frühere Planvergleich separat aufklappen.

**Planerfüllung:** ursprüngliche Plandauer erledigter Ausgangsplan-Einträge geteilt durch die gesamte ursprüngliche Plandauer. Beispiel: 2 Stunden aus einem ursprünglichen 3-Stunden-Plan sind abgehakt → 67 %. Wird der erledigte Eintrag später auf 30 Minuten verkürzt, bleibt sein ursprüngliches Gewicht erhalten. Gelöschte Plan-Einträge bleiben im Wochenziel; nachträglich hinzugefügte Aufgaben werden separat ausgewiesen. Ein Plan mit 0 Stunden erhält keine Prozentquote.

Der **Ausgangsplanvergleich** verwendet Häkchen und ursprüngliche Planstunden. Er ist unabhängig von der manuell erfassten Arbeitszeit. Bei alten Wochen wird kein damaliger Wochenanfang erfunden: Der Vergleich beginnt erst mit dem bewusst festgehaltenen Stand samt Zeitpunkt. Pro Tag wird ein Ausgangsplan einmal gespeichert. Ältere Wochen-Ausgangspläne bleiben als Rückfall erhalten, solange keine Tagespläne vorliegen. Ein bewusstes Anwenden eines anderen Presets ersetzt nach Bestätigung auch diesen Ausgangsplan; danach kann ein neuer Plan festgehalten werden. Ausgangsplan und Preset-Referenz sind Teil jedes Backups.

## Monatsansicht

Der Monatskalender trennt Planzeiten in **Arbeit**, **Sport**, **Privat** und **Pausen / Puffer**. Jeder Bereich hat eine eigene Monatssumme und separat ausgewiesene abgehakte Planzeit; Angaben stehen exakt in Stunden und Minuten. Ein Klick auf eine Bereichskarte filtert die Tagesfelder, erneutes Anklicken oder **Alle Bereiche** hebt den Filter auf. Die Tagesfelder zeigen dieselbe farbliche Aufteilung. Kalenderwochen und dezente Wochenenden helfen bei der Orientierung.

Zuordnung: Arbeit = Kunde, AI / Firma, Spiel (eigenes Game-Projekt), Admin; Sport = Sport; Privat = Familie, Schule, Routine; Pausen / Puffer = Pause, Puffer. Unbekannte importierte Kategorien erscheinen unter **Sonstiges**. Die Zuordnung ist unter dem Kalender einsehbar; bestehende Einträge werden dadurch nicht verändert.

Ein Klick auf einen Werktag öffnet seine Woche. Reines Blättern und Filtern legt keine Wochen an und schreibt keine Planungsdaten. Ungeplante Wochen bleiben als solche sichtbar. Die Monatssummen rechnen nach tatsächlichen Kalendertagen, auch wenn eine Kalenderwoche zwei Monate berührt. Wochenenden werden derzeit nur als Orientierung angezeigt, da der Planer fünf Arbeitstage verwaltet. Abgehakte Zeiten sind erledigte Planzeiten, keine gemessenen Arbeitsstunden.

## Stundensätze und Honorarübersicht

Bei einem Job **Erfasste Arbeitszeit** öffnen und die tatsächliche Dauer als Stunden:Minuten eingeben, beispielsweise **1:07**. Die Erfassung ist minutengenau, unabhängig vom 15-Minuten-Planungsraster. Leer bedeutet noch nicht erfasst; **0:00** ist ein ausdrücklicher Nullwert. Zulässig sind bis zu **24:00** je Tagesjob. Die Auswertung berücksichtigt weiterhin nur abgehakte Jobs. Bestehende Einträge erhalten keine geschätzte Ist-Zeit.

Bei Arbeitseinträgen (Kunde, AI / Firma, Spiel, Admin) lässt sich unter **Honorar** optional ein Stundensatz in €/h eintragen. Komma und Punkt als Dezimaltrennzeichen funktionieren; der Editor zeigt direkt den Wert für die gewählte Dauer. Leer bedeutet unbewertet, ein ausdrücklicher Satz von 0 bedeutet unbezahlt. Sport, Privat und Pausen zählen nicht in die Honorarübersicht.

Die Honorarübersicht in **Monat** und **Auswertung** zeigt das Honorar aus **erfasster Arbeitszeit × Stundensatz**, die gesamte erfasste Arbeit sowie den davon mit Stundensatz bewerteten Anteil. Jeder Job wird auf Cent gerundet. Fehlende Arbeitszeiten und fehlende Stundensätze werden separat genannt; Planzeiten werden niemals ersatzweise angerechnet. Ein Häkchen entfernen nimmt den Job aus der Auswertung. Die Monatssumme folgt dem Datum des Jobs, unabhängig vom Kalender-Bereichsfilter. Die Wochenauswertung funktioniert auch ohne festgehaltenen Ausgangsplan. Rechnungsstatus, Zahlungen und Steuern sind nicht enthalten. Im Editor stehen geplante und erfasste Wertvorschau getrennt.

Stundensätze und erfasste Minuten werden pro Eintrag im JSON-Backup gespeichert. Wochen-/Tagespresets übernehmen Stundensätze, aber keine erfassten Minuten. Verlängern oder Kürzen eines Planblocks verändert nur die Planvorschau, nicht die erfasste Dauer oder deren Honorar.

## Backup und Datenübernahme

Der Backup-Button schreibt eine datierte JSON-Datei direkt in den Unterordner `backup` des verbundenen Projektordners. Es gibt keinen Download. Beim ersten Backup den Ordner `JS_Office_Week` auswählen und Schreibzugriff im Browser erlauben. Die Verbindung wird, soweit vom Browser erlaubt, gespeichert; nach einem Browserneustart kann eine erneute Freigabe nötig sein. Über `••• → Backup-Ordner verbinden` lässt sich der Ordner erneut wählen.

`••• → Backup wiederherstellen` prüft die Datei und zeigt vor dem Ersetzen die Zahl der enthaltenen Wochen/Einträge. Der bisherige Stand wird unter `jsOfficeWeek_v1_beforeRestore` im Browser gesichert. Backups enthalten sämtliche Wochen, die Basisvorlage und Tagesfarben/Subline. Sowohl neue Backups als auch das frühere V3-Format werden unterstützt.

Bestehende V3-Daten und Archive werden beim ersten Start im **gleichen Browser und am bisherigen Dateipfad** übernommen. Die alten Schlüssel `jonaWeek_v3` und `jonaWeek_archive_v3` bleiben unverändert; der neue Speicher heißt `jsOfficeWeek_v1`. Die Übernahme ist einmalig. Ein anderer Browser oder Dateipfad kann einen getrennten Datenbestand haben. Falls beschädigte Daten gefunden werden, erfolgt kein automatisches Überschreiben.

Die vorherige HTML-Version liegt unter `archive/jona-week-before-office-1.0.html`.

Geplante Basiswoche:

| Tag | Fokus | Arbeitsfenster |
|---|---|---|
| Montag | Kundenprojekte | 09:15–19:00 |
| Dienstag | AI-Workflows / Firma | 09:15–14:30 |
| Mittwoch | Kundenprojekte | 09:15–17:00 |
| Donnerstag | THE GRAVITY COMPLEX | 09:15–14:30 |
| Freitag | Spiel oder Kunde, flexibel | 09:15–ca. 14:30 |

Täglich:
- 07:30–08:20 Kinder zur Schule
- 08:20–08:50 Fahrrad/Rolle
- 08:50–09:15 Dusche/Kaffee
- 12:00–12:30 Essen + Spaziergang

Dienstag/Donnerstag: 14:30 Kinder holen.
Freitag: Kinderabholung 14:30 noch nicht endgültig.
Montag: Kinder werden von den Großeltern abgeholt; langer Arbeitstag möglich.

## Produktidee

Jona Week soll nicht zu einem zweiten Clockodo werden.

Die App ist die persönliche Oberfläche:
1. Woche planen
2. private, Sport-, Familien-, Game-, AI- und Kundenblöcke sehen
3. tatsächliche Arbeit ergänzen
4. Plan-/Ist-Zeit vergleichen
5. Kundenzeiten an Clockodo übertragen

Clockodo bleibt zunächst Backend für:
- Kunden
- Projekte
- Leistungen
- Zeiteinträge
- historische Daten

Später denkbar:
- Monatsansicht
- Umsatzübersicht
- Rechnungsentwurf
- PDF-/E-Rechnung
- Pauschalen/Auslagen
- Obsidian/Codex-Anbindung

## Start

`index.html` lokal in einem normalen Desktop-Browser öffnen.

Hinweis: Der ChatGPT-Dateiviewer auf iPhone führt das JavaScript lokaler HTML-Dateien offenbar nicht zuverlässig aus. Das ist kein Ziel-Deployment.

## Dateien

- `index.html` – Oberfläche und kompakte Bearbeitungsdialoge
- `styles.css` – dunkle Desktop-Ansicht und mobile Tagesansicht
- `planner.js` – Wochenmodell, Migration, Zeitrechnung und Überlappungen
- `app.js` – Bedienung, Speicherung und Ordner-Backups
- `overview.js` – Seitenleiste, Monatsansicht und Wochenauswertung
- `finance.js` / `finance.css` – optionale Stundensätze, Wertvorschau und Honorarübersicht
- `next-week.js` – Preset-Auswahl vor dem Anlegen/Öffnen der nächsten Woche
- `reminders.js` / `reminders.css` – datumsspezifische Quick-To-dos im Tageskopf
- `language-picker.js` / `language-picker.css` – zentriertes, abgerundetes Sprachmenü mit Häkchen und Tastaturbedienung
- `month.css` – Bereichskarten und responsive Monatsübersicht
- `looks.js`, `looks.css` – Gestaltung, Live-Vorschau und Farbpreset-Verwaltung
- `day-presets.js` – Tagesvorlagen auswählen, vorab ansehen, speichern und anwenden
- `i18n.js`, `locales/en.js` – Sprachumschaltung und zentraler englischer Textkatalog; Erweiterung in `docs/I18N.md`
- `time-picker.js` – kompakte, zentrierte Zeitauswahl mit Tastaturbedienung
- `AGENTS.md` – Kontext und Regeln für Codex
- `docs/PRODUCT.md` – Produktdefinition
- `docs/ROADMAP.md` – nächste Schritte
- `docs/CLOCKODO.md` – geplante Clockodo-Integration
- `docs/DESIGN.md` – Designrichtung
- `docs/DATA_MODEL.md` – vorgeschlagenes Datenmodell
- `docs/WORKFLOW.md` – gewünschter Nutzerablauf

## Prüfung und nächste Schritte

`node tests/i18n.test.cjs` prüft Sprachwechsel DE/EN samt Reload, Erhalt eigener Texte und interner Tages-/Kategorie-Werte, Dialoge, Presets, Bestätigungen, Modellfehler, Monat/Auswertung/Looks und mobile Darstellung.

`node --test tests/planner.test.cjs` prüft Datumsgrenzen, Migration, unabhängige Wochen, Überlappungen, Größenänderung und Backup-Validierung.

`node tests/browser.test.cjs` benötigt Playwright und Microsoft Edge (optional Paketpfad über `PLAYWRIGHT_MODULE`). Der Test verwendet ein isoliertes Browserprofil und prüft Bearbeitung, Reload, Navigation, Tagesgestaltung, Ziehen/Abbrechen, Menü, Restore und mobile Ansicht. Die Verzeichnis-API ist im Backup-Test simuliert; der native Windows-Ordnerdialog und dessen Berechtigungsabfrage müssen im normalen Browser geprüft werden.

`node tests/overview.test.cjs` prüft das Festhalten des Ausgangsplans, die Live-Quote, Änderungen/Löschungen, Neuladen, Monatsnavigation ohne Schreibzugriffe sowie responsive Ansichten. Die Modelltests prüfen zusätzlich unveränderliche Gewichtung, getrennte Zusatzaufgaben, leere Pläne, Backup-Roundtrip und Monatsgrenzen inklusive Schaltjahr.

`node tests/month-groups.test.cjs` prüft getrennte Monatssummen, tägliche Bereichszeiten, Filter ohne Schreibzugriffe, DE/EN, Tagesnavigation sowie Desktop-, Laptop- und Mobilansicht. Die Modelltests prüfen die vollständige Zuordnung aller Minuten einschließlich unbekannter Kategorien und Monatsgrenzen.

`node tests/finance.test.cjs` prüft Eingabe/Validierung und Entfernen von Stundensätzen, Wertvorschau, Reload, Monatssummen, Abhaken, fehlende Sätze, Wochenansicht mit/ohne Ausgangsplan, DE/EN und mobile Darstellung. Modelltests prüfen Cent-Rundung, Monatsgrenzen, persönliche Kategorien, Backup und Preset-Übernahme.

`node tests/next-week.test.cjs` prüft Auswahl und Abbrechen ohne Schreibzugriff, Vorlage mit frischen IDs, unverändertes Standardpreset, Erhalt vorhandener Wochen, bestätigtes Ersetzen, leere Erledigt-Auswertung sowie mobile Auswahl und Englisch.

`node tests/reminders.test.cjs` prüft Anlegen, Ändern, Abhaken und Löschen, Kopfvorschau, getrennte Wochen, Reload, Desktop/Laptop/Mobil, Englisch, Text-Escaping und Rücknahme fehlgeschlagener Speicherungen. Modelltests prüfen Backup, ungültige Reminder und Erhalt bei Preset-Anwendung ohne Einfluss auf Kennzahlen.

`node tests/auto-layout.test.cjs` prüft automatische Skalierungsgrenzen, lesbare Kurzblöcke, synchrones Zeitraster, Scrollposition, ignorierte alte Zoomwerte und Anpassung ohne Schreibzugriffe bei verschiedenen Fenstergrößen.

`node tests/actual-time.test.cjs` prüft minutengenaue Eingabe, Validierung, fehlende Zeit versus Null, Reload/Entfernen, getrennte Plan-/Ist-Werte, Abhaken, unverändertes Honorar beim Plan-Resize, Monats-/Wochenauswertung sowie DE/EN und mobile Darstellung.

Nächster Ausbau: Clockodo über eine sichere lokale Backend-Schicht. Manuelle Ist-Dauern sind bereits vorhanden; keine automatische Zeiterfassung oder Synchronisierung.

`node tests/time-picker.test.cjs` prüft automatische Endzeit, zentriertes ±2-Stunden-Fenster, Tagesgrenzen, bestehende Sonderzeiten, Tastatur/Abbrechen, mobile Ansicht und Speicherung in einem isolierten Edge-Profil.

`node tests/looks.test.cjs` prüft Live-Vorschau/Abbrechen, Farben/Rahmen, Preset-Verwaltung, Speicherung, Import samt Fehlerfällen, Export und mobile Darstellung. Der Dateizugriff ist simuliert; native Ordnerberechtigungen sind dadurch nicht geprüft.

`node tests/day-presets.test.cjs` prüft das Speichern eines Tages, Vorschau/Abbrechen, bestätigtes Ersetzen nur des Zieltags, Zielfarbe, Neuladen, Wochenpreset-Modus, Löschen und mobile Darstellung. Modelltests sichern zusätzlich Migration, Backup-Roundtrip, neue IDs, unveränderten Ausgangsplan und leere Tagesvorlagen ab.

`node tests/day-highlight-resize.test.cjs` prüft Heute-Rahmen und Tagesbalken, beide Ziehkanten, Viertelstundenraster, Tastatur, Escape, unveränderte Ist-Zeit, frühe Startzeiten mit automatischem Scrollen sowie die mobile Darstellung.

## Ursprüngliche Priorität für Codex

Nicht unnötig neu bauen. Zuerst:
1. bestehenden Prototyp lokal testen und Fehler beheben
2. Wochen-Navigation korrekt persistent machen
3. Block-Editing + Plan/Ist
4. UI entsprechend `docs/DESIGN.md` finalisieren
5. erst danach Clockodo über sichere lokale Backend-Schicht anbinden


## Tageshighlight und Wochenrückblick

Siehe [Tageshighlight und Wochenrhythmus](RHYTHM.md) für Bedienung, gespeicherte Rückblicke und die optionalen Wochenfelder `highlights` und `review`. Kreis = ausgewählter Tag; Balken = Woche.


## Clockodo-Kunden und Projekte

Den bisherigen Planer neu laden. **Settings → Clockodo → Clockodo starten** öffnet die lokale Windows-Anmeldung; danach verbindet sich dieser Planer automatisch. Auf einem neuen PC einmal `tool/clockodo/Direktstart-einrichten.cmd` ausführen. Ein manueller Rückfallweg steht aufklappbar unter dem Startbutton. Im Kundenjob: **Kundendetails → Aus Clockodo wählen**. Die Auswahl wird erst beim Speichern des Eintrags übernommen. [Start, Offline-Verhalten und Grenzen](CLOCKODO.md).
