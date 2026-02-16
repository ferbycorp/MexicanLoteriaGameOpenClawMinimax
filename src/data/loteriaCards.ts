import { LoteriaCard } from '../types';

const PLACEHOLDER_BASE = 'https://placehold.co/300x460/png?text=';

const cardImage = (name: string) => `${PLACEHOLDER_BASE}${encodeURIComponent(name)}`;

export const TRADITIONAL_LOTERIA_CARDS: LoteriaCard[] = [
  { id: 1, name: 'El Gallo', image: cardImage('El Gallo') },
  { id: 2, name: 'El Diablito', image: cardImage('El Diablito') },
  { id: 3, name: 'La Dama', image: cardImage('La Dama') },
  { id: 4, name: 'El Catrín', image: cardImage('El Catrín') },
  { id: 5, name: 'El Paraguas', image: cardImage('El Paraguas') },
  { id: 6, name: 'La Sirena', image: cardImage('La Sirena') },
  { id: 7, name: 'La Escalera', image: cardImage('La Escalera') },
  { id: 8, name: 'La Botella', image: cardImage('La Botella') },
  { id: 9, name: 'El Barril', image: cardImage('El Barril') },
  { id: 10, name: 'El Árbol', image: cardImage('El Árbol') },
  { id: 11, name: 'El Melón', image: cardImage('El Melón') },
  { id: 12, name: 'El Valiente', image: cardImage('El Valiente') },
  { id: 13, name: 'El Gorrito', image: cardImage('El Gorrito') },
  { id: 14, name: 'La Muerte', image: cardImage('La Muerte') },
  { id: 15, name: 'La Pera', image: cardImage('La Pera') },
  { id: 16, name: 'La Bandera', image: cardImage('La Bandera') },
  { id: 17, name: 'El Bandolón', image: cardImage('El Bandolón') },
  { id: 18, name: 'El Violoncello', image: cardImage('El Violoncello') },
  { id: 19, name: 'La Garza', image: cardImage('La Garza') },
  { id: 20, name: 'El Pájaro', image: cardImage('El Pájaro') },
  { id: 21, name: 'La Mano', image: cardImage('La Mano') },
  { id: 22, name: 'La Bota', image: cardImage('La Bota') },
  { id: 23, name: 'La Luna', image: cardImage('La Luna') },
  { id: 24, name: 'El Cotorro', image: cardImage('El Cotorro') },
  { id: 25, name: 'El Borracho', image: cardImage('El Borracho') },
  { id: 26, name: 'El Negrito', image: cardImage('El Negrito') },
  { id: 27, name: 'El Corazón', image: cardImage('El Corazón') },
  { id: 28, name: 'La Sandía', image: cardImage('La Sandía') },
  { id: 29, name: 'El Tambor', image: cardImage('El Tambor') },
  { id: 30, name: 'El Camarón', image: cardImage('El Camarón') },
  { id: 31, name: 'Las Jaras', image: cardImage('Las Jaras') },
  { id: 32, name: 'El Músico', image: cardImage('El Músico') },
  { id: 33, name: 'La Araña', image: cardImage('La Araña') },
  { id: 34, name: 'El Soldado', image: cardImage('El Soldado') },
  { id: 35, name: 'La Estrella', image: cardImage('La Estrella') },
  { id: 36, name: 'El Cazo', image: cardImage('El Cazo') },
  { id: 37, name: 'El Mundo', image: cardImage('El Mundo') },
  { id: 38, name: 'El Apache', image: cardImage('El Apache') },
  { id: 39, name: 'El Nopal', image: cardImage('El Nopal') },
  { id: 40, name: 'El Alacrán', image: cardImage('El Alacrán') },
  { id: 41, name: 'La Rosa', image: cardImage('La Rosa') },
  { id: 42, name: 'La Calavera', image: cardImage('La Calavera') },
  { id: 43, name: 'La Campana', image: cardImage('La Campana') },
  { id: 44, name: 'El Cantarito', image: cardImage('El Cantarito') },
  { id: 45, name: 'El Venado', image: cardImage('El Venado') },
  { id: 46, name: 'El Sol', image: cardImage('El Sol') },
  { id: 47, name: 'La Corona', image: cardImage('La Corona') },
  { id: 48, name: 'La Chalupa', image: cardImage('La Chalupa') },
  { id: 49, name: 'El Pino', image: cardImage('El Pino') },
  { id: 50, name: 'El Pescado', image: cardImage('El Pescado') },
  { id: 51, name: 'La Palma', image: cardImage('La Palma') },
  { id: 52, name: 'La Maceta', image: cardImage('La Maceta') },
  { id: 53, name: 'El Arpa', image: cardImage('El Arpa') },
  { id: 54, name: 'La Rana', image: cardImage('La Rana') },
];

export const generateDeck = () => {
  const shuffled = [...TRADITIONAL_LOTERIA_CARDS];

  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled;
};
