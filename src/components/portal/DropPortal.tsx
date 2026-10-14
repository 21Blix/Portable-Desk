import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, CheckCircle2, X, RotateCcw, RefreshCw } from 'lucide-react';
import { MascotCat } from './MascotCat';
import { formatBytes } from '../../lib/utils/file-helpers';
import { playPortalDropSound, playClickSound } from '../../lib/audio/sound-effects';
import { ProgressBar } from '../common/ProgressBar';

export interface LoadedFileItem {
  file: File;
  name: string;
  size: number;
  arrayBuffer: ArrayBuffer;
  pageCount?: number;
}

interface DropPortalProps {
  files: LoadedFileItem[];
  onFilesAccepted: (newFiles: File[], replace?: boolean) => void;
  onRemoveFile?: (index: number) => void;
  onClearAll?: () => void;
  uploadProgress?: { percent: number; label: string; subLabel?: string } | null;
  accept?: string;
  multiple?: boolean;
}

export const DropPortal: React.FC<DropPortalProps> = ({
  files,
  onFilesAccepted,
  onRemoveFile,
  onClearAll,
  uploadProgress = null,
  accept = '.pdf,application/pdf,image/*',
  multiple = true,
}) => {
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragOver) setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      playPortalDropSound();
      const droppedFiles = Array.from(e.dataTransfer.files);
      onFilesAccepted(droppedFiles, false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      playPortalDropSound();
      const selectedFiles = Array.from(e.target.files);
      onFilesAccepted(selectedFiles, false);
      e.target.value = '';
    }
  };

  const handleReplaceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      playPortalDropSound();
      const selectedFiles = Array.from(e.target.files);
      onFilesAccepted(selectedFiles, true);
      e.target.value = '';
    }
  };

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      {/* Mascot perched on the portal top rim */}
      <MascotCat />

      {/* Hidden native input for adding files */}
      <input
        ref={fileInputRef}
        type="file"
        multiple={multiple}
        accept={accept}
        style={{ display: 'none' }}
        onChange={handleInputChange}
      />

      {/* Hidden native input for replacing files directly */}
      <input
        ref={replaceInputRef}
        type="file"
        multiple={multiple}
        accept={accept}
        style={{ display: 'none' }}
        onChange={handleReplaceChange}
      />

      <div
        className={`portal-container ${isDragOver ? 'drag-active' : ''}`}
        onClick={() => {
          if (!uploadProgress) {
            fileInputRef.current?.click();
          }
        }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        title="Click or drop files to feed the portal"
      >
        {uploadProgress ? (
          <div style={{ width: '90%', margin: '0 auto', textAlign: 'center', pointerEvents: 'none' }}>
            <div className="portal-swirl-icon" style={{ transform: 'scale(1.15)', marginBottom: 8 }}>
              🌀
            </div>
            <ProgressBar
              progress={uploadProgress.percent}
              label={uploadProgress.label}
              subLabel={uploadProgress.subLabel || 'Ingesting files directly into browser memory...'}
              color="lime"
            />
          </div>
        ) : isDragOver ? (
          <div>
            <div className="portal-swirl-icon" style={{ transform: 'scale(1.3)' }}>
              🌀
            </div>
            <div className="portal-drag-alert">YES. FEED THE PORTAL.</div>
            <div style={{ fontFamily: 'var(--font-hand)', color: '#fff', fontSize: '1.25rem', marginTop: 4 }}>
              nom nom nom...
            </div>
          </div>
        ) : files.length > 0 ? (
          <div>
            <CheckCircle2 size={46} color="var(--lime-acid)" style={{ marginBottom: 8 }} />
            <div className="portal-prompt-main">
              {files.length} {files.length === 1 ? 'file' : 'files'} ingested!
            </div>
            <div className="portal-prompt-sub">
              Total: {formatBytes(files.reduce((acc, f) => acc + f.size, 0))}
            </div>
            <div
              style={{
                fontFamily: 'var(--font-hand)',
                fontSize: '1.05rem',
                color: 'var(--text-muted)',
                marginTop: 10,
              }}
            >
              (click or drop to feed more)
            </div>
          </div>
        ) : (
          <div>
            <UploadCloud className="portal-swirl-icon" />
            <div className="portal-prompt-main">drop your files here</div>
            <div className="portal-prompt-sub">or click to choose</div>
            <div
              style={{
                fontFamily: 'var(--font-hand)',
                color: 'var(--text-muted)',
                fontSize: '1.05rem',
                marginTop: 12,
              }}
            >
              accepts PDFs &amp; images • 100% browser local
            </div>
          </div>
        )}
      </div>

      {/* Ingested file list preview badge underneath */}
      {files.length > 0 && (
        <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {files.map((f, i) => (
            <div
              key={`${f.name}-${i}`}
              style={{
                background: 'var(--surface-panel)',
                border: '1px solid rgba(146, 91, 255, 0.3)',
                borderRadius: '8px',
                padding: '6px 10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '0.85rem',
                gap: 8,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden', flex: 1 }}>
                <FileText size={16} color="var(--lime-acid)" style={{ flexShrink: 0 }} />
                <span
                  style={{
                    color: 'var(--text-main)',
                    fontWeight: 600,
                    textOverflow: 'ellipsis',
                    overflow: 'hidden',
                    whiteSpace: 'nowrap',
                  }}
                  title={f.name}
                >
                  {f.name}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>
                  {f.pageCount ? `${f.pageCount} pgs • ` : ''}
                  {formatBytes(f.size)}
                </span>
                {onRemoveFile && (
                  <button
                    className="file-action-btn danger"
                    style={{ padding: '3px 6px' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      playClickSound();
                      onRemoveFile(i);
                    }}
                    title="Remove this file"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            </div>
          ))}

          {/* Workflow Management Buttons */}
          <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
            <button
              className="btn-chunky btn-dark"
              style={{ flex: 1, padding: '7px 10px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
              onClick={() => replaceInputRef.current?.click()}
              title="Replace current files with a new document"
            >
              <RefreshCw size={14} />
              <span>Replace File</span>
            </button>

            {onClearAll && (
              <button
                className="btn-chunky"
                style={{
                  flex: 1,
                  padding: '7px 10px',
                  fontSize: '0.8rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  background: 'rgba(255, 92, 168, 0.15)',
                  border: '1.5px solid var(--pink-hot)',
                  color: '#fff',
                }}
                onClick={() => {
                  playClickSound();
                  onClearAll();
                }}
                title="Wipe files and reset current workflow"
              >
                <RotateCcw size={14} color="var(--pink-hot)" />
                <span>Clear Workflow</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
