window.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const table = params.get('table') || 'your assigned table';
  const guest = params.get('guest') || 'Guest';
  const image = params.get('image') || '';

  const title = document.getElementById('tableLocationTitle');
  const subtitle = document.getElementById('tableLocationSubtitle');
  const layoutImage = document.getElementById('tableLayoutImage');
  const fallback = document.getElementById('layoutFallback');
  const backLink = document.getElementById('backToFinder');

  if (!title || !subtitle || !layoutImage || !fallback || !backLink) {
    return;
  }

  const firstName = String(guest || 'Guest').trim().split(/\s+/)[0] || 'Guest';

  title.textContent = `Table ${table}`;
  subtitle.textContent = `${firstName}, this is where your table is located in the reception layout.`;
  backLink.href = `../?guest=${encodeURIComponent(guest)}&table=${encodeURIComponent(table)}`;

  if (!image) {
    layoutImage.hidden = true;
    fallback.hidden = false;
    fallback.textContent = `Layout image for ${table} is not uploaded yet. It will appear here once generated.`;
    return;
  }

  layoutImage.src = image;
  layoutImage.alt = `Reception layout with table ${table} highlighted`;

  layoutImage.addEventListener('error', () => {
    layoutImage.hidden = true;
    fallback.hidden = false;
    fallback.textContent = `Layout image for ${table} is not available yet. Please check again soon.`;
  });

  layoutImage.addEventListener('load', () => {
    fallback.hidden = true;
    layoutImage.hidden = false;
  });
});
