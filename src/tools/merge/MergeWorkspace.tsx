import React, { useState } from 'react';
import { ArrowUp, ArrowDown, Trash2, Bookmark, Plus, FileText } from 'lucide-react';
import type { LoadedFileItem } from '../../components/portal/DropPortal';
import { mergePDFs, type MergeFileInput } from '../../lib/pdf/pdf-engine';
import { formatBytes, getSafeFileArrayBuffer } from '../../lib/utils/file-helpers';
import { DownloadPanel } from '../../components/workspace/DownloadPanel';
import { ProgressBar } from '../../components/common/ProgressBar';
import { playClickSound, playErrorSound, playProcessSound } from '../../lib/audio/sound-effects';

interface MergeWorkspaceProps {
  initialFiles: LoadedFileItem[];
  onAddNewFiles: (files: File[]) => void;
  onReset: () => void;
}

export const MergeWorkspace: React.FC<MergeWorkspaceProps> = ({
  initialFiles,
  onAddNewFiles,
  onReset,
}) => {
  const [files, setFiles] = useState<LoadedFileItem[]>(initialFiles);
  const [createBookmarks, setCreateBookmarks] = useState<boolean>(true);
  const [bookmarkTitles, setBookmarkTitles] = useState<Record<string, string>>({});
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [mergeProgress, setMergeProgress] = useState<{ percent: number; label: string } | null>(null);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);

  const moveFile = (index: number, direction: 'up' | 'down') => {
    playClickSound();
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= files.length) return;
    const updated = [...files];
    const [moved] = updated.splice(index, 1);
    updated.splice(newIndex, 0, moved);
    setFiles(updated);
  };

  const removeFile = (index: number) => {
    playClickSound();
    const updated = files.filter((_, i) => i !== index);
    setFiles(updated);
  };

  const handleTitleChange = (fileName: string, title: string) => {
    setBookmarkTitles((prev) => ({ ...prev, [fileName]: title }));
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      playClickSound();
      onAddNewFiles(Array.from(e.target.files));
    }
  };

  const handleMerge = async () => {
    if (files.length < 2) {
      setError('Please add at least 2 PDF documents to merge.');
      playErrorSound();
      return;
    }

    try {
      setIsProcessing(true);
      setError(null);
      setMergeProgress({ percent: 0, label: 'Reading files...' });
      playProcessSound();

      const mergeInputs: MergeFileInput[] = await Promise.all(
        files.map(async (f) => ({
          name: f.name,
          data: await getSafeFileArrayBuffer(f),
          customBookmarkTitle: bookmarkTitles[f.name] || f.name.replace(/\.pdf$/i, ''),
        }))
      );

      const mergedBytes = await mergePDFs(mergeInputs, {
        createBookmarks,
        onProgress: (current, total, message) => {
          setMergeProgress({
            percent: Math.round((current / total) * 100),
            label: message,
          });
        },
      });
      const blob = new Blob([mergedBytes as BlobPart], { type: 'application/pdf' });
      setResultBlob(blob);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to merge documents.');
      playErrorSound();
    } finally {
      setIsProcessing(false);
      setMergeProgress(null);
    }
  };

  if (resultBlob) {
    return (
      <DownloadPanel
        filename="merged-document.pdf"
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
          <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--pink-hot)', fontSize: '1.25rem' }}>
            Merge Document Queue ({files.length})
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Arrange the order below. Each document will be stitched sequentially.
          </p>
        </div>

        <label className="btn-chunky btn-dark" style={{ cursor: 'pointer' }}>
          <Plus size={18} /> Add More PDFs
          <input
            type="file"
            multiple
            accept=".pdf,application/pdf"
            style={{ display: 'none' }}
            onChange={handleFileInput}
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

      {/* Reorderable file queue */}
      <div className="file-queue-list">
        {files.map((file, idx) => (
          <div key={`${file.name}-${idx}`} className="file-queue-item">
            <div className="file-item-info">
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.85rem',
                  color: 'var(--lime-acid)',
                  fontWeight: 700,
                  width: '24px',
                }}
              >
                #{idx + 1}
              </span>
              <div className="file-icon">
                <FileText size={20} />
              </div>
              <div style={{ overflow: 'hidden' }}>
                <div className="file-name">{file.name}</div>
                <div className="file-meta">
                  {file.pageCount ? `${file.pageCount} pages • ` : ''}
                  {formatBytes(file.size)}
                </div>
              </div>
            </div>

            {/* Custom Bookmark Title Input */}
            {createBookmarks && (
              <div style={{ flex: 1, maxWidth: '240px', margin: '0 8px' }}>
                <input
                  type="text"
                  className="form-input"
                  style={{ padding: '6px 10px', fontSize: '0.85rem' }}
                  placeholder="Bookmark TOC Title"
                  value={bookmarkTitles[file.name] || file.name.replace(/\.pdf$/i, '')}
                  onChange={(e) => handleTitleChange(file.name, e.target.value)}
                  title="Bookmark outline title for this section"
                />
              </div>
            )}

            <div className="file-actions">
              <button
                className="file-action-btn"
                disabled={idx === 0}
                onClick={() => moveFile(idx, 'up')}
                title="Move Up"
              >
                <ArrowUp size={16} />
              </button>
              <button
                className="file-action-btn"
                disabled={idx === files.length - 1}
                onClick={() => moveFile(idx, 'down')}
                title="Move Down"
              >
                <ArrowDown size={16} />
              </button>
              <button
                className="file-action-btn danger"
                onClick={() => removeFile(idx)}
                title="Remove from queue"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Bookmarks Options */}
      <div className="settings-group">
        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={createBookmarks}
            onChange={(e) => setCreateBookmarks(e.target.checked)}
            style={{ width: '18px', height: '18px', accentColor: 'var(--purple-electric)' }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Bookmark size={18} color="var(--purple-goo)" />
            <span style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.95rem' }}>
              Create Interactive PDF Bookmarks (Document Table of Contents)
            </span>
          </div>
        </label>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: '28px' }}>
          Automatically embeds PDF outline bookmarks pointing to the first page of each merged document.
        </p>
      </div>

      {/* Progress Bar */}
      {isProcessing && mergeProgress && (
        <div style={{ marginTop: '8px' }}>
          <ProgressBar
            progress={mergeProgress.percent}
            label={mergeProgress.label}
            subLabel="Stitching documents into a unified PDF in browser RAM..."
            color="pink"
          />
        </div>
      )}

      {/* Action Button */}
      <div style={{ textAlign: 'center', marginTop: '10px' }}>
        <button
          className="btn-chunky btn-coral"
          style={{ fontSize: '1.2rem', padding: '14px 40px' }}
          disabled={isProcessing || files.length < 2}
          onClick={handleMerge}
        >
          {isProcessing ? 'STITCHING IN PROGRESS...' : `MERGE ${files.length} DOCUMENTS`}
        </button>
      </div>
    </div>
  );
};
