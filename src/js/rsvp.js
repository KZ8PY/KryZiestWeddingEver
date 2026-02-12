// RSVP Form Handler for Save the Date page
// Handles dynamic kid inputs, Google Apps Script backend submission, and subset name verification
// Primary mode: Subset Verification with CORS-enabled backend

window.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('rsvp-form');
  if (!form) return;

  const littleOneToggle = document.getElementById('littleOneToggle');
  const kidsDetailsContainer = document.getElementById('kidsDetails');
  const submitBtn = document.getElementById('submitBtn');
  const formMessage = document.getElementById('formMessage');
  let currentKidCount = 0;
  const MAX_KIDS = 2;

  // Google Apps Script Web App URL
  const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxFvXwkuC1aEHViucojBFhzrDq_Z8JNDPtnENUrt4828M6szEErZ_0JtawILKAcvG-Alw/exec';

  // Previously we used a top-of-viewport toast for notifications. The UI
  // now prefers a single inline message area under the form submit button
  // to avoid duplicate notifications. `showMessage` handles that UI, so we
  // intentionally do not create a global top toast anymore.

  /**
   * Create a kid entry with Add button
   */
  function createKidEntry(kidNumber) {
    const kidEntry = document.createElement('div');
    kidEntry.className = 'kid-entry';
    kidEntry.dataset.kidIndex = kidNumber;
    
    const isLastAllowed = kidNumber >= MAX_KIDS;
    
    kidEntry.innerHTML = `
      <div class="kid-entry-title">
        <span>Child ${kidNumber}</span>
        ${!isLastAllowed ? `<button type="button" class="add-kid-btn" aria-label="Add another child"></button>` : `<button type="button" class="add-kid-btn remove-btn" aria-label="Remove this child"></button>`}
      </div>
      <div class="kid-input-group">
        <div class="kid-input-wrapper">
          <label for="kidName${kidNumber}">Name</label>
          <input 
            type="text" 
            id="kidName${kidNumber}" 
            name="kidName${kidNumber}" 
            placeholder="Child's name"
            required
            aria-label="Name of child ${kidNumber}"
          />
        </div>
        <div class="kid-input-wrapper">
          <label for="kidAge${kidNumber}">Age</label>
          <input 
            type="number" 
            id="kidAge${kidNumber}" 
            name="kidAge${kidNumber}" 
            placeholder="3"
            min="0"
            max="10"
            required
            aria-label="Age of child ${kidNumber}"
          />
        </div>
      </div>
    `;
    
    // Attach age validation listener
    const ageInput = kidEntry.querySelector(`#kidAge${kidNumber}`);
    if (ageInput) {
      ageInput.addEventListener('input', function() {
        const value = parseInt(this.value);
        if (this.value && (value < 0 || value > 10)) {
          showMessage('Child age must be between 0 and 10 years.', 'error');
          this.value = Math.max(0, Math.min(10, value));
        }
      });
    }
    
    // Attach button listener
    const btn = kidEntry.querySelector('.add-kid-btn');
    if (btn) {
      if (!isLastAllowed) {
        // Add button for Child 1
        btn.addEventListener('click', function() {
          if (currentKidCount < MAX_KIDS) {
            currentKidCount++;
            const newEntry = createKidEntry(currentKidCount);
            kidsDetailsContainer.appendChild(newEntry);
            
            // Hide the add button on Child 1 when Child 2 is added
            this.style.display = 'none';
          }
        });
      } else {
        // Remove button for Child 2
        btn.addEventListener('click', function() {
          // Remove Child 2
          kidEntry.remove();
          currentKidCount--;
          
          // Re-show the add button on Child 1
          const child1 = document.querySelector('.kid-entry[data-kid-index="1"]');
          if (child1) {
            const addBtn = child1.querySelector('.add-kid-btn');
            if (addBtn) addBtn.style.display = 'inline-flex';
          }
        });
      }
    }
    
    return kidEntry;
  }

  /**
   * Toggle kids section visibility when "Bringing a little one?" is toggled
   */
  littleOneToggle.addEventListener('change', function() {
    if (this.checked) {
      // Immediately show Child 1
      currentKidCount = 1;
      kidsDetailsContainer.innerHTML = '';
      const firstKid = createKidEntry(1);
      kidsDetailsContainer.appendChild(firstKid);
    } else {
      // Clear all kids
      currentKidCount = 0;
      kidsDetailsContainer.innerHTML = '';
    }
  });



  /**
   * Show message to user
   */
  function showMessage(message, type = 'error') {
    formMessage.textContent = message;
    formMessage.className = 'form-message show ' + type;
    formMessage.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    
    if (type === 'success') {
      setTimeout(() => {
        formMessage.classList.remove('show');
      }, 5000);
    }
  }

  /**
   * Hide message
   */
  function hideMessage() {
    formMessage.classList.remove('show');
  }

  /**
   * Handle RSVP form submission with Subset Verification
   */
  async function handleRSVPSubmit(event) {
    event.preventDefault();
    hideMessage();

    // Get form values
    const fullName = document.getElementById('fullName').value.trim();
    const attendance = document.querySelector('input[name="attendance"]:checked');
    const bringingKids = littleOneToggle.checked;
    const numKids = bringingKids ? currentKidCount : 0;

    // Validation
    if (!fullName) {
      showMessage('Please enter your full name.', 'error');
      document.getElementById('fullName').focus();
      return;
    }

    if (!attendance) {
      showMessage('Please select whether you will be attending.', 'error');
      return;
    }

    if (bringingKids && numKids === 0) {
      showMessage('Please add at least one child.', 'error');
      return;
    }

    // Collect kids data if applicable (ensures both name and age for each entry)
    const kids = [];
    if (bringingKids && numKids > 0) {
      for (let i = 1; i <= numKids; i++) {
        const kidName = document.getElementById(`kidName${i}`).value.trim();
        const kidAge = document.getElementById(`kidAge${i}`).value.trim();

        if (!kidName || !kidAge) {
          showMessage(`Please fill in all details for Child ${i}.`, 'error');
          document.getElementById(`kidName${i}`).focus();
          return;
        }

        kids.push({
          name: kidName,
          age: parseInt(kidAge)
        });
      }
    }

    // Prepare payload for Google Apps Script with complete kid verification data
    const payload = {
      fullName: fullName,
      attendance: attendance.value,
      bringingKids: bringingKids,
      numKids: numKids,
      kids: kids, // Array with {name, age} for each kid - backend can verify individually
      timestamp: new Date().toISOString()
    };

    // Disable submit button and show loading state
    submitBtn.disabled = true;
    const originalButtonText = submitBtn.textContent;
    submitBtn.textContent = 'Brewing... 🍵';

    try {
      // Send POST request to Google Apps Script
      // Using text/plain to avoid CORS preflight (browser-only issue)
      // Node.js tests work fine with application/json, but browsers trigger OPTIONS preflight
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

      // Check if backend returned an error (subset verification failed)
      if (result.status === 'error') {
        // Backend should return { status: 'error', msg: 'name', notFound: 'John Doe' }
        // or { status: 'error', msg: 'kid', notFound: 'Emma' }
        // or { status: 'error', msg: 'name', notFound: 'John', reason: 'incomplete' }
        const notFoundName = result.notFound || result.name || 'the name provided';
        const nameType = result.msg === 'kid' ? 'Kid' : 'Adult';
        
        // Check if error is due to incomplete name (less than 2 words)
        if (result.reason === 'incomplete') {
          showMessage(
            `Please enter your full name (first and last name). "${notFoundName}" is too short to verify against our guest list.`,
            'error'
          );
          return;
        }
        
        showMessage(
          `Oops! We couldn't find "${notFoundName}" (${nameType}) on our guest list. Please check the spelling on your invitation.`,
          'error'
        );
        return;
      }

      // Success - show toast notification
      showMessage(`Thank you, ${fullName}! Your RSVP has been received. ✨`, 'success');
      
      // Also show success in the form message area
      showMessage(`Thank you, ${fullName}! Your RSVP has been received. ✨`, 'success');
      
      // Reset form after successful submission
      setTimeout(() => {
        form.reset();
        currentKidCount = 0;
        kidsDetailsContainer.innerHTML = '';
      }, 1500);

    } catch (error) {
      console.error('RSVP submission error:', error);
      console.error('Error details:', {
        message: error.message,
        type: error.constructor.name,
        stack: error.stack
      });
      
      // Network or parsing error - show inline message with more details
      let errorMsg = `☕ Oops! We couldn't process your RSVP. `;
      
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

  // Attach submit handler with Subset Verification
  form.addEventListener('submit', handleRSVPSubmit);
});
