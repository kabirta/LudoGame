// ✅ EXPO CONVERTED
import React, { useCallback, useEffect, useRef } from 'react';

import LottieView from 'lottie-react-native';
import { Alert, Animated, Image, Pressable, Text, View } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

import { useIsFocused } from '@react-navigation/native';

import Witch from '../assets/animation/witch.json';
import Logo from '../assets/images/logo.png';
import GradientButton from '../components/GradientButton';
import Wrapper from '../components/Wrapper';
import { deviceHeight, deviceWidth } from '../constants/Scaling';
import { navigate } from '../helpers/NavigationUtil';
import { playSound, stopSound } from '../helpers/SoundUtility';
import { selectCurrentPositions } from '../redux/reducers/gameSelectors';
import { resetGame } from '../redux/reducers/gameSlice';

const HomeScreen = () => {
  const dispatch = useDispatch();
  const currentPositions = useSelector(selectCurrentPositions);
  const isFocused = useIsFocused();

  const witchAnimation = useRef(new Animated.Value(-deviceWidth)).current;
  const scalXAnimation = useRef(new Animated.Value(-1)).current;

  useEffect(() => {
    const loopAnimation = () => {
      Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(witchAnimation, {
              toValue: deviceWidth * 0.02,
              duration: 2000,
              useNativeDriver: true,
            }),
          ]),
        ])
      ).start();
    };

    const cleanupAnimation = () => {
      witchAnimation.stopAnimation();
      scalXAnimation.stopAnimation();
    };

    loopAnimation();
    return cleanupAnimation;
  }, [witchAnimation, scalXAnimation]);

  useEffect(() => {
    if (isFocused) {
      playSound('home');
    }
  }, [isFocused]);

  const renderButton = useCallback(
    (title, onPress) => (
      <GradientButton key={title} title={title} onPress={onPress} />
    ),
    []
  );

  const startGame = useCallback(async (isNew = false) => {
    try {
      await stopSound();
      if (isNew) {
        dispatch(resetGame());
      }
      navigate('LudoBoardScreen');
      playSound('game_start');
    } catch (error) {
      console.error('Error starting game:', error);
    }
  }, [dispatch]);

  const handleNewGamePress = useCallback(() => {
    startGame(true);
  }, [startGame]);

  const handleResumePress = useCallback(() => {
    startGame(false);
  }, [startGame]);

  return (
    <Wrapper>
      <View
        className="justify-center items-center mt-[10px]"
        style={{ width: deviceWidth * 0.6, height: deviceHeight * 0.2 }}
      >
        <Image source={Logo} className="w-full h-full" resizeMode="contain" />
      </View>

      <View className="items-center mt-5">
        {currentPositions.length !== 0 && renderButton('RESUME', handleResumePress)}
        {renderButton('NEW GAME', handleNewGamePress)}
        {renderButton('VS CPU', () => Alert.alert('Coming soon! Click New Game'))}
        {renderButton('2 VS 2', () => Alert.alert('Coming soon! Click New Game'))}
      </View>

      <Animated.View
        className="absolute"
        style={{
          top: '70%',
          left: '24%',
          transform: [
            { translateX: witchAnimation },
            { scaleX: scalXAnimation },
          ],
        }}
      >
        <Pressable
          onPress={() => {
            const random = Math.floor(Math.random() * 3) + 1;
            playSound(`girl${random}`);
          }}
        >
          <LottieView
            source={Witch}
            autoPlay
            loop
            speed={1}
            style={{ width: 250, height: 250, transform: [{ rotate: '25deg' }] }}
          />
        </Pressable>
      </Animated.View>

      <Text
        className="absolute text-white opacity-50 italic"
        style={{ bottom: 40, fontSize: 14, fontWeight: '800' }}
      >
        Created by - Kabir Mondal
      </Text>
    </Wrapper>
  );
};

export default HomeScreen;

// ⚠️ INLINE FALLBACK: imgContainer width/height (deviceWidth * 0.6, deviceHeight * 0.2) — device-computed
// ⚠️ INLINE FALLBACK: witchContainer top/left percentages — NativeWind % in Animated.View needs inline
// ⚠️ INLINE FALLBACK: transform (translateX, scaleX) — animated values must be inline
// ⚠️ INLINE FALLBACK: Witch LottieView size and rotate transform — pixel dimensions + transform
// ⚠️ INLINE FALLBACK: artist bottom: 40, fontSize, fontWeight — mixed with NativeWind classes
