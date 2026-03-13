const {buildInitialOnlineGameState} = require('./gameEngine');

const ROOM_CODE_LENGTH = 6;
const MATCH_TIME_LIMIT_SECONDS = 8 * 60;
const MATCHMAKING_WAIT_TIME_SECONDS = 60;
const ENTRY_FEE_LABEL = 'FREE';

const MATCHMAKING_CONTESTS = [
  {id: 'starter-50', prizePool: 50, entryFee: ENTRY_FEE_LABEL},
  {id: 'classic-100', prizePool: 100, entryFee: ENTRY_FEE_LABEL},
  {id: 'pro-250', prizePool: 250, entryFee: ENTRY_FEE_LABEL},
  {id: 'elite-500', prizePool: 500, entryFee: ENTRY_FEE_LABEL},
];

const MATCHMAKING_CONTESTS_BY_ID = MATCHMAKING_CONTESTS.reduce((accumulator, contest) => {
  accumulator[contest.id] = contest;
  return accumulator;
}, {});

const getContestConfig = contestId => MATCHMAKING_CONTESTS_BY_ID[contestId] ?? null;

const createRoomCode = () =>
  `${Math.floor(Math.random() * 9 * 10 ** (ROOM_CODE_LENGTH - 1)) + 10 ** (ROOM_CODE_LENGTH - 1)}`;

const createRoundId = (contestId, now, randomFn = Math.random) =>
  `${contestId}-${now}-${Math.floor(randomFn() * 100000).toString().padStart(5, '0')}`;

const buildFreshContestRound = ({contestId, now, randomFn = Math.random}) => {
  const contest = getContestConfig(contestId);

  return {
    id: contestId,
    prizePool: contest?.prizePool ?? 0,
    entryFee: contest?.entryFee ?? ENTRY_FEE_LABEL,
    activeRoundId: createRoundId(contestId, now, randomFn),
    activeRoundStartedAt: now,
    activeRoundEndsAt: now + MATCHMAKING_WAIT_TIME_SECONDS * 1000,
    activePlayerCount: 0,
    status: 'collecting',
    updatedAt: now,
  };
};

const normalizeContestState = ({contestId, contest, now, randomFn = Math.random}) => {
  const config = getContestConfig(contestId);
  const baseContest = {
    id: contestId,
    prizePool: config?.prizePool ?? 0,
    entryFee: config?.entryFee ?? ENTRY_FEE_LABEL,
    activeRoundId: null,
    activeRoundStartedAt: null,
    activeRoundEndsAt: null,
    activePlayerCount: 0,
    status: 'idle',
    updatedAt: now,
    ...(contest ?? {}),
  };

  if (
    baseContest.status === 'collecting' &&
    typeof baseContest.activeRoundId === 'string' &&
    baseContest.activeRoundId &&
    typeof baseContest.activeRoundEndsAt === 'number' &&
    baseContest.activeRoundEndsAt > now &&
    (baseContest.activePlayerCount ?? 0) > 0
  ) {
    return baseContest;
  }

  return {
    ...baseContest,
    ...buildFreshContestRound({contestId, now, randomFn}),
  };
};

const clearContestRoundState = ({contestId, contest, now}) => {
  const config = getContestConfig(contestId);

  return {
    ...(contest ?? {}),
    id: contestId,
    prizePool: config?.prizePool ?? 0,
    entryFee: config?.entryFee ?? ENTRY_FEE_LABEL,
    activeRoundId: null,
    activeRoundStartedAt: null,
    activeRoundEndsAt: null,
    activePlayerCount: 0,
    status: 'idle',
    updatedAt: now,
    lastProcessedRoundId: contest?.activeRoundId ?? contest?.lastProcessedRoundId ?? null,
    lastProcessedAt: now,
  };
};

const buildQueuePlayer = ({contestId, roundId, uid, name, now, roundEndsAt}) => ({
  userId: uid,
  contestId,
  roundId,
  name,
  joinedAt: now,
  roundEndsAt,
});

const buildWaitingAssignment = ({contestId, roundId, uid, now, roundEndsAt}) => ({
  status: 'waiting',
  contestId,
  roundId,
  userId: uid,
  joinedAt: now,
  expiresAt: roundEndsAt,
});

const normalizeRoundPlayers = roundQueue =>
  Object.entries(roundQueue ?? {})
    .filter(([, queuePlayer]) => Boolean(queuePlayer && typeof queuePlayer === 'object'))
    .map(([queueKey, queuePlayer]) => ({
      ...queuePlayer,
      queueKey,
      userId: queuePlayer?.userId ?? queueKey,
    }))
    .sort((leftPlayer, rightPlayer) => {
      const leftJoinedAt = leftPlayer?.joinedAt ?? 0;
      const rightJoinedAt = rightPlayer?.joinedAt ?? 0;

      if (leftJoinedAt === rightJoinedAt) {
        return leftPlayer.userId.localeCompare(rightPlayer.userId);
      }

      return leftJoinedAt - rightJoinedAt;
    });

const shufflePlayers = (players, randomFn = Math.random) => {
  const shuffledPlayers = [...players];

  for (let index = shuffledPlayers.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(randomFn() * (index + 1));
    [shuffledPlayers[index], shuffledPlayers[randomIndex]] = [
      shuffledPlayers[randomIndex],
      shuffledPlayers[index],
    ];
  }

  return shuffledPlayers;
};

const pairPlayersForRound = (players, randomFn = Math.random) => {
  const randomizedPlayers = shufflePlayers(players, randomFn);
  const pairs = [];

  for (let index = 0; index + 1 < randomizedPlayers.length; index += 2) {
    pairs.push([randomizedPlayers[index], randomizedPlayers[index + 1]]);
  }

  return {
    pairs,
    unmatchedPlayer:
      randomizedPlayers.length % 2 === 1
        ? randomizedPlayers[randomizedPlayers.length - 1]
        : null,
  };
};

const buildMatchmakingRoom = ({roomId, contestId, roundId, player1, player2, now}) => {
  const contest = getContestConfig(contestId);
  const game = buildInitialOnlineGameState(now);

  return {
    code: roomId,
    contestId,
    prizePool: contest?.prizePool ?? 0,
    entryFee: contest?.entryFee ?? ENTRY_FEE_LABEL,
    status: 'playing',
    currentTurn: player1.userId,
    startTime: now,
    timeLimit: MATCH_TIME_LIMIT_SECONDS,
    endTime: null,
    winner: null,
    createdAt: now,
    updatedAt: now,
    hostUid: player1.userId,
    players: {
      player1: {
        uid: player1.userId,
        name: player1?.name ?? 'Player 1',
        connected: true,
      },
      player2: {
        uid: player2.userId,
        name: player2?.name ?? 'Player 2',
        connected: true,
      },
    },
    matchmaking: {
      contestId,
      roundId,
      prizePool: contest?.prizePool ?? 0,
      entryFee: contest?.entryFee ?? ENTRY_FEE_LABEL,
      matchedAt: now,
      waitTimeSeconds: MATCHMAKING_WAIT_TIME_SECONDS,
    },
    game,
  };
};

const buildMatchedAssignment = ({roomId, contestId, roundId, playerNo, player, opponent, now}) => ({
  status: 'matched',
  roomId,
  contestId,
  roundId,
  playerNo,
  userId: player.userId,
  opponentId: opponent.userId,
  opponentName: opponent?.name ?? `Player ${playerNo === 1 ? 2 : 1}`,
  matchedAt: now,
});

const buildUnmatchedAssignment = ({contestId, roundId, player, now}) => ({
  status: 'unmatched',
  contestId,
  roundId,
  userId: player.userId,
  message: 'Opponent not found. Try again.',
  resolvedAt: now,
});

module.exports = {
  ENTRY_FEE_LABEL,
  MATCHMAKING_CONTESTS,
  MATCHMAKING_WAIT_TIME_SECONDS,
  buildFreshContestRound,
  buildMatchedAssignment,
  buildMatchmakingRoom,
  buildQueuePlayer,
  buildUnmatchedAssignment,
  buildWaitingAssignment,
  clearContestRoundState,
  createRoomCode,
  createRoundId,
  getContestConfig,
  normalizeContestState,
  normalizeRoundPlayers,
  pairPlayersForRound,
  shufflePlayers,
};
