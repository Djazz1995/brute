module.exports = function (api) {
  api.cache(true);

  return {
    presets: [['babel-preset-expo'], 'nativewind/babel'],

    // `@/*` path aliases resolve via Metro's tsconfig `paths` support (see tsconfig.json),
    // so no babel module-resolver is needed. worklets plugin is required by reanimated v4.
    plugins: ['react-native-worklets/plugin'],
  };
};
