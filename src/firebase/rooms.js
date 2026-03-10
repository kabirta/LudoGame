import {
  get,
  off,
  onValue,
  push,
  ref,
  runTransaction,
  serverTimestamp,
  set,
  update,
} from 'firebase/database';

import {initialState} from '../redux/reducers/initialState';
import {db} from './config';

const buildInitialOnlineGameState = () => ({
  player1: initialState.player1,
  player2: initialState.player2,
  scores: initialState.scores,
  consecutiveSixes: {
    player1: initialState.consecutiveSixes.player1,
    player2: initialState.consecutiveSixes.player2,
  },
  missedRolls: {
    player1: initialState.missedRolls.player1,
    player2: initialState.missedRolls.player2,
  },
  chancePlayer: initialState.chancePlayer,
  turnToken: initialState.turnToken,
  diceNo: initialState.diceNo,
  isDiceRolled: initialState.isDiceRolled,
  pileSelectionPlayer: initialState.pileSelectionPlayer,
  cellSelectionPlayer: initialState.cellSelectionPlayer,
  touchDiceBlock: initialState.touchDiceBlock,
  currentPositions: initialState.currentPositions,
  winner: initialState.winner,
  fireworks: initialState.fireworks,
  turnDeadlineAt: Date.now() + 15000,
  lastAction: null,
});

export const createRoom = async ({uid, name}) => {
  const roomRef = push(ref(db, 'rooms'));

  await set(roomRef, {
    status: 'waiting',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    hostUid: uid,
    players: {
      player1: {
        uid,
        name,
        connected: true,
      },
      player2: null,
    },
    game: buildInitialOnlineGameState(),
  });

  return roomRef.key;
};

export const joinRoom = async ({roomId, uid, name}) => {
  const roomRef = ref(db, `rooms/${roomId}`);

  const result = await runTransaction(roomRef, currentRoom => {
    if (!currentRoom || currentRoom.status !== 'waiting') {
      return currentRoom;
    }

    return {
      ...currentRoom,
      status: 'playing',
      updatedAt: serverTimestamp(),
      players: {
        ...currentRoom.players,
        player2: {
          uid,
          name,
          connected: true,
        },
      },
      game: {
        ...currentRoom.game,
        turnDeadlineAt: Date.now() + 15000,
      },
    };
  });

  if (!result.committed || !result.snapshot.exists()) {
    throw new Error('Room is unavailable');
  }

  const room = result.snapshot.val();
  if (room?.players?.player2?.uid !== uid) {
    throw new Error('Room already has two players');
  }

  return room;
};

export const getRoom = async roomId => {
  const snapshot = await get(ref(db, `rooms/${roomId}`));
  return snapshot.exists() ? snapshot.val() : null;
};

export const subscribeToRoom = (roomId, callback) => {
  const roomRef = ref(db, `rooms/${roomId}`);

  const listener = onValue(roomRef, snapshot => {
    callback(snapshot.exists() ? snapshot.val() : null);
  });

  return () => {
    off(roomRef, 'value', listener);
  };
};

export const subscribeToRoomGame = (roomId, callback) => {
  const gameRef = ref(db, `rooms/${roomId}/game`);

  const listener = onValue(gameRef, snapshot => {
    callback(snapshot.exists() ? snapshot.val() : null);
  });

  return () => {
    off(gameRef, 'value', listener);
  };
};

export const setPlayerConnected = async ({roomId, playerNo, connected}) => {
  await update(ref(db, `rooms/${roomId}`), {
    [`players/player${playerNo}/connected`]: connected,
    updatedAt: serverTimestamp(),
  });
};

export const queueRoomAction = async ({roomId, uid, playerNo, type, payload = {}}) => {
  const actionRef = push(ref(db, `roomActions/${roomId}`));

  await set(actionRef, {
    uid,
    playerNo,
    type,
    payload,
    status: 'pending',
    createdAt: serverTimestamp(),
  });

  return actionRef.key;
};
