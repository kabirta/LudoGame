import React, { useCallback, useEffect, useRef } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  Image,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import LottieView from 'lottie-react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { useIsFocused } from '@react-navigation/native';

import DiceRoll from '../assets/animation/diceroll.json';
import ProfilePic from '../assets/profile_placeholder.png';
import CoinIcon from '../assets/coin_icon.png';
import WalletIcon from '../assets/wallet.png';
import {ensureSignedIn} from '../firebase/auth';
import {createRoom} from '../firebase/rooms';
import { navigate } from '../helpers/NavigationUtil';
import { playSound, stopSound } from '../helpers/SoundUtility';
import { selectCurrentPositions } from '../redux/reducers/gameSelectors';
import { resetGame } from '../redux/reducers/gameSlice';

const { width } = Dimensions.get('window');

const TICKER_MESSAGES = [
  'SU 143 has won ₹0.3 with Rank 1',
  'Rahul K. has won ₹5.0 with Rank 1',
  'Priya M. has won ₹2.5 with Rank 1',
  'Amit S. has won ₹10.0 with Rank 1',
];

const HomeScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const currentPositions = useSelector(selectCurrentPositions);
  const isFocused = useIsFocused();

  const tickerX = useRef(new Animated.Value(width)).current;
  const tickerIndex = useRef(0);

  useEffect(() => {
    if (isFocused) playSound('home');
  }, [isFocused]);

  useEffect(() => {
    const runTicker = () => {
      tickerX.setValue(width);
      Animated.timing(tickerX, {
        toValue: -width * 1.2,
        duration: 6000,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) {
          tickerIndex.current = (tickerIndex.current + 1) % TICKER_MESSAGES.length;
          runTicker();
        }
      });
    };
    runTicker();
  }, []);

  const startGame = useCallback(async (isNew = false) => {
    try {
      await stopSound();
      if (isNew) dispatch(resetGame());
      navigate('LudoBoardScreen');
      playSound('game_start');
    } catch (e) {
      console.error(e);
    }
  }, [dispatch]);

  const startOnlineMatch = useCallback(async () => {
    try {
      await stopSound();
      dispatch(resetGame());

      const user = await ensureSignedIn('Player 1');
      const roomId = await createRoom({
        uid: user.uid,
        name: user.displayName || 'Player 1',
      });

      navigation.navigate('WaitingForOpponentScreen', {
        roomId,
        playerNo: 1,
      });
      playSound('game_start');
    } catch (error) {
      console.error(error);
      Alert.alert(
        'Online match unavailable',
        'Could not create an online room. Check Firebase setup and try again.',
      );
    }
  }, [dispatch, navigation]);

  return (
    <LinearGradient
      colors={['#040d24', '#0b1e4e', '#0e2a72', '#0b1e4e', '#040d24']}
      locations={[0, 0.2, 0.5, 0.8, 1]}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" backgroundColor="#040d24" />

      {/* Background dice */}
      <View style={styles.bgDice} pointerEvents="none">
        <LottieView source={DiceRoll} autoPlay loop speed={0.4} style={styles.bgDiceLottie} />
      </View>

      {/* ── Top nav bar ── */}
      <View style={styles.topBar}>
        {/* Avatar + name + wallet */}
        <View style={styles.userSection}>
          <Image source={ProfilePic} style={styles.avatar} />
          <View style={styles.userInfo}>
            <Text style={styles.userName} numberOfLines={1}>Player</Text>
            <TouchableOpacity style={styles.walletRow} onPress={() => navigation.navigate('WalletScreen')}>
              <Image source={WalletIcon} style={styles.walletIcon} resizeMode="contain" />
              <Text style={styles.walletAmount}>₹1</Text>
              <View style={styles.addBtn}>
                <Ionicons name="add" size={14} color="#fff" />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Right icons */}
        <View style={styles.iconRow}>
          <TouchableOpacity style={styles.iconBtn}>
            <Ionicons name="notifications" size={20} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn}>
            <MaterialCommunityIcons name="gamepad-variant" size={20} color="#4caf50" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate('SettingsScreen')}>
            <Ionicons name="settings-sharp" size={20} color="#ffa726" />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Promo banner ── */}
      <LinearGradient
        colors={['#1565c0', '#1e88e5', '#42a5f5']}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
        style={styles.banner}
      >
        <Text style={styles.bannerText}>
          Now Play with Your Friends for{'\n'}
          <Text style={styles.bannerBold}>free & win cash</Text>
        </Text>
        <View style={styles.winCashBadge}>
          <Text style={styles.winCashStar}>★</Text>
          <Text style={styles.winCashText}>WIN{'\n'}CASH</Text>
        </View>
      </LinearGradient>

      {/* ── LUDO SUPREME title ── */}
      <View style={styles.titleContainer}>
        <View>
          <Text style={[styles.ludoText, styles.ludoTextOutline]}>LUDO</Text>
          <Text style={[styles.ludoText, styles.ludoTextFill]}>LUDO</Text>
        </View>
        <Text style={styles.supremeText}>SUPREME</Text>
      </View>

      {/* ── Play Online button ── */}
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={startOnlineMatch}
        style={styles.btnShadow}
      >
        <LinearGradient
          colors={['#ffb300', '#ff8f00', '#e65100']}
          start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
          style={styles.playBtn}
        >
          <View style={styles.playBtnIconWrapper}>
            <MaterialCommunityIcons name="earth" size={32} color="#fff" />
          </View>
          <Text style={styles.playBtnText}>Play Online</Text>
        </LinearGradient>
      </TouchableOpacity>

      {/* ── Play with Friends button ── */}
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => {
          if (currentPositions.length !== 0) {
            startGame(false);
          } else {
            Alert.alert('Coming Soon', 'Multiplayer with friends is coming soon!');
          }
        }}
        style={[styles.btnShadow, { marginTop: 14 }]}
      >
        <LinearGradient
          colors={['#1976d2', '#1565c0', '#0d47a1']}
          start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
          style={styles.playBtn}
        >
          <View style={styles.playBtnIconWrapper}>
            <MaterialCommunityIcons name="account-group" size={32} color="#fff" />
          </View>
          <Text style={styles.playBtnText}>Play with Friends</Text>
        </LinearGradient>
      </TouchableOpacity>

      {/* ── Bottom ticker ── */}
      <View style={styles.ticker}>
        <Image source={CoinIcon} style={styles.tickerTrophy} resizeMode="contain" />
        <View style={styles.tickerTextArea}>
          <Animated.Text
            style={[styles.tickerText, { transform: [{ translateX: tickerX }] }]}
            numberOfLines={1}
          >
            {TICKER_MESSAGES[tickerIndex.current]}
          </Animated.Text>
        </View>
      </View>
    </LinearGradient>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 52 : 36,
    alignItems: 'center',
  },

  // Background dice
  bgDice: {
    position: 'absolute',
    right: -60,
    top: '35%',
    opacity: 0.08,
  },
  bgDiceLottie: {
    width: 280,
    height: 280,
  },

  // Top nav
  topBar: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    marginBottom: 12,
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 2.5,
    borderColor: '#ffa726',
  },
  userInfo: {
    marginLeft: 10,
    flex: 1,
  },
  userName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  walletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  walletIcon: {
    width: 18,
    height: 18,
    marginRight: 4,
  },
  walletAmount: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    fontWeight: '600',
    marginRight: 6,
  },
  addBtn: {
    backgroundColor: '#1976d2',
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Banner
  banner: {
    width: width - 24,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  bannerText: {
    color: '#fff',
    fontSize: 13,
    flex: 1,
  },
  bannerBold: {
    fontWeight: '800',
    fontSize: 14,
  },
  winCashBadge: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignItems: 'center',
    marginLeft: 12,
  },
  winCashStar: {
    color: '#ffd600',
    fontSize: 12,
  },
  winCashText: {
    color: '#1565c0',
    fontWeight: '900',
    fontSize: 12,
    textAlign: 'center',
  },

  // Title
  titleContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  ludoText: {
    fontSize: 48,
    fontWeight: '900',
    letterSpacing: 6,
    position: 'absolute',
  },
  ludoTextOutline: {
    color: '#1565c0',
    top: 3,
    left: 3,
  },
  ludoTextFill: {
    color: '#64b5f6',
    position: 'relative',
    textShadowColor: 'rgba(100, 200, 255, 0.9)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  supremeText: {
    marginTop: 52,
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 8,
  },

  // Buttons
  btnShadow: {
    width: width - 40,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  playBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  playBtnIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  playBtnText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  // Ticker
  ticker: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 44,
    backgroundColor: 'rgba(0,0,0,0.55)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    overflow: 'hidden',
  },
  tickerTrophy: {
    width: 28,
    height: 28,
    marginRight: 8,
  },
  tickerTextArea: {
    flex: 1,
    overflow: 'hidden',
  },
  tickerText: {
    color: '#ffd600',
    fontSize: 14,
    fontWeight: '700',
    width: width * 1.5,
  },
});
