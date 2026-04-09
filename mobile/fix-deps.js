const fs = require('fs');
const path = require('path');

const pkgPath = path.join(__dirname, 'package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

const updates = {
  "@expo/metro-runtime": "~55.0.7",
  "@expo/vector-icons": "^15.0.2",
  "@react-native-async-storage/async-storage": "2.2.0",
  "expo": "^55.0.9",
  "expo-camera": "~55.0.11",
  "expo-constants": "~55.0.9",
  "expo-file-system": "~55.0.12",
  "expo-font": "~55.0.4",
  "expo-image-picker": "~55.0.14",
  "expo-linear-gradient": "~55.0.9",
  "expo-linking": "~55.0.9",
  "expo-notifications": "~55.0.14",
  "expo-router": "~55.0.8",
  "expo-secure-store": "~55.0.9",
  "expo-splash-screen": "~55.0.13",
  "expo-status-bar": "~55.0.4",
  "lottie-react-native": "~7.3.4",
  "react": "19.2.0",
  "react-dom": "19.2.0",
  "react-native": "0.83.4",
  "react-native-gesture-handler": "~2.30.0",
  "react-native-reanimated": "4.2.1",
  "react-native-safe-area-context": "~5.6.2",
  "react-native-screens": "~4.23.0",
  "react-native-svg": "15.15.3",
  "react-native-web": "^0.21.0"
};

for (const [key, val] of Object.entries(updates)) {
  if (pkg.dependencies[key]) pkg.dependencies[key] = val;
}

if (pkg.devDependencies['@types/react']) {
  pkg.devDependencies['@types/react'] = '~19.2.10';
}
if (pkg.devDependencies['typescript']) {
  pkg.devDependencies['typescript'] = '^5.4.0';
}

fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
console.log('package.json updated');
