import * as pdfjsLib from 'pdfjs-dist';
// Vite handles ?url by generating a hashed worker asset URL
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

// Initialize worker source
if (typeof window !== 'undefined' && pdfjsLib.GlobalWorkerOptions) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;
}

export { pdfjsLib };

export interface PDFDocumentInfo {
  numPages: number;
  doc: pdfjsLib.PDFDocumentProxy;
}

/**
 * Loads a PDF Document Proxy from an ArrayBuffer or Uint8Array
 */
export async function loadPDFDocument(data: ArrayBuffer | Uint8Array): Promise<pdfjsLib.PDFDocumentProxy> {
  const sourceBytes = data instanceof Uint8Array ? data : new Uint8Array(data);
  // Uint8Array.prototype.slice() creates an independent copy backed by a new ArrayBuffer.
  // This prevents the PDF.js Web Worker from detaching the caller's ArrayBuffer!
  const isolatedBytes = sourceBytes.slice();

  const loadingTask = pdfjsLib.getDocument({
    data: isolatedBytes,
    cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/cmaps/',
    cMapPacked: true,
  });
  return await loadingTask.promise;
}

/**
 * Renders a single PDF page to a canvas context
 */
export async function renderPageToCanvas(
  doc: pdfjsLib.PDFDocumentProxy,
  pageNumber: number,
  canvas: HTMLCanvasElement,
  scale = 1.0,
  rotationOffset = 0
): Promise<{ width: number; height: number }> {
  const page = await doc.getPage(pageNumber);
  const viewport = page.getViewport({ scale, rotation: (page.rotate + rotationOffset) % 360 });

  canvas.width = viewport.width;
  canvas.height = viewport.height;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get 2D canvas context');

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const renderContext = {
    canvasContext: ctx,
    viewport: viewport,
    canvas: canvas,
  };

  await page.render(renderContext).promise;
  return { width: viewport.width, height: viewport.height };
}

/**
 * Renders a thumbnail DataURL for a specific page
 */
export async function renderPageThumbnail(
  doc: pdfjsLib.PDFDocumentProxy,
  pageNumber: number,
  maxDimension = 200,
  rotationOffset = 0
): Promise<string> {
  const page = await doc.getPage(pageNumber);
  const unscaledViewport = page.getViewport({ scale: 1.0, rotation: (page.rotate + rotationOffset) % 360 });
  const scale = Math.min(maxDimension / unscaledViewport.width, maxDimension / unscaledViewport.height);
  const viewport = page.getViewport({ scale, rotation: (page.rotate + rotationOffset) % 360 });

  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.floor(viewport.width));
  canvas.height = Math.max(1, Math.floor(viewport.height));

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get 2D canvas context');

  // Fill paper background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  await page.render({
    canvasContext: ctx,
    viewport,
    canvas,
  }).promise;

  return canvas.toDataURL('image/jpeg', 0.85);
}
