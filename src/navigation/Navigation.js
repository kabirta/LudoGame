import React from 'react';

import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';

import {navigationRef} from '../helpers/NavigationUtil';
// Import screens
import HomeScreen from '../screens/HomeScreen';
import LudoBoardScreen from '../screens/LudoBoardScreen';
import SplashScreen from '../screens/SplashScreen';

const Stack = createNativeStackNavigator();

const Navigation = () => {
  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator
        initialRouteName="SplashScreen"
        screenOptions={{
          headerShown: false,
          animation: 'fade', // Apply fade animation to all screens
        }}>
        <Stack.Screen name="SplashScreen" component={SplashScreen} />
        <Stack.Screen name="HomeScreen" component={HomeScreen} />
        <Stack.Screen name="LudoBoardScreen" component={LudoBoardScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default Navigation;
