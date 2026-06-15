// Widget 1 — "CER breaks under parsing errors".
// A two-region page read top-to-bottom. Toggle a parse failure and watch the
// single string CER must consume get scrambled / duplicated / truncated — while
// the bag-of-characters CEV (SpACER) stays calm.
import { cer, spacerStr } from './cev-math.mjs';

const GT = 'the spirit influence under the table';

// Per-mode: the hypothesis string CER sees, display tokens, and page overlay.
const MODES = {
  clean: {
    label: 'Clean parse',
    hyp: 'the spirit influence under the table',
    tokens: [['the spirit influence under the table', '']],
    note: 'Both regions parsed cleanly. CER and CEV agree.',
  },
  trespass: {
    label: 'Trespass',
    // a box spanning both columns reads across the boundary — order destroyed,
    // characters unchanged.
    hyp: 'the under spirit the influence table',
    tokens: [['the under spirit the influence table', 'scram']],
    note: 'A box crosses the region boundary, so the words interleave. Same characters, wrong order → CER explodes. On truly disjoint regions there is no correct sequence at all and CER is undefined. CEV ignores order, so it barely moves.',
  },
  overlap: {
    label: 'Overlap',
    hyp: 'the spirit influence under the table under the table',
    tokens: [['the spirit influence ', ''], ['under the table', ''], [' under the table', 'dup']],
    note: 'Two predictions cover the same region, so its text is transcribed twice. CER counts every duplicated character as an insertion; CEV sees inflated counts but stays bounded.',
  },
  missing: {
    label: 'Missing',
    hyp: 'the spirit influence',
    tokens: [['the spirit influence ', ''], ['under the table', 'miss']],
    note: 'The second region has no prediction, so its text is dropped. Both metrics register the loss as deletions.',
  },
};
const ORDER = ['clean', 'trespass', 'overlap', 'missing'];

const NS = 'http://www.w3.org/2000/svg';
function el(tag, attrs) {
  const n = document.createElementNS(NS, tag);
  for (const k in attrs) n.setAttribute(k, attrs[k]);
  return n;
}
function fauxLines(g, x, y, w, rows) {
  for (let r = 0; r < rows; r++) {
    g.appendChild(el('rect', {
      x: x + 4, y: y + 5 + r * 7, width: w - 8 - (r % 2) * 14, height: 3, rx: 1,
      fill: 'currentColor', opacity: 0.3,
    }));
  }
}

function drawPage(mode) {
  const svg = el('svg', { class: 'cev-stage__svg', viewBox: '0 0 120 92', role: 'img' });
  svg.setAttribute('aria-label', `Two-region page, ${MODES[mode].label} parse`);
  // Region outlines + faux text.
  const r1 = { x: 10, y: 8, w: 100, h: 30 };
  const r2 = { x: 10, y: 52, w: 100, h: 30 };
  [r1, r2].forEach((r, idx) => {
    const faded = mode === 'missing' && idx === 1;
    const g = el('g', { opacity: faded ? 0.35 : 1 });
    g.appendChild(el('rect', {
      x: r.x, y: r.y, width: r.w, height: r.h, fill: 'none',
      stroke: 'currentColor', 'stroke-dasharray': '3 2', opacity: 0.4,
    }));
    fauxLines(g, r.x, r.y, r.w, 3);
    svg.appendChild(g);
  });
  // Reading-order arrow between the regions.
  svg.appendChild(el('path', {
    d: 'M 60 38 L 60 52', stroke: 'currentColor', opacity: 0.35,
    'stroke-width': 1.2, 'marker-end': 'url(#cev-arrow)',
  }));
  const defs = el('defs', {});
  const marker = el('marker', {
    id: 'cev-arrow', viewBox: '0 0 10 10', refX: 8, refY: 5,
    markerWidth: 5, markerHeight: 5, orient: 'auto-start-reverse',
  });
  marker.appendChild(el('path', { d: 'M 0 0 L 10 5 L 0 10 z', fill: 'currentColor', opacity: 0.5 }));
  defs.appendChild(marker);
  svg.appendChild(defs);

  // Prediction overlays per mode.
  const box = (x, y, w, h, cssVar) => el('rect', {
    x, y, width: w, height: h, fill: `var(${cssVar})`, 'fill-opacity': 0.22,
    stroke: `var(${cssVar})`, 'stroke-width': 1.5,
  });
  if (mode === 'clean') {
    svg.appendChild(box(10, 8, 100, 30, '--cev-green'));
    svg.appendChild(box(10, 52, 100, 30, '--cev-green'));
  } else if (mode === 'trespass') {
    svg.appendChild(box(10, 26, 100, 40, '--cev-red')); // spans the boundary
  } else if (mode === 'overlap') {
    svg.appendChild(box(10, 52, 100, 30, '--cev-green'));
    svg.appendChild(box(16, 56, 100, 30, '--cev-yellow')); // duplicate, offset
  } else if (mode === 'missing') {
    svg.appendChild(box(10, 8, 100, 30, '--cev-green'));
  }
  return svg;
}

export function init(container) {
  let mode = 'clean';

  const two = document.createElement('div');
  two.className = 'cev-twoup';
  const left = document.createElement('div');
  const right = document.createElement('div');
  two.append(left, right);
  container.appendChild(two);

  // Right: the string CER reads + note.
  const stringBox = document.createElement('div');
  stringBox.className = 'cev-string';
  const note = document.createElement('p');
  note.className = 'cev-widget__hint';
  note.style.marginTop = '0.75rem';
  right.append(stringBox, note);

  // Controls (mode toggles).
  const controls = document.createElement('div');
  controls.className = 'cev-controls';
  ORDER.forEach((m) => {
    const btn = document.createElement('button');
    btn.className = 'cev-btn';
    btn.type = 'button';
    btn.textContent = MODES[m].label;
    btn.setAttribute('aria-pressed', String(m === mode));
    btn.addEventListener('click', () => { mode = m; render(); });
    controls.appendChild(btn);
  });
  container.appendChild(controls);

  // Readout: CER vs CEV.
  const readout = document.createElement('div');
  readout.className = 'cev-readout';
  const stats = {};
  [['cer', 'CER (sequential)', true], ['cev', 'CEV / SpACER (bag)', true]].forEach(([k, label, score]) => {
    const wrap = document.createElement('div');
    wrap.className = 'cev-stat' + (score ? ' cev-stat--score' : '');
    const l = document.createElement('span'); l.className = 'cev-stat__label'; l.textContent = label;
    const v = document.createElement('span'); v.className = 'cev-stat__value'; v.textContent = '0.00';
    wrap.append(l, v); readout.appendChild(wrap);
    stats[k] = { wrap, value: v };
  });
  container.appendChild(readout);

  function render() {
    // page
    left.replaceChildren(drawPage(mode));
    // string tokens
    stringBox.replaceChildren();
    MODES[mode].tokens.forEach(([text, cls]) => {
      if (cls) {
        const b = document.createElement('b');
        b.className = `cev-tok--${cls}`;
        b.textContent = text;
        stringBox.appendChild(b);
      } else {
        stringBox.appendChild(document.createTextNode(text));
      }
    });
    note.textContent = MODES[mode].note;
    // metrics
    const hyp = MODES[mode].hyp;
    const cerVal = cer(GT, hyp);
    const cevVal = spacerStr(GT, hyp);
    if (mode === 'trespass') {
      stats.cer.wrap.classList.add('cev-stat--undefined');
      stats.cer.value.textContent = 'undefined*';
    } else {
      stats.cer.wrap.classList.remove('cev-stat--undefined');
      stats.cer.value.textContent = cerVal.toFixed(2);
    }
    stats.cev.value.textContent = cevVal.toFixed(2);
    // button states
    [...controls.children].forEach((btn, i) => btn.setAttribute('aria-pressed', String(ORDER[i] === mode)));
  }

  render();
}
