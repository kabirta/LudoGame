import {
  get,
  onValue,
  ref,
  remove,
  set,
  update,
} from 'firebase/database';

import {db} from './config';

export const MATCHMAKING_WAIT_TIME_SECONDS = 60;
export const ENTRY_FEE_LABEL = 'FREE';
export const MATCHMAKING_CONTESTS = [
  {id: 'starter-50', prizePool: 1, entryFee: ENTRY_FEE_LABEL},
  {id: 'classic-100', prizePool: 100, entryFee: ENTRY_FEE_LABEL},
  {id: 'pro-250', prizePool: 250, entryFee: ENTRY_FEE_LABEL},
  {id: 'elite-500', prizePool: 500, entryFee: ENTRY_FEE_LABEL},
];

const MATCHMAKING_CONTESTS_BY_ID = MATCHMAKING_CONTESTS.reduce(
  (accumulator, contest) => {
    accumulator[contest.id] = contest;
    return accumulator;
  },
  {},
);

export const normalizeContestId = contestId => `${contestId ?? ''}`.trim();

export const getMatchmakingContest = contestId =>
  MATCHMAKING_CONTESTS_BY_ID[normalizeContestId(contestId)] ?? null;

const normalizeActivePlayerCount = activePlayerCount =>
  Number.isFinite(activePlayerCount) && activePlayerCount > 0
    ? Math.floor(activePlayerCount)
    : 0;

const buildDefaultContestBoard = contestId => {
  const normalizedContestId = normalizeContestId(contestId);
  const contest = getMatchmakingContest(normalizedContestId);

  return {
    id: normalizedContestId,
    prizePool: contest?.prizePool ?? 0,
    entryFee: contest?.entryFee ?? ENTRY_FEE_LABEL,
    activeRoundId: null,
    activeRoundStartedAt: null,
    activeRoundEndsAt: null,
    activePlayerCount: 0,
    status: 'idle',
    updatedAt: null,
  };
};

const normalizeContestBoard = (contestId, contestBoard) => {
  const defaultContestBoard = buildDefaultContestBoard(contestId);

  if (!contestBoard || typeof contestBoard !== 'object') {
    return defaultContestBoard;
  }

  return {
    ...defaultContestBoard,
    ...contestBoard,
    id: defaultContestBoard.id,
    prizePool:
      typeof contestBoard.prizePool === 'number'
        ? contestBoard.prizePool
        : defaultContestBoard.prizePool,
    entryFee:
      typeof contestBoard.entryFee === 'string' && contestBoard.entryFee.trim()
        ? contestBoard.entryFee
        : defaultContestBoard.entryFee,
    activeRoundId:
      typeof contestBoard.activeRoundId === 'string' && contestBoard.activeRoundId.trim()
        ? contestBoard.activeRoundId
        : null,
    activeRoundStartedAt:
      typeof contestBoard.activeRoundStartedAt === 'number'
        ? contestBoard.activeRoundStartedAt
        : null,
    activeRoundEndsAt:
      typeof contestBoard.activeRoundEndsAt === 'number'
        ? contestBoard.activeRoundEndsAt
        : null,
    activePlayerCount: normalizeActivePlayerCount(contestBoard.activePlayerCount),
    status:
      typeof contestBoard.status === 'string' && contestBoard.status.trim()
        ? contestBoard.status
        : defaultContestBoard.status,
    updatedAt:
      typeof contestBoard.updatedAt === 'number'
        ? contestBoard.updatedAt
        : defaultContestBoard.updatedAt,
  };
};

const buildContestBoardMap = contests =>
  MATCHMAKING_CONTESTS.reduce((accumulator, contest) => {
    accumulator[contest.id] = normalizeContestBoard(
      contest.id,
      contests?.[contest.id] ?? null,
    );
    return accumulator;
  }, {});

const getUserQueuePaths = async (contestId, uid) => {
  const normalizedContestId = normalizeContestId(contestId);
  const normalizedUid = `${uid ?? ''}`.trim();

  if (!normalizedContestId || !normalizedUid) {
    return [];
  }

  const contestQueueSnapshot = await get(
    ref(db, `matchmaking/queues/${normalizedContestId}`),
  );

  if (!contestQueueSnapshot.exists()) {
    return [];
  }

  const queuePaths = [];
  contestQueueSnapshot.forEach(roundSnapshot => {
    if (roundSnapshot.child(normalizedUid).exists()) {
      queuePaths.push(
        `matchmaking/queues/${normalizedContestId}/${roundSnapshot.key}/${normalizedUid}`,
      );
    }
  });

  return queuePaths;
};

export const clearPlayerMatchmakingState = async uid => {
  const normalizedUid = `${uid ?? ''}`.trim();

  if (!normalizedUid) {
    return;
  }

  const updates = {
    [`matchmaking/playerAssignments/${normalizedUid}`]: null,
  };

  await Promise.all(
    MATCHMAKING_CONTESTS.map(async contest => {
      updates[`matchmaking/joinRequests/${contest.id}/${normalizedUid}`] = null;

      const queuePaths = await getUserQueuePaths(contest.id, normalizedUid);
      queuePaths.forEach(queuePath => {
        updates[queuePath] = null;
      });
    }),
  );

  await update(ref(db), updates);
};

export const joinContestQueue = async ({contestId, uid, name}) => {
  const normalizedContestId = normalizeContestId(contestId);
  const normalizedUid = `${uid ?? ''}`.trim();
  const contest = getMatchmakingContest(normalizedContestId);

  if (!contest) {
    throw new Error('Invalid contest board selected.');
  }

  if (!normalizedUid) {
    throw new Error('A signed-in user is required for matchmaking.');
  }

  await clearPlayerMatchmakingState(normalizedUid);

  const requestedAt = Date.now();
  const joinRequest = {
    contestId: normalizedContestId,
    userId: normalizedUid,
    name: `${name ?? 'Player'}`.trim() || 'Player',
    requestedAt,
  };

  await set(
    ref(db, `matchmaking/joinRequests/${normalizedContestId}/${normalizedUid}`),
    joinRequest,
  );

  return {
    ...contest,
    requestedAt,
  };
};

export const cancelContestQueue = async ({
  contestId,
  uid,
  clearAssignment = true,
}) => {
  const normalizedContestId = normalizeContestId(contestId);
  const normalizedUid = `${uid ?? ''}`.trim();

  if (!normalizedUid) {
    return;
  }

  const updates = {};

  if (clearAssignment) {
    updates[`matchmaking/playerAssignments/${normalizedUid}`] = null;
  }

  if (!normalizedContestId) {
    await clearPlayerMatchmakingState(normalizedUid);
    return;
  }

  updates[`matchmaking/joinRequests/${normalizedContestId}/${normalizedUid}`] = null;
  const queuePaths = await getUserQueuePaths(normalizedContestId, normalizedUid);

  queuePaths.forEach(queuePath => {
    updates[queuePath] = null;
  });

  if (Object.keys(updates).length === 0) {
    return;
  }

  await update(ref(db), updates);
};

export const subscribeToContestBoards = callback =>
  onValue(ref(db, 'matchmaking/contests'), snapshot => {
    const nextContestBoards = buildContestBoardMap(
      snapshot.exists() ? snapshot.val() : null,
    );
    callback(nextContestBoards);
  });

export const subscribeToContestBoard = (contestId, callback) => {
  const normalizedContestId = normalizeContestId(contestId);
  const contest = getMatchmakingContest(normalizedContestId);

  if (!contest) {
    callback(buildDefaultContestBoard(normalizedContestId));
    return () => {};
  }

  return onValue(
    ref(db, `matchmaking/contests/${normalizedContestId}`),
    snapshot => {
      callback(
        normalizeContestBoard(
          normalizedContestId,
          snapshot.exists() ? snapshot.val() : null,
        ),
      );
    },
  );
};

export const subscribeToPlayerAssignment = (uid, callback) => {
  const normalizedUid = `${uid ?? ''}`.trim();

  if (!normalizedUid) {
    callback(null);
    return () => {};
  }

  return onValue(ref(db, `matchmaking/playerAssignments/${normalizedUid}`), snapshot => {
    callback(snapshot.exists() ? snapshot.val() : null);
  });
};

export const requestContestRoundProcessing = async ({contestId, roundId, uid}) => {
  const normalizedContestId = normalizeContestId(contestId);
  const normalizedRoundId = `${roundId ?? ''}`.trim();
  const normalizedUid = `${uid ?? ''}`.trim();

  if (!getMatchmakingContest(normalizedContestId)) {
    throw new Error('Invalid contest board selected.');
  }

  if (!normalizedRoundId) {
    throw new Error('Round ID is required to process matchmaking.');
  }

  if (!normalizedUid) {
    throw new Error('A signed-in user is required for matchmaking.');
  }

  await set(
    ref(
      db,
      `matchmaking/processRequests/${normalizedContestId}/${normalizedRoundId}/${normalizedUid}`,
    ),
    {
      contestId: normalizedContestId,
      roundId: normalizedRoundId,
      userId: normalizedUid,
      createdAt: Date.now(),
    },
  );
};

export const clearPlayerAssignment = uid => {
  const normalizedUid = `${uid ?? ''}`.trim();

  if (!normalizedUid) {
    return Promise.resolve();
  }

  return remove(ref(db, `matchmaking/playerAssignments/${normalizedUid}`));
};
