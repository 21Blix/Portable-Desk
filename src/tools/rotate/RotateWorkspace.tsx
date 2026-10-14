import React, { useState, useEffect } from 'react';
import { RotateCw, RotateCcw } from 'lucide-react';
import type { LoadedFileItem } from '../../components/portal/DropPortal';
import { loadPDFDocument, renderPageThumbnail } from '../../lib/pdf/pdfjs-init';
import { rotatePDF } from '../../lib/pdf/pdf-engine';
import { parsePageRange } from '../../lib/utils/range-parser';
import { getSafeFileArrayBuffer } from '../../lib/utils/file-helpers';
import { DownloadPanel } from '../../components/workspace/DownloadPanel';
import { ProgressBar } from '../../components/common/ProgressBar';
import { playClickSound, playErrorSound, playProcessSound } from '../../lib/audio/sound-effects';

interface RotateWorkspaceProps {
  file: LoadedFileItem;
  onReset: () => void;
}

export const RotateWorkspace: React.FC<RotateWorkspaceProps> = ({ file, onReset }) => {
  const totalPages = file.pageCount || 1;
  const [selectMode, setSelectMode] = useState<'all' | 'odd' | 'even' | 'range'>('all');
  const [rangeInput, setRangeInput] = useState<string>('1');
  const [rotationAngle, setRotationAngle] = useState<number>(90);
  const [thumbnails, setThumbnails] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [rotateProgress, setRotateProgress] = useState<{ percent: number; label: string } | null>(null);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;
    getSafeFileArrayBuffer(file)
      .then((buf) => loadPDFDocument(buf))
      .then(async (doc) => {
        if (isCancelled) return;
        const thumbs: string[] = [];
        const limit = Math.min(doc.numPages, 16);
        for (let i = 1; i <= limit; i++) {
          try {
            const url = await renderPageThumbnail(doc, i, 140);
            thumbs.push(url);
          } catch {
            thumbs.push('');
          }
        }
        if (!isCancelled) {
          setThumbnails(thumbs);
        }
      })
      .catch((err) => {
        console.error('Failed to load rotate doc:', err);
      });

    return () => {
      isCancelled = true;
    };
  }, [file]);

  const getTargetPages = (): number[] => {
    if (selectMode === 'all') {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    if (selectMode === 'odd') {
      return Array.from({ length: totalPages }, (_, i) => i + 1).filter((p) => p % 2 !== 0);
    }
    if (selectMode === 'even') {
      return Array.from({ length: totalPages }, (_, i) => i + 1).filter((p) => p % 2 === 0);
    }
    const parsed = parsePageRange(rangeInput, totalPages);
    return parsed.valid ? parsed.pages : [];
  };

  const targetPages = getTargetPages();
  const targetPageSet = new Set(targetPages);

  const handleRotate = async () => {
    if (targetPages.length === 0) {
      setError('No pages selected to rotate.');
      return;
    }

    try {
      setIsProcessing(true);
      setError(null);
      setRotateProgress({ percent: 0, label: 'Initializing orientation gears...' });
      playProcessSound();

      const safeBuffer = await getSafeFileArrayBuffer(file);
      const rotatedBytes = await rotatePDF(safeBuffer, targetPages, rotationAngle, (current, total, message) => {
        setRotateProgress({
          percent: Math.round((current / total) * 100),
          label: message,
        });
      });
      const blob = new Blob([rotatedBytes as BlobPart], { type: 'application/pdf' });
      setResultBlob(blob);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Rotation failed.');
      playErrorSound();
    } finally {
      setIsProcessing(false);
      setRotateProgress(null);
    }
  };

  if (resultBlob) {
    return (
      <DownloadPanel
        filename={`${file.name.replace(/\.pdf$/i, '')}-rotated.pdf`}
        blob={resultBlob}
        newSize={resultBlob.size}
        onReset={() => {
          setResultBlob(null);
          onReset();
        }}
      />
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--red-coral)', fontSize: '1.25rem' }}>
          Rotate Document: {file.name}
        </h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Orient individual or all pages. Active selection applies rotation angle live.
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

      {/* Angle Selector Pills */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>Rotation Angle:</span>
        <button
          className={`radio-pill-label ${rotationAngle === 90 ? 'active' : ''}`}
          onClick={() => {
            playClickSound();
            setRotationAngle(90);
          }}
        >
          <RotateCw size={14} style={{ display: 'inline', marginRight: 4 }} /> 90° Clockwise
        </button>
        <button
          className={`radio-pill-label ${rotationAngle === 180 ? 'active' : ''}`}
          onClick={() => {
            playClickSound();
            setRotationAngle(180);
          }}
        >
          <RotateCw size={14} style={{ display: 'inline', marginRight: 4 }} /> 180° Flip
        </button>
        <button
          className={`radio-pill-label ${rotationAngle === 270 ? 'active' : ''}`}
          onClick={() => {
            playClickSound();
            setRotationAngle(270);
          }}
        >
          <RotateCcw size={14} style={{ display: 'inline', marginRight: 4 }} /> 90° Counter-Clockwise (270°)
        </button>
      </div>

      {/* Target Pages Selector */}
      <div className="settings-group">
        <label className="form-label" style={{ marginBottom: 6 }}>
          <span>Apply to which pages?</span>
          <span style={{ color: 'var(--lime-acid)', fontSize: '0.85rem' }}>
            {targetPages.length} page(s) targeted
          </span>
        </label>
        <div className="radio-pill-group" style={{ marginBottom: 8 }}>
          <button
            className={`radio-pill-label ${selectMode === 'all' ? 'active' : ''}`}
            onClick={() => {
              playClickSound();
              setSelectMode('all');
            }}
          >
            All Pages
          </button>
          <button
            className={`radio-pill-label ${selectMode === 'odd' ? 'active' : ''}`}
            onClick={() => {
              playClickSound();
              setSelectMode('odd');
            }}
          >
            Odd Pages Only
          </button>
          <button
            className={`radio-pill-label ${selectMode === 'even' ? 'active' : ''}`}
            onClick={() => {
              playClickSound();
              setSelectMode('even');
            }}
          >
            Even Pages Only
          </button>
          <button
            className={`radio-pill-label ${selectMode === 'range' ? 'active' : ''}`}
            onClick={() => {
              playClickSound();
              setSelectMode('range');
            }}
          >
            Custom Range
          </button>
        </div>

        {selectMode === 'range' && (
          <input
            type="text"
            className="form-input"
            value={rangeInput}
            onChange={(e) => setRangeInput(e.target.value)}
            placeholder="e.g. 1-2, 5"
          />
        )}
      </div>

      {/* Live Preview Strip */}
      <div
        style={{
          display: 'flex',
          gap: '12px',
          overflowX: 'auto',
          padding: '12px 6px',
          background: '#131522',
          borderRadius: '12px',
          border: '1px solid rgba(146, 91, 255, 0.3)',
        }}
      >
        {thumbnails.map((thumb, idx) => {
          const pageNum = idx + 1;
          const isTargeted = targetPageSet.has(pageNum);
          return (
            <div
              key={idx}
              style={{
                width: '100px',
                height: '130px',
                background: '#090a10',
                borderRadius: '8px',
                padding: '6px',
                flexShrink: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                border: isTargeted ? '2px solid var(--lime-acid)' : '1px solid #333',
                opacity: isTargeted ? 1 : 0.45,
                boxShadow: isTargeted ? '0 0 10px rgba(214, 255, 112, 0.3)' : 'none',
              }}
            >
              <div
                style={{
                  width: '100%',
                  height: '90px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  background: '#fff',
                  borderRadius: '4px',
                }}
              >
                {thumb && (
                  <img
                    src={thumb}
                    alt={`Page ${pageNum}`}
                    style={{
                      maxWidth: '100%',
                      maxHeight: '100%',
                      objectFit: 'contain',
                      transform: isTargeted ? `rotate(${rotationAngle}deg)` : 'none',
                      transition: 'transform 0.25s ease',
                    }}
                  />
                )}
              </div>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, marginTop: '6px', color: '#fff' }}>
                Page {pageNum} {isTargeted && `(+${rotationAngle}°)`}
              </span>
            </div>
          );
        })}
      </div>

      {/* Progress Bar */}
      {isProcessing && rotateProgress && (
        <div style={{ marginTop: '8px' }}>
          <ProgressBar
            progress={rotateProgress.percent}
            label={rotateProgress.label}
            subLabel="Reorienting PDF coordinate matrices in browser RAM..."
            color="pink"
          />
        </div>
      )}

      <div style={{ textAlign: 'center', marginTop: '10px' }}>
        <button
          className="btn-chunky btn-coral"
          style={{ fontSize: '1.2rem', padding: '14px 40px' }}
          disabled={isProcessing || targetPages.length === 0}
          onClick={handleRotate}
        >
          {isProcessing ? 'SPINNING PAGES...' : `SPIN ${targetPages.length} PAGES!`}
        </button>
      </div>
    </div>
  );
};
