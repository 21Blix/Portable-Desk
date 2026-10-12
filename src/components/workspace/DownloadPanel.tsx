import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Download, RefreshCw, Sparkles, ArrowRight } from 'lucide-react';
import { formatBytes, downloadBlob } from '../../lib/utils/file-helpers';
import { playSuccessSound, playClickSound } from '../../lib/audio/sound-effects';

interface DownloadPanelProps {
  filename: string;
  blob: Blob;
  originalSize?: number;
  newSize?: number;
  sizeLabel?: string;
  onReset: () => void;
  onContinueWithOutput?: (blob: Blob, filename: string) => void;
}

export const DownloadPanel: React.FC<DownloadPanelProps> = ({
  filename,
  blob,
  originalSize,
  newSize,
  sizeLabel,
  onReset,
  onContinueWithOutput,
}) => {
  useEffect(() => {
    playSuccessSound();
    // Whimsical neon confetti explosion
    try {
      confetti({
        particleCount: 80,
        spread: 90,
        origin: { y: 0.6 },
        colors: ['#D6FF70', '#54F5E7', '#FF5CA8', '#BC79FF', '#FFA834'],
      });
    } catch {
      // Ignore if canvas-confetti fails in restricted environments
    }
  }, []);

  const handleDownload = () => {
    playClickSound();
    downloadBlob(blob, filename);
  };

  return (
    <div className="download-panel">
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Sparkles size={28} color="var(--lime-acid)" />
        <span className="download-celebration-title">VICTORY OVER PAPER!</span>
      </div>

      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.1rem', color: '#fff', fontWeight: 700 }}>
        📄 {filename}
      </div>

      {sizeLabel ? (
        <div className="size-comparison-badge">{sizeLabel}</div>
      ) : newSize ? (
        <div className="size-comparison-badge">Output size: {formatBytes(newSize)}</div>
      ) : (
        <div className="size-comparison-badge">Ready for download ({formatBytes(blob.size)})</div>
      )}

      {originalSize && newSize && (
        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          Original: {formatBytes(originalSize)} ➔ Result: {formatBytes(newSize)}
        </div>
      )}

      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center', marginTop: '12px' }}>
        <button className="btn-chunky btn-coral" onClick={handleDownload} style={{ fontSize: '1.15rem' }}>
          <Download size={22} /> DOWNLOAD NOW
        </button>

        {onContinueWithOutput && filename.endsWith('.pdf') && (
          <button
            className="btn-chunky btn-lime"
            onClick={() => {
              playClickSound();
              onContinueWithOutput(blob, filename);
            }}
          >
            USE IN ANOTHER TOOL <ArrowRight size={18} />
          </button>
        )}

        <button
          className="btn-chunky btn-dark"
          onClick={() => {
            playClickSound();
            onReset();
          }}
        >
          <RefreshCw size={18} /> START OVER
        </button>
      </div>
    </div>
  );
};
