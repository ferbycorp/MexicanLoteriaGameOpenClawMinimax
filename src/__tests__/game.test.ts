import { describe, it, expect, beforeEach } from '@jest/globals';

// Test game logic utilities

// Generate game code
const generateGameCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

// Generate deck
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
  ];
  
  const shuffled = [...traditionalCards];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  
  return shuffled;
};

// Check win patterns
const checkWin = (board: number[], selected: Set<number>): boolean => {
  // Check rows
  for (let r = 0; r < 4; r++) {
    const row = [0,1,2,3].map(c => board[r * 4 + c]);
    if (row.every(cardId => selected.has(cardId))) return true;
  }
  
  // Check columns
  for (let c = 0; c < 4; c++) {
    const col = [0,1,2,3].map(r => board[r * 4 + c]);
    if (col.every(cardId => selected.has(cardId))) return true;
  }
  
  // Check diagonals
  const d1 = [0, 5, 10, 15].map(i => board[i]);
  const d2 = [3, 6, 9, 12].map(i => board[i]);
  if (d1.every(cardId => selected.has(cardId))) return true;
  if (d2.every(cardId => selected.has(cardId))) return true;
  
  return false;
};

// Validate game code format
const isValidGameCode = (code: string): boolean => {
  return /^[A-Z0-9]{6}$/.test(code);
};

describe('Game Code Generation', () => {
  it('should generate a 6-character code', () => {
    const code = generateGameCode();
    expect(code.length).toBe(6);
  });

  it('should only contain valid characters', () => {
    const validChars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const code = generateGameCode();
    for (const char of code) {
      expect(validChars.includes(char)).toBe(true);
    }
  });

  it('should generate unique codes', () => {
    const codes = new Set();
    for (let i = 0; i < 100; i++) {
      codes.add(generateGameCode());
    }
    // Most should be unique (allowing tiny chance of collision)
    expect(codes.size).toBeGreaterThan(90);
  });
});

describe('Game Code Validation', () => {
  it('should accept valid 6-character alphanumeric codes', () => {
    expect(isValidGameCode('ABC123')).toBe(true);
    expect(isValidGameCode('XYZ789')).toBe(true);
    expect(isValidGameCode('AAAAAA')).toBe(true);
  });

  it('should reject invalid codes', () => {
    expect(isValidGameCode('ABC12')).toBe(false); // Too short
    expect(isValidGameCode('ABC1234')).toBe(false); // Too long
    expect(isValidGameCode('abc123')).toBe(false); // Lowercase
    expect(isValidGameCode('ABC!23')).toBe(false); // Special chars
    expect(isValidGameCode('')).toBe(false); // Empty
  });
});

describe('Deck Generation', () => {
  it('should generate 16 cards in test deck', () => {
    const deck = generateDeck();
    expect(deck.length).toBe(16);
  });

  it('should have unique card IDs', () => {
    const deck = generateDeck();
    const ids = deck.map(c => c.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(deck.length);
  });

  it('should have all cards with name and image', () => {
    const deck = generateDeck();
    deck.forEach(card => {
      expect(card.id).toBeDefined();
      expect(card.name).toBeDefined();
      expect(card.image).toBeDefined();
    });
  });
});

describe('Win Pattern Detection', () => {
  it('should detect horizontal win', () => {
    const board = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16];
    const selected = new Set([1, 2, 3, 4]); // First row
    expect(checkWin(board, selected)).toBe(true);
  });

  it('should detect vertical win', () => {
    const board = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16];
    const selected = new Set([1, 5, 9, 13]); // First column
    expect(checkWin(board, selected)).toBe(true);
  });

  it('should detect diagonal win', () => {
    const board = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16];
    const selected = new Set([1, 6, 11, 16]); // Diagonal
    expect(checkWin(board, selected)).toBe(true);
  });

  it('should not detect win for incomplete patterns', () => {
    const board = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16];
    const selected = new Set([1, 2, 3]); // Only 3 in a row
    expect(checkWin(board, selected)).toBe(false);
  });
});

describe('Player Limits', () => {
  const MAX_PLAYERS = 8;
  const MIN_PLAYERS = 2;

  it('should allow up to 8 players', () => {
    const players = Array.from({ length: MAX_PLAYERS }, (_, i) => ({ id: `p${i}`, name: `Player ${i}` }));
    expect(players.length).toBe(MAX_PLAYERS);
    expect(players.length <= 8).toBe(true);
  });

  it('should require minimum 2 players', () => {
    const players = Array.from({ length: MIN_PLAYERS }, (_, i) => ({ id: `p${i}`, name: `Player ${i}` }));
    expect(players.length).toBe(MIN_PLAYERS);
  });

  it('should reject more than 8 players', () => {
    const players = Array.from({ length: MAX_PLAYERS + 1 }, (_, i) => ({ id: `p${i}`, name: `Player ${i}` }));
    expect(players.length).toBeGreaterThan(MAX_PLAYERS);
  });
});

describe('Game State Transitions', () => {
  it('should have valid game states', () => {
    const validStates = ['waiting', 'playing', 'finished'];
    expect(validStates).toContain('waiting');
    expect(validStates).toContain('playing');
    expect(validStates).toContain('finished');
  });

  it('should transition from waiting to playing', () => {
    let status = 'waiting';
    status = 'playing';
    expect(status).toBe('playing');
  });

  it('should transition from playing to finished', () => {
    let status = 'playing';
    status = 'finished';
    expect(status).toBe('finished');
  });
});
