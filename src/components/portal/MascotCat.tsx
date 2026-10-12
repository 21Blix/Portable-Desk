import React, { useState } from 'react';
import { playClickSound } from '../../lib/audio/sound-effects';

const MASCOT_MESSAGES = [
  'PDFs are just paper with commitment issues.',
  'Did you know paper is just flattened trees with anxiety?',
  'Meow. I ate page 4. Just kidding.',
  'Feed me more vector curves!',
  'This could have been an email.',
  '100% in your browser. No server can have my papers.',
  'I don’t trust Adobe, but I trust your local RAM.',
  'Beware of Comic Sans in legal documents.',
];

export const MascotCat: React.FC = () => {
  const [msgIndex, setMsgIndex] = useState<number | null>(null);

  const handleClick = () => {
    playClickSound();
    const nextIdx = Math.floor(Math.random() * MASCOT_MESSAGES.length);
    setMsgIndex(nextIdx);
    setTimeout(() => setMsgIndex(null), 4500);
  };

  return (
    <div className="mascot-perch" onClick={handleClick} title="Suspicious cat mascot (click me!)">
      {msgIndex !== null && (
        <div className="mascot-speech-bubble">
          {MASCOT_MESSAGES[msgIndex]}
        </div>
      )}
      <svg width="74" height="64" viewBox="0 0 74 64" fill="none">
        {/* Purple Blob seat */}
        <ellipse cx="37" cy="54" rx="30" ry="10" fill="#925BFF" opacity="0.6" />
        
        {/* Cat Body */}
        <path
          d="M22 54 C20 40 24 30 37 30 C50 30 54 40 52 54 Z"
          fill="#1c1d2e"
          stroke="#BC79FF"
          strokeWidth="2.5"
        />

        {/* Cat Head */}
        <circle cx="37" cy="26" r="16" fill="#1c1d2e" stroke="#BC79FF" strokeWidth="2.5" />

        {/* Left Ear */}
        <polygon points="25,18 20,4 32,13" fill="#1c1d2e" stroke="#BC79FF" strokeWidth="2.5" strokeLinejoin="round" />
        <polygon points="24,16 22,7 30,13" fill="#FF5CA8" />

        {/* Right Ear */}
        <polygon points="49,18 54,4 42,13" fill="#1c1d2e" stroke="#BC79FF" strokeWidth="2.5" strokeLinejoin="round" />
        <polygon points="50,16 52,7 44,13" fill="#FF5CA8" />

        {/* Glowing Cat Eyes */}
        <g style={{ animation: 'mascotBlink 4s infinite' }}>
          <ellipse cx="31" cy="25" rx="3.5" ry="4" fill="#D6FF70" />
          <ellipse cx="43" cy="25" rx="3.5" ry="4" fill="#D6FF70" />
          {/* Slit Pupils */}
          <ellipse cx="31" cy="25" rx="1.2" ry="3.5" fill="#08090D" />
          <ellipse cx="43" cy="25" rx="1.2" ry="3.5" fill="#08090D" />
        </g>

        {/* Cute Nose & Whiskers */}
        <polygon points="36,29 38,29 37,31" fill="#FF5CA8" />
        <path d="M37 31 Q35 34 33 33 M37 31 Q39 34 41 33" stroke="#FFF9F0" strokeWidth="1.5" strokeLinecap="round" />

        {/* Whiskers */}
        <line x1="22" y1="28" x2="14" y2="26" stroke="#54F5E7" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="22" y1="31" x2="14" y2="32" stroke="#54F5E7" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="52" y1="28" x2="60" y2="26" stroke="#54F5E7" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="52" y1="31" x2="60" y2="32" stroke="#54F5E7" strokeWidth="1.5" strokeLinecap="round" />

        {/* Paws resting on portal rim */}
        <circle cx="30" cy="48" r="4.5" fill="#F4EBD8" stroke="#1c1d2e" strokeWidth="1.5" />
        <circle cx="44" cy="48" r="4.5" fill="#F4EBD8" stroke="#1c1d2e" strokeWidth="1.5" />
      </svg>
    </div>
  );
};
