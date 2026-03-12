import {
  equalTo,
  get,
  off,
  onValue,
  orderByChild,
  push,
  query,
  ref,
  runTransaction,
  serverTimestamp,
  set,
  update,
} from 'firebase/database';

import {initialState} from '../redux/reducers/initialState';
import {db} from './config';

const ROOM_CODE_LENGTH = 6;
const MAX_ROOM_CODE_ATTEMPTS = 12;

const createRoomError = (code, message) => {
  const error = new Error(message);
  error.code = code;
  return error;
};

const generateRoomCode = () =>
  `${Math.floor(Math.random() * 9 * 10 ** (ROOM_CODE_LENGTH - 1)) + 10 ** (ROOM_CODE_LENGTH - 1)}`;

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

const buildWaitingRoomState = ({uid, name}) => ({
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

export const createRoom = async ({uid, name}) => {
  for (let attempt = 0; attempt < MAX_ROOM_CODE_ATTEMPTS; attempt += 1) {
    const roomId = generateRoomCode();
    const roomRef = ref(db, `rooms/${roomId}`);
    const result = await runTransaction(roomRef, currentRoom => {
      if (currentRoom) {
        return;
      }

      return buildWaitingRoomState({uid, name});
    });

    if (result.committed && result.snapshot.exists()) {
      return roomId;
    }
  }

  throw createRoomError(
    'room/code-generation-failed',
    'Could not generate a numeric room code. Please try again.',
  );
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
    throw createRoomError(
      'room/unavailable',
      'Room code is invalid or the room is no longer available.',
    );
  }

  const room = result.snapshot.val();
  if (room?.players?.player2?.uid !== uid) {
    throw createRoomError(
      'room/full',
      'Room already has two players or the match already started.',
    );
  }

  return room;
};

export const getRoom = async roomId => {
  const snapshot = await get(ref(db, `rooms/${roomId}`));
  return snapshot.exists() ? snapshot.val() : null;
};

export const findJoinableRoom = async ({excludeUid} = {}) => {
  const roomsQuery = query(
    ref(db, 'rooms'),
    orderByChild('status'),
    equalTo('waiting'),
  );
  const snapshot = await get(roomsQuery);

  if (!snapshot.exists()) {
    return null;
  }

  let matchedRoom = null;

  snapshot.forEach(childSnapshot => {
    const room = childSnapshot.val();

    if (
      room &&
      room.hostUid !== excludeUid &&
      room.players?.player1?.uid &&
      !room.players?.player2
    ) {
      matchedRoom = {
        roomId: childSnapshot.key,
        room,
      };
      return true;
    }

    return false;
  });

  return matchedRoom;
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
