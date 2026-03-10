import {
  GoogleAuthProvider,
  signOut,
  signInAnonymously,
  signInWithCredential,
  updateProfile,
} from 'firebase/auth';

import {auth} from './config';

export const googleAuthConfig = {
  androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
  iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
};

export const hasGoogleAuthConfig = Boolean(
  googleAuthConfig.androidClientId ||
    googleAuthConfig.iosClientId ||
    googleAuthConfig.webClientId,
);

export const ensureSignedIn = async displayName => {
  const currentUser = auth.currentUser;

  if (currentUser) {
    if (displayName && currentUser.displayName !== displayName) {
      await updateProfile(currentUser, {displayName});
    }

    return currentUser;
  }

  const credential = await signInAnonymously(auth);
  const signedInUser = credential.user;

  if (displayName) {
    await updateProfile(signedInUser, {displayName});
  }

  return signedInUser;
};

export const getCurrentUser = () => auth.currentUser;

export const updateCurrentUserProfile = async updates => {
  const currentUser = auth.currentUser;

  if (!currentUser) {
    throw new Error('No signed-in user to update.');
  }

  await updateProfile(currentUser, updates);
  return currentUser;
};

export const signOutCurrentUser = async () => {
  if (!auth.currentUser) {
    return;
  }

  await signOut(auth);
};

export const signInWithGoogleTokens = async ({idToken, accessToken}) => {
  if (!idToken && !accessToken) {
    throw new Error('Google sign-in did not return an ID token or access token.');
  }

  const credential = GoogleAuthProvider.credential(
    idToken ?? null,
    accessToken ?? null,
  );
  const result = await signInWithCredential(auth, credential);

  return result.user;
};
