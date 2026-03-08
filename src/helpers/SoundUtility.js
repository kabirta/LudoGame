// ✅ EXPO CONVERTED — react-native-sound-player → expo-av
import { Audio } from 'expo-av';

import {store} from '../redux/store';

let currentSound = null;
let audioModeReady = false;

const getSoundSettings = () => store.getState()?.game?.settings ?? {};
const isSoundEnabled = () => getSoundSettings().soundEnabled ?? true;

const ensureAudioMode = async () => {
  if (audioModeReady) {
    return;
  }

  await Audio.setAudioModeAsync({
    allowsRecordingIOS: false,
    interruptionModeAndroid:
      Audio.INTERRUPTION_MODE_ANDROID_DUCK_OTHERS ?? 1,
    interruptionModeIOS:
      Audio.INTERRUPTION_MODE_IOS_DUCK_OTHERS ?? 1,
    playsInSilentModeIOS: true,
    playThroughEarpieceAndroid: false,
    shouldDuckAndroid: true,
    staysActiveInBackground: false,
  });

  audioModeReady = true;
};

export const stopSound = async () => {
  if (currentSound) {
    try {
      await currentSound.stopAsync();
      await currentSound.unloadAsync();
      currentSound = null;
    } catch (e) {
      // ignore
    }
  }
};

export const playSound = async (soundName) => {
  try {
    if (!isSoundEnabled()) {
      return;
    }
    await ensureAudioMode();
    await stopSound();
    const soundPath = getSoundPath(soundName);
    const { sound } = await Audio.Sound.createAsync(soundPath);
    currentSound = sound;
    await sound.playAsync();
    sound.setOnPlaybackStatusUpdate(status => {
      if (status.didJustFinish) {
        sound.unloadAsync();
        if (currentSound === sound) {
          currentSound = null;
        }
      }
    });
  } catch (e) {
    const errorMessage = String(e?.message ?? e ?? '');
    if (errorMessage.includes('AudioFocusNotAcquiredException')) {
      return;
    }
    console.log('cannot play the sound file', e);
  }
};

const getSoundPath = soundName => {
  switch (soundName) {
    case 'dice_roll':
      return require('../assets/sfx/dice_roll.mp3');
    case 'cheer':
      return require('../assets/sfx/cheer.mp3');
    case 'game_start':
      return require('../assets/sfx/game_start.mp3');
    case 'collide':
      return require('../assets/sfx/collide.mp3');
    case 'home_win':
      return require('../assets/sfx/home_win.mp3');
    case 'pile_move':
      return require('../assets/sfx/pile_move.mp3');
    case 'safe_spot':
      return require('../assets/sfx/safe_spot.mp3');
    case 'ui':
      return require('../assets/sfx/ui.mp3');
    case 'home':
      return require('../assets/sfx/home.mp3');
    case 'girl2':
      return require('../assets/sfx/girl2.mp3');
    case 'girl1':
      return require('../assets/sfx/girl1.mp3');
    case 'girl3':
      return require('../assets/sfx/girl3.mp3');
    default:
      throw new Error(`Sound ${soundName} not found`);
  }
};
