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
  Image,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import {useSelector} from 'react-redux';

import PileBlue from '../assets/images/piles/blue.png';
import PileGreen from '../assets/images/piles/green.png';
import PileRed from '../assets/images/piles/red.png';
import PileYellow from '../assets/images/piles/yellow.png';
import {Colors} from '../constants/Colors';
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

  // ✅ Pile always enabled for current player
  const isPileEnabled = useMemo(
    () => player === currentPlayerPileSelection,
    [player, currentPlayerPileSelection]
  );

  // ✅ Cell active
  const isCellEnabled = useMemo(
    () => player === currentPlayerCellSelection,
    [player, currentPlayerCellSelection]
  );

  // ✅ Can piece move forward?
  const isForwardable = useCallback(() => {
    const piece = playerPieces?.find(item => item.id === pieceId);
    // Allow pieces to move if they haven't reached home yet (travelCount < 56)
    // or if they can reach exactly 56 (home)
    return piece && piece.travelCount < 56 && piece.travelCount + diceNo <= 56;
  }, [playerPieces, pieceId, diceNo]);

  // ✅ Highlight circle shows for active cell/pile
  const isActive = useMemo(() => {
    if (cell) {
      return isCellEnabled && isForwardable();
    }
    return isPileEnabled; // Always allow pile press if it's the player's turn
  }, [cell, isCellEnabled, isForwardable, isPileEnabled]);

  // ✅ Pile icon
  const getPileImage = useMemo(() => {
    switch (color) {
      case Colors.green:
        return PileGreen;
      case Colors.red:
        return PileRed;
      case Colors.blue:
        return PileBlue;
      case Colors.yellow:
        return PileYellow;
      default:
        return PileGreen;
    }
  }, [color]);

  // ✅ Rotate anim
  useEffect(() => {
    const rotateAnimation = Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration: 1000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    rotateAnimation.start();
    return () => {
      rotateAnimation.stop();
    };
  }, [rotation]);
 

  const rotateInterpolate = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <TouchableOpacity
      style={styles.container}
      activeOpacity={0.5}
      disabled={!isActive}
      onPress={onPress}
    >
     

      <Image
        source={getPileImage}
        style={styles.pileIcon}
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    alignSelf: 'center',
  },
  hollowCircle: {
    width: 15,
    height: 15,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
  },
  dashedCircleContainer: {
    position: 'absolute',
    top: -8,
    width: 25,
    height: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dashedCircle: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pileIcon: {
    width: 15,
    height: 30,
    marginTop:10,
    position: 'absolute',
    top: -18,
  },
});

export default memo(Pile);
