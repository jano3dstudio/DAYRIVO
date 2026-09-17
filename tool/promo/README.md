# DAYRIVO — English promo

Two individually composed 22-second cuts:

- `DAYRIVO_Promo_16x9_EN.mp4` — 1920 × 1080, 30 fps, H.264/AAC.
- `DAYRIVO_Promo_9x16_EN.mp4` — 1080 × 1920, 30 fps, H.264/AAC.

English on-screen copy, original 120 BPM electronic groove with layered percussion, syncopated bass, wide chords and a click-synced completion accent, no voice-over. No external stock footage or music. Uses the existing DAYRIVO logo and genuine UI captures from an isolated browser with synthetic English demo data. The user's stored plans are not accessed or changed. Nothing is published automatically.

Benefits emphasized: work and life in one clear view, rescheduling in seconds, seeing completed progress, and choosing a personal look. The completion click has an additional mint pulse centered exactly on the pointer/check control; the app's actual confetti remains visible.

Optional publication-description credit: “AI-assisted production. Actual DAYRIVO interface shown with demo data.” This is a transparency suggestion, not a certification of compliance with every publication platform.

## Edit structure

| Time | Message | Picture |
| --- | --- | --- |
| 0–3 s | Life first. Work in flow. | Kinetic headline and five colour bars |
| 3–7 s | Make room for your life. | Real week / mobile day view |
| 7–11 s | Plans change. You stay in flow. | Real cross-day drag and snapped time hint |
| 11–15 s | That done feeling. | Completion check, confetti and real progress update |
| 15–18 s | Your week. Your look. | Rainbow, Neon Arcade, Glacier |
| 18–22 s | DAYRIVO. Your day. Your rhythm. | Logo, tagline and creator credit |

## Reproduce / revise

Requires Node, Playwright with Edge, FFmpeg, Python with NumPy. Set `PLAYWRIGHT_MODULE` to an installed Playwright module if needed.

1. `node promo/capture.cjs` — records the actual local app into `media/` using disposable browser storage.
2. `python promo/soundtrack.py` — synthesizes the original stereo music bed.
3. `node promo/render.cjs --stills` — renders review images for both compositions.
4. `node promo/render.cjs` — renders both final MP4 files, audio normalized to -16 LUFS / -1.5 dBTP target.

`composition.html` contains the editable timeline, framing, titles and motion. `capture.cjs` contains the neutral demonstration plan and real interactions. `soundtrack.py` contains the revised 120 BPM music synthesis: layered drums, syncopated bass, stereo chords, a short breakdown before the completion click at 12.25 s and a final logo impact at 18 s. `soundtrack-v1.py` preserves the previous arrangement for comparison.

Generated captures, WAVs, review images and MP4s are excluded from Git. They remain on the local machine; a fresh clone regenerates them using the steps above. Existing DAYFORM videos remain locally available as the earlier version.
