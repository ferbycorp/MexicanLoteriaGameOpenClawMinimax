import { LoteriaCard } from '../types';

const cardImage = (name: string, id: number) => {
  const hue = (id * 37) % 360;
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='300' height='460' viewBox='0 0 300 460'>
    <defs>
      <linearGradient id='bg' x1='0' y1='0' x2='1' y2='1'>
        <stop offset='0%' stop-color='hsl(${hue},72%,85%)'/>
        <stop offset='100%' stop-color='hsl(${(hue + 35) % 360},65%,72%)'/>
      </linearGradient>
    </defs>
    <rect x='6' y='6' width='288' height='448' rx='16' fill='url(#bg)' stroke='#222' stroke-width='6'/>
    <rect x='22' y='22' width='256' height='380' rx='12' fill='rgba(255,255,255,0.7)'/>
    <text x='150' y='245' text-anchor='middle' font-size='28' font-family='Arial, sans-serif' font-weight='700' fill='#111'>${name}</text>
    <text x='150' y='430' text-anchor='middle' font-size='22' font-family='Arial, sans-serif' font-weight='700' fill='#111'>#${id}</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

const CARD_NAMES = [
  'El Gallo', 'El Diablito', 'La Dama', 'El Catrín', 'El Paraguas', 'La Sirena', 'La Escalera', 'La Botella',
  'El Barril', 'El Árbol', 'El Melón', 'El Valiente', 'El Gorrito', 'La Muerte', 'La Pera', 'La Bandera',
  'El Bandolón', 'El Violoncello', 'La Garza', 'El Pájaro', 'La Mano', 'La Bota', 'La Luna', 'El Cotorro',
  'El Borracho', 'El Negrito', 'El Corazón', 'La Sandía', 'El Tambor', 'El Camarón', 'Las Jaras', 'El Músico',
  'La Araña', 'El Soldado', 'La Estrella', 'El Cazo', 'El Mundo', 'El Apache', 'El Nopal', 'El Alacrán',
  'La Rosa', 'La Calavera', 'La Campana', 'El Cantarito', 'El Venado', 'El Sol', 'La Corona', 'La Chalupa',
  'El Pino', 'El Pescado', 'La Palma', 'La Maceta', 'El Arpa', 'La Rana',
];

export const TRADITIONAL_LOTERIA_CARDS: LoteriaCard[] = CARD_NAMES.map((name, index) => {
  const id = index + 1;
  return { id, name, image: cardImage(name, id) };
});

export const generateDeck = () => {
  const shuffled = [...TRADITIONAL_LOTERIA_CARDS];

  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled;
};
