import {
  get,
  ref,
  runTransaction,
  serverTimestamp,
  set,
  update,
} from 'firebase/database';
import {updateProfile} from 'firebase/auth';

import {db} from './config';

const DISPLAY_NAME_MAX_LENGTH = 40;

const createProfileError = (code, message) => {
  const error = new Error(message);
  error.code = code;
  return error;
};

export const sanitizeDisplayName = value =>
  `${value ?? ''}`
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, DISPLAY_NAME_MAX_LENGTH);

export const getDefaultDisplayNameForUser = (user, fallback = 'Player') => {
  const emailAddress =
    typeof user?.email === 'string' ? user.email.trim() : '';
  const preferred = emailAddress || user?.displayName || fallback;
  const sanitized = sanitizeDisplayName(preferred);

  return sanitized || 'Player';
};

const normalizeNullableString = value => {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : null;
};

const buildProfilePayload = ({
  user,
  displayName,
  baseDisplayName,
  nameChangeCount,
}) => ({
  displayName,
  baseDisplayName,
  nameChangeCount,
  email: normalizeNullableString(user?.email),
  photoURL: normalizeNullableString(user?.photoURL),
  isAnonymous: Boolean(user?.isAnonymous),
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
});

const syncAuthDisplayName = async (user, displayName) => {
  if (!user || !displayName || user.displayName === displayName) {
    return user;
  }

  await updateProfile(user, {displayName});
  return user;
};

const normalizeExistingProfile = profile => ({
  ...profile,
  nameChangeCount:
    typeof profile?.nameChangeCount === 'number' ? profile.nameChangeCount : 0,
});

export const getUserProfile = async uid => {
  if (!uid) {
    return null;
  }

  const snapshot = await get(ref(db, `users/${uid}`));
  if (!snapshot.exists()) {
    return null;
  }

  return normalizeExistingProfile(snapshot.val());
};

export const ensureUserProfile = async (user, fallbackDisplayName = 'Player') => {
  if (!user?.uid) {
    throw createProfileError(
      'profile/user-missing',
      'No authenticated user is available for profile setup.',
    );
  }

  const profileRef = ref(db, `users/${user.uid}`);
  const snapshot = await get(profileRef);

  if (!snapshot.exists()) {
    const baseDisplayName = getDefaultDisplayNameForUser(user, fallbackDisplayName);
    const initialProfile = buildProfilePayload({
      user,
      displayName: baseDisplayName,
      baseDisplayName,
      nameChangeCount: 0,
    });

    await set(profileRef, initialProfile);
    await syncAuthDisplayName(user, baseDisplayName);

    return {
      ...initialProfile,
      displayName: baseDisplayName,
      baseDisplayName,
      nameChangeCount: 0,
    };
  }

  const existingProfile = normalizeExistingProfile(snapshot.val());
  const updates = {};
  const nextEmail = normalizeNullableString(user.email);
  const nextPhotoURL = normalizeNullableString(user.photoURL);
  const nextIsAnonymous = Boolean(user.isAnonymous);

  if (!existingProfile.baseDisplayName) {
    updates.baseDisplayName = getDefaultDisplayNameForUser(
      user,
      existingProfile.displayName || fallbackDisplayName,
    );
  }

  if (!existingProfile.displayName) {
    updates.displayName =
      updates.baseDisplayName ||
      getDefaultDisplayNameForUser(user, fallbackDisplayName);
  }

  if (typeof existingProfile.nameChangeCount !== 'number') {
    updates.nameChangeCount = 0;
  }

  if (!existingProfile.createdAt) {
    updates.createdAt = serverTimestamp();
  }

  if (existingProfile.email !== nextEmail) {
    updates.email = nextEmail;
  }

  if (existingProfile.photoURL !== nextPhotoURL) {
    updates.photoURL = nextPhotoURL;
  }

  if (existingProfile.isAnonymous !== nextIsAnonymous) {
    updates.isAnonymous = nextIsAnonymous;
  }

  let nextProfile = existingProfile;

  if (Object.keys(updates).length > 0) {
    updates.updatedAt = serverTimestamp();
    await update(profileRef, updates);
    nextProfile = {
      ...existingProfile,
      ...updates,
    };
  }

  await syncAuthDisplayName(user, nextProfile.displayName);
  return nextProfile;
};

export const updateUserDisplayNameOnce = async (user, nextDisplayName) => {
  if (!user?.uid) {
    throw createProfileError(
      'profile/user-missing',
      'No authenticated user is available for profile updates.',
    );
  }

  const sanitizedDisplayName = sanitizeDisplayName(nextDisplayName);
  if (!sanitizedDisplayName) {
    throw createProfileError(
      'profile/name-required',
      'Enter a valid display name before saving.',
    );
  }

  const profileRef = ref(db, `users/${user.uid}`);
  const fallbackBaseName = getDefaultDisplayNameForUser(user, 'Player');
  const result = await runTransaction(profileRef, currentProfile => {
    const existingProfile = normalizeExistingProfile(currentProfile ?? {});
    const baseDisplayName =
      existingProfile.baseDisplayName || fallbackBaseName;
    const currentDisplayName =
      existingProfile.displayName || baseDisplayName;
    const currentNameChangeCount = existingProfile.nameChangeCount ?? 0;

    if (!currentProfile) {
      return buildProfilePayload({
        user,
        displayName: sanitizedDisplayName,
        baseDisplayName,
        nameChangeCount:
          sanitizedDisplayName === baseDisplayName ? 0 : 1,
      });
    }

    if (sanitizedDisplayName === currentDisplayName) {
      return {
        ...existingProfile,
        email: normalizeNullableString(user.email),
        photoURL: normalizeNullableString(user.photoURL),
        isAnonymous: Boolean(user.isAnonymous),
        updatedAt: serverTimestamp(),
      };
    }

    if (currentNameChangeCount >= 1) {
      return;
    }

    return {
      ...existingProfile,
      displayName: sanitizedDisplayName,
      baseDisplayName,
      nameChangeCount: 1,
      email: normalizeNullableString(user.email),
      photoURL: normalizeNullableString(user.photoURL),
      isAnonymous: Boolean(user.isAnonymous),
      updatedAt: serverTimestamp(),
    };
  });

  if (!result.committed || !result.snapshot.exists()) {
    throw createProfileError(
      'profile/name-change-limit-reached',
      'Display name can only be changed once.',
    );
  }

  const updatedProfile = normalizeExistingProfile(result.snapshot.val());
  await syncAuthDisplayName(user, updatedProfile.displayName);
  return updatedProfile;
};
