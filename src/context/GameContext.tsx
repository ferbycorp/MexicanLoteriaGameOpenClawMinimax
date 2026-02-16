import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { GameState, GameAction, GameRoom } from '../types';
import * as firebase from '../config/firebase';


const createPlayerId = () => {
  const randomSegment = Math.random().toString(36).slice(2, 10);
  return `player-${Date.now()}-${randomSegment}`;
};

const initialState: GameState = {
  roomId: null,
  gameCode: null,
  playerId: null,
  playerName: null,
  isHost: false,
  room: null,
  isLoading: false,
  error: null,
};

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    case 'JOIN_ROOM':
      return {
        ...state,
        roomId: action.payload.roomId,
        gameCode: action.payload.gameCode,
        playerId: action.payload.playerId,
        playerName: action.payload.playerName,
        isHost: action.payload.isHost,
        isLoading: false,
        error: null,
      };
    case 'UPDATE_ROOM':
      return { ...state, room: action.payload };
    case 'SET_PLAYER_NAME':
      return { ...state, playerName: action.payload };
    case 'CLEAR_GAME':
      return initialState;
    default:
      return state;
  }
}

interface GameContextType {
  state: GameState;
  createGame: (hostName: string) => Promise<void>;
  joinGame: (gameCode: string, playerName: string) => Promise<void>;
  joinByLink: (roomId: string, playerName: string) => Promise<void>;
  startGame: () => Promise<void>;
  drawCard: () => Promise<void>;
  updateDrawInterval: (intervalMs: number) => Promise<void>;
  toggleReady: () => Promise<void>;
  claimBingo: (pattern: number[]) => Promise<void>;
  leaveGame: () => Promise<void>;
  clearError: () => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  // Generate or retrieve player ID
  useEffect(() => {
    let playerId = state.playerId;
    if (!playerId) {
      playerId = createPlayerId();
      dispatch({ type: 'JOIN_ROOM', payload: { 
        roomId: '', gameCode: '', playerId, playerName: '', isHost: false 
      }});
    }
  }, []);

  // Subscribe to room updates when joined
  useEffect(() => {
    if (!state.roomId) return;

    const unsubscribe = firebase.subscribeToRoom(state.roomId, (room: GameRoom) => {
      dispatch({ type: 'UPDATE_ROOM', payload: room });
    });

    return () => unsubscribe();
  }, [state.roomId]);

  const createGame = async (hostName: string) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const playerId = state.playerId || createPlayerId();
      const { roomId, gameCode } = await firebase.createGameRoom(hostName, playerId);
      dispatch({
        type: 'JOIN_ROOM',
        payload: { roomId, gameCode, playerId, playerName: hostName, isHost: true },
      });
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  };

  const joinGame = async (gameCode: string, playerName: string) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const playerId = state.playerId || createPlayerId();
      const roomId = await firebase.joinGameRoom(gameCode, playerName, playerId);
      dispatch({
        type: 'JOIN_ROOM',
        payload: { roomId, gameCode, playerId, playerName, isHost: false },
      });
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  };

  const joinByLink = async (roomId: string, playerName: string) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const playerId = state.playerId || createPlayerId();
      const room = await firebase.joinRoomById(roomId, playerName, playerId);
      const gameCode = room?.gameCode;

      dispatch({
        type: 'JOIN_ROOM',
        payload: { roomId, gameCode, playerId, playerName, isHost: false },
      });
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  };

  const startGame = async () => {
    if (!state.roomId || !state.isHost) return;
    try {
      await firebase.startGame(state.roomId);
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  };

  const drawCard = async () => {
    if (!state.roomId || !state.isHost) return;
    try {
      await firebase.drawNextCard(state.roomId);
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  };

  const toggleReady = async () => {
    if (!state.roomId || !state.playerId || !state.room) return;
    const currentPlayer = state.room.players.find(p => p.id === state.playerId);
    const newReadyState = !currentPlayer?.isReady;
    await firebase.updatePlayerReady(state.roomId, state.playerId, newReadyState);
  };

  const updateDrawInterval = async (intervalMs: number) => {
    if (!state.roomId || !state.isHost) return;
    try {
      await firebase.updateDrawInterval(state.roomId, intervalMs);
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  };

  const claimBingo = async (pattern: number[]) => {
    if (!state.roomId || !state.playerId) return;
    try {
      const isValidClaim = await firebase.claimBingo(state.roomId, state.playerId, pattern);
      if (!isValidClaim) {
        dispatch({ type: 'SET_ERROR', payload: 'False Lotería claim. The game is over and you lose this round.' });
      }
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  };

  const leaveGame = async () => {
    if (!state.roomId || !state.playerId) return;
    try {
      await firebase.leaveRoom(state.roomId, state.playerId);
      dispatch({ type: 'CLEAR_GAME' });
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  };

  const clearError = () => {
    dispatch({ type: 'SET_ERROR', payload: null });
  };

  return (
    <GameContext.Provider
      value={{
        state,
        createGame,
        joinGame,
        joinByLink,
        startGame,
        drawCard,
        updateDrawInterval,
        toggleReady,
        claimBingo,
        leaveGame,
        clearError,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}
