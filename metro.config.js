const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// SVG support via react-native-svg-transformer
const { transformer, resolver } = config;
config.transformer = {
  ...transformer,
  babelTransformerPath: require.resolve('react-native-svg-transformer'),
};
config.resolver = {
  ...resolver,
  assetExts: resolver.assetExts.filter(ext => ext !== 'svg'),
  blockList: [
    ...(Array.isArray(resolver.blockList) ? resolver.blockList : [resolver.blockList]),
    /[\/\\]\.expo-export[^\/\\]*(?:[\/\\].*)?$/,
  ],
  sourceExts: [...resolver.sourceExts, 'svg'],
};

module.exports = withNativeWind(config, { input: './global.css' });
