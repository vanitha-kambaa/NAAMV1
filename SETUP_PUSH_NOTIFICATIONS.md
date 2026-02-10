# Setup Push Notifications - Quick Guide

## Current Status
✅ Code is working correctly
✅ Login works without push token
⚠️ Push notifications disabled (invalid projectId format)

## To Enable Push Notifications

### Step 1: Install EAS CLI
```bash
npm install -g eas-cli
```

### Step 2: Login to Expo
```bash
eas login
```
(If you don't have an account, create one at https://expo.dev)

### Step 3: Initialize EAS in your project
```bash
cd /Users/kambaa/Documents/NAAMV1
eas init
```

This will:
- Create an `eas.json` file
- Link your project to Expo
- Generate a UUID projectId

### Step 4: Get your projectId
After running `eas init`, check:

**Option A: Check `eas.json`**
```json
{
  "project": {
    "id": "your-project-id-uuid-here"
  }
}
```

**Option B: Check updated `app.json`**
The projectId should be automatically added to `app.json` under `extra.eas.projectId`

**Option C: Run command**
```bash
eas project:info
```

### Step 5: Verify in app.json
Make sure `app.json` has:
```json
"extra": {
  "eas": {
    "projectId": "your-actual-uuid-project-id-here"
  }
}
```

### Step 6: Rebuild the app
```bash
# For Android
npx expo run:android

# For iOS
npx expo run:ios
```

## Important Notes

- **Firebase projectId (`namm-105d6`) cannot be used** - Expo requires UUID format
- **Expo projectId format**: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx` (UUID)
- Login will work without push token, but notifications won't be sent until projectId is configured

## Alternative: Use Firebase FCM Directly

If you prefer to use Firebase Cloud Messaging directly instead of Expo Push Notifications, you would need to:
1. Install `@react-native-firebase/messaging`
2. Replace Expo push token code with Firebase FCM token code
3. This requires more setup but doesn't need Expo projectId
