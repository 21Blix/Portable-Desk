import React from 'react';

export interface ProgressBarProps {
  progress?: number; // 0 to 100, or undefined for indeterminate
  label?: string;
  subLabel?: string;
  color?: 'lime' | 'cyan' | 'pink' | 'purple' | 'orange';
  showPercentage?: boolean;
  striped?: boolean;
  height?: number;
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  label,
  subLabel,
  color = 'cyan',
  showPercentage = true,
  striped = true,
  height = 16,
  className = '',
}) => {
  const isIndeterminate = progress === undefined || progress === null;
  const clampedProgress = Math.min(100, Math.max(0, progress ?? 0));

  const colorMap = {
    lime: 'var(--lime-acid)',
    cyan: 'var(--cyan-electric)',
    pink: 'var(--pink-hot)',
    purple: 'var(--purple-goo)',
    orange: 'var(--orange-caution)',
  };

  const activeColor = colorMap[color] || 'var(--cyan-electric)';

  return (
    <div
      className={`custom-progress-container ${className}`}
      style={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
      }}
      role="progressbar"
      aria-valuenow={isIndeterminate ? undefined : clampedProgress}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      {(label || (!isIndeterminate && showPercentage)) && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '0.85rem',
            fontFamily: 'var(--font-mono)',
          }}
        >
          {label && (
            <span
              style={{
                color: 'var(--text-main)',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              {label}
            </span>
          )}
          {!isIndeterminate && showPercentage && (
            <span
              style={{
                color: activeColor,
                fontWeight: 700,
                marginLeft: 'auto',
              }}
            >
              {Math.round(clampedProgress)}%
            </span>
          )}
        </div>
      )}

      {/* Progress Track */}
      <div
        style={{
          width: '100%',
          height: `${height}px`,
          backgroundColor: '#0c0e18',
          borderRadius: `${height / 2}px`,
          border: '1.5px solid rgba(146, 91, 255, 0.4)',
          overflow: 'hidden',
          position: 'relative',
          boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.6)',
        }}
      >
        {/* Progress Fill */}
        <div
          style={{
            height: '100%',
            width: isIndeterminate ? '100%' : `${clampedProgress}%`,
            backgroundColor: activeColor,
            borderRadius: `${height / 2}px`,
            transition: isIndeterminate ? 'none' : 'width 0.25s ease-out',
            boxShadow: `0 0 12px ${activeColor}`,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Animated Stripes */}
          {striped && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundImage: `linear-gradient(
                  45deg,
                  rgba(255, 255, 255, 0.2) 25%,
                  transparent 25%,
                  transparent 50%,
                  rgba(255, 255, 255, 0.2) 50%,
                  rgba(255, 255, 255, 0.2) 75%,
                  transparent 75%,
                  transparent
                )`,
                backgroundSize: '24px 24px',
                animation: 'progress-stripes 1s linear infinite',
              }}
            />
          )}
        </div>
      </div>

      {subLabel && (
        <div
          style={{
            fontSize: '0.78rem',
            color: 'var(--text-muted)',
            fontFamily: 'var(--font-hand)',
            textAlign: 'center',
            marginTop: '2px',
          }}
        >
          {subLabel}
        </div>
      )}
    </div>
  );
};
