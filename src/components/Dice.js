// ✅ EXPO CONVERTED
import React, {useState} from 'react';

import {LinearGradient} from 'expo-linear-gradient';
import LottieView from 'lottie-react-native';
import {Image, TouchableOpacity, View} from 'react-native';
import Svg, {Rect} from 'react-native-svg';
import {
  useDispatch,
  useSelector,
} from 'react-redux';

import DiceRoll from '../assets/animation/diceroll.json';
import {BackgroundImage} from '../helpers/GetIcons';
import {
  getMovableTokens,
  getNextActivePlayer,
  isTokenInBase,
  rollDice,
} from '../helpers/LudoMovementEngine';
import {playSound} from '../helpers/SoundUtility';
import {
  selectCurrentPlayerChance,
  selectDiceNo,
  selectPlayerSixCount,
} from '../redux/reducers/gameSelectors';
import {
  disableTouch,
  enableCellSelection,
  enablePileSelection,
  resetMissedRolls,
  updateDiceNo,
  updatePlayerChance,
} from '../redux/reducers/gameSlice';
import TokenPileIcon from './TokenPileIcon';

const Dice = React.memo(({
  color,
  rotate,
  player,
  data,
  compact = false,
  bubble = false,
  disabled = false,
  onPress,
  rollTimeoutProgress = 1,
  interactivePlayerNo = null,
}) => {
  const timerStrokeLength = 4 * (66 - 16) + 2 * Math.PI * 16;
  const isInFinalCountdown = rollTimeoutProgress <= 5 / 15;
  const timerStrokeColor = isInFinalCountdown ? '#ff4d4f' : '#5cff60';

  const dispatch = useDispatch();
  const currentPlayerChance = useSelector(selectCurrentPlayerChance);
  const diceNo = useSelector(selectDiceNo);
  const consecutiveSixCount = useSelector(state => selectPlayerSixCount(state, player));
  const playerPieces = useSelector(state => state.game[`player${player}`]);
  const diceIcon = BackgroundImage.GetImage(diceNo);

  const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

  const [diceRolling, setDiceRolling] = useState(false);

  const handleDicePress = async () => {
    if (typeof onPress === 'function') {
      await onPress({player});
      return;
    }

    const newDiceNo = rollDice();
    const nextSixCount = newDiceNo === 6 ? consecutiveSixCount + 1 : 0;

    playSound('dice_roll');
    dispatch(disableTouch());
    dispatch(resetMissedRolls({playerNo: player}));
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

    const movablePieces = getMovableTokens(playerPieces, newDiceNo);
    const movableBasePieces = movablePieces.filter(isTokenInBase);
    const movableBoardPieces = movablePieces.filter(piece => !isTokenInBase(piece));

    if (movablePieces.length === 0) {
      const chancePlayer = getNextActivePlayer(player);
      await delay(600);
      dispatch(updatePlayerChance({ chancePlayer }));
      return;
    }

    if (movableBasePieces.length > 0) {
      dispatch(enablePileSelection({ playerNo: player }));
    }

    if (movableBoardPieces.length > 0) {
      dispatch(enableCellSelection({ playerNo: player }));
    }
  };

  const isOwnedByLocalPlayer =
    interactivePlayerNo == null || interactivePlayerNo === player;
  const canInteract =
    !disabled && isOwnedByLocalPlayer && currentPlayerChance === player;
  const useSmallDiceLayout = bubble || compact;

  if (useSmallDiceLayout) {
    return (
      <View
        className="justify-center items-center flex-row"
        style={{transform: [{scaleX: rotate ? -1 : 1}]}}
      >
        <View
          style={{
            padding: 6,
            borderRadius: 20,
            backgroundColor: canInteract ? 'rgba(80,255,92,0.18)' : 'rgba(52,73,137,0.18)',
            shadowColor: canInteract ? '#5eff68' : '#1f3f95',
            shadowOpacity: canInteract ? 0.8 : 0.2,
            shadowRadius: canInteract ? 14 : 6,
            shadowOffset: {width: 0, height: 0},
            elevation: canInteract ? 10 : 2,
          }}
        >
          <View
            style={{
              width: 70,
              height: 70,
              borderRadius: 18,
              padding: 6,
              backgroundColor: canInteract ? '#0d2560' : '#183072',
              borderWidth: 2.5,
              borderColor: canInteract ? '#2c447f' : '#4963af',
            }}
            >
            {canInteract && !diceRolling ? (
              <View
                pointerEvents="none"
                style={{
                  position: 'absolute',
                  top: -7,
                  right: -7,
                  bottom: -7,
                  left: -7,
                }}
              >
                <Svg width="84" height="84" viewBox="0 0 84 84">
                  <Rect
                    x="9"
                    y="9"
                    width="66"
                    height="66"
                    rx="16"
                    fill="none"
                    stroke={timerStrokeColor}
                    strokeWidth="5"
                    strokeLinecap="round"
                    strokeDasharray={`${Math.max(timerStrokeLength * rollTimeoutProgress, 8)} ${timerStrokeLength}`}
                    transform="rotate(-90 42 42)"
                  />
                </Svg>
              </View>
            ) : null}
            <View
              style={{
                flex: 1,
                borderRadius: 13,
                backgroundColor: '#eef1fb',
                borderWidth: 1.5,
                borderColor: '#aab6dd',
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
                  <Image source={diceIcon} style={{width: 52, height: 52}} />
                </TouchableOpacity>
              ) : (
                <Image source={diceIcon} style={{width: 52, height: 52}} />
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
                top: -10,
                left: -10,
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

  return (
    <View
      className="justify-center items-center flex-row"
      style={{transform: [{scaleX: rotate ? -1 : 1}]}}
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
            {canInteract ? (
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
