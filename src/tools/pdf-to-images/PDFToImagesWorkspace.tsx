import React, { useState } from 'react';
import type { LoadedFileItem } from '../../components/portal/DropPortal';
import { convertPDFToImages, packageImagesAsZip } from '../../lib/pdf/pdf-to-images-engine';
import { parsePageRange } from '../../lib/utils/range-parser';
import { getSafeFileArrayBuffer } from '../../lib/utils/file-helpers';
import { DownloadPanel } from '../../components/workspace/DownloadPanel';
import { ProgressBar } from '../../components/common/ProgressBar';
import { playClickSound, playErrorSound, playProcessSound } from '../../lib/audio/sound-effects';

interface PDFToImagesWorkspaceProps {
  file: LoadedFileItem;
  onReset: () => void;
}

export const PDFToImagesWorkspace: React.FC<PDFToImagesWorkspaceProps> = ({ file, onReset }) => {
  const totalPages = file.pageCount || 1;
  const [format, setFormat] = useState<'image/jpeg' | 'image/png'>('image/jpeg');
  const [quality, setQuality] = useState<number>(0.85);
  const [scale, setScale] = useState<number>(1.5);
  const [rangeMode, setRangeMode] = useState<'all' | 'custom'>('all');
  const [rangeInput, setRangeInput] = useState<string>(`1-${totalPages}`);
  const [convertProgress, setConvertProgress] = useState<{ percent: number; label: string } | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [resultZip, setResultZip] = useState<{ blob: Blob; filename: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const parsedRange = parsePageRange(rangeInput, totalPages);

  const handleConvert = async () => {
    try {
      setIsProcessing(true);
      setError(null);
      playProcessSound();

      let targetPages: number[] | undefined = undefined;
      if (rangeMode === 'custom') {
        if (!parsedRange.valid) {
          throw new Error(parsedRange.error || 'Invalid page range');
        }
        targetPages = parsedRange.pages;
      }

      const safeBuffer = await getSafeFileArrayBuffer(file);

      const results = await convertPDFToImages(safeBuffer, file.name, {
        format,
        quality,
        scale,
        pages: targetPages,
        onProgress: (cur, tot) => {
          setConvertProgress({
            percent: Math.round((cur / tot) * 100),
            label: `Rendering high-res page ${cur} of ${tot}...`,
          });
        },
      });

      if (results.length === 1) {
        setResultZip({
          blob: results[0].blob,
          filename: results[0].filename,
        });
      } else {
        setConvertProgress({ percent: 95, label: 'Packaging images into ZIP...' });
        const zipBlob = await packageImagesAsZip(
          results,
          `${file.name.replace(/\.pdf$/i, '')}-images.zip`
        );
        setResultZip({
          blob: zipBlob,
          filename: `${file.name.replace(/\.pdf$/i, '')}-images.zip`,
        });
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Conversion failed.');
      playErrorSound();
    } finally {
      setIsProcessing(false);
      setConvertProgress(null);
    }
  };

  if (resultZip) {
    return (
      <DownloadPanel
        filename={resultZip.filename}
        blob={resultZip.blob}
        newSize={resultZip.blob.size}
        onReset={() => {
          setResultZip(null);
          onReset();
        }}
      />
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--purple-goo)', fontSize: '1.25rem' }}>
          PDF to Images: {file.name}
        </h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Render document pages directly to high-resolution JPEG or PNG images.
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

      {/* Settings Grid */}
      <div className="settings-group">
        {/* Format & Scale */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <label className="form-label" style={{ marginBottom: 6 }}>
              <span>Output Format:</span>
            </label>
            <div className="radio-pill-group">
              <button
                className={`radio-pill-label ${format === 'image/jpeg' ? 'active' : ''}`}
                onClick={() => {
                  playClickSound();
                  setFormat('image/jpeg');
                }}
              >
                JPEG (Smaller file)
              </button>
              <button
                className={`radio-pill-label ${format === 'image/png' ? 'active' : ''}`}
                onClick={() => {
                  playClickSound();
                  setFormat('image/png');
                }}
              >
                PNG (Lossless)
              </button>
            </div>
          </div>

          <div>
            <label className="form-label" style={{ marginBottom: 6 }}>
              <span>Resolution Quality:</span>
            </label>
            <div className="radio-pill-group">
              <button
                className={`radio-pill-label ${scale === 1.0 ? 'active' : ''}`}
                onClick={() => {
                  playClickSound();
                  setScale(1.0);
                }}
              >
                1.0x (Standard)
              </button>
              <button
                className={`radio-pill-label ${scale === 1.5 ? 'active' : ''}`}
                onClick={() => {
                  playClickSound();
                  setScale(1.5);
                }}
              >
                1.5x (Crisp)
              </button>
              <button
                className={`radio-pill-label ${scale === 2.0 ? 'active' : ''}`}
                onClick={() => {
                  playClickSound();
                  setScale(2.0);
                }}
              >
                2.0x (Ultra Hi-Res)
              </button>
            </div>
          </div>
        </div>

        {/* JPEG Quality Slider */}
        {format === 'image/jpeg' && (
          <div>
            <label className="form-label" style={{ marginBottom: 6 }}>
              <span>JPEG Compression Quality:</span>
              <strong style={{ color: 'var(--lime-acid)' }}>{Math.round(quality * 100)}%</strong>
            </label>
            <input
              type="range"
              min="0.4"
              max="1.0"
              step="0.05"
              value={quality}
              onChange={(e) => setQuality(parseFloat(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--lime-acid)' }}
            />
          </div>
        )}

        {/* Page Range Selection */}
        <div>
          <label className="form-label" style={{ marginBottom: 6 }}>
            <span>Pages to Convert:</span>
          </label>
          <div className="radio-pill-group" style={{ marginBottom: 10 }}>
            <button
              className={`radio-pill-label ${rangeMode === 'all' ? 'active' : ''}`}
              onClick={() => {
                playClickSound();
                setRangeMode('all');
              }}
            >
              All Pages ({totalPages})
            </button>
            <button
              className={`radio-pill-label ${rangeMode === 'custom' ? 'active' : ''}`}
              onClick={() => {
                playClickSound();
                setRangeMode('custom');
              }}
            >
              Custom Range
            </button>
          </div>

          {rangeMode === 'custom' && (
            <input
              type="text"
              className="form-input"
              value={rangeInput}
              onChange={(e) => setRangeInput(e.target.value)}
              placeholder="e.g. 1-3, 5"
            />
          )}
        </div>
      </div>

      {/* Progress Bar */}
      {isProcessing && convertProgress && (
        <div style={{ marginTop: '8px' }}>
          <ProgressBar
            progress={convertProgress.percent}
            label={convertProgress.label}
            subLabel="Converting vector document pages to raster images..."
            color="purple"
          />
        </div>
      )}

      <div style={{ textAlign: 'center', marginTop: '10px' }}>
        <button
          className="btn-chunky btn-coral"
          style={{ fontSize: '1.2rem', padding: '14px 40px' }}
          disabled={isProcessing || (rangeMode === 'custom' && !parsedRange.valid)}
          onClick={handleConvert}
        >
          {isProcessing ? 'CONVERTING TO PICTURES...' : 'TURN PAGES INTO PICS!'}
        </button>
      </div>
    </div>
  );
};
