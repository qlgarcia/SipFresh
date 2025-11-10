# Android APK Build Guide

Quick reference guide for building Android APKs for SipFresh.

## Prerequisites Checklist

- [ ] Node.js (v16+) installed
- [ ] Java JDK (11+) installed
- [ ] Android Studio installed
- [ ] Android SDK installed (via Android Studio)
- [ ] Environment variables configured (`.env` file)

## Quick Build Steps

### 1. Build Web Assets
```bash
npm run build
```

### 2. Sync to Android
```bash
npx cap copy android
npx cap sync android
```

### 3. Open in Android Studio
```bash
npx cap open android
```

### 4. Build APK

**Debug APK (Unsigned):**
- Android Studio: Build > Build Bundle(s) / APK(s) > Build APK(s)
- Location: `android/app/build/outputs/apk/debug/app-debug.apk`

**Release APK (Signed):**
- Android Studio: Build > Generate Signed Bundle / APK
- Follow keystore creation wizard
- Location: `android/app/build/outputs/apk/release/app-release.apk`

## Testing on Device

### Via ADB
```bash
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

### Manual
1. Transfer APK to device
2. Enable "Install from Unknown Sources"
3. Open APK file on device
4. Install

## Common Issues

**Gradle Sync Failed:**
```bash
cd android
./gradlew clean
npx cap sync android
```

**Build Errors:**
- Ensure Android SDK is properly installed
- Check Java JDK version (11+)
- Verify `capacitor.config.ts` is correct

**App Crashes:**
- Check Firebase configuration in `.env`
- Verify PayPal Client ID is set
- Review Android logs: `adb logcat`

## Environment Variables Required

Make sure `.env` contains:
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_PAYPAL_CLIENT_ID`
- `VITE_PAYPAL_CURRENCY`

## Keystore Security

⚠️ **Never commit keystore files to version control!**

- Keep keystore in secure location
- Backup keystore and passwords
- Use different keystores for debug/release if needed

