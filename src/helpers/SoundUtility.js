// ✅ EXPO CONVERTED — react-native-sound-player → expo-av
import { Audio } from 'expo-av';

let currentSound = null;

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
