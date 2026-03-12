// ✅ EXPO CONVERTED
import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from 'react';

import {
  Animated,
  Easing,
  TouchableOpacity,
  View,
} from 'react-native';
import {useSelector} from 'react-redux';

import {canMoveToken} from '../helpers/LudoMovementEngine';
import {
  selectCellSelection,
  selectDiceNo,
  selectPocketPileSelection,
} from '../redux/reducers/gameSelectors';
import TokenPileIcon from './TokenPileIcon';

const Pile = ({
  cell,
  pieceId,
  player,
  color,
  onPress,
  interactivePlayerNo = null,
}) => {
  const defaultPileSize = 30;
  const enabledPileSize = 30;
  const rotation = useRef(new Animated.Value(0)).current;
  const currentPlayerPileSelection = useSelector(selectPocketPileSelection);
  const currentPlayerCellSelection = useSelector(selectCellSelection);
  const diceNo = useSelector(selectDiceNo);
  const playerPieces = useSelector(state => state.game[`player${player}`]);

  const isPileEnabled = useMemo(
    () => player === currentPlayerPileSelection,
    [player, currentPlayerPileSelection],
  );
  const isCellEnabled = useMemo(
    () => player === currentPlayerCellSelection,
    [player, currentPlayerCellSelection],
  );
  const isOwnedByLocalPlayer = useMemo(
    () => interactivePlayerNo == null || interactivePlayerNo === player,
    [interactivePlayerNo, player],
  );

  const isForwardable = useCallback(() => {
    const piece = playerPieces?.find(item => item.id === pieceId);
    return piece && canMoveToken(piece, diceNo);
  }, [playerPieces, pieceId, diceNo]);

  useEffect(() => {
    const rotateAnimation = Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration: 1000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    rotateAnimation.start();
    return () => {
      rotateAnimation.stop();
    };
  }, [rotation]);

  const rotateInterpolate = useMemo(() =>
    rotation.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '360deg'],
    }),
    [rotation],
  );

  const tokenOffsetStyle = useMemo(
    () =>
      cell
        ? { alignItems: 'center', justifyContent: 'center' }
        : { position: 'absolute', top: isPileEnabled ? -47 : -30 },
    [cell, isPileEnabled],
  );
  const isInteractiveSelection =
    isOwnedByLocalPlayer &&
    (cell ? isCellEnabled && isForwardable() : isPileEnabled);
  const showSelectionIndicator = isInteractiveSelection;

  return (
    <TouchableOpacity
      className="items-center justify-center flex-1 self-center"
      activeOpacity={0.5}
      disabled={!isInteractiveSelection}
      onPress={onPress}
    >
      {showSelectionIndicator && (
        <View
          className="absolute justify-center items-center"
          style={{ width: 30, height: 30 }}
        >
          <View style={{ width: 30, height: 50, alignSelf: 'center', justifyContent: 'center' }}>
            <Animated.View
              style={{
                width: 40,
                height: 40,
                alignSelf: 'center',
                justifyContent: 'center',
                alignItems: 'center',
                transform: [{ rotate: rotateInterpolate }],
              }}
            >
              <View
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  borderWidth: 2,
                  borderStyle: 'dashed',
                  borderColor: 'rgba(255,255,255,0.82)',
                }}
              />
            </Animated.View>
          </View>
        </View>
      )}

      <View style={tokenOffsetStyle}>
        <TokenPileIcon color={color} size={isPileEnabled ? enabledPileSize : defaultPileSize} width={isPileEnabled ? 30 : 32} />
      </View>
    </TouchableOpacity>
  );
};

export default memo(Pile);

// ⚠️ INLINE FALLBACK: dashedCircle width/height (30x30) — SVG container sizing
// ⚠️ INLINE FALLBACK: icon top: -18, size 25x25 — pixel-critical pile icon positioning
// ⚠️ INLINE FALLBACK: transform rotate (rotateInterpolate) — animated rotation must be inline
