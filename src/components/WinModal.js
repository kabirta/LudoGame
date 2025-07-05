import React, {
  useEffect,
  useState,
} from 'react';

import LottieView from 'lottie-react-native';
import {
  StyleSheet,
  Text,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Modal from 'react-native-modal';
import {useDispatch} from 'react-redux';

import Firework from '../assets/animation/firework.json';
import HeartGirl from '../assets/animation/girl.json';
import Trophy from '../assets/animation/trophy.json';
import {resetAndNavigate} from '../helpers/NavigationUtil';
import {colorPlayer} from '../helpers/PlotData';
import {playSound} from '../helpers/SoundUtility';
import {
  announceWinner,
  resetGame,
} from '../redux/reducers/gameSlice';
import GradientButton from './GradientButton';


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
    style={styles.bottomModalView}
    isVisible={visible}
    backdropColor={'black'}
    backdropOpacity={0.8}
    onBackdropPress={() => {}}
    animationIn="zoomIn"
    animationOut="zoomOut"
    onBackButtonPress={() => {}}
  >
    <LinearGradient
      colors={['#0f0c29', '#302b63', '#24243e']}
      style={styles.gradientContainer}
    >
      <View style={styles.content}>
        <View style={styles.pileContainer} />
        <Pile player={winner} color={colorPlayer[winner - 1]} />

        <Text style={styles.congratsText}>
          Congratulations! PLAYER {winner}
        </Text>

        <LottieView
          autoPlay
          hardwareAccelerationAndroid
          loop={false}
          source={Trophy}
          style={styles.trophyAnimation}
        />

        <LottieView
          autoPlay
          hardwareAccelerationAndroid
          loop={true}
          source={Firework}
          style={styles.fireworkAnimation}
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
      style={styles.girlAnimation}
    />
  </Modal>
    
  );
};

const styles = StyleSheet.create({
  modal: {
    
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradientContainer: {
    borderRadius: 20,
    width: '96%',
    borderWidth: 2,
    borderColor: 'gold',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    width: '100%',
    alignItems: 'center',
  },
  pileContainer: {
    width: 90,
    height: 40,
  },
  congratsText: {
    fontSize: 18,
    color: 'white',
    fontFamily: 'Philosopher-Bold',
    marginTop: 10,
  },
  trophyAnimation: {
    height: 200,
    width: 200,
    marginTop: 20,
  },
  fireworkAnimation: {
    height: 200,
    width: 500,
    position: 'absolute',
    zIndex: -1,
    marginTop: 20,
  },
  girlAnimation: {
    height: 500,
    width: 380,
    position: 'absolute',
    bottom: -200,
    right: -120,
    zIndex: 99,
  },
});

export default WinModal;
