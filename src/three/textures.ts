import * as THREE from 'three';
import { WheelItem } from '../types/wheel';

export function createWheelFaceTexture(
  items: WheelItem[],
  maxAnisotropy: number = 4
): THREE.CanvasTexture {
  const size = 2048;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const cx = size / 2;
  const cy = size / 2;
  const radius = size * 0.485;

  ctx.clearRect(0, 0, size, size);

  const safeItems: WheelItem[] =
    items.length > 0
      ? items
      : [
          {
            id: 'empty',
            label: 'Adicione itens na placa 🎄',
            color: '#e61c24',
            textColor: '#ffffff',
          },
        ];

  const count = safeItems.length;
  const sliceAngle = (Math.PI * 2) / count;

  // Draw slices starting at 12 o'clock (-Math.PI / 2) clockwise
  safeItems.forEach((item, index) => {
    const startAngle = -Math.PI / 2 + index * sliceAngle;
    const endAngle = startAngle + sliceAngle;
    const midAngle = startAngle + sliceAngle / 2;

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, radius, startAngle, endAngle);
    ctx.closePath();
    ctx.clip();

    // Rich, pure slice color with subtle 3D radial depth (no wash-out)
    const grad = ctx.createRadialGradient(cx, cy, radius * 0.05, cx, cy, radius);
    grad.addColorStop(0, shadeHex(item.color, 18));
    grad.addColorStop(0.5, item.color);
    grad.addColorStop(1, shadeHex(item.color, -10));
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);

    // Crisp gold divider line between slices
    ctx.strokeStyle = 'rgba(255, 225, 120, 0.95)';
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, radius - 3, startAngle, endAngle);
    ctx.closePath();
    ctx.stroke();

    // Draw crisp radially aligned label
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(midAngle);

    const maxTextWidth = radius * 0.74;
    const innerOffset = radius * 0.18;
    const outerLimit = radius * 0.92;
    const textCenterRadius = (innerOffset + outerLimit) / 2;

    const baseFontPx = Math.max(38, Math.min(68, Math.floor(560 / Math.max(4, count))));
    ctx.font = `800 ${baseFontPx}px "Plus Jakarta Sans", system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const displayLabel = truncateText(ctx, item.label, maxTextWidth);

    // Flip text on left half so it's never upside-down
    const normalizedDeg = (((midAngle * 180) / Math.PI) % 360 + 360) % 360;
    const isLeftSide = normalizedDeg > 90 && normalizedDeg < 270;

    ctx.translate(textCenterRadius, 0);
    if (isLeftSide) {
      ctx.rotate(Math.PI);
    }

    // Stretch letter height vertically (Y-axis) by 1.45x so text is taller & occupies more wheel slice space
    ctx.scale(1.0, 1.45);

    // Slim, clean dark outline for high contrast without heavy thickness
    const isLightBg = isLightHex(item.color);
    ctx.lineJoin = 'round';
    ctx.miterLimit = 2;
    ctx.lineWidth = Math.max(2, Math.floor(baseFontPx * 0.05));
    ctx.strokeStyle = isLightBg ? 'rgba(10, 3, 1, 0.88)' : 'rgba(0, 0, 0, 0.82)';
    ctx.strokeText(displayLabel, 0, 0);

    // Clean text fill with subtle drop shadow
    ctx.shadowColor = isLightBg ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)';
    ctx.shadowBlur = 3;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 1;

    ctx.fillStyle = item.textColor || (isLightBg ? '#120501' : '#ffffff');
    ctx.fillText(displayLabel, 0, 0);

    ctx.restore();
    ctx.restore();
  });

  // Double golden rim rings with decorative gold studs around perimeter
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, radius * 0.975, 0, Math.PI * 2);
  ctx.strokeStyle = '#ffd700';
  ctx.lineWidth = 7;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(cx, cy, radius * 0.945, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(255, 245, 180, 0.55)';
  ctx.lineWidth = 3;
  ctx.stroke();

  // Decorative gold studs on face edge
  const studCount = Math.max(16, count * 2);
  for (let s = 0; s < studCount; s++) {
    const sAngle = (s / studCount) * Math.PI * 2;
    const sx = cx + Math.cos(sAngle) * (radius * 0.975);
    const sy = cy + Math.sin(sAngle) * (radius * 0.975);
    ctx.fillStyle = '#fff0aa';
    ctx.beginPath();
    ctx.arc(sx, sy, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#855900';
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  ctx.restore();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = maxAnisotropy;
  texture.needsUpdate = true;
  return texture;
}

export function createCenterHubTexture(maxAnisotropy: number = 4): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const cx = size / 2;
  const cy = size / 2;

  // Outer gold rim gradient
  const outerGrad = ctx.createRadialGradient(cx - 30, cy - 30, 100, cx, cy, size * 0.49);
  outerGrad.addColorStop(0, '#ffe599');
  outerGrad.addColorStop(0.5, '#d4af37');
  outerGrad.addColorStop(1, '#8c6718');
  ctx.fillStyle = outerGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, size * 0.49, 0, Math.PI * 2);
  ctx.fill();

  // Deep festive crimson lacquer inner disk
  const grad = ctx.createRadialGradient(cx - 35, cy - 45, 16, cx, cy, size * 0.42);
  grad.addColorStop(0, '#f23f3f');
  grad.addColorStop(0.45, '#c51d24');
  grad.addColorStop(0.85, '#850f15');
  grad.addColorStop(1, '#500508');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(cx, cy, size * 0.43, 0, Math.PI * 2);
  ctx.fill();

  // Elegant inner gold filigree ring
  ctx.beginPath();
  ctx.arc(cx, cy, size * 0.38, 0, Math.PI * 2);
  ctx.strokeStyle = '#ffd97d';
  ctx.lineWidth = 6;
  ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
  ctx.shadowBlur = 8;
  ctx.stroke();
  ctx.shadowBlur = 0;

  // Star points around inner border
  const starCount = 12;
  for (let i = 0; i < starCount; i++) {
    const angle = (i / starCount) * Math.PI * 2;
    const sx = cx + Math.cos(angle) * (size * 0.38);
    const sy = cy + Math.sin(angle) * (size * 0.38);
    ctx.fillStyle = '#fff4cc';
    ctx.beginPath();
    ctx.arc(sx, sy, 4.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Golden gift icon above "GIRAR" with rich drop shadow
  ctx.save();
  ctx.translate(cx, cy - 44);
  ctx.fillStyle = '#ffd97d';
  ctx.strokeStyle = '#3d0704';
  ctx.lineWidth = 4;
  ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
  ctx.shadowBlur = 12;

  // Gift box body
  roundRect(ctx, -32, -12, 64, 48, 8);
  ctx.fill();
  ctx.stroke();

  // Gift box lid (slightly wider with overhang)
  roundRect(ctx, -38, -26, 76, 18, 6);
  ctx.fill();
  ctx.stroke();

  // Satin crimson ribbon cross
  ctx.fillStyle = '#a81818';
  ctx.fillRect(-7, -26, 14, 62);
  ctx.fillRect(-32, 2, 64, 12);

  // Sparkly golden gift bow loops
  ctx.strokeStyle = '#fff1a8';
  ctx.lineWidth = 6.5;
  ctx.beginPath();
  ctx.ellipse(-14, -34, 14, 8, -0.4, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(14, -34, 14, 8, 0.4, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  // "GIRAR" bold festive typography with 3D embossed styling
  ctx.save();
  ctx.font = '800 62px "Fraunces", Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  // Dark backdrop stroke for clarity
  ctx.lineWidth = 6;
  ctx.strokeStyle = '#4a0808';
  ctx.fillStyle = '#fffdf5';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
  ctx.shadowBlur = 14;
  ctx.shadowOffsetY = 5;
  ctx.strokeText('GIRAR', cx, cy + 54);
  ctx.fillText('GIRAR', cx, cy + 54);
  ctx.restore();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = maxAnisotropy;
  texture.needsUpdate = true;
  return texture;
}

export function createStripedSockTexture(maxAnisotropy: number = 4): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  const stripes = 10;
  const h = canvas.height / stripes;
  for (let i = 0; i < stripes; i++) {
    ctx.fillStyle = i % 2 === 0 ? '#c92424' : '#f7efe1';
    ctx.fillRect(0, i * h, canvas.width, h + 1);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

export function createWoodGrainTexture(
  baseHex: string = '#5c3419',
  darkHex: string = '#361b0a',
  maxAnisotropy: number = 4
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = baseHex;
  ctx.fillRect(0, 0, 512, 512);

  for (let i = 0; i < 160; i++) {
    const y = (i / 160) * 512;
    ctx.strokeStyle = i % 3 === 0 ? darkHex : shadeHex(baseHex, 12);
    ctx.globalAlpha = 0.16 + (i % 5) * 0.03;
    ctx.lineWidth = 1.5 + (i % 4);
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.bezierCurveTo(170, y + Math.sin(i) * 8, 340, y - Math.cos(i) * 8, 512, y);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

export function createTreeRingsTexture(maxAnisotropy: number = 4): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  const cx = 256;
  const cy = 256;
  const maxR = 246;

  // 1. Radial gradient from rich amber heartwood to lighter sapwood
  const woodGrad = ctx.createRadialGradient(cx, cy, 10, cx, cy, maxR);
  woodGrad.addColorStop(0, '#78431e');
  woodGrad.addColorStop(0.25, '#995a28');
  woodGrad.addColorStop(0.65, '#ba7b42');
  woodGrad.addColorStop(0.88, '#d4a268');
  woodGrad.addColorStop(0.96, '#8f562b');
  woodGrad.addColorStop(1.0, '#3a1e0d');
  ctx.fillStyle = woodGrad;
  ctx.fillRect(0, 0, 512, 512);

  // 2. Realistic concentric annual tree growth rings with natural organic waviness
  const ringCount = 38;
  for (let r = 1; r <= ringCount; r++) {
    const baseRadius = (r / ringCount) * (maxR - 12);
    ctx.beginPath();
    const steps = 72;
    for (let s = 0; s <= steps; s++) {
      const angle = (s / steps) * Math.PI * 2;
      // Natural organic wobble in wood grain rings
      const wobble = Math.sin(angle * 3 + r * 0.4) * 2.8 + Math.cos(angle * 5 - r * 0.3) * 1.8;
      const curR = Math.max(3, baseRadius + wobble);
      const px = cx + Math.cos(angle) * curR;
      const py = cy + Math.sin(angle) * curR;
      if (s === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.strokeStyle = r % 4 === 0 ? 'rgba(56, 26, 9, 0.48)' : 'rgba(72, 36, 14, 0.28)';
    ctx.lineWidth = r % 4 === 0 ? 3.0 : 1.8;
    ctx.stroke();
  }

  // 3. Radial drying cracks / fissures radiating from heartwood
  const crackAngles = [0.42, 1.35, 2.78, 4.12, 5.25];
  crackAngles.forEach((baseAngle) => {
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(baseAngle) * 18, cy + Math.sin(baseAngle) * 18);
    const crackLen = maxR * (0.65 + (Math.sin(baseAngle * 10) * 0.2));
    let curX = cx + Math.cos(baseAngle) * 18;
    let curY = cy + Math.sin(baseAngle) * 18;
    for (let step = 1; step <= 8; step++) {
      const dist = (step / 8) * crackLen;
      const a = baseAngle + (Math.sin(step * 1.5) * 0.08);
      curX = cx + Math.cos(a) * dist;
      curY = cy + Math.sin(a) * dist;
      ctx.lineTo(curX, curY);
    }
    ctx.strokeStyle = 'rgba(28, 11, 4, 0.72)';
    ctx.lineWidth = 3.5;
    ctx.stroke();

    ctx.strokeStyle = 'rgba(45, 18, 7, 0.42)';
    ctx.lineWidth = 1.6;
    ctx.stroke();
  });

  // 4. Center tree pith knot
  ctx.fillStyle = '#48240f';
  ctx.beginPath();
  ctx.arc(cx, cy, 9, 0, Math.PI * 2);
  ctx.fill();

  // 5. Rough outer bark rim border
  ctx.strokeStyle = '#281307';
  ctx.lineWidth = 18;
  ctx.beginPath();
  ctx.arc(cx, cy, maxR - 4, 0, Math.PI * 2);
  ctx.stroke();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

export function createGiftWrapTexture(maxAnisotropy: number = 4): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createLinearGradient(0, 0, 512, 512);
  grad.addColorStop(0, '#b5181d');
  grad.addColorStop(0.5, '#8e1014');
  grad.addColorStop(1, '#6e0b0e');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 512);

  // Subtle gold festive diamond & star motif
  ctx.strokeStyle = 'rgba(246, 204, 108, 0.22)';
  ctx.lineWidth = 2;
  const step = 64;
  for (let x = -512; x < 1024; x += step) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + 512, 512);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(x + 512, 0);
    ctx.lineTo(x, 512);
    ctx.stroke();
  }

  ctx.fillStyle = 'rgba(255, 222, 138, 0.32)';
  for (let y = step / 2; y < 512; y += step) {
    for (let x = step / 2; x < 512; x += step) {
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

export function createSoftGlowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  const grad = ctx.createRadialGradient(128, 128, 4, 128, 128, 128);
  grad.addColorStop(0, 'rgba(255, 248, 214, 1)');
  grad.addColorStop(0.28, 'rgba(255, 208, 102, 0.72)');
  grad.addColorStop(0.65, 'rgba(245, 158, 45, 0.22)');
  grad.addColorStop(1, 'rgba(245, 158, 45, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 256);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createTreeGlowTexture(colorHex: string = '#ffd97d'): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  const grad = ctx.createRadialGradient(128, 128, 2, 128, 128, 126);
  grad.addColorStop(0, 'rgba(255, 255, 245, 0.95)');
  grad.addColorStop(0.25, colorHex);
  grad.addColorStop(0.62, 'rgba(255, 180, 50, 0.28)');
  grad.addColorStop(1, 'rgba(255, 180, 50, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 256);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createContactShadowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  const grad = ctx.createRadialGradient(128, 128, 12, 128, 128, 124);
  grad.addColorStop(0, 'rgba(8, 20, 38, 0.68)');
  grad.addColorStop(0.55, 'rgba(11, 27, 50, 0.34)');
  grad.addColorStop(1, 'rgba(11, 27, 50, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 256);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function truncateText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
  if (ctx.measureText(text).width <= maxWidth) return text;
  const chars = Array.from(text);
  let trimmed = '';
  for (let i = 0; i < chars.length; i++) {
    const candidate = trimmed + chars[i] + '…';
    if (ctx.measureText(candidate).width > maxWidth) {
      break;
    }
    trimmed += chars[i];
  }
  return trimmed.trimEnd() + '…';
}

function shadeHex(hex: string, percent: number): string {
  const cleaned = hex.replace('#', '');
  const num = parseInt(cleaned, 16);
  const amt = Math.round(2.55 * percent);
  const r = Math.max(0, Math.min(255, (num >> 16) + amt));
  const g = Math.max(0, Math.min(255, ((num >> 8) & 0x00ff) + amt));
  const b = Math.max(0, Math.min(255, (num & 0x0000ff) + amt));
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

function isLightHex(hex: string): boolean {
  const cleaned = hex.replace('#', '');
  const num = parseInt(cleaned, 16);
  const r = num >> 16;
  const g = (num >> 8) & 0x00ff;
  const b = num & 0x0000ff;
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.65;
}
