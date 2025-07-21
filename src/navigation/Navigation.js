import React from 'react';

import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';

import {navigationRef} from '../helpers/NavigationUtil';
// Import screens
import HomeScreen from '../screens/HomeScreen';
import LobbyScreen from '../screens/LobbyScreen';
import LudoBoardScreen from '../screens/LudoBoardScreen';
import SplashScreen from '../screens/SplashScreen';
import TwoPlayerLudoScreen from '../screens/TwoPlayerLudoScreen';
import OtpScreen from '../screens/OtpScreen';
import LoginScreen from '../screens/LoginScreen';

const Stack = createNativeStackNavigator();

const Navigation = () => {
  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator
        initialRouteName="LoginScreen"
        screenOptions={{
          headerShown: false,
          animation: 'fade', // Apply fade animation to all screens
        }}>
        <Stack.Screen name="SplashScreen" component={SplashScreen} />
        <Stack.Screen name="LoginScren" component={LoginScreen}/>
        <Stack.Screen name="OtpScreen" component={OtpScreen}/>
        
        <Stack.Screen name='LobbyScreen' component={LobbyScreen}/>
        <Stack.Screen name="LudoBoardScreen" component={LudoBoardScreen} />
        <Stack.Screen name='TwoPlayerLudoScreen' component={TwoPlayerLudoScreen}/>
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default Navigation;
