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

import MenuIcon from '../assets/images/menu.png';
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

  const handleMenuPress = useCallback(() => {
    playSound('ui');
    setMenuVisible(true);
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
      <View className="flex-1 w-full px-2 pt-2 pb-3">
        <View className="w-full px-2">
          <View className="flex-row items-center justify-between">
            <TouchableOpacity
              className="rounded-full bg-[#2e63ba]/60 items-center justify-center"
              style={{ width: 46, height: 46 }}
              onPress={handleMenuPress}
            >
              <Image source={MenuIcon} style={{ width: 28, height: 20 }} resizeMode="contain" />
            </TouchableOpacity>

            <LinearGradient
              colors={['#1a50c8', '#264fb9', '#1f3f98']}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              className="rounded-[20px] border border-[#87a7ff] px-5 py-2 flex-row items-center gap-2"
            >
              <Ionicons name="trophy" size={20} color="#f5bf32" />
              <View className="items-center">
                <Text className="text-white text-[15px] font-bold">Prize Pool</Text>
                <Text className="text-white text-[28px] font-bold">Rs 0.15</Text>
              </View>
            </LinearGradient>

            <View style={{ width: 46 }} />
          </View>

          <View className="mt-2 flex-row items-center justify-end">
            <View className="bg-[#0e2f76] border border-[#5c84db] rounded-full px-4 py-1 flex-row items-center">
              <Ionicons name="time-outline" size={16} color="#c6d8ff" />
              <Text className="text-[#33ff59] text-[26px] ml-2 tracking-[2px] font-bold">
                {formatTime(seconds)}
              </Text>
            </View>
          </View>

          <View className="mt-2 flex-row justify-between items-center">
            <Dice color={Colors.yellow} player={2} data={player2} />
            <View className="flex-row items-center bg-[#2959c2] border border-[#7ca0f3] rounded-full px-2 py-1">
              <Image
                source={ProfilePlaceholder}
                style={{ width: 38, height: 38, borderRadius: 19, borderWidth: 2, borderColor: '#f59b28' }}
              />
              <Text className="text-white text-[16px] font-semibold ml-2">umesh Va</Text>
            </View>
          </View>
        </View>

        <View className="w-full items-center justify-center mt-2">
          <View
            className="rounded-[10px] border border-[#5d7fc2] bg-[#5673b8]/70 p-1"
            style={{ width: boardSize, height: boardSize }}
          >
            <View className="w-full h-full self-center">
              <View className="w-full h-[40%] justify-between flex-row bg-[#ccc]">
                <Pocket color={Colors.green} player={2} data={[]} />
                <VerticalPath cells={Plot2Data} color={Colors.yellow} />
                <Pocket
                  color={Colors.yellow}
                  player={2}
                  data={player2}
                  score={scores?.player2 ?? 0}
                  scoreLabel="Second Mover"
                />
              </View>

              <View className="flex-row w-full h-[20%] justify-between bg-[#1E5162]">
                <HorizontalPath cells={Plot1Data} color={Colors.green} />
                <FourTriangles
                  player1={player1}
                  player2={player2}
                  player3={[]}
                  player4={[]}
                />
                <HorizontalPath cells={Plot3Data} color={Colors.blue} />
              </View>

              <View className="w-full h-[40%] justify-between flex-row bg-[#ccc]">
                <Pocket
                  color={Colors.red}
                  player={1}
                  data={player1}
                  score={scores?.player1 ?? 0}
                  scoreLabel="First Mover"
                />
                <VerticalPath cells={Plot4Data} color={Colors.red} />
                <Pocket color={Colors.blue} player={4} data={[]} />
              </View>
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
              top: boardSize * 0.42,
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

        <View className="mt-auto w-full px-2" pointerEvents={isDiceTouch ? 'none' : 'auto'}>
          <View className="bg-[#1947aa] border border-[#6389e0] rounded-t-[10px] h-[42px] px-3 flex-row items-center justify-between">
            <Text className="text-white text-[20px] font-semibold">Emojis</Text>
            <Ionicons name="happy-outline" size={26} color="#e4eeff" />
          </View>

          <View className="bg-[#123d99] border border-[#6389e0] rounded-b-[10px] px-3 py-2 flex-row items-center justify-between">
            <View className="flex-row items-center">
              <View className="w-[56px] h-[56px] rounded-full border-[3px] border-[#f4a836] bg-[#8d3eb2] items-center justify-center">
                <Text className="text-white text-[34px]">B</Text>
              </View>
              <View className="ml-2">
                <Text className="text-white text-[18px] font-semibold">kabir</Text>
              </View>
            </View>

            <View className="flex-row items-center gap-2">
              <Dice color={Colors.red} player={1} data={player1} />
            </View>
          </View>
        </View>

        {menuVisible && (
          <MenuModal onPressHide={handleCloseMenu} visible={menuVisible} />
        )}

        {winner != null && <WinModal winner={winner} />}
      </View>
    </Wrapper>
  );
};

export default LudoBoardScreen;
