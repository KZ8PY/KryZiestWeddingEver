// Modern cafe countdown for KryZiest Wedding Ever
const targetDate = new Date('2026-05-16T15:00:00+08:00');
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

  if (document.getElementById('daysBox')) document.getElementById('daysBox').textContent = pad(days);
  if (document.getElementById('hoursBox')) document.getElementById('hoursBox').textContent = pad(hours);
  if (document.getElementById('minutesBox')) document.getElementById('minutesBox').textContent = pad(minutes);
  if (document.getElementById('secondsBox')) document.getElementById('secondsBox').textContent = pad(seconds);
}
setInterval(updateCountdown, 1000);
updateCountdown();
