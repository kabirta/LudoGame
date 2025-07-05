import {createSlice} from '@reduxjs/toolkit';

import {initialState} from './initialState';

export const gameSlice = createSlice({
  name: 'game',
  initialState: initialState,
  reducers: {
    resetGame: () => initialState,
    announceWinners: (state,action) => {
      state.winner= action.payload;
    },
  },
});

export const { resetGame,announceWinners } = gameSlice.actions;
export default gameSlice.reducer;
