// Gift Registry Form Handler
// Handles form submissions for gift registry messages
// Submits to Google Apps Script backend

window.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('.gift-form');
  const downloadButtons = Array.from(document.querySelectorAll('.qr-download-btn[data-download-src]'));
  const detailButtons = Array.from(document.querySelectorAll('.qr-details-btn[data-account-bank]'));
  if (!form && downloadButtons.length === 0 && detailButtons.length === 0) return;
  
  // Google Apps Script Web App URL
  // TODO: Update this with the deployed Google Apps Script URL
  const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyfwr-xw5HjcWB_bz0lmnOJWRNf3CIX6T_P2QPetqCgW3hSeF8bia_JTpFWU_aA2XGV7A/exec';
  const ACCOUNT_DETAILS_URL = SCRIPT_URL;

  function getClientId() {
    const key = 'kzGiftClientId';
    try {
      const existing = window.localStorage.getItem(key);
      if (existing) return existing;
      const newId = `guest-${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36)}`;
      window.localStorage.setItem(key, newId);
      return newId;
    } catch (_error) {
      return `guest-fallback-${Date.now().toString(36)}`;
    }
  }

  function showAccountModal(title, details) {
    const existing = document.getElementById('account-details-modal');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'account-details-modal';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', `${title} account details`);
    overlay.innerHTML = `
      <div class="account-modal-box">
        <button type="button" class="account-modal-close" aria-label="Close">✕</button>
        <p class="account-modal-title">${title} Account Details</p>

        <p class="account-modal-label">Account Name</p>
        <div class="account-modal-value" id="acct-name-val">${details.accountName}</div>
        <button type="button" class="contact-action account-copy-btn" data-copy-target="name">Copy Account Name</button>

        <p class="account-modal-label">Account Number</p>
        <div class="account-modal-value" id="acct-num-val">${details.accountNumber}</div>
        <button type="button" class="contact-action account-copy-btn" data-copy-target="number">Copy Account Number</button>
      </div>
    `;

    if (!document.getElementById('account-details-modal-style')) {
      const style = document.createElement('style');
      style.id = 'account-details-modal-style';
      style.textContent = `
        #account-details-modal{position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:10000;display:flex;align-items:center;justify-content:center;padding:1.25rem}
        .account-modal-box{width:100%;max-width:340px;background:var(--color-warm-cream,#faf7ee);border-radius:16px;padding:1.5rem 1.25rem 1.25rem;color:var(--color-coffee-dark,#2a1a0e);position:relative;box-shadow:0 20px 50px rgba(0,0,0,.3)}
        .account-modal-title{margin:0 0 1.1rem;font-family:var(--font-tan-pearl,serif);font-size:1.05rem;font-weight:700}
        .account-modal-label{margin:0 0 .35rem;font-size:.72rem;font-weight:700;text-transform:uppercase;letter-spacing:.07em;opacity:.6}
        .account-modal-value{font-family:system-ui,-apple-system,sans-serif;font-size:.97rem;font-weight:500;background:#fff;border:1px solid rgba(0,0,0,.1);border-radius:8px;padding:.55rem .8rem;margin-bottom:.5rem;word-break:break-all;letter-spacing:.01em}
        .account-copy-btn{width:100%;justify-content:center;margin-bottom:1.1rem}
        .account-copy-btn:last-child{margin-bottom:0}
        .account-modal-close{position:absolute;top:.7rem;right:.85rem;border:none;background:none;color:inherit;font-size:1rem;cursor:pointer;padding:.25rem;opacity:.55;line-height:1}
        .account-modal-close:hover{opacity:1}`;
      document.head.appendChild(style);
    }
    document.body.appendChild(overlay);

    const close = () => overlay.remove();
    overlay.querySelector('.account-modal-close').addEventListener('click', close);
    overlay.addEventListener('click', (event) => {
      if (event.target === overlay) close();
    });

    overlay.querySelectorAll('.account-copy-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const target = btn.dataset.copyTarget;
        const value = target === 'name' ? details.accountName : details.accountNumber;
        const original = btn.textContent;
        navigator.clipboard.writeText(value).then(() => {
          btn.textContent = 'Copied!';
          window.setTimeout(() => { btn.textContent = original; }, 1800);
        }).catch(() => {
          btn.textContent = 'Copy failed';
          window.setTimeout(() => { btn.textContent = original; }, 2000);
        });
      });
    });
  }

  async function requestAccountDetails(button) {
    const bank = button.dataset.accountBank;
    if (!bank) return;
    const label = button.querySelector('.account-details-label');
    const originalText = label ? label.textContent : button.textContent;

    button.disabled = true;
    if (label) {
      label.textContent = 'Loading...';
    } else {
      button.textContent = 'Loading...';
    }

    try {
      const response = await fetch(ACCOUNT_DETAILS_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain'
        },
        body: JSON.stringify({
          action: 'getAccountDetails',
          bank,
          clientId: getClientId(),
          userAgent: navigator.userAgent || '',
          pagePath: window.location.pathname || ''
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      if (result.status !== 'success' || !result.data) {
        throw new Error(result.message || 'Could not load account details right now.');
      }

      showAccountModal(bank, result.data);
    } catch (error) {
      console.error('Account details error:', error);
      window.alert(error.message || 'Could not load account details right now. Please try again.');
    } finally {
      button.disabled = false;
      if (label) {
        label.textContent = originalText;
      } else {
        button.textContent = originalText;
      }
    }
  }

  function isInAppBrowser() {
    const ua = (navigator.userAgent || '').toLowerCase();
    return /fban|fbav|fb_iab|instagram|line\/|twitter|snapchat|tiktok|wv\)|; wv/i.test(navigator.userAgent) ||
      (ua.includes('android') && ua.includes('wv'));
  }

  function showOpenInBrowserPrompt() {
    const existing = document.getElementById('open-in-browser-prompt');
    if (existing) { existing.classList.add('visible'); return; }

    const overlay = document.createElement('div');
    overlay.id = 'open-in-browser-prompt';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'Open in browser to download');
    overlay.innerHTML = `
      <div class="oib-box">
        <p class="oib-title">Open in your browser to download</p>
        <p class="oib-body">
          Downloads are blocked inside Messenger and other apps.<br>
          Tap the menu (<strong>⋮</strong> or <strong>···</strong>) and choose
          <strong>Open in Chrome</strong> / <strong>Open in Safari</strong>.
        </p>
        <div class="oib-url" id="oib-url-text">${window.location.href}</div>
        <button class="contact-action oib-copy-btn" id="oib-copy-btn" type="button">Copy page link</button>
        <button class="oib-close-btn" id="oib-close-btn" type="button" aria-label="Dismiss">✕</button>
      </div>`;

    const style = document.createElement('style');
    style.textContent = `
      #open-in-browser-prompt{position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:9999;display:flex;align-items:center;justify-content:center;padding:1.5rem;opacity:0;pointer-events:none;transition:opacity 200ms ease}
      #open-in-browser-prompt.visible{opacity:1;pointer-events:auto}
      .oib-box{background:var(--color-warm-cream,#faf7ee);color:var(--color-coffee-dark,#2a1a0e);border-radius:16px;padding:1.8rem 1.5rem;max-width:340px;width:100%;position:relative;box-shadow:0 20px 50px rgba(0,0,0,.3)}
      .oib-title{font-family:var(--font-tan-pearl,serif);font-size:1.1rem;font-weight:700;margin:0 0 .75rem}
      .oib-body{font-size:.875rem;line-height:1.5;margin:0 0 1rem}
      .oib-url{font-size:.75rem;word-break:break-all;background:rgba(0,0,0,.07);border-radius:8px;padding:.5rem .75rem;margin-bottom:1rem;color:inherit;opacity:.75}
      .oib-copy-btn{width:100%;justify-content:center}
      .oib-close-btn{position:absolute;top:.75rem;right:.85rem;background:none;border:none;font-size:1.1rem;cursor:pointer;padding:.25rem;line-height:1;color:inherit;opacity:.6}
      .oib-close-btn:hover{opacity:1}`;
    document.head.appendChild(style);
    document.body.appendChild(overlay);

    document.getElementById('oib-close-btn').addEventListener('click', () => {
      overlay.classList.remove('visible');
    });
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.classList.remove('visible');
    });

    const copyBtn = document.getElementById('oib-copy-btn');
    copyBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(window.location.href).then(() => {
        copyBtn.textContent = 'Copied!';
        window.setTimeout(() => { copyBtn.textContent = 'Copy page link'; }, 2000);
      }).catch(() => {
        const urlEl = document.getElementById('oib-url-text');
        const range = document.createRange();
        range.selectNodeContents(urlEl);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
      });
    });

    requestAnimationFrame(() => overlay.classList.add('visible'));
  }

  async function triggerQrDownload(button) {
    if (isInAppBrowser()) {
      showOpenInBrowserPrompt();
      return;
    }
    const source = button.dataset.downloadSrc;
    const filename = button.dataset.downloadFilename || 'qr-code';
    const label = button.querySelector('.qr-download-label');
    const originalLabel = label ? label.textContent : button.textContent;

    button.disabled = true;
    button.setAttribute('aria-busy', 'true');
    if (label) label.textContent = 'Preparing...';

    try {
      const assetUrl = new URL(source, window.location.href);
      const response = await fetch(assetUrl.href, { cache: 'force-cache' });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');

      link.href = blobUrl;
      link.download = filename;
      link.rel = 'noopener';
      link.style.display = 'none';

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.setTimeout(() => {
        window.URL.revokeObjectURL(blobUrl);
      }, 1000);
    } catch (error) {
      console.error('QR download error:', error);
      window.open(source, '_blank', 'noopener');
    } finally {
      button.disabled = false;
      button.removeAttribute('aria-busy');
      if (label) label.textContent = originalLabel;
    }
  }

  downloadButtons.forEach((button) => {
    button.addEventListener('click', () => {
      triggerQrDownload(button);
    });
  });

  detailButtons.forEach((button) => {
    button.addEventListener('click', () => {
      requestAccountDetails(button);
    });
  });

  if (!form) return;

  /**
   * Show message to user
   */
  function showMessage(message, type = 'error') {
    const messageEl = form.querySelector('.form-message');
    messageEl.textContent = message;
    messageEl.className = 'form-message show ' + type;
    messageEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    
    if (type === 'success') {
      setTimeout(() => {
        messageEl.classList.remove('show');
      }, 5000);
    }
  }

  /**
   * Hide message
   */
  function hideMessage() {
    const messageEl = form.querySelector('.form-message');
    messageEl.classList.remove('show');
  }

  /**
   * Handle gift registry form submission
   */
  async function handleGiftFormSubmit(event) {
    event.preventDefault();
    
    const submitBtn = form.querySelector('.submit-btn');
    
    hideMessage();

    // Get form values
    let name = form.querySelector('input[name="name"]').value.trim();
    const message = form.querySelector('textarea[name="message"]').value.trim();

    // Set name to "Anonymous" if blank
    if (!name) {
      name = 'Anonymous';
    }

    // Validation - message is required
    if (!message) {
      showMessage('Please share a message for the couple.', 'error');
      form.querySelector('textarea[name="message"]').focus();
      return;
    }

    // Prepare payload for Google Apps Script
    const payload = {
      from: name,
      message: message,
      timestamp: new Date().toISOString()
    };

    // Disable submit button and show loading state
    submitBtn.disabled = true;
    const originalButtonText = submitBtn.textContent;
    submitBtn.textContent = 'Brewing... 🍵';

    try {
      // Send POST request to Google Apps Script
      // Using text/plain to avoid CORS preflight (browser-only issue)
      const response = await fetch(SCRIPT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain',
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      // Check if backend returned an error
      if (result.status === 'error') {
        showMessage(`Oops! ${result.message || 'We couldn\'t process your submission. Please try again.'}`, 'error');
        return;
      }

      // Success - show gratitude message
      showMessage(
        'We are grateful for your generosity and love. Thank you, from the bottom of our hearts.',
        'success'
      );
      
      // Reset form after successful submission
      setTimeout(() => {
        form.reset();
      }, 1500);

    } catch (error) {
      console.error('Gift registry submission error:', error);
      
      // Network or parsing error - show inline message with more details
      let errorMsg = `☕ Oops! We couldn't process your submission. `;
      
      // Provide more specific error messages based on error type
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        errorMsg += `Network error - please check your internet connection. `;
        errorMsg += `If testing locally, make sure you're using a local server (not file://).`;
      } else if (error.message.includes('JSON')) {
        errorMsg += `The server response was invalid. Please try again.`;
      } else {
        errorMsg += `${error.message || 'Please check your connection and try again.'}`;
      }
      
      showMessage(errorMsg, 'error');
    } finally {
      // Re-enable submit button
      submitBtn.disabled = false;
      submitBtn.textContent = originalButtonText;
    }
  }

  // Attach submit handler
  form.addEventListener('submit', handleGiftFormSubmit);
});
