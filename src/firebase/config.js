import {initializeApp, getApps, getApp} from 'firebase/app';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getAuth,
  getReactNativePersistence,
  initializeAuth,
} from 'firebase/auth';
import {getDatabase} from 'firebase/database';

import {firebaseConfig} from './runtimeConfig';

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

const createAuth = () => {
  try {
    return initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch (error) {
    return getAuth(app);
  }
};

export const auth = createAuth();
export const db = getDatabase(app);
export default app;
