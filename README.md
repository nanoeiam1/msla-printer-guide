# Grayscale mSLA printer: setup and operating guide

Step-by-step guide for setting up and running the lab’s grayscale mSLA resin printer
(Raspberry Pi 4 + BTT SKR Mini E3, klipper-mSLA, Mainsail).

The whole guide is one self-contained file, `index.html`, with its pictures built in.
Vercel serves it as a static site, so there is nothing to build.

To update the site, replace `index.html` with the new version and commit.
Vercel redeploys automatically.

## Paused

The site is currently paused. `middleware.js` answers every request with a
"temporarily unavailable" page, so the guide is not served to anyone.
To bring the site back, delete `middleware.js` and commit.
