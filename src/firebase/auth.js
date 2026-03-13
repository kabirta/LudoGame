import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signOut,
  signInAnonymously,
  signInWithCredential,
} from 'firebase/auth';
import {NativeModules, TurboModuleRegistry} from 'react-native';

import {googleAuthConfig} from './runtimeConfig';
import {auth} from './config';
import {
  ensureUserProfile,
  getUserProfile,
  updateUserDisplayNameOnce,
} from './users';

export {googleAuthConfig};

let isGoogleSignInConfigured = false;
const GOOGLE_SIGNIN_MODULE_NAME = 'RNGoogleSignin';
let authReadyPromise = null;

export const googleSignInStatusCodes = {
  IN_PROGRESS: 'IN_PROGRESS',
  PLAY_SERVICES_NOT_AVAILABLE: 'PLAY_SERVICES_NOT_AVAILABLE',
  SIGN_IN_CANCELLED: 'SIGN_IN_CANCELLED',
  NATIVE_MODULE_NOT_FOUND: 'NATIVE_MODULE_NOT_FOUND',
};

export const hasGoogleAuthConfig = Boolean(googleAuthConfig.webClientId);

export const hasNativeGoogleSignInModule = () => {
  const turboModule =
    typeof TurboModuleRegistry?.get === 'function'
      ? TurboModuleRegistry.get(GOOGLE_SIGNIN_MODULE_NAME)
      : null;

  return Boolean(turboModule || NativeModules[GOOGLE_SIGNIN_MODULE_NAME]);
};

const getGoogleSignInModule = () => {
  if (!hasNativeGoogleSignInModule()) {
    const error = new Error(
      'RNGoogleSignin is not registered in this native binary.',
    );
    error.code = googleSignInStatusCodes.NATIVE_MODULE_NOT_FOUND;
    throw error;
  }

  return require('@react-native-google-signin/google-signin').GoogleSignin;
};

export const configureGoogleSignIn = () => {
  if (
    !hasGoogleAuthConfig ||
    isGoogleSignInConfigured ||
    !hasNativeGoogleSignInModule()
  ) {
    return;
  }

  const GoogleSignin = getGoogleSignInModule();

  GoogleSignin.configure({
    webClientId: googleAuthConfig.webClientId,
    scopes: ['openid', 'profile', 'email'],
  });
  isGoogleSignInConfigured = true;
};

export const waitForAuthReady = () => {
  if (typeof auth?.authStateReady === 'function') {
    return auth.authStateReady();
  }

  if (!authReadyPromise) {
    authReadyPromise = new Promise(resolve => {
      const unsubscribe = onAuthStateChanged(auth, () => {
        unsubscribe();
        resolve(auth.currentUser);
      });
    });
  }

  return authReadyPromise;
};

export const ensureSignedIn = async displayName => {
  let currentUser = auth.currentUser;

  if (!currentUser) {
    const credential = await signInAnonymously(auth);
    currentUser = credential.user;
  }

  await ensureUserProfile(currentUser, displayName);
  return currentUser;
};

export const getCurrentUser = () => auth.currentUser;

export const getCurrentUserProfile = async () => {
  const currentUser = auth.currentUser;

  if (!currentUser?.uid) {
    return null;
  }

  return getUserProfile(currentUser.uid);
};

export const updateCurrentUserProfile = async updates => {
  const currentUser = auth.currentUser;

  if (!currentUser) {
    throw new Error('No signed-in user to update.');
  }

  if (typeof updates?.displayName === 'string') {
    return updateUserDisplayNameOnce(currentUser, updates.displayName);
  }

  await ensureUserProfile(currentUser);
  return getUserProfile(currentUser.uid);
};

export const signOutCurrentUser = async () => {
  const currentUser = auth.currentUser;

  if (!currentUser) {
    return;
  }

  const isGoogleUser = currentUser.providerData?.some(
    provider => provider.providerId === 'google.com',
  );

  if (isGoogleUser && hasGoogleAuthConfig) {
    configureGoogleSignIn();

    try {
      const GoogleSignin = getGoogleSignInModule();
      await GoogleSignin.signOut();
    } catch (error) {
      console.warn('Google sign-out cleanup failed.', error);
    }
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
  await ensureUserProfile(result.user);

  return result.user;
};

export const signInWithGoogle = async () => {
  if (!hasGoogleAuthConfig) {
    throw new Error('Google sign-in is missing a Web OAuth client ID.');
  }

  configureGoogleSignIn();
  const GoogleSignin = getGoogleSignInModule();
  await GoogleSignin.hasPlayServices({showPlayServicesUpdateDialog: true});

  const result = await GoogleSignin.signIn();

  if (result.type !== 'success') {
    return null;
  }

  const {idToken} = result.data;

  if (!idToken) {
    throw new Error(
      'Google sign-in did not return an ID token. Verify the Web OAuth client ID configuration.',
    );
  }

  return signInWithGoogleTokens({idToken});
};
