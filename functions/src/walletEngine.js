const admin = require('firebase-admin');

const DISPLAY_NAME_MAX_LENGTH = 40;
const DEFAULT_WALLET = Object.freeze({
  addedAmount: 0,
  totalBalance: 0,
  winnings: 0,
});

const normalizeCurrencyAmount = value => {
  const numericValue = typeof value === 'number' ? value : Number(value);

  if (!Number.isFinite(numericValue)) {
    return 0;
  }

  return Math.max(Math.round(numericValue * 100) / 100, 0);
};

const normalizeNullableString = value => {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : null;
};

const sanitizeDisplayName = value =>
  `${value ?? ''}`
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, DISPLAY_NAME_MAX_LENGTH);

const getRoomWinnerUid = room => {
  if (typeof room?.winner === 'string' && room.winner.trim()) {
    return room.winner.trim();
  }

  if (room?.game?.winner === 1 || room?.game?.winner === 'player1') {
    return room?.players?.player1?.uid ?? null;
  }

  if (room?.game?.winner === 2 || room?.game?.winner === 'player2') {
    return room?.players?.player2?.uid ?? null;
  }

  return null;
};

const getWinnerFallbackName = (room, winnerUid, authUser = null) => {
  const player1Uid = room?.players?.player1?.uid ?? null;
  const player2Uid = room?.players?.player2?.uid ?? null;

  if (player1Uid && player1Uid === winnerUid) {
    return room?.players?.player1?.name ?? null;
  }

  if (player2Uid && player2Uid === winnerUid) {
    return room?.players?.player2?.name ?? null;
  }

  return authUser?.displayName ?? authUser?.email ?? 'Player';
};

const normalizeWallet = wallet => ({
  addedAmount: normalizeCurrencyAmount(wallet?.addedAmount),
  totalBalance: normalizeCurrencyAmount(wallet?.totalBalance),
  winnings: normalizeCurrencyAmount(wallet?.winnings),
});

const normalizeWalletTransactions = walletTransactions => {
  if (
    !walletTransactions ||
    typeof walletTransactions !== 'object' ||
    Array.isArray(walletTransactions)
  ) {
    return {};
  }

  return walletTransactions;
};

const buildProfilePayload = ({authUser = null, fallbackDisplayName = 'Player'}) => {
  const displayName =
    sanitizeDisplayName(fallbackDisplayName) ||
    sanitizeDisplayName(authUser?.displayName) ||
    sanitizeDisplayName(authUser?.email) ||
    'Player';

  return {
    displayName,
    baseDisplayName: displayName,
    nameChangeCount: 0,
    email: normalizeNullableString(authUser?.email),
    photoURL: normalizeNullableString(authUser?.photoURL),
    isAnonymous: Boolean(authUser && Array.isArray(authUser.providerData) && authUser.providerData.length === 0),
    wallet: {
      ...DEFAULT_WALLET,
    },
    walletTransactions: {},
    createdAt: admin.database.ServerValue.TIMESTAMP,
    updatedAt: admin.database.ServerValue.TIMESTAMP,
  };
};

const normalizeExistingProfile = (
  profile,
  {authUser = null, fallbackDisplayName = 'Player'} = {},
) => {
  const baseDisplayName =
    sanitizeDisplayName(profile?.baseDisplayName) ||
    sanitizeDisplayName(profile?.displayName) ||
    sanitizeDisplayName(fallbackDisplayName) ||
    sanitizeDisplayName(authUser?.displayName) ||
    sanitizeDisplayName(authUser?.email) ||
    'Player';
  const displayName =
    sanitizeDisplayName(profile?.displayName) || baseDisplayName;

  return {
    ...profile,
    displayName,
    baseDisplayName,
    nameChangeCount:
      typeof profile?.nameChangeCount === 'number' ? profile.nameChangeCount : 0,
    email:
      normalizeNullableString(profile?.email) ??
      normalizeNullableString(authUser?.email),
    photoURL:
      normalizeNullableString(profile?.photoURL) ??
      normalizeNullableString(authUser?.photoURL),
    isAnonymous:
      typeof profile?.isAnonymous === 'boolean'
        ? profile.isAnonymous
        : Boolean(authUser && Array.isArray(authUser.providerData) && authUser.providerData.length === 0),
    wallet: normalizeWallet(profile?.wallet),
    walletTransactions: normalizeWalletTransactions(profile?.walletTransactions),
    createdAt: profile?.createdAt ?? admin.database.ServerValue.TIMESTAMP,
    updatedAt: admin.database.ServerValue.TIMESTAMP,
  };
};

const creditFinishedRoomPrize = async ({room, roomId}) => {
  const normalizedRoomId = `${roomId ?? ''}`.trim();
  const winnerUid = getRoomWinnerUid(room);
  const normalizedPrizePool = normalizeCurrencyAmount(room?.prizePool);

  if (
    !room ||
    room?.status !== 'finished' ||
    !normalizedRoomId ||
    !winnerUid ||
    winnerUid === 'draw' ||
    normalizedPrizePool <= 0
  ) {
    return {
      credited: false,
      reason: 'room-not-eligible',
    };
  }

  let authUser = null;
  try {
    authUser = await admin.auth().getUser(winnerUid);
  } catch (error) {
    console.warn(`Could not load auth user for room prize settlement: ${winnerUid}`, error);
  }

  const fallbackDisplayName = getWinnerFallbackName(room, winnerUid, authUser);
  const profileRef = admin.database().ref(`users/${winnerUid}`);
  const transactionKey = `room-win-${normalizedRoomId}`;
  let transactionState = 'pending';

  const result = await profileRef.transaction(currentProfile => {
    const existingProfile = currentProfile
      ? normalizeExistingProfile(currentProfile, {
          authUser,
          fallbackDisplayName,
        })
      : buildProfilePayload({
          authUser,
          fallbackDisplayName,
        });
    const wallet = normalizeWallet(existingProfile.wallet);
    const walletTransactions = normalizeWalletTransactions(
      existingProfile.walletTransactions,
    );

    if (walletTransactions[transactionKey]) {
      transactionState = 'duplicate';
      return currentProfile;
    }

    const nextTotalBalance = normalizeCurrencyAmount(
      wallet.totalBalance + normalizedPrizePool,
    );
    const nextWinnings = normalizeCurrencyAmount(
      wallet.winnings + normalizedPrizePool,
    );

    transactionState = 'credited';

    return {
      ...existingProfile,
      wallet: {
        ...wallet,
        totalBalance: nextTotalBalance,
        winnings: nextWinnings,
      },
      walletTransactions: {
        ...walletTransactions,
        [transactionKey]: {
          amount: normalizedPrizePool,
          balanceAfter: nextTotalBalance,
          createdAt: admin.database.ServerValue.TIMESTAMP,
          roomCode: room?.code ?? normalizedRoomId,
          roomId: normalizedRoomId,
          type: 'room-win',
        },
      },
      updatedAt: admin.database.ServerValue.TIMESTAMP,
    };
  });

  return {
    credited: transactionState === 'credited',
    profile: result.snapshot.exists() ? result.snapshot.val() : null,
    reason: transactionState,
  };
};

module.exports = {
  creditFinishedRoomPrize,
};
