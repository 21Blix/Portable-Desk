import React, { useState } from 'react';
import { Navbar } from '../components/common/Navbar';
import { Footer } from '../components/common/Footer';
import { ToastContainer, type ToastItem } from '../components/common/Toast';
import { AboutModal } from '../components/common/AboutModal';
import { DropPortal, type LoadedFileItem } from '../components/portal/DropPortal';
import { FloatingIsland } from '../components/island/FloatingIsland';
import { ToolPedestals, type ToolType } from '../components/island/ToolPedestals';
import { CRTPreview } from '../components/contraptions/CRTPreview';
import { ProcessingMachine, type MachineStatus } from '../components/contraptions/ProcessingMachine';
import { ToolModalWrapper } from '../components/workspace/ToolModalWrapper';

// Tool Workspaces
import { MergeWorkspace } from '../tools/merge/MergeWorkspace';
import { SplitWorkspace } from '../tools/split/SplitWorkspace';
import { OrganizeWorkspace } from '../tools/organize/OrganizeWorkspace';
import { CompressWorkspace } from '../tools/compress/CompressWorkspace';
import { PDFToImagesWorkspace } from '../tools/pdf-to-images/PDFToImagesWorkspace';
import { ImagesToPDFWorkspace } from '../tools/images-to-pdf/ImagesToPDFWorkspace';
import { RotateWorkspace } from '../tools/rotate/RotateWorkspace';
import { PageNumbersWorkspace } from '../tools/page-numbers/PageNumbersWorkspace';

import { readFileAsArrayBuffer } from '../lib/utils/file-helpers';
import { loadPDFDocument } from '../lib/pdf/pdfjs-init';
import { playClickSound, playErrorSound, playProcessSound } from '../lib/audio/sound-effects';

export const App: React.FC = () => {
  const [files, setFiles] = useState<LoadedFileItem[]>([]);
  const [rawImageFiles, setRawImageFiles] = useState<File[]>([]);
  const [activeTool, setActiveTool] = useState<ToolType | null>(null);
  const [isAboutOpen, setIsAboutOpen] = useState<boolean>(false);
  const [operationsCount, setOperationsCount] = useState<number>(0);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [uploadProgress, setUploadProgress] = useState<{ percent: number; label: string; subLabel?: string } | null>(null);

  const addToast = (message: string, type: 'info' | 'error' | 'success' = 'info') => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const handleFilesAccepted = async (incomingFiles: File[], replace = false) => {
    if (incomingFiles.length === 0) return;

    try {
      setUploadProgress({
        percent: 10,
        label: `Uploading & ingesting ${incomingFiles.length} file(s)...`,
        subLabel: 'Buffering into local browser memory...',
      });

      const newItems: LoadedFileItem[] = [];
      const newImages: File[] = [];
      const total = incomingFiles.length;

      for (let i = 0; i < total; i++) {
        const file = incomingFiles[i];
        const currentPercent = Math.round(15 + ((i + 0.5) / total) * 75);

        setUploadProgress({
          percent: currentPercent,
          label: `Ingesting "${file.name}" (${i + 1} of ${total})...`,
          subLabel: 'Parsing PDF structure & verifying page tree...',
        });

        // Small yield so the UI and progress bar animate
        await new Promise((r) => setTimeout(r, 40));

        if (file.type.startsWith('image/')) {
          newImages.push(file);
          continue;
        }

        if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
          const buffer = await readFileAsArrayBuffer(file);
          let pageCount = 1;
          try {
            const doc = await loadPDFDocument(buffer.slice(0));
            pageCount = doc.numPages;
          } catch (e) {
            console.warn('PDF page count read error:', e);
          }

          newItems.push({
            file,
            name: file.name,
            size: file.size,
            arrayBuffer: buffer,
            pageCount,
          });
        } else {
          addToast(`"${file.name}" is not a PDF or image file.`, 'error');
          playErrorSound();
        }
      }

      setUploadProgress({
        percent: 100,
        label: 'Ready!',
        subLabel: 'All files safely held in browser RAM.',
      });
      await new Promise((r) => setTimeout(r, 150));

      if (replace) {
        setFiles(newItems);
        setRawImageFiles(newImages);
        setActiveTool(null);
        if (newItems.length > 0) {
          addToast(`Replaced document with "${newItems[0].name}"!`, 'success');
        } else if (newImages.length > 0) {
          addToast(`Replaced with ${newImages.length} image(s)!`, 'success');
        }
      } else {
        if (newItems.length > 0) {
          setFiles((prev) => [...prev, ...newItems]);
          addToast(
            `Ingested ${newItems.length} PDF${newItems.length > 1 ? 's' : ''} into browser memory!`,
            'success'
          );
        }

        if (newImages.length > 0) {
          setRawImageFiles((prev) => [...prev, ...newImages]);
          addToast(`Ingested ${newImages.length} image${newImages.length > 1 ? 's' : ''}!`, 'success');
          // Auto-suggest images-to-pdf if user dropped only images
          if (files.length === 0 && newItems.length === 0) {
            setActiveTool('images-to-pdf');
          }
        }
      }
    } catch (err: any) {
      addToast(err.message || 'Error loading files', 'error');
      playErrorSound();
    } finally {
      setUploadProgress(null);
    }
  };

  const handleRemoveFile = (index: number) => {
    setFiles((prev) => {
      const updated = prev.filter((_, i) => i !== index);
      if (updated.length === 0 && rawImageFiles.length === 0) {
        setActiveTool(null);
      }
      return updated;
    });
    addToast('File removed from workflow.', 'info');
  };

  const handleClearWorkflow = () => {
    playProcessSound();
    setFiles([]);
    setRawImageFiles([]);
    setActiveTool(null);
    addToast('Workflow cleared! Portal is reset and hungry for new files.', 'info');
  };

  const handleToolSelect = (tool: ToolType) => {
    if (tool === 'images-to-pdf') {
      setActiveTool(tool);
      return;
    }

    if (files.length === 0) {
      addToast('The machine is hungry! Drop a PDF into the purple portal first.', 'info');
      playErrorSound();
      return;
    }

    if (tool === 'merge' && files.length < 2) {
      addToast('Merge requires at least 2 PDFs. Feed another into the portal or add in workspace!', 'info');
    }

    setActiveTool(tool);
  };

  const handleResetWorkspace = () => {
    setActiveTool(null);
    setOperationsCount((c) => c + 1);
  };

  const handleMachineProcessClick = () => {
    if (activeTool) return;
    if (files.length >= 2) {
      setActiveTool('merge');
    } else if (files.length === 1) {
      setActiveTool('organize');
    } else if (rawImageFiles.length > 0) {
      setActiveTool('images-to-pdf');
    } else {
      addToast('Feed a document into the portal to begin processing!', 'info');
      playErrorSound();
    }
  };

  // Determine machine button label
  const getMachineStatus = (): MachineStatus => {
    if (files.length > 0 || rawImageFiles.length > 0) return 'ready';
    return 'idle';
  };

  // Selected primary PDF for preview
  const primaryPdf = files.length > 0 ? files[0] : null;
  const hasActiveFiles = files.length > 0 || rawImageFiles.length > 0;

  return (
    <div className="playground-container">
      {/* Top Header */}
      <Navbar
        onOpenAbout={() => setIsAboutOpen(true)}
        onResetDesk={handleClearWorkflow}
        hasActiveFiles={hasActiveFiles}
      />

      {/* Hero Title Section */}
      <section className="hero-header">
        <h1
          className="chunky-logo"
          onClick={() => {
            playClickSound();
            addToast('Boing! Portable Desk is alive.', 'info');
          }}
        >
          PORTABLE DESK
        </h1>
        <div className="hero-tagline">
          <span>merge.</span>
          <span style={{ color: 'var(--lime-acid)' }}>split.</span>
          <span style={{ color: 'var(--pink-hot)' }}>rotate.</span>
          <span style={{ color: 'var(--cyan-electric)' }}>convert. no one can see.</span>
        </div>

        {/* Hand-drawn underline SVG */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <svg className="hand-underline" width="340" height="18" viewBox="0 0 340 18">
            <path
              d="M4 12 Q90 4 170 12 T336 8"
              fill="none"
              stroke="var(--pink-hot)"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
          </svg>
        </div>
      </section>

      {/* Main 3-Column Fantasy Workbench */}
      <main className="main-stage">
        {/* Left Column: Organic Purple Goo Portal */}
        <div className="stage-left">
          <DropPortal
            files={files}
            onFilesAccepted={handleFilesAccepted}
            onRemoveFile={handleRemoveFile}
            onClearAll={handleClearWorkflow}
            uploadProgress={uploadProgress}
          />
        </div>

        {/* Center Column: The Floating Island & Tool Pedestals */}
        <div className="stage-center">
          <FloatingIsland />
          <ToolPedestals
            onSelectTool={handleToolSelect}
            activeTool={activeTool}
          />
        </div>

        {/* Right Column: CRT Scantron & Industrial Reactor */}
        <div className="stage-right">
          <CRTPreview
            fileItem={primaryPdf}
            filename={primaryPdf ? primaryPdf.name : undefined}
            onClearFile={handleClearWorkflow}
          />

          <ProcessingMachine
            status={getMachineStatus()}
            onProcess={handleMachineProcessClick}
          />
        </div>
      </main>

      {/* Tool Workbenches (Accessible Dialogs) */}
      {activeTool === 'merge' && (
        <ToolModalWrapper
          title="Merge PDF"
          tagline="stick them together!"
          onClose={() => setActiveTool(null)}
          onClearWorkflow={handleClearWorkflow}
        >
          <MergeWorkspace
            initialFiles={files}
            onAddNewFiles={(newFiles) => handleFilesAccepted(newFiles, false)}
            onReset={handleResetWorkspace}
          />
        </ToolModalWrapper>
      )}

      {activeTool === 'split' && primaryPdf && (
        <ToolModalWrapper
          title="Split PDF"
          tagline="chop it up!"
          onClose={() => setActiveTool(null)}
          onClearWorkflow={handleClearWorkflow}
        >
          <SplitWorkspace
            file={primaryPdf}
            onReset={handleResetWorkspace}
          />
        </ToolModalWrapper>
      )}

      {activeTool === 'organize' && primaryPdf && (
        <ToolModalWrapper
          title="Organize PDF"
          tagline="reorder, delete, rotate"
          onClose={() => setActiveTool(null)}
          onClearWorkflow={handleClearWorkflow}
        >
          <OrganizeWorkspace
            file={primaryPdf}
            onReset={handleResetWorkspace}
          />
        </ToolModalWrapper>
      )}

      {activeTool === 'compress' && primaryPdf && (
        <ToolModalWrapper
          title="Compress PDF"
          tagline="make it smaller!"
          onClose={() => setActiveTool(null)}
          onClearWorkflow={handleClearWorkflow}
        >
          <CompressWorkspace
            file={primaryPdf}
            onReset={handleResetWorkspace}
          />
        </ToolModalWrapper>
      )}

      {activeTool === 'pdf-to-images' && primaryPdf && (
        <ToolModalWrapper
          title="PDF to Images"
          tagline="turn pages into pics"
          onClose={() => setActiveTool(null)}
          onClearWorkflow={handleClearWorkflow}
        >
          <PDFToImagesWorkspace
            file={primaryPdf}
            onReset={handleResetWorkspace}
          />
        </ToolModalWrapper>
      )}

      {activeTool === 'images-to-pdf' && (
        <ToolModalWrapper
          title="Images to PDF"
          tagline="pics to pdf!"
          onClose={() => setActiveTool(null)}
          onClearWorkflow={handleClearWorkflow}
        >
          <ImagesToPDFWorkspace
            initialImages={rawImageFiles}
            onReset={handleResetWorkspace}
          />
        </ToolModalWrapper>
      )}

      {activeTool === 'rotate' && primaryPdf && (
        <ToolModalWrapper
          title="Rotate PDF"
          tagline="spin it!"
          onClose={() => setActiveTool(null)}
          onClearWorkflow={handleClearWorkflow}
        >
          <RotateWorkspace
            file={primaryPdf}
            onReset={handleResetWorkspace}
          />
        </ToolModalWrapper>
      )}

      {activeTool === 'page-numbers' && primaryPdf && (
        <ToolModalWrapper
          title="Add Page Numbers"
          tagline="add some numbers!"
          onClose={() => setActiveTool(null)}
          onClearWorkflow={handleClearWorkflow}
        >
          <PageNumbersWorkspace
            file={primaryPdf}
            onReset={handleResetWorkspace}
          />
        </ToolModalWrapper>
      )}

      {/* About & Privacy Modal */}
      {isAboutOpen && <AboutModal onClose={() => setIsAboutOpen(false)} />}

      {/* Toast Notifications */}
      <ToastContainer
        toasts={toasts}
        onDismiss={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))}
      />

      {/* Footer */}
      <Footer operationsCount={operationsCount} />
    </div>
  );
};
