const fs = require('fs');
const path = require('path');

const pkgPath = path.join(__dirname, 'package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

pkg.dependencies = {
  ...pkg.dependencies,
  "expo": "~54.0.0",
  "react": "18.3.1",
  "react-dom": "18.3.1",
  "react-native": "0.76.0",
  "@expo/metro-runtime": "~4.0.0",
  "expo-router": "~4.0.0",
  "react-native-reanimated": "~3.16.0",
  "react-native-web": "~0.19.13"
};

// Remove exact bindings mapped to 55 from previous script lock
delete pkg.dependencies["react-native-worklets-core"];
delete pkg.dependencies["react-native-worklets"];

fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
console.log('package.json pinned to SDK 54');
