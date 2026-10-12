import React, { useState, useEffect } from 'react';
import { RotateCw, Copy, Trash2, Undo2, Redo2, CheckSquare, Square, ArrowLeft, ArrowRight } from 'lucide-react';
import type { LoadedFileItem } from '../../components/portal/DropPortal';
import { loadPDFDocument, renderPageThumbnail } from '../../lib/pdf/pdfjs-init';
import { organizePDF, type OrganizedPageItem } from '../../lib/pdf/pdf-engine';
import { getSafeFileArrayBuffer } from '../../lib/utils/file-helpers';
import { DownloadPanel } from '../../components/workspace/DownloadPanel';
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

export const OrganizeWorkspace: React.FC<OrganizeWorkspaceProps> = ({ file, onReset }) => {
  const [pages, setPages] = useState<PageStateItem[]>([]);
  const [history, setHistory] = useState<PageStateItem[][]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [thumbnails, setThumbnails] = useState<Record<number, string>>({});
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Initialize pages and generate base thumbnails
  useEffect(() => {
    let isCancelled = false;
    getSafeFileArrayBuffer(file)
      .then((buf) => loadPDFDocument(buf))
      .then(async (doc) => {
        if (isCancelled) return;
        const initial: PageStateItem[] = Array.from({ length: doc.numPages }, (_, i) => ({
          id: `page-${i}-${Date.now()}`,
          originalIndex: i,
          rotation: 0,
        }));
        setPages(initial);
        setHistory([initial]);
        setHistoryIndex(0);

        const thumbMap: Record<number, string> = {};
        for (let i = 1; i <= doc.numPages; i++) {
          try {
            const url = await renderPageThumbnail(doc, i, 160);
            thumbMap[i - 1] = url;
          } catch {
            thumbMap[i - 1] = '';
          }
        }
        if (!isCancelled) {
          setThumbnails(thumbMap);
        }
      })
      .catch((err) => {
        console.error('Failed to load organize doc:', err);
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

  const handleExport = async () => {
    if (pages.length === 0) {
      setError('No pages remaining to export.');
      return;
    }

    try {
      setIsProcessing(true);
      setError(null);
      playProcessSound();

      const ops: OrganizedPageItem[] = pages.map((p) => ({
        originalIndex: p.originalIndex,
        rotation: p.rotation,
      }));

      const safeBuffer = await getSafeFileArrayBuffer(file);
      const organizedBytes = await organizePDF(safeBuffer, ops);
      const blob = new Blob([organizedBytes as BlobPart], { type: 'application/pdf' });
      setResultBlob(blob);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to export organized PDF.');
      playErrorSound();
    } finally {
      setIsProcessing(false);
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--lime-acid)', fontSize: '1.25rem' }}>
            Organize &amp; Reorder: {file.name}
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            {pages.length} total pages. Drag or use arrows to rearrange, rotate, duplicate, or delete.
          </p>
        </div>

        {/* Toolbar */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
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

      {/* Pages Grid */}
      <div className="thumbnail-grid" style={{ maxHeight: '440px', overflowY: 'auto' }}>
        {pages.map((p, idx) => {
          const isSelected = selectedIds.has(p.id);
          const thumbUrl = thumbnails[p.originalIndex];

          return (
            <div
              key={p.id}
              className={`thumbnail-card ${isSelected ? 'selected' : ''}`}
              onClick={() => toggleSelect(p.id)}
            >
              <div className="thumbnail-img-box">
                {thumbUrl ? (
                  <img
                    src={thumbUrl}
                    alt={`Page ${idx + 1}`}
                    style={{ transform: `rotate(${p.rotation}deg)` }}
                  />
                ) : (
                  <span style={{ color: '#08090D', fontWeight: 700 }}>Page {p.originalIndex + 1}</span>
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
    </div>
  );
};
