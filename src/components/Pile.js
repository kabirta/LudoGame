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
import {
  Circle,
  Svg,
} from 'react-native-svg';
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

const Pile = ({cell,pieceId,player,color,onPress}) => {
  const rotation = useRef(new Animated.Value(0)).current;
  const currentPlayerPileSelection = useSelector(selectPocketPileSelection)
  const currentPlayerCellSelection = useSelector(selectCellSelection);
  const diceNo = useSelector(selectDiceNo);
  const playerPieces = useSelector(state => state.game[`player${player}`]);


  const isPileEnabled = useMemo(
    () => player === currentPlayerPileSelection,
    [player, currentPlayerPileSelection],
  );
  const  isCellEnabled = useMemo(
    () => player === currentPlayerCellSelection,
    [player, currentPlayerCellSelection]

  );

  const isForwardable = useCallback(() => {
    const piece = playerPieces?.find(item => item.id === pieceId);
    return piece && piece.travelCount + diceNo <= 57;
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
    disabled={!(cell ? isCellEnabled && isForwardable() : isPileEnabled)}
    onPress={onPress}>




      <View style= {styles.hollowCircle}>
        {(cell ? isCellEnabled && isForwardable() : isPileEnabled) && (
          <View style={styles.dashedCircle}>
            <Animated.View
              style={[
                styles.dashedCircle,
                {
                  transform: [{ rotate: rotateInterpolate }],
                },
              ]}>
              <Svg height="18" width="18">
                <Circle cx="9" cy="9" r="8" stroke="white" strokeWidth="2" 
                  strokeDasharray="2, 2"
                  strokeDashoffset='0'
                  fill="transparent" />
              </Svg>
            </Animated.View>
          </View>
        )}


      </View>





      <Image
        source={getPileImage}
        style={{ width: 25, height: 25, position: 'absolute', top:-18}}
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
    alignItems:'center',
    justifyContent:'center',
    top:-8,
  },
  dashedCircle: {
    width: 30,
    height: 30,
    alignSelf:'center',
    justifyContent:'center',

  },
  dashedCircleImage: {
    width: 19,
    height: 19,
    resizeMode: 'contain',
    borderRadius: 50,
    borderWidth: 4,
    borderColor: 'pink',
  },
});


export default  memo(Pile);
