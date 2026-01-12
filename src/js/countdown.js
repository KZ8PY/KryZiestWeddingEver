// Modern cafe countdown for KryZiest Wedding Ever
// Target: May 8, 2026 at 14:00 (2:00 PM) local event time
const targetDate = new Date(2026, 4, 8, 14, 0, 0);
// Track previous values to detect changes for animations
const prev = { days: null, hours: null, minutes: null, seconds: null };
function animateCup(id) {
  const box = document.getElementById(id)?.closest('.countdown-box') || document.getElementById(id)?.parentElement;
  if (!box) return;
  box.classList.remove('cup-animate');
  // reflow to restart animation
  void box.offsetWidth;
  box.classList.add('cup-animate');
}
function pad(num) {
  return num.toString().padStart(2, '0');
}
function updateCountdown() {
  const now = new Date();
  let diff = Math.max(0, targetDate - now);
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  diff -= days * (1000 * 60 * 60 * 24);
  const hours = Math.floor(diff / (1000 * 60 * 60));
  diff -= hours * (1000 * 60 * 60);
  const minutes = Math.floor(diff / (1000 * 60));
  diff -= minutes * (1000 * 60);
  const seconds = Math.floor(diff / 1000);

  if (document.getElementById('daysBox')) {
    const el = document.getElementById('daysBox');
    const v = pad(days);
    if (prev.days !== v) { el.textContent = v; animateCup('daysBox'); prev.days = v; }
  }
  if (document.getElementById('hoursBox')) {
    const el = document.getElementById('hoursBox');
    const v = pad(hours);
    if (prev.hours !== v) { el.textContent = v; animateCup('hoursBox'); prev.hours = v; }
  }
  if (document.getElementById('minutesBox')) {
    const el = document.getElementById('minutesBox');
    const v = pad(minutes);
    if (prev.minutes !== v) { el.textContent = v; animateCup('minutesBox'); prev.minutes = v; }
  }
  if (document.getElementById('secondsBox')) {
    const el = document.getElementById('secondsBox');
    const v = pad(seconds);
    if (prev.seconds !== v) { el.textContent = v; animateCup('secondsBox'); prev.seconds = v; }
  }
}
setInterval(updateCountdown, 1000);
updateCountdown();
