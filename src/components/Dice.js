// ✅ EXPO CONVERTED
import React, { useEffect, useRef, useState } from 'react';

import LottieView from 'lottie-react-native';
import { Animated, Easing, Image, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useDispatch, useSelector } from 'react-redux';

import DiceRoll from '../assets/animation/diceroll.json';
import Arrow from '../assets/images/arrow.png';
import { BackgroundImage } from '../helpers/GetIcons';
import { canMoveToken, getNextActivePlayer, rollDice } from '../helpers/LudoMovementEngine';
import { playSound } from '../helpers/SoundUtility';
import {
  selectCurrentPlayerChance,
  selectDiceNo,
  selectDiceRolled,
  selectPlayerSixCount,
} from '../redux/reducers/gameSelectors';
import {
  enableCellSelection,
  enablePileSelection,
  updateDiceNo,
  updatePlayerChance,
} from '../redux/reducers/gameSlice';
import TokenPileIcon from './TokenPileIcon';

const Dice = React.memo(({ color, rotate, player, data, compact = false, bubble = false }) => {
  const dispatch = useDispatch();
  const currentPlayerChance = useSelector(selectCurrentPlayerChance);
  const isDiceRolled = useSelector(selectDiceRolled);
  const diceNo = useSelector(selectDiceNo);
  const consecutiveSixCount = useSelector(state => selectPlayerSixCount(state, player));
  const playerPieces = useSelector(state => state.game[`player${player}`]);
  const diceIcon = BackgroundImage.GetImage(diceNo);

  const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

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
  }, [currentPlayerChance, isDiceRolled, arrowAnim]);

  const handleDicePress = async () => {
    const newDiceNo = rollDice();
    const nextSixCount = newDiceNo === 6 ? consecutiveSixCount + 1 : 0;

    playSound('dice_roll');
    setDiceRolling(true);
    await delay(800);
    setDiceRolling(false);
    dispatch(updateDiceNo({ diceNo: newDiceNo, playerNo: player }));
    setDiceRolling(false);

    if (nextSixCount === 3) {
      await delay(400);
      dispatch(updatePlayerChance({ chancePlayer: getNextActivePlayer(player) }));
      return;
    }

    const isAnyPieceAlive = data?.some(piece => piece.positionIndex >= 0 && !piece.isHome);
    const isAnyPieceLocked = data?.findIndex(piece => piece.positionIndex === -1 && !piece.isHome);

    if (!isAnyPieceAlive) {
      if (isAnyPieceLocked !== -1) {
        dispatch(enablePileSelection({ playerNo: player }));
      } else {
        const chancePlayer = getNextActivePlayer(player);
        await delay(600);
        dispatch(updatePlayerChance({ chancePlayer }));
      }
    } else {
      const canMove = playerPieces.some(
        piece => canMoveToken(piece, newDiceNo) && piece.positionIndex >= 0,
      );

      if (!canMove && isAnyPieceLocked === -1) {
        const chancePlayer = getNextActivePlayer(player);
        await delay(600);
        dispatch(updatePlayerChance({ chancePlayer: chancePlayer }));
        return;
      }

      if (isAnyPieceLocked !== -1) {
        dispatch(enablePileSelection({ playerNo: player }));
      }
      if (canMove) {
        dispatch(enableCellSelection({ playerNo: player }));
      }
    }
  };

  const canInteract = currentPlayerChance === player;

  if (bubble) {
    return (
      <View
        className="justify-center items-center flex-row"
        style={{ transform: [{ scaleX: rotate ? -1 : 1 }] }}
      >
        <View style={{ paddingLeft: 14 }}>
          <View
            style={{
              position: 'absolute',
              left: 3,
              top: 22,
              width: 0,
              height: 0,
              borderTopWidth: 12,
              borderBottomWidth: 12,
              borderRightWidth: 18,
              borderTopColor: 'transparent',
              borderBottomColor: 'transparent',
              borderRightColor: canInteract ? '#486cdf' : '#324b99',
            }}
          />

          <View
            style={{
              width: 94,
              height: 94,
              borderRadius: 22,
              padding: 6,
              backgroundColor: canInteract ? '#486cdf' : '#324b99',
              borderWidth: 1.5,
              borderColor: canInteract ? '#6b8cff' : '#4a63ad',
            }}
          >
            <View
              style={{
                flex: 1,
                borderRadius: 17,
                backgroundColor: '#d6d9ec',
                borderWidth: 4,
                borderColor: '#7a81b1',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: canInteract ? 1 : 0.68,
              }}
            >
              {canInteract && !diceRolling ? (
                <TouchableOpacity
                  disabled={diceRolling}
                  activeOpacity={0.45}
                  onPress={handleDicePress}
                >
                  <Image source={diceIcon} style={{ width: 56, height: 56 }} />
                </TouchableOpacity>
              ) : (
                <Image source={diceIcon} style={{ width: 56, height: 56 }} />
              )}
            </View>
          </View>

          {canInteract && diceRolling ? (
            <LottieView
              source={DiceRoll}
              style={{
                height: 104,
                width: 104,
                zIndex: 99,
                position: 'absolute',
                top: -4,
                left: 6,
              }}
              autoPlay
              loop
              cacheComposition
              hardwareAccelerationAndroid
            />
          ) : null}
        </View>
      </View>
    );
  }

  if (compact) {
    return (
      <View
        className="justify-center items-center flex-row"
        style={{ transform: [{ scaleX: rotate ? -1 : 1 }] }}
      >
        <View
          style={{
            borderWidth: 6,
            borderColor: canInteract ? '#39ff34' : '#3752a2',
            borderRadius: 24,
            padding: 6,
            backgroundColor: '#152761',
          }}
        >
          <View
            style={{
              width: 86,
              height: 86,
              borderRadius: 18,
              backgroundColor: '#f1f1f4',
              borderWidth: 5,
              borderColor: '#1b265f',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {canInteract && !diceRolling ? (
              <TouchableOpacity
                disabled={diceRolling}
                activeOpacity={0.45}
                onPress={handleDicePress}
              >
                <Image source={diceIcon} style={{ width: 58, height: 58 }} />
              </TouchableOpacity>
            ) : (
              <Image source={diceIcon} style={{ width: 58, height: 58 }} />
            )}
          </View>
        </View>

        {canInteract && !isDiceRolled ? (
          <Animated.View style={{ marginLeft: 8, transform: [{ translateX: arrowAnim }] }}>
            <Image source={Arrow} style={{ width: 34, height: 22 }} />
          </Animated.View>
        ) : null}

        {canInteract && diceRolling ? (
          <LottieView
            source={DiceRoll}
            style={{ height: 110, width: 110, zIndex: 99, position: 'absolute' }}
            autoPlay
            loop
            cacheComposition
            hardwareAccelerationAndroid
          />
        ) : null}
      </View>
    );
  }

  return (
    <View
      className="justify-center items-center flex-row"
      style={{ transform: [{ scaleX: rotate ? -1 : 1 }] }}
    >
      <View
        className="border-[3px] border-[#f0ce2c]"
        style={{ borderRightWidth: 0 }}
      >
        <LinearGradient
          className="p-[1px] border-[3px] border-[#f0ce2c] justify-center items-center"
          style={{ borderRightWidth: 0 }}
          colors={['#0052be', '#5f9fcb', '#97c6c9']}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
        >
          <View className="px-[3px] py-[10px]">
            <TokenPileIcon color={color} size={35} />
          </View>
        </LinearGradient>
      </View>

      <View
        className="border-[3px] p-[1px] bg-[#aac8ab] rounded-[10px] border-[#aac8ab]"
        style={{ borderLeftWidth: 3 }}
      >
        <LinearGradient
          className="border-[3px] border-[#f0ce2c] justify-center items-center"
          style={{ borderLeftWidth: 3 }}
          colors={['#aac8ab', '#aac8ab', '#aac8ab']}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
        >
          <View
            className="bg-[#e8c0c1] border border-[#e8c0c1] rounded-[5px] justify-center items-center"
            style={{ width: 60, height: 70, paddingHorizontal: 8, paddingVertical: 8, padding: 4 }}
          >
            {currentPlayerChance === player ? (
              <>
                {diceRolling ? null : (
                  <TouchableOpacity
                    disabled={diceRolling}
                    activeOpacity={0.4}
                    onPress={handleDicePress}
                  >
                    <Image source={diceIcon} style={{ width: 45, height: 45 }} />
                  </TouchableOpacity>
                )}
              </>
            ) : null}
          </View>
        </LinearGradient>
      </View>

      {currentPlayerChance === player && !isDiceRolled ? (
        <Animated.View style={{ transform: [{ translateX: arrowAnim }] }}>
          <Image source={Arrow} style={{ width: 40, height: 30 }} />
        </Animated.View>
      ) : null}

      {currentPlayerChance === player && diceRolling ? (
        <LottieView
          source={DiceRoll}
          style={{ height: 80, width: 80, zIndex: 99, top: -25, position: 'absolute' }}
          autoPlay
          loop
          cacheComposition
          hardwareAccelerationAndroid
        />
      ) : null}
    </View>
  );
});

export default Dice;

// ⚠️ INLINE FALLBACK: width/height on diceContainer and icons — exact pixel values for game layout
// ⚠️ INLINE FALLBACK: borderRightWidth: 0 / borderLeftWidth: 3 — NativeWind cannot override individual border sides
// ⚠️ INLINE FALLBACK: transform scaleX, translateX — animation/transform must be inline
// ⚠️ INLINE FALLBACK: rollingDice position — pixel-critical overlay positioning
