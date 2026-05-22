import React from 'react';

export function Logo({ className = "w-full h-full" }: { className?: string }) {
  return (
    <svg viewBox="0 0 512 512" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="512" height="512" rx="128" fill="url(#logo-gradient)"/>
      <path d="M128 384V128L256 256L384 128V384" stroke="white" strokeWidth="48" strokeLinecap="round" strokeLinejoin="round"/>
      <defs>
        <linearGradient id="logo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#22d3ee" />
          <stop offset="100%" stopColor="#14b8a6" />
        </linearGradient>
      </defs>
    </svg>
  );
}
