window.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('seatLookupForm');
  const nameInput = document.getElementById('guestNameInput');
  const suggestionsList = document.getElementById('guestSuggestions');
  const messageEl = document.getElementById('seatLookupMessage');
  const resultCard = document.getElementById('seatResultCard');
  const shell = document.getElementById('guestSeatsShell');
  const resultHeading = document.getElementById('seatResultHeading');
  const resultIntro = document.getElementById('seatResultIntro');
  const tableNameBadge = document.getElementById('seatTableName');
  const welcomeMessage = document.getElementById('seatWelcomeMessage');
  const tableLocationLink = document.getElementById('tableLocationLink');

  if (!form || !nameInput || !suggestionsList || !resultCard || !shell) {
    return;
  }

  // Dedicated guest-seats web app URL (separate Apps Script project from RSVP)
  const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzvMPNsAJ2q4RdxdHJKd2Gwnp_iW4scLRyS5cAuRY5hOFZx7I2FgfE8o5gWkQWWdF4W/exec';
  const MAX_VISIBLE = 8;
  let suggestions = [];
  let activeIndex = -1;
  let debounceId = null;
  let selectedGuest = null;
  let latestSuggestionRequest = 0;

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function encodeParam(value) {
    return encodeURIComponent(value || '');
  }

  function getFirstName(fullName) {
    const name = String(fullName || '').trim();
    if (!name) return 'Guest';
    return name.split(/\s+/)[0];
  }

  function normalizeTableTheme(value) {
    return String(value || '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  function getTableTheme(tableName) {
    const key = normalizeTableTheme(tableName);
    const supportedThemes = new Set([
      'affogato',
      'americano',
      'cappuccino',
      'cold-brew',
      'espresso',
      'flat-white',
      'frappuccino',
      'irish-coffee',
      'latte',
      'long-black',
      'macchiato',
      'matcha',
      'mocha',
      'seasalt-latte',
      'spanish-latte',
      'vienna'
    ]);
    return supportedThemes.has(key) ? key : 'default';
  }

  function setMessage(text, type) {
    messageEl.textContent = text || '';
    messageEl.className = 'seat-inline-message';
    if (type) {
      messageEl.classList.add(type);
    }
  }

  function getNetworkErrorMessage() {
    return "We can't reach the seat directory right now. Please try again.";
  }

  function hideSuggestions() {
    suggestionsList.hidden = true;
    suggestionsList.innerHTML = '';
    nameInput.setAttribute('aria-expanded', 'false');
    nameInput.removeAttribute('aria-activedescendant');
    activeIndex = -1;
  }

  function showSuggestionSkeleton() {
    suggestions = [];
    suggestionsList.innerHTML = Array.from({ length: 3 }, (_, index) => `
      <li>
        <div class="seat-option seat-option-skeleton" aria-hidden="true" data-skeleton-index="${index}">
          <span class="seat-skeleton-line seat-skeleton-line-name"></span>
          <span class="seat-skeleton-line seat-skeleton-line-meta"></span>
        </div>
      </li>`).join('');
    suggestionsList.hidden = false;
    nameInput.setAttribute('aria-expanded', 'true');
    nameInput.removeAttribute('aria-activedescendant');
    activeIndex = -1;
  }

  function showSuggestions(items) {
    suggestions = items.slice(0, MAX_VISIBLE);

    if (!suggestions.length) {
      hideSuggestions();
      return;
    }

    const html = suggestions
      .map((item, index) => {
        const safeName = escapeHtml(item.name || '');
        const safeTable = escapeHtml(item.table || '');
        return `
          <li>
            <button
              id="seat-option-${index}"
              class="seat-option"
              type="button"
              role="option"
              aria-selected="false"
              data-index="${index}">
              <strong>${safeName}</strong>
              <span>Table ${safeTable}</span>
            </button>
          </li>`;
      })
      .join('');

    suggestionsList.innerHTML = html;
    suggestionsList.hidden = false;
    nameInput.setAttribute('aria-expanded', 'true');
    activeIndex = -1;
  }

  function markActive(index) {
    const options = suggestionsList.querySelectorAll('.seat-option');
    options.forEach((opt) => opt.classList.remove('is-active'));

    if (index < 0 || index >= options.length) {
      activeIndex = -1;
      nameInput.removeAttribute('aria-activedescendant');
      return;
    }

    options[index].classList.add('is-active');
    options[index].setAttribute('aria-selected', 'true');
    options[index].scrollIntoView({ block: 'nearest' });
    nameInput.setAttribute('aria-activedescendant', options[index].id);
    activeIndex = index;
  }

  async function selectSuggestion(index) {
    const item = suggestions[index];
    if (!item) return;

    selectedGuest = item;
    nameInput.value = item.name;
    hideSuggestions();
    await findTableByName(item.name);
  }

  async function loadSuggestions(query) {
    if (!query || query.length < 2) {
      hideSuggestions();
      setMessage('Please type at least 2 letters of your name.', 'error');
      return;
    }

    if (!SCRIPT_URL || SCRIPT_URL.indexOf('YOUR_NEW_GUEST_SEATS_WEB_APP_URL_HERE') > -1) {
      setMessage('The seat directory is not available right now. Please try again in a moment.', 'error');
      hideSuggestions();
      return;
    }

    const requestId = latestSuggestionRequest + 1;
    latestSuggestionRequest = requestId;
    showSuggestionSkeleton();
    setMessage('Looking for your name...', 'success');

    try {
      const response = await fetch(`${SCRIPT_URL}?action=suggest&q=${encodeParam(query)}`);

      if (requestId !== latestSuggestionRequest) {
        return;
      }
      
      if (!response.ok) {
        hideSuggestions();
        return;
      }
      
      const data = await response.json();

      if (requestId !== latestSuggestionRequest) {
        return;
      }

      if (data.status !== 'success' || !Array.isArray(data.suggestions)) {
        hideSuggestions();
        return;
      }

      setMessage(data.suggestions.length ? 'Please choose your name from the list.' : "Sorry, you're not on the guest list.", data.suggestions.length ? 'success' : 'error');
      showSuggestions(data.suggestions);
    } catch (error) {
      if (requestId !== latestSuggestionRequest) {
        return;
      }
      hideSuggestions();
      setMessage(getNetworkErrorMessage(), 'error');
    }
  }

  function revealResult(guestName, tableName, layoutImage) {
    const firstName = getFirstName(guestName);
    if (resultHeading) {
      resultHeading.textContent = `Welcome ${firstName}`;
    }
    if (resultIntro) {
      resultIntro.textContent = 'Your table is';
    }
    if (tableNameBadge) {
      tableNameBadge.textContent = tableName;
      tableNameBadge.setAttribute('data-table-theme', getTableTheme(tableName));
    }
    welcomeMessage.textContent = 'We cannot wait to celebrate with you!';

    const tableParam = encodeParam(tableName);
    const guestParam = encodeParam(guestName);
    const imageParam = encodeParam(layoutImage || '');
    tableLocationLink.href = `./table-location/?table=${tableParam}&guest=${guestParam}&image=${imageParam}`;

    shell.classList.add('has-result');
    resultCard.classList.add('show');
    resultCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  async function findTableByName(rawName) {
    const name = (rawName || '').trim();
    if (!name) {
      setMessage('Please type your full name.', 'error');
      nameInput.focus();
      return;
    }

    if (!SCRIPT_URL || SCRIPT_URL.indexOf('YOUR_NEW_GUEST_SEATS_WEB_APP_URL_HERE') > -1) {
      setMessage('The seat directory is not available right now. Please try again in a moment.', 'error');
      return;
    }

    nameInput.disabled = true;
    setMessage('Finding your table... 🍵', 'success');

    try {
      const response = await fetch(`${SCRIPT_URL}?action=find&name=${encodeParam(name)}`);
      
      if (!response.ok) {
        setMessage("We can't connect to the seat directory right now. Please try again.", 'error');
        return;
      }
      
      const data = await response.json();

      if (data.status !== 'success') {
        setMessage("Sorry, we couldn't find that name on the guest list.", 'error');
        resultCard.classList.remove('show');
        shell.classList.remove('has-result');
        return;
      }

      const tableName = data.tableName || 'TBA';
      revealResult(data.guestName || name, tableName, data.layoutImage || '');
      setMessage('Table found. ☕', 'success');
    } catch (error) {
      setMessage(getNetworkErrorMessage(), 'error');
    } finally {
      nameInput.disabled = false;
    }
  }

  nameInput.addEventListener('input', () => {
    selectedGuest = null;
    if (debounceId) {
      clearTimeout(debounceId);
    }

    const query = nameInput.value.trim();
    debounceId = setTimeout(() => {
      loadSuggestions(query);
    }, 180);
  });

  nameInput.addEventListener('keydown', (event) => {
    const options = suggestionsList.querySelectorAll('.seat-option');

    if (event.key === 'ArrowDown') {
      if (suggestionsList.hidden || !options.length) return;
      event.preventDefault();
      const next = activeIndex + 1 >= options.length ? 0 : activeIndex + 1;
      markActive(next);
      return;
    }

    if (event.key === 'ArrowUp') {
      if (suggestionsList.hidden || !options.length) return;
      event.preventDefault();
      const prev = activeIndex - 1 < 0 ? options.length - 1 : activeIndex - 1;
      markActive(prev);
      return;
    }

    if (event.key === 'Enter' && activeIndex >= 0) {
      event.preventDefault();
      void selectSuggestion(activeIndex);
      return;
    }

    if (event.key === 'Escape') {
      hideSuggestions();
    }
  });

  suggestionsList.addEventListener('click', (event) => {
    const btn = event.target.closest('.seat-option');
    if (!btn) return;

    const index = Number(btn.dataset.index);
    void selectSuggestion(index);
  });

  document.addEventListener('click', (event) => {
    if (!event.target.closest('.combo-wrap')) {
      hideSuggestions();
    }
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const nameToFind = selectedGuest ? selectedGuest.name : nameInput.value;
    void findTableByName(nameToFind);
  });
});
