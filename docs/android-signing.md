# Local Android signing

Debug and release APKs use the same private Poketch signing key.
The Expo plugin `plugins/with-local-signing.js` reapplies the configuration
when Android is regenerated. Do not edit generated Gradle files by hand.

## First setup (already completed on the original PC)

`npm run signing:setup` creates `.local-signing/poketch.jks` and
`.local-signing/signing.properties`. It never overwrites an existing setup.
The properties file contains the randomly generated password. Neither file
belongs in Git, an APK, a chat message, or a public upload.

Back up the ENTIRE `.local-signing` folder to secure storage outside this
project/PC. The key is outside `android` so prebuild regeneration preserves it.
On another PC, restore this folder instead of generating a different key.

## Build on Windows

From the project root:

```powershell
npx expo prebuild --platform android --no-install
cd android
.\gradlew.bat assembleRelease
cd ..
```

APK: `android/app/build/outputs/apk/release/app-release.apk`.
Increase `expo.android.versionCode` in app.json when distributing a newer APK.
Local Gradle builds do not use EAS remote version auto-increment.

An APK previously signed with the template debug key cannot normally be
updated in place with this key. Do not uninstall a user's existing app without
backing up their save data. Sharing a key does not make debug builds suitable
for distribution: distribute release builds, which contain the JS bundle.

EAS Update publishing does not require this Android signing key. It still
requires the configured channel, platform, and runtime version to match.

This plugin is configured for local builds. Switching to EAS cloud builds
requires deliberately configuring that service to use this SAME key; the
Git-ignored signing folder is not available in cloud builds automatically.
