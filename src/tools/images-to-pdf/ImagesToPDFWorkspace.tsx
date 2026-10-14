import React, { useState } from 'react';
import { Plus, ArrowUp, ArrowDown, Trash2 } from 'lucide-react';
import { imagesToPDF, type ImageInputItem, type ImagesToPDFSettings } from '../../lib/pdf/pdf-engine';
import { DownloadPanel } from '../../components/workspace/DownloadPanel';
import { ProgressBar } from '../../components/common/ProgressBar';
import { playClickSound, playErrorSound, playProcessSound } from '../../lib/audio/sound-effects';

interface ImagesToPDFWorkspaceProps {
  initialImages: File[];
  onReset: () => void;
}

export const ImagesToPDFWorkspace: React.FC<ImagesToPDFWorkspaceProps> = ({
  initialImages,
  onReset,
}) => {
  const [images, setImages] = useState<ImageInputItem[]>(() =>
    initialImages.map((f) => ({
      file: f,
      previewUrl: URL.createObjectURL(f),
    }))
  );

  const [settings, setSettings] = useState<ImagesToPDFSettings>({
    pageSize: 'A4',
    orientation: 'auto',
    marginPt: 20,
    imageFit: 'fit',
    backgroundColorHex: '#ffffff',
  });

  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [imageProgress, setImageProgress] = useState<{ percent: number; label: string } | null>(null);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAddMore = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      playClickSound();
      const newItems: ImageInputItem[] = Array.from(e.target.files).map((f) => ({
        file: f,
        previewUrl: URL.createObjectURL(f),
      }));
      setImages((prev) => [...prev, ...newItems]);
    }
  };

  const moveImage = (index: number, direction: 'up' | 'down') => {
    playClickSound();
    const newIdx = direction === 'up' ? index - 1 : index + 1;
    if (newIdx < 0 || newIdx >= images.length) return;
    const updated = [...images];
    const [moved] = updated.splice(index, 1);
    updated.splice(newIdx, 0, moved);
    setImages(updated);
  };

  const removeImage = (index: number) => {
    playClickSound();
    URL.revokeObjectURL(images[index].previewUrl);
    setImages(images.filter((_, i) => i !== index));
  };

  const handleConvert = async () => {
    if (images.length === 0) {
      setError('Please add at least one image.');
      return;
    }

    try {
      setIsProcessing(true);
      setError(null);
      setImageProgress({ percent: 0, label: 'Reading image files...' });
      playProcessSound();

      const pdfBytes = await imagesToPDF(images, settings, (current, total, message) => {
        setImageProgress({
          percent: Math.round((current / total) * 100),
          label: message,
        });
      });
      const blob = new Blob([pdfBytes as BlobPart], { type: 'application/pdf' });
      setResultBlob(blob);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Image to PDF conversion failed.');
      playErrorSound();
    } finally {
      setIsProcessing(false);
      setImageProgress(null);
    }
  };

  if (resultBlob) {
    return (
      <DownloadPanel
        filename="converted-images.pdf"
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--lime-acid)', fontSize: '1.25rem' }}>
            Images to PDF: {images.length} Picture{images.length !== 1 ? 's' : ''}
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Convert photos and graphics into a clean, uniform PDF document.
          </p>
        </div>

        <label className="btn-chunky btn-dark" style={{ cursor: 'pointer' }}>
          <Plus size={18} /> Add More Pics
          <input
            type="file"
            multiple
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleAddMore}
          />
        </label>
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

      {/* Image Preview & Order Strip */}
      <div
        style={{
          display: 'flex',
          gap: '12px',
          overflowX: 'auto',
          padding: '10px 4px',
          background: '#131522',
          borderRadius: '12px',
          border: '1.5px dashed rgba(146, 91, 255, 0.3)',
          minHeight: '130px',
          alignItems: 'center',
        }}
      >
        {images.map((item, idx) => (
          <div
            key={idx}
            style={{
              width: '100px',
              height: '110px',
              background: '#090a10',
              borderRadius: '8px',
              padding: '6px',
              position: 'relative',
              flexShrink: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              border: '1.5px solid #2e3150',
            }}
          >
            <img
              src={item.previewUrl}
              alt={item.file.name}
              style={{ width: '100%', height: '65px', objectFit: 'contain' }}
            />
            <div style={{ display: 'flex', gap: '3px', marginTop: '6px' }}>
              <button
                className="file-action-btn"
                style={{ padding: '2px 5px' }}
                disabled={idx === 0}
                onClick={() => moveImage(idx, 'up')}
                title="Move left"
              >
                <ArrowUp size={11} />
              </button>
              <button
                className="file-action-btn"
                style={{ padding: '2px 5px' }}
                disabled={idx === images.length - 1}
                onClick={() => moveImage(idx, 'down')}
                title="Move right"
              >
                <ArrowDown size={11} />
              </button>
              <button
                className="file-action-btn danger"
                style={{ padding: '2px 5px' }}
                onClick={() => removeImage(idx)}
                title="Remove"
              >
                <Trash2 size={11} />
              </button>
            </div>
          </div>
        ))}
        {images.length === 0 && (
          <div style={{ padding: '20px', textAlign: 'center', width: '100%', color: 'var(--text-muted)' }}>
            No images selected yet. Click "+ Add More Pics" or feed the portal!
          </div>
        )}
      </div>

      {/* Settings Panel */}
      <div className="settings-group">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
          <div>
            <label className="form-label" style={{ marginBottom: 6 }}>
              <span>Page Sizing:</span>
            </label>
            <div className="radio-pill-group">
              <button
                className={`radio-pill-label ${settings.pageSize === 'A4' ? 'active' : ''}`}
                onClick={() => setSettings({ ...settings, pageSize: 'A4' })}
              >
                Standard A4
              </button>
              <button
                className={`radio-pill-label ${settings.pageSize === 'LETTER' ? 'active' : ''}`}
                onClick={() => setSettings({ ...settings, pageSize: 'LETTER' })}
              >
                US Letter
              </button>
              <button
                className={`radio-pill-label ${settings.pageSize === 'FIT' ? 'active' : ''}`}
                onClick={() => setSettings({ ...settings, pageSize: 'FIT' })}
              >
                Fit to Image
              </button>
            </div>
          </div>

          <div>
            <label className="form-label" style={{ marginBottom: 6 }}>
              <span>Orientation:</span>
            </label>
            <div className="radio-pill-group">
              <button
                className={`radio-pill-label ${settings.orientation === 'auto' ? 'active' : ''}`}
                onClick={() => setSettings({ ...settings, orientation: 'auto' })}
              >
                Auto-Detect
              </button>
              <button
                className={`radio-pill-label ${settings.orientation === 'portrait' ? 'active' : ''}`}
                onClick={() => setSettings({ ...settings, orientation: 'portrait' })}
              >
                Portrait
              </button>
              <button
                className={`radio-pill-label ${settings.orientation === 'landscape' ? 'active' : ''}`}
                onClick={() => setSettings({ ...settings, orientation: 'landscape' })}
              >
                Landscape
              </button>
            </div>
          </div>

          <div>
            <label className="form-label" style={{ marginBottom: 6 }}>
              <span>Page Margins:</span>
            </label>
            <div className="radio-pill-group">
              <button
                className={`radio-pill-label ${settings.marginPt === 0 ? 'active' : ''}`}
                onClick={() => setSettings({ ...settings, marginPt: 0 })}
              >
                None (0)
              </button>
              <button
                className={`radio-pill-label ${settings.marginPt === 20 ? 'active' : ''}`}
                onClick={() => setSettings({ ...settings, marginPt: 20 })}
              >
                Normal (20pt)
              </button>
              <button
                className={`radio-pill-label ${settings.marginPt === 40 ? 'active' : ''}`}
                onClick={() => setSettings({ ...settings, marginPt: 40 })}
              >
                Wide (40pt)
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      {isProcessing && imageProgress && (
        <div style={{ marginTop: '8px' }}>
          <ProgressBar
            progress={imageProgress.percent}
            label={imageProgress.label}
            subLabel="Transcoding image buffers and binding pages in browser RAM..."
            color="lime"
          />
        </div>
      )}

      <div style={{ textAlign: 'center', marginTop: '10px' }}>
        <button
          className="btn-chunky btn-coral"
          style={{ fontSize: '1.2rem', padding: '14px 40px' }}
          disabled={isProcessing || images.length === 0}
          onClick={handleConvert}
        >
          {isProcessing ? 'GENERATING PDF...' : 'PICS TO PDF!'}
        </button>
      </div>
    </div>
  );
};
