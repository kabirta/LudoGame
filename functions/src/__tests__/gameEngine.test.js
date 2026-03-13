const {applyRoomAction, buildInitialOnlineGameState, expireTurn} = require('../gameEngine');

describe('applyRoomAction room readiness', () => {
  const baseAction = {
    uid: 'player-1',
    playerNo: 1,
    type: 'ROLL_DICE',
  };

  it('rejects actions while the room is still waiting', () => {
    const result = applyRoomAction({
      room: {
        status: 'waiting',
        players: {
          player1: {uid: 'player-1'},
        },
        game: buildInitialOnlineGameState(1),
      },
      action: baseAction,
      roomId: '123456',
      actionId: 'action-1',
      now: 1,
      randomFn: () => 0,
    });

    expect(result).toEqual({
      ok: false,
      reason: 'room-waiting',
    });
  });

  it('rejects actions when player two is missing even if the room says playing', () => {
    const result = applyRoomAction({
      room: {
        status: 'playing',
        players: {
          player1: {uid: 'player-1'},
        },
        game: buildInitialOnlineGameState(1),
      },
      action: baseAction,
      roomId: '123456',
      actionId: 'action-2',
      now: 1,
      randomFn: () => 0,
    });

    expect(result).toEqual({
      ok: false,
      reason: 'room-waiting',
    });
  });

  it('finishes the match by score once the room timer expires', () => {
    const game = buildInitialOnlineGameState(1);
    game.player1[0].score = 42;
    game.player2[0].score = 17;

    const result = applyRoomAction({
      room: {
        code: '123456',
        status: 'playing',
        startTime: 1,
        timeLimit: 480,
        players: {
          player1: {uid: 'player-1'},
          player2: {uid: 'player-2'},
        },
        game,
      },
      action: baseAction,
      roomId: '123456',
      actionId: 'action-3',
      now: 480001,
      randomFn: () => 0,
    });

    expect(result.ok).toBe(true);
    expect(result.room.status).toBe('finished');
    expect(result.room.winner).toBe('player-1');
    expect(result.room.game.winner).toBe(1);
    expect(result.result).toEqual({
      winner: 1,
      outcome: 'score-time-limit',
    });
  });

  it('lets the scheduler finish the room by score when no one taps after timeout', () => {
    const game = buildInitialOnlineGameState(1);
    game.player1[0].score = 19;
    game.player2[0].score = 23;

    const result = expireTurn({
      room: {
        code: '123456',
        status: 'playing',
        startTime: 1,
        timeLimit: 480,
        players: {
          player1: {uid: 'player-1'},
          player2: {uid: 'player-2'},
        },
        game,
      },
      roomId: '123456',
      now: 480001,
    });

    expect(result.ok).toBe(true);
    expect(result.room.status).toBe('finished');
    expect(result.room.winner).toBe('player-2');
    expect(result.room.game.winner).toBe(2);
  });
});
