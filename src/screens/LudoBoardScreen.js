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
import Svg, {
  Defs,
  LinearGradient as SvgLinearGradient,
  Path,
  Pattern,
  Polygon as SvgPolygon,
  Rect,
  Stop,
} from 'react-native-svg';
import {
  useDispatch,
  useSelector,
} from 'react-redux';

import {Ionicons} from '@expo/vector-icons';
import {useIsFocused} from '@react-navigation/native';

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
  selectCurrentPlayerChance,
  selectDiceTouch,
  selectMissedRolls,
  selectPlayer1,
  selectPlayer2,
  selectScores,
} from '../redux/reducers/gameSelectors';
import {
  announceWinners,
  recordMissedRoll,
  updatePlayerChance,
} from '../redux/reducers/gameSlice';
import {getNextActivePlayer} from '../helpers/LudoMovementEngine';

const TURN_ROLL_TIMEOUT_SECONDS = 15;
const MAX_MISSED_ROLLS = 3;

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
      backgroundColor: '#092a82',
    }}
  >
    <LinearGradient
      colors={['#153eb0', '#0d2e8b', '#081f66']}
      style={{position: 'absolute', top: 0, right: 0, bottom: 0, left: 0}}
    />
    <Svg
      width="100%"
      height="100%"
      style={{position: 'absolute', top: 0, right: 0, bottom: 0, left: 0}}
    >
      <Defs>
        <Pattern id="boardPattern" patternUnits="userSpaceOnUse" width="44" height="72">
          <SvgPolygon points="0,72 22,12 44,72" fill="rgba(4, 19, 77, 0.23)" />
          <SvgPolygon points="0,0 22,56 44,0" fill="rgba(255,255,255,0.03)" />
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
  const bannerHeight = 50;

  return (
    <View style={{width: deviceWidth * 0.5, height: bannerHeight, marginHorizontal: 8}}>
      <Svg
        width="100%"
        height={bannerHeight}
        viewBox="0 0 300 126"
        preserveAspectRatio="none"
        style={{position: 'absolute', top: 0, left: 0, right: 0}}
      >
        <Defs>
          <SvgLinearGradient id="prizeBannerGradient" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#346eff" />
            <Stop offset="54%" stopColor="#244fcf" />
            <Stop offset="100%" stopColor="#17389e" />
          </SvgLinearGradient>
        </Defs>
        <Path
          d="M18 6 H282 L242 120 H58 Z"
          fill="url(#prizeBannerGradient)"
          stroke="#86a7ff"
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
          paddingHorizontal: 5,
        }}
      >
        <Ionicons name="trophy" size={24} color="#f9b32b" style={{marginRight: 8}} />
        <View>
          <Text
            style={{
              color: '#ffffff',
              fontSize: 12,
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
              fontSize: 17,
              fontWeight: '900',
              marginTop: -1,
              textShadowColor: 'rgba(0,0,0,0.35)',
              textShadowOffset: {width: 0, height: 2},
              textShadowRadius: 4,
            }}
          >
            Rs. 250
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
  const currentPlayerChance = useSelector(selectCurrentPlayerChance);
  const isDiceTouch = useSelector(selectDiceTouch);
  const missedRolls = useSelector(selectMissedRolls);
  const winner = useSelector(state => state.game.winner);
  const isFocused = useIsFocused();
  const {seconds, formatTime} = useGameTime(8 * 60);
  const timerCompletedRef = useRef(false);

  const opacity = useRef(new Animated.Value(1)).current;
  const [menuVisible, setMenuVisible] = useState(false);
  const [showStartImage, setShowStartImage] = useState(false);
  const [turnRollProgress, setTurnRollProgress] = useState(1);
  const boardSize = Math.min(deviceWidth * 0.965, deviceHeight * 0.59);
  const opponentAvatarSize = Math.min(deviceWidth * 0.15, 70);
  const firstMoverAvatarSize = Math.min(deviceWidth * 0.15, 70);
  const footerNameWidth = Math.min(deviceWidth * 0.42, 80);

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
    if (!isFocused) {
      return undefined;
    }

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
  }, [isFocused, opacity]);

  useEffect(() => {
    if (!isFocused || winner != null) {
      setTurnRollProgress(1);
      return undefined;
    }

    setTurnRollProgress(1);
    const startedAt = Date.now();

    const interval = setInterval(() => {
      const elapsedMs = Date.now() - startedAt;
      setTurnRollProgress(
        Math.max(1 - elapsedMs / (TURN_ROLL_TIMEOUT_SECONDS * 1000), 0),
      );
    }, 100);

    const timeout = setTimeout(() => {
      const nextMissCount =
        (missedRolls?.[`player${currentPlayerChance}`] ?? 0) + 1;

      dispatch(recordMissedRoll({playerNo: currentPlayerChance}));

      if (nextMissCount >= MAX_MISSED_ROLLS) {
        dispatch(announceWinners(getNextActivePlayer(currentPlayerChance)));
        return;
      }

      dispatch(
        updatePlayerChance({
          chancePlayer: getNextActivePlayer(currentPlayerChance),
        }),
      );
    }, TURN_ROLL_TIMEOUT_SECONDS * 1000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [currentPlayerChance, dispatch, isFocused, missedRolls, winner]);

  return (
    <Wrapper>
      <View className="flex-1 w-full">
        <BoardBackdrop />

        <View className="flex-1 w-full px-2 pt-2 pb-2">
          <View style={{paddingHorizontal: 4}}>
            <View style={{justifyContent: 'center', alignItems: 'center', minHeight: 58}}>
              <View
                style={{
                  position: 'absolute',
                  left: 0,
                  flexDirection: 'row',
                  alignItems: 'center',
                }}
              >
                <TouchableOpacity
                  activeOpacity={0.82}
                  onPress={handleMenuPress}
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 21,
                    borderWidth: 1,
                    borderColor: 'rgba(191,209,255,0.18)',
                    backgroundColor: 'rgba(137,165,240,0.16)',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name="settings-sharp" size={20} color="#ffffff" />
                </TouchableOpacity>

                <View style={{width: 8}} />

                <TouchableOpacity
                  activeOpacity={0.82}
                  onPress={handleTopControlPress}
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 21,
                    borderWidth: 1,
                    borderColor: 'rgba(191,209,255,0.18)',
                    backgroundColor: 'rgba(137,165,240,0.16)',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name="wifi" size={20} color="#39ef49" />
                </TouchableOpacity>
              </View>

              <PrizePoolBanner />
            </View>

            <View
              style={{
                marginTop: 8,
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
                  height: 30,
                  paddingHorizontal: 8,
                  borderRadius: 17,
                  borderWidth: 1.5,
                  borderColor: '#2e55b1',
                  flexDirection: 'row',
                  alignItems: 'center',
                }}
              >
                <View
                style={{
                    width: 22,
                    height: 22,
                    borderRadius: 11,
                    backgroundColor: '#eef4ff',
                    borderWidth: 1.5,
                    borderColor: '#6fa3ff',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name="time-outline" size={15} color="#4b86ff" />
                </View>
                <Text
                  style={{
                    marginLeft: 6,
                    color: '#39ff34',
                    fontSize: 18,
                    fontWeight: '900',
                    letterSpacing: 1,
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
                  width: 34,
                  height: 34,
                  marginLeft: 6,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons
                  name="information-circle-outline"
                  size={20}
                  color="rgba(215,226,255,0.42)"
                />
              </TouchableOpacity>

              <LinearGradient
                colors={['#3b6df1', '#416ee1', '#3561d0']}
                start={{x: 0, y: 0.5}}
                end={{x: 1, y: 0.5}}
                style={{
                  height: 20,
                  minWidth: 80,
                  paddingHorizontal: 20,
                  borderTopLeftRadius: 10,
                  borderBottomLeftRadius: 10,
                  justifyContent: 'center',
                  marginLeft: 4,
                }}
              >
                <Text
                  style={{color: '#ffffff', fontSize: 14, fontWeight: '600' ,right: -15}}
                  numberOfLines={1}
                >
                  Hira
                </Text>
              </LinearGradient>
            </View>

            <View
              style={{
                marginTop: -10,
                flexDirection: 'row',
                alignItems: 'center',
                alignSelf: 'flex-end',
              }}
            >
              <View
                style={{
                  width: firstMoverAvatarSize,
                  height: firstMoverAvatarSize,
                  borderRadius: firstMoverAvatarSize / 2,
                  backgroundColor: '#10275c',
                  borderWidth: 2,
                  borderColor: '#f8941f',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Image
                  source={ProfilePlaceholder}
                  style={{
                    width: firstMoverAvatarSize - 8,
                    height: firstMoverAvatarSize - 8,
                    borderRadius: (firstMoverAvatarSize - 8) / 2,
                  }}
                />
              </View>

              <View style={{marginLeft: 10}}>
                <Dice
                  bubble
                  color={Colors.red}
                  player={2}
                  data={player2}
                  rollTimeoutProgress={turnRollProgress}
                />
              </View>
            </View>
          </View>

          <View className="w-full items-center justify-center mt-2">
            <View style={{width: boardSize, height: boardSize}}>
              <View
                className="rounded-[10px] border p-[3px]"
                style={{
                  width: boardSize,
                  height: boardSize,
                  borderColor: '#516cc0',
                  backgroundColor: '#6075b9',
                  shadowColor: '#062272',
                  shadowOpacity: 0.45,
                  shadowRadius: 18,
                  shadowOffset: {width: 0, height: 7},
                  elevation: 10,
                }}
              >
                <View
                  className="w-full h-full self-center overflow-hidden"
                  style={{backgroundColor: '#cacad1', borderRadius: 6}}
                >
                  <View className="w-full h-[40%] justify-between flex-row bg-[#cacad1]">
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

                  <View className="flex-row w-full h-[20%] justify-between bg-[#cacad1]">
                    <HorizontalPath cells={Plot1Data} color={Colors.blue} />
                    <FourTriangles
                      player1={player1}
                      player2={player2}
                      player3={[]}
                      player4={[]}
                    />
                    <HorizontalPath cells={Plot3Data} color={Colors.green} />
                  </View>

                  <View className="w-full h-[40%] justify-between flex-row bg-[#cacad1]">
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

              {showStartImage ? (
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
              ) : null}
            </View>
          </View>

          <View className="mt-auto w-full px-1" pointerEvents={isDiceTouch ? 'none' : 'auto'}>
            <View
              style={{
                marginTop: 20,
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
                backgroundColor: '#10275c',
                alignItems: 'center',
                borderColor: '#f8941f',
                borderWidth: 2,
                justifyContent: 'center',
              }}
            >
                <View
                  style={{
                    width: firstMoverAvatarSize - 8,
                    height: firstMoverAvatarSize - 8,
                    borderRadius: (firstMoverAvatarSize - 8) / 2,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Image
                    source={ProfilePlaceholder}
                    style={{
                      width: firstMoverAvatarSize - 8,
                      height: firstMoverAvatarSize - 8,
                      borderRadius: (firstMoverAvatarSize - 8) / 2,
                    }}
                  />
                </View>
              </View>

              <View style={{marginLeft: 10}}>
                <Dice
                  bubble
                  color={Colors.yellow}
                  player={1}
                  data={player1}
                  rollTimeoutProgress={turnRollProgress}
                />
              </View>
            </View>

            <View
              style={{
                marginTop: 150,
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
                  height: 20,
                  paddingHorizontal: 20,
                  borderTopRightRadius: 20,
                  borderBottomRightRadius: 20,
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexDirection: 'row',
                  marginTop: -250,
                  marginLeft: -10,
                  
                }}
              >
                <Text
                  style={{
                    color: '#ffffff',
                    fontSize: 14,
                    fontWeight: '600',
                  }}
                  numberOfLines={1}
                >
                  kabir
                </Text>
                <Ionicons
                  name="information-circle-outline"
                  size={20}
                  color="rgba(215,226,255,0.42)"
                />
              </LinearGradient>
            </View>
          </View>

          {menuVisible ? <MenuModal onPressHide={handleCloseMenu} visible={menuVisible} /> : null}
          {winner != null ? <WinModal winner={winner} /> : null}
        </View>
      </View>
    </Wrapper>
  );
};

export default LudoBoardScreen;
