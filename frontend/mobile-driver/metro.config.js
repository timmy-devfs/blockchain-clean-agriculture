const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const path = require("path");

const config = getDefaultConfig(__dirname);

// NativeWind v4 yêu cầu đường dẫn tuyệt đối thực (không phải file:// URL)
// path.resolve trả về "D:\...\global.css" — đúng trên mọi platform
const cssInput = path.resolve(__dirname, "./global.css");

module.exports = withNativeWind(config, { input: cssInput });