import { PDFDocument } from 'pdf-lib';
import { loadPDFDocument } from './pdfjs-init';
import { calculateSizeDelta } from '../utils/file-helpers';

export type CompressionPreset = 'clean' | 'low' | 'medium' | 'high';

export interface CompressOptions {
  preset: CompressionPreset;
  quality: number; // 0.3 to 0.9 (for raster mode)
  onProgress?: (current: number, total: number) => void;
}

export interface CompressResult {
  data: Uint8Array;
  originalSize: number;
  newSize: number;
  delta: ReturnType<typeof calculateSizeDelta>;
  rasterized: boolean;
}

export async function compressPDF(
  originalData: ArrayBuffer,
  options: CompressOptions
): Promise<CompressResult> {
  const originalSize = originalData.byteLength;

  // Mode 1: Clean optimization (Non-destructive, preserves text & vectors)
  if (options.preset === 'clean') {
    const doc = await PDFDocument.load(originalData, { ignoreEncryption: true });
    // Remove unused objects and metadata
    doc.setTitle('');
    doc.setAuthor('');
    doc.setSubject('');
    doc.setKeywords([]);
    doc.setProducer('Portable Desk');
    doc.setCreator('Portable Desk');

    const outputBytes = await doc.save({
      useObjectStreams: true,
      addDefaultPage: false,
    });

    const newSize = outputBytes.byteLength;
    const delta = calculateSizeDelta(originalSize, newSize);

    return {
      data: outputBytes,
      originalSize,
      newSize,
      delta,
      rasterized: false,
    };
  }

  // Mode 2: Raster recompression (DPI-based downsampling)
  // Presets:
  // 'low': 72 DPI (scale approx 1.0)
  // 'medium': 100 DPI (scale approx 1.35)
  // 'high': 150 DPI (scale approx 2.0)
  let scale = 1.0;
  if (options.preset === 'low') scale = 0.95;
  if (options.preset === 'medium') scale = 1.25;
  if (options.preset === 'high') scale = 1.6;

  const pdfjsDoc = await loadPDFDocument(originalData);
  const totalPages = pdfjsDoc.numPages;
  const newPdf = await PDFDocument.create();

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable');

  for (let i = 1; i <= totalPages; i++) {
    options.onProgress?.(i, totalPages);
    const page = await pdfjsDoc.getPage(i);
    const viewport = page.getViewport({ scale });

    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    await page.render({
      canvasContext: ctx,
      viewport,
      canvas,
    }).promise;

    const jpegBlob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error('Failed to create JPEG blob'))),
        'image/jpeg',
        options.quality
      );
    });

    const imgBytes = new Uint8Array(await jpegBlob.arrayBuffer());
    const embeddedImg = await newPdf.embedJpg(imgBytes);

    // Maintain original unscaled dimensions for PDF page size in points
    const unscaledViewport = page.getViewport({ scale: 1.0 });
    const newPage = newPdf.addPage([unscaledViewport.width, unscaledViewport.height]);
    newPage.drawImage(embeddedImg, {
      x: 0,
      y: 0,
      width: unscaledViewport.width,
      height: unscaledViewport.height,
    });
  }

  const outputBytes = await newPdf.save({ useObjectStreams: true });
  const newSize = outputBytes.byteLength;
  const delta = calculateSizeDelta(originalSize, newSize);

  return {
    data: outputBytes,
    originalSize,
    newSize,
    delta,
    rasterized: true,
  };
}
