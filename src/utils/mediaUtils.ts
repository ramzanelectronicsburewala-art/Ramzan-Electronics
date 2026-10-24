export interface FileValidationResult {
  valid: boolean;
  error?: string;
  type?: 'image' | 'video';
}

export const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
export const MAX_VIDEO_SIZE_BYTES = 50 * 1024 * 1024; // 50MB

export const ALLOWED_IMAGE_MIMES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
export const ALLOWED_VIDEO_MIMES = ['video/mp4', 'video/webm', 'video/quicktime'];

export function validateUploadFile(file: { name: string; size: number; type: string }): FileValidationResult {
  if (!file) {
    return { valid: false, error: 'No file provided' };
  }

  const mime = file.type.toLowerCase();
  const isImage = ALLOWED_IMAGE_MIMES.includes(mime) || file.name.match(/\.(jpg|jpeg|png|webp|gif)$/i) !== null;
  const isVideo = ALLOWED_VIDEO_MIMES.includes(mime) || file.name.match(/\.(mp4|webm|mov)$/i) !== null;

  if (!isImage && !isVideo) {
    return {
      valid: false,
      error: 'Unsupported file format. Please upload JPG, PNG, WEBP, GIF, or MP4/WEBM video.'
    };
  }

  if (isImage && file.size > MAX_IMAGE_SIZE_BYTES) {
    return {
      valid: false,
      error: `Image size exceeds the 10MB limit (Current: ${formatFileSize(file.size)}).`
    };
  }

  if (isVideo && file.size > MAX_VIDEO_SIZE_BYTES) {
    return {
      valid: false,
      error: `Video size exceeds the 50MB limit (Current: ${formatFileSize(file.size)}).`
    };
  }

  return {
    valid: true,
    type: isVideo ? 'video' : 'image'
  };
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function getMediaType(urlOrMime: string): 'image' | 'video' {
  if (!urlOrMime) return 'image';
  const lower = urlOrMime.toLowerCase();
  if (
    lower.startsWith('video/') ||
    lower.endsWith('.mp4') ||
    lower.endsWith('.webm') ||
    lower.endsWith('.mov') ||
    lower.includes('player.vimeo') ||
    lower.includes('sample-video')
  ) {
    return 'video';
  }
  return 'image';
}
