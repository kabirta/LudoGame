import {
  SafeSpots,
  StarSpots,
  startingPoints,
  turningPoints,
  victoryStart,
} from '../../helpers/PlotData';
import {playSound} from '../../helpers/SoundUtility';
import {
  selectCurrentPositions,
  selectDiceNo,
} from './gameSelectors';
import {
  announceWinners,
  disableTouch,
  unfreezeDice,
  updateFireworks,
  updatePlayerChance,
  updateplayerPieceValue,
} from './gameSlice';

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

function checkWinningCriteria(pieces) {
  return pieces.every(piece => piece.travelCount >= 56);
}

export const handleForwardThunk = (playerNo, id, pos) => async (dispatch, getState) => {
  const state = getState();
  const plottedPieces = selectCurrentPositions(state);
  const diceNo = selectDiceNo(state);

  const piecesAtPosition = plottedPieces.filter(item => item.pos === pos);
  const alpha = String.fromCharCode(64 + playerNo); // 1 -> 'A', 2 -> 'B'...

  const piece = piecesAtPosition.find(item => item.id.startsWith(alpha));

  dispatch(disableTouch());

  let finalPath = piece.pos;
  const beforePlayerPiece = state.game[`player${playerNo}`].find(item => item.id === id);
  let travelCount = beforePlayerPiece.travelCount;

  // Prevent moving pieces that are already at home
  if (travelCount >= 56) {
    dispatch(unfreezeDice());
    return;
  }

  // Prevent overshooting home - pieces can only move to exactly 56, not beyond
  if (travelCount + diceNo > 56) {
    dispatch(unfreezeDice());
    return;
  }

  for (let i = 0; i < diceNo; i++) {
    const updatedPosition = getState().game[`player${playerNo}`].find(item => item.id === id);
    let path = updatedPosition.pos + 1;

    if (path === turningPoints[playerNo - 1]) {
      path = victoryStart[playerNo - 1];
    }
    if (path === 53) {
      path = 1;
    }

    finalPath = path;
    travelCount += 1;

    dispatch(updateplayerPieceValue({
      playerNo: `player${playerNo}`,
      pieceId: updatedPosition.id,
      pos: path,
      travelCount: travelCount,
    }));

    playSound('pile_move');
    await delay(200);

    // Check if piece reached home during movement
    if (travelCount >= 56) {
      playSound('home_win');
      break; // Stop moving if home is reached
    }
  }

  const updatedState = getState();
  const updatedPlottedPieces = selectCurrentPositions(updatedState);
  const finalPlot = updatedPlottedPieces.filter(item => item.pos === finalPath);

  const ids = finalPlot.map(item => item.id[0]);
  const uniqueIds = new Set(ids);
  const areDifferentIds = uniqueIds.size > 1;

  // Handle safe spots
  if (SafeSpots.includes(finalPath) || StarSpots.includes(finalPath)) {
    playSound('safe_spot');
  }

  // Handle collision
  if (
    areDifferentIds &&
    finalPlot.length > 0 &&
    !SafeSpots.includes(finalPath) &&
    !StarSpots.includes(finalPath)
  ) {
    const enemyPiece = finalPlot.find(p => p.id[0] !== id[0]);
    const enemyId = enemyPiece.id[0];
    const enemyPlayerNo = enemyId.charCodeAt(0) - 64;
    const startingPoint = startingPoints[enemyPlayerNo - 1];

    playSound('collide');

    // Optional: animate going back step by step
    // (Can be removed if not needed)
    dispatch(updateplayerPieceValue({
      playerNo: `player${enemyPlayerNo}`,
      pieceId: enemyPiece.id,
      pos: 0,
      travelCount: 0,
    }));

    dispatch(unfreezeDice());
    return;
  }

// Check for 6 or win
  if (diceNo === 6 || travelCount >= 56) {
    dispatch(updatePlayerChance({ chancePlayer: playerNo }));

    if (travelCount >= 56) {
      // Don't play home_win sound here since it was already played during movement
      
      const finalPlayerState = getState().game[`player${playerNo}`];

      if (checkWinningCriteria(finalPlayerState)) {
        dispatch(announceWinners(playerNo));
        playSound('cheer', true);
        return;
      }

      dispatch(updateFireworks(true));
    }

    dispatch(unfreezeDice());
    return;
  }

  // Move to next player
  let nextPlayer = playerNo + 1;
  if (nextPlayer > 4) nextPlayer = 1;
  dispatch(updatePlayerChance({ chancePlayer: nextPlayer }));
}; 