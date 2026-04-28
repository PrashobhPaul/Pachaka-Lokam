# Pachaka Lokam — Production / Play Store Deployment

No Android Studio required. Everything builds on GitHub Actions using **Bubblewrap** (the same tool used by PWABuilder). The resulting `.aab` uploads directly to Play Console.

## 1. Host the PWA (HTTPS required)

Option A — GitHub Pages (free, automatic):
1. Repo → Settings → Pages → Source: **GitHub Actions**
2. Push to `main`. The workflow `.github/workflows/pages-deploy.yml` publishes the site.
3. Your PWA URL will be `https://<user>.github.io/<repo>/` (or a custom domain).

Option B — Netlify / Vercel / Cloudflare Pages: point it at the repo root. Static site, no build step.

## 2. Update `twa-manifest.json`

Replace `pachakalokam.example.com` with your real host in:
- `host`
- `iconUrl`, `maskableIconUrl`
- `webManifestUrl`
- `fullScopeUrl`

Pick a final `packageId` (e.g. `com.yourname.pachakalokam`) — **this cannot change after first Play Store upload.**

## 3. Generate an upload keystore (one-time, locally)

```bash
keytool -genkeypair -v \
  -keystore android.keystore -alias android \
  -keyalg RSA -keysize 2048 -validity 10000
```

Keep this file safe — you need it for every future update.

## 4. Add GitHub Secrets

Repo → Settings → Secrets and variables → Actions → New repository secret:

| Secret | Value |
|---|---|
| `ANDROID_KEYSTORE_BASE64` | `base64 android.keystore` output (single line) |
| `KEYSTORE_PASSWORD` | password you set in step 3 |
| `KEY_ALIAS` | `android` (or whatever alias you chose) |
| `KEY_PASSWORD` | key password |

On Windows: `certutil -encode android.keystore tmp.b64` then copy the body.

## 5. Build the AAB

Either:
- Push a tag: `git tag v1.0.0 && git push --tags` — triggers build + GitHub Release.
- Or run manually: Actions → **Build Android AAB (Play Store)** → Run workflow.

Artifacts produced:
- `app-release-bundle.aab` — upload this to Play Console.
- `app-release-signed.apk` — for sideload testing.
- `assetlinks.json` — Digital Asset Links file (see step 7).

## 6. Create the Play Console listing

1. Play Console → Create app → Internal testing → upload the `.aab`.
2. Fill store listing: title, short description, screenshots (from the PWA), privacy policy URL.
3. Complete content rating + data safety form.
4. Release to Internal testing → promote to Closed → Production when ready.

## 7. Verify Digital Asset Links (removes the URL bar)

Without this, the TWA runs in a Chrome-branded Custom Tab. With it, it's a fullscreen app.

1. Play Console → Setup → **App integrity** → copy the SHA-256 fingerprint of the **App signing key**.
2. Edit `.well-known/assetlinks.json` — replace `REPLACE_WITH_PLAY_APP_SIGNING_SHA256_FROM_PLAY_CONSOLE`.
3. Commit + redeploy Pages. Verify: `https://<host>/.well-known/assetlinks.json` returns valid JSON.
4. Validate: https://developers.google.com/digital-asset-links/tools/generator

## 8. Shipping updates

Bump in `twa-manifest.json`:
- `appVersionCode` — increment by 1 every release (integer).
- `appVersionName` — human version ("1.0.1").

Or pass them to the manual workflow dispatch inputs.

Then tag & push → new `.aab` → upload to Play Console.

## Notification behaviour inside the TWA

- Chrome's Notification API delivers meal-time & festival alerts while the app is open or backgrounded (Chrome kept alive by Android).
- For strict always-on delivery, wire Firebase Cloud Messaging into the service worker — not required for first release.
