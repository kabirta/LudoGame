import {SafeSpots, StarSpots} from './PlotData';

export const ACTIVE_PLAYERS = [1, 2];
export const START_POSITION = 0;
export const HOME_ENTRY_POSITION = 56;
export const HOME_POSITION_INDEX = 56;
export const HOME_BONUS = 56;
export const boardPath = Object.freeze(
  Array.from({length: HOME_ENTRY_POSITION}, (_, index) => index + 1),
);

const HOME_LANE_LENGTH = 5;

export const PLAYER_CONFIGS = {
  1: {
    playerColor: 'red',
    startTile: 1,
    homeEntryTile: 51,
    homeLaneStart: 111,
  },
  2: {
    playerColor: 'yellow',
    startTile: 27,
    homeEntryTile: 25,
    homeLaneStart: 331,
  },
  3: {
    playerColor: 'yellow',
    startTile: 27,
    homeEntryTile: 25,
    homeLaneStart: 331,
  },
  4: {
    playerColor: 'blue',
    startTile: 40,
    homeEntryTile: 38,
    homeLaneStart: 441,
  },
};

export const rollDice = (randomFn = Math.random) =>
  Math.floor(randomFn() * 6) + 1;

export const getNextActivePlayer = currentPlayer => {
  const index = ACTIVE_PLAYERS.indexOf(currentPlayer);
  if (index === -1) {
    return ACTIVE_PLAYERS[0];
  }
  return ACTIVE_PLAYERS[(index + 1) % ACTIVE_PLAYERS.length];
};

export const getPlayerNoFromPieceId = pieceId => {
  const playerLetter = pieceId?.slice(0, 1);
  return playerLetter ? playerLetter.charCodeAt(0) - 64 : null;
};

export const isSafeTile = tileId =>
  SafeSpots.includes(tileId) || StarSpots.includes(tileId);

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

export const getBoardTileForPosition = (playerNo, position) => {
  const config = PLAYER_CONFIGS[playerNo];

  if (!config) {
    return 0;
  }

  if (position <= START_POSITION) {
    return config.startTile;
  }

  if (position >= HOME_ENTRY_POSITION) {
    return 0;
  }

  let currentTileId = config.startTile;
  for (let nextPosition = 1; nextPosition <= position; nextPosition += 1) {
    currentTileId = getNextTileId(playerNo, currentTileId, nextPosition);
  }

  return currentTileId;
};

export const getPlayerBoardPath = playerNo =>
  boardPath.map(position => ({
    position,
    tileId: getBoardTileForPosition(playerNo, position),
  }));

export const createToken = (id, playerNo) =>
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

export const updateScore = pawn => withUpdatedPawnScore(pawn);

export const checkHome = pawn => withUpdatedPawnScore(pawn);

export const canMoveToken = (pawn, diceNo) =>
  Boolean(pawn) &&
  !pawn.isHome &&
  getPawnPosition(pawn) + diceNo <= HOME_ENTRY_POSITION;

export const stepToken = (pawn, playerNo) => {
  if (!canMoveToken(pawn, 1)) {
    return pawn;
  }

  const nextPosition = getPawnPosition(pawn) + 1;
  const nextTileId = getNextTileId(playerNo, pawn.pos ?? 0, nextPosition);

  return checkHome({
    ...pawn,
    playerColor: PLAYER_CONFIGS[playerNo]?.playerColor ?? pawn.playerColor,
    position: nextPosition,
    pos: nextTileId,
  });
};

export const movePawn = (pawn, diceNo, playerNo) => {
  if (!canMoveToken(pawn, diceNo)) {
    return pawn;
  }

  let nextPawn = pawn;
  for (let step = 0; step < diceNo; step += 1) {
    nextPawn = stepToken(nextPawn, playerNo);
  }

  return nextPawn;
};

export const resetCapturedToken = pawn =>
  withUpdatedPawnScore({
    ...pawn,
    position: START_POSITION,
    positionIndex: START_POSITION,
    score: 0,
    isHome: false,
    pos: PLAYER_CONFIGS[getPlayerNoFromPieceId(pawn?.id)]?.startTile ?? 0,
    travelCount: 0,
  });

export const capturePawn = (movingPawn, opponentPawns) => {
  const landingTileId = movingPawn?.pos ?? 0;

  if (!landingTileId || movingPawn?.isHome || isSafeTile(landingTileId)) {
    return {
      capturedPawns: [],
      opponentPawns,
    };
  }

  const capturedPawns = [];
  const updatedOpponentPawns = opponentPawns.map(opponentPawn => {
    if (!opponentPawn?.isHome && opponentPawn?.pos === landingTileId) {
      const resetPawn = resetCapturedToken(opponentPawn);
      capturedPawns.push(resetPawn);
      return resetPawn;
    }

    return opponentPawn;
  });

  return {
    capturedPawns,
    opponentPawns: updatedOpponentPawns,
  };
};

export const getPlayerScore = pawns =>
  pawns.reduce((total, pawn) => total + (pawn?.score ?? 0), 0);

export const shouldGrantExtraRoll = ({diceNo, capturedCount = 0}) =>
  diceNo === 6 || capturedCount > 0;
