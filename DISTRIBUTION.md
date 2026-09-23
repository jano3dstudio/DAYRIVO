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
