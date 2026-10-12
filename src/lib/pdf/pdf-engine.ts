import {
  PDFDocument,
  PDFName,
  PDFDict,
  PDFArray,
  PDFHexString,
  PDFNumber,
  degrees,
  rgb,
  StandardFonts,
} from 'pdf-lib';

/**
 * Creates PDF Document Outlines (Bookmarks) using pdf-lib low-level dictionaries
 */
function createPDFOutlines(
  doc: PDFDocument,
  bookmarks: { title: string; pageIndex: number }[]
) {
  if (bookmarks.length === 0) return;

  const context = doc.context;
  const pages = doc.getPages();

  // Create Outline Items
  const itemRefs = bookmarks.map((b) => {
    const pageIndex = Math.min(Math.max(0, b.pageIndex), pages.length - 1);
    const targetPage = pages[pageIndex];

    const destArray = PDFArray.withContext(context);
    destArray.push(targetPage.ref);
    destArray.push(PDFName.of('Fit'));

    const itemDict = PDFDict.withContext(context);
    itemDict.set(PDFName.of('Title'), PDFHexString.fromText(b.title));
    itemDict.set(PDFName.of('Dest'), destArray);

    return { dict: itemDict, ref: context.register(itemDict) };
  });

  // Create Outlines Dictionary
  const outlinesDict = PDFDict.withContext(context);
  const outlinesRef = context.register(outlinesDict);

  outlinesDict.set(PDFName.of('Type'), PDFName.of('Outlines'));
  outlinesDict.set(PDFName.of('Count'), PDFNumber.of(bookmarks.length));
  outlinesDict.set(PDFName.of('First'), itemRefs[0].ref);
  outlinesDict.set(PDFName.of('Last'), itemRefs[itemRefs.length - 1].ref);

  // Link items (Parent, Prev, Next)
  for (let i = 0; i < itemRefs.length; i++) {
    const current = itemRefs[i];
    current.dict.set(PDFName.of('Parent'), outlinesRef);

    if (i > 0) {
      current.dict.set(PDFName.of('Prev'), itemRefs[i - 1].ref);
    }
    if (i < itemRefs.length - 1) {
      current.dict.set(PDFName.of('Next'), itemRefs[i + 1].ref);
    }
  }

  // Attach to catalog
  doc.catalog.set(PDFName.of('Outlines'), outlinesRef);
}

// ==========================================
// 1. MERGE PDF
// ==========================================
export interface MergeFileInput {
  name: string;
  data: ArrayBuffer;
  customBookmarkTitle?: string;
}

export async function mergePDFs(
  files: MergeFileInput[],
  options: { createBookmarks?: boolean } = {}
): Promise<Uint8Array> {
  const mergedPdf = await PDFDocument.create();
  const bookmarks: { title: string; pageIndex: number }[] = [];
  let currentPageOffset = 0;

  for (const file of files) {
    const srcDoc = await PDFDocument.load(file.data, { ignoreEncryption: true });
    const copiedPages = await mergedPdf.copyPages(srcDoc, srcDoc.getPageIndices());

    if (copiedPages.length > 0) {
      const cleanTitle = (file.customBookmarkTitle || file.name).replace(/\.pdf$/i, '');
      bookmarks.push({
        title: cleanTitle,
        pageIndex: currentPageOffset,
      });

      for (const page of copiedPages) {
        mergedPdf.addPage(page);
      }
      currentPageOffset += copiedPages.length;
    }
  }

  if (options.createBookmarks && bookmarks.length > 0) {
    createPDFOutlines(mergedPdf, bookmarks);
  }

  return await mergedPdf.save();
}

// ==========================================
// 2. SPLIT PDF
// ==========================================
export interface SplitResultFile {
  filename: string;
  data: Uint8Array;
}

export async function splitPDF(
  data: ArrayBuffer,
  baseFilename: string,
  mode: 'range' | 'burst' | 'chunks',
  options: {
    selectedPages?: number[]; // 1-indexed
    chunkSize?: number;
  }
): Promise<SplitResultFile[]> {
  const srcDoc = await PDFDocument.load(data, { ignoreEncryption: true });
  const totalPages = srcDoc.getPageCount();
  const baseName = baseFilename.replace(/\.pdf$/i, '');
  const results: SplitResultFile[] = [];

  if (mode === 'range') {
    const pagesToExtract = (options.selectedPages || []).map((p) => p - 1);
    if (pagesToExtract.length === 0) {
      throw new Error('No pages selected to extract.');
    }

    const newDoc = await PDFDocument.create();
    const copiedPages = await newDoc.copyPages(srcDoc, pagesToExtract);
    copiedPages.forEach((p) => newDoc.addPage(p));

    const bytes = await newDoc.save();
    results.push({
      filename: `${baseName}-extracted.pdf`,
      data: bytes,
    });
  } else if (mode === 'burst') {
    for (let i = 0; i < totalPages; i++) {
      const newDoc = await PDFDocument.create();
      const [copiedPage] = await newDoc.copyPages(srcDoc, [i]);
      newDoc.addPage(copiedPage);

      const bytes = await newDoc.save();
      const pageNumStr = String(i + 1).padStart(3, '0');
      results.push({
        filename: `${baseName}-page-${pageNumStr}.pdf`,
        data: bytes,
      });
    }
  } else if (mode === 'chunks') {
    const chunkSize = Math.max(1, options.chunkSize || 2);
    let chunkIndex = 1;

    for (let i = 0; i < totalPages; i += chunkSize) {
      const pageIndices = [];
      for (let j = i; j < Math.min(i + chunkSize, totalPages); j++) {
        pageIndices.push(j);
      }

      const newDoc = await PDFDocument.create();
      const copiedPages = await newDoc.copyPages(srcDoc, pageIndices);
      copiedPages.forEach((p) => newDoc.addPage(p));

      const bytes = await newDoc.save();
      const partNumStr = String(chunkIndex).padStart(2, '0');
      results.push({
        filename: `${baseName}-part-${partNumStr}.pdf`,
        data: bytes,
      });
      chunkIndex++;
    }
  }

  return results;
}

// ==========================================
// 3. ORGANIZE PDF
// ==========================================
export interface OrganizedPageItem {
  originalIndex: number; // 0-indexed
  rotation: number; // 0, 90, 180, 270 degrees
}

export async function organizePDF(
  data: ArrayBuffer,
  pageOrder: OrganizedPageItem[]
): Promise<Uint8Array> {
  const srcDoc = await PDFDocument.load(data, { ignoreEncryption: true });
  const newDoc = await PDFDocument.create();

  for (const item of pageOrder) {
    const [copiedPage] = await newDoc.copyPages(srcDoc, [item.originalIndex]);
    const currentRot = copiedPage.getRotation().angle;
    copiedPage.setRotation(degrees((currentRot + item.rotation) % 360));
    newDoc.addPage(copiedPage);
  }

  return await newDoc.save();
}

// ==========================================
// 4. ROTATE PDF
// ==========================================
export async function rotatePDF(
  data: ArrayBuffer,
  targetPageNumbers: number[], // 1-indexed
  rotationDelta: number // 90, 180, 270
): Promise<Uint8Array> {
  const doc = await PDFDocument.load(data, { ignoreEncryption: true });
  const pages = doc.getPages();
  const targetSet = new Set(targetPageNumbers.map((n) => n - 1));

  pages.forEach((page, idx) => {
    if (targetSet.has(idx)) {
      const currentAngle = page.getRotation().angle;
      page.setRotation(degrees((currentAngle + rotationDelta) % 360));
    }
  });

  return await doc.save();
}

// ==========================================
// 5. ADD PAGE NUMBERS
// ==========================================
export type PageNumberPosition =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right';

export interface PageNumberOptions {
  format: '{n}' | 'Page {n}' | '{n} / {total}' | '- {n} -';
  position: PageNumberPosition;
  fontSize: number;
  textColorHex: string;
  marginOffset: number; // pt offset from margin
  startNumber: number;
  startFromPage: number; // 1-indexed
  skipCover: boolean;
}

function hexToRgb01(hex: string) {
  let c = hex.replace('#', '');
  if (c.length === 3) c = c.split('').map((x) => x + x).join('');
  const num = parseInt(c, 16);
  return rgb(((num >> 16) & 255) / 255, ((num >> 8) & 255) / 255, (num & 255) / 255);
}

export async function addPageNumbers(
  data: ArrayBuffer,
  options: PageNumberOptions
): Promise<Uint8Array> {
  const doc = await PDFDocument.load(data, { ignoreEncryption: true });
  const pages = doc.getPages();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const color = hexToRgb01(options.textColorHex || '#11131c');

  const totalPages = pages.length;
  let counter = options.startNumber;

  for (let i = 0; i < totalPages; i++) {
    const pageNum = i + 1;
    if (options.skipCover && pageNum === 1) continue;
    if (pageNum < options.startFromPage) continue;

    const page = pages[i];
    const { width, height } = page.getSize();

    // Format text
    let text = options.format.replace('{n}', String(counter));
    text = text.replace('{total}', String(totalPages));

    const textWidth = font.widthOfTextAtSize(text, options.fontSize);
    const textHeight = font.heightAtSize(options.fontSize);

    const margin = options.marginOffset;
    let x = margin;
    let y = margin;

    // Determine X position
    if (options.position.includes('left')) {
      x = margin;
    } else if (options.position.includes('center')) {
      x = (width - textWidth) / 2;
    } else if (options.position.includes('right')) {
      x = width - textWidth - margin;
    }

    // Determine Y position
    if (options.position.startsWith('top')) {
      y = height - textHeight - margin;
    } else {
      y = margin;
    }

    page.drawText(text, {
      x,
      y,
      size: options.fontSize,
      font,
      color,
    });

    counter++;
  }

  return await doc.save();
}

// ==========================================
// 6. IMAGES TO PDF
// ==========================================
export interface ImageInputItem {
  file: File;
  previewUrl: string;
}

export interface ImagesToPDFSettings {
  pageSize: 'A4' | 'LETTER' | 'FIT';
  orientation: 'portrait' | 'landscape' | 'auto';
  marginPt: number; // 0, 20, 40
  imageFit: 'fit' | 'fill';
  backgroundColorHex: string;
}

// Standard dimensions in points (72 pt per inch)
const PAGE_DIMENSIONS = {
  A4: { width: 595.28, height: 841.89 },
  LETTER: { width: 612.0, height: 792.0 },
};

/**
 * Transcodes any image File (JPEG, PNG, WebP, etc.) into clean PNG or JPEG bytes via offscreen canvas
 */
async function transcodeImageToBytes(file: File): Promise<{ bytes: Uint8Array; format: 'jpg' | 'png' }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas context unavailable'));
        return;
      }
      ctx.drawImage(img, 0, 0);

      canvas.toBlob(
        async (blob) => {
          if (!blob) {
            reject(new Error('Failed to convert image to blob'));
            return;
          }
          const buf = await blob.arrayBuffer();
          resolve({ bytes: new Uint8Array(buf), format: 'png' });
        },
        'image/png'
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(`Failed to load image: ${file.name}`));
    };
    img.src = url;
  });
}

export async function imagesToPDF(
  images: ImageInputItem[],
  settings: ImagesToPDFSettings
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();

  for (const item of images) {
    const { bytes, format } = await transcodeImageToBytes(item.file);
    const embeddedImage =
      format === 'png' ? await doc.embedPng(bytes) : await doc.embedJpg(bytes);

    const imgWidth = embeddedImage.width;
    const imgHeight = embeddedImage.height;

    let pageWidth = imgWidth;
    let pageHeight = imgHeight;

    if (settings.pageSize !== 'FIT') {
      const baseDim = PAGE_DIMENSIONS[settings.pageSize];
      const isLandscape =
        settings.orientation === 'landscape' ||
        (settings.orientation === 'auto' && imgWidth > imgHeight);

      pageWidth = isLandscape ? baseDim.height : baseDim.width;
      pageHeight = isLandscape ? baseDim.width : baseDim.height;
    }

    const page = doc.addPage([pageWidth, pageHeight]);

    // Optional background
    if (settings.backgroundColorHex) {
      page.drawRectangle({
        x: 0,
        y: 0,
        width: pageWidth,
        height: pageHeight,
        color: hexToRgb01(settings.backgroundColorHex),
      });
    }

    const margin = settings.pageSize === 'FIT' ? 0 : settings.marginPt;
    const availWidth = Math.max(10, pageWidth - margin * 2);
    const availHeight = Math.max(10, pageHeight - margin * 2);

    let drawWidth = availWidth;
    let drawHeight = availHeight;
    let drawX = margin;
    let drawY = margin;

    if (settings.imageFit === 'fit') {
      const scale = Math.min(availWidth / imgWidth, availHeight / imgHeight);
      drawWidth = imgWidth * scale;
      drawHeight = imgHeight * scale;
      drawX = margin + (availWidth - drawWidth) / 2;
      drawY = margin + (availHeight - drawHeight) / 2;
    }

    page.drawImage(embeddedImage, {
      x: drawX,
      y: drawY,
      width: drawWidth,
      height: drawHeight,
    });
  }

  return await doc.save();
}
