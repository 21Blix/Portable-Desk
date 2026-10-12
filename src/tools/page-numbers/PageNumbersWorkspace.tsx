import React, { useState } from 'react';
import type { LoadedFileItem } from '../../components/portal/DropPortal';
import { addPageNumbers, type PageNumberOptions, type PageNumberPosition } from '../../lib/pdf/pdf-engine';
import { getSafeFileArrayBuffer } from '../../lib/utils/file-helpers';
import { DownloadPanel } from '../../components/workspace/DownloadPanel';
import { playClickSound, playErrorSound, playProcessSound } from '../../lib/audio/sound-effects';

interface PageNumbersWorkspaceProps {
  file: LoadedFileItem;
  onReset: () => void;
}

export const PageNumbersWorkspace: React.FC<PageNumbersWorkspaceProps> = ({ file, onReset }) => {
  const totalPages = file.pageCount || 1;
  const [format, setFormat] = useState<'{n}' | 'Page {n}' | '{n} / {total}' | '- {n} -'>('Page {n}');
  const [position, setPosition] = useState<PageNumberPosition>('bottom-center');
  const [fontSize, setFontSize] = useState<number>(11);
  const [textColorHex, setTextColorHex] = useState<string>('#11131c');
  const [marginOffset, setMarginOffset] = useState<number>(24);
  const [startNumber, setStartNumber] = useState<number>(1);
  const [startFromPage, setStartFromPage] = useState<number>(1);
  const [skipCover, setSkipCover] = useState<boolean>(false);

  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);

  const positionsList: { id: PageNumberPosition; label: string }[] = [
    { id: 'top-left', label: 'Top Left' },
    { id: 'top-center', label: 'Top Center' },
    { id: 'top-right', label: 'Top Right' },
    { id: 'bottom-left', label: 'Bottom Left' },
    { id: 'bottom-center', label: 'Bottom Center' },
    { id: 'bottom-right', label: 'Bottom Right' },
  ];

  const handleApply = async () => {
    try {
      setIsProcessing(true);
      setError(null);
      playProcessSound();

      const options: PageNumberOptions = {
        format,
        position,
        fontSize,
        textColorHex,
        marginOffset,
        startNumber,
        startFromPage,
        skipCover,
      };

      const safeBuffer = await getSafeFileArrayBuffer(file);
      const numberedBytes = await addPageNumbers(safeBuffer, options);
      const blob = new Blob([numberedBytes as BlobPart], { type: 'application/pdf' });
      setResultBlob(blob);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to add page numbers.');
      playErrorSound();
    } finally {
      setIsProcessing(false);
    }
  };

  if (resultBlob) {
    return (
      <DownloadPanel
        filename={`${file.name.replace(/\.pdf$/i, '')}-numbered.pdf`}
        blob={resultBlob}
        newSize={resultBlob.size}
        onReset={() => {
          setResultBlob(null);
          onReset();
        }}
      />
    );
  }

  // Preview sample string
  const sampleText = format.replace('{n}', String(startNumber)).replace('{total}', String(totalPages));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--cyan-electric)', fontSize: '1.25rem' }}>
          Stamp Page Numbers: {file.name}
        </h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Precisely imprint sequential numbers across {totalPages} pages.
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

      {/* Position Matrix & Format */}
      <div className="settings-group">
        <div>
          <label className="form-label" style={{ marginBottom: 6 }}>
            <span>Position Anchor:</span>
          </label>
          <div className="radio-pill-group">
            {positionsList.map((p) => (
              <button
                key={p.id}
                className={`radio-pill-label ${position === p.id ? 'active' : ''}`}
                onClick={() => {
                  playClickSound();
                  setPosition(p.id);
                }}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="form-label" style={{ marginBottom: 6 }}>
            <span>Numbering Format:</span>
          </label>
          <div className="radio-pill-group">
            <button
              className={`radio-pill-label ${format === 'Page {n}' ? 'active' : ''}`}
              onClick={() => setFormat('Page {n}')}
            >
              Page 1
            </button>
            <button
              className={`radio-pill-label ${format === '{n}' ? 'active' : ''}`}
              onClick={() => setFormat('{n}')}
            >
              1 (Number Only)
            </button>
            <button
              className={`radio-pill-label ${format === '{n} / {total}' ? 'active' : ''}`}
              onClick={() => setFormat('{n} / {total}')}
            >
              1 / {totalPages}
            </button>
            <button
              className={`radio-pill-label ${format === '- {n} -' ? 'active' : ''}`}
              onClick={() => setFormat('- {n} -')}
            >
              - 1 -
            </button>
          </div>
        </div>

        {/* Visual Stamp Preview */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '8px',
            height: '140px',
            position: 'relative',
            border: '2px dashed var(--purple-goo)',
            boxShadow: '0 4px 14px rgba(0,0,0,0.5)',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: position.startsWith('top') ? `${marginOffset / 2}px` : undefined,
              bottom: position.startsWith('bottom') ? `${marginOffset / 2}px` : undefined,
              left: position.includes('left')
                ? `${marginOffset / 2}px`
                : position.includes('center')
                ? '50%'
                : undefined,
              right: position.includes('right') ? `${marginOffset / 2}px` : undefined,
              transform: position.includes('center') ? 'translateX(-50%)' : undefined,
              color: textColorHex,
              fontSize: `${fontSize}px`,
              fontFamily: 'Helvetica, Arial, sans-serif',
              fontWeight: 600,
              padding: '2px 6px',
              border: '1px dashed rgba(84, 245, 231, 0.6)',
              borderRadius: '2px',
              backgroundColor: 'rgba(84, 245, 231, 0.1)',
            }}
          >
            {sampleText}
          </div>
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              color: '#8c90a8',
              fontFamily: 'var(--font-hand)',
              fontSize: '1.25rem',
            }}
          >
            (Document Page Canvas)
          </div>
        </div>

        {/* Font size, Margin, Colors, Skip Cover */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
          <div>
            <label className="form-label" style={{ marginBottom: 4 }}>
              <span>Font Size:</span>
              <strong style={{ color: 'var(--cyan-electric)' }}>{fontSize} pt</strong>
            </label>
            <input
              type="range"
              min="8"
              max="18"
              value={fontSize}
              onChange={(e) => setFontSize(parseInt(e.target.value, 10))}
              style={{ width: '100%', accentColor: 'var(--cyan-electric)' }}
            />
          </div>

          <div>
            <label className="form-label" style={{ marginBottom: 4 }}>
              <span>Margin Offset:</span>
              <strong style={{ color: 'var(--cyan-electric)' }}>{marginOffset} pt</strong>
            </label>
            <input
              type="range"
              min="10"
              max="50"
              value={marginOffset}
              onChange={(e) => setMarginOffset(parseInt(e.target.value, 10))}
              style={{ width: '100%', accentColor: 'var(--cyan-electric)' }}
            />
          </div>

          <div>
            <label className="form-label" style={{ marginBottom: 4 }}>
              <span>Text Color:</span>
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {['#11131c', '#ffffff', '#54f5e7', '#ff5ca8'].map((col) => (
                <div
                  key={col}
                  onClick={() => setTextColorHex(col)}
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    backgroundColor: col,
                    cursor: 'pointer',
                    border: textColorHex === col ? '3px solid var(--lime-acid)' : '1px solid #444',
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginTop: '4px' }}>
          <div>
            <label className="form-label" style={{ marginBottom: 4 }}>
              <span>First Number in Sequence:</span>
            </label>
            <input
              type="number"
              min="1"
              value={startNumber}
              onChange={(e) => setStartNumber(Math.max(1, parseInt(e.target.value, 10) || 1))}
              className="form-input"
              style={{ padding: '6px 12px' }}
            />
          </div>

          <div>
            <label className="form-label" style={{ marginBottom: 4 }}>
              <span>Start Stamping from Page:</span>
            </label>
            <input
              type="number"
              min="1"
              max={totalPages}
              value={startFromPage}
              onChange={(e) => setStartFromPage(Math.max(1, parseInt(e.target.value, 10) || 1))}
              className="form-input"
              style={{ padding: '6px 12px' }}
            />
          </div>
        </div>

        {/* Skip cover check */}
        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', marginTop: '6px' }}>
          <input
            type="checkbox"
            checked={skipCover}
            onChange={(e) => setSkipCover(e.target.checked)}
            style={{ width: '18px', height: '18px', accentColor: 'var(--purple-electric)' }}
          />
          <span style={{ fontSize: '0.9rem', color: 'var(--text-main)', fontWeight: 600 }}>
            Skip stamping page 1 (cover page)
          </span>
        </label>
      </div>

      <div style={{ textAlign: 'center', marginTop: '10px' }}>
        <button
          className="btn-chunky btn-coral"
          style={{ fontSize: '1.2rem', padding: '14px 40px' }}
          disabled={isProcessing}
          onClick={handleApply}
        >
          {isProcessing ? 'STAMPING IN PROGRESS...' : 'STAMP PAGE NUMBERS!'}
        </button>
      </div>
    </div>
  );
};
