import React, {
  useEffect,
  useRef,
  useState,
} from 'react';

import LottieView from 'lottie-react-native';
import {
  Animated,
  Easing,
  Image,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {
  useDispatch,
  useSelector,
} from 'react-redux';

import DiceRoll from '../assets/animation/diceroll.json';
import Arrow from '../assets/images/arrow.png';
import {BackgroundImage} from '../helpers/GetIcons';
import {
  selectCurrentPlayerChance,
  selectDiceNo,
  selectDiceRolled,
} from '../redux/reducers/gameSelectors';

const Dice = React.memo(({ color, rotate, player, data }) => {
  const dispatch = useDispatch();

  const currentPlayerChance = useSelector(selectCurrentPlayerChance);
  const isDiceRolled = useSelector(selectDiceRolled);
  const diceNo = useSelector(selectDiceNo);
  const playerPieces = useSelector(
    state => state.game[`player${currentPlayerChance}`],);
  

  const pileIcon = BackgroundImage.GetImage(color);
  const diceIcon = BackgroundImage.GetImage(diceNo);
  const delay = ms=> new Promise(resolve => setTimeout(resolve, ms));
  
  
  const arrowAnim = useRef(new Animated.Value(0)).current;
  const [diceRolling, setDiceRolling] = useState(false);

  useEffect(() => {
    const animateArrow = () => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(arrowAnim, {
            toValue: 10,
            duration: 600,
            easing: Easing.in(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(arrowAnim, {
            toValue: -10,
            duration: 400,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
    };
    animateArrow();
  }, [currentPlayerChance, isDiceRolled]);

  const handleDicePress = () => {
    console.log("Dice Pressed!");
    setDiceRolling(true);
    setTimeout(() => setDiceRolling(false), 1000);
  };

  return (
    <View style={[styles.flexRow, { transform: [{ scaleX: rotate ? -1 : 1 }] }]}>
      <View style={styles.border1}>
        <LinearGradient
          style={styles.LinearGradient}
          colors={['#0052be', '#5f9fcb', '#97c6c9']}
          start={{ x: 0, y: 0.5 }}
          end={{x:1, y:0.5}}>
            
          <View style={styles.pileContainer}>
            <Image source={pileIcon} style={styles.pileIcon} />
          </View>
        </LinearGradient>
      </View>

      <View style={styles.border2}>
        <LinearGradient
          style={styles.diceGradient}
          colors={['#aac8ab', '#aac8ab', '#aac8ab']}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
        >
          <View style={styles.diceContainer}>
            {currentPlayerChance == player ? (
              <>
              {diceRolling ? null : (
              <TouchableOpacity
                disabled={diceRolling}
                activeOpacity={0.4}
                onPress={handleDicePress}
              >
                <Image source={diceIcon} style={styles.dice} />
              </TouchableOpacity>
            )}
            </>
            ):null}
          </View>
        </LinearGradient>
      </View>

      {currentPlayerChance === player && !isDiceRolled ? (
        <Animated.View style={{ transform: [{ translateX: arrowAnim }] }}>
          <Image source={Arrow} style={{ width: 40, height: 30 }} />
        </Animated.View>
      ):null}

      {currentPlayerChance === player && diceRolling ? (
        <LottieView
          source={DiceRoll}
          style={styles.rollingDice}
          autoPlay
          loop
          cacheComposition
          hardwareAccelerationAndroid
        />
      ):null}
    </View>
  );
});

const styles = StyleSheet.create({
  flexRow: {
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  pileIcon: {
    width: 35,
    height: 35,
  },
  diceContainer: {
    backgroundColor: '#e8c0c1',
    borderWidth: 1,
    borderRadius: 5,
    width: 60,
    height: 70,
    paddingHorizontal: 8,
    paddingVertical: 8,
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pileContainer: {
    paddingHorizontal: 3,
    paddingVertical: 10,
  },
  LinearGradient: {
    padding: 1,
    borderWidth: 3,
    borderRightWidth: 0,
    borderColor: '#f0ce2c',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dice: {
    width: 45,
    height: 45,
  },
  rollingDice: {
    height: 80,
    width: 80,
    zIndex: 99,
    top: -25,
    position: 'absolute',
  },
  diceGradient: {
    borderWidth: 3,
    borderLeftWidth: 3,
    borderColor: '#f0ce2c',
    justifyContent: 'center',
    alignItems: 'center',
  },
  border1: {
    borderWidth: 3,
    borderRightWidth: 0,
    borderColor: '#f0ce2c',
  },
  border2: {
  borderWidth: 3,
   padding:1,
   backgroundColor:'#aac8ab',
   borderRadius:10,
   borderLeftWidth:3,
  borderColor: '#aac8ab',
  
    
  },
});

export default Dice;
