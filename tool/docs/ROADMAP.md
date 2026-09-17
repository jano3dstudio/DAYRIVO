# Roadmap

## JS OFFICE WEEK 1.0 – Stand 16.09.2026
- [x] Desktop-Test in isoliertem Microsoft Edge
- [x] Keine JavaScript-Laufzeitfehler in den geprüften Browserabläufen
- [x] Kalenderwochen als getrennte Datensätze implementieren
- [x] Vor/Zurück/Heute zuverlässig
- [x] Basisvorlage von Wocheninstanzen trennen
- [x] Block bearbeiten (Titel, Zeit, Beschreibung, optionale Kundendetails)
- [x] Gemeinsames Zeitraster mit Überlappungsspuren
- [x] Tagesfarbe und Subline bearbeiten
- [x] Hover-Plus, Unterkante ziehen und Endzeit aktualisieren
- [x] Einträge innerhalb/zwischen Tagen ziehen, Zielfarbe automatisch, Escape zum Abbrechen
- [x] 15-Minuten-Raster für Planzeiten und Ziehen, vorhandene Sonderzeiten erhalten
- [x] JANO Logo mittig, Bedienakzente in Originalfarbe #3CFF91
- [x] Wochenpresets separat anlegen, kopieren, bearbeiten, löschen und anwenden
- [x] Standardpreset für neue Wochen, Presets im Backup, alte Basiswoche automatisch übernehmen
- [x] Von/Bis-Dropdowns im 15-Minuten-Takt mit Erhalt bestehender Sonderzeiten
- [x] Fast volle Fensterbreite, kompakter responsiver UI-Pass
- [x] Ausschließlich automatische Tagesansicht nach Fensterhöhe mit Dichtebegrenzung, lesbaren Kurzblöcken und ohne Zoom-Steuerung
- [x] Layoutprüfung auf Desktop, Laptop, Ultrawide und Handy; Drag/Resize mit variablem Maßstab
- [x] Linke Navigation für Woche, Monat und Auswertung
- [x] Quick-To-dos rechts im Tageskopf, direkt abhaken, bearbeiten/löschen, kompakte schmale Ansicht, lokale Speicherung und Backup
- [x] Monatsübersicht aus gespeicherten Wochen, korrekte Monatsgrenzen, Tagesnavigation
- [x] Optionale Stundensätze je Arbeitseintrag, Wertvorschau und Honorarübersicht für Woche/Monat ausschließlich für abgehakte Jobs
- [x] Manuelle Ist-Arbeitszeit pro Job, minutengenau; Auswertung/Honorar ausschließlich auf erfasster Zeit, fehlende Zeiten sichtbar, keine Planzeit-Schätzung
- [x] Preset-Dropdown vor „Nächste Woche“, bestehende Wochen beibehalten oder bestätigt ersetzen
- [x] Auswertung nur erledigter Zeiten/Kategorien; ursprünglicher Planvergleich separat aufklappbar
- [x] Monatszeiten getrennt nach Arbeit, Sport, Privat und Pausen/Puffer; Bereichssummen, Tagesaufteilung, Filter und Kalenderwochen, DE/EN und responsive
- [x] Wochenplan bewusst festhalten, unveränderlicher Preset-Vergleich und Planerfüllung aus Häkchen
- [x] Zusätzliche, veränderte und gelöschte Aufgaben getrennt ausweisen
- [x] Header ausrichten, Light/Dark entfernen, echtes Menü
- [x] Looks oben rechts: Akzent/Tagesfarben, Rahmen, Live-Vorschau und eigene Farbpresets
- [x] Farbpresets verwalten, separat importieren/exportieren und in Gesamtbackups erhalten (Dateizugriff im Test simuliert)
- [x] Tagespresets im Tageskopf auswählen und vorab ansehen, eigene Tage speichern/löschen, isoliert auf Kalender- oder Vorlagentage anwenden
- [x] Sprachauswahl Deutsch/English oben rechts, zentraler Katalog und Erweiterungsweg für weitere Sprachen
- [ ] Neutralen Produktnamen wählen (Ideen in PRODUCT_DIRECTION.md)
- [ ] Optionalen Community-/Discord-Pilot bewerten; noch keine Chat-Anbindung beauftragt
- [ ] Plan/Ist-Felder
- [x] Backup + Restore (Dateizugriff im Browsertest simuliert)
- [ ] Nativen Backup-Ordnerdialog und Schreibfreigabe im Benutzerbrowser bestätigen
- [x] Mobile Tagesumschaltung als Nebenanforderung

## V4 Clockodo
- [ ] Lokalen Backend-Service wählen (Python/FastAPI oder Node)
- [ ] Secrets über `.env`
- [ ] Kunden laden
- [ ] Projekte nach Kunde laden
- [ ] Leistungen laden
- [ ] Kundencard zuordnen
- [ ] Ist-Zeit validieren
- [ ] expliziter Button „An Clockodo senden“
- [ ] Sync-ID/Status lokal speichern
- [ ] Doppelsync verhindern

## Weiterer Analyse-Ausbau
- [x] Monatsansicht (Planung und abgehakte Planstunden)
- [ ] abrechenbare Stunden
- [ ] Plan vs. Ist
- [ ] Kunde/Projekt-Auswertung
- [ ] historische Wochen

## Später
- [ ] Pauschalen/Auslagen prüfen
- [ ] Rechnungsvorschau
- [ ] PDF/E-Rechnung nur nach sauberer steuerlicher Konzeption
- [ ] Obsidian/Codex-Integration
