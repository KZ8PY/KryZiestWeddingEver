// RSVP form validation and submission (improved UX)
window.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('rsvp-form');
  if (!form) return;

  const submitBtn = form.querySelector('button[type="submit"]');

  function isValidEmail(email) {
    // Simple but effective email validation
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function clearErrors() {
    form.querySelectorAll('.rsvp-error').forEach(el => el.remove());
    form.querySelectorAll('.rsvp-invalid').forEach(el => el.classList.remove('rsvp-invalid'));
  }

  function showError(input, message) {
    input.classList.add('rsvp-invalid');
    const err = document.createElement('div');
    err.className = 'rsvp-error';
    err.style.color = '#8b0000';
    err.style.fontSize = '0.85rem';
    err.style.marginTop = '0.25rem';
    err.textContent = message;
    input.insertAdjacentElement('afterend', err);
  }

  async function submitForm(data) {
    // If the form has an action, attempt a POST; otherwise simulate success.
    const action = form.getAttribute('action') || '';
    const method = (form.getAttribute('method') || 'POST').toUpperCase();
    if (action) {
      try {
        const resp = await fetch(action, { method, body: data });
        if (!resp.ok) throw new Error('Network response was not ok');
        return await resp.json().catch(() => ({}));
      } catch (err) {
        throw err;
      }
    }

    // No server configured: simulate latency and success
    await new Promise(r => setTimeout(r, 700));
    return { ok: true };
  }

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    clearErrors();

    const nameEl = form.querySelector('#name');
    const emailEl = form.querySelector('#email');
    const plusOneEl = form.querySelector('#plusone');
    const dietEl = form.querySelector('#diet');

    const name = nameEl ? nameEl.value.trim() : '';
    const email = emailEl ? emailEl.value.trim() : '';

    let firstInvalid = null;

    if (!name) {
      showError(nameEl, 'Please enter your name.');
      firstInvalid = firstInvalid || nameEl;
    }

    if (!email) {
      showError(emailEl, 'Please enter your email.');
      firstInvalid = firstInvalid || emailEl;
    } else if (!isValidEmail(email)) {
      showError(emailEl, 'Please enter a valid email address.');
      firstInvalid = firstInvalid || emailEl;
    }

    if (firstInvalid) {
      firstInvalid.focus();
      return;
    }

    // Build FormData for submission (works for simulated or real POST)
    const formData = new FormData();
    formData.append('name', name);
    formData.append('email', email);
    if (plusOneEl) formData.append('plusone', plusOneEl.value);
    if (dietEl) formData.append('diet', dietEl.value.trim());

    // Disable UI while submitting
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.dataset.origText = submitBtn.textContent;
      submitBtn.textContent = 'Sending...';
    }

    try {
      await submitForm(formData);

      // Success: show a friendly inline message
      const success = document.createElement('div');
      success.className = 'rsvp-success';
      success.style.color = '#1b5e20';
      success.style.fontSize = '1rem';
      success.style.marginTop = '0.5rem';
      success.textContent = `Thank you, ${name}! Your RSVP has been received.`;

      form.insertAdjacentElement('afterend', success);
      form.reset();
    } catch (err) {
      // Network or server error
      const msg = err && err.message ? err.message : 'Submission failed. Please try again later.';
      const general = document.createElement('div');
      general.className = 'rsvp-error';
      general.style.color = '#8b0000';
      general.style.fontSize = '0.95rem';
      general.style.marginTop = '0.5rem';
      general.textContent = `Error: ${msg}`;
      form.insertAdjacentElement('afterend', general);
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = submitBtn.dataset.origText || 'Confirm Reservation';
      }
    }
  });
});
