// ✅ EXPO CONVERTED
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';

import { playSound } from '../helpers/SoundUtility';

const ICON_SIZE = 20;

const GradientButton = ({ title, onPress, iconColor = '#d5be3e' }) => {
  return (
    <View
      className="rounded-[10px] border-[5px] border-black my-[10px] self-center bg-white"
      style={{ width: 230, height: 55 }}
    >
      <TouchableOpacity
        activeOpacity={0.8}
        className="rounded-[10px] border-[5px] border-black self-center bg-white"
        style={{
          width: 230,
          height: 55,
          elevation: 5,
          shadowColor: '#d5be3e',
          shadowOffset: { width: 1, height: 1 },
          shadowRadius: 10,
        }}
        onPress={() => {
          playSound('ui');
          onPress();
        }}
      >
        <LinearGradient
          colors={['#4c669f', '#3b5998', '#192f6a']}
          className="w-full h-full rounded-[10px] border-2 border-black flex-row justify-center items-center px-5 py-[10px]"
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        >
          {title === 'RESUME' ? (
            <MaterialIcons name="play-arrow" size={ICON_SIZE} color={iconColor} />
          ) : title === 'NEW GAME' ? (
            <MaterialIcons name="play-circle" size={ICON_SIZE} color={iconColor} />
          ) : title === 'VS CPU' ? (
            <MaterialIcons name="airplay" size={ICON_SIZE} color={iconColor} />
          ) : title === 'HOME' ? (
            <MaterialIcons name="home" size={ICON_SIZE} color={iconColor} />
          ) : (
            <MaterialIcons name="person" size={ICON_SIZE} color={iconColor} />
          )}
          <Text
            className="text-white w-full text-center"
            style={{ fontSize: 16, fontFamily: 'Philosopher-Bold' }}
          >
            {title}
          </Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
};

export default GradientButton;

// ⚠️ INLINE FALLBACK: width: 230, height: 55 — exact pixel values for consistent button sizing
// ⚠️ INLINE FALLBACK: elevation, shadowColor, shadowOffset, shadowRadius — shadow props not in Tailwind
// ⚠️ INLINE FALLBACK: fontSize: 16 — RFValue replaced with fixed; fontFamily needs expo-font loaded
