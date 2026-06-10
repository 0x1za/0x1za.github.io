import { init as initOverlay } from './cote-overlay.mjs';

function run() {
  const overlay = document.getElementById('cote-overlay');
  if (overlay) initOverlay(overlay);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', run);
} else {
  run();
}
