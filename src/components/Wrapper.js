import React from 'react';

import {
  ImageBackground,
  SafeAreaView,
  StyleSheet,
} from 'react-native';

import BG from '../assets/images/bg.jpeg';
import {
  deviceHeight,
  deviceWidth,
} from '../constants/Scaling';

const Wrapper = ({ children, style }) => {  
  return (
    <ImageBackground
      source={BG} 
      resizeMode="cover"  
      style={styles.background}  
    >
      <SafeAreaView style={styles.safeArea}>
        {children}  
      </SafeAreaView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1, 
    width: deviceWidth,  
    height: deviceHeight,  
  },
  safeArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default Wrapper;
