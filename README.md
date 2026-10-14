# ZenTents ⛺🌲

> A calm, meditative Tents and Trees forest grid logic puzzle game.

[![CI](https://github.com/OfferPk/zentents/actions/workflows/ci.yml/badge.svg)](https://github.com/OfferPk/zentents/actions/workflows/ci.yml)
[![Android](https://github.com/OfferPk/zentents/actions/workflows/android.yml/badge.svg)](https://github.com/OfferPk/zentents/actions/workflows/android.yml)
[![Pages](https://github.com/OfferPk/zentents/actions/workflows/pages.yml/badge.svg)](https://github.com/OfferPk/zentents/actions/workflows/pages.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg)](LICENSE)

Pitch cozy camping tents across a peaceful woodland grid. Each tree must have exactly one orthogonally adjacent tent, no two tents may touch horizontally, vertically, or diagonally, and each row and column has an exact tent quota.

---

## 🌲 Features

- 🏕️ **50 Solver-Verified Levels**: 5 progressive woodland packs ranging from gentle 5x5 clearings to expansive 9x9 wilderness grids.
- 🎵 **Procedural Woodland Acoustics**: Web Audio API synthesizer producing tactile wooden peg strikes, leaf rustles, windchimes, and campfire cascades.
- 📱 **Multi-Platform Zero-Network**: 100% offline Progressive Web App (PWA) with service worker offline caching and Capacitor 6 Android packaging.
- 🎨 **Deep Evergreen Glassmorphism**: High-contrast, serene forest aesthetic with glowing campfire accents and high-DPI scaling.
- 💡 **Smart Deduction Assistant**: Intelligent constraint propagation solver offering organic, non-spoiling hints based on quota satisfaction and tree pairing.
- 🔄 **Player-Friendly Quality of Life**: 3-state cell cycling (Empty ➔ Grass ➔ Tent ➔ Empty), drag-to-grass painting, unlimited undo, restart, level progress tracking, and ambient sound toggle.

---

## 🎮 Play Online

Play the live demo directly in any modern mobile or desktop browser:
👉 **[https://offerpk.github.io/zentents/](https://offerpk.github.io/zentents/)**

---

## 📦 Android APK Download

Download the signed debug Android APK from GitHub Actions Artifacts or the Releases page:
- **[Latest APK Artifact (GitHub Actions)](https://github.com/OfferPk/zentents/actions/workflows/android.yml)**

---

## 🛠️ Local Development & Build

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- npm

### Setup
```bash
git clone https://github.com/OfferPk/zentents.git
cd zentents
npm install
```

### Running Tests
Run the automated engine and puzzle solver test suite:
```bash
npm test
```

### Building Web Assets
Bundle the web runtime assets into `www/`:
```bash
npm run build
```

### Building for Android (Capacitor)
```bash
npx cap add android
npx cap sync android
cd android
./gradlew assembleDebug
```

---

## 📜 License

Distributed under the [MIT License](LICENSE). Copyright © 2026 OfferPk.
