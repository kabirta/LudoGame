import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

import {
  Animated,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {useSelector} from 'react-redux';

import {useIsFocused} from '@react-navigation/native';

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
import {Colors} from '../constants/Colors';
import {deviceWidth} from '../constants/Scaling';
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

  const { seconds, formatTime } = useGameTime(10 * 60); // ⏲ 10 mins timer

  const opacity = useRef(new Animated.Value(1)).current;
  const [menuVisible, setMenuVisible] = useState(false);
  const [showStartImage, setShowStartImage] = useState(false);

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
      <View style={styles.rootContainer}>
        {/* ✅ Menu Icon */}
        <TouchableOpacity style={styles.menuIcon} onPress={handleMenuPress}>
          <Image source={MenuIcon} style={styles.menuIconImage} resizeMode="contain" />
        </TouchableOpacity>

        {/* ✅ Timer at Top */}
        <View style={styles.timerContainer}>
          <Text style={styles.timerText}>
            Time Left: {formatTime(seconds)}
          </Text>
        </View>

        {/* ✅ Top Dice Row */}
        <View style={styles.flexRow} pointerEvents={isDiceTouch ? 'none' : 'auto'}>
          <Dice color={Colors.green} player={2} data={player2} />
          <Dice color={Colors.yellow} player={3} rotate data={player3} />
        </View>

        {/* ✅ Ludo Board */}
        <View style={styles.ludoBoard}>
          {/* Top Row */}
          <View style={styles.plotRow}>
            <Pocket color={Colors.green} player={2} data={player2} />
            <VerticalPath cells={Plot2Data} color={Colors.yellow} />
            <Pocket color={Colors.yellow} player={3} data={player3} />
          </View>

          {/* Middle Row */}
          <View style={styles.pathRow}>
            <HorizontalPath cells={Plot1Data} color={Colors.green} />
            <FourTriangles
              player1={player1}
              player2={player2}
              player3={player3}
              player4={player4}
            />
            <HorizontalPath cells={Plot3Data} color={Colors.blue} />
          </View>

          {/* Bottom Row */}
          <View style={styles.plotRow}>
            <Pocket color={Colors.red} player={1} data={player1} />
            <VerticalPath cells={Plot4Data} color={Colors.red} />
            <Pocket color={Colors.blue} player={4} data={player4} />
          </View>
        </View>

        {/* ✅ Bottom Dice Row */}
        <View style={styles.flexRow} pointerEvents={isDiceTouch ? 'none' : 'auto'}>
          <Dice color={Colors.red} player={1} data={player1} />
          <Dice color={Colors.blue} rotate player={4} data={player4} />
        </View>

        {/* ✅ Start Image */}
        {showStartImage && (
          <Animated.Image
            source={StartGame}
            style={{
              width: deviceWidth * 1,
              height: deviceWidth * 0.4,
              position: 'absolute',
              marginTop:350,
              opacity,
            }}
          />
        )}

        {/* ✅ Modals */}
        {menuVisible && (
          <MenuModal onPressHide={handleCloseMenu} visible={menuVisible} />
        )}
        {winner != null && <WinModal winner={winner} />}
      </View>
    </Wrapper>
  );
};

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    width: deviceWidth,
  },
  menuIcon: {
    position: 'absolute',
    top: 20,
    left: 20,
    zIndex: 20,
  },
  menuIconImage: {
    width: 40,
    height: 40,
  },
  timerContainer: {
    marginTop: 60,
    padding: 8,
    backgroundColor: '#4588caff',
    borderRadius: 8,
    alignSelf: 'center',
  },
  timerText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  flexRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 30,
    marginVertical: 10,
  },
  ludoBoard: {
    flex: 1,
    flexDirection: 'column',
  },
  plotRow: {
    flex: 4,
    flexDirection: 'row',
  },
  pathRow: {
    flex: 2,
    flexDirection: 'row',
  },
});

export default LudoBoardScreen;
