import React from 'react';
import { Cog, Zap } from 'lucide-react';
import { playClickSound } from '../../lib/audio/sound-effects';

export type MachineStatus = 'idle' | 'ready' | 'working' | 'done' | 'error';

interface ProcessingMachineProps {
  status: MachineStatus;
  buttonLabel?: string;
  disabled?: boolean;
  onProcess: () => void;
}

export const ProcessingMachine: React.FC<ProcessingMachineProps> = ({
  status,
  buttonLabel,
  disabled = false,
  onProcess,
}) => {
  const getButtonText = () => {
    if (buttonLabel) return buttonLabel;
    switch (status) {
      case 'working':
        return 'WORKING...';
      case 'done':
        return 'DONE! ✨';
      case 'error':
        return 'TRY AGAIN 💥';
      default:
        return 'PROCESS!';
    }
  };

  const handleClick = () => {
    if (disabled || status === 'working') return;
    playClickSound();
    onProcess();
  };

  return (
    <div className="processing-machine-box">
      <div className="machine-top-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            className="warning-lamp"
            style={{
              backgroundColor:
                status === 'working'
                  ? 'var(--lime-acid)'
                  : status === 'error'
                  ? 'var(--red-coral)'
                  : status === 'done'
                  ? 'var(--cyan-electric)'
                  : '#591620',
              boxShadow:
                status === 'working'
                  ? '0 0 15px var(--lime-acid)'
                  : status === 'done'
                  ? '0 0 15px var(--cyan-electric)'
                  : 'none',
            }}
          />
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.75rem',
              color: 'var(--text-muted)',
              fontWeight: 700,
            }}
          >
            REACTOR UNIT 4
          </span>
        </div>

        {/* Decorative Steam Vent Holes & Gears */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div className="machine-steam-vent">
            <div className="vent-hole" />
            <div className="vent-hole" />
            <div className="vent-hole" />
          </div>
          <Cog
            size={18}
            color="var(--purple-electric)"
            className={status === 'working' ? 'spin' : ''}
          />
        </div>
      </div>

      {/* Hazard stripe band */}
      <div className="hazard-stripes" style={{ height: '8px', borderRadius: '4px', marginBottom: '16px' }} />

      {/* Physical giant button housing */}
      <div className="machine-button-housing">
        <button
          className="giant-coral-btn"
          disabled={disabled || status === 'working'}
          onClick={handleClick}
          aria-label={getButtonText()}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            {status === 'working' ? (
              <Zap size={22} className="spin" color="var(--lime-acid)" />
            ) : null}
            {getButtonText()}
          </span>
        </button>
        <div className="machine-subtitle">make it happen!</div>
      </div>
    </div>
  );
};
