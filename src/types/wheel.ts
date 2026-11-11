export interface WheelItem {
  id: string;
  label: string;
  color: string;
  textColor: string;
}

export type SpinPhase = 'idle' | 'pushing' | 'spinning' | 'revealing' | 'revealed';

export const CHRISTMAS_SLICE_PALETTE: Array<{ bg: string; text: string; pin: string }> = [
  { bg: '#ad1f23', text: '#fff9ed', pin: '#cc292e' }, // Vivid Crimson Red
  { bg: '#f5e9d3', text: '#2e1507', pin: '#f7edd9' }, // Frosted Cream/Ivory
  { bg: '#206839', text: '#fff9ed', pin: '#2ba354' }, // Forest Green
  { bg: '#a31b20', text: '#fff9ed', pin: '#c22328' }, // Crimson Red
  { bg: '#f2e5cd', text: '#2e1507', pin: '#f5e8d0' }, // Frosted Cream
  { bg: '#1c5e33', text: '#fff9ed', pin: '#248f47' }, // Forest Green
];

export const DEFAULT_WHEEL_ITEMS: WheelItem[] = [
  {
    id: 'item-1',
    label: "Cantar 'Então é Natal' 🎤",
    color: CHRISTMAS_SLICE_PALETTE[0].bg,
    textColor: CHRISTMAS_SLICE_PALETTE[0].text,
  },
  {
    id: 'item-2',
    label: 'Imitar Papai Noel (Ho-Ho-Ho) 🎅',
    color: CHRISTMAS_SLICE_PALETTE[1].bg,
    textColor: CHRISTMAS_SLICE_PALETTE[1].text,
  },
  {
    id: 'item-3',
    label: 'Dançar como uma Rena 🦌',
    color: CHRISTMAS_SLICE_PALETTE[2].bg,
    textColor: CHRISTMAS_SLICE_PALETTE[2].text,
  },
  {
    id: 'item-4',
    label: 'Contar uma piada de tiozão 😂',
    color: CHRISTMAS_SLICE_PALETTE[3 % CHRISTMAS_SLICE_PALETTE.length].bg,
    textColor: CHRISTMAS_SLICE_PALETTE[3 % CHRISTMAS_SLICE_PALETTE.length].text,
  },
  {
    id: 'item-5',
    label: 'Comer um doce sem usar as mãos 🍬',
    color: CHRISTMAS_SLICE_PALETTE[4 % CHRISTMAS_SLICE_PALETTE.length].bg,
    textColor: CHRISTMAS_SLICE_PALETTE[4 % CHRISTMAS_SLICE_PALETTE.length].text,
  },
  {
    id: 'item-6',
    label: 'Fazer 3 desejos para o Ano Novo ✨',
    color: CHRISTMAS_SLICE_PALETTE[5 % CHRISTMAS_SLICE_PALETTE.length].bg,
    textColor: CHRISTMAS_SLICE_PALETTE[5 % CHRISTMAS_SLICE_PALETTE.length].text,
  },
  {
    id: 'item-7',
    label: 'Pose de Árvore de Natal 🎄',
    color: CHRISTMAS_SLICE_PALETTE[0].bg,
    textColor: CHRISTMAS_SLICE_PALETTE[0].text,
  },
  {
    id: 'item-8',
    label: 'Abraçar quem está à direita 🤗',
    color: CHRISTMAS_SLICE_PALETTE[1].bg,
    textColor: CHRISTMAS_SLICE_PALETTE[1].text,
  },
];

export function assignBalancedPalette(items: Array<{ id: string; label: string }>): WheelItem[] {
  const n = items.length;
  if (n === 0) return [];
  const paletteLen = CHRISTMAS_SLICE_PALETTE.length;
  return items.map((item, idx) => {
    let paletteIdx = idx % paletteLen;
    // Prevent first and last slice from sharing the exact same background color
    if (n > 1 && idx === n - 1 && paletteIdx === 0) {
      paletteIdx = paletteLen > 2 ? 2 : 1;
    }
    const swatch = CHRISTMAS_SLICE_PALETTE[paletteIdx] ?? CHRISTMAS_SLICE_PALETTE[0];
    return {
      id: item.id,
      label: item.label,
      color: swatch.bg,
      textColor: swatch.text,
    };
  });
}
