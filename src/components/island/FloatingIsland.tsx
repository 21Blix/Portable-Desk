import React from 'react';

export const FloatingIsland: React.FC = () => {
  return (
    <div className="floating-island-wrap">
      {/* Floating Notes hovering above the island */}
      <div className="island-notes-container">
        <div className="sticky-note island-note island-note-1">
          your pc can do this on its own
        </div>
        <div className="sticky-note lime island-note island-note-2">
          ditch these capitalistic companies
        </div>
        <div className="sticky-note cyan island-note island-note-3">
          split and spread those papers
        </div>
      </div>

      {/* SVG Floating Island Illustration */}
      <svg
        viewBox="0 0 620 340"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          width: '100%',
          height: 'auto',
          filter: 'drop-shadow(0 25px 35px rgba(0,0,0,0.7))',
        }}
      >
        <defs>
          <linearGradient id="islandRockGrad" x1="310" y1="120" x2="310" y2="330" gradientUnits="userSpaceOnUse">
            <stop stopColor="#251a3d" />
            <stop offset="0.6" stopColor="#151728" />
            <stop offset="1" stopColor="#0a0c16" />
          </linearGradient>
          <linearGradient id="grassGrad" x1="80" y1="90" x2="540" y2="150" gradientUnits="userSpaceOnUse">
            <stop stopColor="#b4f74d" />
            <stop offset="0.5" stopColor="#6ea724" />
            <stop offset="1" stopColor="#436b12" />
          </linearGradient>
          <linearGradient id="streamGlow" x1="200" y1="110" x2="400" y2="150" gradientUnits="userSpaceOnUse">
            <stop stopColor="#54F5E7" />
            <stop offset="1" stopColor="#925BFF" />
          </linearGradient>
        </defs>

        {/* Ambient Underglow Aura */}
        <ellipse cx="310" cy="220" rx="220" ry="60" fill="#925BFF" opacity="0.25" filter="blur(30px)" />

        {/* Rock / Bedrock Base of the Floating Island */}
        <path
          d="M70 120 
             C120 180, 180 280, 290 325 
             C330 330, 360 300, 420 260 
             C480 220, 520 170, 550 120 
             C450 145, 330 140, 200 135 
             Z"
          fill="url(#islandRockGrad)"
          stroke="#382d56"
          strokeWidth="3"
        />

        {/* Crystal Shards & Hanging Vines under the island */}
        <polygon points="260,280 275,340 290,280" fill="#BC79FF" opacity="0.8" />
        <polygon points="340,260 355,310 365,260" fill="#54F5E7" opacity="0.85" />
        <path d="M160 170 Q150 220 165 240" stroke="#6ea724" strokeWidth="3" strokeLinecap="round" />
        <path d="M480 160 Q495 210 475 235" stroke="#6ea724" strokeWidth="2.5" strokeLinecap="round" />

        {/* Floating Grassy Top Plateau */}
        <path
          d="M60 115 
             C110 95, 200 90, 310 90 
             C420 90, 510 100, 560 120 
             C540 145, 450 155, 310 155 
             C170 155, 80 140, 60 115 Z"
          fill="url(#grassGrad)"
          stroke="#D6FF70"
          strokeWidth="3.5"
        />

        {/* Glowing River / Stream running across the island */}
        <path
          d="M210 100 
             C240 115, 260 125, 300 130 
             C340 135, 370 120, 420 125 
             C390 140, 320 145, 270 138 
             C230 132, 215 115, 210 100 Z"
          fill="url(#streamGlow)"
          filter="drop-shadow(0 0 8px #54F5E7)"
        />

        {/* Stepping Stones across the stream */}
        <ellipse cx="270" cy="126" rx="8" ry="4.5" fill="#f4ebd8" stroke="#11131c" strokeWidth="1.5" />
        <ellipse cx="330" cy="132" rx="10" ry="5.5" fill="#f4ebd8" stroke="#11131c" strokeWidth="1.5" />

        {/* Whimsical Stylized Miniature Pine Trees */}
        {/* Tree 1 (Left) */}
        <g transform="translate(130, 65)">
          <rect x="14" y="28" width="4" height="12" fill="#3b2011" />
          <polygon points="16,4 4,20 28,20" fill="#2d520f" stroke="#D6FF70" strokeWidth="1.5" />
          <polygon points="16,12 2,28 30,28" fill="#3d6d16" stroke="#D6FF70" strokeWidth="1.5" />
        </g>

        {/* Tree 2 (Right) */}
        <g transform="translate(470, 75)">
          <rect x="10" y="24" width="4" height="10" fill="#3b2011" />
          <polygon points="12,2 2,16 22,16" fill="#2d520f" stroke="#D6FF70" strokeWidth="1.5" />
          <polygon points="12,10 0,24 24,24" fill="#3d6d16" stroke="#D6FF70" strokeWidth="1.5" />
        </g>

        {/* Miniature Paper Scraps floating on the grass */}
        <g transform="translate(190, 110) rotate(-12)">
          <rect width="14" height="18" rx="1.5" fill="#F4EBD8" stroke="#08090D" strokeWidth="1.2" />
          <line x1="3" y1="5" x2="11" y2="5" stroke="#FF5CA8" strokeWidth="1" />
          <line x1="3" y1="9" x2="9" y2="9" stroke="#925BFF" strokeWidth="1" />
        </g>

        <g transform="translate(420, 115) rotate(16)">
          <rect width="12" height="16" rx="1.5" fill="#F4EBD8" stroke="#08090D" strokeWidth="1.2" />
          <circle cx="6" cy="8" r="3" fill="#D6FF70" />
        </g>

        {/* Tufts of Grass */}
        <path d="M100 115 L102 108 L106 116" stroke="#D6FF70" strokeWidth="2" strokeLinecap="round" />
        <path d="M230 110 L233 103 L237 111" stroke="#D6FF70" strokeWidth="2" strokeLinecap="round" />
        <path d="M510 118 L513 111 L517 119" stroke="#D6FF70" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </div>
  );
};
