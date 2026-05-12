/** Max raw file size for banner video uploads (stored as base64 in localStorage alongside other banner JSON). */
export const BANNER_VIDEO_MAX_FILE_BYTES = 6 * 1024 * 1024;

/**
 * Reads a local video file as a data URL for storing in localStorage with the banner JSON.
 * Base64 expands size (~33%); total quota errors are handled when saving.
 */
export async function readVideoFileAsDataUrl(
  file: File,
  maxFileBytes: number = BANNER_VIDEO_MAX_FILE_BYTES
): Promise<string> {
  if (!file.type.startsWith('video/')) {
    throw new Error('Please choose a video file (.mp4, .webm, .mov, etc.).');
  }
  if (file.size > maxFileBytes) {
    const mb = (maxFileBytes / (1024 * 1024)).toFixed(0);
    throw new Error(`Video must be at most ${mb}MB. Use a shorter clip or stronger compression.`);
  }

  return new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = () => reject(new Error('Could not read the video file.'));
    r.readAsDataURL(file);
  });
}
