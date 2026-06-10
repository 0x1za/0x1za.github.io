import { computeCoteGrid } from './cote-math.mjs';

const GRID_W = 100, GRID_H = 60;

// One SSU = one paragraph block (the "meaning" unit). Ground truth and
// predictions differ only in labelling granularity; the *parse is perfect*.
const SSU = [{ id: 0, rects: [{ x: 10, y: 6, w: 80, h: 48 }] }];

// Predictions tile the same area whether at line or paragraph granularity.
const PARA_PRED = [{ x: 10, y: 6, w: 80, h: 48 }];
const LINE_PRED = Array.from({ length: 6 }, (_, i) => ({ x: 10, y: 6 + i * 8, w: 80, h: 8 }));

// F1 under granularity mismatch is the paper's reported value (Table:
// "GT: Line, Pred: Para" and the symmetric case both give F1 = 0.32).
const REGIMES = {
  match: { label: 'Same granularity', preds: PARA_PRED, f1: 1.0 },
  mismatch: { label: 'Model labels finer than ground truth', preds: LINE_PRED, f1: 0.32 },
};

export function init(container) {
  const svgNS = 'http://www.w3.org/2000/svg';

  const stage = document.createElement('div');
  stage.className = 'cote-stage';
  stage.style.maxWidth = '420px';
  const sizer = document.createElement('div');
  sizer.className = 'cote-stage__sizer';
  sizer.style.paddingTop = `${(GRID_H / GRID_W) * 100}%`;
  stage.appendChild(sizer);

  const svg = document.createElementNS(svgNS, 'svg');
  svg.setAttribute('class', 'cote-stage__svg');
  svg.setAttribute('viewBox', `0 0 ${GRID_W} ${GRID_H}`);
  svg.setAttribute('preserveAspectRatio', 'none');
  stage.appendChild(svg);
  container.appendChild(stage);

  const readout = document.createElement('div');
  readout.className = 'cote-readout';
  const f1Stat = makeStat(readout, 'F1', true);
  const coteStat = makeStat(readout, 'COTe', true);
  container.appendChild(readout);

  const controls = document.createElement('div');
  controls.className = 'cote-controls';
  let current = 'match';
  Object.entries(REGIMES).forEach(([key, regime]) => {
    const btn = document.createElement('button');
    btn.className = 'cote-btn'; btn.type = 'button'; btn.textContent = regime.label;
    btn.setAttribute('aria-pressed', String(key === current));
    btn.addEventListener('click', () => {
      current = key;
      [...controls.children].forEach((c, i) =>
        c.setAttribute('aria-pressed', String(Object.keys(REGIMES)[i] === current)));
      render();
    });
    controls.appendChild(btn);
  });
  container.appendChild(controls);

  function drawPreds(preds) {
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    // SSU outline
    const o = document.createElementNS(svgNS, 'rect');
    o.setAttribute('x', SSU[0].rects[0].x); o.setAttribute('y', SSU[0].rects[0].y);
    o.setAttribute('width', SSU[0].rects[0].w); o.setAttribute('height', SSU[0].rects[0].h);
    o.setAttribute('fill', 'none'); o.setAttribute('stroke', 'currentColor');
    o.setAttribute('stroke-dasharray', '2 2'); o.setAttribute('opacity', '0.5');
    svg.appendChild(o);
    preds.forEach((p) => {
      const r = document.createElementNS(svgNS, 'rect');
      r.setAttribute('x', p.x + 0.5); r.setAttribute('y', p.y + 0.5);
      r.setAttribute('width', p.w - 1); r.setAttribute('height', p.h - 1);
      r.setAttribute('fill', 'var(--cote-green)'); r.setAttribute('opacity', '0.45');
      r.setAttribute('stroke', 'var(--cote-green)');
      svg.appendChild(r);
    });
  }

  function render() {
    const regime = REGIMES[current];
    drawPreds(regime.preds);
    const result = computeCoteGrid({ width: GRID_W, height: GRID_H, ssus: SSU, predictions: regime.preds });
    animateStat(f1Stat, regime.f1);
    animateStat(coteStat, result.cote);
  }

  render();
}

function makeStat(parent, label, isScore) {
  const wrap = document.createElement('div');
  wrap.className = 'cote-stat' + (isScore ? ' cote-stat--score' : '');
  const l = document.createElement('span'); l.className = 'cote-stat__label'; l.textContent = label;
  const v = document.createElement('span'); v.className = 'cote-stat__value'; v.textContent = '0.00';
  wrap.append(l, v); parent.appendChild(wrap);
  return { el: v, shown: 0 };
}

function animateStat(stat, target) {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced || typeof window.anime !== 'function') {
    stat.shown = target; stat.el.textContent = target.toFixed(2); return;
  }
  window.anime({
    targets: stat, shown: target, duration: 400, easing: 'easeOutCubic',
    update: () => { stat.el.textContent = stat.shown.toFixed(2); },
  });
}
