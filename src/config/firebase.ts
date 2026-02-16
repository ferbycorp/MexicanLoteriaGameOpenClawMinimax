import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, get, onValue, push, update, remove, serverTimestamp } from 'firebase/database';

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
  
  const deck = generateDeck();
  
  await update(roomRef, {
    status: 'playing',
    deck,
    deckIndex: 0,
    drawIntervalMs: room.drawIntervalMs || 3000,
    currentCard: deck[0]
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

  const normalizedPattern = Array.isArray(pattern)
    ? [...new Set(pattern.map((cardId) => Number(cardId)).filter((cardId) => Number.isInteger(cardId)))]
    : [];

  if (normalizedPattern.length < 4) return false;

  const calledCards = new Set(
    (room.deck || []).slice(0, (room.deckIndex || 0) + 1).map((card: any) => card.id)
  );

  const hasOnlyCalledCards = normalizedPattern.every((cardId) => calledCards.has(cardId));
  if (!hasOnlyCalledCards) {
    return false;
  }

  await update(roomRef, {
    ['players/' + playerIndex + '/score']: (players[playerIndex].score || 0) + 1,
    ['players/' + playerIndex + '/gamesWon']: (players[playerIndex].gamesWon || 0) + 1,
    status: 'finished',
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

const generateDeck = () => {
  const traditionalCards = [
    { id: 1, name: 'El Gallo', image: '🐓' },
    { id: 2, name: 'El Diablito', image: '👹' },
    { id: 3, name: 'La Dama', image: '👸' },
    { id: 4, name: 'El Catrín', image: '🎩' },
    { id: 5, name: 'El Paraguas', image: '☂️' },
    { id: 6, name: 'La Sirena', image: '🧜‍♀️' },
    { id: 7, name: 'La Escalera', image: '🪜' },
    { id: 8, name: 'La Botella', image: '🍾' },
    { id: 9, name: 'El Barril', image: '🛢️' },
    { id: 10, name: 'El Árbol', image: '🌳' },
    { id: 11, name: 'El Alacrán', image: '🦂' },
    { id: 12, name: 'El Rose', image: '🌹' },
    { id: 13, name: 'La Muerte', image: '💀' },
    { id: 14, name: 'El Pato', image: '🦆' },
    { id: 15, name: 'El Sol', image: '☀️' },
    { id: 16, name: 'La Luna', image: '🌙' },
    { id: 17, name: 'El Chuncho', image: '🦉' },
    { id: 18, name: 'El Corazón', image: '❤️' },
    { id: 19, name: 'La Sandía', image: '🍉' },
    { id: 20, name: 'El Rifle', image: '🔫' },
    { id: 21, name: 'El Carabel', image: '🪺' },
    { id: 22, name: 'El Gorrito', image: '🧢' },
    { id: 23, name: 'La Mula', image: '🫏' },
    { id: 24, name: 'El Borracho', image: '😵' },
    { id: 25, name: 'El Negrito', image: '🥿' },
    { id: 26, name: 'La Piñata', image: '🎊' },
    { id: 27, name: 'El Tambor', image: '🥁' },
    { id: 28, name: 'El Camaron', image: '🦐' },
    { id: 29, name: 'Las Ranas', image: '🐸' },
    { id: 30, name: 'El Smiley', image: '😺' },
    { id: 31, name: 'La Luna', image: '🌝' },
    { id: 32, name: 'El Cotorro', image: '🦜' },
    { id: 33, name: 'La Casa', image: '🏠' },
    { id: 34, name: 'El Arcoiris', image: '🌈' },
    { id: 35, name: 'El Chaleco', image: '🦺' },
    { id: 36, name: 'La Palmera', image: '🌴' },
    { id: 37, name: 'El Mundo', image: '🌍' },
    { id: 38, name: 'El Venado', image: '🦌' },
    { id: 39, name: 'El Star', image: '⭐' },
    { id: 40, name: 'El Fleur', image: '⚜️' },
    { id: 41, name: 'El Alhelí', image: '🌸' },
    { id: 42, name: 'La Corona', image: '👑' },
    { id: 43, name: 'La Calavera', image: '💀' },
    { id: 44, name: 'El Campanario', image: '🔔' },
    { id: 45, name: 'El Quirquincho', image: '🦔' },
    { id: 46, name: 'La Estrella', image: '🌟' },
    { id: 47, name: 'El Cazo', image: '🥄' },
    { id: 48, name: 'El Gordo', image: '🧔' },
    { id: 49, name: 'La Gra', image: '🍇' },
    { id: 50, name: 'El Helado', image: '🍦' },
    { id: 51, name: 'La Seda', image: '🧣' },
    { id: 52, name: 'El Octavio', image: '🐙' },
    { id: 53, name: 'El Fauno', image: '🧝' },
    { id: 54, name: 'La Red', image: '🕸️' },
    { id: 55, name: 'El Pulpo', image: '🐙' },
    { id: 56, name: 'El Seneca', image: '📜' },
    { id: 57, name: 'La Maceta', image: '🪴' },
    { id: 58, name: 'El Arbol', image: '🌲' },
    { id: 59, name: 'El Ernesto', image: '📓' },
    { id: 60, name: 'La Carta', image: '✉️' },
    { id: 61, name: 'El Soldado', image: '💂' },
    { id: 62, name: 'El Corazon', image: '💜' },
    { id: 63, name: 'La Manzana', image: '🍎' },
    { id: 64, name: 'El Chocolate', image: '🍫' },
    { id: 65, name: 'El Tereo', image: '🐦' },
    { id: 66, name: 'La Palma', image: '🌿' },
    { id: 67, name: 'El Gallo', image: '🐣' },
    { id: 68, name: 'La Piedra', image: '🪨' },
    { id: 69, name: 'El Coyote', image: '🐺' },
    { id: 70, name: 'La Calaca', image: '☠️' },
    { id: 71, name: 'El Jimenez', image: '📖' },
    { id: 72, name: 'La Fruta', image: '🍒' },
    { id: 73, name: 'El Capote', image: '🧥' },
    { id: 74, name: 'La Araña', image: '🕷️' },
    { id: 75, name: 'El Saladito', image: '🧂' },
    { id: 76, name: 'El Beso', image: '💋' },
    { id: 77, name: 'La Cabeza', image: '👤' },
    { id: 78, name: 'La Llama', image: '🦙' },
    { id: 79, name: 'El Naipe', image: '🃏' },
    { id: 80, name: 'El Muslo', image: '🍗' },
    { id: 81, name: 'La Uña', image: '💅' },
    { id: 82, name: 'El Higo', image: '🍈' },
    { id: 83, name: 'La Rana', image: '🐊' },
    { id: 84, name: 'El Stinko', image: '💩' },
    { id: 85, name: 'El Dave', image: '👱' },
    { id: 86, name: 'La Rana', image: '🐢' },
    { id: 87, name: 'El Violin', image: '🎻' },
    { id: 88, name: 'El Mula', image: '🦓' },
    { id: 89, name: 'La Bota', image: '👢' },
    { id: 90, name: 'El Gato', image: '🐱' },
    { id: 91, name: 'La Vanda', image: '🌺' },
    { id: 92, name: 'El Sombrero', image: '🎩' },
    { id: 93, name: 'La Corbata', image: '👔' },
    { id: 94, name: 'El Clavel', image: '🌷' },
    { id: 95, name: 'La Butter', image: '🧈' },
    { id: 96, name: 'El Camion', image: '🚚' }
  ];
  
  const shuffled = [...traditionalCards];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  
  return shuffled;
};

export { db as database };
export default app;
