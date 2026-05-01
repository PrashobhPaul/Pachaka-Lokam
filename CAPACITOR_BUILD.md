# Building for Play Store with Capacitor (no Android Studio)

This pipeline wraps the PWA in a Capacitor Android shell and produces a signed `.aab` (Play Store) and `.apk` (sideload) — entirely on GitHub Actions.

## Why Capacitor (vs Bubblewrap/TWA)

| | Capacitor | Bubblewrap (TWA) |
|---|---|---|
| Web assets bundled inside APK | ✅ yes — works without HTTPS host | ❌ requires hosted PWA |
| Native plugins (notifications, etc.) | ✅ rich plugin ecosystem | ❌ web-only |
| Initial APK size | ~5–7 MB | ~1 MB |
| Setup complexity | Slightly higher | Lowest |
| Recommended for this app | ✅ | also fine |

Capacitor is the better fit because: notifications survive browser quirks, the app works offline on first launch (no need to fetch from network), and you don't depend on the website being up.

## One-time setup

### 1. Choose your `appId`
Already set in `capacitor.config.json`: **`com.prashobhpaul.pachakalokam`**.
This becomes the Play Store package name and is **immutable after first upload**.

### 2. Generate an upload keystore (locally, once)
```bash
keytool -genkeypair -v \
  -keystore release.keystore -alias android \
  -keyalg RSA -keysize 2048 -validity 10000
```
Store this file safely outside the repo. You'll need it for every future update.

### 3. Add GitHub Secrets
Repo → Settings → Secrets and variables → Actions:

| Secret | How to get it |
|---|---|
| `ANDROID_KEYSTORE_BASE64` | `base64 release.keystore` (Linux/Mac) or `certutil -encode release.keystore tmp.b64` (Windows) — paste content as one block |
| `KEYSTORE_PASSWORD` | password you set in step 2 |
| `KEY_ALIAS` | `android` |
| `KEY_PASSWORD` | key password |

## Build a release

**Option A — Tag-based** (also creates a GitHub Release):
```bash
git tag v1.0.0
git push origin v1.0.0
```

**Option B — Manual:** Actions → "Build Android via Capacitor" → Run workflow. Optionally set `version_code` and `version_name`.

The workflow:
1. Installs Capacitor + Android SDK on a fresh runner
2. Copies the PWA into `www/` (via `scripts/copy-web.js`)
3. Runs `npx cap add android` (or `cap sync` on subsequent builds)
4. Injects signing config into `android/app/build.gradle`
5. Runs `./gradlew bundleRelease assembleRelease`
6. Uploads `pachaka-lokam.aab` + `pachaka-lokam.apk` as workflow artifacts (and as a GitHub Release on tag pushes)

## What you upload

- **Play Store** → upload `pachaka-lokam.aab` to Play Console → Internal testing first.
- **Sideload / direct distribution** → share `pachaka-lokam.apk`. Users enable "Install unknown apps" for their browser, tap the APK, install. Works on any Android 5.0+ device.

## Local development (optional — needs Node + JDK installed)

```bash
npm install
npm run build           # Copies PWA → www/
npx cap add android     # First time only
npx cap sync android
npx cap open android    # Opens in Android Studio (not required, just convenient)
```

To test the web app without Capacitor: just open `index.html` in any browser, or serve with `python -m http.server` from the repo root.

## PWA install eligibility (for the website)

The website at `https://pachakalokam.prashobhpaul.com` is fully install-eligible:
- ✅ HTTPS
- ✅ `manifest.webmanifest` with `name`, `short_name`, `start_url`, `scope`, `display: standalone`, `theme_color`, `background_color`
- ✅ 192×192 + 512×512 + maskable icons
- ✅ Service worker registered with a fetch handler
- ✅ Install button appears in the header on Chrome/Edge once the `beforeinstallprompt` fires
- ✅ iOS Safari users see "Add to Home Screen" instructions

Side-loadable on **any Android 5.0+** device through Chrome's "Install app" prompt — no Play Store needed if the user prefers PWA install.

## Updating the app

For each new release:
1. Bump `version` in `package.json` (informational).
2. Push tag `vX.Y.Z` (or use workflow_dispatch with `version_code` + `version_name`).
3. Download `.aab` from GitHub Release / Actions artifacts.
4. Upload to Play Console → release → review → roll out.

The `versionCode` must increase by ≥1 each upload. Use the workflow_dispatch input or edit `android/app/build.gradle` if you've checked the `android/` folder in.
