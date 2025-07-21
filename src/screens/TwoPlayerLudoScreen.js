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

const TwoPlayerLudoScreen = () => {
  const player1 = useSelector(selectPlayer1); // 🔴 Red
  const player3 = useSelector(selectPlayer3); // 🟡 Yellow
  const player2 = useSelector(selectPlayer2); // 🟢 Green (inactive)
  const player4 = useSelector(selectPlayer4); // 🔵 Blue (inactive)
  const isDiceTouch = useSelector(selectDiceTouch);
  const winner = useSelector(state => state.game.winner);
  const isFocused = useIsFocused();
  const { seconds, formatTime } = useGameTime(8 * 60);

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

        {/* ✅ Timer */}
        <View style={styles.timerContainer}>
          <Text style={styles.timerText}>
            Time Left: {formatTime(seconds)}
          </Text>
        </View>

        {/* ✅ Top Dice Row: Only 🟡 Yellow active */}
        <View style={styles.flexRow} pointerEvents={isDiceTouch ? 'none' : 'auto'}>
          <Dice color={Colors.yellow} player={3} rotate data={player3} />
        </View>

        {/* ✅ Board */}
        <View style={styles.ludoBoard}>
          {/* Top Row */}
          <View style={styles.plotRow}>
            <Pocket color={Colors.green} player={2} data={player2} /> {/* 🟢 Inactive */}
            <VerticalPath cells={Plot2Data} color={Colors.yellow} />
            <Pocket color={Colors.yellow} player={3} data={player3} /> {/* 🟡 Active */}
          </View>

          {/* Middle Row */}
          <View style={styles.pathRow}>
            <HorizontalPath cells={Plot1Data} color={Colors.green} />
            <FourTriangles
              player1={player1}   // 🔴 Active
              player2={null}      // 🟢 Inactive
              player3={player3}   // 🟡 Active
              player4={null}      // 🔵 Inactive
            />
            <HorizontalPath cells={Plot3Data} color={Colors.blue} />
          </View>

          {/* Bottom Row */}
          <View style={styles.plotRow}>
            <Pocket color={Colors.red} player={1} data={player1} /> {/* 🔴 Active */}
            <VerticalPath cells={Plot4Data} color={Colors.red} />
            <Pocket color={Colors.blue} player={4} data={player4} /> {/* 🔵 Inactive */}
          </View>
        </View>

        {/* ✅ Bottom Dice Row: Only 🔴 Red active */}
        <View style={styles.flexRow} pointerEvents={isDiceTouch ? 'none' : 'auto'}>
          <Dice color={Colors.red} player={1} data={player1} />
        </View>

        {/* ✅ Start Image */}
        {showStartImage && (
          <Animated.Image
            source={StartGame}
            style={{
              width: deviceWidth,
              height: deviceWidth * 0.4,
              position: 'absolute',
              top: '50%',
              alignSelf: 'center',
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
    backgroundColor: '#4588ca',
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
    justifyContent: 'center',
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

export default TwoPlayerLudoScreen;
