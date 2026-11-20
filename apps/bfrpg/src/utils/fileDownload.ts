/**
 * File Download Utilities
 * Handles client-side file downloads via blob URLs
 */

/**
 * Downloads a file to the user's device
 * @param content - The file content as a string
 * @param filename - The desired filename (including extension)
 * @param mimeType - The MIME type of the file
 */
export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = filename;

  // Append to body, click, and cleanup
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Clean up the blob URL
  URL.revokeObjectURL(url);
}
