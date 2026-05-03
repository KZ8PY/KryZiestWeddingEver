// Gift Registry Form Handler
// Handles form submissions for gift registry messages
// Submits to Google Apps Script backend

window.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('.gift-form');
  if (!form) return;
  
  // Google Apps Script Web App URL
  // TODO: Update this with the deployed Google Apps Script URL
  const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycby3TkEgqeSni7nYSOrGH_wgvbqsjx7MGGJ8FuVmn_KDRRco2lyMfo6DKak7d8ISdchyEw/exec';

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
