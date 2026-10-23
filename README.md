# Grayscale mSLA printer: setup and operating guide

Step-by-step guide for setting up and running the lab’s grayscale mSLA resin printer
(Raspberry Pi 4 + BTT SKR Mini E3, klipper-mSLA, Mainsail).

The whole guide is one self-contained file, `index.html`, with its pictures built in.
Vercel serves it as a static site, so there is nothing to build.

To update the site, replace `index.html` with the new version and commit.
Vercel redeploys automatically.

## Login

The site is behind a username and password. `middleware.js` runs on Vercel before any
file is served, so the guide is never sent to someone who has not signed in.

Set the login in Vercel → Project → Settings → Environment Variables (for Production
and Preview), then redeploy:

- `SITE_USERNAME`: the username
- `SITE_PASSWORD`: the password

Until both are set, the site shows a "Login is not configured" error instead of the guide.
A sign-in lasts 7 days. Visit `/logout` to sign out. Changing the username or password
signs everyone out.
