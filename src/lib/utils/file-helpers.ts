/**
 * Formats byte counts into human-readable strings (e.g. "1.42 MB")
 */
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';
  if (bytes < 1024) return `${bytes} Bytes`;
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

/**
 * Calculates percentage delta between original and new size
 */
export function calculateSizeDelta(originalSize: number, newSize: number): {
  diffBytes: number;
  percentChange: number;
  isSmaller: boolean;
  label: string;
} {
  const diffBytes = newSize - originalSize;
  const percentChange = originalSize > 0 ? ((newSize - originalSize) / originalSize) * 100 : 0;
  const isSmaller = diffBytes < 0;

  let label = '';
  if (diffBytes === 0) {
    label = 'Same size (0%)';
  } else if (isSmaller) {
    label = `${Math.abs(percentChange).toFixed(1)}% smaller (${formatBytes(Math.abs(diffBytes))} saved)`;
  } else {
    label = `${percentChange.toFixed(1)}% larger (+${formatBytes(diffBytes)})`;
  }

  return { diffBytes, percentChange, isSmaller, label };
}

/**
 * Programmatically triggers a file download in the browser
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 1000);
}

/**
 * Reads a File object into an ArrayBuffer
 */
export function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(reader.error || new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Safely retrieves a non-detached ArrayBuffer from a loaded file item.
 * If the existing buffer was ever detached by a worker transfer, this safely re-reads
 * fresh bytes from the File object and updates the cached buffer.
 * Always returns a cloned buffer to prevent caller mutations.
 */
export async function getSafeFileArrayBuffer(item: { file: File; arrayBuffer?: ArrayBuffer }): Promise<ArrayBuffer> {
  try {
    if (item.arrayBuffer && item.arrayBuffer.byteLength > 0) {
      return item.arrayBuffer.slice(0);
    }
  } catch {
    // Slicing or accessing byteLength threw because buffer was detached
  }
  const fresh = await item.file.arrayBuffer();
  try {
    item.arrayBuffer = fresh.slice(0);
  } catch {
    item.arrayBuffer = fresh;
  }
  return fresh.slice(0);
}

/**
 * Reads an image File into an HTMLImageElement
 */
export function loadImageElement(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(`Failed to load image: ${file.name}`));
    };
    img.src = url;
  });
}
