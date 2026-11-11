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
            color: '#9e1c1c',
            textColor: '#fff7e6',
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

    // Base slice painted wood color with radial depth shading
    const grad = ctx.createRadialGradient(cx, cy, radius * 0.12, cx, cy, radius);
    grad.addColorStop(0, shadeHex(item.color, 10));
    grad.addColorStop(0.72, item.color);
    grad.addColorStop(0.95, shadeHex(item.color, -18));
    grad.addColorStop(1, shadeHex(item.color, -32));
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);

    // Painted wood plank grain streaks along the slice radial axis
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(midAngle);
    ctx.globalAlpha = 0.13;
    for (let g = -radius; g < radius; g += 9) {
      ctx.fillStyle = g % 18 === 0 ? '#1a0c04' : '#fff6e5';
      ctx.fillRect(0, g * 0.45, radius, 2.2);
    }

    // Subtle frosted snow dusting near outer rim of slice
    const frostGrad = ctx.createRadialGradient(0, 0, radius * 0.82, 0, 0, radius);
    frostGrad.addColorStop(0, 'rgba(255,255,255,0)');
    frostGrad.addColorStop(1, 'rgba(255,250,242,0.22)');
    ctx.globalAlpha = 1;
    ctx.fillStyle = frostGrad;
    ctx.beginPath();
    ctx.arc(0, 0, radius, -sliceAngle, sliceAngle);
    ctx.lineTo(0, 0);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Soft bevel shadow along slice borders
    ctx.strokeStyle = 'rgba(25, 10, 2, 0.42)';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, radius, startAngle, endAngle);
    ctx.closePath();
    ctx.stroke();

    // Draw crisp radially aligned label
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(midAngle);

    const maxTextWidth = radius * 0.62;
    const innerOffset = radius * 0.25;
    const outerLimit = radius * 0.89;
    const textCenterRadius = (innerOffset + outerLimit) / 2;

    // Scale font smoothly with slice count
    const baseFontPx = Math.max(32, Math.min(54, Math.floor(460 / Math.max(4, count))));
    ctx.font = `800 ${baseFontPx}px "Plus Jakarta Sans", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const displayLabel = truncateText(ctx, item.label, maxTextWidth);

    // Flip text on left half so it's never upside-down to the viewer
    const normalizedDeg = (((midAngle * 180) / Math.PI) % 360 + 360) % 360;
    const isLeftSide = normalizedDeg > 90 && normalizedDeg < 270;

    ctx.translate(textCenterRadius, 0);
    if (isLeftSide) {
      ctx.rotate(Math.PI);
    }

    // Heavy dark or light stroke outline for razor-sharp legibility against any background slice color
    const isLightBg = isLightHex(item.color);
    ctx.lineJoin = 'round';
    ctx.miterLimit = 2;
    ctx.lineWidth = Math.max(6, Math.floor(baseFontPx * 0.18));
    ctx.strokeStyle = isLightBg ? 'rgba(20, 8, 2, 0.95)' : 'rgba(0, 0, 0, 0.92)';
    ctx.strokeText(displayLabel, 0, 0);

    // Subtle drop shadow for 3D depth
    ctx.shadowColor = isLightBg ? 'rgba(255, 250, 240, 0.7)' : 'rgba(0, 0, 0, 0.9)';
    ctx.shadowBlur = isLightBg ? 2 : 6;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 2;

    ctx.fillStyle = item.textColor || (isLightBg ? '#1f0d04' : '#ffffff');
    ctx.fillText(displayLabel, 0, 0);

    ctx.restore();
    ctx.restore();
  });

  // Outer brass inlay hairline ring on wheel face
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, radius * 0.975, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(232, 185, 92, 0.65)';
  ctx.lineWidth = 6;
  ctx.stroke();
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

  // Deep festive crimson lacquer background
  const grad = ctx.createRadialGradient(cx - 35, cy - 45, 16, cx, cy, size * 0.48);
  grad.addColorStop(0, '#dc2f2f');
  grad.addColorStop(0.55, '#a81818');
  grad.addColorStop(1, '#680b0b');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(cx, cy, size * 0.49, 0, Math.PI * 2);
  ctx.fill();

  // Inner embossed gold ring
  ctx.beginPath();
  ctx.arc(cx, cy, size * 0.42, 0, Math.PI * 2);
  ctx.strokeStyle = '#f2c96d';
  ctx.lineWidth = 8;
  ctx.stroke();

  // Golden gift icon above "GIRAR" (matching reference image!)
  ctx.save();
  ctx.translate(cx, cy - 46);
  ctx.fillStyle = '#ffd97d';
  ctx.strokeStyle = '#5c1008';
  ctx.lineWidth = 4;

  // Gift box body
  roundRect(ctx, -34, -14, 68, 50, 7);
  ctx.fill();
  ctx.stroke();

  // Gift box lid
  roundRect(ctx, -40, -28, 80, 18, 6);
  ctx.fill();
  ctx.stroke();

  // Red ribbon vertical & horizontal
  ctx.fillStyle = '#a81818';
  ctx.fillRect(-8, -28, 16, 64);
  ctx.fillRect(-34, 4, 68, 12);

  // Gift bow loops
  ctx.strokeStyle = '#ffd97d';
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.ellipse(-15, -36, 15, 9, -0.4, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(15, -36, 15, 9, 0.4, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  // "GIRAR" bold festive typography
  ctx.save();
  ctx.font = '800 66px "Fraunces", Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(25, 3, 3, 0.85)';
  ctx.shadowBlur = 10;
  ctx.shadowOffsetY = 4;
  ctx.fillStyle = '#fff8ea';
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
