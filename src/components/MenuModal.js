// ✅ EXPO CONVERTED
import React, { useCallback } from 'react';
import { View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Modal from 'react-native-modal';
import { useDispatch } from 'react-redux';

import { goBack } from '../helpers/NavigationUtil';
import { playSound } from '../helpers/SoundUtility';
import { resetGame } from '../redux/reducers/gameSlice';
import GradientButton from './GradientButton';

const MenuModal = ({ visible, onPressHide }) => {
  const dispatch = useDispatch();

  const handleNewGame = useCallback(() => {
    dispatch(resetGame());
    playSound('game_start');
    onPressHide();
  }, [dispatch, onPressHide]);

  const handleHome = useCallback(() => {
    goBack();
    onPressHide();
  }, [onPressHide]);

  return (
    <Modal
      className="justify-center w-[95%] items-center"
      isVisible={visible}
      backdropColor="black"
      backdropOpacity={0.8}
      onBackdropPress={onPressHide}
      animationIn="zoomIn"
      animationOut="zoomOut"
      onBackButtonPress={onPressHide}
    >
      <View>
        <View className="rounded-[20px] overflow-hidden w-[96%] justify-center items-center border-[gold]">
          <LinearGradient
            colors={['#0f0c29', '#302b63', '#24243e']}
            className="w-full justify-center items-center"
          >
            <View className="w-full my-5 self-center justify-center items-center">
              <GradientButton title="RESUME" onPress={onPressHide} />
              <GradientButton title="NEW GAME" onPress={handleNewGame} />
              <GradientButton title="HOME" onPress={handleHome} />
            </View>
          </LinearGradient>
        </View>
      </View>
    </Modal>
  );
};

export default MenuModal;
