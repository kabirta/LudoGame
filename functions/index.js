const admin = require('firebase-admin');
const functions = require('firebase-functions/v1');

const {applyRoomAction, expireTurn} = require('./src/gameEngine');

admin.initializeApp();

const db = admin.database();

exports.processRoomAction = functions.database
  .ref('/roomActions/{roomId}/{actionId}')
  .onCreate(async (snapshot, context) => {
    const action = snapshot.val();
    const {roomId, actionId} = context.params;
    const roomRef = db.ref(`rooms/${roomId}`);
    const now = Date.now();
    let outcome = {ok: false, reason: 'transaction-aborted'};

    const transactionResult = await roomRef.transaction(currentRoom => {
      const nextOutcome = applyRoomAction({
        room: currentRoom,
        action,
        roomId,
        actionId,
        now,
      });

      outcome = nextOutcome;

      if (!nextOutcome.ok) {
        return;
      }

      return nextOutcome.room;
    });

    if (!transactionResult.committed || !outcome.ok) {
      await snapshot.ref.update({
        status: 'rejected',
        processedAt: now,
        error: outcome.reason ?? 'transaction-aborted',
      });
      return null;
    }

    await snapshot.ref.update({
      status: 'processed',
      processedAt: now,
      result: outcome.result ?? null,
    });

    return null;
  });

exports.expireOnlineTurns = functions.pubsub
  .schedule('every 1 minutes')
  .timeZone('UTC')
  .onRun(async () => {
    const snapshot = await db
      .ref('rooms')
      .orderByChild('status')
      .equalTo('playing')
      .get();

    if (!snapshot.exists()) {
      return null;
    }

    const now = Date.now();
    const updates = [];

    snapshot.forEach(childSnapshot => {
      const roomId = childSnapshot.key;
      const roomRef = childSnapshot.ref;
      let outcome = {ok: false, reason: 'transaction-aborted'};

      updates.push(
        roomRef.transaction(currentRoom => {
          const nextOutcome = expireTurn({
            room: currentRoom,
            roomId,
            now,
          });

          outcome = nextOutcome;

          if (!nextOutcome.ok) {
            return;
          }

          return nextOutcome.room;
        }).then(result => ({
          roomId,
          committed: result.committed,
          outcome,
        })),
      );
    });

    await Promise.all(updates);
    return null;
  });
