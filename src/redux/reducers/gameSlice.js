import {createSlice} from '@reduxjs/toolkit';

import {getPlayerScore} from '../../helpers/LudoMovementEngine';
import {initialState} from './initialState';

export const gameSlice = createSlice({
  name: 'game',
  initialState: initialState,
  reducers: {
    resetGame: state => ({
      ...initialState,
      settings: state.settings ?? initialState.settings,
    }),
    announceWinners: (state,action) => {
      state.winner = action.payload;
    },
    updateFireworks: (state, action) => {
      state.isFirework = action.payload;
    },
    updateDiceNo: (state, action) => {
      const {diceNo, playerNo} = action.payload;
      state.diceNo = diceNo;
      state.isDiceRolled = true;

      if (playerNo == null) {
        return;
      }

      const playerKey = `player${playerNo}`;
      if (state.consecutiveSixes[playerKey] !== undefined) {
        state.consecutiveSixes[playerKey] =
          diceNo === 6 ? state.consecutiveSixes[playerKey] + 1 : 0;
      }
    },
    enablePileSelection: (state, action) => {
      state.touchDiceBlock = true;
      state.pileSelectionPlayer = action.payload.playerNo;
    },
    updatePlayerChance: (state, action) => {
      const nextPlayer = action.payload.chancePlayer;
      const previousPlayerKey = `player${state.chancePlayer}`;
      if (
        nextPlayer !== state.chancePlayer &&
        state.consecutiveSixes[previousPlayerKey] !== undefined
      ) {
        state.consecutiveSixes[previousPlayerKey] = 0;
      }

      state.chancePlayer = nextPlayer;
      state.touchDiceBlock = false;
      state.isDiceRolled = false;
      state.cellSelectionPlayer = -1;
      state.pileSelectionPlayer = -1;
    },
    enableCellSelection: (state, action) => {
      state.touchDiceBlock = true;
      state.cellSelectionPlayer = action.payload.playerNo;
    },
    updateGameSetting: (state, action) => {
      if (!state.settings) {
        state.settings = {...initialState.settings};
      }

      const {key, value} = action.payload;
      if (state.settings[key] !== undefined) {
        state.settings[key] = value;
      }
    },
    unfreezeDice: (state) => {
      state.touchDiceBlock = false;
      state.isDiceRolled = false;
    },
    disableTouch: state => {
      state.touchDiceBlock = true;
      state.cellSelectionPlayer = -1;
      state.pileSelectionPlayer = -1;

    },
    updateplayerPieceValue: (state, action) => {
      const { playerNo, pieceId, ...updates } = action.payload;
      const playerKey = typeof playerNo === 'string' ? playerNo : `player${playerNo}`;
      const playerPieces = state[playerKey];
      if (!playerPieces) {
        return;
      }
      const piece = playerPieces.find(p=> p.id === pieceId);
      state.pileSelectionPlayer = -1;

      if (piece) {
        Object.assign(piece, updates);

        const currentPositionIndex = state.currentPositions.findIndex(
          p => p.id ===pieceId,
        );
        const isOnBoard = typeof piece.pos === 'number' && piece.pos > 0 && !piece.isHome;
        if(!isOnBoard){
          if (currentPositionIndex !== -1) {
            state.currentPositions.splice(currentPositionIndex, 1);
          }
          
        }else{
          if (currentPositionIndex !== -1) {
            state.currentPositions[currentPositionIndex]={
              id: pieceId,
              pos: piece.pos,
            };
          } else {
            state.currentPositions.push({
              id: pieceId,
              pos: piece.pos,
            });
          }
        }

        if (state.scores[playerKey] !== undefined) {
          state.scores[playerKey] = getPlayerScore(playerPieces);
        }
      }

    }
  },
});

export const { 
  resetGame, 
  announceWinners,
  updateFireworks, 
  updateDiceNo,
  enablePileSelection, 
  updatePlayerChance,
  enableCellSelection, 
  updateGameSetting,
  updateplayerPieceValue ,
  unfreezeDice, 
  disableTouch} = gameSlice.actions;
export default gameSlice.reducer;
