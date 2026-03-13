import React, {
  useCallback,
  useEffect,
  useState,
} from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ImageBackground,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import {LinearGradient} from 'expo-linear-gradient';
import {Ionicons, MaterialCommunityIcons} from '@expo/vector-icons';
import {useNavigation} from '@react-navigation/native';
import {useDispatch} from 'react-redux';

import CoinIcon from '../assets/coin_icon.png';
import BackgroundImage from '../assets/images/bg.jpeg';
import ProfilePic from '../assets/profile_placeholder.png';
import {ensureSignedIn, getCurrentUser} from '../firebase/auth';
import {getFirebaseSetupErrorMessage} from '../firebase/errorMessages';
import {
  joinContestQueue,
  MATCHMAKING_CONTESTS,
  MATCHMAKING_WAIT_TIME_SECONDS,
  subscribeToContestBoards,
} from '../firebase/matchmaking';
import {playSound} from '../helpers/SoundUtility';
import {resetGame} from '../redux/reducers/gameSlice';

const getUserLabel = user => {
  if (user?.displayName?.trim()) {
    return user.displayName.trim();
  }

  if (user?.email?.trim()) {
    return user.email.trim();
  }

  return 'Player';
};

const formatLobbyTimer = seconds => {
  const minutes = Math.floor(seconds / 60)
    .toString()
    .padStart(2, '0');
  const secs = (seconds % 60).toString().padStart(2, '0');
  return `${minutes}m ${secs}s`;
};

const getContestCountdownSeconds = (contestBoard, now) => {
  if (
    contestBoard?.status === 'collecting' &&
    typeof contestBoard?.activeRoundEndsAt === 'number'
  ) {
    return Math.max(
      Math.ceil((contestBoard.activeRoundEndsAt - now) / 1000),
      0,
    );
  }

  return MATCHMAKING_WAIT_TIME_SECONDS;
};

const LobbyScreen = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const [user, setUser] = useState(() => getCurrentUser());
  const [contestBoards, setContestBoards] = useState({});
  const [isLoadingCounts, setIsLoadingCounts] = useState(true);
  const [joiningContestId, setJoiningContestId] = useState(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    let unsubscribe = null;

    const initializeLobby = async () => {
      try {
        const signedInUser = await ensureSignedIn('Player');
        if (!isMounted) {
          return;
        }

        setUser(signedInUser);
        unsubscribe = subscribeToContestBoards(nextContestBoards => {
          if (!isMounted) {
            return;
          }

          setContestBoards(nextContestBoards);
          setIsLoadingCounts(false);
        });
      } catch (error) {
        console.error('Failed to initialize contest lobby.', error);

        if (!isMounted) {
          return;
        }

        setIsLoadingCounts(false);
        Alert.alert(
          'Lobby unavailable',
          getFirebaseSetupErrorMessage(error),
        );
      }
    };

    initializeLobby();

    return () => {
      isMounted = false;
      unsubscribe?.();
    };
  }, []);

  const handleContestPress = useCallback(async contest => {
    if (joiningContestId) {
      return;
    }

    try {
      setJoiningContestId(contest.id);
      playSound('ui');
      dispatch(resetGame());

      const signedInUser = await ensureSignedIn('Player');
      await joinContestQueue({
        contestId: contest.id,
        uid: signedInUser.uid,
        name: getUserLabel(signedInUser),
      });

      navigation.navigate('WaitingForOpponentScreen', {
        contestId: contest.id,
        prizePool: contest.prizePool,
        entryFee: contest.entryFee,
        waitTimeSeconds: MATCHMAKING_WAIT_TIME_SECONDS,
      });
    } catch (error) {
      console.error('Failed to join contest queue.', error);
      Alert.alert(
        'Matchmaking unavailable',
        getFirebaseSetupErrorMessage(error),
      );
    } finally {
      setJoiningContestId(null);
    }
  }, [dispatch, joiningContestId, navigation]);

  const handleHomePress = useCallback(() => {
    playSound('ui');
    navigation.goBack();
  }, [navigation]);

  const handleProfilePress = useCallback(() => {
    playSound('ui');
    navigation.navigate('ProfileScreen');
  }, [navigation]);

  const handleWalletPress = useCallback(() => {
    playSound('ui');
    navigation.navigate('WalletScreen');
  }, [navigation]);

  const handleSettingsPress = useCallback(() => {
    playSound('ui');
    navigation.navigate('SettingsScreen');
  }, [navigation]);

  return (
    <ImageBackground
      source={BackgroundImage}
      resizeMode="cover"
      style={styles.background}
      imageStyle={styles.backgroundImage}
    >
      <StatusBar barStyle="light-content" backgroundColor="#14349a" />

      <LinearGradient
        colors={['rgba(12,34,112,0.9)', 'rgba(10,30,95,0.95)', 'rgba(7,20,77,0.98)']}
        style={styles.screen}
      >
        <View style={styles.topShell}>
          <LinearGradient
            colors={['#5f86ff', '#3f64eb', '#2b49bf']}
            style={styles.topCapsule}
          >
            <View style={styles.profileRow}>
              <TouchableOpacity
                activeOpacity={0.86}
                onPress={handleProfilePress}
                style={styles.profileTap}
              >
                <View style={styles.avatarRing}>
                  <Image
                    source={user?.photoURL ? {uri: user.photoURL} : ProfilePic}
                    style={styles.avatar}
                  />
                </View>

                <View style={styles.profileMeta}>
                  <Text numberOfLines={1} style={styles.profileName}>
                    {getUserLabel(user)}
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.88}
                onPress={handleWalletPress}
                style={styles.walletPill}
              >
                <Image source={CoinIcon} style={styles.walletIcon} />
                <Text style={styles.walletAmount}>₹0</Text>
                <View style={styles.walletAdd}>
                  <Ionicons name="add" size={14} color="#ffffff" />
                </View>
              </TouchableOpacity>
            </View>

            <View style={styles.utilityRow}>
              <TouchableOpacity activeOpacity={0.86} style={styles.utilityBubble}>
                <Ionicons name="notifications" size={18} color="#d7e7ff" />
              </TouchableOpacity>
              <TouchableOpacity activeOpacity={0.86} style={styles.utilityBubble}>
                <Ionicons name="help-circle" size={19} color="#d7e7ff" />
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.86}
                onPress={handleSettingsPress}
                style={styles.utilityBubbleGold}
              >
                <Ionicons name="settings-sharp" size={18} color="#fff8d0" />
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>

        <LinearGradient
          colors={['#4022b8', '#2b3bcc', '#1745c8']}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 1}}
          style={styles.promoBanner}
        >
          <View style={styles.promoContent}>
            <Text style={styles.promoEyebrow}>GET ₹10</Text>
            <Text style={styles.promoTitle}>Joining BONUS</Text>
            <Text style={styles.promoCaption}>Jump into a queue and let the server find your rival.</Text>
          </View>

          <TouchableOpacity activeOpacity={0.9} style={styles.promoCta}>
            <LinearGradient
              colors={['#29f0d0', '#17d7b8']}
              style={styles.promoCtaFill}
            >
              <Text style={styles.promoCtaText}>DOWNLOAD NOW</Text>
            </LinearGradient>
          </TouchableOpacity>
        </LinearGradient>

        {isLoadingCounts ? (
          <View style={styles.loaderWrap}>
            <ActivityIndicator color="#ffffff" size="large" />
            <Text style={styles.loaderText}>Loading contest boards...</Text>
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={styles.cardList}
            showsVerticalScrollIndicator={false}
          >
            {MATCHMAKING_CONTESTS.map((contest, index) => {
              const contestBoard = contestBoards[contest.id] ?? null;
              const queueCount = contestBoard?.activePlayerCount ?? 0;
              const timerSeconds = getContestCountdownSeconds(contestBoard, now);
              const isJoining = joiningContestId === contest.id;
              const cardGradient =
                index % 2 === 0
                  ? ['#2c51cf', '#1c3ca6', '#143089']
                  : ['#2a61d0', '#2147b4', '#15338f'];

              return (
                <TouchableOpacity
                  key={contest.id}
                  activeOpacity={0.92}
                  disabled={Boolean(joiningContestId)}
                  onPress={() => handleContestPress(contest)}
                  style={styles.cardTouchable}
                >
                  <LinearGradient colors={cardGradient} style={styles.cardShell}>
                    <View style={styles.ribbonWrap}>
                      <LinearGradient
                        colors={['#5ce59f', '#2acb77']}
                        style={styles.ribbon}
                      >
                        <Text style={styles.ribbonText}>2 PLAYERS</Text>
                      </LinearGradient>
                    </View>

                    <View style={styles.cardInner}>
                      <View style={styles.cardTopRow}>
                        <View style={styles.cardStatBlock}>
                          <Text style={styles.cardLabel}>Prize Pool</Text>
                          <View style={styles.darkPill}>
                            <Text style={styles.prizeValue}>₹{contest.prizePool}</Text>
                          </View>
                        </View>

                        <View style={styles.cardTimerWrap}>
                          <View style={styles.timerChip}>
                            <Ionicons name="time-outline" size={16} color="#ffc6d8" />
                            <Text style={styles.timerText}>
                              {formatLobbyTimer(timerSeconds)}
                            </Text>
                          </View>
                        </View>

                        <View style={styles.cardStatBlock}>
                          <Text style={styles.cardLabel}>Entry</Text>
                          <LinearGradient
                            colors={['#37f2ce', '#14d4b4']}
                            style={styles.freeButton}
                          >
                            {isJoining ? (
                              <ActivityIndicator color="#104e53" size="small" />
                            ) : (
                              <Text style={styles.freeButtonText}>{contest.entryFee}</Text>
                            )}
                          </LinearGradient>
                        </View>
                      </View>

                      <View style={styles.cardBottomRow}>
                        <View style={styles.joinedRow}>
                          <Ionicons name="people-outline" size={15} color="#d6e4ff" />
                          <Text style={styles.joinedText}>{queueCount} Joined</Text>
                        </View>

                        <View style={styles.cardBadge}>
                          <MaterialCommunityIcons name="hexagon-outline" size={16} color="#d8e5ff" />
                        </View>
                      </View>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}

        <TouchableOpacity
          activeOpacity={0.9}
          onPress={handleHomePress}
          style={styles.homeButtonWrap}
        >
          <LinearGradient
            colors={['#79f0a1', '#31ce74']}
            style={styles.homeButton}
          >
            <Ionicons name="home" size={24} color="#ffffff" />
          </LinearGradient>
        </TouchableOpacity>
      </LinearGradient>
    </ImageBackground>
  );
};

export default LobbyScreen;

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  backgroundImage: {
    opacity: 0.28,
  },
  screen: {
    flex: 1,
    paddingTop: 18,
    paddingHorizontal: 10,
    paddingBottom: 16,
  },
  topShell: {
    paddingHorizontal: 2,
  },
  topCapsule: {
    borderRadius: 34,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(202,223,255,0.22)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#06154f',
    shadowOpacity: 0.38,
    shadowRadius: 16,
    shadowOffset: {width: 0, height: 8},
    elevation: 8,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 8,
  },
  profileTap: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  avatarRing: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 2,
    borderColor: '#ffc857',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#133082',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  profileMeta: {
    marginLeft: 10,
    flexShrink: 1,
  },
  profileName: {
    color: '#dbe8ff',
    fontSize: 15,
    fontWeight: '800',
    fontFamily: 'Philosopher-Bold',
  },
  walletPill: {
    minHeight: 30,
    margin: 12,
    borderRadius: 15,
    backgroundColor: 'rgba(14, 22, 74, 0.55)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',

  },
  walletIcon: {
    width: 16,
    height: 16,
    tintColor: '#ffe083',
    
    
  },
  walletAmount: {
    marginLeft: 8,
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '900',
  },
  walletAdd: {
    width: 22,
    height: 22,
    borderRadius: 11,
    marginLeft: 10,
    backgroundColor: '#35d76f',
    alignItems: 'center',
    justifyContent: 'center',
  },
  utilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  utilityBubble: {
    width: 38,
    height: 38,
    borderRadius: 19,
    marginLeft: 6,
    backgroundColor: 'rgba(19, 44, 132, 0.86)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  utilityBubbleGold: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginLeft: 6,
    backgroundColor: '#f1a11e',
    borderWidth: 1,
    borderColor: '#ffe39f',
    alignItems: 'center',
    justifyContent: 'center',
  },
  promoBanner: {
    marginTop: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(119, 214, 255, 0.2)',
    paddingHorizontal: 14,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  promoContent: {
    flex: 1,
    paddingRight: 14,
  },
  promoEyebrow: {
    color: '#a8d7ff',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.3,
  },
  promoTitle: {
    marginTop: 2,
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '900',
    fontFamily: 'Philosopher-Bold',
  },
  promoCaption: {
    marginTop: 6,
    color: '#d3ddff',
    fontSize: 12,
    lineHeight: 18,
  },
  promoCta: {
    width: 132,
  },
  promoCtaFill: {
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  promoCtaText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '900',
    textAlign: 'center',
  },
  loaderWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loaderText: {
    marginTop: 12,
    color: '#dce8ff',
    fontSize: 14,
    fontWeight: '700',
  },
  cardList: {
    paddingTop: 14,
    paddingBottom: 86,
  },
  cardTouchable: {
    marginBottom: 16,
  },
  cardShell: {
    borderRadius: 20,
    padding: 2,
    borderWidth: 1,
    borderColor: '#1ce3d6',
    shadowColor: '#0cdad7',
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: {width: 0, height: 6},
    elevation: 7,
  },
  ribbonWrap: {
    position: 'absolute',
    top: -9,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 5,
  },
  ribbon: {
    minWidth: 122,
    height: 28,
    borderRadius: 14,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
  },
  ribbonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.7,
  },
  cardInner: {
    borderRadius: 18,
    backgroundColor: 'rgba(19, 34, 110, 0.92)',
    paddingTop: 24,
    paddingHorizontal: 14,
    paddingBottom: 12,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardStatBlock: {
    flex: 1,
  },
  cardLabel: {
    color: '#bccfff',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  darkPill: {
    marginTop: 10,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#182d7a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  prizeValue: {
    color: '#ffffff',
    fontSize: 30,
    fontWeight: '900',
    fontFamily: 'Philosopher-Bold',
  },
  cardTimerWrap: {
    width: 110,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerChip: {
    minWidth: 104,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#18327d',
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerText: {
    marginLeft: 5,
    color: '#ff6786',
    fontSize: 14,
    fontWeight: '900',
  },
  freeButton: {
    marginTop: 10,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  freeButtonText: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '900',
    fontFamily: 'Philosopher-Bold',
  },
  cardBottomRow: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  joinedRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  joinedText: {
    marginLeft: 6,
    color: '#d6e4ff',
    fontSize: 14,
    fontWeight: '700',
  },
  cardBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  homeButtonWrap: {
    position: 'absolute',
    bottom: 18,
    alignSelf: 'center',
  },
  homeButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.18)',
    shadowColor: '#39e08e',
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: {width: 0, height: 6},
    elevation: 8,
  },
});
