import React, { useState, useEffect, useRef } from 'react';
import {
  RotateCw,
  Copy,
  Trash2,
  Undo2,
  Redo2,
  CheckSquare,
  Square,
  ArrowLeft,
  ArrowRight,
  GripVertical,
  ZoomIn,
  X,
  Maximize2,
} from 'lucide-react';
import type { LoadedFileItem } from '../../components/portal/DropPortal';
import { loadPDFDocument, renderPageThumbnail } from '../../lib/pdf/pdfjs-init';
import { organizePDF, type OrganizedPageItem } from '../../lib/pdf/pdf-engine';
import { getSafeFileArrayBuffer } from '../../lib/utils/file-helpers';
import { DownloadPanel } from '../../components/workspace/DownloadPanel';
import { ProgressBar } from '../../components/common/ProgressBar';
import { playClickSound, playErrorSound, playProcessSound } from '../../lib/audio/sound-effects';

interface OrganizeWorkspaceProps {
  file: LoadedFileItem;
  onReset: () => void;
}

interface PageStateItem {
  id: string;
  originalIndex: number;
  rotation: number;
}

type ThumbnailSize = 'sm' | 'md' | 'lg' | 'xl';

export const OrganizeWorkspace: React.FC<OrganizeWorkspaceProps> = ({ file, onReset }) => {
  const [pages, setPages] = useState<PageStateItem[]>([]);
  const [history, setHistory] = useState<PageStateItem[][]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [thumbnails, setThumbnails] = useState<Record<number, string>>({});
  const [thumbSize, setThumbSize] = useState<ThumbnailSize>('md');
  const [inspectPageIndex, setInspectPageIndex] = useState<number | null>(null);

  // Drag and drop state
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Progress state
  const [thumbnailProgress, setThumbnailProgress] = useState<{ percent: number; label: string } | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [exportProgress, setExportProgress] = useState<{ percent: number; label: string } | null>(null);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);

  const pdfDocRef = useRef<any>(null);

  // Initialize pages and generate base thumbnails with high resolution for readability
  useEffect(() => {
    let isCancelled = false;
    setThumbnailProgress({ percent: 5, label: 'Opening document...' });

    getSafeFileArrayBuffer(file)
      .then((buf) => loadPDFDocument(buf))
      .then(async (doc) => {
        if (isCancelled) return;
        pdfDocRef.current = doc;

        const initial: PageStateItem[] = Array.from({ length: doc.numPages }, (_, i) => ({
          id: `page-${i}-${Date.now()}`,
          originalIndex: i,
          rotation: 0,
        }));
        setPages(initial);
        setHistory([initial]);
        setHistoryIndex(0);

        const thumbMap: Record<number, string> = {};
        const total = doc.numPages;

        for (let i = 1; i <= total; i++) {
          if (isCancelled) break;
          setThumbnailProgress({
            percent: Math.round((i / total) * 100),
            label: `Rendering high-res page ${i} of ${total}...`,
          });

          try {
            // Render at 500px dimension for sharp clarity with scientific papers
            const url = await renderPageThumbnail(doc, i, 500);
            thumbMap[i - 1] = url;
          } catch {
            thumbMap[i - 1] = '';
          }

          // Small yield to allow UI to breathe
          await new Promise((r) => setTimeout(r, 0));
        }

        if (!isCancelled) {
          setThumbnails({ ...thumbMap });
          setThumbnailProgress(null);
        }
      })
      .catch((err) => {
        console.error('Failed to load organize doc:', err);
        if (!isCancelled) {
          setError('Failed to render page thumbnails.');
          setThumbnailProgress(null);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [file]);

  const pushState = (newPages: PageStateItem[]) => {
    const newHist = history.slice(0, historyIndex + 1);
    newHist.push(newPages);
    setHistory(newHist);
    setHistoryIndex(newHist.length - 1);
    setPages(newPages);
  };

  const undo = () => {
    if (historyIndex > 0) {
      playClickSound();
      setHistoryIndex(historyIndex - 1);
      setPages(history[historyIndex - 1]);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      playClickSound();
      setHistoryIndex(historyIndex + 1);
      setPages(history[historyIndex + 1]);
    }
  };

  const toggleSelect = (id: string) => {
    playClickSound();
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const selectAll = () => {
    playClickSound();
    if (selectedIds.size === pages.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(pages.map((p) => p.id)));
    }
  };

  const rotateSelected = (deg = 90) => {
    playClickSound();
    const updated = pages.map((p) => {
      if (selectedIds.size === 0 || selectedIds.has(p.id)) {
        return { ...p, rotation: (p.rotation + deg) % 360 };
      }
      return p;
    });
    pushState(updated);
  };

  const deleteSelected = () => {
    playClickSound();
    if (selectedIds.size === 0) return;
    if (pages.length <= selectedIds.size) {
      setError('Cannot delete all pages in the document.');
      return;
    }
    const updated = pages.filter((p) => !selectedIds.has(p.id));
    setSelectedIds(new Set());
    pushState(updated);
  };

  const duplicateSelected = () => {
    playClickSound();
    if (selectedIds.size === 0) return;
    const updated: PageStateItem[] = [];
    pages.forEach((p) => {
      updated.push(p);
      if (selectedIds.has(p.id)) {
        updated.push({
          id: `page-dup-${Date.now()}-${Math.random()}`,
          originalIndex: p.originalIndex,
          rotation: p.rotation,
        });
      }
    });
    pushState(updated);
  };

  const movePage = (index: number, direction: 'left' | 'right') => {
    playClickSound();
    const newIndex = direction === 'left' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= pages.length) return;
    const updated = [...pages];
    const [moved] = updated.splice(index, 1);
    updated.splice(newIndex, 0, moved);
    pushState(updated);
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const updated = [...pages];
    const [moved] = updated.splice(draggedIndex, 1);
    updated.splice(dropIndex, 0, moved);

    playClickSound();
    pushState(updated);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleExport = async () => {
    if (pages.length === 0) {
      setError('No pages remaining to export.');
      return;
    }

    try {
      setIsProcessing(true);
      setError(null);
      setExportProgress({ percent: 0, label: 'Preparing pages...' });
      playProcessSound();

      const ops: OrganizedPageItem[] = pages.map((p) => ({
        originalIndex: p.originalIndex,
        rotation: p.rotation,
      }));

      const safeBuffer = await getSafeFileArrayBuffer(file);
      const organizedBytes = await organizePDF(safeBuffer, ops, (current, total, message) => {
        setExportProgress({
          percent: Math.round((current / total) * 100),
          label: message,
        });
      });

      const blob = new Blob([organizedBytes as BlobPart], { type: 'application/pdf' });
      setResultBlob(blob);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to export organized PDF.');
      playErrorSound();
    } finally {
      setIsProcessing(false);
      setExportProgress(null);
    }
  };

  if (resultBlob) {
    return (
      <DownloadPanel
        filename={`${file.name.replace(/\.pdf$/i, '')}-organized.pdf`}
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--lime-acid)', fontSize: '1.25rem' }}>
            Organize &amp; Reorder: {file.name}
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            {pages.length} total pages. <strong>Drag &amp; drop cards</strong> or use arrows to rearrange.
          </p>
        </div>

        {/* Top Control Bar: Thumbnail Size & Actions */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Thumbnail Size Switcher */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              background: '#090a12',
              border: '1px solid rgba(146, 91, 255, 0.3)',
              borderRadius: '8px',
              padding: '2px 6px',
            }}
          >
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, paddingRight: 4 }}>
              Thumbnail:
            </span>
            <button
              className={`radio-pill-label ${thumbSize === 'sm' ? 'active' : ''}`}
              style={{ padding: '3px 7px', fontSize: '0.75rem' }}
              onClick={() => {
                playClickSound();
                setThumbSize('sm');
              }}
              title="Small thumbnails (compact view)"
            >
              Small
            </button>
            <button
              className={`radio-pill-label ${thumbSize === 'md' ? 'active' : ''}`}
              style={{ padding: '3px 7px', fontSize: '0.75rem' }}
              onClick={() => {
                playClickSound();
                setThumbSize('md');
              }}
              title="Medium thumbnails (default)"
            >
              Medium
            </button>
            <button
              className={`radio-pill-label ${thumbSize === 'lg' ? 'active' : ''}`}
              style={{ padding: '3px 7px', fontSize: '0.75rem' }}
              onClick={() => {
                playClickSound();
                setThumbSize('lg');
              }}
              title="Large thumbnails (best for reading scientific papers & text)"
            >
              Large
            </button>
            <button
              className={`radio-pill-label ${thumbSize === 'xl' ? 'active' : ''}`}
              style={{ padding: '3px 7px', fontSize: '0.75rem' }}
              onClick={() => {
                playClickSound();
                setThumbSize('xl');
              }}
              title="Huge thumbnails (maximum readability for dense papers)"
            >
              Huge
            </button>
          </div>

          {/* Edit Actions */}
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <button className="file-action-btn" onClick={undo} disabled={historyIndex <= 0} title="Undo">
              <Undo2 size={16} />
            </button>
            <button className="file-action-btn" onClick={redo} disabled={historyIndex >= history.length - 1} title="Redo">
              <Redo2 size={16} />
            </button>
            <button className="file-action-btn" onClick={selectAll} title="Select All / None">
              {selectedIds.size === pages.length ? <CheckSquare size={16} /> : <Square size={16} />}
            </button>
            <button className="file-action-btn" onClick={() => rotateSelected(90)} title="Rotate Selected 90°">
              <RotateCw size={16} /> Rotate
            </button>
            <button className="file-action-btn" onClick={duplicateSelected} disabled={selectedIds.size === 0} title="Duplicate Selected">
              <Copy size={16} /> Duplicate
            </button>
            <button className="file-action-btn danger" onClick={deleteSelected} disabled={selectedIds.size === 0} title="Delete Selected">
              <Trash2 size={16} /> Delete
            </button>
          </div>
        </div>
      </div>

      {/* Thumbnail loading progress bar */}
      {thumbnailProgress && (
        <div style={{ background: '#121422', padding: '10px 14px', borderRadius: '8px' }}>
          <ProgressBar
            progress={thumbnailProgress.percent}
            label={thumbnailProgress.label}
            subLabel="Extracting crisp vector page graphics into memory..."
            color="lime"
          />
        </div>
      )}

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

      {/* Hint badge for drag & drop */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '0.82rem',
          color: 'var(--text-muted)',
          padding: '4px 0',
        }}
      >
        <GripVertical size={14} color="var(--lime-acid)" />
        <span>
          Tip: Grab any page card to <strong style={{ color: 'var(--lime-acid)' }}>drag and drop</strong> into any position. Use the 🔍 magnifying glass to inspect scientific text full size.
        </span>
      </div>

      {/* Pages Grid with dynamic sizing */}
      <div className={`thumbnail-grid size-${thumbSize}`} style={{ maxHeight: '480px', overflowY: 'auto', paddingRight: '4px' }}>
        {pages.map((p, idx) => {
          const isSelected = selectedIds.has(p.id);
          const isDragging = draggedIndex === idx;
          const isDropTarget = dragOverIndex === idx && draggedIndex !== idx;
          const thumbUrl = thumbnails[p.originalIndex];

          return (
            <div
              key={p.id}
              draggable={!isProcessing}
              onDragStart={(e) => handleDragStart(e, idx)}
              onDragOver={(e) => handleDragOver(e, idx)}
              onDrop={(e) => handleDrop(e, idx)}
              onDragEnd={handleDragEnd}
              className={`thumbnail-card ${isSelected ? 'selected' : ''} ${isDragging ? 'is-dragging' : ''} ${isDropTarget ? 'is-drop-target' : ''}`}
              onClick={() => toggleSelect(p.id)}
              title="Drag to reorder or click to select"
            >
              {/* Grip drag indicator & Inspect Button */}
              <div
                style={{
                  position: 'absolute',
                  top: 8,
                  left: 8,
                  right: 8,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  pointerEvents: 'none',
                  zIndex: 2,
                }}
              >
                <div
                  style={{
                    background: 'rgba(8, 9, 13, 0.75)',
                    borderRadius: '4px',
                    padding: '2px 4px',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                  title="Drag handle"
                >
                  <GripVertical size={14} color="var(--lime-acid)" />
                </div>

                {thumbUrl && (
                  <button
                    className="file-action-btn"
                    style={{
                      padding: '3px 6px',
                      pointerEvents: 'auto',
                      background: 'rgba(8, 9, 13, 0.85)',
                      borderRadius: '4px',
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      playClickSound();
                      setInspectPageIndex(p.originalIndex);
                    }}
                    title="Zoom in / Inspect full page (great for scientific papers!)"
                  >
                    <ZoomIn size={13} color="var(--cyan-electric)" />
                  </button>
                )}
              </div>

              <div className="thumbnail-img-box" style={{ marginTop: '22px' }}>
                {thumbUrl ? (
                  <img
                    src={thumbUrl}
                    alt={`Page ${idx + 1}`}
                    style={{
                      transform: `rotate(${p.rotation}deg)`,
                      pointerEvents: 'none',
                    }}
                  />
                ) : (
                  <span style={{ color: '#08090D', fontWeight: 700, fontSize: '0.9rem' }}>
                    Loading Page {p.originalIndex + 1}...
                  </span>
                )}
              </div>

              <div className="thumbnail-badge">
                Page {idx + 1} {p.rotation !== 0 && `(${p.rotation}°)`}
              </div>

              <div className="thumbnail-card-actions" onClick={(e) => e.stopPropagation()}>
                <button
                  className="file-action-btn"
                  style={{ padding: '3px 6px' }}
                  disabled={idx === 0}
                  onClick={() => movePage(idx, 'left')}
                  title="Move left"
                >
                  <ArrowLeft size={12} />
                </button>
                <button
                  className="file-action-btn"
                  style={{ padding: '3px 6px' }}
                  onClick={() => {
                    const updated = pages.map((item) =>
                      item.id === p.id ? { ...item, rotation: (item.rotation + 90) % 360 } : item
                    );
                    pushState(updated);
                  }}
                  title="Rotate 90° CW"
                >
                  <RotateCw size={12} />
                </button>
                <button
                  className="file-action-btn"
                  style={{ padding: '3px 6px' }}
                  disabled={idx === pages.length - 1}
                  onClick={() => movePage(idx, 'right')}
                  title="Move right"
                >
                  <ArrowRight size={12} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Export progress bar */}
      {isProcessing && exportProgress && (
        <div style={{ marginTop: '8px' }}>
          <ProgressBar
            progress={exportProgress.percent}
            label={exportProgress.label}
            subLabel="Stitching requested page sequence in memory..."
            color="orange"
          />
        </div>
      )}

      <div style={{ textAlign: 'center', marginTop: '10px' }}>
        <button
          className="btn-chunky btn-coral"
          style={{ fontSize: '1.2rem', padding: '14px 40px' }}
          disabled={isProcessing || pages.length === 0}
          onClick={handleExport}
        >
          {isProcessing ? 'REBUILDING PAGES...' : 'EXPORT ORGANIZED PDF'}
        </button>
      </div>

      {/* Full Resolution Inspect Modal for Scientific Papers */}
      {inspectPageIndex !== null && thumbnails[inspectPageIndex] && (
        <div
          className="modal-backdrop"
          style={{ zIndex: 9999, padding: '20px' }}
          onClick={() => setInspectPageIndex(null)}
        >
          <div
            style={{
              background: '#0e101a',
              border: '2px solid var(--cyan-electric)',
              borderRadius: '12px',
              padding: '16px',
              maxWidth: '900px',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              boxShadow: '0 0 40px rgba(0,0,0,0.85)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Maximize2 size={18} color="var(--cyan-electric)" />
                <span style={{ fontFamily: 'var(--font-display)', color: 'var(--cyan-electric)', fontSize: '1.1rem' }}>
                  Inspect Page {inspectPageIndex + 1}
                </span>
              </div>
              <button
                className="file-action-btn"
                onClick={() => setInspectPageIndex(null)}
                title="Close Inspector"
              >
                <X size={18} />
              </button>
            </div>

            <div
              style={{
                flex: 1,
                overflow: 'auto',
                display: 'flex',
                justifyContent: 'center',
                background: '#ffffff',
                borderRadius: '8px',
                padding: '12px',
              }}
            >
              <img
                src={thumbnails[inspectPageIndex]}
                alt={`Inspect Page ${inspectPageIndex + 1}`}
                style={{
                  maxWidth: '100%',
                  height: 'auto',
                  objectFit: 'contain',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
