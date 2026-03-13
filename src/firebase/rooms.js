import {
  equalTo,
  get,
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
const ONLINE_TURN_TIMEOUT_MS = 15000;
export const ONLINE_MATCH_TIME_LIMIT_SECONDS = 8 * 60;
const ROOM_ACTION_WAIT_MS = 12000;

export const normalizeRoomId = roomId => `${roomId ?? ''}`.trim();

const getRoomTimeLimitSeconds = room =>
  typeof room?.timeLimit === 'number' && Number.isFinite(room.timeLimit) && room.timeLimit > 0
    ? room.timeLimit
    : ONLINE_MATCH_TIME_LIMIT_SECONDS;

const getRoomStartTime = room =>
  typeof room?.startTime === 'number' && Number.isFinite(room.startTime)
    ? room.startTime
    : null;

const getRoomWinnerUid = (room, winner) => {
  if (winner === 'draw') {
    return 'draw';
  }

  if (winner === 1 || winner === 'player1') {
    return room?.players?.player1?.uid ?? null;
  }

  if (winner === 2 || winner === 'player2') {
    return room?.players?.player2?.uid ?? null;
  }

  return null;
};

const getTimedMatchWinner = room => {
  const player1Score = room?.game?.scores?.player1 ?? 0;
  const player2Score = room?.game?.scores?.player2 ?? 0;

  if (player1Score === player2Score) {
    return {
      roomWinner: 'draw',
      gameWinner: 'draw',
    };
  }

  const winner = player1Score > player2Score ? 1 : 2;
  return {
    roomWinner: getRoomWinnerUid(room, winner),
    gameWinner: winner,
  };
};

const hasTimedMatchExpired = (room, now = Date.now()) => {
  const startTime = getRoomStartTime(room);
  if (startTime == null) {
    return false;
  }

  return startTime + getRoomTimeLimitSeconds(room) * 1000 <= now;
};

const buildTimedOutRoomState = (room, now) => {
  const {roomWinner, gameWinner} = getTimedMatchWinner(room);

  return {
    ...room,
    status: 'finished',
    winner: roomWinner,
    endTime: now,
    updatedAt: serverTimestamp(),
    game: {
      ...room?.game,
      winner: gameWinner,
      isDiceRolled: false,
      touchDiceBlock: false,
      cellSelectionPlayer: -1,
      pileSelectionPlayer: -1,
      turnDeadlineAt: now,
    },
  };
};

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
  turnDeadlineAt: Date.now() + ONLINE_TURN_TIMEOUT_MS,
  lastAction: null,
});

const isRoomReadyForAction = room =>
  room?.status === 'playing' &&
  Boolean(room?.players?.player1?.uid) &&
  Boolean(room?.players?.player2?.uid);

const assertRoomReadyForAction = async ({roomId, roomSnapshot = null, uid, playerNo}) => {
  const normalizedRoomId = normalizeRoomId(roomId);
  const room = roomSnapshot ?? await getRoom(normalizedRoomId);

  if (!room) {
    throw createRoomError(
      'room/unavailable',
      'Room code is invalid or the room no longer exists.',
    );
  }

  if (room?.status === 'finished' || room?.game?.winner != null) {
    throw createRoomError(
      'room/finished',
      'This room already has a winner.',
    );
  }

  if (room?.status === 'waiting') {
    throw createRoomError(
      'room/not-ready',
      'Wait for the opponent to join before sending online moves.',
    );
  }

  if (room?.status !== 'playing') {
    throw createRoomError(
      'room/inactive',
      'This room is no longer active.',
    );
  }

  if (!isRoomReadyForAction(room)) {
    throw createRoomError(
      'room/not-ready',
      'Wait for the opponent to join before sending online moves.',
    );
  }

  if (room?.players?.[`player${playerNo}`]?.uid !== uid) {
    throw createRoomError(
      'room/forbidden',
      'This device is not the active owner of that player slot in the room.',
    );
  }
};

const createRoomActionError = reason => {
  switch (reason) {
    case 'room-waiting':
      return createRoomError(
        'room/not-ready',
        'Wait for the opponent to join before starting the match.',
      );
    case 'room-not-found':
      return createRoomError(
        'room/unavailable',
        'Room code is invalid or the room no longer exists.',
      );
    case 'room-not-playing':
      return createRoomError(
        'room/inactive',
        'This room is no longer active.',
      );
    case 'player-mismatch':
      return createRoomError(
        'room/forbidden',
        'This player is not allowed to control the room turn.',
      );
    case 'game-finished':
      return createRoomError(
        'room/finished',
        'This room already has a winner.',
      );
    case 'not-your-turn':
      return createRoomError(
        'room/not-your-turn',
        'It is not your turn yet.',
      );
    case 'move-already-pending':
    case 'roll-required':
      return createRoomError(
        'room/already-rolled',
        'This turn already has a pending piece move.',
      );
    case 'piece-required':
    case 'piece-not-found':
    case 'piece-cannot-move':
      return createRoomError(
        'room/invalid-piece',
        'That token cannot be moved right now.',
      );
    default:
      return createRoomError(
        'room/action-rejected',
        'The room action could not be completed.',
      );
  }
};

const waitForRoomActionResult = actionRef =>
  new Promise((resolve, reject) => {
    let unsubscribe = null;

    const timer = setTimeout(() => {
      if (unsubscribe) {
        unsubscribe();
      }

      reject(
        createRoomError(
          'room/action-timeout',
          'Server did not process the online room action in time. Deploy Firebase Functions and database rules, then try again.',
        ),
      );
    }, ROOM_ACTION_WAIT_MS);

    unsubscribe = onValue(
      actionRef,
      snapshot => {
        if (!snapshot.exists()) {
          return;
        }

        const action = snapshot.val();

        if (action?.status === 'processed') {
          clearTimeout(timer);
          unsubscribe?.();
          resolve(action.result ?? null);
          return;
        }

        if (action?.status === 'rejected') {
          clearTimeout(timer);
          unsubscribe?.();
          reject(createRoomActionError(action.error));
        }
      },
      error => {
        clearTimeout(timer);
        unsubscribe?.();
        reject(error);
      },
    );
  });

const buildWaitingRoomState = ({roomId, uid, name}) => ({
  code: roomId,
  status: 'waiting',
  currentTurn: uid,
  startTime: null,
  timeLimit: ONLINE_MATCH_TIME_LIMIT_SECONDS,
  endTime: null,
  winner: null,
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

      return buildWaitingRoomState({roomId, uid, name});
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
  const normalizedRoomId = normalizeRoomId(roomId);
  const roomRef = ref(db, `rooms/${normalizedRoomId}`);
  const joinedAt = Date.now();

  const result = await runTransaction(roomRef, currentRoom => {
    if (!currentRoom || currentRoom.status !== 'waiting') {
      return currentRoom;
    }

    return {
      ...currentRoom,
      code: normalizeRoomId(currentRoom.code || normalizedRoomId),
      status: 'playing',
      currentTurn: currentRoom?.players?.player1?.uid ?? currentRoom?.hostUid ?? null,
      startTime: joinedAt,
      timeLimit: getRoomTimeLimitSeconds(currentRoom),
      endTime: null,
      winner: null,
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
        turnDeadlineAt: Date.now() + ONLINE_TURN_TIMEOUT_MS,
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
  const normalizedRoomId = normalizeRoomId(roomId);
  if (!normalizedRoomId) {
    return null;
  }

  const snapshot = await get(ref(db, `rooms/${normalizedRoomId}`));
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
  const normalizedRoomId = normalizeRoomId(roomId);
  const roomRef = ref(db, `rooms/${normalizedRoomId}`);

  return onValue(roomRef, snapshot => {
    callback(snapshot.exists() ? snapshot.val() : null);
  });
};

export const subscribeToRoomGame = (roomId, callback) => {
  const normalizedRoomId = normalizeRoomId(roomId);
  const gameRef = ref(db, `rooms/${normalizedRoomId}/game`);

  return onValue(gameRef, snapshot => {
    callback(snapshot.exists() ? snapshot.val() : null);
  });
};

export const setPlayerConnected = async ({roomId, playerNo, connected}) => {
  const normalizedRoomId = normalizeRoomId(roomId);

  await update(ref(db, `rooms/${normalizedRoomId}`), {
    [`players/player${playerNo}/connected`]: connected,
    updatedAt: serverTimestamp(),
  });
};

export const queueRoomAction = async ({
  roomId,
  roomSnapshot = null,
  uid,
  playerNo,
  type,
  payload = {},
}) => {
  const normalizedRoomId = normalizeRoomId(roomId);

  await assertRoomReadyForAction({
    roomId: normalizedRoomId,
    roomSnapshot,
    uid,
    playerNo,
  });

  const actionRef = push(ref(db, `roomActions/${normalizedRoomId}`));

  await set(actionRef, {
    uid,
    playerNo,
    type,
    payload,
    status: 'pending',
    createdAt: serverTimestamp(),
  });

  return waitForRoomActionResult(actionRef);
};

export const finishRoomOnTimeout = async roomId => {
  const normalizedRoomId = normalizeRoomId(roomId);
  if (!normalizedRoomId) {
    return null;
  }

  const roomRef = ref(db, `rooms/${normalizedRoomId}`);
  const now = Date.now();
  const result = await runTransaction(roomRef, currentRoom => {
    if (!currentRoom || currentRoom.status !== 'playing') {
      return currentRoom;
    }

    if (currentRoom?.game?.winner != null) {
      return currentRoom;
    }

    if (!hasTimedMatchExpired(currentRoom, now)) {
      return currentRoom;
    }

    return buildTimedOutRoomState(currentRoom, now);
  });

  if (!result.snapshot.exists()) {
    return null;
  }

  return result.snapshot.val();
};
