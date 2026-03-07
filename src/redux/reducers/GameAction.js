import {
  ACTIVE_PLAYERS,
  canMoveToken,
  capturePawn,
  getNextActivePlayer,
  getPlayerNoFromPieceId,
  HOME_POSITION_INDEX,
  isSafeTile,
  shouldGrantExtraRoll,
  stepToken,
} from '../../helpers/LudoMovementEngine';
import {playSound} from '../../helpers/SoundUtility';
import {selectDiceNo} from './gameSelectors';
import {
  disableTouch,
  updateFireworks,
  updatePlayerChance,
  updateplayerPieceValue,
} from './gameSlice';

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

const persistPawn = (dispatch, playerNo, pawn) => {
  dispatch(
    updateplayerPieceValue({
      playerNo: `player${playerNo}`,
      pieceId: pawn.id,
      playerColor: pawn.playerColor,
      position: pawn.position,
      positionIndex: pawn.positionIndex,
      score: pawn.score,
      isHome: pawn.isHome,
      pos: pawn.pos,
      travelCount: pawn.travelCount,
    }),
  );
};

export const handleForwardThunk =
  (playerNo, pieceId) => async (dispatch, getState) => {
    const state = getState();
    const diceNo = selectDiceNo(state);
    let updatedToken = state.game[`player${playerNo}`].find(
      item => item.id === pieceId,
    );

    if (!updatedToken) {
      return;
    }

    dispatch(disableTouch());

    if (!canMoveToken(updatedToken, diceNo)) {
      dispatch(
        updatePlayerChance({chancePlayer: getNextActivePlayer(playerNo)}),
      );
      return;
    }

    for (let step = 0; step < diceNo; step += 1) {
      updatedToken = stepToken(updatedToken, playerNo);
      persistPawn(dispatch, playerNo, updatedToken);
      playSound('pile_move');
      await delay(200);
    }

    const updatedState = getState();
    const opponentPawns = ACTIVE_PLAYERS.filter(
      activePlayerNo => activePlayerNo !== playerNo,
    ).flatMap(activePlayerNo => updatedState.game[`player${activePlayerNo}`]);

    const {capturedPawns} = capturePawn(updatedToken, opponentPawns);

    if (capturedPawns.length > 0) {
      playSound('collide');
      capturedPawns.forEach(capturedPawn => {
        const capturedPlayerNo = getPlayerNoFromPieceId(capturedPawn.id);
        if (capturedPlayerNo != null) {
          persistPawn(dispatch, capturedPlayerNo, capturedPawn);
        }
      });
    } else if (isSafeTile(updatedToken.pos)) {
      playSound('safe_spot');
    }

    if (updatedToken.positionIndex === HOME_POSITION_INDEX) {
      playSound('home_win');
      dispatch(updateFireworks(true));
    }

    dispatch(
      updatePlayerChance({
        chancePlayer: shouldGrantExtraRoll({
          diceNo,
          capturedCount: capturedPawns.length,
        })
          ? playerNo
          : getNextActivePlayer(playerNo),
      }),
    );
  };
