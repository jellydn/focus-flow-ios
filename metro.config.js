const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Optimization settings for better performance
config.resolver.alias = {
  '@': './src',
};

// Enable minification for production builds
config.transformer.minifierConfig = {
  mangle: {
    keep_fnames: true,
  },
  output: {
    ascii_only: true,
    quote_keys: true,
    wrap_iife: true,
  },
  sourceMap: {
    includeSources: false,
  },
  toplevel: false,
  warnings: false,
};

// Enable hermes for better performance
config.transformer.hermesCommand = 'hermes';

// Optimize bundle size
config.transformer.experimentalImportSupport = false;
config.transformer.inlineRequires = true;

// Cache configuration for faster builds
config.cacheStores = [
  {
    name: 'filesystem',
    type: 'FileStore',
    root: require('path').join(__dirname, '.metro-cache'),
  },
];

// Asset optimization
config.transformer.assetRegistryPath = 'react-native/Libraries/Image/AssetRegistry';
config.transformer.allowOptionalDependencies = true;

// Performance settings
config.resolver.platforms = ['ios', 'android', 'native', 'web'];
config.resolver.sourceExts = ['js', 'json', 'ts', 'tsx', 'jsx'];
config.resolver.assetExts = ['png', 'jpg', 'jpeg', 'gif', 'svg', 'mp3', 'wav', 'mp4', 'mov'];

// Watchman optimization
config.watchFolders = [
  require('path').resolve(__dirname, 'src'),
  require('path').resolve(__dirname, 'assets'),
];

// Production optimizations
if (process.env.NODE_ENV === 'production') {
  config.transformer.minifierPath = 'metro-minify-terser';
  config.transformer.minifierConfig = {
    ...config.transformer.minifierConfig,
    ecma: 8,
    keep_fnames: false,
    mangle: {
      keep_fnames: false,
    },
  };
}

module.exports = config;
