export interface Player {
  id: string;
  name: string;
  isHost: boolean;
  joinedAt: number | null;
  score: number;
  gamesWon: number;
  isReady: boolean;
}

export interface LoteriaCard {
  id: number;
  name: string;
  image: string;
}

export interface GameRoom {
  id: string;
  hostId: string;
  hostName: string;
  gameCode: string;
  status: 'waiting' | 'playing' | 'finished';
  players: Player[];
  currentCard: LoteriaCard | null;
  deck: LoteriaCard[];
  deckIndex: number;
  winner?: string;
  winningPattern?: string[];
  createdAt: number | null;
}

export interface GameState {
  roomId: string | null;
  gameCode: string | null;
  playerId: string | null;
  playerName: string | null;
  isHost: boolean;
  room: GameRoom | null;
  isLoading: boolean;
  error: string | null;
}

export type GameAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'JOIN_ROOM'; payload: { roomId: string; gameCode: string; playerId: string; playerName: string; isHost: boolean } }
  | { type: 'UPDATE_ROOM'; payload: GameRoom }
  | { type: 'SET_PLAYER_NAME'; payload: string }
  | { type: 'CLEAR_GAME' };
