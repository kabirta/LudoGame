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
  View,
} from 'react-native';
import {Colors} from 'react-native/Libraries/NewAppScreen';
import {useSelector} from 'react-redux';

import dashedCircle from '../assets/images/dashedCircle.png';
import PileBlue from '../assets/images/piles/blue.png';
import PileGreen from '../assets/images/piles/green.png';
import PileRed from '../assets/images/piles/red.png';
import PileYellow from '../assets/images/piles/yellow.png';
import {
  selectCellSelection,
  selectDiceNo,
  selectPocketPileSelection,
} from '../redux/reducers/gameSelectors';

const Pile = ({cell,pieceId,player,color,onPress}) => {
  const rotation = useRef(new Animated.Value(0)).current;
  const currentPlayerPileSelection = useSelector(selectPocketPileSelection);
  const currentPlayerCellSelection = useSelector(selectCellSelection);
  const diceNo = useSelector(selectDiceNo);
  const playerPieces = useSelector(state => state.game[`player${player}`]);


  const isPieceEnabled = useMemo(
    () => player === currentPlayerCellSelection,
    [player,currentPlayerCellSelection],
  );
  const  isCellEnabled = useMemo(
    () => player === currentPlayerCellSelection,
    [player, currentPlayerCellSelection]

  );

  const isForwardable = useCallback(() => {
    const piece = playerPieces?.find(item => item.id === pieceId);
    return piece && piece.travelcount + diceNo <= 57;
  }, [playerPieces, pieceId, diceNo]);


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
  }), [rotation]);






  return (
    <TouchableOpacity
    style={styles.container}
    activeOpacity={0.5}
    disabled={!cell ? isCellEnabled && isForwardable() : isPieceEnabled}
    onPress={onPress}>




      <View style= {styles.hollowCircle}>
        {(cell ? isCellEnabled && isForwardable() : isPieceEnabled) && (
          <View style={styles.dashedCircleContainer}>
            <Animated.View
              style={[
                styles.dashedCircle,
                {
                  transform: [{ rotate: rotateInterpolate }],
                },
              ]}>
                <Image
                  source={dashedCircle}
                  style={styles.dashedCircleImage}
                />

            </Animated.View>
          </View>
        )}


      </View>





      <Image
        source={getPileImage}
        style={{ width: 15, height: 15, position: 'absolute', top:-16}}
      />
     </TouchableOpacity>



  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    flex:1,
    alignSelf:'center',
  },
  hollowCircle: {
    width: 15,
    height: 15,
    position:'absolute',
    borderRadius: 25,
    borderWidth: 2,
    borderColor: 'black',
    justifyContent:'center',
    alignItems:'center',
  },
  dashedCircleContainer: {

    position:'absolute',
    width: 25,
    height: 25,
    backgroundColor: 'white',

    justifyContent:'center',
    alignItems:'center',
    top:-8,
  },
  dashedCircle: {
    width: 25,
    height: 25,
    alignSelf:'center',
    justifyContent:'center',

  },
  dashedCircleImage: {
    width: 20,
    height: 20,
    resizeMode: 'contain',
    borderRadius: 50,
    borderWidth: 4,
    borderColor: 'pink',
  },
});


export default  memo(Pile);
