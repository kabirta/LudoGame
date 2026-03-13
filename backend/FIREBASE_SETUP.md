# Firebase Setup For Online Rooms

This app's online room flow depends on:

- Firebase Authentication
- Firebase Realtime Database

The checked-in Firebase client config already points to project `ludo-zeng`:

- JS runtime config: `src/firebase/runtimeConfig.js`
- Android config: `google-services.json`

## Confirmed current blocker

A direct check against the configured Firebase project returned:

- `auth/admin-restricted-operation`

That means Anonymous Authentication is currently disabled for this Firebase project, so `ensureSignedIn()` fails before the app can create or join a room.

## Required Firebase Console changes

### 1. Enable Anonymous Authentication

In Firebase Console for project `ludo-zeng`:

1. Open `Authentication`
2. Open `Sign-in method`
3. Enable `Anonymous`

Without this, `Play Online`, `Create Room`, and `Join Room` will fail.

### 2. Configure Realtime Database rules

The app reads and writes these paths:

- `/rooms`
- `/roomActions`
- `/users`

Minimum rules for the current client implementation:

```json
{
  "rules": {
    "rooms": {
      ".read": "auth != null",
      ".write": "auth != null",
      ".indexOn": ["status"]
    },
    "roomActions": {
      ".read": "auth != null",
      ".write": "auth != null"
    },
    "users": {
      ".read": "auth != null",
      ".write": "auth != null"
    }
  }
}
```

These rules are intentionally minimal. They are enough for the current client-side room flow, but they are not sufficient for a hardened production multiplayer backend.

## Notes

- `google-services.json` mismatch is not the current issue; the Firebase project IDs and app IDs in this repo are consistent.
- The app now queues room actions through `roomActions/{roomId}/{actionId}` and expects the Firebase Functions backend to process them.
