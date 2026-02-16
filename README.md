# 🎱 Mexican Lotería - Multiplayer Game

A real-time multiplayer Mexican Lotería (Bingo) game built with React Native (Expo) and Firebase.

## Features

- **Multiplayer:** Up to 8 players per game
- **Real-time:** Firebase Realtime Database for instant updates
- **Waiting Room:** Join with 6-digit code or shareable link
- **Cross-platform:** Works on Android and iOS
- **Game mechanics:**
  - 16-card boards (4×4 grid)
  - 96 traditional Lotería cards with emojis
  - Win patterns: Rows, columns, diagonals
  - Real-time score tracking
  - Host controls card drawing

## Tech Stack

- React Native (Expo)
- TypeScript
- Firebase Realtime Database
- React Navigation
- Jest (unit tests)

## Setup

1. **Clone the repo:**
   ```bash
   git clone https://github.com/ferbycorp/MexicanLoteriaGameOpenClawMiniMax.git
   cd MexicanLoteriaGameOpenClawMiniMax
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Firebase config:**
   - Firebase client credentials are configured in `src/config/firebase.ts`
   - Set your realtime database URL in a local `.env` file (recommended):

   ```bash
   EXPO_PUBLIC_FIREBASE_DATABASE_URL=https://<your-instance>.firebasedatabase.app
   ```

   > You can also use the `*.firebaseio.com` domain if that is what your Firebase console shows.

   > Do not paste the full Console URL (`https://console.firebase.google.com/.../database/<instance>/data`). Use only the database instance URL, e.g. `https://<instance>.firebaseio.com`.

4. **Run the app:**
   ```bash
   # Start Expo dev server
   npm start

   # Run on Android
   npm run android

   # Run on iOS (Mac only)
   npm run ios
   ```

## Testing

Run unit tests:
```bash
npm test
```

## Build

Build Android APK:
```bash
npm run build:android
```

Or use EAS Build for production:
```bash
npx eas build --platform android
```

## How to Play

1. **Create a game:** Enter your name and tap "Create Game"
2. **Share the code:** Give the 6-digit code to friends
3. **Wait for players:** Minimum 2 players, max 8
4. **Start the game:** Host starts when all players are ready
5. **Play:** Mark cards on your board as they're drawn
6. **Win:** Get 4 in a row (horizontal, vertical, or diagonal) and claim BINGO!

## Project Structure

```
MexicanLoteriaGame/
├── src/
│   ├── config/
│   │   └── firebase.ts          # Firebase setup
│   ├── types/
│   │   └── index.ts              # TypeScript types
│   ├── context/
│   │   └── GameContext.tsx       # Game state management
│   ├── screens/
│   │   ├── HomeScreen.tsx        # Main menu
│   │   ├── WaitingRoomScreen.tsx # Lobby
│   │   └── GameScreen.tsx        # Game board
│   └── __tests__/
│       └── game.test.ts          # Unit tests
├── App.tsx                       # Root component
├── package.json
└── README.md
```

## Firebase Rules

Set these rules in Firebase Realtime Database:

```json
{
  "rules": {
    "rooms": {
      ".read": true,
      ".write": true,
      "$roomId": {
        ".indexOn": ["gameCode", "status"]
      }
    }
  }
}
```

## License

MIT

## Credits

Built by OpenClaw AI assistant for ferbycorp
