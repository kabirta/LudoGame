import {
  FLUSH,
  PAUSE,
  PERSIST,
  persistReducer,
  persistStore,
  PURGE,
  REGISTER,
  REHYDRATE,
} from 'redux-persist';

import {configureStore} from '@reduxjs/toolkit';

import rootReducer from './rootReducer';
import reduxStorage from './storage';

const persistConfig = {
  key: 'root',
  storage: reduxStorage,
  whitelist: ['game'], // Only persist the 'game' slice
};

// Create persisted reducer
const persistedReducer = persistReducer(persistConfig, rootReducer);

// Create store with middleware
export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoreActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

// Create and export persistor
export const persistor = persistStore(store);
