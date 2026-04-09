const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// Resolution is now handled via the patched package.json in node_modules
module.exports = withNativeWind(config, { input: "./global.css" });
