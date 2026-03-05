// ✅ EXPO CONVERTED
import React, { useEffect, useState } from 'react';

import LottieView from 'lottie-react-native';
import { Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Modal from 'react-native-modal';
import { useDispatch } from 'react-redux';

import Firework from '../assets/animation/firework.json';
import HeartGirl from '../assets/animation/girl.json';
import Trophy from '../assets/animation/trophy.json';
import { resetAndNavigate } from '../helpers/NavigationUtil';
import { colorPlayer } from '../helpers/PlotData';
import { playSound } from '../helpers/SoundUtility';
import { announceWinner, resetGame } from '../redux/reducers/gameSlice';
import GradientButton from './GradientButton';
import Pile from './Pile';

const WinModal = ({ winner }) => {
  const dispatch = useDispatch();
  const [visible, setVisible] = useState(!!winner);

  useEffect(() => {
    setVisible(!!winner);
  }, [winner]);

  const handleNewGame = () => {
    dispatch(resetGame());
    dispatch(announceWinner(null));
    playSound('game_start');
  };

  const handleHome = () => {
    dispatch(resetGame());
    dispatch(announceWinner(null));
    resetAndNavigate('HomeScreen');
  };

  return (
    <Modal
      className="justify-center items-center"
      isVisible={visible}
      backdropColor="black"
      backdropOpacity={0.8}
      onBackdropPress={() => {}}
      animationIn="zoomIn"
      animationOut="zoomOut"
      onBackButtonPress={() => {}}
    >
      <LinearGradient
        colors={['#0f0c29', '#302b63', '#24243e']}
        className="rounded-[20px] border-2 border-[gold] justify-center items-center"
        style={{ width: '96%' }}
      >
        <View className="w-full items-center">
          <View style={{ width: 90, height: 40 }} />
          <Pile player={winner} color={colorPlayer[winner - 1]} />

          <Text
            className="text-white mt-[10px]"
            style={{ fontSize: 18, fontFamily: 'Philosopher-Bold' }}
          >
            Congratulations! PLAYER {winner}
          </Text>

          <LottieView
            autoPlay
            hardwareAccelerationAndroid
            loop={false}
            source={Trophy}
            style={{ height: 200, width: 200, marginTop: 20 }}
          />

          <LottieView
            autoPlay
            hardwareAccelerationAndroid
            loop={true}
            source={Firework}
            style={{ height: 200, width: 500, position: 'absolute', zIndex: -1, marginTop: 20 }}
          />

          <GradientButton title="NEW GAME" onPress={handleNewGame} />
          <GradientButton title="HOME" onPress={handleHome} />
        </View>
      </LinearGradient>

      <LottieView
        hardwareAccelerationAndroid
        autoPlay
        loop={true}
        source={HeartGirl}
        style={{ height: 500, width: 380, position: 'absolute', bottom: -200, right: -120, zIndex: 99 }}
      />
    </Modal>
  );
};

export default WinModal;

// ⚠️ INLINE FALLBACK: width: '96%' on gradient — NativeWind percentage widths inside Modal need inline
// ⚠️ INLINE FALLBACK: All LottieView sizes — exact pixel dimensions required for animation layout
// ⚠️ INLINE FALLBACK: girlAnimation position (bottom: -200, right: -120) — exact pixel offsets
// ⚠️ INLINE FALLBACK: pileContainer size (90x40) — exact spacer dimensions
