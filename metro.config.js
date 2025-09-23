const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Add path alias for @/ imports
config.resolver.alias = {
  '@': './src',
};

module.exports = config;
