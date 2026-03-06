// ✅ EXPO CONVERTED
import React, { useCallback, useEffect, useRef, useState } from 'react';

import { Animated, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSelector } from 'react-redux';

import { useIsFocused } from '@react-navigation/native';

import MenuIcon from '../assets/images/menu.png';
import StartGame from '../assets/images/start.png';
import Dice from '../components/Dice';
import FourTriangles from '../components/FourTriangles';
import MenuModal from '../components/MenuModal';
import HorizontalPath from '../components/path/HorizontalPath';
import VerticalPath from '../components/path/VerticalPath';
import Pocket from '../components/Pocket';
import WinModal from '../components/WinModal';
import Wrapper from '../components/Wrapper';
import { Colors } from '../constants/Colors';
import { deviceHeight, deviceWidth } from '../constants/Scaling';
import { Plot1Data, Plot2Data, Plot3Data, Plot4Data } from '../helpers/PlotData';
import { playSound } from '../helpers/SoundUtility';
import {
  selectDiceTouch,
  selectPlayer1,
  selectPlayer2,
  selectPlayer3,
  selectPlayer4,
} from '../redux/reducers/gameSelectors';

const LudoBoardScreen = () => {
  const player1 = useSelector(selectPlayer1);
  const player2 = useSelector(selectPlayer2);
  const player3 = useSelector(selectPlayer3);
  const player4 = useSelector(selectPlayer4);
  const isDiceTouch = useSelector(selectDiceTouch);
  const winner = useSelector(state => state.game.winner);
  const isFocused = useIsFocused();

  const opacity = useRef(new Animated.Value(1)).current;
  const [menuVisible, setMenuVisible] = useState(false);
  const [showStartImage, setShowStartImage] = useState(false);
  const [timeLeft, setTimeLeft] = useState(8 * 60); // 8 minutes in seconds
  const timerRef = useRef(null);

  // Start/reset timer when screen is focused
  useEffect(() => {
    if (isFocused) {
      setTimeLeft(8 * 60);
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [isFocused]);

  // Stop timer when game is won
  useEffect(() => {
    if (winner != null) clearInterval(timerRef.current);
  }, [winner]);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleMenuPress = useCallback(() => {
    playSound('ui');
    setMenuVisible(true);
  }, []);

  const handleCloseMenu = useCallback(() => {
    setMenuVisible(false);
  }, []);

  useEffect(() => {
    if (isFocused) {
      setShowStartImage(true);
      const blinkAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(opacity, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      );
      blinkAnimation.start();

      const timeout = setTimeout(() => {
        blinkAnimation.stop();
        setShowStartImage(false);
      }, 2500);

      return () => {
        blinkAnimation.stop();
        clearTimeout(timeout);
      };
    }
  }, [isFocused, opacity]);

  return (
    <Wrapper>
      <View
        className="self-center justify-center"
        style={{ height: deviceHeight * 0.5, width: deviceWidth }}
      >
        {/* Top bar: menu + timer */}
        <View style={timerStyles.topBar}>
          <TouchableOpacity onPress={handleMenuPress}>
            <Image source={MenuIcon} style={{ width: 40, height: 30 }} resizeMode="contain" />
          </TouchableOpacity>

          <View style={[
            timerStyles.timerBadge,
            timeLeft <= 60 && timerStyles.timerBadgeWarning,
            timeLeft === 0 && timerStyles.timerBadgeDanger,
          ]}>
            <Text style={timerStyles.timerIcon}>⏱</Text>
            <Text style={[
              timerStyles.timerText,
              timeLeft <= 60 && timerStyles.timerTextWarning,
            ]}>
              {formatTime(timeLeft)}
            </Text>
          </View>
        </View>

        <View
          className="self-center justify-center"
          style={{ height: deviceHeight * 0.5, width: deviceWidth }}
        >
          <View
            className="justify-between items-center flex-row px-[30px]"
            pointerEvents={isDiceTouch ? 'none' : 'auto'}
          >
            <Dice color={Colors.green} player={2} data={player2} />
            <Dice color={Colors.yellow} player={3} rotate data={player3} />
          </View>

          <View className="w-full h-full self-center p-[10px]">
            <View className="w-full h-[40%] justify-between flex-row bg-[#ccc]">
              <Pocket color={Colors.green} player={2} data={player2} />
              <VerticalPath cells={Plot2Data} color={Colors.yellow} />
              <Pocket color={Colors.yellow} player={3} data={player3} />
            </View>

            <View className="flex-row w-full h-[20%] justify-between bg-[#1E5162]">
              <HorizontalPath cells={Plot1Data} color={Colors.green} />
              <FourTriangles
                player1={player1}
                player2={player2}
                player3={player3}
                player4={player4}
              />
              <HorizontalPath cells={Plot3Data} color={Colors.blue} />
            </View>

            <View className="w-full h-[40%] justify-between flex-row bg-[#ccc]">
              <Pocket color={Colors.red} player={1} data={player1} />
              <VerticalPath cells={Plot4Data} color={Colors.red} />
              <Pocket color={Colors.blue} player={4} data={player4} />
            </View>
          </View>

          <View
            className="justify-between items-center flex-row px-[30px]"
            pointerEvents={isDiceTouch ? 'none' : 'auto'}
          >
            <Dice color={Colors.red} player={1} data={player1} />
            <Dice color={Colors.blue} rotate player={4} data={player4} />
          </View>
        </View>

        {showStartImage && (
          <Animated.Image
            source={StartGame}
            style={{
              width: deviceWidth,
              height: deviceWidth * 0.4,
              position: 'absolute',
              opacity,
            }}
          />
        )}

        {menuVisible && (
          <MenuModal onPressHide={handleCloseMenu} visible={menuVisible} />
        )}

        {winner != null && <WinModal winner={winner} />}
      </View>
    </Wrapper>
  );
};

export default LudoBoardScreen;

const timerStyles = StyleSheet.create({
  topBar: {
    position: 'absolute',
    top: -150,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    zIndex: 20,
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(10, 30, 80, 0.85)',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(100, 181, 246, 0.5)',
    gap: 6,
  },
  timerBadgeWarning: {
    borderColor: '#ffb300',
    backgroundColor: 'rgba(80, 30, 0, 0.9)',
  },
  timerBadgeDanger: {
    borderColor: '#e53935',
    backgroundColor: 'rgba(100, 0, 0, 0.95)',
  },
  timerIcon: {
    fontSize: 16,
  },
  timerText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 2,
  },
  timerTextWarning: {
    color: '#ffb300',
  },
});

// ⚠️ INLINE FALLBACK: container height/width (deviceHeight * 0.5, deviceWidth) — device-computed dimensions
// ⚠️ INLINE FALLBACK: menuIcon top: -150 — exact pixel offset for overlay positioning
// ⚠️ INLINE FALLBACK: menuIconImage size (40x30) — exact pixel icon dimensions
// ⚠️ INLINE FALLBACK: StartGame image width/height — computed from deviceWidth
// ⚠️ INLINE FALLBACK: opacity (Animated.Value) — animated value must be inline style
