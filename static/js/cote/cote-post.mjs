import { init as initOverlay } from './cote-overlay.mjs';
import { init as initGranularity } from './cote-granularity.mjs';

function run() {
  const overlay = document.getElementById('cote-overlay');
  if (overlay) initOverlay(overlay);
  const gran = document.getElementById('cote-granularity');
  if (gran) initGranularity(gran);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', run);
} else {
  run();
}
