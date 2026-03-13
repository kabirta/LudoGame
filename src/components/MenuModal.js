// ✅ EXPO CONVERTED
import React, {useCallback} from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Modal from 'react-native-modal';
import {
  Ionicons,
  MaterialCommunityIcons,
} from '@expo/vector-icons';
import {useDispatch, useSelector} from 'react-redux';

import {resetAndNavigate} from '../helpers/NavigationUtil';
import {stopSound} from '../helpers/SoundUtility';
import {selectGameSettings} from '../redux/reducers/gameSelectors';
import {
  resetGame,
  updateGameSetting,
} from '../redux/reducers/gameSlice';

const DEFAULT_SETTINGS = {
  musicEnabled: false,
  soundEnabled: true,
  vibrationEnabled: true,
  emojisEnabled: true,
};

const TogglePill = ({value, onChange}) => {
  return (
    <View style={styles.toggleTrack}>
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => onChange(false)}
        style={[
          styles.toggleHalf,
          !value && styles.toggleHalfActive,
        ]}
      >
        <Text
          style={[
            styles.toggleText,
            !value && styles.toggleTextActive,
          ]}
        >
          Off
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => onChange(true)}
        style={[
          styles.toggleHalf,
          value && styles.toggleHalfActive,
        ]}
      >
        <Text
          style={[
            styles.toggleText,
            value && styles.toggleTextActive,
          ]}
        >
          On
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const SettingsRow = ({icon, label, value, onChange}) => {
  return (
    <View style={styles.row}>
      <View style={styles.rowLeft}>
        {icon}
        <Text style={styles.rowLabel}>{label}</Text>
      </View>
      <TogglePill value={value} onChange={onChange} />
    </View>
  );
};

const MenuModal = ({visible, onPressExit, onPressHide}) => {
  const dispatch = useDispatch();
  const settings = useSelector(selectGameSettings) ?? DEFAULT_SETTINGS;

  const handleSettingChange = useCallback(
    async (key, value) => {
      dispatch(updateGameSetting({key, value}));

      if (!value && (key === 'soundEnabled' || key === 'musicEnabled')) {
        await stopSound();
      }
    },
    [dispatch],
  );

  const handleExitGame = useCallback(() => {
    if (typeof onPressExit === 'function') {
      onPressExit();
      return;
    }

    dispatch(resetGame());
    onPressHide();
    resetAndNavigate('HomeScreen');
  }, [dispatch, onPressExit, onPressHide]);

  return (
    <Modal
      isVisible={visible}
      onBackdropPress={onPressHide}
      onBackButtonPress={onPressHide}
      animationIn="slideInUp"
      animationOut="slideOutDown"
      backdropColor="#020814"
      backdropOpacity={0.72}
      style={styles.modal}
      useNativeDriverForBackdrop
    >
      <View style={styles.sheet}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onPressHide}
          style={styles.closeButton}
        >
          <Ionicons name="close" size={34} color="#06122f" />
        </TouchableOpacity>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator
        >
          <SettingsRow
            icon={<Ionicons name="musical-notes-outline" size={30} color="#101830" />}
            label="Music"
            value={settings.musicEnabled}
            onChange={value => handleSettingChange('musicEnabled', value)}
          />

          <SettingsRow
            icon={<Ionicons name="volume-medium-outline" size={30} color="#101830" />}
            label="Sound"
            value={settings.soundEnabled}
            onChange={value => handleSettingChange('soundEnabled', value)}
          />

          <SettingsRow
            icon={<MaterialCommunityIcons name="vibrate" size={28} color="#101830" />}
            label="Vibration"
            value={settings.vibrationEnabled}
            onChange={value => handleSettingChange('vibrationEnabled', value)}
          />

          <View style={styles.divider} />

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleExitGame}
            style={styles.exitRow}
          >
            <Text style={styles.exitText}>Exit Game</Text>
            <Ionicons name="chevron-forward" size={28} color="#18213c" />
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
};

export default MenuModal;

const styles = StyleSheet.create({
  modal: {
    justifyContent: 'flex-end',
    margin: 0,
  },
  sheet: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    minHeight: '54%',
    maxHeight: '78%',
    paddingTop: 18,
  },
  closeButton: {
    alignSelf: 'flex-end',
    marginRight: 20,
    marginBottom: 6,
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flexGrow: 0,
  },
  content: {
    paddingHorizontal: 22,
    paddingBottom: 28,
  },
  row: {
    minHeight: 88,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  rowLabel: {
    fontSize: 23,
    fontWeight: '600',
    color: '#1f2844',
  },
  toggleTrack: {
    width: 166,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#b4b4b7',
    flexDirection: 'row',
    padding: 3,
  },
  toggleHalf: {
    flex: 1,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleHalfActive: {
    backgroundColor: '#020a23',
  },
  toggleText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2844',
  },
  toggleTextActive: {
    color: '#ffffff',
  },
  divider: {
    height: 1,
    backgroundColor: '#d9d9df',
    marginTop: 8,
    marginBottom: 10,
  },
  exitRow: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  exitText: {
    fontSize: 22,
    fontWeight: '500',
    color: '#18213c',
  },
});
