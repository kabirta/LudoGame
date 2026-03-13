const {applyRoomAction, buildInitialOnlineGameState} = require('../gameEngine');

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
});
