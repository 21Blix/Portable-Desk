import React, { useState } from 'react';
import { playClickSound } from '../../lib/audio/sound-effects';

interface FooterProps {
  operationsCount: number;
}

export const Footer: React.FC<FooterProps> = ({ operationsCount }) => {
  const [coffees, setCoffees] = useState<number>(1);
  const [coffeeMsg, setCoffeeMsg] = useState<string>('');

  const coffeeJokes = [
    'Refilled! Paper work requires liquid sanity.',
    'Careful, don’t spill on the PDFs!',
    'A fresh roast. Now we can rotate 1,000 more pages.',
    'Warning: Highly caffeinated PDF algorithms detected.',
    'Another cup downed. The portal is vibrating faster.',
  ];

  const handleCoffeeClick = () => {
    playClickSound();
    const nextCount = coffees + 1;
    setCoffees(nextCount);
    const msg = coffeeJokes[(nextCount - 2) % coffeeJokes.length];
    setCoffeeMsg(msg);
    setTimeout(() => setCoffeeMsg(''), 4000);
  };

  return (
    <footer className="scene-footer">
      <div className="checkerboard-strip" style={{ marginBottom: 20 }} />
      <div className="footer-content">
        <div className="footer-tags">
          <span className="footer-badge">100% FREE</span>
          <span className="footer-badge">100% IN YOUR BROWSER</span>
          <span className="footer-badge" style={{ color: 'var(--pink-hot)', borderColor: 'var(--pink-hot)' }}>
            100% UNNECESSARY
          </span>
          {operationsCount > 0 && (
            <span className="footer-badge" style={{ color: 'var(--lime-acid)', borderColor: 'var(--lime-acid)' }}>
              ⚡ {operationsCount} operation{operationsCount > 1 ? 's' : ''} completed!
            </span>
          )}
        </div>

        <div style={{ position: 'relative' }}>
          <button
            className="coffee-cup-btn"
            onClick={handleCoffeeClick}
            title="Click to refill developer coffee"
            aria-label="Refill coffee cup"
          >
            ☕ {coffees} {coffees === 1 ? 'coffee' : 'coffees'}
          </button>
          {coffeeMsg && (
            <div
              className="sticky-note"
              style={{
                position: 'absolute',
                bottom: '120%',
                right: 0,
                whiteSpace: 'nowrap',
                zIndex: 30,
              }}
            >
              {coffeeMsg}
            </div>
          )}
        </div>
      </div>
    </footer>
  );
};
