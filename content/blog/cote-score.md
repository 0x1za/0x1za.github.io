---
title: "Why your document parser's mAP is lying to you"
date: 2026-06-11
draft: false
author: "Mwiza Simbeye"
description: "A 10-minute, interactive tour of the COTe score — why IoU, F1, and mAP mislead on documents, and what to measure instead."
tags: ["document-ai", "evaluation", "computer-vision"]
---

<link rel="stylesheet" href="/css/cote.css">

Your document-layout model scores an mAP of **0.38**. Is that good? Bad?
Production-ready? You genuinely can't tell — and that's not your fault. The
metric itself is the problem. This is a 10-minute tour of *why*, and of a
small library that gives you an answer you can act on.

## Photos aren't pages

The metrics every layout model reports — IoU, F1, mAP — were built for
**photographs**: 2D projections of a 3D world where objects overlap and occlude
each other. A document page is a different beast. It's a 2D *tessellation*:
text tiles the surface with no gaps and, crucially, no overlaps.

<div class="cote-widget">
  <div id="cote-odvspage"></div>
</div>

## The granularity trap

The parse below is **perfect** — every word is captured exactly once. The only
thing that changes is how finely the boxes are drawn. Watch F1 collapse while
COTe barely flinches.

<div class="cote-widget">
  <div id="cote-granularity"></div>
</div>

Same parse, same extracted text — yet F1 reads it as a near-total failure
(**0.32**) the instant the model's boxes don't line up with the labeller's
granularity. That mismatch is the rule, not the exception, and it's why a low
mAP tells you so little.

## A better question: decompose the error

So drop the single number. The COTe score asks four separate, readable
questions about a parse instead of collapsing everything into one. Drag the
boxes below and watch each one move.

<div class="cote-widget">
  <p class="cote-widget__title">Drag the boxes. Toggle them. Watch the score.</p>
  <div id="cote-overlay"></div>
</div>

Each part is measured against the area of the ground-truth content:

- **Coverage** — how much of the content got predicted at all.
- **Overlap** — content covered by *more than one* box (stacked predictions —
  impossible to read cleanly).
- **Trespass** — a box bleeding into a *different* semantic unit, merging
  unrelated text.
- **Excess** — predicted area landing in the margins, outside any content.

The headline score is simply:

$$\text{COTe} = \mathcal{C} - \mathcal{O} - \mathcal{T}$$

Coverage you want; Overlap and Trespass you pay for. A perfect parse is `1.0`;
a single box smeared across the whole page can even go **negative**.

## Real models, real failures

Here's the payoff. On the same newspaper page, three popular models earn wildly
different COTe scores — and the *decomposition* tells you exactly how each one
fails, not just that it did.

<div class="cote-widget" id="cote-failuremodes">
  <p class="cote-widget__title">One page, three verdicts</p>
  <svg viewBox="0 0 320 165" width="100%" role="img"
       aria-label="COTe scores on one newspaper page: DocLayout-YOLO minus 0.55, Heron 0.66, PP-DocLayout-L 0.65">
    <line x1="40" y1="100" x2="300" y2="100" stroke="currentColor" stroke-opacity="0.4"/>
    <text x="34" y="103" font-size="8" text-anchor="end" fill="currentColor" opacity="0.6">0</text>
    <rect x="60"  y="100" width="50" height="44" fill="var(--cote-red)" opacity="0.85"/>
    <text x="85" y="158" font-size="9" text-anchor="middle" fill="currentColor">YOLO</text>
    <text x="85" y="96"  font-size="9" text-anchor="middle" fill="currentColor">-0.55</text>
    <rect x="150" y="47" width="50" height="53" fill="var(--cote-green)" opacity="0.85"/>
    <text x="175" y="158" font-size="9" text-anchor="middle" fill="currentColor">Heron</text>
    <text x="175" y="42"  font-size="9" text-anchor="middle" fill="currentColor">0.66</text>
    <rect x="240" y="48" width="50" height="52" fill="var(--cote-green)" opacity="0.85"/>
    <text x="265" y="158" font-size="9" text-anchor="middle" fill="currentColor">PPDoc-L</text>
    <text x="265" y="43"  font-size="9" text-anchor="middle" fill="currentColor">0.65</text>
  </svg>
</div>

DocLayout-YOLO covers almost everything (Coverage 0.98) but smears boxes across
column boundaries (Trespass 0.99, Overlap 0.54), landing at **COTe −0.55** —
worse than predicting nothing. Heron and PP-DocLayout cover a little less but
keep their boxes clean, scoring around **0.65**. IoU and F1 rate all three as
mediocre and never surface the difference — so they'd send you off to "improve
the model" when the real fix is post-processing the boxes you already have.

## Use it

The COTe score ships as a small Python library:

```bash
pip install cotescore
```

Point it at your predictions and ground truth and you get the four components
back per page, plus helpers to visualise exactly where boxes trespass or stack.
If your ground truth is labelled at paragraph level, you get most of COTe's
robustness for free — no special annotation required.

The full method (including the Structural Semantic Unit labelling that makes
COTe granularity-robust) is in the paper:
[arXiv:2603.12718](https://arxiv.org/abs/2603.12718) ·
[code](https://github.com/JonnoB/cotescore).

<script src="https://cdn.jsdelivr.net/npm/animejs@3.2.2/lib/anime.min.js"></script>
<script type="module" src="/js/cote/cote-post.mjs"></script>
