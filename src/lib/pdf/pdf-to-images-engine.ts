import JSZip from 'jszip';
import { loadPDFDocument } from './pdfjs-init';

export interface PDFToImageOptions {
  format: 'image/jpeg' | 'image/png';
  quality: number; // 0.1 to 1.0 (for JPEG)
  scale: number; // 1.0 to 2.5
  pages?: number[]; // 1-indexed
  onProgress?: (current: number, total: number) => void;
}

export interface ConvertedImageResult {
  pageNumber: number;
  filename: string;
  blob: Blob;
  previewUrl: string;
}

export async function convertPDFToImages(
  data: ArrayBuffer,
  baseFilename: string,
  options: PDFToImageOptions
): Promise<ConvertedImageResult[]> {
  const doc = await loadPDFDocument(data);
  const totalDocPages = doc.numPages;
  const targetPages = options.pages && options.pages.length > 0
    ? options.pages.filter((p) => p >= 1 && p <= totalDocPages)
    : Array.from({ length: totalDocPages }, (_, i) => i + 1);

  const cleanBaseName = baseFilename.replace(/\.pdf$/i, '');
  const ext = options.format === 'image/jpeg' ? 'jpg' : 'png';
  const results: ConvertedImageResult[] = [];

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable');

  for (let i = 0; i < targetPages.length; i++) {
    const pageNum = targetPages[i];
    options.onProgress?.(i + 1, targetPages.length);

    const page = await doc.getPage(pageNum);
    const viewport = page.getViewport({ scale: options.scale });

    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);

    // Clean white canvas for JPEG transparency safety
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    await page.render({
      canvasContext: ctx,
      viewport,
      canvas,
    }).promise;

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => {
          if (b) resolve(b);
          else reject(new Error(`Failed to capture canvas for page ${pageNum}`));
        },
        options.format,
        options.format === 'image/jpeg' ? options.quality : undefined
      );
    });

    const pageStr = String(pageNum).padStart(3, '0');
    const filename = `${cleanBaseName}-page-${pageStr}.${ext}`;
    const previewUrl = URL.createObjectURL(blob);

    results.push({
      pageNumber: pageNum,
      filename,
      blob,
      previewUrl,
    });
  }

  return results;
}

/**
 * Packages multiple converted image blobs into a single downloadable ZIP
 */
export async function packageImagesAsZip(
  images: ConvertedImageResult[],
  _zipFilename?: string
): Promise<Blob> {
  const zip = new JSZip();
  for (const img of images) {
    zip.file(img.filename, img.blob);
  }
  return await zip.generateAsync({ type: 'blob' });
}
