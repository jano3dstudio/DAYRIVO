# Datenmodell – Vorschlag

## Implementiert in JS OFFICE WEEK 1.0 (16.09.2026)

Browser-Schlüssel: `jsOfficeWeek_v1`. Schema `version: 1` enthält:

- Optionales Eintragsfeld `icon`: Symbol-ID (z. B. `bike`), `auto` oder `none`. Fehlend bedeutet automatische Anzeige nach Kategorie ohne Datenmigration. Unbekannte zukünftige IDs fallen auf die automatische Anzeige zurück; IDs müssen 1–40 Kleinbuchstaben/Ziffern/Bindestriche enthalten und mit einem Buchstaben beginnen. SVG-Zeichnungen kommen ausschließlich aus dem lokalen Icon-Katalog, niemals aus Benutzerdaten.

- `selectedWeek`: lokales Montagsdatum als `YYYY-MM-DD` (ohne UTC-Verschiebung).
- `weeks[weekStart]`: `{ weekStart, items[] }`, voneinander unabhängige Wochen.
- Optional `weeks[weekStart].reminders`: Array aus `{id, day, text, done}`. Eindeutige IDs pro Woche, kanonischer Wochentag, Text 1–160 Zeichen, boolescher Status, maximal 200 Erinnerungen pro Woche. Fehlt das Feld, wird keine Migration geschrieben. Reminder stehen außerhalb von `items`, Snapshots und Vorlagen; dadurch fließen sie nicht in Zeit-/Honorar-/Planerfüllungsmetriken ein. Wochen-/Tagespresets ersetzen nur Zeitblöcke und erhalten die vorhandenen Reminder. Neue Wochen übernehmen keine Reminder. JSON-Backup/Restore validiert und erhält das optionale Feld.
- Optionale Wochenfelder: `sourcePreset` ist eine Kopie des bei Anlage/Übernahme verwendeten Presets; `planSnapshot` enthält `{ capturedAt, items, preset }`. Die Plan-Einträge behalten ihre ursprünglichen IDs zur Zuordnung gegen aktuelle Einträge. `preset` ist eine unveränderliche Vergleichskopie oder `null`.
- `presets[id]`: `{ id, name, items[] }`, unabhängig von Kalenderwochen bearbeitbare Vorlagen.
- `defaultPresetId`: Vorlage für noch nicht vorhandene Kalenderwochen. Wechsel beeinflusst keine bestehenden Wochen.
- `template`: Kompatibilitätskopie des aktuellen Standardpresets, wird beim Speichern nachgeführt. Alte Daten ohne `presets` erhalten daraus einmalig eine `Standardwoche`.
- `settings.days[Wochentag]`: `{ color, subtitle }`, wochenübergreifende Tagesgestaltung.
- `settings.view`: historisches optionales Feld `{ mode: 'fit' | 'manual', scale }`, wird für Backup-Kompatibilität erhalten, aber nicht mehr ausgewertet oder neu geschrieben. Die Kalenderdarstellung berechnet ihren Maßstab ausschließlich aus Fensterhöhe und sichtbaren Einträgen: 0,8–1,4 Pixel/Minute, angehobenes Minimum für kurze Blöcke (20 Pixel für den kürzesten regulären Block). Keine Änderung gespeicherter Zeiten beim Skalieren.
- Block: `id`, `day`, `start`, `end`, `cat`, `title`, `description`, `done`; optionale Texte `customer`, `project`, `service`, `actual` (V3-Arbeitsnotiz, keine gemessene Ist-Zeit).
- Optional `actualMinutes`: manuell erfasste ganzzahlige Dauer 0–1440 Minuten, fehlend/`null` = noch nicht erfasst. Getrennt von `actual` (alter Freitext). Keine Migration aus Planzeiten oder Notizen. Eingabe `H:MM`, minutengenau, kein 15-Minuten-Raster. Datum ergibt sich aus der Woche und dem Tag des Eintrags. Backup validiert das Feld überall, wo Einträge vorkommen.
- Optional `hourlyRateCents`: ganzzahliger Euro-Stundensatz in Cent, 0 bis 100000000; fehlend oder `null` bedeutet unbewertet, 0 explizit unbezahlt. `parseRate` akzeptiert Dezimalkomma/-punkt und maximal zwei Nachkommastellen. `validateItems` prüft das Feld auch in Vorlagen, Snapshots und Backups. Alte Einträge brauchen keine Migration.
- `legacyV3`: falls vorhanden, zusätzliche unveränderte Übernahmekopie von Current/Archiv. Die ursprünglichen V3-Browserschlüssel bleiben bestehen.

JSON-Backup: `{ app: 'JS OFFICE WEEK', version: 1, savedAt, data }`. Ordnerhandle separat in IndexedDB `jsOfficeWeek_files`, nicht Teil des Backups. Jede Datei erhält einen eindeutigen Zeitstempel. Restore prüft Schema, Zeiten, Wochen, IDs und Farben vor dem Ersetzen und sichert den vorherigen Browserstand.

Einträge liegen innerhalb eines Tages (Endzeit nach Startzeit, spätestens 23:59); keine Übernachtblöcke. Überschneidungen sind erlaubt und werden in nebeneinanderliegenden Spuren dargestellt. Tagesname/Farbe ersetzen keine spätere Clockodo-Zuordnung.

`financialMetrics(items)` bleibt als Planwert-Helfer erhalten. Die Honoraroberfläche nutzt ausschließlich `recordedWorkMetrics(items)`: nur abgehakte Einträge im Bereich `work`, nur gültige `actualMinutes`. Je Job `Math.round(actualMinutes * hourlyRateCents / 60)`, danach Summe ganzzahliger Centbeträge. Rückgabe: `minutes`, `recordedCount`, `missingTimeCount`, `missingRateCount`, `missingRateMinutes`, `valuedMinutes`, `earnedCents`. Fehlende Zeit wird nie durch Planzeit ersetzt. Fehlende Sätze sind keine Nullsätze; erfasste Minuten ohne Satz zählen zur Arbeitszeit, nicht zum Honorar. Bei Wechsel in einen privaten Bereich bleiben erfasste Zeit und Satz gespeichert, werden dort aber nicht gewertet. Keine Zahlungs-/Steuerberechnung.

Die Hauptauswertung zeigt bei Arbeit die erfassten Minuten und bei übrigen Bereichen ausdrücklich gekennzeichnete abgehakte Planzeiten. Es gibt keine gemischte Gesamtstundensumme. Das bestehende `weekMetrics`-Modell für den Ausgangsplanvergleich bleibt unverändert und erscheint separat aufklappbar.

„Nächste Woche“ hält Zielwoche und Preset-Auswahl zunächst nur im UI. Bestätigen legt per `applyPreset` eine unabhängige Kopie mit frischen IDs und zurückgesetzten Häkchen an; `defaultPresetId` bleibt unverändert. Die Beibehalten-Option verändert nur `selectedWeek`. Bei fehlgeschlagener Speicherung wird der vorherige Datensatz wieder eingesetzt.

Die folgenden Felder sind die längerfristige Zielstruktur; manuelle `actualMinutes` sind implementiert. Ist-Start/Ende, Timer und Clockodo-Synchronisierung stehen noch aus.

Planungsraster: 15 Minuten. Drag-and-drop ändert `day`, `start`, `end`; ID, Dauer und sämtliche Zusatzfelder bleiben bestehen. Farben werden aus `settings.days[day]` abgeleitet und nicht am Eintrag dupliziert. Bestehende/importierte Sonderzeiten bleiben unverändert; horizontale Tageswechsel behalten die Uhrzeiten, vertikale Bewegungen rasten die Startzeit ein und erhalten die Dauer. Die Von-Auswahl bietet 00:00 bis 23:30, Bis bis 23:45 im Viertelstundentakt sowie den jeweiligen bestehenden Sonderwert an. Änderung der Startzeit setzt die Endzeit auf +60 Minuten, begrenzt auf 23:45. Historische Daten bis 23:59 bleiben lesbar. Diese Vorschlagslogik betrifft nur den Eintragseditor; das Datenformat bleibt unverändert.

Preset-Instanzen und Preset-Kopien erhalten neue IDs, `done: false`, leere `actual`-Notizen und kein `actualMinutes`-Feld. `editingPresetId` ist ausschließlich UI-Zustand; nach einem Neuladen wird wieder die Kalenderwoche gezeigt. Preset-Änderungen bleiben gespeichert. Auf eine bestehende Woche anwenden ersetzt deren Einträge erst nach Bestätigung. Presets und Standardauswahl werden im selben Browserdatensatz und JSON-Backup gespeichert; das Schema bleibt abwärtskompatibel zu bisherigen Version-1-Datensätzen.

Auswertung: `weekMetrics` ordnet aktuelle Einträge per ID dem `planSnapshot` zu. Abgehakte Plan-Einträge zählen mit ihrer ursprünglichen Dauer. Neue IDs zählen nur als zusätzliche Aufgaben, fehlende ursprüngliche IDs bleiben offen. Quote bei positivem Ausgangsumfang = ursprüngliche Minuten abgehakter Plan-Einträge / ursprüngliche Gesamtminuten, sonst `null`. Der Ausgangsplan wird nur durch explizites Festhalten erzeugt und nicht durch Migration rekonstruiert. Auch Preset-Namen und -Dauern bleiben als Vergleichskopie erhalten, wenn die Vorlage später geändert oder gelöscht wird.

`monthMetrics` liest ausschließlich vorhandene Wochen und ordnet Einträge anhand von `weekStart` + Wochentagsindex dem Kalendertag zu. Plan-/Abgehakt-Minuten werden an Monatsgrenzen korrekt getrennt. Monatsbrowsing erzeugt keine Wochen. Jeder Tag und der Monat enthalten abgeleitete `groups` mit `planned`, `done`, `count`. `timeGroups` / `timeGroup` / `groupedTime` ordnen jede Kategorie genau einem Bereich zu: work (Kunde, AI / Firma, Spiel, Admin), sport (Sport), private (Familie, Schule, Routine), break (Pause, Puffer), other (alle übrigen). Die Summe der Gruppen entspricht der Gesamtsumme; überlappende Einträge zählen ihre jeweilige volle Plandauer. Bereichsfortschritt = aktuelle abgehakte Planminuten / aktuelle geplante Minuten, nicht die eingefrorene Ausgangsplanquote oder gemessene Arbeitszeit. Der Monatsfilter bleibt reiner UI-Zustand; keine Schemaänderung oder Migration erforderlich.

```text
Settings
  theme
  accent
  clockodoConfigured

WeekTemplate
  blocks[]

Week
  weekStart
  blocks[]

Block
  id
  day
  category
  title
  plannedStart
  plannedEnd
  actualStart?
  actualEnd?
  actualMinutes?
  done
  notes?

CustomerAssignment?
  customerId
  customerName
  projectId?
  projectName?
  serviceId?
  serviceName?
  description?
  clockodoEntryId?
  syncStatus: unsynced | synced | error
```

Wichtig: Template und konkrete Kalenderwoche nicht vermischen. Änderungen an einer alten Woche dürfen nicht die Basisvorlage verändern.

## Sprache

`settings.language` ist ein optionaler BCP-47-artiger Sprachcode, derzeit `de` oder `en`. Er ist Bestandteil von Gesamtbackups; ältere Daten ohne Sprachcode verwenden Deutsch. Tages-/Kategorie-Werte und Benutzertexte werden beim Sprachwechsel nicht geändert. Darstellung und Datumsformatierung sind in `docs/I18N.md` beschrieben.

## Tagespresets

`dayPresets: [{id, name, items}]` enthält bis zu 100 unabhängige Tagesvorlagen. Einträge einer Vorlage stammen aus höchstens einem Wochentag; leere Vorlagen sind erlaubt. Ältere Daten erhalten einmalig fünf Vorlagen aus den Tagen ihres Standard-Wochenpresets. Spätere Änderungen am Wochenpreset verändern diese Kopien nicht automatisch.

Beim Anwenden werden nur die Einträge des gewählten Zieltags ersetzt. Kopien erhalten den Zieltag und frische IDs; `done` wird false und `actual` leer. Andere Tage, Tagesgestaltung und `planSnapshot` bleiben unverändert. Das funktioniert sowohl auf einer Kalenderwoche als auch einem Wochenpreset. Vollständige Backups enthalten und validieren Tagespresets.

## Farbpresets / Looks

`settings.appearance = {accent: '#rrggbb', frame: 'dashed' | 'solid' | 'none'}` speichert Akzent und Rahmen. Aktive Tagesfarben bleiben unter `settings.days[Tag].color`. Das zusätzliche Array `looks` enthält unabhängige Presets `{id, name, accent, frame, days: {Montag: '#rrggbb', ...}}`. Farbpresets enthalten weder Tagesuntertitel noch Einträge.

Ältere Daten erhalten automatisch den Standardakzent #3cff91, einen gestrichelten Rahmen und das Farbpreset JANO Studio. Vorhandene Tagesfarben und Wochen bleiben erhalten. Vollständige Backups validieren und enthalten diese Felder.

Separater Austausch: `{app: 'JS OFFICE WEEK LOOKS', version: 1, presets: [...]}`. Import validiert sämtliche Farben, Rahmen, Namen und IDs vor der Übernahme; unbekannte Felder werden verworfen. Maximal 100 Presets, 80 Zeichen je Name, 1 MB je Importdatei. Importierte Presets erhalten neue IDs, Namenskollisionen einen nummerierten Zusatz. Alle Änderungen im Looks-Dialog bleiben bis Übernehmen lokal in dessen Entwurf; Abbrechen verwirft sie.
# Ergänzung: Stammdaten

## DAYFORM-Erweiterung (17.09.2026)

`dayform-model.js` erweitert Planner abwärtskompatibel. Storage-Key und Backup-Kennungen bleiben unverändert. `settings.dayformSetup` markiert die einmalige Übernahme wiederholter Titel samt Kategorie in `standardTitles: [{id,name,categoryId}]`. Einträge können über `titleId` verknüpft sein; eigene Titel besitzen keine Verknüpfung. Bewusste Änderungen propagieren ausschließlich Titel/Kategorie über Kalenderwochen und Vorlagen. Ausgangspläne werden dabei nicht verändert.

`week.daySnapshots[Tag] = {capturedAt,date,items}` hält den Tagesstart einmalig fest. Bereits an anderen Tagen erfasste IDs werden nicht erneut übernommen. `weekMetrics` verwendet bei Tagesplänen deren gemeinsame unveränderliche Basis und zählt aktuelle Einträge der gestarteten Tage sowie verschobene Basis-IDs. Ohne Tagespläne bleibt ein bestehender `planSnapshot` verwendbar. `dayMetrics` vergleicht ursprüngliche Planminuten ausschließlich mit tatsächlich erfassten Minuten erledigter Arbeit. Keine Ist-Ersatzwerte aus geplanten Dauern.

Neue Nutzer erhalten eine leere Woche und `settings.needsWelcome`, bis sie eine neutrale Vorlage wählen. Bestehende Nutzer erhalten zusätzliche Vorlagen, keine ersetzte Woche. `clearPlanning` leert entweder die gewählte Woche oder alle Wochen einschließlich ihrer Ausgangspläne. Vor der UI-Aktion wird der vollständige Stand unter `jsOfficeWeek_v1_beforeReset` gespeichert; ein Speicherfehler verhindert das Zurücksetzen.

`settings.customLook` erhält die eigene Farbmischung unabhängig vom gerade ausgewählten benannten Preset. Änderungen bleiben bis Übernehmen ein Dialogentwurf. `settings.lookCollectionV2` markiert die einmalige Ergänzung von sechs Farbsets; später gelöschte Sets werden nicht bei jedem Start neu angelegt.

Prüfungen: `tests/dayform.test.cjs` (Modell, Migration, Standardtitel/Kategorien, Tagespläne, Reset, Backup) und `tests/dayform-browser.test.cjs` (Onboarding, Looks-Persistenz, Editor-Raster, Haken/Konfetti, feste Balken, Wiederherstellung, Desktop/Mobil/Ultrawide).

`masterData` enthält versionierte Kategorien, Kunden, Projekte und Leistungen. Kategorie-IDs bleiben bei Umbenennung stabil; Kunden-/Projekt-/Leistungs-IDs ergänzen optional die vorhandenen Textfelder eines Eintrags. Migration, Archivierung, Auswertungszuordnung und spätere Clockodo-Verknüpfungen sind in [MASTER_DATA.md](MASTER_DATA.md) beschrieben.

## UI refinement schema additions

`settings.titleLibraryV2` applies the one-time compact-library migration. `standardTitles[].archived` hides suggestions without removing links or changing baseline snapshots. Management renames still propagate only across editable items. `settings.planningHours: {start,end}` stores the default visible range (at least one hour); outside entries expand it without altering data or the 15-minute snap. `refinements-model.js` provides pure day-deviation comparisons and grouped planned-time summaries. No replacement of storage keys or schema version is required.


## Tageshighlight und Wochenrückblick

Siehe [Tageshighlight und Wochenrhythmus](RHYTHM.md) für Bedienung, gespeicherte Rückblicke und die optionalen Wochenfelder `highlights` und `review`. Kreis = ausgewählter Tag; Balken = Woche.
