# UI-Pass · 17.09.2026

## Dateien und Einstieg

`index.html` bleibt an derselben Stelle. Alle Nutzdateien liegen unter `tool/`: `js/`, `css/`, `assets/`, `locales/`, `docs/`, `tests/`, `landing/`, `promo/`, `backup/`, `looks/` und `archive/`. Entwicklungsabhängigkeiten und npm-Befehle liegen ebenfalls dort. Versteckte Git-Dateien und die lokale Rückfallkopie sind technische Ausnahmen im Root.

Bestehende Browserdaten werden nicht verschoben oder gelöscht. Speicherkennung `jsOfficeWeek_v1` bleibt unverändert. Backup und Look-Export schreiben nach Auswahl des Root-Projektordners nach `tool/backup/` bzw. `tool/looks/`. Alte Exportdateien wurden mit ihren Ordnern verschoben. Die automatisch erstellte Quellcode-Rückfallkopie unter `.workspace-backups/20260917-ui-pass/` enthält keine Daten aus dem persönlichen Browserprofil.

## Fortschritt und Ausgangsplan

- Balken: **Woche**, gewichtet nach ursprünglichen Planminuten der festgehaltenen Tage. Beschriftung zeigt, wie viele Tagespläne enthalten sind. Ältere Wochen-Ausgangspläne werden weiterhin unterstützt.
- Kreis: **ausgewählter Tag**, gleiche Berechnungsgrundlage. Ein leeres oder nicht gestartetes Tagespensum wird nicht als 100 Prozent dargestellt.
- **Tag starten** friert den Vergleichsstand ein. Danach zeigen Seitenleiste und Tageskopf einen Schlossstatus; **Tagesplan ansehen** öffnet den Vergleich.
- Zeit, Tag, Titel oder Kategorie eines Eintrags dürfen weiter geändert werden. Der Vergleich zeigt Vorher/Jetzt, hinzugefügte und entfernte Aufgaben sowie die Änderung der geplanten Tagesdauer. Abhaken ist keine Planänderung. Entfernte Aufgaben bleiben im ursprünglichen Nenner; spontane Extras erhöhen die Planquote nicht.
- Erfasste Arbeitszeit bleibt separat in der Auswertung. Die kompakte Zeitliste zeigt ausdrücklich **geplante Wochenstunden**, gruppiert nach Familie, Privat/Alltag, Sport, Pausen, Arbeit und gegebenenfalls Sonstiges.

## Titelbibliothek

Wenige vorhandene Basics bleiben beim ersten Laden sichtbar. Weitere bisher automatisch erzeugte Vorschläge werden ausgeblendet, aber nicht gelöscht. **Settings → Titel verwalten** oder **Verwalten** neben Titeltyp öffnet die Bibliothek. Hier können eigene Titel angelegt, Titel/Kategorie geändert sowie Vorschläge aus- und eingeblendet werden. Archivierte Titel bestehender Einträge bleiben im jeweiligen Editor auswählbar, damit eine Bearbeitung die Verknüpfung nicht still löst. Globale Änderungen berühren keine festgehaltenen Ausgangspläne.

## Layout und Rückmeldung

Das Signet steht vor DAYRIVO. Schriftzug und „Dein Office“ sind an derselben linken Textkante ausgerichtet. Die Kopfmitte zeigt den ersten offenen Eintrag des ausgewählten Tages samt Datum und Zeit; ein Klick bearbeitet ihn. Erledigt-Konfetti entsteht am tatsächlichen Klickpunkt, per Tastatur in der Mitte der Checkbox. Fortschritt animiert den Tagesring; reduzierte Bewegung wird respektiert.

Der JANO-Studio-Look wurde aus den Vorschlägen entfernt. Eine aktuell verwendete Farbmischung bleibt erhalten. Unten rechts führt die beschriftete Tagesansicht zu **Settings → Planung & Daten**. Der sichtbare Tageszeitraum ist konfigurierbar; früher/später geplante Einträge erweitern ihn automatisch. Das Raster bleibt bei 15 Minuten.

## Prüfung und Grenzen

Modelltests prüfen Migration, Titelverknüpfungen, unveränderliche Ausgangspläne, Änderungen, Gruppensummen und Zeitbereichsvalidierung. Browsertests in isolierten Profilen prüfen echte Klicks, Konfetti-Koordinaten, Tagesanimation, Titelverwaltung, Neuladen, Tagesvergleich, Layout und DE/EN. Die Ordner-API wird im Test simuliert; eine echte Freigabe des Nutzerordners wird nicht ungefragt angefordert. Landingpage und ihre Planner-Links sind auf die neue Struktur angepasst. Öffentliche Veröffentlichung, Clockodo, Installer und Lizenz-/Testzeitmechanik sind nicht Teil dieses UI-Passes.
