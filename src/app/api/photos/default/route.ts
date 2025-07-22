import { NextRequest, NextResponse } from 'next/server';

// Simple SVG placeholder for missing photos
const DEFAULT_AVATAR_SVG = `
<svg width="200" height="200" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#e3f2fd;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#bbdefb;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="200" height="200" fill="url(#bg)"/>
  <circle cx="100" cy="80" r="35" fill="#90a4ae" opacity="0.8"/>
  <ellipse cx="100" cy="160" rx="60" ry="45" fill="#90a4ae" opacity="0.8"/>
  <text x="100" y="190" font-family="Arial, sans-serif" font-size="12" text-anchor="middle" fill="#546e7a">
    TME Employee
  </text>
</svg>
`.trim();

export async function GET(request: NextRequest) {
  return new NextResponse(DEFAULT_AVATAR_SVG, {
    status: 200,
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
    },
  });
}