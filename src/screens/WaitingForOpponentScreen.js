import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  Alert,
  Animated,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import {LinearGradient} from 'expo-linear-gradient';
import {Ionicons, MaterialCommunityIcons} from '@expo/vector-icons';

import {getCurrentUser} from '../firebase/auth';
import {
  cancelContestQueue,
  MATCHMAKING_WAIT_TIME_SECONDS,
  normalizeContestId,
  requestContestRoundProcessing,
  subscribeToContestBoard,
  subscribeToPlayerAssignment,
} from '../firebase/matchmaking';
import {
  normalizeRoomId,
  subscribeToRoom,
} from '../firebase/rooms';
import {resetAndNavigate} from '../helpers/NavigationUtil';

const ROOM_STATUS_MESSAGES = [
  'Searching for an opponent',
  'Looking for a live player',
  'Matching your game room',
];

const CONTEST_STATUS_MESSAGES = [
  'Collecting players for this round',
  'Waiting for the 60-second timer',
  'Preparing random 2-player matches',
];

const formatSeconds = seconds => {
  const minutes = Math.floor(seconds / 60)
    .toString()
    .padStart(2, '0');
  const secs = (seconds % 60).toString().padStart(2, '0');
  return `${minutes}:${secs}`;
};

const WaitingForOpponentScreen = ({navigation, route}) => {
  const roomId = normalizeRoomId(route?.params?.roomId);
  const contestId = normalizeContestId(route?.params?.contestId);
  const prizePool = route?.params?.prizePool ?? null;
  const playerNo = route?.params?.playerNo ?? 1;
  const waitTimeSeconds = route?.params?.waitTimeSeconds ?? MATCHMAKING_WAIT_TIME_SECONDS;
  const isContestMode = Boolean(contestId);
  const currentUser = getCurrentUser();
  const currentUid = currentUser?.uid ?? null;

  const pulseScale = useRef(new Animated.Value(0.92)).current;
  const pulseOpacity = useRef(new Animated.Value(0.32)).current;
  const dotsOpacity = useRef([
    new Animated.Value(0.35),
    new Animated.Value(0.35),
    new Animated.Value(0.35),
  ]).current;
  const fallbackExpiresAtRef = useRef(Date.now() + waitTimeSeconds * 1000);
  const shouldCancelQueueOnUnmountRef = useRef(true);
  const handledMatchRef = useRef(false);
  const handledTimeoutRef = useRef(false);
  const requestedRoundProcessingRef = useRef(null);

  const [messageIndex, setMessageIndex] = useState(0);
  const [contestBoard, setContestBoard] = useState(null);
  const [assignment, setAssignment] = useState(null);
  const [timeLeft, setTimeLeft] = useState(waitTimeSeconds);

  const statusMessages = isContestMode ? CONTEST_STATUS_MESSAGES : ROOM_STATUS_MESSAGES;
  const infoLabel = isContestMode ? 'PRIZE POOL' : 'ROOM CODE';
  const infoValue = isContestMode ? `Rs. ${prizePool ?? '--'}` : roomId;
  const subtitle = isContestMode
    ? 'Players who join this board during the active round are collected together, then randomly paired when the timer ends.'
    : 'Stay on this screen. The match will start automatically when another player joins.';
  const joinedPlayersCount =
    contestBoard?.activeRoundId &&
    assignment?.roundId &&
    contestBoard.activeRoundId !== assignment.roundId
      ? 0
      : contestBoard?.activePlayerCount ?? 0;

  useEffect(() => {
    fallbackExpiresAtRef.current = Date.now() + waitTimeSeconds * 1000;
  }, [contestId, waitTimeSeconds]);

  const handleLeave = useCallback(() => {
    if (isContestMode) {
      navigation.replace('LobbyScreen');
      return;
    }

    resetAndNavigate('HomeScreen');
  }, [isContestMode, navigation]);

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
      setMessageIndex(currentIndex => (currentIndex + 1) % statusMessages.length);
    }, 1800);

    return () => {
      pulseLoop.stop();
      dotsLoop.stop();
      clearInterval(messageTimer);
    };
  }, [dotsOpacity, pulseOpacity, pulseScale, statusMessages.length]);

  useEffect(() => {
    if (!isContestMode || !contestId || !currentUid) {
      return undefined;
    }

    handledMatchRef.current = false;
    handledTimeoutRef.current = false;
    shouldCancelQueueOnUnmountRef.current = true;
    requestedRoundProcessingRef.current = null;

    const unsubscribeContestBoard = subscribeToContestBoard(contestId, nextContestBoard => {
      setContestBoard(nextContestBoard);
    });
    const unsubscribeAssignment = subscribeToPlayerAssignment(currentUid, nextAssignment => {
      if (
        nextAssignment?.contestId &&
        nextAssignment.contestId !== contestId
      ) {
        return;
      }

      setAssignment(nextAssignment);

      if (
        nextAssignment?.status === 'matched' &&
        nextAssignment?.roomId &&
        !handledMatchRef.current
      ) {
        handledMatchRef.current = true;
        shouldCancelQueueOnUnmountRef.current = false;

        navigation.replace('LudoBoardScreen', {
          roomId: nextAssignment.roomId,
          gameMode: 'online',
          playerNo: nextAssignment.playerNo ?? 1,
          prizePool: prizePool ?? null,
        });
        return;
      }

      if (
        nextAssignment?.status === 'unmatched' &&
        !handledTimeoutRef.current
      ) {
        handledTimeoutRef.current = true;
        shouldCancelQueueOnUnmountRef.current = false;

        Alert.alert(
          'Matchmaking update',
          nextAssignment?.message ?? 'Opponent not found. Try again.',
          [
            {
              text: 'OK',
              onPress: () => {
                navigation.replace('LobbyScreen');
              },
            },
          ],
        );
      }
    });

    return () => {
      unsubscribeContestBoard?.();
      unsubscribeAssignment?.();

      if (shouldCancelQueueOnUnmountRef.current) {
        cancelContestQueue({
          contestId,
          uid: currentUid,
          clearAssignment: true,
        }).catch(error => {
          console.error('Failed to cancel contest queue.', error);
        });
      }
    };
  }, [contestId, currentUid, isContestMode, navigation, prizePool]);

  useEffect(() => {
    if (!isContestMode) {
      return undefined;
    }

    const expiryAt =
      (assignment?.status === 'waiting' &&
      typeof assignment?.expiresAt === 'number'
        ? assignment.expiresAt
        : null) ??
      (typeof contestBoard?.activeRoundEndsAt === 'number'
        ? contestBoard.activeRoundEndsAt
        : null) ??
      fallbackExpiresAtRef.current;

    const syncTimer = () => {
      const remainingSeconds = Math.max(
        Math.ceil((expiryAt - Date.now()) / 1000),
        0,
      );
      setTimeLeft(remainingSeconds);
    };

    syncTimer();
    const interval = setInterval(syncTimer, 250);

    return () => {
      clearInterval(interval);
    };
  }, [
    assignment?.expiresAt,
    assignment?.status,
    contestBoard?.activeRoundEndsAt,
    isContestMode,
  ]);

  useEffect(() => {
    if (
      !isContestMode ||
      !contestId ||
      !currentUid ||
      assignment?.status !== 'waiting' ||
      !assignment?.roundId ||
      timeLeft > 0 ||
      requestedRoundProcessingRef.current === assignment.roundId
    ) {
      return undefined;
    }

    requestedRoundProcessingRef.current = assignment.roundId;

    requestContestRoundProcessing({
      contestId,
      roundId: assignment.roundId,
      uid: currentUid,
    }).catch(error => {
      requestedRoundProcessingRef.current = null;
      console.error('Failed to request contest round processing.', error);
    });

    return undefined;
  }, [
    assignment?.roundId,
    assignment?.status,
    contestId,
    currentUid,
    isContestMode,
    timeLeft,
  ]);

  useEffect(() => {
    if (isContestMode || !roomId) {
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
  }, [isContestMode, navigation, playerNo, roomId]);

  return (
    <LinearGradient
      colors={['#061335', '#0d2470', '#12308d', '#081944']}
      style={styles.screen}
    >
      <View style={styles.patternLayer}>
        {[0, 1, 2, 3, 4, 5].map(row => (
          <View
            key={row}
            style={[
              styles.patternRow,
              {transform: [{scaleY: row % 2 === 0 ? 1 : -1}]},
            ]}
          >
            {[0, 1, 2, 3, 4].map(col => (
              <MaterialCommunityIcons
                key={`${row}-${col}`}
                name="triangle"
                size={42}
                color="#ffffff"
                style={styles.patternTriangle}
              />
            ))}
          </View>
        ))}
      </View>

      <LinearGradient
        colors={['rgba(14,31,82,0.98)', 'rgba(20,38,98,0.96)']}
        style={styles.card}
      >
        <Text style={styles.eyebrow}>
          {isContestMode ? 'MATCHMAKING QUEUE' : 'ONLINE MATCH'}
        </Text>

        <Text style={styles.title}>
          {isContestMode ? 'Waiting for Match' : 'Waiting for Opponent'}
        </Text>

        <Text style={styles.subtitle}>
          {subtitle}
        </Text>

        <View style={styles.pulseWrap}>
          <Animated.View
            style={[
              styles.pulseRing,
              {
                transform: [{scale: pulseScale}],
                opacity: pulseOpacity,
              },
            ]}
          />

          <LinearGradient
            colors={['#2bff8a', '#0ecf68']}
            style={styles.centerBadge}
          >
            <MaterialCommunityIcons name="gamepad-square" size={48} color="#08245d" />
          </LinearGradient>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoLabel}>{infoLabel}</Text>
          <Text style={styles.infoValue}>{infoValue}</Text>
        </View>

        {isContestMode ? (
          <View style={styles.queueStatsRow}>
            <View style={styles.queueStatCard}>
              <Text style={styles.queueStatLabel}>WAIT TIMER</Text>
              <Text style={[styles.queueStatValue, timeLeft <= 10 ? styles.queueStatValueDanger : null]}>
                {formatSeconds(timeLeft)}
              </Text>
            </View>

            <View style={styles.queueStatCard}>
              <Text style={styles.queueStatLabel}>PLAYER POOL</Text>
              <Text style={styles.queueStatValue}>{joinedPlayersCount}</Text>
            </View>
          </View>
        ) : null}

        <View style={styles.statusRow}>
          <Text style={styles.statusText}>
            {statusMessages[messageIndex]}
          </Text>
          {dotsOpacity.map((opacity, index) => (
            <Animated.Text
              key={index}
              style={[
                styles.statusDot,
                {opacity},
              ]}
            >
              .
            </Animated.Text>
          ))}
        </View>

        {isContestMode ? (
          <Text style={styles.queueHint}>
            When the timer closes, everyone in this player pool is randomly paired into 2-player matches. If you are left over, you will see "Opponent not found. Try again."
          </Text>
        ) : null}

        <TouchableOpacity
          activeOpacity={0.86}
          onPress={handleLeave}
          style={styles.backButtonWrap}
        >
          <LinearGradient
            colors={['#1e326f', '#10204d']}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={18} color="#ffffff" />
            <Text style={styles.backButtonText}>
              {isContestMode ? 'Leave Queue' : 'Back to Home'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </LinearGradient>
    </LinearGradient>
  );
};

export default WaitingForOpponentScreen;

const styles = {
  screen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 22,
  },
  patternLayer: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    opacity: 0.12,
  },
  patternRow: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  patternTriangle: {
    marginHorizontal: 10,
  },
  card: {
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
  },
  eyebrow: {
    color: '#f4d56a',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 2.4,
  },
  title: {
    marginTop: 10,
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '900',
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 10,
    color: '#b8c7f1',
    fontSize: 15,
    lineHeight: 21,
    textAlign: 'center',
  },
  pulseWrap: {
    marginTop: 28,
    width: 158,
    height: 158,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseRing: {
    position: 'absolute',
    width: 158,
    height: 158,
    borderRadius: 79,
    borderWidth: 2,
    borderColor: 'rgba(100,255,149,0.45)',
  },
  centerBadge: {
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
  },
  infoCard: {
    marginTop: 26,
    width: '100%',
    borderRadius: 20,
    backgroundColor: 'rgba(6,16,48,0.68)',
    borderWidth: 1,
    borderColor: 'rgba(161,191,255,0.16)',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  infoLabel: {
    color: '#91a8ea',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  infoValue: {
    marginTop: 6,
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 2,
  },
  queueStatsRow: {
    width: '100%',
    flexDirection: 'row',
    marginTop: 16,
  },
  queueStatCard: {
    flex: 1,
    minHeight: 74,
    marginRight: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(6,16,48,0.68)',
    borderWidth: 1,
    borderColor: 'rgba(161,191,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  queueStatLabel: {
    color: '#91a8ea',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  queueStatValue: {
    marginTop: 8,
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '900',
  },
  queueStatValueDanger: {
    color: '#ff7676',
  },
  statusRow: {
    marginTop: 18,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    color: '#dbe5ff',
    fontSize: 15,
    fontWeight: '700',
  },
  statusDot: {
    color: '#2cff8e',
    fontSize: 24,
    fontWeight: '900',
    marginLeft: 2,
  },
  queueHint: {
    marginTop: 14,
    color: '#9ed0ff',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
  },
  backButtonWrap: {
    width: '100%',
    marginTop: 26,
  },
  backButton: {
    height: 54,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  backButtonText: {
    marginLeft: 8,
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
};
