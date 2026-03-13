import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  getCurrentUser,
  waitForAuthReady,
} from './auth';
import {
  claimRoomPrizeIfWinner,
  getRoom,
  normalizeRoomId,
} from './rooms';

const ACTIVE_ONLINE_ROOM_SESSION_KEY = '@ludozeng/active-online-room';

const normalizePlayerNo = playerNo =>
  playerNo === 1 || playerNo === 2 ? playerNo : null;

export const persistOnlineRoomSession = async ({
  roomId,
  playerNo,
  prizePool = null,
}) => {
  const normalizedRoomId = normalizeRoomId(roomId);
  const normalizedPlayerNo = normalizePlayerNo(playerNo);

  if (!normalizedRoomId || normalizedPlayerNo == null) {
    return;
  }

  await AsyncStorage.setItem(
    ACTIVE_ONLINE_ROOM_SESSION_KEY,
    JSON.stringify({
      roomId: normalizedRoomId,
      playerNo: normalizedPlayerNo,
      prizePool,
      updatedAt: Date.now(),
    }),
  );
};

export const clearOnlineRoomSession = () =>
  AsyncStorage.removeItem(ACTIVE_ONLINE_ROOM_SESSION_KEY);

export const getStoredOnlineRoomSession = async () => {
  const rawValue = await AsyncStorage.getItem(ACTIVE_ONLINE_ROOM_SESSION_KEY);

  if (!rawValue) {
    return null;
  }

  try {
    const parsedValue = JSON.parse(rawValue);
    const normalizedRoomId = normalizeRoomId(parsedValue?.roomId);
    const normalizedPlayerNo = normalizePlayerNo(parsedValue?.playerNo);

    if (!normalizedRoomId || normalizedPlayerNo == null) {
      await clearOnlineRoomSession();
      return null;
    }

    return {
      roomId: normalizedRoomId,
      playerNo: normalizedPlayerNo,
      prizePool: parsedValue?.prizePool ?? null,
      updatedAt: parsedValue?.updatedAt ?? null,
    };
  } catch (_error) {
    await clearOnlineRoomSession();
    return null;
  }
};

export const getResumableOnlineRoomSession = async () => {
  const storedSession = await getStoredOnlineRoomSession();

  if (!storedSession) {
    return null;
  }

  await waitForAuthReady();
  const currentUser = getCurrentUser();

  if (!currentUser?.uid) {
    await clearOnlineRoomSession();
    return null;
  }

  const room = await getRoom(storedSession.roomId);

  if (!room) {
    await clearOnlineRoomSession();
    return null;
  }

  if (room?.status === 'finished' || room?.game?.winner != null) {
    try {
      await claimRoomPrizeIfWinner({
        prizePool: room?.prizePool ?? storedSession.prizePool,
        roomId: storedSession.roomId,
        roomSnapshot: room,
        user: currentUser,
      });
      await clearOnlineRoomSession();
    } catch (error) {
      console.error('Failed to credit a finished online room prize.', error);
    }
    return null;
  }

  if (room?.players?.[`player${storedSession.playerNo}`]?.uid !== currentUser.uid) {
    await clearOnlineRoomSession();
    return null;
  }

  return {
    ...storedSession,
    room,
  };
};
