import React, { useState } from 'react';
import type { LoadedFileItem } from '../../components/portal/DropPortal';
import {
  addPageNumbers,
  type PageNumberOptions,
  type PageNumberPosition,
  type PageNumberFont,
} from '../../lib/pdf/pdf-engine';
import { getSafeFileArrayBuffer } from '../../lib/utils/file-helpers';
import { DownloadPanel } from '../../components/workspace/DownloadPanel';
import { ProgressBar } from '../../components/common/ProgressBar';
import { playClickSound, playErrorSound, playProcessSound } from '../../lib/audio/sound-effects';
import { Pipette, Type } from 'lucide-react';

interface PageNumbersWorkspaceProps {
  file: LoadedFileItem;
  onReset: () => void;
}

const PRESET_COLORS = [
  { hex: '#11131c', label: 'Obsidian' },
  { hex: '#ffffff', label: 'Paper White' },
  { hex: '#54f5e7', label: 'Electric Cyan' },
  { hex: '#ff5ca8', label: 'Hot Pink' },
  { hex: '#d6ff70', label: 'Acid Lime' },
  { hex: '#ff5555', label: 'Coral Red' },
  { hex: '#3b82f6', label: 'Sky Blue' },
  { hex: '#a855f7', label: 'Magic Purple' },
  { hex: '#f59e0b', label: 'Amber Orange' },
];

const FONT_OPTIONS: { id: PageNumberFont; label: string; cssFont: string }[] = [
  { id: 'Helvetica', label: 'Helvetica (Clean Sans)', cssFont: 'Helvetica, Arial, sans-serif' },
  { id: 'Helvetica-Bold', label: 'Helvetica Bold', cssFont: 'Helvetica, Arial, sans-serif' },
  { id: 'Times-Roman', label: 'Times Roman (Serif)', cssFont: '"Times New Roman", Times, serif' },
  { id: 'Times-Roman-Bold', label: 'Times Roman Bold', cssFont: '"Times New Roman", Times, serif' },
  { id: 'Courier', label: 'Courier (Monospace)', cssFont: '"Courier New", Courier, monospace' },
  { id: 'Courier-Bold', label: 'Courier Bold', cssFont: '"Courier New", Courier, monospace' },
];

export const PageNumbersWorkspace: React.FC<PageNumbersWorkspaceProps> = ({ file, onReset }) => {
  const totalPages = file.pageCount || 1;
  const [format, setFormat] = useState<'{n}' | 'Page {n}' | '{n} / {total}' | '- {n} -'>('Page {n}');
  const [position, setPosition] = useState<PageNumberPosition>('bottom-center');
  const [fontSize, setFontSize] = useState<number>(11);
  const [textColorHex, setTextColorHex] = useState<string>('#11131c');
  const [fontName, setFontName] = useState<PageNumberFont>('Helvetica');
  const [marginOffset, setMarginOffset] = useState<number>(24);
  const [startNumber, setStartNumber] = useState<number>(1);
  const [startFromPage, setStartFromPage] = useState<number>(1);
  const [skipCover, setSkipCover] = useState<boolean>(false);

  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processingProgress, setProcessingProgress] = useState<{ percent: number; label: string } | null>(null);
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
      setProcessingProgress({ percent: 0, label: 'Initializing stamps...' });
      playProcessSound();

      const options: PageNumberOptions = {
        format,
        position,
        fontSize,
        textColorHex,
        fontName,
        marginOffset,
        startNumber,
        startFromPage,
        skipCover,
        onProgress: (current, total, message) => {
          setProcessingProgress({
            percent: Math.round((current / total) * 100),
            label: message,
          });
        },
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
      setProcessingProgress(null);
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
  const currentFontMeta = FONT_OPTIONS.find((f) => f.id === fontName) || FONT_OPTIONS[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--cyan-electric)', fontSize: '1.25rem' }}>
          Stamp Page Numbers: {file.name}
        </h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Precisely imprint sequential numbers across {totalPages} pages with custom styling.
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

        {/* Font Family Selection */}
        <div>
          <label className="form-label" style={{ marginBottom: 6 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Type size={16} /> Font Family:
            </span>
          </label>
          <div className="radio-pill-group">
            {FONT_OPTIONS.map((f) => (
              <button
                key={f.id}
                className={`radio-pill-label ${fontName === f.id ? 'active' : ''}`}
                onClick={() => {
                  playClickSound();
                  setFontName(f.id);
                }}
                style={{ fontFamily: f.cssFont }}
              >
                {f.label}
              </button>
            ))}
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
              fontFamily: currentFontMeta.cssFont,
              fontWeight: fontName.includes('Bold') ? 700 : 500,
              fontStyle: fontName.includes('Italic') || fontName.includes('Oblique') ? 'italic' : 'normal',
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
          <div>
            <label className="form-label" style={{ marginBottom: 4 }}>
              <span>Font Size:</span>
              <strong style={{ color: 'var(--cyan-electric)' }}>{fontSize} pt</strong>
            </label>
            <input
              type="range"
              min="8"
              max="24"
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
              max="60"
              value={marginOffset}
              onChange={(e) => setMarginOffset(parseInt(e.target.value, 10))}
              style={{ width: '100%', accentColor: 'var(--cyan-electric)' }}
            />
          </div>

          {/* Any Color Picker Section */}
          <div style={{ gridColumn: '1 / -1' }}>
            <label className="form-label" style={{ marginBottom: 6 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Pipette size={16} /> Text Color:
              </span>
              <span style={{ color: 'var(--lime-acid)', fontFamily: 'var(--font-mono)' }}>{textColorHex}</span>
            </label>

            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
              {PRESET_COLORS.map((col) => (
                <div
                  key={col.hex}
                  onClick={() => {
                    playClickSound();
                    setTextColorHex(col.hex);
                  }}
                  title={`${col.label} (${col.hex})`}
                  style={{
                    width: '30px',
                    height: '30px',
                    borderRadius: '50%',
                    backgroundColor: col.hex,
                    cursor: 'pointer',
                    border: textColorHex.toLowerCase() === col.hex.toLowerCase()
                      ? '3px solid var(--lime-acid)'
                      : '1.5px solid rgba(255,255,255,0.25)',
                    boxShadow: textColorHex.toLowerCase() === col.hex.toLowerCase()
                      ? '0 0 8px var(--lime-acid)'
                      : 'none',
                    transition: 'transform 0.15s ease',
                  }}
                />
              ))}

              {/* Native Custom Color Picker */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  background: '#090a12',
                  border: '1.5px solid rgba(146, 91, 255, 0.4)',
                  borderRadius: '20px',
                  padding: '3px 10px',
                }}
              >
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    color: 'var(--text-main)',
                  }}
                >
                  <input
                    type="color"
                    value={textColorHex.startsWith('#') && textColorHex.length === 7 ? textColorHex : '#11131c'}
                    onChange={(e) => setTextColorHex(e.target.value)}
                    style={{
                      width: '26px',
                      height: '26px',
                      border: 'none',
                      borderRadius: '50%',
                      cursor: 'pointer',
                      background: 'none',
                      padding: 0,
                    }}
                    title="Click for full color spectrum"
                  />
                  <span>Custom Color</span>
                </label>
                <input
                  type="text"
                  value={textColorHex}
                  onChange={(e) => setTextColorHex(e.target.value)}
                  placeholder="#000000"
                  className="form-input"
                  style={{
                    width: '84px',
                    padding: '3px 6px',
                    fontSize: '0.8rem',
                    fontFamily: 'var(--font-mono)',
                    textAlign: 'center',
                  }}
                />
              </div>
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

      {/* Progress Bar during processing */}
      {isProcessing && processingProgress && (
        <div style={{ marginTop: '8px' }}>
          <ProgressBar
            progress={processingProgress.percent}
            label={processingProgress.label}
            subLabel="Adding sharp vector numbers to pages in browser RAM..."
            color="cyan"
          />
        </div>
      )}

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
