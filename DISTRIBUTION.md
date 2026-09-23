<!-- licensing-20260924 -->
## Nutzung und Lizenz / Use and license

Privat und im eigenen Unternehmen kostenlos nutzbar, einschließlich eigener
Kundenarbeit. Für die eigenen lizenzierbaren Beiträge gelten wahlweise PolyForm
Noncommercial 1.0.0 oder PolyForm Internal Use 1.0.0. Verkauf der Software,
abgeleiteter Software oder kostenpflichtiges externes Hosting benötigen eine
gesonderte Erlaubnis, soweit keine andere geltende Lizenz dies bereits erlaubt.
[Lizenz](LICENSE.md) · [Beispiele / Examples](LICENSE-FAQ.md).
Fremdlizenzen und bereits erteilte Rechte bleiben erhalten. Öffentlich einsehbar
bedeutet hier nicht uneingeschränkt Open Source.
<!-- /licensing-20260924 -->

## Öffentlicher Quellstand · 24.09.2026

Der Quellcode dieses persönlichen Prototyps ist öffentlich einsehbar. Der aktuelle Lizenzumfang steht in LICENSE.md; es wird keine uneingeschränkte Open-Source-Lizenz erteilt. Bestehende Rechte und Lizenzen an enthaltenen Drittanbieterkomponenten bleiben erhalten. Für weitergehende Nutzung oder Weitergabe bitte die jeweiligen Bedingungen beachten bzw. Jona kontaktieren.

Die Releases sind experimentelle, vorhandene Buildstände. ZIP-Integrität und Prüfsummen sind geprüft; die Veröffentlichung ist keine neue Funktionsabnahme oder Zusicherung für produktive Arbeit. Private Profile, persönliche Daten und Zugangsdaten gehören nicht in dieses Repository.

# DAYRIVO · Build und Lieferung

Stand: 24.09.2026. [Website](https://tools.jano3dstudio.de/dayrivo/) · [GitHub-Releases](https://github.com/jano3dstudio/DAYRIVO/releases).

## Vorbereiteter Build

`DAYRIVO-Windows-20260924.zip` (35,309,804 Bytes), SHA-256 `c3c462e6595197224c911dde3ba332df5c72ae5cecde613de34261da6541739d`.

Quelle im lokalen App-Ordner: `DAYRIVO.exe`.
Startweg des bestehenden Lieferstands: `DAYRIVO.exe`.
Der Build ist ein vorhandener Lieferstand, kein frisch kompilierter oder erneut funktional abgenommener Build.
Paketintegritaet und Pruefsumme wurden geprueft. Die Release-Ablage wird separat bestaetigt; diese Datei behauptet keinen bereits erfolgten Upload.

## Selbst bauen

[Entwicklungsanleitung](DEVELOPMENT.md) · [Build-Einstieg](<tool/desktop/build.ps1>).
Voraussetzungen, gepinnte SDKs und produktspezifische Tests stehen in der Entwicklungsanleitung.
Fuer gemeinsame Module benoetigt man gegebenenfalls das [MODULO-Repository](https://github.com/jano3dstudio/jano-app-kit); benachbarte Checkout-Ordner muessen den dort dokumentierten Namen behalten.
Der vorhandene lokale Build beweist keinen erfolgreichen Build aus einem frischen Checkout.

## Ordner und Daten

Quell-, Start- und Profilpfade bleiben stabil. Laufzeitdaten, Passwoerter, Testprofile und Sicherungen gehoeren nicht in Release-Pakete.
Alte Buildstaende bleiben lokal; fuer diese Lieferung wurde nur der oben genannte Kandidat ausgewaehlt.
EXE/ZIP-Dateien werden nicht in die Quellcode-Historie gezwungen. Getrennte Release-Assets enthalten SHA256SUMS.txt.

Vor oeffentlicher Weitergabe [PUBLICATION_REVIEW.md](PUBLICATION_REVIEW.md) beachten.

Startdatei im ZIP: `DAYRIVO.exe`. ZIP zuerst vollständig entpacken.
