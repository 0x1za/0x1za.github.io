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

## The metrics everyone already uses

Train a layout model today and three numbers come out of the box, all inherited
from general object detection:

- **IoU** (Intersection over Union) — how much a predicted box and a
  ground-truth box overlap, as a fraction of their combined area. It's the basic
  yardstick: line the two boxes up, divide the shared area by the total.
- **F1** — once IoU decides which predictions "count" (usually IoU > 0.5),
  precision and recall fold into a single hit-rate.
- **mAP** (mean Average Precision) — the headline leaderboard number: the area
  under the precision–recall curve, averaged across classes.

<figure class="cote-figure cote-figure--photo">
  <img src="/images/iou_stop_sign.webp" alt="A stop sign with a green ground-truth bounding box and an offset red predicted bounding box; IoU measures their overlap.">
  <figcaption>IoU: the overlap between the predicted box (red) and the ground-truth box (green), divided by their union.</figcaption>
</figure>

These won the field for good reasons. They're simple, they powered the
benchmarks — PASCAL VOC, COCO — that drove the object-detection boom, and every
dataset and tool reports them, so they're the common language for comparing
models. Document-layout models adopted them by default.

The trouble is that a page isn't a photograph.

## Photos aren't pages

IoU, F1, and mAP were built for **photographs**: 2D projections of a 3D world
where objects overlap and occlude each other. A document page is a different
beast. It's a 2D *tessellation*: text tiles the surface with no gaps and,
crucially, no overlaps.

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

That phrase "semantic unit" is doing real work. COTe groups the ground-truth
text into **Structural Semantic Units (SSUs)** — blocks that belong together,
like one article in one column — instead of scoring loose individual lines. A
box only *trespasses* when it crosses from one unit into another.

<figure class="cote-figure">
  <img src="/images/example_ssu.png" alt="A two-column page of three limericks, each split into Structural Semantic Units outlined in red, blue, and green.">
  <figcaption>The same page, divided into Structural Semantic Units (SSU 1, 2, 3) across two columns.</figcaption>
</figure>

Run a real prediction over those units and the four COTe signals light up
exactly like the interactive above — green where a box cleanly covers content,
yellow where boxes stack, red where one trespasses into a neighbour, purple
where it does both:

<figure class="cote-figure">
  <img src="/images/example_cote_components.png" alt="The limerick page shaded by COTe component: green coverage, yellow overlap, red trespass, purple overlap-plus-trespass, blue excess.">
  <figcaption>COTe components on a real page — the same colour language as the interactive.</figcaption>
</figure>

## Real models, real failures

Here's the payoff. On the same newspaper page, three popular models earn wildly
different COTe scores — and the *decomposition* tells you exactly how each one
fails, not just that it did.

<figure class="cote-figure">
  <img src="/images/TTW_1868-05-16_page_5.png" alt="One 1868 newspaper page parsed by three models — YOLO, Heron, and PP-DocLayout-L — each shaded by COTe component. YOLO is heavily red and yellow; Heron and PP-DocLayout are mostly green.">
  <figcaption>One page, three models. YOLO (left) drowns in red trespass and yellow overlap; Heron (centre) and PP-DocLayout-L (right) stay mostly clean green.</figcaption>
</figure>

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
