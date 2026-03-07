import React, {memo} from 'react';

import {Text, View} from 'react-native';

const Pocket = ({color, score, scoreLabel}) => {
  return (
    <View
      className="border-[0.4px] border-[#4f6e82] justify-center items-center w-[40%] h-full"
      style={{backgroundColor: color}}
    >
      {typeof score === 'number' ? (
        <View className="w-full h-full px-3 py-3">
          <View className="bg-white rounded-[8px] h-full w-full items-center justify-center">
            <View
              style={{
                width: 104,
                height: 104,
                borderRadius: 52,
                backgroundColor: '#dfe8fb',
                borderWidth: 4,
                borderColor: '#ffffff',
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: color,
                shadowOpacity: 0.45,
                shadowRadius: 14,
                shadowOffset: {width: 0, height: 0},
                elevation: 7,
              }}
            >
              <Text className="text-[#24365f] text-[17px] font-bold">Score</Text>
              <Text className="text-[#24365f] text-[36px] font-bold leading-[38px]">
                {score}
              </Text>
            </View>

            {scoreLabel ? (
              <View
                style={{
                  position: 'absolute',
                  bottom: 12,
                  backgroundColor: '#6f4a2c',
                  borderRadius: 16,
                  paddingHorizontal: 18,
                  paddingVertical: 6,
                }}
              >
                <Text className="text-white text-[14px] font-semibold">{scoreLabel}</Text>
              </View>
            ) : null}
          </View>
        </View>
      ) : (
        <View className="bg-white border-[0.4px] border-[#4f6e82] rounded-[6px] w-[70%] h-[70%]" />
      )}
    </View>
  );
};

export default memo(Pocket);
