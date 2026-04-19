const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const path = require("path");

const config = getDefaultConfig(__dirname);

// NativeWind v4 requires absolute path
const cssInput = path.resolve(__dirname, "./global.css");

module.exports = withNativeWind(config, { input: cssInput });
