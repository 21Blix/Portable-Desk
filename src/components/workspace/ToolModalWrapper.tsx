import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { playClickSound } from '../../lib/audio/sound-effects';

interface ToolModalWrapperProps {
  title: string;
  tagline: string;
  onClose: () => void;
  children: React.ReactNode;
}

export const ToolModalWrapper: React.FC<ToolModalWrapperProps> = ({
  title,
  tagline,
  onClose,
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

        <div className="workspace-body">{children}</div>
      </div>
    </div>
  );
};
