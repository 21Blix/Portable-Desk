import React, { useState } from 'react';
import JSZip from 'jszip';
import { Scissors, FileArchive, CheckSquare } from 'lucide-react';
import type { LoadedFileItem } from '../../components/portal/DropPortal';
import { splitPDF } from '../../lib/pdf/pdf-engine';
import { parsePageRange } from '../../lib/utils/range-parser';
import { getSafeFileArrayBuffer } from '../../lib/utils/file-helpers';
import { DownloadPanel } from '../../components/workspace/DownloadPanel';
import { ProgressBar } from '../../components/common/ProgressBar';
import { playClickSound, playErrorSound, playProcessSound } from '../../lib/audio/sound-effects';

interface SplitWorkspaceProps {
  file: LoadedFileItem;
  onReset: () => void;
}

export const SplitWorkspace: React.FC<SplitWorkspaceProps> = ({ file, onReset }) => {
  const totalPages = file.pageCount || 1;
  const [mode, setMode] = useState<'range' | 'burst' | 'chunks'>('range');
  const [rangeInput, setRangeInput] = useState<string>(`1-${Math.min(totalPages, 3)}`);
  const [chunkSize, setChunkSize] = useState<number>(2);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [splitProgress, setSplitProgress] = useState<{ percent: number; label: string } | null>(null);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [resultFilename, setResultFilename] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // Validate range live
  const parsedRange = parsePageRange(rangeInput, totalPages);

  const handleSplit = async () => {
    try {
      setIsProcessing(true);
      setError(null);
      setSplitProgress({ percent: 0, label: 'Reading document...' });
      playProcessSound();

      const safeBuffer = await getSafeFileArrayBuffer(file);

      const progressCallback = (current: number, total: number, message: string) => {
        setSplitProgress({
          percent: Math.round((current / total) * 100),
          label: message,
        });
      };

      if (mode === 'range') {
        if (!parsedRange.valid) {
          throw new Error(parsedRange.error || 'Invalid range provided.');
        }

        const results = await splitPDF(safeBuffer, file.name, 'range', {
          selectedPages: parsedRange.pages,
          onProgress: progressCallback,
        });

        if (results.length === 1) {
          const blob = new Blob([results[0].data as BlobPart], { type: 'application/pdf' });
          setResultBlob(blob);
          setResultFilename(results[0].filename);
        }
      } else if (mode === 'burst') {
        const results = await splitPDF(safeBuffer, file.name, 'burst', {
          onProgress: progressCallback,
        });
        setSplitProgress({ percent: 90, label: 'Packaging pages into ZIP archive...' });
        const zip = new JSZip();
        for (const item of results) {
          zip.file(item.filename, item.data);
        }
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        setResultBlob(zipBlob);
        setResultFilename(`${file.name.replace(/\.pdf$/i, '')}-all-pages.zip`);
      } else if (mode === 'chunks') {
        const results = await splitPDF(safeBuffer, file.name, 'chunks', {
          chunkSize,
          onProgress: progressCallback,
        });
        setSplitProgress({ percent: 90, label: 'Packaging groups into ZIP archive...' });
        const zip = new JSZip();
        for (const item of results) {
          zip.file(item.filename, item.data);
        }
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        setResultBlob(zipBlob);
        setResultFilename(`${file.name.replace(/\.pdf$/i, '')}-split-parts.zip`);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to split document.');
      playErrorSound();
    } finally {
      setIsProcessing(false);
      setSplitProgress(null);
    }
  };

  if (resultBlob) {
    return (
      <DownloadPanel
        filename={resultFilename}
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
        <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--blue-sky)', fontSize: '1.25rem' }}>
          Split: {file.name}
        </h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Document contains <strong style={{ color: 'var(--lime-acid)' }}>{totalPages} pages</strong>. Select a
          cutting pattern below.
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

      {/* Mode selection pills */}
      <div className="radio-pill-group">
        <button
          className={`radio-pill-label ${mode === 'range' ? 'active' : ''}`}
          onClick={() => {
            playClickSound();
            setMode('range');
          }}
        >
          <Scissors size={16} style={{ display: 'inline', marginRight: 6 }} />
          Extract Page Range
        </button>

        <button
          className={`radio-pill-label ${mode === 'burst' ? 'active' : ''}`}
          onClick={() => {
            playClickSound();
            setMode('burst');
          }}
        >
          <FileArchive size={16} style={{ display: 'inline', marginRight: 6 }} />
          Burst All Pages (Zip)
        </button>

        <button
          className={`radio-pill-label ${mode === 'chunks' ? 'active' : ''}`}
          onClick={() => {
            playClickSound();
            setMode('chunks');
          }}
        >
          <CheckSquare size={16} style={{ display: 'inline', marginRight: 6 }} />
          Split by Fixed Groups
        </button>
      </div>

      {/* Options based on selected mode */}
      <div className="settings-group">
        {mode === 'range' && (
          <div>
            <label className="form-label" style={{ marginBottom: 6 }}>
              <span>Enter Page Numbers or Ranges:</span>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>e.g. 1-3, 5, 8-12</span>
            </label>
            <input
              type="text"
              className="form-input"
              value={rangeInput}
              onChange={(e) => setRangeInput(e.target.value)}
              placeholder="e.g. 1-5 or 1, 3, 5"
            />
            {parsedRange.valid ? (
              <p style={{ color: 'var(--lime-acid)', fontSize: '0.85rem', marginTop: 8 }}>
                ✓ Selected {parsedRange.pages.length} page(s): [{parsedRange.pages.join(', ')}]
              </p>
            ) : (
              <p style={{ color: 'var(--red-coral)', fontSize: '0.85rem', marginTop: 8 }}>
                ✕ {parsedRange.error}
              </p>
            )}
          </div>
        )}

        {mode === 'burst' && (
          <div>
            <p style={{ color: 'var(--text-main)', fontSize: '0.95rem', fontWeight: 600 }}>
              Chops every single page into an independent PDF file.
            </p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: 4 }}>
              Will produce {totalPages} PDF files packaged neatly into a downloadable ZIP archive.
            </p>
          </div>
        )}

        {mode === 'chunks' && (
          <div>
            <label className="form-label" style={{ marginBottom: 8 }}>
              <span>Pages per split file:</span>
              <strong style={{ color: 'var(--cyan-electric)' }}>{chunkSize} pages</strong>
            </label>
            <input
              type="range"
              min="1"
              max={Math.max(2, totalPages)}
              value={chunkSize}
              onChange={(e) => setChunkSize(parseInt(e.target.value, 10))}
              style={{ width: '100%', accentColor: 'var(--cyan-electric)' }}
            />
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: 6 }}>
              Will produce approximately {Math.ceil(totalPages / chunkSize)} separate PDF files packaged into a ZIP.
            </p>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      {isProcessing && splitProgress && (
        <div style={{ marginTop: '8px' }}>
          <ProgressBar
            progress={splitProgress.percent}
            label={splitProgress.label}
            subLabel="Carving and packaging documents in browser RAM..."
            color="cyan"
          />
        </div>
      )}

      <div style={{ textAlign: 'center', marginTop: '10px' }}>
        <button
          className="btn-chunky btn-coral"
          style={{ fontSize: '1.2rem', padding: '14px 40px' }}
          disabled={isProcessing || (mode === 'range' && !parsedRange.valid)}
          onClick={handleSplit}
        >
          {isProcessing ? 'CHOPPING DOCUMENT...' : 'CHOP IT UP!'}
        </button>
      </div>
    </div>
  );
};
