import React, {useCallback} from 'react';

import {
  StyleSheet,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Modal from 'react-native-modal';
import {useDispatch} from 'react-redux';

import {goBack} from '../helpers/NavigationUtil';
import {playSound} from '../helpers/SoundUtility';
import {resetGame} from '../redux/reducers/gameSlice';
import GradientButton from './GradientButton';

const MenuModal = ({ visible, onPressHide }) => {
  const dispatch = useDispatch();

  const handleNewGame = useCallback(() => {
    dispatch(resetGame());
    playSound('game_start');
    onPressHide();
  }, [dispatch, onPressHide]);


  const handleHome = useCallback(() => {
    goBack(); // Navigate to home screen or main menu
    onPressHide();
  }, [onPressHide]);

  return (
    <Modal
      style={styles.bottomModalView}
      isVisible={visible}
      backdropColor="black"
      backdropOpacity={0.8}
      onBackdropPress={onPressHide}
      animationIn="zoomIn"
      animationOut="zoomOut"
      onBackButtonPress={onPressHide}
    >
      <View style={styles.modelContainer}>
        <View style={styles.gradientContainer}>
          <LinearGradient
            colors={['#0f0c29', '#302b63', '#24243e']}
            style={styles.mondalContainer}
          >
            <View style={styles.subView}>
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

const styles = StyleSheet.create({
  buttomModalView: {
    justifyContent:'center',
    width: '95%',
    alignItems: 'center',

  },
  gradientContainer: {

    borderRadius: 20,
    overflow: 'hidden',


    width: '96%',
    borderColor: 'gold',
    justifyContent: 'center',
    alignItems: 'center',
  },
  subView: {
    width:'100%',
    marginVertical:20,
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mondalContainer: {
    width:'100%',
    justifyContent: 'center',
    alignItems:'center',
  },


});

export default MenuModal;
