import {
  SafeSpots,
  StarSpots,
} from '../../helpers/PlotData';
import {
  canMoveToken,
  getNextActivePlayer,
  HOME_POSITION_INDEX,
  isSafeTile,
  resetCapturedToken,
  stepToken,
} from '../../helpers/LudoMovementEngine';
import {playSound} from '../../helpers/SoundUtility';
import {
  selectCurrentPositions,
  selectDiceNo,
} from './gameSelectors';
import {
  disableTouch,
  unfreezeDice,
  updateFireworks,
  updatePlayerChance,
  updateplayerPieceValue,
} from './gameSlice';

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

export const handleForwardThunk = (playerNo, id, pos) => async (dispatch, getState) => {
  const state = getState();
  const plottedPieces = selectCurrentPositions(state);
  const diceNo = selectDiceNo(state);

  const piecesAtPosition = plottedPieces.filter(item => item.pos === pos);
  const alpha = String.fromCharCode(64 + playerNo); // 1 -> 'A', 2 -> 'B'...

  const piece = piecesAtPosition.find(item => item.id.startsWith(alpha));

  dispatch(disableTouch());

  let finalPath = piece.pos;
  let updatedToken = state.game[`player${playerNo}`].find(item => item.id === id);

  if (!canMoveToken(updatedToken, diceNo)) {
    dispatch(updatePlayerChance({ chancePlayer: getNextActivePlayer(playerNo) }));
    return;
  }

  for (let i = 0; i < diceNo; i++) {
    updatedToken = stepToken(updatedToken, playerNo);
    finalPath = updatedToken.pos;

    dispatch(updateplayerPieceValue({
      playerNo: `player${playerNo}`,
      pieceId: updatedToken.id,
      playerColor: updatedToken.playerColor,
      positionIndex: updatedToken.positionIndex,
      score: updatedToken.score,
      isHome: updatedToken.isHome,
      pos: updatedToken.pos,
      travelCount: updatedToken.travelCount,
    }));

    playSound('pile_move');
    await delay(200);
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
    !isSafeTile(finalPath)
  ) {
    const enemyPiece = finalPlot.find(p => p.id[0] !== id[0]);
    const enemyId = enemyPiece.id[0];
    const enemyPlayerNo = enemyId.charCodeAt(0) - 64;
    const enemyToken = getState().game[`player${enemyPlayerNo}`].find(item => item.id === enemyPiece.id);

    playSound('collide');

    dispatch(updateplayerPieceValue({
      playerNo: `player${enemyPlayerNo}`,
      pieceId: enemyPiece.id,
      ...resetCapturedToken(enemyToken),
    }));

    dispatch(unfreezeDice());
    return;
  }

  // Check for 6 or win
  if (diceNo === 6 || updatedToken.positionIndex === HOME_POSITION_INDEX) {
    dispatch(updatePlayerChance({ chancePlayer: playerNo }));

    if (updatedToken.positionIndex === HOME_POSITION_INDEX) {
      playSound('home_win');
      dispatch(updateFireworks(true));
    }

    dispatch(unfreezeDice());
    return;
  }

  // Move to next player
  const nextPlayer = getNextActivePlayer(playerNo);
  dispatch(updatePlayerChance({ chancePlayer: nextPlayer }));
};
