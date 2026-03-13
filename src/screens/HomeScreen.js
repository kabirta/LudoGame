import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Image,
  Modal,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import LottieView from 'lottie-react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useDispatch } from 'react-redux';
import { useIsFocused } from '@react-navigation/native';

import DiceRoll from '../assets/animation/diceroll.json';
import ProfilePic from '../assets/profile_placeholder.png';
import CoinIcon from '../assets/coin_icon.png';
import WalletIcon from '../assets/wallet.png';
import {
  ensureSignedIn,
  getCurrentUser,
  getCurrentUserProfile,
} from '../firebase/auth';
import {getFirebaseSetupErrorMessage} from '../firebase/errorMessages';
import {getResumableOnlineRoomSession} from '../firebase/onlineSession';
import {
  createRoom,
  joinRoom,
  normalizeRoomId,
} from '../firebase/rooms';
import {getUserWallet} from '../firebase/users';
import {formatCurrencyAmount} from '../helpers/currency';
import { playSound, stopSound } from '../helpers/SoundUtility';
import { resetGame } from '../redux/reducers/gameSlice';

const { width } = Dimensions.get('window');

const TICKER_MESSAGES = [
  'SU 143 has won ₹0.3 with Rank 1',
  'Rahul K. has won ₹5.0 with Rank 1',
  'Priya M. has won ₹2.5 with Rank 1',
  'Amit S. has won ₹10.0 with Rank 1',
];

const PRIVATE_ROOM_CODE_LENGTH = 6;

const getUserLabel = user => {
  if (user?.displayName?.trim()) {
    return user.displayName.trim();
  }

  if (user?.email) {
    return user.email.trim();
  }

  return 'Player';
};

const HomeScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const isFocused = useIsFocused();
  const [user, setUser] = useState(() => getCurrentUser());
  const [roomSheetVisible, setRoomSheetVisible] = useState(false);
  const [roomActionLoading, setRoomActionLoading] = useState(false);
  const [joinRoomCode, setJoinRoomCode] = useState('');
  const [createdRoomId, setCreatedRoomId] = useState(null);
  const [walletBalance, setWalletBalance] = useState(0);
  const isRestoringActiveRoomRef = useRef(false);

  const tickerX = useRef(new Animated.Value(width)).current;
  const tickerIndex = useRef(0);

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
  }, [tickerX]);

  const resetPrivateRoomState = useCallback(() => {
    setJoinRoomCode('');
    setCreatedRoomId(null);
  }, []);

  const closePrivateRoomSheet = useCallback(() => {
    if (roomActionLoading) {
      return;
    }

    resetPrivateRoomState();
    setRoomSheetVisible(false);
  }, [resetPrivateRoomState, roomActionLoading]);

  const openPrivateRoomSheet = useCallback(() => {
    playSound('ui');
    resetPrivateRoomState();
    setRoomSheetVisible(true);
  }, [resetPrivateRoomState]);

  const navigateToOnlineRoom = useCallback(async ({roomId, playerNo}) => {
    const normalizedRoomId = normalizeRoomId(roomId);

    await stopSound();
    dispatch(resetGame());
    resetPrivateRoomState();
    setRoomSheetVisible(false);
    navigation.navigate('LudoBoardScreen', {
      roomId: normalizedRoomId,
      gameMode: 'online',
      playerNo,
    });
    playSound('game_start');
  }, [dispatch, navigation, resetPrivateRoomState]);

  const restoreActiveOnlineRoom = useCallback(async () => {
    if (roomActionLoading || roomSheetVisible || isRestoringActiveRoomRef.current) {
      return;
    }

    try {
      isRestoringActiveRoomRef.current = true;
      const resumableSession = await getResumableOnlineRoomSession();

      if (!resumableSession) {
        return;
      }

      await navigateToOnlineRoom({
        roomId: resumableSession.roomId,
        playerNo: resumableSession.playerNo,
      });
    } catch (error) {
      console.error('Failed to restore active online room.', error);
    } finally {
      isRestoringActiveRoomRef.current = false;
    }
  }, [navigateToOnlineRoom, roomActionLoading, roomSheetVisible]);

  useEffect(() => {
    if (isFocused) {
      const syncCurrentUserState = async () => {
        const currentUser = getCurrentUser();
        setUser(currentUser);

        if (!currentUser?.uid) {
          setWalletBalance(0);
          return;
        }

        try {
          const currentProfile = await getCurrentUserProfile();
          setWalletBalance(getUserWallet(currentProfile).totalBalance);
        } catch (error) {
          console.warn('Failed to refresh wallet balance on home screen.', error);
          setWalletBalance(0);
        }
      };

      syncCurrentUserState();
      playSound('home');
      restoreActiveOnlineRoom();
    }
  }, [isFocused, restoreActiveOnlineRoom]);

  const startOnlineMatch = useCallback(async () => {
    playSound('ui');
    navigation.navigate('LobbyScreen');
  }, [navigation]);

  const createPrivateRoom = useCallback(async () => {
    try {
      setRoomActionLoading(true);

      const signedInUser = await ensureSignedIn();
      const playerName = getUserLabel(signedInUser);
      const roomId = await createRoom({
        uid: signedInUser.uid,
        name: playerName,
      });

      setCreatedRoomId(roomId);
    } catch (error) {
      console.error(error);
      Alert.alert(
        'Room creation failed',
        getFirebaseSetupErrorMessage(error),
      );
    } finally {
      setRoomActionLoading(false);
    }
  }, []);

  const joinPrivateRoom = useCallback(async () => {
    const roomId = normalizeRoomId(joinRoomCode);

    if (!roomId) {
      Alert.alert('Room code required', 'Enter the 6-digit room code to join.');
      return;
    }

    if (roomId.length !== PRIVATE_ROOM_CODE_LENGTH) {
      Alert.alert(
        'Invalid room code',
        'Room codes are 6 digits long. Check the code and try again.',
      );
      return;
    }

    try {
      setRoomActionLoading(true);

      const signedInUser = await ensureSignedIn();
      const playerName = getUserLabel(signedInUser);

      await joinRoom({
        roomId,
        uid: signedInUser.uid,
        name: playerName,
      });

      await navigateToOnlineRoom({
        roomId,
        playerNo: 2,
      });
    } catch (error) {
      console.error(error);
      Alert.alert(
        'Join failed',
        getFirebaseSetupErrorMessage(error),
      );
    } finally {
      setRoomActionLoading(false);
    }
  }, [joinRoomCode, navigateToOnlineRoom]);

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
        <TouchableOpacity
          style={styles.userSection}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('ProfileScreen')}>
          <Image
            source={user?.photoURL ? {uri: user.photoURL} : ProfilePic}
            style={styles.avatar}
          />
          <View style={styles.userInfo}>
            <Text style={styles.userName} numberOfLines={1}>
              {getUserLabel(user)}
            </Text>
            <TouchableOpacity
              style={styles.walletRow}
              onPress={() => navigation.navigate('WalletScreen')}>
              <Image source={WalletIcon} style={styles.walletIcon} resizeMode="contain" />
              <Text style={styles.walletAmount}>
                {`\u20B9${formatCurrencyAmount(walletBalance)}`}
              </Text>
              <View style={styles.addBtn}>
                <Ionicons name="add" size={14} color="#fff" />
              </View>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>

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
        onPress={openPrivateRoomSheet}
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

      <Modal
        animationType="fade"
        onRequestClose={closePrivateRoomSheet}
        transparent
        visible={roomSheetVisible}
      >
        <View style={styles.roomModalRoot}>
          <TouchableOpacity
            activeOpacity={1}
            disabled={roomActionLoading}
            onPress={closePrivateRoomSheet}
            style={styles.roomModalBackdrop}
          />

          <LinearGradient
            colors={['#0a1b48', '#102a68', '#0b1c45']}
            style={styles.roomModalCard}
          >
            <View style={styles.roomModalHeader}>
              <View>
                <Text style={styles.roomModalEyebrow}>PRIVATE MATCH</Text>
                <Text style={styles.roomModalTitle}>
                  {createdRoomId ? 'Room created' : 'Play with friends'}
                </Text>
              </View>

              <TouchableOpacity
                activeOpacity={0.82}
                disabled={roomActionLoading}
                onPress={closePrivateRoomSheet}
                style={styles.roomModalCloseButton}
              >
                <Ionicons name="close" size={18} color="#dbe6ff" />
              </TouchableOpacity>
            </View>

            {createdRoomId ? (
              <>
                <Text style={styles.roomModalDescription}>
                  Share this exact room code with your friend, then enter the room and wait for them to join.
                </Text>

                <View style={styles.roomCodeCard}>
                  <Text selectable style={styles.roomCodeText}>
                    {createdRoomId}
                  </Text>
                </View>

                <TouchableOpacity
                  activeOpacity={0.88}
                  onPress={() => navigateToOnlineRoom({roomId: createdRoomId, playerNo: 1})}
                  style={styles.roomPrimaryAction}
                >
                  <LinearGradient
                    colors={['#ffb300', '#ff8f00', '#e65100']}
                    style={styles.roomPrimaryActionFill}
                  >
                    <MaterialCommunityIcons name="door-open" size={20} color="#ffffff" />
                    <Text style={styles.roomPrimaryActionText}>Enter Room</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.roomModalDescription}>
                  Create a private room or join an existing one with the room code.
                </Text>

                <TouchableOpacity
                  activeOpacity={0.88}
                  disabled={roomActionLoading}
                  onPress={createPrivateRoom}
                  style={styles.roomPrimaryAction}
                >
                  <LinearGradient
                    colors={['#2c7df7', '#1658d4', '#0a3ea7']}
                    style={styles.roomPrimaryActionFill}
                  >
                    {roomActionLoading ? (
                      <ActivityIndicator color="#ffffff" />
                    ) : (
                      <>
                        <MaterialCommunityIcons name="plus-circle" size={20} color="#ffffff" />
                        <Text style={styles.roomPrimaryActionText}>Create Room</Text>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                <View style={styles.roomDivider}>
                  <View style={styles.roomDividerLine} />
                  <Text style={styles.roomDividerText}>OR JOIN WITH CODE</Text>
                  <View style={styles.roomDividerLine} />
                </View>

                <View style={styles.roomInputShell}>
                  <Ionicons name="key-outline" size={18} color="#98b4ff" />
                  <TextInput
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!roomActionLoading}
                    keyboardType="number-pad"
                    maxLength={PRIVATE_ROOM_CODE_LENGTH}
                    onChangeText={value =>
                      setJoinRoomCode(
                        value.replace(/\D/g, '').slice(0, PRIVATE_ROOM_CODE_LENGTH),
                      )
                    }
                    placeholder="Enter 6-digit room code"
                    placeholderTextColor="rgba(210,225,255,0.45)"
                    style={styles.roomInput}
                    value={joinRoomCode}
                  />
                </View>

                <TouchableOpacity
                  activeOpacity={0.88}
                  disabled={roomActionLoading}
                  onPress={joinPrivateRoom}
                  style={styles.roomSecondaryAction}
                >
                  <Text style={styles.roomSecondaryActionText}>
                    {roomActionLoading ? 'Joining...' : 'Join Room'}
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </LinearGradient>
        </View>
      </Modal>
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
  roomModalRoot: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  roomModalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(2, 10, 28, 0.78)',
  },
  roomModalCard: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(136,170,255,0.55)',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  roomModalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  roomModalEyebrow: {
    color: '#74a4ff',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  roomModalTitle: {
    marginTop: 8,
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '900',
  },
  roomModalCloseButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  roomModalDescription: {
    marginTop: 14,
    color: 'rgba(222,231,255,0.85)',
    fontSize: 14,
    lineHeight: 20,
  },
  roomCodeCard: {
    marginTop: 18,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(126,167,255,0.5)',
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 16,
    paddingVertical: 18,
  },
  roomCodeText: {
    color: '#f9db79',
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  roomPrimaryAction: {
    marginTop: 18,
    borderRadius: 16,
    overflow: 'hidden',
  },
  roomPrimaryActionFill: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  roomPrimaryActionText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
  roomDivider: {
    marginTop: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  roomDividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(140,170,238,0.35)',
  },
  roomDividerText: {
    color: 'rgba(173,194,245,0.8)',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  roomInputShell: {
    marginTop: 18,
    minHeight: 54,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(129,159,235,0.48)',
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  roomInput: {
    flex: 1,
    marginLeft: 10,
    color: '#ffffff',
    fontSize: 15,
    paddingVertical: 0,
  },
  roomSecondaryAction: {
    marginTop: 14,
    minHeight: 52,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(138,170,255,0.55)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  roomSecondaryActionText: {
    color: '#dbe6ff',
    fontSize: 15,
    fontWeight: '800',
  },
});
