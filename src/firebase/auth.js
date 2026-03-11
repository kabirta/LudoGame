import {
  GoogleAuthProvider,
  signOut,
  signInAnonymously,
  signInWithCredential,
  updateProfile,
} from 'firebase/auth';
import {NativeModules, TurboModuleRegistry} from 'react-native';

import {googleAuthConfig} from './runtimeConfig';
import {auth} from './config';

export {googleAuthConfig};

let isGoogleSignInConfigured = false;
const GOOGLE_SIGNIN_MODULE_NAME = 'RNGoogleSignin';

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
