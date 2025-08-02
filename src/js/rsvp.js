// RSVP form validation and submission
window.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('rsvp-form');
  if (!form) return;
  form.addEventListener('submit', function(e) {
    e.preventDefault();
    const name = form.name.value.trim();
    const email = form.email.value.trim();
    if (!name || !email) {
      alert('Please enter your name and email.');
      return;
    }
    // Simulate submission
    alert('Thank you for your RSVP, ' + name + '!');
    form.reset();
  });
});
