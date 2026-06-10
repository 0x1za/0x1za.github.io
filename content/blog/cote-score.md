---
title: "Why your document parser's mAP is lying to you"
date: 2026-06-11
draft: false
author: "Mwiza Simbeye"
description: "A 10-minute, interactive tour of the COTe score — why IoU, F1, and mAP mislead on documents, and what to measure instead."
tags: ["document-ai", "evaluation", "computer-vision"]
---

Your model scores an mAP of 0.38. Is that good? You genuinely can't tell — and
this post is about why, and what to measure instead.

<p class="cote-buildcheck">BUILD OK — scaffold renders.</p>

<link rel="stylesheet" href="/css/cote.css">

## A better question: decompose the error

<div class="cote-widget">
  <p class="cote-widget__title">Drag the boxes. Toggle them. Watch the score.</p>
  <div id="cote-overlay"></div>
</div>

<script src="https://cdn.jsdelivr.net/npm/animejs@3.2.2/lib/anime.min.js"></script>
<script type="module" src="/js/cote/cote-post.mjs"></script>
