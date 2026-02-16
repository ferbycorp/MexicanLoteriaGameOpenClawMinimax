import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useGame } from '../context/GameContext';

type AppNavigation = {
  navigate: (screen: 'Home' | 'WaitingRoom' | 'Game') => void;
};

type HomeScreenProps = {
  navigation: AppNavigation;
};

export default function HomeScreen({ navigation }: HomeScreenProps) {
  const { state, createGame, joinGame, clearError } = useGame();
  const [playerName, setPlayerName] = useState('');
  const [gameCode, setGameCode] = useState('');

  const handleCreateGame = async () => {
    if (!playerName.trim()) {
      Alert.alert('Error', 'Please enter your name');
      return;
    }
    await createGame(playerName.trim());
  };

  const handleJoinGame = async () => {
    if (!playerName.trim()) {
      Alert.alert('Error', 'Please enter your name');
      return;
    }
    if (!gameCode.trim()) {
      Alert.alert('Error', 'Please enter a game code');
      return;
    }
    await joinGame(gameCode.trim().toUpperCase(), playerName.trim());
  };

  React.useEffect(() => {
    if (state.roomId && !state.error) {
      navigation.navigate('WaitingRoom');
    }
  }, [state.roomId, state.error, navigation]);

  React.useEffect(() => {
    if (state.error) {
      Alert.alert('Error', state.error);
      clearError();
    }
  }, [state.error]);

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <Text style={styles.title}>🎱 Mexican Lotería</Text>
        <Text style={styles.subtitle}>Multiplayer Bingo Game</Text>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Your Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your name"
            placeholderTextColor="#999"
            value={playerName}
            onChangeText={setPlayerName}
            maxLength={20}
          />
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.button, styles.createButton]} 
            onPress={handleCreateGame}
            disabled={state.isLoading}
          >
            <Text style={styles.buttonText}>Create Game</Text>
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Game Code</Text>
            <TextInput
              style={[styles.input, styles.codeInput]}
              placeholder="XXXXXX"
              placeholderTextColor="#999"
              value={gameCode}
              onChangeText={setGameCode}
              maxLength={6}
              autoCapitalize="characters"
            />
          </View>

          <TouchableOpacity 
            style={[styles.button, styles.joinButton]} 
            onPress={handleJoinGame}
            disabled={state.isLoading}
          >
            <Text style={styles.buttonText}>Join Game</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.footer}>Up to 8 players • Real-time multiplayer</Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#888',
    textAlign: 'center',
    marginBottom: 40,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: '#aaa',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#16213e',
    borderRadius: 12,
    padding: 16,
    fontSize: 18,
    color: '#fff',
    borderWidth: 2,
    borderColor: '#0f3460',
  },
  codeInput: {
    textAlign: 'center',
    letterSpacing: 8,
    fontSize: 24,
    fontWeight: 'bold',
  },
  buttonContainer: {
    marginTop: 20,
  },
  button: {
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
  },
  createButton: {
    backgroundColor: '#e94560',
  },
  joinButton: {
    backgroundColor: '#0f3460',
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#333',
  },
  dividerText: {
    color: '#666',
    paddingHorizontal: 16,
  },
  footer: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 40,
  },
});
