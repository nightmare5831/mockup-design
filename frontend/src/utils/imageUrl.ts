/**
 * Utility function to construct proper image URLs
 * Handles both relative paths (local storage) and absolute URLs (S3)
 */
export const getImageUrl = (imagePath?: string | null): string => {
  if (!imagePath) return '';
  
  // If it's already an absolute URL (starts with http/https), return as-is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  
  // If it's a blob URL, return as-is
  if (imagePath.startsWith('blob:')) {
    return imagePath;
  }
  
  // Otherwise, it's a relative path, prepend the upload URL
  const baseUrl = import.meta.env.VITE_UPLOAD_URL || 'http://localhost:5371';
  
  // Ensure we don't double-slash
  const cleanPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
  
  return `${baseUrl}${cleanPath}`;
};