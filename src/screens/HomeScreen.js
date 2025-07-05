import React, {
  useCallback,
  useEffect,
  useRef,
} from 'react';

import LottieView from 'lottie-react-native';
import {
  Alert,
  Animated,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import SoundPlayer from 'react-native-sound-player';
import {
  useDispatch,
  useSelector,
} from 'react-redux';

import {useIsFocused} from '@react-navigation/native';

import Witch from '../assets/animation/witch.json';
import Logo from '../assets/images/logo.png';
import GradientButton from '../components/GradientButton';
import Wrapper from '../components/Wrapper';
import {
  deviceHeight,
  deviceWidth,
} from '../constants/Scaling';
import {navigate} from '../helpers/NavigationUtil';
import {playSound} from '../helpers/SoundUtility';
import {selectCurrentPositions} from '../redux/reducers/gameSelectors';
import {resetGame} from '../redux/reducers/gameSlice';

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
      SoundPlayer.stop();
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
    <Wrapper style={styles.mainContainer}>
      <View style={styles.imgContainer}>
        <Image source={Logo} style={styles.img} />
      </View>

      <View style={styles.buttonContainer}>
        { currentPositions.length!==0 && (
          renderButton('RESUME', handleResumePress)
        )}
        {renderButton('NEW GAME', handleNewGamePress)}
        {renderButton('VS CPU', () => Alert.alert('Coming soon! Click New Game'))}
        {renderButton('2 VS 2', () => Alert.alert('Coming soon! Click New Game'))}
      </View>

      <Animated.View
        style={[
          styles.witchContainer,
          {
            transform: [
              { translateX: witchAnimation },
              { scaleX: scalXAnimation },
            ],
          },
        ]}>
        <Pressable
          onPress={() => {
            const random = Math.floor(Math.random() * 3) + 1;
            playSound(`girl${random}`);
          }}>
          <LottieView
            source={Witch}
            autoPlay
            loop
            speed={1}
            style={styles.Witch}
          />
        </Pressable>
      </Animated.View>

      <Text style={styles.artist}>Created by - Kabir Mondal</Text>
    </Wrapper>
  );
};

const styles = StyleSheet.create({
    mainContainer: {
        justifyContent: 'flex-start',
        alignItems: 'center',
        flex: 1,
    },
    imgContainer: {
        width: deviceWidth * 0.6,
        height: deviceHeight * 0.2,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
    },
    buttonContainer: {
        alignItems: 'center',
        marginTop: 20,
    },
    img: {
        width: '100%',
        height: '100%',
        resizeMode: 'contain',
    },
    artist: {
        position: 'absolute',
        bottom: 40,
        color: 'white',
        fontSize: 14,
        fontWeight: '800',
        opacity: 0.5,
        fontStyle: 'italic',
    },
    witchContainer: {
        position: 'absolute',
        top: '70%',
        left: '24%',
    },
    Witch: {
        width: 250,
        height: 250,
        transform: [{ rotate: '25deg' }],
    },
});

export default HomeScreen;
