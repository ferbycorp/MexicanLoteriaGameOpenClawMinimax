import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, Share, FlatList } from 'react-native';
import { useGame } from '../context/GameContext';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Player } from '../types';

type RootStackParamList = {
  Home: undefined;
  WaitingRoom: undefined;
  Game: undefined;
};

type WaitingRoomScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'WaitingRoom'>;
};

export default function WaitingRoomScreen({ navigation }: WaitingRoomScreenProps) {
  const { state, startGame, toggleReady, leaveGame } = useGame();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (state.room?.status === 'playing') {
      navigation.navigate('Game');
    }
  }, [state.room?.status]);

  const handleStartGame = async () => {
    const allReady = state.room?.players.every(p => p.isReady) && state.room?.players.length >= 2;
    if (!allReady) {
      Alert.alert('Not Ready', 'All players must be ready to start. Minimum 2 players required.');
      return;
    }
    await startGame();
  };

  const handleToggleReady = async () => {
    await toggleReady();
  };

  const handleLeave = () => {
    Alert.alert(
      'Leave Game',
      'Are you sure you want to leave?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Leave', 
          style: 'destructive',
          onPress: async () => {
            await leaveGame();
            navigation.navigate('Home');
          }
        },
      ]
    );
  };

  const handleShareCode = async () => {
    try {
      await Share.share({
        message: `Join my Mexican Lotería game!\nGame Code: ${state.gameCode}\n\nOr use this link: loteria://join/${state.roomId}`,
      });
    } catch (error) {
      // Fallback: copy to clipboard
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const currentPlayer = state.room?.players.find(p => p.id === state.playerId);
  const allPlayersReady = state.room?.players.every(p => p.isReady) && (state.room?.players.length || 0) >= 2;

  const renderPlayer = ({ item, index }: { item: Player; index: number }) => (
    <View style={[styles.playerCard, item.isHost && styles.hostCard]}>
      <View style={styles.playerInfo}>
        <Text style={styles.playerName}>{item.name}</Text>
        {item.isHost && <Text style={styles.hostBadge}>HOST</Text>}
      </View>
      <View style={[styles.readyBadge, item.isReady ? styles.ready : styles.notReady]}>
        <Text style={styles.readyText}>{item.isReady ? '✓ Ready' : 'Waiting...'}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleLeave} style={styles.leaveButton}>
          <Text style={styles.leaveText}>← Leave</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Waiting Room</Text>
        <View style={{ width: 60 }} />
      </View>

      <View style={styles.codeContainer}>
        <Text style={styles.codeLabel}>Game Code</Text>
        <TouchableOpacity onPress={handleShareCode} style={styles.codeBox}>
          <Text style={styles.codeText}>{state.gameCode}</Text>
          <Text style={styles.shareHint}>{copied ? 'Copied!' : 'Tap to share'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.playersSection}>
        <Text style={styles.sectionTitle}>Players ({state.room?.players.length || 0}/8)</Text>
        <FlatList
          data={state.room?.players || []}
          renderItem={renderPlayer}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.playersList}
        />
      </View>

      <View style={styles.actions}>
        {state.isHost ? (
          <>
            <TouchableOpacity 
              style={[styles.startButton, !allPlayersReady && styles.disabledButton]}
              onPress={handleStartGame}
              disabled={!allPlayersReady}
            >
              <Text style={styles.startButtonText}>Start Game</Text>
            </TouchableOpacity>
            {!allPlayersReady && (
              <Text style={styles.hintText}>
                {state.room?.players.length || 0 < 2 
                  ? 'Need at least 2 players' 
                  : 'All players must be ready'}
              </Text>
            )}
          </>
        ) : (
          <TouchableOpacity 
            style={[styles.readyButton, currentPlayer?.isReady && styles.readyButtonActive]}
            onPress={handleToggleReady}
          >
            <Text style={styles.readyButtonText}>
              {currentPlayer?.isReady ? 'Cancel Ready' : "I'm Ready!"}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  leaveButton: {
    padding: 10,
  },
  leaveText: {
    color: '#e94560',
    fontSize: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  codeContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  codeLabel: {
    color: '#888',
    fontSize: 14,
    marginBottom: 8,
  },
  codeBox: {
    backgroundColor: '#16213e',
    paddingHorizontal: 40,
    paddingVertical: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e94560',
  },
  codeText: {
    color: '#fff',
    fontSize: 36,
    fontWeight: 'bold',
    letterSpacing: 8,
    textAlign: 'center',
  },
  shareHint: {
    color: '#666',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
  },
  playersSection: {
    flex: 1,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    color: '#aaa',
    fontSize: 16,
    marginBottom: 12,
  },
  playersList: {
    paddingVertical: 8,
  },
  playerCard: {
    backgroundColor: '#16213e',
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    minWidth: 140,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  hostCard: {
    borderWidth: 1,
    borderColor: '#e94560',
  },
  playerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  playerName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  hostBadge: {
    backgroundColor: '#e94560',
    color: '#fff',
    fontSize: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  readyBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  ready: {
    backgroundColor: '#2ecc71',
  },
  notReady: {
    backgroundColor: '#666',
  },
  readyText: {
    color: '#fff',
    fontSize: 12,
  },
  actions: {
    padding: 20,
    paddingBottom: 40,
  },
  startButton: {
    backgroundColor: '#2ecc71',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#333',
  },
  startButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  readyButton: {
    backgroundColor: '#e94560',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
  },
  readyButtonActive: {
    backgroundColor: '#2ecc71',
  },
  readyButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  hintText: {
    color: '#666',
    textAlign: 'center',
    marginTop: 12,
  },
});
