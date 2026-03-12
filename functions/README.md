# Firebase Functions

This folder processes online Ludo room actions from Realtime Database.

## What it does

- listens to `roomActions/{roomId}/{actionId}`
- validates turn order and player identity
- rolls dice on the server
- applies token movement and captures
- grants extra turns for `6`, capture, or reaching home
- writes the authoritative game state back to `rooms/{roomId}/game`
- marks processed actions as `processed` or `rejected`
- runs a scheduled sweep to expire stale turns

## Before deploying

1. Enable `Anonymous` sign-in in Firebase Authentication.
2. Publish the Realtime Database rules from `../database.rules.json`.
3. Install the Firebase CLI and log in.

## Install and deploy

```bash
cd functions
npm install
cd ..
firebase use ludo-zeng
firebase deploy --only "database,functions"
```

## Notes

- `expireOnlineTurns` uses Cloud Scheduler with a 1-minute cadence. It is a best-effort timeout sweep, not an exact 15-second timer.
- The client is still using Realtime Database. Data Connect / PostgreSQL is not part of this flow.
