// ✅ EXPO CONVERTED
import './global.css';
import './src/helpers/BackHandlerCompat';

import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useFonts } from 'expo-font';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';

import Navigation from './src/navigation/Navigation';
import { persistor, store } from './src/redux/store';

const App = () => {
  const [fontsLoaded] = useFonts({
    'Philosopher-Bold': require('./src/assets/fonts/Philosopher-Bold.ttf'),
    'Philosopher-Regular': require('./src/assets/fonts/Philosopher-Regular.ttf'),
  });

  if (!fontsLoaded) {
    return (
      <View className="flex-1 justify-center items-center bg-black">
        <ActivityIndicator size="large" color="white" />
      </View>
    );
  }

  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <Navigation />
      </PersistGate>
    </Provider>
  );
};

export default App;
