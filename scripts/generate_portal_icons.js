import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const studentSvg = (size) => `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1e40af" />
      <stop offset="100%" stop-color="#172554" />
    </linearGradient>
    <linearGradient id="accentGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#60a5fa" />
      <stop offset="100%" stop-color="#3b82f6" />
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${size * 0.22}" fill="url(#bgGrad)" />
  <circle cx="${size * 0.5}" cy="${size * 0.5}" r="${size * 0.38}" fill="#1e3a8a" opacity="0.5" />
  
  <!-- Graduation Cap Icon -->
  <g transform="translate(${size * 0.2}, ${size * 0.2}) scale(${size / 100})">
    <path d="M30 10 L55 22 L30 34 L5 22 Z" fill="url(#accentGrad)" />
    <path d="M15 27 L15 42 C 15 50, 45 50, 45 42 L45 27" fill="none" stroke="#93c5fd" stroke-width="3" stroke-linecap="round" />
    <path d="M50 24 L50 40 L53 45 L47 45 Z" fill="#fbbf24" />
    <!-- Book symbol -->
    <path d="M12 48 Q 30 42 30 52 Q 30 42 48 48 L48 56 Q 30 50 30 58 Q 30 50 12 56 Z" fill="#ffffff" opacity="0.9" />
  </g>
</svg>
`;

const teacherSvg = (size) => `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#d97706" />
      <stop offset="100%" stop-color="#78350f" />
    </linearGradient>
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fef08a" />
      <stop offset="100%" stop-color="#f59e0b" />
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${size * 0.22}" fill="url(#bgGrad)" />
  <circle cx="${size * 0.5}" cy="${size * 0.5}" r="${size * 0.38}" fill="#b45309" opacity="0.5" />
  
  <!-- Crown / Star Shield Icon -->
  <g transform="translate(${size * 0.2}, ${size * 0.18}) scale(${size / 100})">
    <!-- Shield -->
    <path d="M30 8 L50 15 C 50 38, 30 52, 30 52 C 30 52, 10 38, 10 15 Z" fill="#451a03" stroke="url(#goldGrad)" stroke-width="2.5" />
    <!-- Crown inside -->
    <path d="M18 34 L22 22 L30 28 L38 22 L42 34 Z" fill="url(#goldGrad)" />
    <!-- Star -->
    <circle cx="30" cy="18" r="2.5" fill="#ffffff" />
    <!-- Teacher Letter A (Ahmed) -->
    <text x="30" y="44" font-family="Arial, sans-serif" font-weight="900" font-size="10" fill="#ffffff" text-anchor="middle">MR</text>
  </g>
</svg>
`;

const secretarySvg = (size) => `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#6366f1" />
      <stop offset="100%" stop-color="#312e81" />
    </linearGradient>
    <linearGradient id="accentGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#a5b4fc" />
      <stop offset="100%" stop-color="#818cf8" />
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${size * 0.22}" fill="url(#bgGrad)" />
  <circle cx="${size * 0.5}" cy="${size * 0.5}" r="${size * 0.38}" fill="#4338ca" opacity="0.5" />
  
  <!-- Clipboard & Checklist Icon -->
  <g transform="translate(${size * 0.22}, ${size * 0.2}) scale(${size / 100})">
    <!-- Clipboard Board -->
    <rect x="12" y="14" width="34" height="42" rx="4" fill="#ffffff" />
    <!-- Clip Top -->
    <rect x="22" y="10" width="14" height="7" rx="2" fill="#312e81" />
    <!-- Checkmarks / Lines -->
    <line x1="18" y1="26" x2="38" y2="26" stroke="#6366f1" stroke-width="3" stroke-linecap="round" />
    <line x1="18" y1="34" x2="38" y2="34" stroke="#6366f1" stroke-width="3" stroke-linecap="round" />
    <line x1="18" y1="42" x2="32" y2="42" stroke="#6366f1" stroke-width="3" stroke-linecap="round" />
    <!-- Green Check Badge -->
    <circle cx="39" cy="45" r="7" fill="#10b981" />
    <path d="M36 45 L38 47 L43 42" fill="none" stroke="#ffffff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
  </g>
</svg>
`;

async function generate() {
  const publicDir = path.resolve('public');

  // Student icons
  await sharp(Buffer.from(studentSvg(192))).png().toFile(path.join(publicDir, 'pwa-student-192.png'));
  await sharp(Buffer.from(studentSvg(512))).png().toFile(path.join(publicDir, 'pwa-student-512.png'));
  console.log('Generated student icons');

  // Teacher icons
  await sharp(Buffer.from(teacherSvg(192))).png().toFile(path.join(publicDir, 'pwa-teacher-192.png'));
  await sharp(Buffer.from(teacherSvg(512))).png().toFile(path.join(publicDir, 'pwa-teacher-512.png'));
  console.log('Generated teacher icons');

  // Secretary icons
  await sharp(Buffer.from(secretarySvg(192))).png().toFile(path.join(publicDir, 'pwa-secretary-192.png'));
  await sharp(Buffer.from(secretarySvg(512))).png().toFile(path.join(publicDir, 'pwa-secretary-512.png'));
  console.log('Generated secretary icons');
}

generate().catch(console.error);
