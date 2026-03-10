import React, {useEffect, useState} from 'react';

import {LinearGradient} from 'expo-linear-gradient';
import LottieView from 'lottie-react-native';
import Modal from 'react-native-modal';
import {
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {useDispatch} from 'react-redux';

import Firework from '../assets/animation/firework.json';
import Trophy from '../assets/animation/trophy.json';
import {resetAndNavigate} from '../helpers/NavigationUtil';
import {colorPlayer} from '../helpers/PlotData';
import {playSound} from '../helpers/SoundUtility';
import {
  announceWinners,
  resetGame,
} from '../redux/reducers/gameSlice';
import Pile from './Pile';

const PLAYER_NAMES = {
  1: 'First Mover',
  2: 'Second Mover',
  3: 'Player 3',
  4: 'Player 4',
};

const ACTION_BUTTONS = {
  secondary: {
    colors: ['#182f6f', '#101b46'],
    icon: 'home',
    label: 'Home',
  },
};

const WinActionButton = ({variant, onPress}) => {
  const config = ACTION_BUTTONS[variant];

  return (
    <TouchableOpacity
      activeOpacity={0.86}
      onPress={() => {
        playSound('ui');
        onPress();
      }}
      style={{width: '100%'}}
    >
      <LinearGradient
        colors={config.colors}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}
        style={{
          height: 56,
          borderRadius: 18,
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.14)',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: '#050d2c',
          shadowOpacity: 0.35,
          shadowRadius: 10,
          shadowOffset: {width: 0, height: 5},
          elevation: 5,
        }}
      >
        <Ionicons
          name={config.icon}
          size={20}
          color="#ffffff"
          style={{marginRight: 10}}
        />
        <Text
          style={{
            color: '#ffffff',
            fontSize: 16,
            fontWeight: '800',
            letterSpacing: 0.2,
          }}
        >
          {config.label}
        </Text>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const WinModal = ({winner}) => {
  const dispatch = useDispatch();
  const [visible, setVisible] = useState(!!winner);
  const winnerColor = colorPlayer[(winner ?? 1) - 1] ?? '#f4bf34';
  const winnerLabel = PLAYER_NAMES[winner] ?? `Player ${winner}`;

  useEffect(() => {
    setVisible(!!winner);
  }, [winner]);

  const handleHome = () => {
    dispatch(resetGame());
    dispatch(announceWinners(null));
    resetAndNavigate('HomeScreen');
  };

  return (
    <Modal
      isVisible={visible}
      backdropColor="#020814"
      backdropOpacity={0.8}
      animationIn="zoomIn"
      animationOut="zoomOut"
      onBackdropPress={() => {}}
      onBackButtonPress={() => {}}
      style={{margin: 18, justifyContent: 'center', alignItems: 'center'}}
    >
      <View style={{width: '100%', maxWidth: 380}}>
        <LottieView
          autoPlay
          hardwareAccelerationAndroid
          loop
          source={Firework}
          style={{
            position: 'absolute',
            top: -56,
            left: -72,
            width: 500,
            height: 500,
            zIndex: 0,
            opacity: 0.95,
          }}
        />

        <LinearGradient
          colors={['#10265f', '#17215f', '#251956']}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 1}}
          style={{
            borderRadius: 28,
            borderWidth: 1.5,
            borderColor: 'rgba(255,255,255,0.16)',
            overflow: 'hidden',
            shadowColor: '#040a1f',
            shadowOpacity: 0.4,
            shadowRadius: 22,
            shadowOffset: {width: 0, height: 10},
            elevation: 18,
          }}
        >
          <View
            style={{
              position: 'absolute',
              top: -120,
              right: -40,
              width: 220,
              height: 220,
              borderRadius: 110,
              backgroundColor: `${winnerColor}22`,
            }}
          />
          <View
            style={{
              position: 'absolute',
              bottom: -90,
              left: -60,
              width: 180,
              height: 180,
              borderRadius: 90,
              backgroundColor: 'rgba(255,255,255,0.06)',
            }}
          />

          <View
            style={{
              paddingHorizontal: 22,
              paddingTop: 20,
              paddingBottom: 22,
            }}
          >
            <View
              style={{
                alignSelf: 'center',
                paddingHorizontal: 14,
                paddingVertical: 7,
                borderRadius: 999,
                backgroundColor: 'rgba(255,255,255,0.08)',
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.1)',
              }}
            >
              <Text
                style={{
                  color: '#d9e5ff',
                  fontSize: 12,
                  fontWeight: '800',
                  letterSpacing: 1.2,
                }}
              >
                MATCH COMPLETE
              </Text>
            </View>

            <View style={{alignItems: 'center', marginTop: 18}}>
              <View
                style={{
                  width: 76,
                  height: 76,
                  borderRadius: 38,
                  backgroundColor: `${winnerColor}26`,
                  borderWidth: 2,
                  borderColor: `${winnerColor}aa`,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Pile player={winner} color={winnerColor} />
              </View>

              <Text
                style={{
                  marginTop: 16,
                  color: '#ffffff',
                  fontSize: 14,
                  fontWeight: '700',
                  letterSpacing: 2.4,
                }}
              >
                CONGRATULATIONS
              </Text>

              <Text
                style={{
                  marginTop: 8,
                  color: '#ffffff',
                  fontSize: 30,
                  fontWeight: '900',
                  textAlign: 'center',
                }}
              >
                {winnerLabel} Wins
              </Text>

              <Text
                style={{
                  marginTop: 8,
                  color: '#bfcbf3',
                  fontSize: 15,
                  textAlign: 'center',
                  lineHeight: 21,
                }}
              >
                All tokens reached home first. The board is yours.
              </Text>
            </View>

            <View
              style={{
                marginTop: 20,
                borderRadius: 24,
                backgroundColor: 'rgba(5,12,38,0.5)',
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.08)',
                alignItems: 'center',
                paddingVertical: 14,
              }}
            >
              <LottieView
                autoPlay
                hardwareAccelerationAndroid
                loop={false}
                source={Trophy}
                style={{width: 160, height: 160, marginTop: -10}}
              />

              <View
                style={{
                  marginTop: -14,
                  paddingHorizontal: 16,
                  paddingVertical: 7,
                  borderRadius: 999,
                  backgroundColor: `${winnerColor}24`,
                  borderWidth: 1,
                  borderColor: `${winnerColor}99`,
                }}
              >
                <Text
                  style={{
                    color: winnerColor,
                    fontSize: 14,
                    fontWeight: '900',
                    letterSpacing: 1,
                  }}
                >
                  WINNER
                </Text>
              </View>
            </View>

            <View
              style={{
                marginTop: 18,
                flexDirection: 'row',
                justifyContent: 'space-between',
              }}
            >
              <View
                style={{
                  flex: 1,
                  marginRight: 6,
                  paddingVertical: 12,
                  borderRadius: 18,
                  backgroundColor: 'rgba(255,255,255,0.06)',
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.08)',
                  alignItems: 'center',
                }}
              >
                <Text style={{color: '#9fb0e5', fontSize: 12, fontWeight: '700'}}>
                  POSITION
                </Text>
                <Text style={{color: '#ffffff', fontSize: 22, fontWeight: '900', marginTop: 4}}>
                  1st
                </Text>
              </View>

              <View
                style={{
                  flex: 1,
                  marginLeft: 6,
                  paddingVertical: 12,
                  borderRadius: 18,
                  backgroundColor: 'rgba(255,255,255,0.06)',
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.08)',
                  alignItems: 'center',
                }}
              >
                <Text style={{color: '#9fb0e5', fontSize: 12, fontWeight: '700'}}>
                  PLAYER
                </Text>
                <Text style={{color: '#ffffff', fontSize: 22, fontWeight: '900', marginTop: 4}}>
                  {winner}
                </Text>
              </View>
            </View>

            <View style={{marginTop: 22}}>
              <WinActionButton variant="secondary" onPress={handleHome} />
            </View>
          </View>
        </LinearGradient>
      </View>
    </Modal>
  );
};

export default WinModal;
