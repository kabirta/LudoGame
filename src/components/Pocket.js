// ✅ EXPO CONVERTED
import React, {memo} from 'react';

import {
  Text,
  View,
} from 'react-native';
import {
  useDispatch,
  useSelector,
} from 'react-redux';

import {
  getNextActivePlayer,
  HOME_POSITION_INDEX,
  stepToken,
} from '../helpers/LudoMovementEngine';
import {selectDiceNo} from '../redux/reducers/gameSelectors';
import {
  unfreezeDice,
  updatePlayerChance,
  updateplayerPieceValue,
} from '../redux/reducers/gameSlice';
import Pile from './Pile';

const Pocket = ({ color, player, data, score, scoreLabel }) => {
  const dispatch = useDispatch();
  const diceNo = useSelector(selectDiceNo);
  const isTopLabel = scoreLabel === 'Second Mover';

  const handlePress = async value => {
    let playerNo = value?.id?.slice(0, 1);
    switch (playerNo) {
      case 'A':
        playerNo = 'player1';
        break;
      case 'B':
        playerNo = 'player2';
        break;
      case 'C':
        playerNo = 'player3';
        break;
      default:
        playerNo = 'player4';
        break;
    }

    const numericPlayerNo = parseInt(playerNo.replace('player', ''), 10);
    let updatedToken = value;

    for (let step = 0; step < diceNo; step++) {
      updatedToken = stepToken(updatedToken, numericPlayerNo);
    }

    dispatch(
      updateplayerPieceValue({
        playerNo: playerNo,
        pieceId: updatedToken.id,
        playerColor: updatedToken.playerColor,
        positionIndex: updatedToken.positionIndex,
        score: updatedToken.score,
        isHome: updatedToken.isHome,
        pos: updatedToken.pos,
        travelCount: updatedToken.travelCount,
      }),
    );

    if (diceNo === 6 || updatedToken.positionIndex === HOME_POSITION_INDEX) {
      dispatch(unfreezeDice());
    } else {
      dispatch(updatePlayerChance({ chancePlayer: getNextActivePlayer(numericPlayerNo) }));
    }
  };

  return (
    <View
      className="border-[0.4px] border-[#4f6e82] justify-center items-center w-[40%] h-full"
      style={{ backgroundColor: color }}
    >
      {typeof score === 'number' ? (
        <View className="w-full h-full px-3 py-3">
          <View className="bg-white rounded-[6px] h-full w-full items-center justify-start pt-4">
            {scoreLabel && isTopLabel ? (
              <View className="mb-2 -mt-14 bg-[#6f4a2c] rounded-full px-3 py-1">
                <Text className="text-white text-[14px] font-semibold">{scoreLabel}</Text>
              </View>
            ) : null}

            <View className="w-[92px] h-[92px] rounded-full bg-[#dfe8fb] border-[4px] border-white items-center justify-center">
              <Text className="text-[#24365f] text-[17px] font-bold">Score</Text>
              <Text className="text-[#24365f] text-[36px] font-bold leading-[38px]">{score}</Text>
            </View>

            {scoreLabel && !isTopLabel ? (
              <View className="mt-2 bg-[#6f4a2c] rounded-full px-3 py-1">
                <Text className="text-white text-[14px] font-semibold">{scoreLabel}</Text>
              </View>
            ) : null}

            <View className="absolute left-3 right-3 bottom-4 flex-row justify-between">
              <View className="justify-between" style={{ height: 42 }}>
                <Plot pieceNo={0} player={player} color={color} data={data} handlePress={handlePress} />
                <Plot pieceNo={1} player={player} color={color} data={data} handlePress={handlePress} />
              </View>

              <View className="justify-between" style={{ height: 42 }}>
                <Plot pieceNo={2} player={player} color={color} data={data} handlePress={handlePress} />
                <Plot pieceNo={3} player={player} color={color} data={data} handlePress={handlePress} />
              </View>
            </View>
          </View>
        </View>
      ) : (
        <View className="bg-white border-[0.4px] border-[#4f6e82] p-[15px] w-[70%] h-[70%]" />
      )}
    </View>
  );
};

const Plot = ({ pieceNo, player, color, data, handlePress }) => {
  return (
    <View className="items-center justify-center" style={{ width: 32, height: 18 }}>
      <View
        className="rounded-full"
        style={{ backgroundColor: color, width: 10, height: 10 }}
      />
      {data && data[pieceNo] && data[pieceNo].positionIndex === -1 && !data[pieceNo].isHome && (
        <Pile
          player={player}
          color={color}
          onPress={() => {
            handlePress(data[pieceNo]);
          }}
        />
      )}
    </View>
  );
};

export default memo(Pocket);

// ⚠️ INLINE FALLBACK: backgroundColor: color — dynamic color from props
