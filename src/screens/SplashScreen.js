// ✅ EXPO CONVERTED
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Image } from 'react-native';

import { deviceHeight, deviceWidth } from '../constants/Scaling';
import Wrapper from '../components/Wrapper';
import logo from '../assets/images/logo.png';
import { prepareNavigation, resetAndNavigate } from '../helpers/NavigationUtil';

const SplashScreen = () => {
  const [isStop] = useState(false);
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    prepareNavigation();
    setTimeout(() => {
      resetAndNavigate('HomeScreen');
    }, 1500);
  }, []);

  useEffect(() => {
    const breathingAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    );

    if (!isStop) {
      breathingAnimation.start();
    }

    return () => {
      breathingAnimation.stop();
    };
  }, [isStop, scale]);

  return (
    <Wrapper>
      <Animated.View
        className="justify-center items-center"
        style={{ transform: [{ scale }] }}
      >
        <Image
          source={logo}
          style={{ width: deviceWidth * 0.5, height: deviceHeight * 0.3 }}
          resizeMode="contain"
        />
      </Animated.View>
      <ActivityIndicator size="small" color="white" />
    </Wrapper>
  );
};

export default SplashScreen;

// ⚠️ INLINE FALLBACK: Image width/height (deviceWidth * 0.5, deviceHeight * 0.3) — computed device dimensions
// ⚠️ INLINE FALLBACK: transform[scale] — animated value must be inline
