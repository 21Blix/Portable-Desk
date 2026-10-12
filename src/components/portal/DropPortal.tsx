import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, CheckCircle2 } from 'lucide-react';
import { MascotCat } from './MascotCat';
import { formatBytes } from '../../lib/utils/file-helpers';
import { playPortalDropSound } from '../../lib/audio/sound-effects';

export interface LoadedFileItem {
  file: File;
  name: string;
  size: number;
  arrayBuffer: ArrayBuffer;
  pageCount?: number;
}

interface DropPortalProps {
  files: LoadedFileItem[];
  onFilesAccepted: (newFiles: File[]) => void;
  accept?: string;
  multiple?: boolean;
}

export const DropPortal: React.FC<DropPortalProps> = ({
  files,
  onFilesAccepted,
  accept = '.pdf,application/pdf,image/*',
  multiple = true,
}) => {
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      onFilesAccepted(droppedFiles);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      playPortalDropSound();
      const selectedFiles = Array.from(e.target.files);
      onFilesAccepted(selectedFiles);
      e.target.value = '';
    }
  };

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      {/* Mascot perched on the portal top rim */}
      <MascotCat />

      {/* Hidden native input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple={multiple}
        accept={accept}
        style={{ display: 'none' }}
        onChange={handleInputChange}
      />

      <div
        className={`portal-container ${isDragOver ? 'drag-active' : ''}`}
        onClick={() => fileInputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        title="Click or drop files to feed the portal"
      >
        {isDragOver ? (
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
        <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {files.slice(0, 3).map((f, i) => (
            <div
              key={i}
              style={{
                background: 'var(--surface-panel)',
                border: '1px solid rgba(146, 91, 255, 0.3)',
                borderRadius: '8px',
                padding: '6px 12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '0.85rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
                <FileText size={16} color="var(--lime-acid)" />
                <span
                  style={{
                    color: 'var(--text-main)',
                    fontWeight: 600,
                    textOverflow: 'ellipsis',
                    overflow: 'hidden',
                    whiteSpace: 'nowrap',
                    maxWidth: '180px',
                  }}
                >
                  {f.name}
                </span>
              </div>
              <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>
                {f.pageCount ? `${f.pageCount} pgs • ` : ''}
                {formatBytes(f.size)}
              </span>
            </div>
          ))}
          {files.length > 3 && (
            <div
              style={{
                textAlign: 'center',
                fontFamily: 'var(--font-hand)',
                color: 'var(--lime-acid)',
                fontSize: '1rem',
              }}
            >
              + {files.length - 3} more files waiting in RAM!
            </div>
          )}
        </div>
      )}
    </div>
  );
};
