import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, Sparkles, Eye, Info, RotateCcw } from 'lucide-react';
import { isSoundEnabled, setSoundEnabled, playClickSound } from '../../lib/audio/sound-effects';

interface NavbarProps {
  onOpenAbout: () => void;
  onResetDesk: () => void;
  hasActiveFiles?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenAbout, onResetDesk, hasActiveFiles = false }) => {
  const [soundOn, setSoundOn] = useState<boolean>(false);
  const [reducedMotion, setReducedMotion] = useState<boolean>(false);

  useEffect(() => {
    setSoundOn(isSoundEnabled());
    const storedMotion = localStorage.getItem('portable_desk_reduced_motion') === 'true';
    setReducedMotion(storedMotion);
    if (storedMotion) {
      document.documentElement.setAttribute('data-reduced-motion', 'true');
    }
  }, []);

  const toggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    setSoundEnabled(next);
    if (next) playClickSound();
  };

  const toggleMotion = () => {
    const next = !reducedMotion;
    setReducedMotion(next);
    localStorage.setItem('portable_desk_reduced_motion', next ? 'true' : 'false');
    if (next) {
      document.documentElement.setAttribute('data-reduced-motion', 'true');
    } else {
      document.documentElement.removeAttribute('data-reduced-motion');
    }
    if (soundOn) playClickSound();
  };

  return (
    <header className="scene-navbar">
      <div className="brand-wrapper" onClick={onResetDesk} title="Click to return to home">
        <svg className="brand-icon" viewBox="0 0 64 64" fill="none">
          <circle cx="32" cy="32" r="28" fill="#925BFF" opacity="0.3" filter="blur(8px)" />
          <g transform="rotate(-4 32 32)">
            <path
              d="M16 10 H40 L50 20 V52 C50 54.2 48.2 56 46 56 H16 C13.8 56 12 54.2 12 52 V14 C12 11.8 13.8 10 16 10 Z"
              fill="#F4EBD8"
              stroke="#D6FF70"
              strokeWidth="3"
              strokeLinejoin="round"
            />
            <path d="M40 10 V20 H50 Z" fill="#D6FF70" stroke="#08090D" strokeWidth="2" />
            <circle cx="26" cy="32" r="3" fill="#08090D" />
            <circle cx="38" cy="32" r="3" fill="#08090D" />
            <circle cx="22" cy="36" r="1.5" fill="#FF5CA8" />
            <circle cx="42" cy="36" r="1.5" fill="#FF5CA8" />
            <path d="M28 38 Q32 43 36 38" stroke="#08090D" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          </g>
        </svg>
        <div className="brand-text">
          <h1>PORTABLE DESK</h1>
          <span className="brand-subtitle">pdfs are so goated</span>
        </div>
      </div>

      <nav className="nav-actions">
        {hasActiveFiles && (
          <button
            className="nav-clear-btn"
            onClick={() => {
              if (soundOn) playClickSound();
              onResetDesk();
            }}
            title="Remove current files and clear workflow"
            style={{
              background: 'rgba(255, 92, 168, 0.15)',
              border: '1.5px solid var(--pink-hot)',
              color: '#ffffff',
              padding: '5px 12px',
              borderRadius: '20px',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 0 10px rgba(255, 92, 168, 0.3)',
            }}
          >
            <RotateCcw size={14} color="var(--pink-hot)" />
            <span>Clear Workflow</span>
          </button>
        )}

        <button
          className={`icon-toggle-btn ${soundOn ? 'active' : ''}`}
          onClick={toggleSound}
          title={soundOn ? 'Sound effects enabled (click to mute)' : 'Sound effects muted (click to enable)'}
          aria-label="Toggle Sound Effects"
        >
          {soundOn ? <Volume2 size={18} /> : <VolumeX size={18} />}
        </button>

        <button
          className={`icon-toggle-btn ${reducedMotion ? 'active' : ''}`}
          onClick={toggleMotion}
          title={reducedMotion ? 'Reduced motion active (click for animations)' : 'Animations active (click for reduced motion)'}
          aria-label="Toggle Reduced Motion"
        >
          {reducedMotion ? <Eye size={18} /> : <Sparkles size={18} />}
        </button>

        <button
          className="icon-toggle-btn"
          onClick={() => {
            if (soundOn) playClickSound();
            onOpenAbout();
          }}
          title="About this nonsense & privacy"
          aria-label="About Portable Desk"
        >
          <Info size={18} />
        </button>

        <a
          href="https://github.com/21Blix/Portable-Desk"
          target="_blank"
          rel="noopener noreferrer"
          className="icon-toggle-btn"
          title="Source code on GitHub (21Blix/Portable-Desk)"
          aria-label="GitHub Repository (21Blix/Portable-Desk)"
          onClick={() => {
            if (soundOn) playClickSound();
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
            <path d="M9 18c-4.51 2-5-2-7-2" />
          </svg>
        </a>
      </nav>
    </header>
  );
};
