import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, Dimensions, AccessibilityInfo, Platform, Image } from 'react-native';
import { useGame } from '../context/GameContext';
import { LoteriaCard } from '../types';

type AppNavigation = {
  navigate: (screen: 'Home' | 'WaitingRoom' | 'Game') => void;
};

type GameScreenProps = {
  navigation: AppNavigation;
};

const CARD_SIZE = Math.floor((Dimensions.get('window').width - 48 - 16) / 4);

export default function GameScreen({ navigation }: GameScreenProps) {
  const { state, drawCard, claimBingo, leaveGame } = useGame();
  const [myBoard, setMyBoard] = useState<number[]>([]);
  const [selectedCards, setSelectedCards] = useState<Set<number>>(new Set());

  // Initialize board with 16 random cards
  useEffect(() => {
    if (!state.room?.deck || myBoard.length > 0) return;
    
    const shuffled = [...state.room.deck].sort(() => Math.random() - 0.5);
    const boardCards = shuffled.slice(0, 16).map(c => c.id);
    setMyBoard(boardCards);
  }, [state.room?.deck]);

  useEffect(() => {
    if (state.room?.status === 'finished') {
      const gameOverMessage = state.room.falseClaimedBy
        ? state.room.winner
          ? `${state.room.falseClaimedBy} made a false Lotería claim and was disqualified. ${state.room.winner} wins!`
          : `${state.room.falseClaimedBy} made a false Lotería claim and was disqualified.`
        : `${state.room.winner || 'Someone'} won!`;

      Alert.alert(
        'Game Over!',
        gameOverMessage,
        [{ text: 'OK', onPress: () => navigation.navigate('WaitingRoom') }]
      );
    }
  }, [state.room?.status]);

  useEffect(() => {
    const currentCard = state.room?.currentCard;
    if (!currentCard || state.room?.status !== 'playing') return;

    const announcement = `Carta: ${currentCard.name}`;

    if (Platform.OS === 'web' && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(announcement);
      utterance.lang = 'es-MX';
      utterance.rate = 0.95;
      utterance.pitch = 1;

      // Some browsers delay voice loading; default voice still speaks if none is selected.
      const preferredVoice = window.speechSynthesis
        .getVoices()
        .find((voice) => voice.lang.startsWith('es'));

      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    }

    void AccessibilityInfo.announceForAccessibility(announcement);
  }, [state.room?.currentCard?.id, state.room?.status]);

  useEffect(() => {
    if (!state.isHost || !state.room || state.room.status !== 'playing') return;

    const intervalMs = state.room.drawIntervalMs || 3000;
    const timer = setInterval(() => {
      void drawCard();
    }, intervalMs);

    return () => clearInterval(timer);
  }, [state.isHost, state.room?.status, state.room?.drawIntervalMs, drawCard]);


  const handleCardPress = (cardId: number) => {
    const newSelected = new Set(selectedCards);
    if (newSelected.has(cardId)) {
      newSelected.delete(cardId);
    } else {
      newSelected.add(cardId);
    }
    setSelectedCards(newSelected);
  };

  const handleDrawCard = async () => {
    if (!state.isHost) return;
    await drawCard();
  };

  const checkWin = (): number[] => {
    const selected = Array.from(selectedCards);
    const board = myBoard;
    
    // Check rows
    for (let r = 0; r < 4; r++) {
      const row = [0,1,2,3].map(c => board[r * 4 + c]);
      if (row.every(cardId => selected.includes(cardId))) {
        return row;
      }
    }
    
    // Check columns
    for (let c = 0; c < 4; c++) {
      const col = [0,1,2,3].map(r => board[r * 4 + c]);
      if (col.every(cardId => selected.includes(cardId))) {
        return col;
      }
    }
    
    // Check diagonals
    const d1 = [0, 5, 10, 15].map(i => board[i]);
    const d2 = [3, 6, 9, 12].map(i => board[i]);
    if (d1.every(cardId => selected.includes(cardId))) {
      return d1;
    }
    if (d2.every(cardId => selected.includes(cardId))) {
      return d2;
    }
    
    return [];
  };

  const handleClaimBingo = () => {
    const winningPattern = checkWin();
    if (winningPattern.length === 0) {
      Alert.alert('No Win', "You don't have a winning pattern yet!");
      return;
    }
    
    Alert.alert(
      'Claim Bingo!',
      'Do you have 4 in a row?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Claim!', 
          onPress: () => claimBingo(winningPattern)
        },
      ]
    );
  };

  const handleLeave = () => {
    Alert.alert(
      'Leave Game',
      'Are you sure?',
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

  const getCardDetails = (cardId: number): LoteriaCard | undefined => {
    return state.room?.deck.find(c => c.id === cardId);
  };

  if (!state.room) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No game room found</Text>
      </View>
    );
  }

  const currentCard = state.room.currentCard;
  const isDisqualified = Boolean(state.playerId && state.room.disqualifiedPlayerIds?.includes(state.playerId));

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleLeave} style={styles.leaveButton}>
          <Text style={styles.leaveText}>← Exit</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Lotería</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* Current Card Display */}
      <View style={styles.currentCardContainer}>
        <Text style={styles.currentLabel}>Current Card • Every {(state.room.drawIntervalMs || 3000) / 1000}s</Text>
        {currentCard ? (
          <View style={styles.currentCard}>
            <Image source={{ uri: currentCard.image }} style={styles.currentImage} resizeMode="cover" />
            <Text style={styles.currentName}>{currentCard.name}</Text>
          </View>
        ) : (
          <View style={styles.currentCard}>
            <Text style={styles.currentName}>Game Over!</Text>
          </View>
        )}
      </View>

      {isDisqualified && (
        <View style={styles.disqualifiedBanner}>
          <Text style={styles.disqualifiedText}>You are disqualified for a false claim. You can watch, but cannot keep playing this round.</Text>
        </View>
      )}

      {/* Players Score */}
      <ScrollView horizontal style={styles.scoreboard} showsHorizontalScrollIndicator={false}>
        {state.room.players.map((player) => (
          <View key={player.id} style={[styles.scoreCard, player.id === state.playerId && styles.myScoreCard]}>
            <Text style={styles.scoreName} numberOfLines={1}>{player.name}</Text>
            <Text style={styles.scoreValue}>{player.score}</Text>
          </View>
        ))}
      </ScrollView>

      {/* Player Board */}
      <View style={styles.boardContainer}>
        <Text style={styles.boardTitle}>Your Board</Text>
        <View style={styles.board}>
          {myBoard.map((cardId) => {
            const card = getCardDetails(cardId);
            const isSelected = selectedCards.has(cardId);
            return (
              <TouchableOpacity
                key={cardId}
                style={[styles.card, isSelected && styles.cardSelected]}
                onPress={() => handleCardPress(cardId)}
                disabled={!currentCard || isDisqualified}
              >
                {card ? <Image source={{ uri: card.image }} style={styles.cardImage} resizeMode="cover" /> : null}
                <Text style={styles.cardName} numberOfLines={1}>{card?.name}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actions}>
        {state.isHost && currentCard && !isDisqualified && (
          <TouchableOpacity style={styles.drawButton} onPress={handleDrawCard}>
            <Text style={styles.drawButtonText}>Draw Next Card Now</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity 
          style={[styles.bingoButton, (selectedCards.size < 4 || isDisqualified) && styles.bingoButtonDisabled]}
          onPress={handleClaimBingo}
          disabled={selectedCards.size < 4 || isDisqualified}
        >
          <Text style={styles.bingoButtonText}>BINGO!</Text>
        </TouchableOpacity>
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
    paddingBottom: 10,
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
  currentCardContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  currentLabel: {
    color: '#888',
    fontSize: 14,
    marginBottom: 8,
  },
  currentCard: {
    backgroundColor: '#16213e',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#e94560',
    minWidth: 140,
  },
  currentImage: {
    width: 120,
    height: 180,
    borderRadius: 8,
  },
  currentName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 8,
    textAlign: 'center',
  },
  disqualifiedBanner: {
    marginHorizontal: 20,
    marginBottom: 10,
    backgroundColor: '#5c1f27',
    borderWidth: 1,
    borderColor: '#e94560',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  disqualifiedText: {
    color: '#ffd9de',
    fontSize: 12,
    textAlign: 'center',
  },
  scoreboard: {
    maxHeight: 70,
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  scoreCard: {
    backgroundColor: '#16213e',
    borderRadius: 8,
    padding: 10,
    marginRight: 10,
    minWidth: 80,
    alignItems: 'center',
  },
  myScoreCard: {
    borderWidth: 2,
    borderColor: '#e94560',
  },
  scoreName: {
    color: '#aaa',
    fontSize: 12,
    marginBottom: 4,
  },
  scoreValue: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  boardContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  boardTitle: {
    color: '#aaa',
    fontSize: 14,
    marginBottom: 8,
  },
  board: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    width: CARD_SIZE,
    height: CARD_SIZE,
    backgroundColor: '#16213e',
    borderRadius: 8,
    marginBottom: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#0f3460',
  },
  cardSelected: {
    backgroundColor: '#e94560',
    borderColor: '#e94560',
  },
  cardImage: {
    width: CARD_SIZE - 16,
    height: CARD_SIZE - 34,
    borderRadius: 6,
  },
  cardName: {
    color: '#fff',
    fontSize: 8,
    marginTop: 2,
    textAlign: 'center',
  },
  actions: {
    padding: 20,
    paddingBottom: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  drawButton: {
    flex: 1,
    backgroundColor: '#0f3460',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginRight: 10,
  },
  drawButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  bingoButton: {
    backgroundColor: '#2ecc71',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    minWidth: 120,
  },
  bingoButtonDisabled: {
    backgroundColor: '#333',
  },
  bingoButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  errorText: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
    marginTop: 100,
  },
});
