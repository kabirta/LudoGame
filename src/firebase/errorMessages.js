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

  if (code === 'room/full') {
    return 'That room already has two players or the match has already started.';
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
