import reducer, {
  recordMissedRoll,
  resetMissedRolls,
  resetGame,
  updateDiceNo,
  updateGameSetting,
  updatePlayerChance,
} from '../gameSlice';

describe('gameSlice six-roll rules', () => {
  it('tracks consecutive sixes for the active player', () => {
    let state = reducer(undefined, updateDiceNo({playerNo: 1, diceNo: 6}));
    state = reducer(state, updatePlayerChance({chancePlayer: 1}));
    state = reducer(state, updateDiceNo({playerNo: 1, diceNo: 6}));

    expect(state.consecutiveSixes.player1).toBe(2);
    expect(state.chancePlayer).toBe(1);
  });

  it('resets the streak when a non-six is rolled', () => {
    let state = reducer(undefined, updateDiceNo({playerNo: 1, diceNo: 6}));
    state = reducer(state, updatePlayerChance({chancePlayer: 1}));
    state = reducer(state, updateDiceNo({playerNo: 1, diceNo: 3}));

    expect(state.consecutiveSixes.player1).toBe(0);
  });

  it('clears the streak when the turn passes to the next player', () => {
    let state = reducer(undefined, updateDiceNo({playerNo: 1, diceNo: 6}));
    state = reducer(state, updatePlayerChance({chancePlayer: 1}));
    state = reducer(state, updateDiceNo({playerNo: 1, diceNo: 6}));
    state = reducer(state, updatePlayerChance({chancePlayer: 1}));
    state = reducer(state, updateDiceNo({playerNo: 1, diceNo: 6}));
    state = reducer(state, updatePlayerChance({chancePlayer: 2}));

    expect(state.consecutiveSixes.player1).toBe(0);
    expect(state.chancePlayer).toBe(2);
  });

  it('stores in-game settings toggles in persisted state', () => {
    const state = reducer(
      undefined,
      updateGameSetting({key: 'musicEnabled', value: true}),
    );

    expect(state.settings.musicEnabled).toBe(true);
    expect(state.settings.soundEnabled).toBe(true);
  });

  it('keeps settings when the game board is reset', () => {
    let state = reducer(
      undefined,
      updateGameSetting({key: 'musicEnabled', value: true}),
    );
    state = reducer(state, resetGame());

    expect(state.settings.musicEnabled).toBe(true);
    expect(state.settings.soundEnabled).toBe(true);
  });

  it('tracks missed rolls and resets them after a successful roll', () => {
    let state = reducer(undefined, recordMissedRoll({playerNo: 1}));
    state = reducer(state, recordMissedRoll({playerNo: 1}));
    state = reducer(state, resetMissedRolls({playerNo: 1}));

    expect(state.missedRolls.player1).toBe(0);
  });
});
