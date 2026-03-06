// ✅ EXPO CONVERTED
import React, { memo, useCallback, useEffect, useMemo, useRef } from 'react';

import { Animated, Easing, TouchableOpacity, View } from 'react-native';
import { Circle, Svg } from 'react-native-svg';
import { useSelector } from 'react-redux';

import { canMoveToken } from '../helpers/LudoMovementEngine';
import TokenPileIcon from './TokenPileIcon';
import {
  selectCellSelection,
  selectDiceNo,
  selectPocketPileSelection,
} from '../redux/reducers/gameSelectors';

const Pile = ({ cell, pieceId, player, color, onPress }) => {
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
        ? { position: 'absolute', top: -20, left: -8 }
        : { position: 'absolute', top: -18 },
    [cell],
  );

  return (
    <TouchableOpacity
      className="items-center justify-center flex-1 self-center"
      activeOpacity={0.5}
      disabled={!(cell ? isCellEnabled && isForwardable() : isPileEnabled)}
      onPress={onPress}
    >
      <View
        className="absolute rounded-[25px] border-2 border-black justify-center items-center"
        style={{ width: 15, height: 15 }}
      >
        {(cell ? isCellEnabled && isForwardable() : isPileEnabled) && (
          <View style={{ width: 30, height: 30, alignSelf: 'center', justifyContent: 'center' }}>
            <Animated.View
              style={{
                width: 30,
                height: 30,
                alignSelf: 'center',
                justifyContent: 'center',
                transform: [{ rotate: rotateInterpolate }],
              }}
            >
              <Svg height="18" width="18">
                <Circle
                  cx="9"
                  cy="9"
                  r="8"
                  stroke="white"
                  strokeWidth="2"
                  strokeDasharray="2, 2"
                  strokeDashoffset="0"
                  fill="transparent"
                />
              </Svg>
            </Animated.View>
          </View>
        )}
      </View>

      <View style={tokenOffsetStyle}>
        <TokenPileIcon color={color} size={25} />
      </View>
    </TouchableOpacity>
  );
};

export default memo(Pile);

// ⚠️ INLINE FALLBACK: hollowCircle width/height (15x15) — exact pixel dimensions for game piece indicator
// ⚠️ INLINE FALLBACK: dashedCircle width/height (30x30) — SVG container sizing
// ⚠️ INLINE FALLBACK: icon top: -18, size 25x25 — pixel-critical pile icon positioning
// ⚠️ INLINE FALLBACK: transform rotate (rotateInterpolate) — animated rotation must be inline
