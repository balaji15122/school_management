/**
 * Triggers a browser file download given binary data or a Blob.
 * @param {Blob|ArrayBuffer|Uint8Array} data
 * @param {string} fileName
 * @param {string} mimeType
 */
export const downloadFile = (data, fileName, mimeType = 'application/octet-stream') => {
  const blob = data instanceof Blob ? data : new Blob([data], { type: mimeType });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  link.parentNode.removeChild(link);
  window.URL.revokeObjectURL(url);
};
