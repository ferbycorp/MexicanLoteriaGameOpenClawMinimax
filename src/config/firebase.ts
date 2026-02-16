import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, get, onValue, push, update, remove, serverTimestamp } from 'firebase/database';
import { generateDeck } from '../data/loteriaCards';

const defaultDatabaseURL = 'https://mexicanloteriagame-default-rtdb.firebaseio.com';

const normalizeDatabaseURL = (value?: string) => {
  if (!value) return defaultDatabaseURL;

  const trimmedValue = value.trim().replace(/\/$/, '');
  const consoleUrlMatch = trimmedValue.match(/\/database\/([^/]+)\/data/i);

  if (consoleUrlMatch?.[1]) {
    return `https://${consoleUrlMatch[1]}.firebaseio.com`;
  }

  return trimmedValue;
};

const configuredDatabaseURL = normalizeDatabaseURL(process.env.EXPO_PUBLIC_FIREBASE_DATABASE_URL);

if (!process.env.EXPO_PUBLIC_FIREBASE_DATABASE_URL) {
  console.warn(
    'Using fallback Firebase Realtime Database URL. Set EXPO_PUBLIC_FIREBASE_DATABASE_URL in your .env to match your Firebase console value.'
  );
}

const firebaseConfig = {
  apiKey: "AIzaSyA4lcOlm2XLdCzWsr2dsFCHdrNEtmDz61Y",
  authDomain: "mexicanloteriagame.firebaseapp.com",
  databaseURL: configuredDatabaseURL,
  projectId: "mexicanloteriagame",
  storageBucket: "mexicanloteriagame.firebasestorage.app",
  messagingSenderId: "47247817706",
  appId: "1:47247817706:android:ed4b2b4d23b616f9ae1093"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

export const createGameRoom = async (hostName: string, hostId: string) => {
  const roomsRef = ref(db, 'rooms');
  const newRoom = push(roomsRef);
  
  const roomData = {
    id: newRoom.key,
    hostId,
    hostName,
    gameCode: generateGameCode(),
    status: 'waiting',
    players: [{
      id: hostId,
      name: hostName,
      isHost: true,
      joinedAt: serverTimestamp(),
      score: 0,
      gamesWon: 0,
      isReady: true
    }],
    currentCard: null,
    deck: [],
    deckIndex: 0,
    drawIntervalMs: 3000,
    createdAt: serverTimestamp()
  };
  
  await set(newRoom, roomData);
  return { roomId: newRoom.key, gameCode: roomData.gameCode };
};

export const joinGameRoom = async (gameCode: string, playerName: string, playerId: string) => {
  const roomsRef = ref(db, 'rooms');
  const snapshot = await get(roomsRef);
  
  let roomId = null;
  snapshot.forEach((child) => {
    const room = child.val();
    if (room.gameCode === gameCode && room.status === 'waiting') {
      roomId = child.key;
    }
  });
  
  if (!roomId) {
    throw new Error('Game not found or already started');
  }
  
  const roomRef = ref(db, `rooms/${roomId}/players`);
  const playersSnapshot = await get(roomRef);
  const players = playersSnapshot.val() || [];
  
  if (players.length >= 8) {
    throw new Error('Room is full (max 8 players)');
  }
  
  const newPlayer = {
    id: playerId,
    name: playerName,
    isHost: false,
    joinedAt: serverTimestamp(),
    score: 0,
    gamesWon: 0,
    isReady: false
  };
  
  await update(roomRef, {
    [players.length]: newPlayer
  });
  
  return roomId;
};

export const getRoomById = async (roomId: string) => {
  const roomRef = ref(db, `rooms/${roomId}`);
  const snapshot = await get(roomRef);
  return snapshot.val();
};

export const joinRoomById = async (roomId: string, playerName: string, playerId: string) => {
  const roomRef = ref(db, `rooms/${roomId}`);
  const roomSnapshot = await get(roomRef);
  const room = roomSnapshot.val();

  if (!room || room.status !== 'waiting') {
    throw new Error('Game not found or already started');
  }

  const players = room.players || [];

  if (players.length >= 8) {
    throw new Error('Room is full (max 8 players)');
  }

  const newPlayer = {
    id: playerId,
    name: playerName,
    isHost: false,
    joinedAt: serverTimestamp(),
    score: 0,
    gamesWon: 0,
    isReady: false
  };

  await update(ref(db, `rooms/${roomId}/players`), {
    [players.length]: newPlayer
  });

  return room;
};

export const subscribeToRoom = (roomId: string, callback: (room: any) => void) => {
  const roomRef = ref(db, `rooms/${roomId}`);
  return onValue(roomRef, (snapshot) => {
    callback(snapshot.val());
  });
};

export const updatePlayerReady = async (roomId: string, playerId: string, isReady: boolean) => {
  const playersRef = ref(db, `rooms/${roomId}/players`);
  const snapshot = await get(playersRef);
  const players = snapshot.val() || [];
  
  const updatedPlayers = players.map((p: any) => 
    p.id === playerId ? { ...p, isReady } : p
  );
  
  await set(playersRef, updatedPlayers);
};

export const updateDrawInterval = async (roomId: string, intervalMs: number) => {
  const safeIntervalMs = Math.min(10000, Math.max(1000, Math.floor(intervalMs)));
  await update(ref(db, `rooms/${roomId}`), { drawIntervalMs: safeIntervalMs });
};

export const startGame = async (roomId: string) => {
  const roomRef = ref(db, 'rooms/' + roomId);
  const snapshot = await get(roomRef);
  const room = snapshot.val();
  
  const generatedDeck = generateDeck();
  const uniqueDeck = generatedDeck.filter((card, index, arr) => index === arr.findIndex((candidate) => candidate.id === card.id));

  await update(roomRef, {
    status: 'playing',
    deck: uniqueDeck,
    deckIndex: 0,
    drawIntervalMs: room.drawIntervalMs || 3000,
    currentCard: uniqueDeck[0] || null,
    winner: null,
    winningPattern: null,
    falseClaimedBy: null,
    disqualifiedPlayerIds: []
  });
};

export const drawNextCard = async (roomId: string) => {
  const roomRef = ref(db, 'rooms/' + roomId);
  const snapshot = await get(roomRef);
  const room = snapshot.val();
  
  const newIndex = room.deckIndex + 1;
  
  if (newIndex >= room.deck.length) {
    await update(roomRef, {
      status: 'finished',
      currentCard: null
    });
    return null;
  }
  
  await update(roomRef, {
    deckIndex: newIndex,
    currentCard: room.deck[newIndex]
  });
  
  return room.deck[newIndex];
};

export const claimBingo = async (roomId: string, playerId: string, pattern: number[]) => {
  const roomRef = ref(db, 'rooms/' + roomId);
  const snapshot = await get(roomRef);
  const room = snapshot.val();

  if (!room || room.status !== 'playing') return false;

  const players = room.players || [];
  const playerIndex = players.findIndex((p: any) => p.id === playerId);

  if (playerIndex === -1) return false;

  const disqualifiedPlayerIds: string[] = Array.isArray(room.disqualifiedPlayerIds)
    ? room.disqualifiedPlayerIds
    : [];

  if (disqualifiedPlayerIds.includes(playerId)) {
    return false;
  }

  const normalizedPattern = Array.isArray(pattern)
    ? [...new Set(pattern.map((cardId) => Number(cardId)).filter((cardId) => Number.isInteger(cardId)))]
    : [];

  if (normalizedPattern.length < 4) return false;

  const calledCards = new Set(
    (room.deck || []).slice(0, (room.deckIndex || 0) + 1).map((card: any) => card.id)
  );

  const hasOnlyCalledCards = normalizedPattern.every((cardId) => calledCards.has(cardId));
  if (!hasOnlyCalledCards) {
    const falseClaimer = players[playerIndex];
    const updatedDisqualifiedIds = [...new Set([...disqualifiedPlayerIds, playerId])];

    const activePlayers = players.filter((p: any) => !updatedDisqualifiedIds.includes(p.id));
    const onlyOnePlayerRemaining = activePlayers.length === 1;

    await update(roomRef, {
      disqualifiedPlayerIds: updatedDisqualifiedIds,
      falseClaimedBy: falseClaimer?.name || 'A player',
      status: onlyOnePlayerRemaining ? 'finished' : 'playing',
      winner: onlyOnePlayerRemaining ? activePlayers[0].name : null,
      winningPattern: null
    });

    return false;
  }

  await update(roomRef, {
    ['players/' + playerIndex + '/score']: (players[playerIndex].score || 0) + 1,
    ['players/' + playerIndex + '/gamesWon']: (players[playerIndex].gamesWon || 0) + 1,
    status: 'finished',
    falseClaimedBy: null,
    winner: players[playerIndex].name,
    winningPattern: normalizedPattern
  });

  return true;
};

export const leaveRoom = async (roomId: string, playerId: string) => {
  const roomRef = ref(db, 'rooms/' + roomId);
  const snapshot = await get(roomRef);
  const room = snapshot.val();
  
  if (!room) return;
  
  const players = room.players || [];
  const remainingPlayers = players.filter((p: any) => p.id !== playerId);
  
  if (remainingPlayers.length === 0 || room.hostId === playerId) {
    await remove(roomRef);
  } else {
    await set(ref(db, 'rooms/' + roomId + '/players'), remainingPlayers);
  }
};

const generateGameCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

export { db as database };
export default app;
