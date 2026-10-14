import React, { useEffect } from 'react';
import { X, RotateCcw } from 'lucide-react';
import { playClickSound } from '../../lib/audio/sound-effects';

interface ToolModalWrapperProps {
  title: string;
  tagline: string;
  onClose: () => void;
  onClearWorkflow?: () => void;
  children: React.ReactNode;
}

export const ToolModalWrapper: React.FC<ToolModalWrapperProps> = ({
  title,
  tagline,
  onClose,
  onClearWorkflow,
  children,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          playClickSound();
          onClose();
        }
      }}
    >
      <div className="workspace-dialog" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <div className="workspace-header">
          <div className="workspace-header-title">
            <h2 id="modal-title">{title}</h2>
            <span className="tag">— {tagline}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {onClearWorkflow && (
              <button
                className="file-action-btn danger"
                onClick={() => {
                  playClickSound();
                  onClearWorkflow();
                }}
                style={{
                  padding: '5px 12px',
                  fontSize: '0.82rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  borderRadius: '16px',
                }}
                title="Exit workspace and clear loaded document"
              >
                <RotateCcw size={14} />
                <span>Clear Workflow</span>
              </button>
            )}
            <button
              className="workspace-close-btn"
              onClick={() => {
                playClickSound();
                onClose();
              }}
              title="Close workspace (Esc)"
              aria-label="Close"
            >
              <X size={26} />
            </button>
          </div>
        </div>

        <div className="workspace-body">{children}</div>
      </div>
    </div>
  );
};
