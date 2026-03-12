const ACTIVE_PLAYERS = [1, 2];
const START_POSITION = 0;
const HOME_ENTRY_POSITION = 56;
const HOME_POSITION_INDEX = 56;
const HOME_BONUS = 56;
const HOME_LANE_LENGTH = 5;
const TURN_TIMEOUT_MS = 15000;
const MAX_MISSED_ROLLS = 3;

const SafeSpots = [
  221, 222, 223, 224, 225, 14, 27, 331, 332, 333, 334, 335, 40, 441, 442, 443,
  444, 445, 1, 111, 112, 113, 114, 115,
];

const StarSpots = [9, 22, 35, 48];

const PLAYER_CONFIGS = {
  1: {
    playerColor: 'yellow',
    startTile: 1,
    homeEntryTile: 51,
    homeLaneStart: 111,
  },
  2: {
    playerColor: 'red',
    startTile: 27,
    homeEntryTile: 25,
    homeLaneStart: 331,
  },
};

const clone = value => JSON.parse(JSON.stringify(value));

const getPlayerKey = playerNo => `player${playerNo}`;

const getNextActivePlayer = currentPlayer => {
  const index = ACTIVE_PLAYERS.indexOf(currentPlayer);
  if (index === -1) {
    return ACTIVE_PLAYERS[0];
  }

  return ACTIVE_PLAYERS[(index + 1) % ACTIVE_PLAYERS.length];
};

const getPlayerNoFromPieceId = pieceId => {
  const playerLetter = typeof pieceId === 'string' ? pieceId.slice(0, 1) : null;
  return playerLetter ? playerLetter.charCodeAt(0) - 64 : null;
};

const isSafeTile = tileId => SafeSpots.includes(tileId) || StarSpots.includes(tileId);

const getPawnPosition = pawn => {
  if (typeof pawn?.position === 'number') {
    return pawn.position;
  }

  if (pawn?.isHome) {
    return HOME_ENTRY_POSITION;
  }

  if (typeof pawn?.positionIndex === 'number' && pawn.positionIndex >= 0) {
    return pawn.positionIndex;
  }

  return START_POSITION;
};

const getLegacyPositionIndex = position => {
  if (position >= HOME_ENTRY_POSITION) {
    return HOME_POSITION_INDEX;
  }

  return Math.max(START_POSITION, position);
};

const withUpdatedPawnScore = pawn => {
  const position = Math.min(getPawnPosition(pawn), HOME_ENTRY_POSITION);
  const isHome = position >= HOME_ENTRY_POSITION;

  return {
    ...pawn,
    position,
    positionIndex: getLegacyPositionIndex(position),
    travelCount: position,
    isHome,
    pos: isHome ? 0 : pawn.pos,
    score: position + (isHome ? HOME_BONUS : 0),
  };
};

const getNextTileId = (playerNo, currentTileId, nextPosition) => {
  const config = PLAYER_CONFIGS[playerNo];

  if (!config) {
    return 0;
  }

  if (nextPosition <= START_POSITION) {
    return config.startTile;
  }

  if (nextPosition >= HOME_ENTRY_POSITION) {
    return 0;
  }

  if (!currentTileId) {
    return config.startTile;
  }

  if (currentTileId === config.homeEntryTile) {
    return config.homeLaneStart;
  }

  if (
    currentTileId >= config.homeLaneStart &&
    currentTileId < config.homeLaneStart + HOME_LANE_LENGTH - 1
  ) {
    return currentTileId + 1;
  }

  if (currentTileId === 52) {
    return 1;
  }

  return currentTileId + 1;
};

const createToken = (id, playerNo) =>
  withUpdatedPawnScore({
    id,
    playerColor: PLAYER_CONFIGS[playerNo]?.playerColor ?? 'red',
    position: START_POSITION,
    positionIndex: START_POSITION,
    score: 0,
    isHome: false,
    pos: PLAYER_CONFIGS[playerNo]?.startTile ?? 0,
    travelCount: 0,
  });

const canMoveToken = (pawn, diceNo) =>
  Boolean(pawn) &&
  !pawn.isHome &&
  getPawnPosition(pawn) + diceNo <= HOME_ENTRY_POSITION;

const isTokenInBase = pawn =>
  Boolean(pawn) &&
  !pawn.isHome &&
  typeof pawn?.positionIndex === 'number' &&
  pawn.positionIndex < 0;

const canPieceMove = (pawn, diceNo) => {
  if (!pawn || pawn.isHome) {
    return false;
  }

  if (isTokenInBase(pawn)) {
    return diceNo === 6;
  }

  return canMoveToken(pawn, diceNo);
};

const getMovableTokens = (pawns, diceNo) =>
  (Array.isArray(pawns) ? pawns : []).filter(pawn => canPieceMove(pawn, diceNo));

const stepToken = (pawn, playerNo) => {
  if (!canMoveToken(pawn, 1)) {
    return pawn;
  }

  const nextPosition = getPawnPosition(pawn) + 1;
  const nextTileId = getNextTileId(playerNo, pawn.pos ?? 0, nextPosition);

  return withUpdatedPawnScore({
    ...pawn,
    playerColor: PLAYER_CONFIGS[playerNo]?.playerColor ?? pawn.playerColor,
    position: nextPosition,
    pos: nextTileId,
  });
};

const movePawn = (pawn, diceNo, playerNo) => {
  if (!canMoveToken(pawn, diceNo)) {
    return pawn;
  }

  let nextPawn = pawn;
  for (let step = 0; step < diceNo; step += 1) {
    nextPawn = stepToken(nextPawn, playerNo);
  }

  return nextPawn;
};

const resetCapturedToken = pawn =>
  withUpdatedPawnScore({
    ...pawn,
    position: START_POSITION,
    positionIndex: START_POSITION,
    score: 0,
    isHome: false,
    pos: PLAYER_CONFIGS[getPlayerNoFromPieceId(pawn?.id)]?.startTile ?? 0,
    travelCount: 0,
  });

const capturePawn = (movingPawn, opponentPawns) => {
  const landingTileId = movingPawn?.pos ?? 0;

  if (!landingTileId || movingPawn?.isHome || isSafeTile(landingTileId)) {
    return {
      capturedPawns: [],
      opponentPawns,
    };
  }

  const capturedPawns = [];
  const updatedOpponentPawns = (Array.isArray(opponentPawns) ? opponentPawns : []).map(
    opponentPawn => {
      if (!opponentPawn?.isHome && opponentPawn?.pos === landingTileId) {
        const resetPawn = resetCapturedToken(opponentPawn);
        capturedPawns.push(resetPawn);
        return resetPawn;
      }

      return opponentPawn;
    },
  );

  return {
    capturedPawns,
    opponentPawns: updatedOpponentPawns,
  };
};

const getPlayerScore = pawns =>
  (Array.isArray(pawns) ? pawns : []).reduce(
    (total, pawn) => total + (pawn?.score ?? 0),
    0,
  );

const shouldGrantExtraRoll = ({diceNo, capturedCount = 0, reachedHome = false}) =>
  diceNo === 6 || capturedCount > 0 || reachedHome;

const rollDice = (randomFn = Math.random) => Math.floor(randomFn() * 6) + 1;

const buildCurrentPositions = players =>
  Object.values(players)
    .flat()
    .filter(piece => typeof piece?.pos === 'number' && piece.pos > 0 && !piece.isHome)
    .map(piece => ({
      id: piece.id,
      pos: piece.pos,
    }));

const createInitialPlayers = () => ({
  player1: ['A1', 'A2', 'A3', 'A4'].map(id => createToken(id, 1)),
  player2: ['B1', 'B2', 'B3', 'B4'].map(id => createToken(id, 2)),
});

const buildInitialOnlineGameState = now => {
  const players = createInitialPlayers();

  return {
    ...players,
    scores: {
      player1: 0,
      player2: 0,
    },
    consecutiveSixes: {
      player1: 0,
      player2: 0,
    },
    missedRolls: {
      player1: 0,
      player2: 0,
    },
    chancePlayer: 1,
    turnToken: 0,
    diceNo: 1,
    isDiceRolled: false,
    pileSelectionPlayer: -1,
    cellSelectionPlayer: -1,
    touchDiceBlock: false,
    currentPositions: buildCurrentPositions(players),
    winner: null,
    fireworks: false,
    turnDeadlineAt: now + TURN_TIMEOUT_MS,
    lastAction: null,
  };
};

const normalizeGameState = (game, now) => {
  const defaults = buildInitialOnlineGameState(now);
  const normalized = {
    ...defaults,
    ...(game ?? {}),
    player1: Array.isArray(game?.player1) ? clone(game.player1) : defaults.player1,
    player2: Array.isArray(game?.player2) ? clone(game.player2) : defaults.player2,
    scores: {
      ...defaults.scores,
      ...(game?.scores ?? {}),
    },
    consecutiveSixes: {
      ...defaults.consecutiveSixes,
      ...(game?.consecutiveSixes ?? {}),
    },
    missedRolls: {
      ...defaults.missedRolls,
      ...(game?.missedRolls ?? {}),
    },
  };

  normalized.currentPositions = buildCurrentPositions({
    player1: normalized.player1,
    player2: normalized.player2,
  });
  normalized.scores.player1 = getPlayerScore(normalized.player1);
  normalized.scores.player2 = getPlayerScore(normalized.player2);

  return normalized;
};

const applyChanceTransition = (game, nextPlayer, now) => {
  const previousPlayerKey = getPlayerKey(game.chancePlayer);
  const nextGame = {
    ...game,
    chancePlayer: nextPlayer,
    turnToken: (game.turnToken ?? 0) + 1,
    touchDiceBlock: false,
    isDiceRolled: false,
    cellSelectionPlayer: -1,
    pileSelectionPlayer: -1,
    turnDeadlineAt: now + TURN_TIMEOUT_MS,
  };

  if (nextPlayer !== game.chancePlayer && nextGame.consecutiveSixes[previousPlayerKey] != null) {
    nextGame.consecutiveSixes[previousPlayerKey] = 0;
  }

  return nextGame;
};

const resolveActionPlayer = (room, playerNo) =>
  room?.players?.[getPlayerKey(playerNo)]?.uid ?? null;

const createLastAction = ({actionId, uid, playerNo, type, status, now, extra = {}}) => ({
  actionId,
  uid,
  playerNo,
  type,
  status,
  processedAt: now,
  ...extra,
});

const updateRoomWithGame = (room, game, now, extra = {}) => ({
  ...room,
  ...extra,
  game,
  updatedAt: now,
});

const applyRollAction = ({room, action, roomId, actionId, now, randomFn}) => {
  if (!room || room.status !== 'playing') {
    return {ok: false, reason: 'room-not-playing'};
  }

  const expectedUid = resolveActionPlayer(room, action.playerNo);
  if (!expectedUid || expectedUid !== action.uid) {
    return {ok: false, reason: 'player-mismatch'};
  }

  const game = normalizeGameState(room.game, now);
  if (game.winner != null) {
    return {ok: false, reason: 'game-finished'};
  }

  if (game.chancePlayer !== action.playerNo) {
    return {ok: false, reason: 'not-your-turn'};
  }

  if (game.isDiceRolled) {
    return {ok: false, reason: 'move-already-pending'};
  }

  const playerKey = getPlayerKey(action.playerNo);
  const diceNo = rollDice(randomFn);
  game.diceNo = diceNo;
  game.isDiceRolled = true;
  game.missedRolls[playerKey] = 0;
  game.consecutiveSixes[playerKey] = diceNo === 6 ? (game.consecutiveSixes[playerKey] ?? 0) + 1 : 0;

  if (game.consecutiveSixes[playerKey] >= 3) {
    const nextGame = applyChanceTransition(game, getNextActivePlayer(action.playerNo), now);
    nextGame.lastAction = createLastAction({
      actionId,
      uid: action.uid,
      playerNo: action.playerNo,
      type: action.type,
      status: 'processed',
      now,
      extra: {
        roomId,
        diceNo,
        outcome: 'third-six-turn-forfeited',
      },
    });

    return {
      ok: true,
      room: updateRoomWithGame(room, nextGame, now),
      result: {
        diceNo,
        outcome: 'third-six-turn-forfeited',
      },
    };
  }

  const playerPieces = game[playerKey];
  const movablePieces = getMovableTokens(playerPieces, diceNo);
  const movableBasePieces = movablePieces.filter(isTokenInBase);
  const movableBoardPieces = movablePieces.filter(piece => !isTokenInBase(piece));

  if (movablePieces.length === 0) {
    const nextGame = applyChanceTransition(game, getNextActivePlayer(action.playerNo), now);
    nextGame.lastAction = createLastAction({
      actionId,
      uid: action.uid,
      playerNo: action.playerNo,
      type: action.type,
      status: 'processed',
      now,
      extra: {
        roomId,
        diceNo,
        outcome: 'no-moves',
      },
    });

    return {
      ok: true,
      room: updateRoomWithGame(room, nextGame, now),
      result: {
        diceNo,
        outcome: 'no-moves',
      },
    };
  }

  game.touchDiceBlock = true;
  game.pileSelectionPlayer = movableBasePieces.length > 0 ? action.playerNo : -1;
  game.cellSelectionPlayer = movableBoardPieces.length > 0 ? action.playerNo : -1;
  game.turnDeadlineAt = now + TURN_TIMEOUT_MS;
  game.lastAction = createLastAction({
    actionId,
    uid: action.uid,
    playerNo: action.playerNo,
    type: action.type,
    status: 'processed',
    now,
    extra: {
      roomId,
      diceNo,
      movablePieceIds: movablePieces.map(piece => piece.id),
    },
  });

  return {
    ok: true,
    room: updateRoomWithGame(room, game, now),
    result: {
      diceNo,
      movablePieceIds: movablePieces.map(piece => piece.id),
    },
  };
};

const applyMoveAction = ({room, action, roomId, actionId, now}) => {
  if (!room || room.status !== 'playing') {
    return {ok: false, reason: 'room-not-playing'};
  }

  const expectedUid = resolveActionPlayer(room, action.playerNo);
  if (!expectedUid || expectedUid !== action.uid) {
    return {ok: false, reason: 'player-mismatch'};
  }

  const game = normalizeGameState(room.game, now);
  if (game.winner != null) {
    return {ok: false, reason: 'game-finished'};
  }

  if (game.chancePlayer !== action.playerNo) {
    return {ok: false, reason: 'not-your-turn'};
  }

  if (!game.isDiceRolled) {
    return {ok: false, reason: 'roll-required'};
  }

  const pieceId = action.payload?.pieceId;
  if (typeof pieceId !== 'string' || !pieceId.trim()) {
    return {ok: false, reason: 'piece-required'};
  }

  const playerKey = getPlayerKey(action.playerNo);
  const opponentNo = getNextActivePlayer(action.playerNo);
  const opponentKey = getPlayerKey(opponentNo);
  const playerPieces = clone(game[playerKey]);
  const opponentPieces = clone(game[opponentKey]);
  const pieceIndex = playerPieces.findIndex(piece => piece.id === pieceId);

  if (pieceIndex === -1) {
    return {ok: false, reason: 'piece-not-found'};
  }

  const currentPawn = playerPieces[pieceIndex];
  if (!canPieceMove(currentPawn, game.diceNo)) {
    return {ok: false, reason: 'piece-cannot-move'};
  }

  const movedPawn = movePawn(currentPawn, game.diceNo, action.playerNo);
  playerPieces[pieceIndex] = movedPawn;

  const {capturedPawns, opponentPawns} = capturePawn(movedPawn, opponentPieces);
  const reachedHome = movedPawn.positionIndex === HOME_POSITION_INDEX || movedPawn.isHome;
  const allPawnsHome = playerPieces.length > 0 && playerPieces.every(pawn => pawn?.isHome);
  const nextPlayer = shouldGrantExtraRoll({
    diceNo: game.diceNo,
    capturedCount: capturedPawns.length,
    reachedHome,
  })
    ? action.playerNo
    : opponentNo;

  game[playerKey] = playerPieces;
  game[opponentKey] = opponentPawns;
  game.currentPositions = buildCurrentPositions({
    player1: game.player1,
    player2: game.player2,
  });
  game.scores.player1 = getPlayerScore(game.player1);
  game.scores.player2 = getPlayerScore(game.player2);
  game.fireworks = Boolean(game.fireworks || reachedHome || allPawnsHome);

  if (allPawnsHome) {
    game.winner = action.playerNo;
    game.isDiceRolled = false;
    game.touchDiceBlock = false;
    game.cellSelectionPlayer = -1;
    game.pileSelectionPlayer = -1;
    game.turnDeadlineAt = now;
    game.lastAction = createLastAction({
      actionId,
      uid: action.uid,
      playerNo: action.playerNo,
      type: action.type,
      status: 'processed',
      now,
      extra: {
        roomId,
        pieceId,
        diceNo: game.diceNo,
        capturedIds: capturedPawns.map(pawn => pawn.id),
        outcome: 'winner',
      },
    });

    return {
      ok: true,
      room: updateRoomWithGame(room, game, now, {status: 'finished'}),
      result: {
        pieceId,
        outcome: 'winner',
      },
    };
  }

  const nextGame = applyChanceTransition(game, nextPlayer, now);
  nextGame.currentPositions = buildCurrentPositions({
    player1: nextGame.player1,
    player2: nextGame.player2,
  });
  nextGame.scores.player1 = getPlayerScore(nextGame.player1);
  nextGame.scores.player2 = getPlayerScore(nextGame.player2);
  nextGame.lastAction = createLastAction({
    actionId,
    uid: action.uid,
    playerNo: action.playerNo,
    type: action.type,
    status: 'processed',
    now,
    extra: {
      roomId,
      pieceId,
      diceNo: game.diceNo,
      capturedIds: capturedPawns.map(pawn => pawn.id),
      reachedHome,
      nextPlayer,
    },
  });

  return {
    ok: true,
    room: updateRoomWithGame(room, nextGame, now),
    result: {
      pieceId,
      capturedIds: capturedPawns.map(pawn => pawn.id),
      reachedHome,
      nextPlayer,
    },
  };
};

const applyRoomAction = ({room, action, roomId, actionId, now, randomFn = Math.random}) => {
  if (!action || typeof action !== 'object') {
    return {ok: false, reason: 'invalid-action'};
  }

  if (action.type === 'ROLL_DICE') {
    return applyRollAction({room, action, roomId, actionId, now, randomFn});
  }

  if (action.type === 'MOVE_TOKEN') {
    return applyMoveAction({room, action, roomId, actionId, now});
  }

  return {ok: false, reason: 'unsupported-action'};
};

const expireTurn = ({room, roomId, now}) => {
  if (!room || room.status !== 'playing') {
    return {ok: false, reason: 'room-not-playing'};
  }

  const game = normalizeGameState(room.game, now);
  if (game.winner != null) {
    return {ok: false, reason: 'game-finished'};
  }

  if (typeof game.turnDeadlineAt !== 'number' || game.turnDeadlineAt > now) {
    return {ok: false, reason: 'deadline-not-expired'};
  }

  const playerNo = game.chancePlayer;
  const playerKey = getPlayerKey(playerNo);
  const nextMissCount = (game.missedRolls[playerKey] ?? 0) + 1;
  game.missedRolls[playerKey] = nextMissCount;

  if (nextMissCount >= MAX_MISSED_ROLLS) {
    const winner = getNextActivePlayer(playerNo);
    game.winner = winner;
    game.isDiceRolled = false;
    game.touchDiceBlock = false;
    game.cellSelectionPlayer = -1;
    game.pileSelectionPlayer = -1;
    game.turnDeadlineAt = now;
    game.fireworks = true;
    game.lastAction = createLastAction({
      actionId: `timeout-${roomId}-${now}`,
      uid: resolveActionPlayer(room, playerNo),
      playerNo,
      type: 'TIMEOUT_FORFEIT',
      status: 'processed',
      now,
      extra: {
        roomId,
        winner,
        missedRollCount: nextMissCount,
      },
    });

    return {
      ok: true,
      room: updateRoomWithGame(room, game, now, {status: 'finished'}),
      result: {
        winner,
        missedRollCount: nextMissCount,
      },
    };
  }

  const nextGame = applyChanceTransition(game, getNextActivePlayer(playerNo), now);
  nextGame.lastAction = createLastAction({
    actionId: `timeout-${roomId}-${now}`,
    uid: resolveActionPlayer(room, playerNo),
    playerNo,
    type: 'TIMEOUT_SKIP',
    status: 'processed',
    now,
    extra: {
      roomId,
      missedRollCount: nextMissCount,
      nextPlayer: nextGame.chancePlayer,
    },
  });

  return {
    ok: true,
    room: updateRoomWithGame(room, nextGame, now),
    result: {
      missedRollCount: nextMissCount,
      nextPlayer: nextGame.chancePlayer,
    },
  };
};

module.exports = {
  TURN_TIMEOUT_MS,
  applyRoomAction,
  buildInitialOnlineGameState,
  expireTurn,
};
