import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import LottieView from 'lottie-react-native';

import Trophy from '../assets/animation/trophy.json';
import DiceRoll from '../assets/animation/diceroll.json';
import { prepareNavigation, resetAndNavigate } from '../helpers/NavigationUtil';

const { width, height } = Dimensions.get('window');

// Light ray beam
const Ray = ({ angle }) => (
  <View
    style={[
      styles.ray,
      { transform: [{ rotate: `${angle}deg` }] },
    ]}
  />
);

const SplashScreen = () => {
  const trophyScale = useRef(new Animated.Value(0)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const diceTranslate = useRef(new Animated.Value(-30)).current;

  useEffect(() => {
    prepareNavigation();

    // Entrance animations
    Animated.parallel([
      Animated.spring(trophyScale, {
        toValue: 1,
        friction: 5,
        tension: 60,
        useNativeDriver: true,
      }),
      Animated.timing(titleOpacity, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(diceTranslate, {
        toValue: 0,
        friction: 6,
        tension: 50,
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(() => {
      resetAndNavigate('LoginScreen');
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const rays = [-80, -60, -40, -20, 0, 20, 40, 60, 80];

  return (
    <LinearGradient
      colors={['#040d24', '#0b1e4e', '#0e2a72', '#0b1e4e', '#040d24']}
      locations={[0, 0.2, 0.5, 0.8, 1]}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" backgroundColor="#040d24" />

      {/* Light rays behind trophy */}
      <View style={styles.raysContainer}>
        {rays.map((angle, i) => (
          <Ray key={i} angle={angle} />
        ))}
      </View>

      {/* LUDO SUPREME title */}
      <Animated.View style={[styles.titleContainer, { opacity: titleOpacity }]}>
        {/* Outline layer */}
        <Text style={[styles.ludoText, styles.ludoTextOutline]}>LUDO</Text>
        {/* Fill layer */}
        <Text style={[styles.ludoText, styles.ludoTextFill]}>LUDO</Text>
        <Text style={styles.supremeText}>SUPER</Text>
      </Animated.View>

      {/* Dice above trophy */}
      <Animated.View
        style={[
          styles.diceWrapper,
          { transform: [{ translateY: diceTranslate }] },
        ]}
      >
        <LottieView
          source={DiceRoll}
          autoPlay
          loop
          speed={0.8}
          style={styles.dice}
        />
      </Animated.View>

      {/* Trophy */}
      <Animated.View style={[styles.trophyWrapper, { transform: [{ scale: trophyScale }] }]}>
        <LottieView
          source={Trophy}
          autoPlay
          loop={false}
          speed={0.7}
          style={styles.trophy}
        />
      </Animated.View>

      

      {/* Score labels */}
      
    </LinearGradient>
  );
};

export default SplashScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: Platform.OS === 'ios' ? 60 : 48,
    overflow: 'hidden',
  },
  raysContainer: {
    position: 'absolute',
    top: height * 0.25,
    left: width / 2 - 2,
    width: 4,
    height: height * 0.6,
    alignItems: 'center',
  },
  ray: {
    position: 'absolute',
    width: 3,
    height: height * 0.7,
    backgroundColor: 'rgba(100, 160, 255, 0.08)',
    borderRadius: 2,
    transformOrigin: 'top center',
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 10,
  },
  ludoText: {
    fontSize: 64,
    fontWeight: '900',
    letterSpacing: 6,
    position: 'absolute',
  },
  ludoTextOutline: {
    color: '#1565c0',
    top: 3,
    left: 3,
  },
  ludoTextFill: {
    color: '#64b5f6',
    position: 'relative',
    top: 0,
    left: 0,
    textShadowColor: 'rgba(100, 200, 255, 0.8)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 16,
  },
  supremeText: {
    marginTop: 68,
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 10,
    textShadowColor: 'rgba(255,255,255,0.4)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  diceWrapper: {
    marginTop: 20,
    zIndex: 10,
  },
  dice: {
    width: 80,
    height: 80,
  },
  trophyWrapper: {
    marginTop: -20,
    zIndex: 5,
  },
  trophy: {
    width: width * 0.75,
    height: width * 0.75,
  },
  boardStrip: {
    position: 'absolute',
    bottom: 60,
    alignSelf: 'center',
    flexDirection: 'column',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: 4,
    overflow: 'hidden',
    opacity: 0.85,
  },
  boardRow: {
    flexDirection: 'row',
  },
  boardCell: {
    width: 22,
    height: 18,
    borderWidth: 0.5,
    borderColor: 'rgba(180,180,180,0.4)',
  },
  boardDivider: {
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  scoreRow: {
    position: 'absolute',
    bottom: 50,
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: width * 0.7,
  },
  scoreBadge: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 6,
    alignItems: 'center',
  },
  scoreLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 11,
    fontWeight: '600',
  },
  scoreValue: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
  },
});
