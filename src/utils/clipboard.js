/**
 * Reliable clipboard copy with fallback for mobile devices and non-HTTPS webviews
 */
export async function copyToClipboard(text) {
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      console.warn('navigator.clipboard failed, attempting fallback', err);
    }
  }

  // Fallback: create temporary offscreen textarea
  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    textarea.style.top = '-9999px';
    textarea.setAttribute('readonly', '');
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();

    const successful = document.execCommand('copy');
    document.body.removeChild(textarea);
    return successful;
  } catch (fallbackErr) {
    console.error('Clipboard copy failed:', fallbackErr);
    return false;
  }
}
