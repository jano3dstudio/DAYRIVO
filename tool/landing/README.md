# DAYRIVO landing page

Local, responsive product page in English and German. Open `tool/landing/index.html` or serve the project root and visit `/tool/landing/`. The **Open planner** buttons lead to the existing app at `../../index.html`.

## Included

- Real app screenshots, captured in an isolated browser with synthetic demo data.
- Three interactive looks: Rainbow, Neon Arcade and Glacier.
- A completion demo with radial confetti and reduced-motion support.
- A 22-second English trailer in a keyboard-dismissable native dialog.
- Translated product copy and FAQ; language preference persists under its own storage key.
- Author credit linking to Jona Fynn Schlegelmilch's LinkedIn profile.

No external fonts, analytics, trackers, newsletter submissions or account service. The page does not read or modify the planner's local storage. The planner itself still stores data per browser/device.

This page has not been deployed. The CTA currently opens the local app; it is not a public download or hosted service. Name, licensing and public release decisions remain separate.

## Source and media

Run the commands below from `tool/`. Paths in commands are relative to that directory.

`index.html`, `landing.css` and `landing.js` need no build step. Serve or transfer them together with `landing/assets/`, the app root and the branding asset at `assets/dayform-mark.png`.

`node landing/capture.cjs` recreates the six screenshots using Playwright and Edge (or `PLAYWRIGHT_CHANNEL=chromium`). Each capture uses new synthetic planning data; it never connects to the user's browser profile.

The video is a web-sized derivative of `promo/DAYRIVO_Promo_16x9_EN.mp4`:

```sh
ffmpeg -i promo/DAYRIVO_Promo_16x9_EN.mp4 -vf scale=1280:720 -c:v libx264 -preset medium -crf 25 -c:a aac -b:a 128k -ar 48000 -movflags +faststart landing/assets/dayrivo-film.mp4
```

Unlike generated working files in `promo/`, these selected marketing assets are intentionally tracked so the landing page works from a fresh clone.

## Verification

`npm run test:landing` checks image loading, color selection, demo completion, reduced motion, video loading and Escape behavior, FAQ controls, language persistence, narrow layouts, and separation from app data. Screenshot reviews cover English and German at 1440, 768, 390 and 360 pixels. No production hosting or real user data is exercised.
