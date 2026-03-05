// ✅ EXPO CONVERTED
import React, { memo } from 'react';
import { View } from 'react-native';
import { useDispatch } from 'react-redux';

import { Colors } from '../constants/Colors';
import { startingPoints } from '../helpers/PlotData';
import { unfreezeDice, updateplayerPieceValue } from '../redux/reducers/gameSlice';
import Pile from './Pile';

const Pocket = ({ color, player, data }) => {
  const dispatch = useDispatch();

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
    dispatch(
      updateplayerPieceValue({
        playerNo: playerNo,
        pieceId: value.id,
        pos: startingPoints[parseInt(playerNo.match(/\d+/)[0], 10) - 1],
        travelCount: 1,
      }),
    );
    dispatch(unfreezeDice());
  };

  return (
    <View
      className="border-[0.4px] border-[#4f6e82] justify-center items-center w-[40%] h-full"
      style={{ backgroundColor: color }}
    >
      <View className="bg-white border-[0.4px] border-[#4f6e82] p-[15px] w-[70%] h-[70%]">
        <View className="justify-between items-center w-full h-[40%] flex-row">
          <Plot pieceNo={0} player={player} color={color} data={data} handlePress={handlePress} />
          <Plot pieceNo={1} player={player} color={color} data={data} handlePress={handlePress} />
        </View>

        <View className="justify-between items-center w-full h-[40%] flex-row mt-5">
          <Plot pieceNo={2} player={player} color={color} data={data} handlePress={handlePress} />
          <Plot pieceNo={3} player={player} color={color} data={data} handlePress={handlePress} />
        </View>
      </View>
    </View>
  );
};

const Plot = ({ pieceNo, player, color, data, handlePress }) => {
  return (
    <View>
      <View
        className="rounded-full h-[80%] w-[36%]"
        style={{ backgroundColor: color }}
      />
      {data && data[pieceNo]?.pos === 0 && (
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
