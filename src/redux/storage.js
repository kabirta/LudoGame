// ✅ EXPO CONVERTED — react-native-mmkv → @react-native-async-storage/async-storage
import AsyncStorage from '@react-native-async-storage/async-storage';

const reduxStorage = {
  setItem: (key, value) => AsyncStorage.setItem(key, value),
  getItem: (key) => AsyncStorage.getItem(key),
  removeItem: (key) => AsyncStorage.removeItem(key),
};

export default reduxStorage;
