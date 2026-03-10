import React from 'react';

import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';

import {navigationRef} from '../helpers/NavigationUtil';
// Import screens
import HomeScreen from '../screens/HomeScreen';
import LoginScreen from '../screens/LoginScreen';
import LudoBoardScreen from '../screens/LudoBoardScreen';
import OtpScreen from '../screens/OtpScreen';
import SettingsScreen from '../screens/SettingsScreen';
import SplashScreen from '../screens/SplashScreen';
import WaitingForOpponentScreen from '../screens/WaitingForOpponentScreen';
import WalletScreen from '../screens/WalletScreen';

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
        <Stack.Screen name="LoginScreen" component={LoginScreen} />
        <Stack.Screen name="OtpScreen" component={OtpScreen} />
        <Stack.Screen name="HomeScreen" component={HomeScreen} />
        <Stack.Screen name="SettingsScreen" component={SettingsScreen} />
        <Stack.Screen name="WalletScreen" component={WalletScreen} />
        <Stack.Screen name="LudoBoardScreen" component={LudoBoardScreen} />
        <Stack.Screen
          name="WaitingForOpponentScreen"
          component={WaitingForOpponentScreen}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default Navigation;
