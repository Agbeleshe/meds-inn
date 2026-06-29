/** Trigger a browser file download without pop-ups. */
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function downloadBase64File(
  contentBase64: string,
  filename: string,
  mimeType = "application/octet-stream",
) {
  const bytes = Uint8Array.from(atob(contentBase64), (c) => c.charCodeAt(0));
  downloadBlob(new Blob([bytes], { type: mimeType }), filename);
}

export function downloadHtmlAsFile(html: string, filename: string) {
  downloadBlob(new Blob([html], { type: "text/html;charset=utf-8" }), filename);
}
