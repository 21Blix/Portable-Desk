import React from 'react';
import { AlertCircle, CheckCircle2, Sparkles, X } from 'lucide-react';

export interface ToastItem {
  id: string;
  message: string;
  type: 'info' | 'error' | 'success';
}

interface ToastProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '80px',
        right: '24px',
        zIndex: 150,
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        maxWidth: '380px',
        pointerEvents: 'none',
      }}
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          style={{
            pointerEvents: 'auto',
            background:
              t.type === 'error'
                ? '#290c13'
                : t.type === 'success'
                ? '#0d2b17'
                : '#1b1d30',
            border: `2px solid ${
              t.type === 'error'
                ? 'var(--red-coral)'
                : t.type === 'success'
                ? 'var(--lime-acid)'
                : 'var(--cyan-electric)'
            }`,
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.6)',
            borderRadius: '12px',
            padding: '12px 16px',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            animation: 'wobble 0.25s ease-out',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {t.type === 'error' ? (
              <AlertCircle size={20} color="var(--red-coral)" />
            ) : t.type === 'success' ? (
              <CheckCircle2 size={20} color="var(--lime-acid)" />
            ) : (
              <Sparkles size={20} color="var(--cyan-electric)" />
            )}
            <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{t.message}</span>
          </div>
          <button
            onClick={() => onDismiss(t.id)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '2px',
            }}
          >
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
};
