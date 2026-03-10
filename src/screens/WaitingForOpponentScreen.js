import React, {
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  Animated,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import {LinearGradient} from 'expo-linear-gradient';
import {Ionicons, MaterialCommunityIcons} from '@expo/vector-icons';

import {subscribeToRoom} from '../firebase/rooms';
import {resetAndNavigate} from '../helpers/NavigationUtil';

const STATUS_MESSAGES = [
  'Searching for an opponent',
  'Looking for a live player',
  'Matching your game room',
];

const WaitingForOpponentScreen = ({navigation, route}) => {
  const roomId = route?.params?.roomId ?? 'ROOM-0001';
  const playerNo = route?.params?.playerNo ?? 1;
  const pulseScale = useRef(new Animated.Value(0.92)).current;
  const pulseOpacity = useRef(new Animated.Value(0.32)).current;
  const dotsOpacity = useRef([
    new Animated.Value(0.35),
    new Animated.Value(0.35),
    new Animated.Value(0.35),
  ]).current;
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const pulseLoop = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(pulseScale, {
            toValue: 1.18,
            duration: 1400,
            useNativeDriver: true,
          }),
          Animated.timing(pulseScale, {
            toValue: 0.92,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(pulseOpacity, {
            toValue: 0,
            duration: 1400,
            useNativeDriver: true,
          }),
          Animated.timing(pulseOpacity, {
            toValue: 0.32,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
      ]),
    );

    const dotsLoop = Animated.loop(
      Animated.sequence(
        dotsOpacity.flatMap(dot => [
          Animated.timing(dot, {
            toValue: 1,
            duration: 240,
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0.35,
            duration: 240,
            useNativeDriver: true,
          }),
        ]),
      ),
    );

    pulseLoop.start();
    dotsLoop.start();

    const messageTimer = setInterval(() => {
      setMessageIndex(currentIndex => (currentIndex + 1) % STATUS_MESSAGES.length);
    }, 1800);

    return () => {
      pulseLoop.stop();
      dotsLoop.stop();
      clearInterval(messageTimer);
    };
  }, [dotsOpacity, pulseOpacity, pulseScale]);

  useEffect(() => {
    if (!roomId) {
      return undefined;
    }

    const unsubscribe = subscribeToRoom(roomId, room => {
      if (room?.status === 'playing') {
        navigation.replace('LudoBoardScreen', {
          roomId,
          gameMode: 'online',
          playerNo,
        });
      }
    });

    return unsubscribe;
  }, [navigation, playerNo, roomId]);

  return (
    <LinearGradient
      colors={['#061335', '#0d2470', '#12308d', '#081944']}
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 22,
      }}
    >
      <View
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
          opacity: 0.12,
        }}
      >
        {[0, 1, 2, 3, 4, 5].map(row => (
          <View
            key={row}
            style={{
              flex: 1,
              flexDirection: 'row',
              justifyContent: 'space-around',
              transform: [{scaleY: row % 2 === 0 ? 1 : -1}],
            }}
          >
            {[0, 1, 2, 3, 4].map(col => (
              <MaterialCommunityIcons
                key={`${row}-${col}`}
                name="triangle"
                size={42}
                color="#ffffff"
                style={{marginHorizontal: 10}}
              />
            ))}
          </View>
        ))}
      </View>

      <LinearGradient
        colors={['rgba(14,31,82,0.98)', 'rgba(20,38,98,0.96)']}
        style={{
          width: '100%',
          borderRadius: 28,
          borderWidth: 1,
          borderColor: 'rgba(161,191,255,0.24)',
          paddingHorizontal: 22,
          paddingTop: 28,
          paddingBottom: 22,
          alignItems: 'center',
          shadowColor: '#030a1f',
          shadowOpacity: 0.45,
          shadowRadius: 22,
          shadowOffset: {width: 0, height: 10},
          elevation: 10,
        }}
      >
        <Text
          style={{
            color: '#f4d56a',
            fontSize: 12,
            fontWeight: '800',
            letterSpacing: 2.4,
          }}
        >
          ONLINE MATCH
        </Text>

        <Text
          style={{
            marginTop: 10,
            color: '#ffffff',
            fontSize: 28,
            fontWeight: '900',
            textAlign: 'center',
          }}
        >
          Waiting for Opponent
        </Text>

        <Text
          style={{
            marginTop: 10,
            color: '#b8c7f1',
            fontSize: 15,
            lineHeight: 21,
            textAlign: 'center',
          }}
        >
          Stay on this screen. The match will start automatically when another
          player joins.
        </Text>

        <View
          style={{
            marginTop: 28,
            width: 158,
            height: 158,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Animated.View
            style={{
              position: 'absolute',
              width: 158,
              height: 158,
              borderRadius: 79,
              borderWidth: 2,
              borderColor: 'rgba(100,255,149,0.45)',
              transform: [{scale: pulseScale}],
              opacity: pulseOpacity,
            }}
          />

          <LinearGradient
            colors={['#2bff8a', '#0ecf68']}
            style={{
              width: 102,
              height: 102,
              borderRadius: 51,
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: '#2cff8e',
              shadowOpacity: 0.5,
              shadowRadius: 18,
              shadowOffset: {width: 0, height: 0},
              elevation: 10,
            }}
          >
            <MaterialCommunityIcons name="gamepad-square" size={48} color="#08245d" />
          </LinearGradient>
        </View>

        <View
          style={{
            marginTop: 26,
            width: '100%',
            borderRadius: 20,
            backgroundColor: 'rgba(6,16,48,0.68)',
            borderWidth: 1,
            borderColor: 'rgba(161,191,255,0.16)',
            paddingHorizontal: 16,
            paddingVertical: 14,
          }}
        >
          <Text
            style={{
              color: '#91a8ea',
              fontSize: 11,
              fontWeight: '800',
              letterSpacing: 1.2,
            }}
          >
            ROOM CODE
          </Text>
          <Text
            style={{
              marginTop: 6,
              color: '#ffffff',
              fontSize: 22,
              fontWeight: '900',
              letterSpacing: 2,
            }}
          >
            {roomId}
          </Text>
        </View>

        <View
          style={{
            marginTop: 18,
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          <Text
            style={{
              color: '#dbe5ff',
              fontSize: 15,
              fontWeight: '700',
            }}
          >
            {STATUS_MESSAGES[messageIndex]}
          </Text>
          {dotsOpacity.map((opacity, index) => (
            <Animated.Text
              key={index}
              style={{
                color: '#2cff8e',
                fontSize: 24,
                fontWeight: '900',
                marginLeft: 2,
                opacity,
              }}
            >
              .
            </Animated.Text>
          ))}
        </View>

        <TouchableOpacity
          activeOpacity={0.86}
          onPress={() => resetAndNavigate('HomeScreen')}
          style={{width: '100%', marginTop: 26}}
        >
          <LinearGradient
            colors={['#1e326f', '#10204d']}
            style={{
              height: 54,
              borderRadius: 18,
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.12)',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'row',
            }}
          >
            <Ionicons name="arrow-back" size={18} color="#ffffff" />
            <Text
              style={{
                marginLeft: 8,
                color: '#ffffff',
                fontSize: 16,
                fontWeight: '800',
              }}
            >
              Back to Home
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </LinearGradient>
    </LinearGradient>
  );
};

export default WaitingForOpponentScreen;
