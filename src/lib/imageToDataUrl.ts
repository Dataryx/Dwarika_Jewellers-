const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/bmp', 'image/svg+xml']);

export type CompressImageOptions = {
  /** Longer edge in pixels (default 1920) */
  maxEdge?: number;
  /** Target max decoded size in bytes (default ~550KB) */
  maxBlobBytes?: number;
};

function approxDecodedBytes(dataUrl: string): number {
  const base64 = dataUrl.split(',')[1];
  if (!base64) return 0;
  return Math.floor((base64.length * 3) / 4);
}

/**
 * Reads a local image file, downscales if needed, and returns a JPEG data URL
 * suitable for storing in localStorage or sending as `image_url` in the API.
 */
export async function compressImageFileToDataUrl(
  file: File,
  opts?: CompressImageOptions
): Promise<string> {
  const maxEdge = opts?.maxEdge ?? 1920;
  const maxBlobBytes = opts?.maxBlobBytes ?? 550_000;

  if (!file.type || (!IMAGE_TYPES.has(file.type) && !file.type.startsWith('image/'))) {
    throw new Error('Please choose an image file (JPEG, PNG, WebP, GIF, etc.).');
  }

  if (file.size > 25 * 1024 * 1024) {
    throw new Error('File is too large (max 25MB before processing).');
  }

  if (file.type === 'image/svg+xml') {
    if (file.size > 200_000) throw new Error('SVG must be under 200KB.');
    return new Promise<string>((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result as string);
      r.onerror = () => reject(new Error('Could not read SVG.'));
      r.readAsDataURL(file);
    });
  }

  const bitmap = await createImageBitmap(file);
  try {
    const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
    const w = Math.max(1, Math.round(bitmap.width * scale));
    const h = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not process image in this browser.');

    if (file.type === 'image/png' || file.type === 'image/webp' || file.type === 'image/gif') {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, w, h);
    }
    ctx.drawImage(bitmap, 0, 0, w, h);

    let quality = 0.9;
    let dataUrl = canvas.toDataURL('image/jpeg', quality);
    for (let i = 0; i < 14; i++) {
      if (approxDecodedBytes(dataUrl) <= maxBlobBytes) break;
      quality -= 0.06;
      if (quality < 0.42) break;
      dataUrl = canvas.toDataURL('image/jpeg', quality);
    }

    if (approxDecodedBytes(dataUrl) > maxBlobBytes * 1.2) {
      throw new Error(
        'Image is still too large after compressing. Try a smaller file or lower-resolution photo.'
      );
    }

    return dataUrl;
  } finally {
    bitmap.close?.();
  }
}
