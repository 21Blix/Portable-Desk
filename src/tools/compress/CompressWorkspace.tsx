import React, { useState } from 'react';
import { Minimize2, ShieldCheck, Image as ImageIcon, Sliders } from 'lucide-react';
import type { LoadedFileItem } from '../../components/portal/DropPortal';
import { compressPDF, type CompressionPreset, type CompressResult } from '../../lib/pdf/pdf-compress-engine';
import { formatBytes, getSafeFileArrayBuffer } from '../../lib/utils/file-helpers';
import { DownloadPanel } from '../../components/workspace/DownloadPanel';
import { playClickSound, playErrorSound, playProcessSound } from '../../lib/audio/sound-effects';

interface CompressWorkspaceProps {
  file: LoadedFileItem;
  onReset: () => void;
}

export const CompressWorkspace: React.FC<CompressWorkspaceProps> = ({ file, onReset }) => {
  const [preset, setPreset] = useState<CompressionPreset>('medium');
  const [quality, setQuality] = useState<number>(0.75);
  const [progressMsg, setProgressMsg] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [result, setResult] = useState<CompressResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCompress = async () => {
    try {
      setIsProcessing(true);
      setError(null);
      setProgressMsg('Initializing squeezer gears...');
      playProcessSound();

      const safeBuffer = await getSafeFileArrayBuffer(file);

      const res = await compressPDF(safeBuffer, {
        preset,
        quality,
        onProgress: (current, total) => {
          setProgressMsg(`Downsampling page ${current} of ${total}...`);
        },
      });

      setResult(res);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Compression failed.');
      playErrorSound();
    } finally {
      setIsProcessing(false);
      setProgressMsg('');
    }
  };

  if (result) {
    const blob = new Blob([result.data as BlobPart], { type: 'application/pdf' });
    return (
      <DownloadPanel
        filename={`${file.name.replace(/\.pdf$/i, '')}-compressed.pdf`}
        blob={blob}
        originalSize={result.originalSize}
        newSize={result.newSize}
        sizeLabel={result.delta.label}
        onReset={() => {
          setResult(null);
          onReset();
        }}
      />
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--orange-caution)', fontSize: '1.25rem' }}>
          Document Squeezer: {file.name}
        </h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Original size: <strong style={{ color: 'var(--cyan-electric)' }}>{formatBytes(file.size)}</strong>
        </p>
      </div>

      {error && (
        <div
          style={{
            background: '#300f18',
            border: '1.5px solid var(--red-coral)',
            borderRadius: '8px',
            padding: '10px 14px',
            color: '#fff',
            fontSize: '0.9rem',
          }}
        >
          ⚠️ {error}
        </div>
      )}

      {/* Preset Selection Pills */}
      <div className="radio-pill-group">
        <button
          className={`radio-pill-label ${preset === 'clean' ? 'active' : ''}`}
          onClick={() => {
            playClickSound();
            setPreset('clean');
          }}
        >
          <ShieldCheck size={16} style={{ display: 'inline', marginRight: 6 }} />
          Lossless Clean (No rasterization)
        </button>

        <button
          className={`radio-pill-label ${preset === 'high' ? 'active' : ''}`}
          onClick={() => {
            playClickSound();
            setPreset('high');
          }}
        >
          <ImageIcon size={16} style={{ display: 'inline', marginRight: 6 }} />
          High Quality (150 DPI)
        </button>

        <button
          className={`radio-pill-label ${preset === 'medium' ? 'active' : ''}`}
          onClick={() => {
            playClickSound();
            setPreset('medium');
          }}
        >
          <Minimize2 size={16} style={{ display: 'inline', marginRight: 6 }} />
          Balanced (100 DPI)
        </button>

        <button
          className={`radio-pill-label ${preset === 'low' ? 'active' : ''}`}
          onClick={() => {
            playClickSound();
            setPreset('low');
          }}
        >
          <Sliders size={16} style={{ display: 'inline', marginRight: 6 }} />
          Maximum Squeeze (72 DPI)
        </button>
      </div>

      {/* Explanations & Options */}
      <div className="settings-group">
        {preset === 'clean' ? (
          <div>
            <div className="settings-group-title">
              <ShieldCheck size={20} /> Lossless Structure Repacking
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: 6 }}>
              Preserves text vectors, sharp line art, and typography. Strips orphaned metadata and redundant
              PDF cross-reference objects. Note: If the PDF is already streamlined, size savings may be minimal.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="settings-group-title">
              <Minimize2 size={20} /> Canvas Downsampling &amp; Recompression
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Downsamples pages to raster images at selected DPI. Best for scanned documents, presentations,
              and image-heavy PDFs.
            </p>

            <div>
              <label className="form-label" style={{ marginBottom: 6 }}>
                <span>JPEG Image Quality:</span>
                <strong style={{ color: 'var(--lime-acid)' }}>{Math.round(quality * 100)}%</strong>
              </label>
              <input
                type="range"
                min="0.3"
                max="0.95"
                step="0.05"
                value={quality}
                onChange={(e) => setQuality(parseFloat(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--lime-acid)' }}
              />
            </div>
          </div>
        )}
      </div>

      {progressMsg && (
        <div style={{ textAlign: 'center', fontFamily: 'var(--font-hand)', color: 'var(--lime-acid)', fontSize: '1.2rem' }}>
          ⚙️ {progressMsg}
        </div>
      )}

      <div style={{ textAlign: 'center', marginTop: '10px' }}>
        <button
          className="btn-chunky btn-coral"
          style={{ fontSize: '1.2rem', padding: '14px 40px' }}
          disabled={isProcessing}
          onClick={handleCompress}
        >
          {isProcessing ? 'SQUEEZING DOCUMENT...' : 'SQUEEZE IT DOWN!'}
        </button>
      </div>
    </div>
  );
};
