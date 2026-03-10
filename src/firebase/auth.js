import {signInAnonymously, updateProfile} from 'firebase/auth';

import {auth} from './config';

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
