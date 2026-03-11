# Online Play Integration Plan

This project already has local Ludo game state in `src/redux/reducers/initialState.js`,
move flow in `src/redux/reducers/GameAction.js`, and the board UI in
`src/screens/LudoBoardScreen.js`.

The Firebase client files added in `src/firebase/` are the app-side foundation:

- `src/firebase/config.js`
- `src/firebase/auth.js`
- `src/firebase/rooms.js`

## 1. Install and configure Firebase

1. Install the dependency:
   `npm install firebase`
2. Keep the Android `google-services.json` in the project root so the app and
   native build can configure Firebase services.
3. Keep the JS runtime Firebase config in `src/firebase/runtimeConfig.js`.

## 2. Home screen integration

Use `HomeScreen` as the entry point for online matchmaking.

### Play Online

Current `Play Online` button in `src/screens/HomeScreen.js` should:

1. call `ensureSignedIn('Player')`
2. try to find a waiting room
3. if found, call `joinRoom`
4. if not found, call `createRoom`
5. navigate to `LudoBoardScreen` with:

```js
navigation.navigate('LudoBoardScreen', {
  roomId,
  gameMode: 'online',
  playerNo,
});
```

### Create Room

Add a dedicated create-room action for private matches:

1. call `ensureSignedIn`
2. call `createRoom({uid, name})`
3. show the room code
4. navigate to `LudoBoardScreen` in waiting state

### Join Room

Add a join-room prompt:

1. collect room code from the user
2. call `ensureSignedIn`
3. call `joinRoom({roomId, uid, name})`
4. navigate to `LudoBoardScreen` as `playerNo: 2`

## 3. Board screen integration

In `src/screens/LudoBoardScreen.js`:

1. read `roomId`, `gameMode`, and `playerNo` from route params
2. if `gameMode !== 'online'`, keep current offline behavior
3. if `gameMode === 'online'`:
   - subscribe with `subscribeToRoomGame(roomId, callback)`
   - dispatch `hydrateGameFromServer(game)`
   - render waiting UI until `room.status === 'playing'`

Suggested effect:

```js
useEffect(() => {
  if (gameMode !== 'online' || !roomId) {
    return undefined;
  }

  const unsubscribe = subscribeToRoomGame(roomId, game => {
    if (game) {
      dispatch(hydrateGameFromServer(game));
    }
  });

  return unsubscribe;
}, [dispatch, gameMode, roomId]);
```

## 4. Replace local authoritative actions

Current local move logic lives in `src/redux/reducers/GameAction.js`.

For online mode:

- dice press should call `queueRoomAction({type: 'ROLL_DICE'})`
- token tap should call `queueRoomAction({type: 'MOVE_TOKEN', payload: {pieceId}})`

That means:

1. keep the current local logic for offline mode
2. branch by `gameMode`
3. let Firebase-backed server logic write the final game state

## 5. Server-side responsibilities

Create Firebase Cloud Functions later under a separate functions project.

Server must:

- validate player turn
- generate dice result
- reject invalid piece moves
- apply capture rules
- apply home bonus
- apply extra roll logic
- enforce third consecutive `6`
- enforce 15-second timeout skip
- decide the winner

Clients should not directly write final game state in online mode.

## 6. Recommended rollout order

1. Firebase auth
2. room create/join
3. board subscription
4. hydrate reducer wired to realtime updates
5. online dice action queue
6. online move action queue
7. Cloud Functions game engine
8. disconnect and reconnect handling
