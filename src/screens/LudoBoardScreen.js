// EXPO CONVERTED
import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

import {LinearGradient} from 'expo-linear-gradient';
import {
  Animated,
  Image,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  useDispatch,
  useSelector,
} from 'react-redux';

import {Ionicons} from '@expo/vector-icons';
import {useIsFocused} from '@react-navigation/native';
import Svg, {
  Defs,
  LinearGradient as SvgLinearGradient,
  Pattern,
  Path,
  Polygon as SvgPolygon,
  Rect,
  Stop,
} from 'react-native-svg';

import ProfilePlaceholder from '../assets/profile_placeholder.png';
import Dice from '../components/Dice';
import FourTriangles from '../components/FourTriangles';
import MenuModal from '../components/MenuModal';
import HorizontalPath from '../components/path/HorizontalPath';
import VerticalPath from '../components/path/VerticalPath';
import Pocket from '../components/Pocket';
import WinModal from '../components/WinModal';
import Wrapper from '../components/Wrapper';
import {Colors} from '../constants/Colors';
import {
  deviceHeight,
  deviceWidth,
} from '../constants/Scaling';
import {useGameTime} from '../helpers/GameTime';
import {
  Plot1Data,
  Plot2Data,
  Plot3Data,
  Plot4Data,
} from '../helpers/PlotData';
import {playSound} from '../helpers/SoundUtility';
import {
  selectDiceTouch,
  selectPlayer1,
  selectPlayer2,
  selectScores,
} from '../redux/reducers/gameSelectors';
import {announceWinners} from '../redux/reducers/gameSlice';

const BoardBackdrop = () => (
  <View
    pointerEvents="none"
    style={{
      position: 'absolute',
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      overflow: 'hidden',
      backgroundColor: '#0a2c88',
    }}
  >
    <LinearGradient
      colors={['#123ca9', '#0d2e8b', '#081f66']}
      style={{position: 'absolute', top: 0, right: 0, bottom: 0, left: 0}}
    />
    <Svg
      width="100%"
      height="100%"
      style={{position: 'absolute', top: 0, right: 0, bottom: 0, left: 0}}
    >
      <Defs>
        <Pattern id="boardPattern" patternUnits="userSpaceOnUse" width="44" height="72">
          <SvgPolygon
            points="0,72 22,12 44,72"
            fill="rgba(4, 19, 77, 0.23)"
          />
          <SvgPolygon
            points="0,0 22,56 44,0"
            fill="rgba(255,255,255,0.03)"
          />
        </Pattern>
      </Defs>
      <Rect width="100%" height="100%" fill="url(#boardPattern)" />
      <Rect y="12%" width="100%" height="11%" fill="rgba(255,255,255,0.04)" />
      <Rect y="42%" width="100%" height="11%" fill="rgba(255,255,255,0.04)" />
      <Rect y="72%" width="100%" height="11%" fill="rgba(255,255,255,0.04)" />
    </Svg>
  </View>
);

const PrizePoolBanner = () => {
  const bannerHeight = 52;
  return (
    <View style={{flex: 1, height: bannerHeight, marginHorizontal: 8}}>
      <Svg
        width="100%"
        height={bannerHeight}
        viewBox="0 0 300 126"
        preserveAspectRatio="none"
        style={{position: 'absolute', top: 0, left: 0, right: 0}}
      >
        <Defs>
          <SvgLinearGradient id="prizeBannerGradient" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#2f6cff" />
            <Stop offset="52%" stopColor="#204dc7" />
            <Stop offset="100%" stopColor="#17379a" />
          </SvgLinearGradient>
        </Defs>
        <Path
          d="M18 6 H282 L242 120 H58 Z"
          fill="url(#prizeBannerGradient)"
          stroke="#8ba9ff"
          strokeWidth="6"
        />
        <Path d="M30 18 H270 L236 109 H64 Z" fill="rgba(255,255,255,0.07)" />
      </Svg>
      <View
        style={{
          flex: 1,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 8,
        }}
      >
        <Ionicons name="trophy" size={22} color="#f9b32b" style={{marginRight: 8}} />
        <View>
          <Text
            style={{
              color: '#ffffff',
              fontSize: 11,
              fontWeight: '900',
              textShadowColor: 'rgba(0,0,0,0.35)',
              textShadowOffset: {width: 0, height: 2},
              textShadowRadius: 4,
            }}
          >
            Prize Pool
          </Text>
          <Text
            style={{
              color: '#ffe485',
              fontSize: 15,
              fontWeight: '900',
              marginTop: -1,
              textShadowColor: 'rgba(0,0,0,0.35)',
              textShadowOffset: {width: 0, height: 2},
              textShadowRadius: 4,
            }}
          >
            ₹0.15
          </Text>
        </View>
      </View>
    </View>
  );
};

const LudoBoardScreen = () => {
  const dispatch = useDispatch();
  const player1 = useSelector(selectPlayer1);
  const player2 = useSelector(selectPlayer2);
  const scores = useSelector(selectScores);
  const isDiceTouch = useSelector(selectDiceTouch);
  const winner = useSelector(state => state.game.winner);
  const isFocused = useIsFocused();
  const { seconds, formatTime } = useGameTime(8 * 60);
  const timerCompletedRef = useRef(false);

  const opacity = useRef(new Animated.Value(1)).current;
  const [menuVisible, setMenuVisible] = useState(false);
  const [showStartImage, setShowStartImage] = useState(false);
  const boardSize = Math.min(deviceWidth * 0.96, deviceHeight * 0.58);
  const opponentAvatarSize = Math.min(deviceWidth * 0.17, 72);
  const firstMoverAvatarSize = Math.min(deviceWidth * 0.24, 94);
  const footerNameWidth = Math.min(deviceWidth * 0.42, 166);

  const handleMenuPress = useCallback(() => {
    playSound('ui');
    setMenuVisible(true);
  }, []);

  const handleTopControlPress = useCallback(() => {
    playSound('ui');
  }, []);

  const handleCloseMenu = useCallback(() => {
    setMenuVisible(false);
  }, []);

  useEffect(() => {
    if (isFocused) {
      timerCompletedRef.current = false;
    }
  }, [isFocused]);

  useEffect(() => {
    if (seconds !== 0 || winner != null || timerCompletedRef.current) {
      return;
    }
    timerCompletedRef.current = true;
    const player1Score = scores?.player1 ?? 0;
    const player2Score = scores?.player2 ?? 0;
    const finalWinner = player2Score > player1Score ? 2 : 1;
    dispatch(announceWinners(finalWinner));
  }, [dispatch, scores, seconds, winner]);

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
      <View className="flex-1 w-full">
        <BoardBackdrop />
        <View className="flex-1 w-full px-2 pt-2 pb-3">
        {/* ── TOP HEADER ── */}
        <View style={{paddingHorizontal: 4}}>
          {/* Row 1: left controls + prize banner */}
          <View style={{flexDirection: 'row', alignItems: 'center'}}>
            <TouchableOpacity
              activeOpacity={0.82}
              onPress={handleMenuPress}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                borderWidth: 1,
                borderColor: 'rgba(191,209,255,0.18)',
                backgroundColor: 'rgba(137,165,240,0.18)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="settings-sharp" size={22} color="#ffffff" />
            </TouchableOpacity>

            <View style={{width: 8}} />

            <TouchableOpacity
              activeOpacity={0.82}
              onPress={handleTopControlPress}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                borderWidth: 1,
                borderColor: 'rgba(191,209,255,0.18)',
                backgroundColor: 'rgba(137,165,240,0.18)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="wifi" size={22} color="#39ef49" />
            </TouchableOpacity>

            <PrizePoolBanner />
          </View>

          <View
            style={{
              marginTop: 10,
              flexDirection: 'row',
              alignItems: 'center',
              alignSelf: 'flex-end',
            }}
          >
            <LinearGradient
              colors={['#0b1f5d', '#081844']}
              start={{x: 0, y: 0.5}}
              end={{x: 1, y: 0.5}}
              style={{
                height: 42,
                paddingHorizontal: 8,
                borderRadius: 21,
                borderWidth: 1.5,
                borderColor: '#2e55b1',
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              <View
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  backgroundColor: '#eef4ff',
                  borderWidth: 1.5,
                  borderColor: '#6fa3ff',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="time-outline" size={16} color="#4b86ff" />
              </View>
              <Text
                style={{
                  marginLeft: 6,
                  color: '#39ff34',
                  fontSize: 21,
                  fontWeight: '900',
                  letterSpacing: 1.5,
                  fontVariant: ['tabular-nums'],
                }}
              >
                {formatTime(seconds)}
              </Text>
            </LinearGradient>

            <TouchableOpacity
              activeOpacity={0.82}
              onPress={handleTopControlPress}
              style={{
                width: 32,
                height: 32,
                marginLeft: 6,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons
                name="information-circle-outline"
                size={28}
                color="rgba(215,226,255,0.42)"
              />
            </TouchableOpacity>

            <LinearGradient
              colors={['#3b6df1', '#416ee1', '#3561d0']}
              start={{x: 0, y: 0.5}}
              end={{x: 1, y: 0.5}}
              style={{
                height: 38,
                minWidth: 132,
                paddingHorizontal: 18,
                borderRadius: 19,
                justifyContent: 'center',
                marginLeft: 6,
              }}
            >
              <Text
                style={{color: '#ffffff', fontSize: 14, fontWeight: '700'}}
                numberOfLines={1}
              >
                Sk Akhta
              </Text>
            </LinearGradient>
          </View>

          {/* Row 3: opponent dice + avatar */}
          <View
            style={{
              marginTop: 10,
              flexDirection: 'row',
              alignItems: 'center',
              alignSelf: 'flex-end',
            }}
          >
            <Dice compact color={Colors.red} player={2} data={player2} />
            <View
              style={{
                marginLeft: 10,
                width: opponentAvatarSize,
                height: opponentAvatarSize,
                borderRadius: opponentAvatarSize / 2,
                backgroundColor: '#0f235e',
                borderWidth: 4,
                borderColor: '#f8941f',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Image
                source={ProfilePlaceholder}
                style={{
                  width: opponentAvatarSize - 10,
                  height: opponentAvatarSize - 10,
                  borderRadius: (opponentAvatarSize - 10) / 2,
                }}
              />
            </View>
          </View>
        </View>

        <View className="w-full items-center justify-center mt-3">
          <View style={{width: boardSize, height: boardSize}}>
            <View
              className="rounded-[10px] border border-[#5d7fc2] bg-[#5673b8]/70 p-1"
              style={{width: boardSize, height: boardSize}}
            >
              <View className="w-full h-full self-center">
                <View className="w-full h-[40%] justify-between flex-row bg-[#d7d7dd]">
                  <Pocket color={Colors.blue} player={4} data={[]} />
                  <VerticalPath cells={Plot2Data} color={Colors.red} />
                  <Pocket
                    color={Colors.red}
                    player={2}
                    data={player2}
                    score={scores?.player2 ?? 0}
                    scoreLabel="Second Mover"
                  />
                </View>

                <View className="flex-row w-full h-[20%] justify-between bg-[#d7d7dd]">
                  <HorizontalPath cells={Plot1Data} color={Colors.blue} />
                  <FourTriangles
                    player1={player1}
                    player2={player2}
                    player3={[]}
                    player4={[]}
                  />
                  <HorizontalPath cells={Plot3Data} color={Colors.green} />
                </View>

                <View className="w-full h-[40%] justify-between flex-row bg-[#d7d7dd]">
                  <Pocket
                    color={Colors.yellow}
                    player={1}
                    data={player1}
                    score={scores?.player1 ?? 0}
                    scoreLabel="First Mover"
                  />
                  <VerticalPath cells={Plot4Data} color={Colors.yellow} />
                  <Pocket color={Colors.green} player={3} data={[]} />
                </View>
              </View>
            </View>

            {showStartImage && (
              <Animated.View
                style={{
                  minWidth: boardSize * 0.56,
                  position: 'absolute',
                  opacity,
                  alignSelf: 'center',
                  top: boardSize * 0.39,
                  backgroundColor: 'rgba(7, 20, 59, 0.9)',
                  borderWidth: 1,
                  borderColor: '#7ea7ff',
                  borderRadius: 18,
                  paddingHorizontal: 22,
                  paddingVertical: 12,
                }}
                pointerEvents="none"
              >
                <Text
                  style={{
                    color: '#ffffff',
                    fontSize: 22,
                    fontWeight: '800',
                    textAlign: 'center',
                    letterSpacing: 0.4,
                  }}
                >
                  Waiting for opponent
                </Text>
              </Animated.View>
            )}
          </View>
        </View>

        <View className="mt-auto w-full px-2" pointerEvents={isDiceTouch ? 'none' : 'auto'}>
          <TouchableOpacity
            activeOpacity={0.82}
            onPress={handleTopControlPress}
            style={{
              alignSelf: 'flex-start',
              flexDirection: 'row',
              alignItems: 'center',
              height: 40,
              paddingHorizontal: 14,
              borderRadius: 20,
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.2)',
              backgroundColor: 'rgba(43,48,61,0.88)',
            }}
          >
            <Text
              style={{color: '#f4f4f4', fontSize: 14, fontWeight: '700', marginRight: 10}}
            >
              Emojis
            </Text>
            <Ionicons name="happy-outline" size={28} color="#f4f4f4" />
          </TouchableOpacity>

          <View
            style={{
              marginTop: 12,
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 2,
            }}
          >
            <View
              style={{
                width: firstMoverAvatarSize,
                height: firstMoverAvatarSize,
                borderRadius: firstMoverAvatarSize / 2,
                backgroundColor: '#ff4f15',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <View
                style={{
                  width: firstMoverAvatarSize - 8,
                  height: firstMoverAvatarSize - 8,
                  borderRadius: (firstMoverAvatarSize - 8) / 2,
                  backgroundColor: '#ffd653',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <LinearGradient
                  colors={['#c85cd7', '#a949c1']}
                  start={{x: 0.15, y: 0}}
                  end={{x: 0.85, y: 1}}
                  style={{
                    width: firstMoverAvatarSize - 18,
                    height: firstMoverAvatarSize - 18,
                    borderRadius: (firstMoverAvatarSize - 18) / 2,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text
                    style={{
                      color: '#ffffff',
                      fontSize: firstMoverAvatarSize * 0.56,
                      fontWeight: '300',
                      lineHeight: firstMoverAvatarSize * 0.62,
                    }}
                  >
                    B
                  </Text>
                </LinearGradient>
              </View>
            </View>

            <View style={{marginLeft: 12}}>
              <Dice bubble color={Colors.yellow} player={1} data={player1} />
            </View>
          </View>

          <View
            style={{
              marginTop: 10,
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 2,
            }}
          >
            <LinearGradient
              colors={['#3f6de0', '#315cc8']}
              start={{x: 0, y: 0.5}}
              end={{x: 1, y: 0.5}}
              style={{
                width: footerNameWidth,
                height: 38,
                borderRadius: 19,
                paddingHorizontal: 22,
                justifyContent: 'center',
              }}
            >
              <Text
                style={{
                  color: '#ffffff',
                  fontSize: 15,
                  fontWeight: '500',
                }}
                numberOfLines={1}
              >
                kabir
              </Text>
            </LinearGradient>

            <TouchableOpacity
              activeOpacity={0.82}
              onPress={handleTopControlPress}
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                marginLeft: 14,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons
                name="information-circle-outline"
                size={32}
                color="rgba(215, 226, 255, 0.55)"
              />
            </TouchableOpacity>
          </View>
        </View>

        {menuVisible && (
          <MenuModal onPressHide={handleCloseMenu} visible={menuVisible} />
        )}

        {winner != null && <WinModal winner={winner} />}
        </View>
      </View>
    </Wrapper>
  );
};

export default LudoBoardScreen;
