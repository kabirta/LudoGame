const admin = require('firebase-admin');
const functions = require('firebase-functions/v1');

const {applyRoomAction, expireTurn} = require('./src/gameEngine');
const {
  MATCHMAKING_CONTESTS,
  buildMatchedAssignment,
  buildMatchmakingRoom,
  buildQueuePlayer,
  buildUnmatchedAssignment,
  buildWaitingAssignment,
  clearContestRoundState,
  createRoomCode,
  getContestConfig,
  normalizeContestState,
  normalizeRoundPlayers,
  pairPlayersForRound,
} = require('./src/matchmakingEngine');
const {creditFinishedRoomPrize} = require('./src/walletEngine');

admin.initializeApp();

const db = admin.database();
const MAX_ROOM_CODE_ATTEMPTS = 16;

const createUniqueRoomCode = async () => {
  for (let attempt = 0; attempt < MAX_ROOM_CODE_ATTEMPTS; attempt += 1) {
    const roomId = createRoomCode();
    const snapshot = await db.ref(`rooms/${roomId}`).get();

    if (!snapshot.exists()) {
      return roomId;
    }
  }

  throw new Error('Could not generate a unique matchmaking room code.');
};

const processContestRound = async (contestId, expectedRoundId = null) => {
  if (!getContestConfig(contestId)) {
    return {
      contestId,
      matchedCount: 0,
      unmatchedCount: 0,
      processed: false,
    };
  }

  const contestRef = db.ref(`matchmaking/contests/${contestId}`);
  const lockNow = Date.now();
  let roundIdToProcess = null;

  const lockResult = await contestRef.transaction(currentContest => {
    if (!currentContest || typeof currentContest !== 'object') {
      return currentContest;
    }

    if (!currentContest.activeRoundId || currentContest.status === 'processing') {
      return currentContest;
    }

    if (expectedRoundId && currentContest.activeRoundId !== expectedRoundId) {
      return currentContest;
    }

    if (
      typeof currentContest.activeRoundEndsAt !== 'number' ||
      currentContest.activeRoundEndsAt > lockNow
    ) {
      return currentContest;
    }

    roundIdToProcess = currentContest.activeRoundId;

    return {
      ...currentContest,
      status: 'processing',
      updatedAt: lockNow,
    };
  });

  if (!lockResult.committed || !roundIdToProcess) {
    return {
      contestId,
      matchedCount: 0,
      unmatchedCount: 0,
      processed: false,
    };
  }

  const roundId = roundIdToProcess;
  const matchedAt = Date.now();
  const queueSnapshot = await db.ref(`matchmaking/queues/${contestId}/${roundId}`).get();
  const roundPlayers = normalizeRoundPlayers(
    queueSnapshot.exists() ? queueSnapshot.val() : null,
  );
  const {pairs, unmatchedPlayer} = pairPlayersForRound(roundPlayers);
  const rootUpdates = {
    [`matchmaking/processRequests/${contestId}/${roundId}`]: null,
    [`matchmaking/queues/${contestId}/${roundId}`]: null,
  };

  for (const [player1, player2] of pairs) {
    const roomId = await createUniqueRoomCode();
    const room = buildMatchmakingRoom({
      roomId,
      contestId,
      roundId,
      player1,
      player2,
      now: matchedAt,
    });

    rootUpdates[`rooms/${roomId}`] = room;
    rootUpdates[`matchmaking/playerAssignments/${player1.userId}`] =
      buildMatchedAssignment({
        roomId,
        contestId,
        roundId,
        playerNo: 1,
        player: player1,
        opponent: player2,
        now: matchedAt,
      });
    rootUpdates[`matchmaking/playerAssignments/${player2.userId}`] =
      buildMatchedAssignment({
        roomId,
        contestId,
        roundId,
        playerNo: 2,
        player: player2,
        opponent: player1,
        now: matchedAt,
      });
  }

  if (unmatchedPlayer) {
    rootUpdates[`matchmaking/playerAssignments/${unmatchedPlayer.userId}`] =
      buildUnmatchedAssignment({
        contestId,
        roundId,
        player: unmatchedPlayer,
        now: matchedAt,
      });
  }

  await db.ref().update(rootUpdates);

  const cleanupNow = Date.now();
  await contestRef.transaction(currentContest => {
    if (!currentContest || currentContest.activeRoundId !== roundId) {
      return currentContest;
    }

    return clearContestRoundState({
      contestId,
      contest: currentContest,
      now: cleanupNow,
    });
  });

  return {
    contestId,
    matchedCount: pairs.length,
    unmatchedCount: unmatchedPlayer ? 1 : 0,
    processed: true,
    roundId,
  };
};

const processContestJoinRequest = async (contestId, userId) => {
  if (!getContestConfig(contestId)) {
    return null;
  }

  const joinRequestRef = db.ref(`matchmaking/joinRequests/${contestId}/${userId}`);
  const joinRequestSnapshot = await joinRequestRef.get();

  if (!joinRequestSnapshot.exists()) {
    return null;
  }

  const currentRequest = joinRequestSnapshot.val();
  if (!currentRequest || currentRequest.userId !== userId) {
    await joinRequestRef.remove();
    return null;
  }

  const now = Date.now();
  const contestSnapshot = await db.ref(`matchmaking/contests/${contestId}`).get();
  const currentContest = contestSnapshot.exists() ? contestSnapshot.val() : null;

  if (
    currentContest?.activeRoundId &&
    currentContest?.status === 'collecting' &&
    typeof currentContest?.activeRoundEndsAt === 'number' &&
    currentContest.activeRoundEndsAt <= now
  ) {
    await processContestRound(contestId, currentContest.activeRoundId);
  }

  const contestRef = db.ref(`matchmaking/contests/${contestId}`);
  const allocationNow = Date.now();
  const allocationResult = await contestRef.transaction(currentContestState => {
    const nextContest = normalizeContestState({
      contestId,
      contest: currentContestState,
      now: allocationNow,
    });

    return {
      ...nextContest,
      activePlayerCount: (nextContest.activePlayerCount ?? 0) + 1,
      status: 'collecting',
      updatedAt: allocationNow,
    };
  });

  if (!allocationResult.committed || !allocationResult.snapshot.exists()) {
    return null;
  }

  const contest = allocationResult.snapshot.val();
  const roundId = contest.activeRoundId;
  const roundEndsAt = contest.activeRoundEndsAt;
  const queuePlayer = buildQueuePlayer({
    contestId,
    roundId,
    uid: userId,
    name: currentRequest?.name ?? 'Player',
    now: allocationNow,
    roundEndsAt,
  });

  await db.ref().update({
    [`matchmaking/queues/${contestId}/${roundId}/${userId}`]: queuePlayer,
    [`matchmaking/playerAssignments/${userId}`]: buildWaitingAssignment({
      contestId,
      roundId,
      uid: userId,
      now: allocationNow,
      roundEndsAt,
    }),
    [`matchmaking/joinRequests/${contestId}/${userId}`]: null,
  });

  return {
    contestId,
    roundId,
    roundEndsAt,
  };
};

const releaseContestPlayerSlot = async (contestId, roundId) => {
  const contestRef = db.ref(`matchmaking/contests/${contestId}`);
  const now = Date.now();

  await contestRef.transaction(currentContest => {
    if (
      !currentContest ||
      currentContest.activeRoundId !== roundId ||
      currentContest.status !== 'collecting'
    ) {
      return currentContest;
    }

    const nextPlayerCount = Math.max((currentContest.activePlayerCount ?? 0) - 1, 0);

    if (nextPlayerCount === 0) {
      return clearContestRoundState({
        contestId,
        contest: currentContest,
        now,
      });
    }

    return {
      ...currentContest,
      activePlayerCount: nextPlayerCount,
      updatedAt: now,
    };
  });
};

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

exports.creditRoomPrizeOnFinish = functions.database
  .ref('/rooms/{roomId}')
  .onWrite(async (change, context) => {
    if (!change.after.exists()) {
      return null;
    }

    const room = change.after.val();
    const isFinishedRoom =
      room?.status === 'finished' || room?.game?.winner != null;

    if (!isFinishedRoom) {
      return null;
    }

    try {
      await creditFinishedRoomPrize({
        room,
        roomId: context.params.roomId,
      });
    } catch (error) {
      console.error(
        `Failed to settle room prize for ${context.params.roomId}.`,
        error,
      );
      throw error;
    }

    return null;
  });

exports.acceptMatchmakingJoinRequest = functions.database
  .ref('/matchmaking/joinRequests/{contestId}/{userId}')
  .onCreate(async (snapshot, context) => {
    const {contestId, userId} = context.params;
    await processContestJoinRequest(contestId, userId);
    return null;
  });

exports.releaseMatchmakingQueuePlayer = functions.database
  .ref('/matchmaking/queues/{contestId}/{roundId}/{userId}')
  .onDelete(async (_snapshot, context) => {
    const {contestId, roundId} = context.params;
    await releaseContestPlayerSlot(contestId, roundId);
    return null;
  });

exports.processMatchmakingRoundRequest = functions.database
  .ref('/matchmaking/processRequests/{contestId}/{roundId}/{userId}')
  .onCreate(async (snapshot, context) => {
    const {contestId, roundId} = context.params;
    await processContestRound(contestId, roundId);
    await snapshot.ref.remove();
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

exports.expireMatchmakingQueues = functions.pubsub
  .schedule('every 1 minutes')
  .timeZone('UTC')
  .onRun(async () => {
    const contestsSnapshot = await db.ref('matchmaking/contests').get();
    const contestIds = new Set(MATCHMAKING_CONTESTS.map(contest => contest.id));

    if (contestsSnapshot.exists()) {
      contestsSnapshot.forEach(childSnapshot => {
        contestIds.add(childSnapshot.key);
      });
    }

    const now = Date.now();
    await Promise.all(
      Array.from(contestIds).map(async contestId => {
        const contest =
          contestsSnapshot.exists() && contestsSnapshot.child(contestId).exists()
            ? contestsSnapshot.child(contestId).val()
            : null;

        if (
          contest?.activeRoundId &&
          contest?.status === 'collecting' &&
          typeof contest?.activeRoundEndsAt === 'number' &&
          contest.activeRoundEndsAt <= now
        ) {
          await processContestRound(contestId, contest.activeRoundId);
        }
      }),
    );

    return null;
  });
