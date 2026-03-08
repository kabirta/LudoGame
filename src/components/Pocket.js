import React, {memo} from 'react';

import {
  Text,
  View,
} from 'react-native';

const getPocketTone = color => {
  switch (color) {
    case '#d5151d':
      return {
        panel: '#d93a3a',
        inner: '#cd2f31',
        badge: '#8f2f27',
        glow: 'rgba(255,255,255,0.16)',
      };
    case '#ffde17':
      return {
        panel: '#e2c93d',
        inner: '#d1b72b',
        badge: '#8f7a25',
        glow: 'rgba(255,255,255,0.24)',
      };
    case '#00a049':
      return {
        panel: '#39c56d',
        inner: '#24b35a',
        badge: '#2c7f43',
        glow: 'rgba(255,255,255,0.15)',
      };
    default:
      return {
        panel: '#4a67d8',
        inner: '#395bc7',
        badge: '#3150a8',
        glow: 'rgba(255,255,255,0.14)',
      };
  }
};

const Pocket = ({color, score, scoreLabel}) => {
  const tone = getPocketTone(color);

  return (
    <View
      className="border-[0.5px] border-[#6276a8] justify-center items-center w-[40%] h-full overflow-hidden"
      style={{backgroundColor: tone.panel}}
    >
      {typeof score === 'number' ? (
        <View className="w-full h-full p-[8px]">
          <View
            className="h-full w-full items-center justify-center"
            style={{
              backgroundColor: tone.inner,
              borderRadius: 4,
              borderWidth: 1,
              borderColor: 'rgba(0,0,0,0.08)',
              shadowColor: '#17358a',
              shadowOpacity: 0.22,
              shadowRadius: 12,
              shadowOffset: {width: 0, height: 4},
              elevation: 6,
            }}
          >
            <View
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '42%',
                borderTopLeftRadius: 4,
                borderTopRightRadius: 4,
                backgroundColor: tone.glow,
              }}
            />

            <View
              style={{
                width: 80,
                height: 80,
                borderRadius: 53,
                backgroundColor: '#e5eaf6',
                borderWidth: 5,
                borderColor: '#fafcff',
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: '#3653ac',
                shadowOpacity: 0.18,
                shadowRadius: 10,
                shadowOffset: {width: 0, height: 3},
                elevation: 4,
              }}
            >
              <Text className="text-[#23376b] text-[18px] font-bold">Score</Text>
              <Text className="text-[#203266] text-[37px] font-bold leading-[40px]">
                {score}
              </Text>
            </View>

            {scoreLabel ? (
              <View
                style={{
                  position: 'absolute',
                  bottom: -7,
                  minWidth: 106,
                  backgroundColor: tone.badge,
                  borderRadius: 14,
                  paddingHorizontal: 16,
                  paddingVertical: 5,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text
                  className="text-white text-[11px] font-semibold"
                  numberOfLines={1}
                  adjustsFontSizeToFit
                >
                  {scoreLabel}
                </Text>
              </View>
            ) : null}
          </View>
        </View>
      ) : (
        <View
          className="w-full h-full"
          style={{
            backgroundColor: tone.inner,
          }}
        />
      )}
    </View>
  );
};

export default memo(Pocket);
