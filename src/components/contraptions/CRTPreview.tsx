import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Loader2, Sparkles, FileQuestion } from 'lucide-react';
import { loadPDFDocument, renderPageToCanvas, renderPageThumbnail } from '../../lib/pdf/pdfjs-init';
import { playClickSound } from '../../lib/audio/sound-effects';
import { getSafeFileArrayBuffer } from '../../lib/utils/file-helpers';
import type { LoadedFileItem } from '../portal/DropPortal';

const CRT_FACES = ['(◕‿◕)', '(⊙_⊙)', '(^o^)', '(>‿<)', '(⌐■_■)', '(=^･ω･^=)'];

interface CRTPreviewProps {
  fileItem?: LoadedFileItem | null;
  currentPdfData?: ArrayBuffer | null;
  filename?: string;
  isProcessing?: boolean;
}

export const CRTPreview: React.FC<CRTPreviewProps> = ({
  fileItem,
  currentPdfData,
  filename,
  isProcessing = false,
}) => {
  const [faceIndex, setFaceIndex] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [zoomScale, setZoomScale] = useState<number>(0.9);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [thumbnails, setThumbnails] = useState<string[]>([]);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pdfDocRef = useRef<any>(null);

  // Cycle face on click
  const handleFaceClick = () => {
    playClickSound();
    setFaceIndex((prev) => (prev + 1) % CRT_FACES.length);
  };

  // Load document when fileItem or currentPdfData changes
  useEffect(() => {
    if (!fileItem && !currentPdfData) {
      setTotalPages(0);
      setCurrentPage(1);
      setThumbnails([]);
      pdfDocRef.current = null;
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError(null);

    const acquireBuffer = async (): Promise<ArrayBuffer> => {
      if (fileItem) {
        return await getSafeFileArrayBuffer(fileItem);
      }
      if (currentPdfData && currentPdfData.byteLength > 0) {
        return currentPdfData.slice(0);
      }
      throw new Error('PDF buffer is unavailable or detached');
    };

    acquireBuffer()
      .then((buf) => loadPDFDocument(buf))
      .then(async (doc) => {
        if (!isMounted) return;
        pdfDocRef.current = doc;
        setTotalPages(doc.numPages);
        setCurrentPage(1);

        // Generate first few thumbnails lazily
        const thumbs: string[] = [];
        const thumbLimit = Math.min(doc.numPages, 10);
        for (let i = 1; i <= thumbLimit; i++) {
          try {
            const url = await renderPageThumbnail(doc, i, 120);
            thumbs.push(url);
          } catch {
            thumbs.push('');
          }
        }
        if (isMounted) {
          setThumbnails(thumbs);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err.message || 'Failed to parse PDF');
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [fileItem, currentPdfData]);

  // Render current page onto canvas
  useEffect(() => {
    if (!pdfDocRef.current || !canvasRef.current || totalPages === 0) return;

    let isCancelled = false;
    renderPageToCanvas(pdfDocRef.current, currentPage, canvasRef.current, zoomScale)
      .catch((err) => {
        if (!isCancelled) {
          console.error('Page render error:', err);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [currentPage, zoomScale, totalPages]);

  return (
    <div className="crt-housing" title="Document Scanning Contraption">
      {/* Decorative top mechanical arm / paper feeder */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingBottom: '8px',
        }}
      >
        <div style={{ display: 'flex', gap: '6px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#54f5e7' }} />
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#bc79ff' }} />
        </div>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--cyan-electric)' }}>
          SCANTRON-9000
        </span>
      </div>

      <div className="crt-bezel">
        {/* CRT Scanline Overlay */}
        <div className="crt-scanlines" />

        <div className="crt-header">
          <div
            className="crt-expression-face"
            onClick={handleFaceClick}
            title="Click to change CRT expression"
          >
            {isProcessing ? '(⊙_⊙) working!' : CRT_FACES[faceIndex]}
          </div>
          {filename && (
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.75rem',
                color: 'var(--text-muted)',
                maxWidth: '160px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {filename}
            </span>
          )}
        </div>

        <div className="crt-screen-content">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <Loader2 className="spin" size={36} color="var(--cyan-electric)" />
              <div
                style={{
                  fontFamily: 'var(--font-hand)',
                  color: 'var(--cyan-electric)',
                  fontSize: '1.2rem',
                  marginTop: '10px',
                }}
              >
                Scanning electron pages...
              </div>
            </div>
          ) : error ? (
            <div style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--red-coral)' }}>
              <FileQuestion size={36} />
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginTop: 8 }}>
                Doc Glitch!
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>{error}</div>
            </div>
          ) : currentPdfData && totalPages > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
              <div
                style={{
                  maxHeight: '270px',
                  overflow: 'auto',
                  display: 'flex',
                  justifyContent: 'center',
                  width: '100%',
                }}
              >
                <canvas ref={canvasRef} className="crt-preview-canvas" />
              </div>

              {/* Navigation & Zoom Bar */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  width: '100%',
                  marginTop: '10px',
                  paddingTop: '6px',
                  borderTop: '1px solid #1a1e2e',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <button
                    className="file-action-btn"
                    disabled={currentPage <= 1}
                    onClick={() => {
                      playClickSound();
                      setCurrentPage((p) => Math.max(1, p - 1));
                    }}
                    title="Previous page"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.8rem',
                      color: 'var(--lime-acid)',
                      padding: '0 4px',
                    }}
                  >
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    className="file-action-btn"
                    disabled={currentPage >= totalPages}
                    onClick={() => {
                      playClickSound();
                      setCurrentPage((p) => Math.min(totalPages, p + 1));
                    }}
                    title="Next page"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>

                <div style={{ display: 'flex', gap: '4px' }}>
                  <button
                    className="file-action-btn"
                    onClick={() => {
                      playClickSound();
                      setZoomScale((z) => Math.max(0.5, z - 0.2));
                    }}
                    title="Zoom Out"
                  >
                    <ZoomOut size={14} />
                  </button>
                  <button
                    className="file-action-btn"
                    onClick={() => {
                      playClickSound();
                      setZoomScale((z) => Math.min(1.8, z + 0.2));
                    }}
                    title="Zoom In"
                  >
                    <ZoomIn size={14} />
                  </button>
                </div>
              </div>

              {/* Thumbnail Strip */}
              {thumbnails.length > 1 && (
                <div
                  style={{
                    display: 'flex',
                    gap: '6px',
                    overflowX: 'auto',
                    width: '100%',
                    paddingTop: '8px',
                    marginTop: '6px',
                  }}
                >
                  {thumbnails.map((thumb, idx) => (
                    <div
                      key={idx}
                      onClick={() => {
                        playClickSound();
                        setCurrentPage(idx + 1);
                      }}
                      style={{
                        width: '38px',
                        height: '48px',
                        background: '#fff',
                        borderRadius: '3px',
                        flexShrink: 0,
                        cursor: 'pointer',
                        border: currentPage === idx + 1 ? '2px solid var(--lime-acid)' : '1px solid #444',
                        overflow: 'hidden',
                        opacity: currentPage === idx + 1 ? 1 : 0.6,
                        boxShadow: currentPage === idx + 1 ? '0 0 8px var(--lime-acid)' : 'none',
                      }}
                    >
                      {thumb && (
                        <img
                          src={thumb}
                          alt={`p${idx + 1}`}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '36px 12px' }}>
              <Sparkles size={36} color="var(--purple-goo)" style={{ marginBottom: '8px' }} />
              <div
                style={{
                  fontFamily: 'var(--font-display)',
                  color: 'var(--text-main)',
                  fontWeight: 700,
                  fontSize: '1rem',
                }}
              >
                Screen Standby
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-hand)',
                  color: 'var(--lime-acid)',
                  fontSize: '1.15rem',
                  marginTop: '4px',
                }}
              >
                feed a PDF to initialize the optics!
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
