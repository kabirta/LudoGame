// EXPO CONVERTED
import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

import {LinearGradient} from 'expo-linear-gradient';
import {
  Alert,
  Animated,
  AppState,
  BackHandler,
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
import {normalizeCurrencyAmount} from '../helpers/currency';
import {useGameTime} from '../helpers/GameTime';
import {getNextActivePlayer} from '../helpers/LudoMovementEngine';
import {resetAndNavigate} from '../helpers/NavigationUtil';
import {
  Plot1Data,
  Plot2Data,
  Plot3Data,
  Plot4Data,
} from '../helpers/PlotData';
import {playSound} from '../helpers/SoundUtility';
import {
  getCurrentUser,
} from '../firebase/auth';
import {getFirebaseSetupErrorMessage} from '../firebase/errorMessages';
import {
  clearOnlineRoomSession,
  persistOnlineRoomSession,
} from '../firebase/onlineSession';
import {
  claimRoomPrizeIfWinner,
  expireRoomTurnIfNeeded,
  finishRoomOnTimeout,
  normalizeRoomId,
  ONLINE_MATCH_TIME_LIMIT_SECONDS,
  queueRoomAction,
  setPlayerConnected,
  subscribeToRoom,
  subscribeToRoomGame,
} from '../firebase/rooms';
import {
  selectCurrentPlayerChance,
  selectDiceTouch,
  selectMissedRolls,
  selectPlayer1,
  selectPlayer2,
  selectScores,
  selectTurnToken,
} from '../redux/reducers/gameSelectors';
import {
  announceWinners,
  hydrateGameFromServer,
  recordMissedRoll,
  resetGame,
  updatePlayerChance,
} from '../redux/reducers/gameSlice';

const TURN_ROLL_TIMEOUT_SECONDS = 15;
const MAX_MISSED_ROLLS = 3;
const WINNER_AUTO_RETURN_DELAY_MS = 4500;
const MISSED_TURN_STEPS = [
  {key: 'first', threshold: 1, label: '1st\nMISS'},
  {key: 'second', threshold: 2, label: '2nd\nMISS'},
  {key: 'game-over', threshold: 3, label: 'GAME\nOVER'},
];

const getTurnMissBannerText = missedCount => {
  if (missedCount >= MAX_MISSED_ROLLS) {
    return 'GAME OVER';
  }

  if (missedCount === 2) {
    return '2nd TURN MISS';
  }

  if (missedCount === 1) {
    return '1st TURN MISS';
  }

  return 'TURN MISSED';
};

const getOnlineRoomTimeLeft = room => {
  const timeLimit =
    typeof room?.timeLimit === 'number' && room.timeLimit > 0
      ? room.timeLimit
      : ONLINE_MATCH_TIME_LIMIT_SECONDS;

  if (typeof room?.startTime !== 'number') {
    return timeLimit;
  }

  const referenceTime =
    typeof room?.endTime === 'number' ? room.endTime : Date.now();
  const elapsedSeconds = Math.max(
    Math.floor((referenceTime - room.startTime) / 1000),
    0,
  );

  return Math.max(timeLimit - elapsedSeconds, 0);
};

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

const PrizePoolBanner = ({amount = 250}) => {
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
            Rs. {amount}
          </Text>
        </View>
      </View>
    </View>
  );
};

const LudoBoardScreen = ({navigation, route}) => {
  const dispatch = useDispatch();
  const player1 = useSelector(selectPlayer1);
  const player2 = useSelector(selectPlayer2);
  const scores = useSelector(selectScores);
  const currentPlayerChance = useSelector(selectCurrentPlayerChance);
  const turnToken = useSelector(selectTurnToken);
  const isDiceTouch = useSelector(selectDiceTouch);
  const missedRolls = useSelector(selectMissedRolls);
  const winner = useSelector(state => state.game.winner);
  const isFocused = useIsFocused();
  const {seconds, formatTime} = useGameTime(5 * 60);
  const timerCompletedRef = useRef(false);
  const onlineMatchExpiryHandledRef = useRef(false);
  const onlineTurnExpiryHandledRef = useRef(null);
  const allowExitNavigationRef = useRef(false);
  const lastTurnTimeoutActionRef = useRef(null);
  const roomPrizeClaimStateRef = useRef(new Map());
  const appStateRef = useRef(AppState.currentState);
  const gameMode = route?.params?.gameMode ?? 'offline';
  const roomId = normalizeRoomId(route?.params?.roomId);
  const playerNo = route?.params?.playerNo ?? null;
  const isOnlineMode = gameMode === 'online' && Boolean(roomId);

  const opacity = useRef(new Animated.Value(1)).current;
  const [menuVisible, setMenuVisible] = useState(false);
  const [showStartImage, setShowStartImage] = useState(false);
  const [turnRollProgress, setTurnRollProgress] = useState(1);
  const [turnMissBanner, setTurnMissBanner] = useState(null);
  const [missedTurnInfoPlayer, setMissedTurnInfoPlayer] = useState(null);
  const [room, setRoom] = useState(null);
  const [roomLoaded, setRoomLoaded] = useState(false);
  const [isQueuingRoomAction, setIsQueuingRoomAction] = useState(false);
  const [onlineTimeLeft, setOnlineTimeLeft] = useState(ONLINE_MATCH_TIME_LIMIT_SECONDS);
  const [winnerResultReason, setWinnerResultReason] = useState(null);
  const boardSize = Math.min(deviceWidth * 0.965, deviceHeight * 0.59);
  const firstMoverAvatarSize = Math.min(deviceWidth * 0.15, 70);
  const footerNameWidth = Math.min(deviceWidth * 0.42, 80);
  const isRoomFinished = isOnlineMode && (room?.status === 'finished' || winner != null);
  const isRoomReadyForActions =
    !isOnlineMode ||
    (
      room?.status === 'playing' &&
      Boolean(room?.players?.player1?.uid) &&
      Boolean(room?.players?.player2?.uid)
    );
  const isWaitingForOpponent =
    isOnlineMode &&
    !isRoomFinished &&
    (!roomLoaded || !isRoomReadyForActions);
  const prizePoolAmount = room?.prizePool ?? route?.params?.prizePool ?? 250;
  const topPlayerName = room?.players?.player2?.name ?? 'Player 2';
  const bottomPlayerName = room?.players?.player1?.name ?? 'Player 1';
  const displayedTimeLeft = isOnlineMode ? onlineTimeLeft : seconds;
  const timerLabel = formatTime(displayedTimeLeft);

  const showMenuSheet = useCallback(() => {
    setMenuVisible(currentVisible => {
      if (!currentVisible) {
        playSound('ui');
      }

      return true;
    });
  }, []);

  const handleMenuPress = useCallback(() => {
    showMenuSheet();
  }, [showMenuSheet]);

  const handleTopControlPress = useCallback(() => {
    playSound('ui');
  }, []);

  const handleMissedTurnInfoPress = useCallback(targetPlayerNo => {
    playSound('ui');
    setMissedTurnInfoPlayer(currentPlayer =>
      currentPlayer === targetPlayerNo ? null : targetPlayerNo,
    );
  }, []);

  const handleCloseMenu = useCallback(() => {
    setMenuVisible(false);
  }, []);

  const leaveBoard = useCallback(targetRoute => {
    allowExitNavigationRef.current = true;
    setMenuVisible(false);
    setMissedTurnInfoPlayer(null);
    setTurnMissBanner(null);
    clearOnlineRoomSession().catch(error => {
      console.error('Failed to clear active online room session.', error);
    });
    dispatch(resetGame());
    resetAndNavigate(targetRoute);
  }, [dispatch]);

  const handleExitGame = useCallback(() => {
    leaveBoard('HomeScreen');
  }, [leaveBoard]);

  const handleResultExit = useCallback(() => {
    leaveBoard(isOnlineMode ? 'LobbyScreen' : 'HomeScreen');
  }, [isOnlineMode, leaveBoard]);

  const handleCloseMissedTurnInfo = useCallback(() => {
    setMissedTurnInfoPlayer(null);
  }, []);

  const enqueueOnlineRoomAction = useCallback(async (type, payload = {}) => {
    if (!isOnlineMode || !roomId || !playerNo || !isRoomReadyForActions) {
      return;
    }

    const currentUser = getCurrentUser();
    if (!currentUser?.uid) {
      Alert.alert(
        'Sign-in required',
        'You need an authenticated Firebase user before sending online moves.',
      );
      return;
    }

    if (isQueuingRoomAction) {
      return;
    }

    try {
      setIsQueuingRoomAction(true);
      playSound('ui');
      await queueRoomAction({
        roomId,
        roomSnapshot: room,
        uid: currentUser.uid,
        playerNo,
        type,
        payload,
      });
    } catch (error) {
      console.error('Failed to apply online room action.', error);
      Alert.alert(
        'Action failed',
        getFirebaseSetupErrorMessage(error),
      );
    } finally {
      setIsQueuingRoomAction(false);
    }
  }, [isOnlineMode, isQueuingRoomAction, isRoomReadyForActions, playerNo, room, roomId]);

  const handleOnlineDicePress = useCallback(async () => {
    if (isOnlineMode && room?.game?.chancePlayer !== playerNo) {
      return;
    }

    await enqueueOnlineRoomAction('ROLL_DICE');
  }, [enqueueOnlineRoomAction, isOnlineMode, playerNo, room?.game?.chancePlayer]);

  const handleOnlineTokenPress = useCallback(async pieceId => {
    const piecePlayerNo =
      typeof pieceId === 'string' && pieceId.length > 0
        ? pieceId.charCodeAt(0) - 64
        : null;

    if (isOnlineMode && piecePlayerNo !== playerNo) {
      return;
    }

    await enqueueOnlineRoomAction('MOVE_TOKEN', {pieceId});
  }, [enqueueOnlineRoomAction, isOnlineMode, playerNo]);

  useEffect(() => {
    if (!isOnlineMode || !roomId) {
      setRoom(null);
      setRoomLoaded(false);
      return undefined;
    }

    setRoomLoaded(false);
    const unsubscribe = subscribeToRoom(roomId, nextRoom => {
      setRoom(nextRoom);
      setRoomLoaded(true);
    });

    return unsubscribe;
  }, [isOnlineMode, roomId]);

  useEffect(() => {
    if (!isOnlineMode || !roomId) {
      return undefined;
    }

    const unsubscribe = subscribeToRoomGame(roomId, game => {
      if (game) {
        dispatch(hydrateGameFromServer(game));
      }
    });

    return unsubscribe;
  }, [dispatch, isOnlineMode, roomId]);

  useEffect(() => {
    if (!isOnlineMode || !roomId || !playerNo) {
      return undefined;
    }

    persistOnlineRoomSession({
      roomId,
      playerNo,
      prizePool: route?.params?.prizePool ?? null,
    }).catch(error => {
      console.error('Failed to persist active online room session.', error);
    });
  }, [isOnlineMode, playerNo, roomId, route?.params?.prizePool]);

  useEffect(() => {
    if (!isOnlineMode || !roomId || !playerNo) {
      return undefined;
    }

    const syncConnectedState = connected => {
      setPlayerConnected({
        roomId,
        playerNo,
        connected,
      }).catch(error => {
        console.error('Failed to update player connection state.', error);
      });
    };

    appStateRef.current = AppState.currentState;
    syncConnectedState(AppState.currentState === 'active');

    const subscription = AppState.addEventListener('change', nextAppState => {
      appStateRef.current = nextAppState;
      syncConnectedState(nextAppState === 'active');
    });

    return () => {
      subscription.remove?.();
      syncConnectedState(false);
    };
  }, [isOnlineMode, playerNo, roomId]);

  useEffect(() => {
    if (!isOnlineMode || !roomId) {
      onlineTurnExpiryHandledRef.current = null;
      return undefined;
    }

    if (
      isWaitingForOpponent ||
      winner != null ||
      room?.status !== 'playing' ||
      room?.game?.winner != null
    ) {
      onlineTurnExpiryHandledRef.current = null;
      return undefined;
    }

    const deadlineAt =
      typeof room?.game?.turnDeadlineAt === 'number'
        ? room.game.turnDeadlineAt
        : null;

    if (!deadlineAt) {
      onlineTurnExpiryHandledRef.current = null;
      return undefined;
    }

    const deadlineKey = `${roomId}:${room?.game?.turnToken ?? 0}:${deadlineAt}`;
    const remainingMs = Math.max(deadlineAt - Date.now(), 0);

    const timeout = setTimeout(() => {
      if (onlineTurnExpiryHandledRef.current === deadlineKey) {
        return;
      }

      onlineTurnExpiryHandledRef.current = deadlineKey;
      expireRoomTurnIfNeeded(roomId).catch(error => {
        onlineTurnExpiryHandledRef.current = null;
        console.error('Failed to expire the online turn.', error);
      });
    }, remainingMs + 80);

    return () => {
      clearTimeout(timeout);
    };
  }, [
    isOnlineMode,
    isWaitingForOpponent,
    room?.game?.turnDeadlineAt,
    room?.game?.turnToken,
    room?.game?.winner,
    room?.status,
    roomId,
    winner,
  ]);

  useEffect(() => {
    if (!isOnlineMode || !roomId || !roomLoaded || !room) {
      return undefined;
    }

    if (room?.status !== 'finished' && room?.game?.winner == null) {
      return undefined;
    }

    const currentUser = getCurrentUser();
    if (!currentUser?.uid) {
      return undefined;
    }

    if (roomPrizeClaimStateRef.current.has(roomId)) {
      return undefined;
    }

    roomPrizeClaimStateRef.current.set(roomId, 'pending');
    claimRoomPrizeIfWinner({
      prizePool: prizePoolAmount,
      roomId,
      roomSnapshot: room,
      user: currentUser,
    })
      .then(() => {
        roomPrizeClaimStateRef.current.set(roomId, 'completed');
        clearOnlineRoomSession().catch(error => {
          console.error('Failed to clear active online room session.', error);
        });
      })
      .catch(error => {
        roomPrizeClaimStateRef.current.delete(roomId);
        console.error('Failed to credit online room prize.', error);
      });

    return undefined;
  }, [isOnlineMode, prizePoolAmount, room, roomId, roomLoaded]);

  useEffect(() => {
    if (!isOnlineMode) {
      return undefined;
    }

    if (roomLoaded && !room) {
      clearOnlineRoomSession().catch(error => {
        console.error('Failed to clear active online room session.', error);
      });
      return undefined;
    }

    const isFinishedRoom =
      room?.status === 'finished' || room?.game?.winner != null;

    if (!isFinishedRoom) {
      return undefined;
    }

    const currentUser = getCurrentUser();
    const shouldWaitForPrizeClaim =
      currentUser?.uid &&
      room?.winner === currentUser.uid &&
      normalizeCurrencyAmount(room?.prizePool ?? prizePoolAmount) > 0 &&
      roomPrizeClaimStateRef.current.get(roomId) !== 'completed';

    if (shouldWaitForPrizeClaim) {
      return undefined;
    }

    clearOnlineRoomSession().catch(error => {
      console.error('Failed to clear active online room session.', error);
    });
  }, [isOnlineMode, prizePoolAmount, room, roomId, roomLoaded, winner]);

  useEffect(() => {
    if (!isOnlineMode || !roomId) {
      lastTurnTimeoutActionRef.current = null;
      roomPrizeClaimStateRef.current.clear();
      return undefined;
    }

    return undefined;
  }, [isOnlineMode, roomId]);

  useEffect(() => {
    if (winner == null) {
      setWinnerResultReason(null);
    }
  }, [winner]);

  useEffect(() => {
    if (!isOnlineMode || !roomId) {
      lastTurnTimeoutActionRef.current = null;
      return undefined;
    }

    const lastActionType = room?.game?.lastAction?.type;
    const lastActionId = room?.game?.lastAction?.actionId;
    const lastActionProcessedAt = room?.game?.lastAction?.processedAt;
    const lastActionPlayerNo = room?.game?.lastAction?.playerNo ?? null;
    const lastActionMissedCount = room?.game?.lastAction?.missedRollCount ?? 0;

    if (lastActionType === 'TIMEOUT_FORFEIT') {
      setWinnerResultReason('timeout-forfeit');
    } else if (lastActionType === 'MATCH_TIMEOUT') {
      setWinnerResultReason('match-time-limit');
    }

    if (
      lastActionType !== 'TIMEOUT_SKIP' &&
      lastActionType !== 'TIMEOUT_FORFEIT'
    ) {
      return undefined;
    }

    const timeoutActionKey = `${lastActionType}:${lastActionId ?? ''}:${lastActionProcessedAt ?? ''}`;
    if (lastTurnTimeoutActionRef.current === timeoutActionKey) {
      return undefined;
    }

    lastTurnTimeoutActionRef.current = timeoutActionKey;
    setTurnMissBanner({
      message: getTurnMissBannerText(lastActionMissedCount),
      playerNo: lastActionPlayerNo,
    });

    return undefined;
  }, [
    isOnlineMode,
    room?.game?.lastAction?.actionId,
    room?.game?.lastAction?.missedRollCount,
    room?.game?.lastAction?.playerNo,
    room?.game?.lastAction?.processedAt,
    room?.game?.lastAction?.type,
    roomId,
  ]);

  useEffect(() => {
    if (isFocused) {
      timerCompletedRef.current = false;
    }
  }, [isFocused]);

  useEffect(() => {
    if (winner != null) {
      return undefined;
    }

    const backSubscription = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        if (allowExitNavigationRef.current) {
          return false;
        }

        if (menuVisible) {
          setMenuVisible(false);
          return true;
        }

        showMenuSheet();
        return true;
      },
    );

    return () => {
      backSubscription.remove?.();
    };
  }, [menuVisible, showMenuSheet, winner]);

  useEffect(() => {
    if (!navigation?.addListener || winner != null) {
      return undefined;
    }

    const unsubscribe = navigation.addListener('beforeRemove', event => {
      if (allowExitNavigationRef.current) {
        return;
      }

      event.preventDefault();
      showMenuSheet();
    });

    return unsubscribe;
  }, [navigation, showMenuSheet, winner]);

  useEffect(() => {
    if (isOnlineMode) {
      return;
    }

    if (seconds !== 0 || winner != null || timerCompletedRef.current) {
      return;
    }

    timerCompletedRef.current = true;
    const player1Score = scores?.player1 ?? 0;
    const player2Score = scores?.player2 ?? 0;
    const finalWinner =
      player1Score === player2Score ? 'draw' : player2Score > player1Score ? 2 : 1;
    setWinnerResultReason('match-time-limit');
    dispatch(announceWinners(finalWinner));
  }, [dispatch, isOnlineMode, scores, seconds, winner]);

  useEffect(() => {
    if (winner == null) {
      return undefined;
    }

    const timeout = setTimeout(() => {
      handleResultExit();
    }, WINNER_AUTO_RETURN_DELAY_MS);

    return () => {
      clearTimeout(timeout);
    };
  }, [handleResultExit, winner]);

  useEffect(() => {
    if (!isOnlineMode) {
      setOnlineTimeLeft(ONLINE_MATCH_TIME_LIMIT_SECONDS);
      return undefined;
    }

    const syncOnlineTimer = () => {
      setOnlineTimeLeft(getOnlineRoomTimeLeft(room));
    };

    syncOnlineTimer();

    if (typeof room?.startTime !== 'number' || typeof room?.endTime === 'number') {
      return undefined;
    }

    const interval = setInterval(syncOnlineTimer, 250);

    return () => {
      clearInterval(interval);
    };
  }, [isOnlineMode, room, room?.endTime, room?.startTime, room?.timeLimit]);

  useEffect(() => {
    if (!isOnlineMode || !roomId) {
      onlineMatchExpiryHandledRef.current = false;
      return undefined;
    }

    if (room?.status !== 'playing' || room?.game?.winner != null || onlineTimeLeft > 0) {
      onlineMatchExpiryHandledRef.current = false;
      return undefined;
    }

    const currentUser = getCurrentUser();
    if (
      !currentUser?.uid ||
      room?.players?.player1?.uid !== currentUser.uid ||
      onlineMatchExpiryHandledRef.current
    ) {
      return undefined;
    }

    onlineMatchExpiryHandledRef.current = true;
    finishRoomOnTimeout(roomId).catch(error => {
      onlineMatchExpiryHandledRef.current = false;
      console.error('Failed to finish expired online room.', error);
    });

    return undefined;
  }, [
    isOnlineMode,
    onlineTimeLeft,
    room?.game?.winner,
    room?.players?.player1?.uid,
    room?.status,
    roomId,
  ]);

  useEffect(() => {
    if (isOnlineMode) {
      setShowStartImage(false);
      return undefined;
    }

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
  }, [isFocused, isOnlineMode, opacity]);

  useEffect(() => {
    if (!turnMissBanner) {
      return undefined;
    }

    const timeout = setTimeout(() => {
      setTurnMissBanner(null);
    }, 1800);

    return () => {
      clearTimeout(timeout);
    };
  }, [turnMissBanner]);

  useEffect(() => {
    if (isOnlineMode) {
      if (isWaitingForOpponent || winner != null) {
        setTurnRollProgress(1);
        return undefined;
      }

      const deadlineAt =
        typeof room?.game?.turnDeadlineAt === 'number'
          ? room.game.turnDeadlineAt
          : null;

      if (!deadlineAt) {
        setTurnRollProgress(1);
        return undefined;
      }

      const syncProgress = () => {
        const remainingMs = Math.max(deadlineAt - Date.now(), 0);
        setTurnRollProgress(
          Math.min(remainingMs / (TURN_ROLL_TIMEOUT_SECONDS * 1000), 1),
        );
      };

      syncProgress();
      const interval = setInterval(syncProgress, 100);

      return () => {
        clearInterval(interval);
      };
    }

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

      setTurnMissBanner({
        message: getTurnMissBannerText(nextMissCount),
        playerNo: currentPlayerChance,
      });
      dispatch(recordMissedRoll({playerNo: currentPlayerChance}));

      if (nextMissCount >= MAX_MISSED_ROLLS) {
        setWinnerResultReason('timeout-forfeit');
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
  }, [
    currentPlayerChance,
    dispatch,
    isFocused,
    isOnlineMode,
    isWaitingForOpponent,
    missedRolls,
    room?.game?.turnDeadlineAt,
    turnToken,
    winner,
  ]);

  const selectedMissedTurnCount =
    missedTurnInfoPlayer == null
      ? 0
      : missedRolls?.[`player${missedTurnInfoPlayer}`] ?? 0;
  const missedTurnCardPosition =
    missedTurnInfoPlayer === 2
      ? {top: 108, right: 26}
      : {bottom: 108, left: 84};
  const missedTurnArrowStyle =
    missedTurnInfoPlayer === 2
      ? {
          position: 'absolute',
          top: -8,
          right: 28,
          width: 16,
          height: 16,
          backgroundColor: '#ffffff',
          borderLeftWidth: 1.5,
          borderTopWidth: 1.5,
          borderColor: '#5e8cff',
          transform: [{rotate: '45deg'}],
        }
      : {
          position: 'absolute',
          left: -8,
          bottom: 34,
          width: 16,
          height: 16,
          backgroundColor: '#ffffff',
          borderLeftWidth: 1.5,
          borderBottomWidth: 1.5,
          borderColor: '#5e8cff',
          transform: [{rotate: '45deg'}],
        };

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

              <PrizePoolBanner amount={prizePoolAmount} />
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
                    color: displayedTimeLeft < 30 ? '#ff5a5f' : '#39ff34',
                    fontSize: 18,
                    fontWeight: '900',
                    letterSpacing: 1,
                    fontVariant: ['tabular-nums'],
                  }}
                >
                  {timerLabel}
                </Text>
              </LinearGradient>

              <TouchableOpacity
                activeOpacity={0.82}
                onPress={() => handleMissedTurnInfoPress(2)}
                style={{
                  width: 34,
                  height: 34,
                  marginLeft: -4,
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
                  {topPlayerName}
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
              <View style={{marginRight: 10}}>
                <Dice
                  bubble
                  color={Colors.red}
                  player={2}
                  data={player2}
                  disabled={isWaitingForOpponent || isQueuingRoomAction}
                  onPress={isOnlineMode ? handleOnlineDicePress : undefined}
                  rollTimeoutProgress={turnRollProgress}
                  interactivePlayerNo={isOnlineMode ? playerNo : null}
                />
              </View>

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
                    <VerticalPath
                      cells={Plot2Data}
                      color={Colors.red}
                      onTokenPress={isOnlineMode ? handleOnlineTokenPress : undefined}
                      interactivePlayerNo={isOnlineMode ? playerNo : null}
                    />
                    <Pocket
                      color={Colors.red}
                      player={2}
                      data={player2}
                      score={scores?.player2 ?? 0}
                      scoreLabel="Second Mover"
                    />
                  </View>

                  <View className="flex-row w-full h-[20%] justify-between bg-[#cacad1]">
                    <HorizontalPath
                      cells={Plot1Data}
                      color={Colors.blue}
                      onTokenPress={isOnlineMode ? handleOnlineTokenPress : undefined}
                      interactivePlayerNo={isOnlineMode ? playerNo : null}
                    />
                    <FourTriangles
                      player1={player1}
                      player2={player2}
                      player3={[]}
                      player4={[]}
                    />
                    <HorizontalPath
                      cells={Plot3Data}
                      color={Colors.green}
                      onTokenPress={isOnlineMode ? handleOnlineTokenPress : undefined}
                      interactivePlayerNo={isOnlineMode ? playerNo : null}
                    />
                  </View>

                  <View className="w-full h-[40%] justify-between flex-row bg-[#cacad1]">
                    <Pocket
                      color={Colors.yellow}
                      player={1}
                      data={player1}
                      score={scores?.player1 ?? 0}
                      scoreLabel="First Mover"
                    />
                    <VerticalPath
                      cells={Plot4Data}
                      color={Colors.yellow}
                      onTokenPress={isOnlineMode ? handleOnlineTokenPress : undefined}
                      interactivePlayerNo={isOnlineMode ? playerNo : null}
                    />
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

          <View className="mt-auto w-full px-1">
            <View
              pointerEvents={isDiceTouch ? 'none' : 'auto'}
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
                  disabled={isWaitingForOpponent || isQueuingRoomAction}
                  onPress={isOnlineMode ? handleOnlineDicePress : undefined}
                  rollTimeoutProgress={turnRollProgress}
                  interactivePlayerNo={isOnlineMode ? playerNo : null}
                />
              </View>
            </View>

            <View
              style={{
                marginTop: 150,
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal:2,
               
              }}
            >
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginTop: -250,
                  marginLeft: -10,
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
                    {bottomPlayerName}
                  </Text>
                </LinearGradient>

                <TouchableOpacity
                  activeOpacity={0.82}
                  onPress={() => handleMissedTurnInfoPress(1)}
                  style={{
                    width: 22,
                    height: 22,
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
              </View>
            </View>
          </View>

          {turnMissBanner?.message ? (
            <View
              pointerEvents="none"
              style={{
                position: 'absolute',
                top: '50%',
                left: 0,
                right: 0,
                alignItems: 'center',
                transform: [{translateY: -28}],
                zIndex: 30,
              }}
            >
              <LinearGradient
                colors={['rgba(17,34,92,0.96)', 'rgba(8,24,68,0.96)']}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 1}}
                style={{
                  minWidth: 180,
                  paddingHorizontal: 18,
                  paddingVertical: 12,
                  borderRadius: 18,
                  borderWidth: 1.5,
                  borderColor: '#7ea7ff',
                  shadowColor: '#051640',
                  shadowOpacity: 0.35,
                  shadowRadius: 12,
                  shadowOffset: {width: 0, height: 4},
                  elevation: 8,
                }}
              >
                <Text
                  style={{
                    color: '#ffffff',
                    fontSize: 20,
                    fontWeight: '900',
                    textAlign: 'center',
                    letterSpacing: 0.6,
                  }}
                >
                  {turnMissBanner.message}
                </Text>
              </LinearGradient>
            </View>
          ) : null}

          {isWaitingForOpponent ? (
            <View
              pointerEvents="auto"
              style={{
                position: 'absolute',
                top: 0,
                right: 0,
                bottom: 0,
                left: 0,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(4, 13, 36, 0.64)',
                zIndex: 35,
                paddingHorizontal: 24,
              }}
            >
              <LinearGradient
                colors={['rgba(7, 20, 59, 0.96)', 'rgba(11, 31, 93, 0.96)']}
                style={{
                  width: '100%',
                  maxWidth: 320,
                  borderRadius: 22,
                  borderWidth: 1,
                  borderColor: 'rgba(126,167,255,0.55)',
                  paddingHorizontal: 22,
                  paddingVertical: 20,
                  alignItems: 'center',
                }}
              >
                <Text
                  style={{
                    color: '#f4d56a',
                    fontSize: 12,
                    fontWeight: '800',
                    letterSpacing: 2,
                  }}
                >
                  ONLINE ROOM
                </Text>
                <Text
                  style={{
                    marginTop: 10,
                    color: '#ffffff',
                    fontSize: 24,
                    fontWeight: '900',
                    textAlign: 'center',
                  }}
                >
                  {roomLoaded && room
                    ? 'Waiting for opponent'
                    : 'Connecting to room'}
                </Text>
                <Text
                  style={{
                    marginTop: 10,
                    color: 'rgba(219,229,255,0.82)',
                    fontSize: 14,
                    lineHeight: 20,
                    textAlign: 'center',
                  }}
                >
                  {roomId
                    ? `Room code: ${roomId}`
                    : 'Preparing a room for online play.'}
                </Text>
                <Text
                  style={{
                    marginTop: 12,
                    color: 'rgba(126,231,156,0.95)',
                    fontSize: 13,
                    fontWeight: '700',
                    textAlign: 'center',
                  }}
                >
                  The board will unlock automatically when a second player joins.
                </Text>
              </LinearGradient>
            </View>
          ) : null}

          {missedTurnInfoPlayer != null ? (
            <View
              style={{
                position: 'absolute',
                top: 0,
                right: 0,
                bottom: 0,
                left: 0,
                zIndex: 40,
              }}
            >
              <TouchableOpacity
                activeOpacity={1}
                onPress={handleCloseMissedTurnInfo}
                style={{
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  bottom: 0,
                  left: 0,
                }}
              />

              <View
                style={{
                  position: 'absolute',
                  width: 210,
                  borderRadius: 18,
                  borderWidth: 1.5,
                  borderColor: '#5e8cff',
                  backgroundColor: '#ffffff',
                  paddingHorizontal: 16,
                  paddingTop: 14,
                  paddingBottom: 16,
                  shadowColor: '#1a2d68',
                  shadowOpacity: 0.28,
                  shadowRadius: 16,
                  shadowOffset: {width: 0, height: 6},
                  elevation: 12,
                  ...missedTurnCardPosition,
                }}
              >
                <View style={missedTurnArrowStyle} />

                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <Text
                    style={{
                      color: '#1b62b2',
                      fontSize: 14,
                      fontWeight: '900',
                      letterSpacing: 0.5,
                    }}
                  >
                    TURN MISSED
                  </Text>

                  <TouchableOpacity
                    activeOpacity={0.82}
                    onPress={handleCloseMissedTurnInfo}
                    style={{
                      width: 24,
                      height: 24,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Ionicons name="close" size={20} color="#4d7fd2" />
                  </TouchableOpacity>
                </View>

                <View
                  style={{
                    marginTop: 16,
                    flexDirection: 'row',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                  }}
                >
                  {MISSED_TURN_STEPS.map(step => {
                    const isReached = selectedMissedTurnCount >= step.threshold;

                    return (
                      <View
                        key={step.key}
                        style={{
                          flex: 1,
                          alignItems: 'center',
                        }}
                      >
                        <Ionicons
                          name={isReached ? 'heart' : 'heart-outline'}
                          size={30}
                          color={isReached ? '#ff617e' : '#8f96ac'}
                        />
                        <Text
                          style={{
                            marginTop: 8,
                            color: '#6d7487',
                            fontSize: 11,
                            fontWeight: '800',
                            lineHeight: 15,
                            textAlign: 'center',
                          }}
                        >
                          {step.label}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            </View>
          ) : null}

          {menuVisible ? (
            <MenuModal
              onPressExit={handleExitGame}
              onPressHide={handleCloseMenu}
              visible={menuVisible}
            />
          ) : null}
          {winner != null ? (
            <WinModal
              exitIcon={isOnlineMode ? 'grid' : 'home'}
              exitLabel={isOnlineMode ? 'Lobby' : 'Home'}
              onExit={handleResultExit}
              resultReason={winnerResultReason}
              winner={winner}
            />
          ) : null}
        </View>
      </View>
    </Wrapper>
  );
};

export default LudoBoardScreen;
