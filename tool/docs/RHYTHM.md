# Tageshighlight und Wochenrhythmus

Stand: 17.09.2026. Bewusst kleine, freiwillige Erfolgsmomente ohne Punkte, Rangliste oder verlorene Streaks.

## Bedienung

- Im Tagesbereich links ein **Tageshighlight** wählen oder im Eintragsdialog markieren. Ein Highlight pro Tag, aus allen Lebens- und Arbeitsbereichen. Auswahl lässt sich jederzeit ändern oder entfernen.
- Abhaken nutzt den bestehenden Effekt an der Checkbox und ergänzt beim Highlight einen kurzen Impuls plus Nachricht. Rückgängig machen setzt den aktuellen Zustand zurück.
- Unter dem Wochenfortschritt stehen fünf kleine **Tageszeichen**. Anklicken wechselt den ausgewählten Tag. Die Strahlen wachsen mit dem festgehaltenen Tagesplan; der Stern in der Mitte steht für ein erledigtes Highlight.
- **Woche abschließen** öffnet den freiwilligen Rückblick: erledigte Einträge nach Lebensbereichen, Highlights und Platz für eine kurze Reflexion sowie den nächsten Wochenfokus. Speichern ist kein Kalender-Lock. Der Rückblick wird erst mit erneutem Speichern aktualisiert.

## Bedeutung der Werte

Der große Kreis bleibt der Fortschritt des ausgewählten **Tages**, der Balken darunter der Fortschritt der **Woche**. Tageszeichen verändern diese Berechnung nicht. Grundlage sind die unveränderten Morgenpläne und deren ursprüngliche Dauer. Ohne festgehaltenen Tagesplan wachsen keine Strahlen; ein erledigtes Highlight kann trotzdem einen Stern bekommen.

Im Rückblick zählen tatsächlich abgehakte **Einträge**, keine Arbeitsstunden. Leben steht vor Arbeit. Manuell erfasste Ist-Zeit bleibt separat in der Auswertung. Kein Bonus für Überstunden oder besonders volle Tage.

## Speicherung

Optionale Felder je Woche, weiterhin Schema-Version 1 und derselbe lokale Speicherschlüssel:

- `highlights`: Tageskürzel → `{ itemId, title }`. Stabile Eintrags-ID; Titel als Fallback. Verschobene und gelöschte Highlights werden sichtbar gekennzeichnet.
- `review`: `{ savedAt, reflection, next, summary }`. Der zuletzt gespeicherte Rückblick bleibt unabhängig von späteren Änderungen erhalten.

JSON-Backup/Restore validiert diese Felder. Neue Wochen und Presets übernehmen keine persönlichen Highlights oder Rückblicke. Reduzierte Bewegung unterdrückt die zusätzlichen Animationen, nicht die Statusanzeige.

## Geprüft

Modelltests: Auswahl/Wechsel/Löschen/Verschieben, unveränderte Morgenbasis, Rücknahme, Snapshot, Backup und ungültige Daten. Browser: Auswahl, Stern/Strahlen, Abhaken/Rücknahme, Speichern/Neuladen, DE/EN und schmale Ansicht mit isoliertem Testprofil.
