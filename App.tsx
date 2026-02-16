import React, { useMemo, useState } from 'react';
import { GameProvider } from './src/context/GameContext';
import HomeScreen from './src/screens/HomeScreen';
import WaitingRoomScreen from './src/screens/WaitingRoomScreen';
import GameScreen from './src/screens/GameScreen';

type ScreenName = 'Home' | 'WaitingRoom' | 'Game';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenName>('Home');

  const navigation = useMemo(
    () => ({
      navigate: (screen: ScreenName) => setCurrentScreen(screen),
    }),
    []
  );

  const renderScreen = () => {
    if (currentScreen === 'WaitingRoom') {
      return <WaitingRoomScreen navigation={navigation} />;
    }

    if (currentScreen === 'Game') {
      return <GameScreen navigation={navigation} />;
    }

    return <HomeScreen navigation={navigation} />;
  };

  return (
    <GameProvider>
      {renderScreen()}
    </GameProvider>
  );
}
