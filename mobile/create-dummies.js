const fs = require('fs');
const path = require('path');

// 1x1 transparent PNG base64
const dummyPng = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64');
// Minimal valid WAV file
const dummyWav = Buffer.from('UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=', 'base64');

const imagesDir = path.join(__dirname, 'assets', 'images');
const soundsDir = path.join(__dirname, 'assets', 'sounds');

if (!fs.existsSync(imagesDir)) fs.mkdirSync(imagesDir, { recursive: true });
if (!fs.existsSync(soundsDir)) fs.mkdirSync(soundsDir, { recursive: true });

const images = ['icon.png', 'splash.png', 'adaptive-icon.png', 'favicon.png', 'notification-icon.png'];

for (const img of images) {
  fs.writeFileSync(path.join(imagesDir, img), dummyPng);
}

fs.writeFileSync(path.join(soundsDir, 'notification.wav'), dummyWav);

console.log('Dummy assets created successfully.');
