import { SafeSpots, StarSpots } from './PlotData';

export const ACTIVE_PLAYERS = [1, 2];
export const HOME_POSITION_INDEX = 56;
export const HOME_BONUS = 56;

export const PLAYER_CONFIGS = {
  1: {
    playerColor: 'red',
    startTile: 1,
    homeEntryTile: 52,
    homeLaneStart: 111,
  },
  2: {
    playerColor: 'yellow',
    startTile: 27,
    homeEntryTile: 26,
    homeLaneStart: 331,
  },
  3: {
    playerColor: 'yellow',
    startTile: 27,
    homeEntryTile: 26,
    homeLaneStart: 331,
  },
  4: {
    playerColor: 'blue',
    startTile: 40,
    homeEntryTile: 38,
    homeLaneStart: 441,
  },
};

export const createToken = (id, playerNo) => ({
  id,
  playerColor: PLAYER_CONFIGS[playerNo]?.playerColor ?? 'red',
  positionIndex: -1,
  score: 0,
  isHome: false,
  pos: 0,
  travelCount: 0,
});

export const rollDice = () => Math.floor(Math.random() * 6) + 1;

export const getNextActivePlayer = currentPlayer => {
  const index = ACTIVE_PLAYERS.indexOf(currentPlayer);
  if (index === -1) {
    return ACTIVE_PLAYERS[0];
  }
  return ACTIVE_PLAYERS[(index + 1) % ACTIVE_PLAYERS.length];
};

export const isSafeTile = tileId => SafeSpots.includes(tileId) || StarSpots.includes(tileId);

export const canMoveToken = (token, diceNo) =>
  !token?.isHome && token && token.positionIndex + diceNo <= HOME_POSITION_INDEX;

const getNextTileId = (playerNo, currentTileId, nextPositionIndex) => {
  const config = PLAYER_CONFIGS[playerNo];

  if (nextPositionIndex === 0) {
    return config.startTile;
  }

  if (nextPositionIndex === HOME_POSITION_INDEX) {
    return 0;
  }

  if (currentTileId === config.homeEntryTile) {
    return config.homeLaneStart;
  }

  if (currentTileId >= config.homeLaneStart && currentTileId < config.homeLaneStart + 4) {
    return currentTileId + 1;
  }

  if (currentTileId === 52) {
    return 1;
  }

  return currentTileId + 1;
};

export const stepToken = (token, playerNo) => {
  const nextPositionIndex = token.positionIndex + 1;
  const nextTileId = getNextTileId(playerNo, token.pos, nextPositionIndex);
  const isHome = nextPositionIndex === HOME_POSITION_INDEX;
  const movementScore = nextPositionIndex + 1;
  const homeBonus = isHome ? HOME_BONUS : 0;

  return {
    ...token,
    playerColor: PLAYER_CONFIGS[playerNo]?.playerColor ?? token.playerColor,
    positionIndex: nextPositionIndex,
    score: movementScore + homeBonus,
    isHome,
    pos: nextTileId,
    travelCount: nextPositionIndex,
  };
};

export const resetCapturedToken = token => ({
  ...token,
  positionIndex: -1,
  score: 0,
  isHome: false,
  pos: 0,
  travelCount: 0,
});
