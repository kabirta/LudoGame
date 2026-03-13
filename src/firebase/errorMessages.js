const formatErrorCode = error => {
  if (typeof error?.code === 'string' && error.code.trim()) {
    return error.code.trim();
  }

  return null;
};

export const getFirebaseSetupErrorMessage = error => {
  const code = formatErrorCode(error);

  if (
    code === 'auth/operation-not-allowed' ||
    code === 'auth/admin-restricted-operation'
  ) {
    return `Anonymous Firebase Auth is disabled. Enable Anonymous sign-in in Firebase Authentication before using online play.${code ? ` (${code})` : ''}`;
  }

  if (code === 'database/permission-denied' || code === 'PERMISSION_DENIED') {
    return `Realtime Database rules are blocking this operation. Allow authenticated users to read and write the /rooms, /roomActions, and /users paths they need.${code ? ` (${code})` : ''}`;
  }

  if (code === 'room/unavailable') {
    return 'Room code is invalid or that room is no longer waiting for an opponent.';
  }

  if (code === 'room/not-ready') {
    return 'Wait for the opponent to fully join and for the board to unlock before rolling or moving a token.';
  }

  if (code === 'room/full') {
    return 'That room already has two players or the match has already started.';
  }

  if (code === 'room/not-your-turn') {
    return 'It is not your turn yet. Wait for the opponent turn to finish.';
  }

  if (code === 'room/already-rolled') {
    return 'This turn already has a dice result. Move one of the highlighted tokens.';
  }

  if (code === 'room/invalid-piece') {
    return 'That token cannot be moved right now. Choose one of the active tokens.';
  }

  if (code === 'room/forbidden') {
    return 'This device is not the active owner of that player slot in the room.';
  }

  if (code === 'room/action-rejected') {
    return 'The server rejected this online action. Make sure both players are on the same app build, then leave and create a fresh room.';
  }

  if (code === 'room/finished') {
    return 'This online room already has a winner.';
  }

  if (code === 'room/action-timeout') {
    return 'The online action was queued but the server did not process it in time. Deploy Firebase Functions and database rules, then try again.';
  }

  if (code === 'profile/name-change-limit-reached') {
    return 'Display name can only be changed once for each account.';
  }

  if (code === 'profile/name-required') {
    return 'Enter a valid display name before saving.';
  }

  if (code === 'profile/user-missing') {
    return 'Sign in before trying to save a permanent player name.';
  }

  if (
    code === 'auth/network-request-failed' ||
    code === 'database/unavailable'
  ) {
    return `Firebase could not reach the network or the Realtime Database instance. Verify internet access and the database URL.${code ? ` (${code})` : ''}`;
  }

  if (code) {
    return `Firebase rejected the request. Check Authentication, Realtime Database rules, and project configuration.${` (${code})`}`;
  }

  if (typeof error?.message === 'string' && error.message.trim()) {
    return error.message.trim();
  }

  return 'Firebase rejected the request. Check Authentication, Realtime Database rules, and project configuration.';
};
