import {initializeApp, getApps, getApp} from 'firebase/app';
import {getAuth} from 'firebase/auth';
import {getDatabase} from 'firebase/database';

import {firebaseConfig} from './androidConfig';

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getDatabase(app);
export default app;
