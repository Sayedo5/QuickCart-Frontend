module.exports = function (api) {
  api.cache(true);
  return {
    // babel-preset-expo already wires up the Reanimated/Worklets plugin, and
    // Expo's Metro config resolves the "@/*" alias from tsconfig.json paths.
    presets: ['babel-preset-expo'],
  };
};
