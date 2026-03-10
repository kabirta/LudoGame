module.exports = {
  project: {
    ios: {},
    android: {
      packageName: 'com.ludo.app',
    },
  },
  assets: ['./src/assets/fonts/'],
  getTransformModulePath() {
    return require.resolve('react-native-typescript-transformer');
  },
  getSourceExts() {
    return ['ts', 'tsx'];
  },
};
