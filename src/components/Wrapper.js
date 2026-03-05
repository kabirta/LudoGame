// ✅ EXPO CONVERTED
import React from 'react';
import { ImageBackground, SafeAreaView } from 'react-native';
import { deviceHeight, deviceWidth } from '../constants/Scaling';

import BG from '../assets/images/bg.jpeg';

const Wrapper = ({ children }) => {
  return (
    <ImageBackground
      source={BG}
      resizeMode="cover"
      className="flex-1"
      style={{ width: deviceWidth, height: deviceHeight }}
    >
      <SafeAreaView className="flex-1 justify-center items-center">
        {children}
      </SafeAreaView>
    </ImageBackground>
  );
};

export default Wrapper;

// ⚠️ INLINE FALLBACK: width: deviceWidth, height: deviceHeight — device-specific pixel dimensions
