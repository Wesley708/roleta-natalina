export interface WheelItem {
  id: string;
  label: string;
  color: string;
  textColor: string;
}

export type SpinPhase = 'idle' | 'pushing' | 'spinning' | 'revealing' | 'revealed';

export const CHRISTMAS_SLICE_PALETTE: Array<{ bg: string; text: string; pin: string }> = [
  { bg: '#e61c24', text: '#ffffff', pin: '#ff3b42' }, // Bright Ruby Red
  { bg: '#009640', text: '#ffffff', pin: '#12b856' }, // Vibrant Emerald Green
  { bg: '#f8fafc', text: '#120502', pin: '#e2e8f0' }, // Pure Snow White
  { bg: '#c90e17', text: '#ffffff', pin: '#e8252e' }, // Deep Festive Crimson
  { bg: '#0f7a3d', text: '#ffffff', pin: '#219c55' }, // Rich Pine Green
  { bg: '#f1f5f9', text: '#120502', pin: '#cbd5e1' }, // Frosted White
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
    color: CHRISTMAS_SLICE_PALETTE[3].bg,
    textColor: CHRISTMAS_SLICE_PALETTE[3].text,
  },
  {
    id: 'item-6',
    label: 'Fazer 3 desejos para o Ano Novo ✨',
    color: CHRISTMAS_SLICE_PALETTE[5].bg,
    textColor: CHRISTMAS_SLICE_PALETTE[5].text,
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
