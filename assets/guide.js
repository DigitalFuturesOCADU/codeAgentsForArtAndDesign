// Setup guide behaviour. The page content is plain HTML in index.html:
//   <section class="topic" id="..." data-group="..." data-nav="short title">
//     <article class="step" id="topic--step" data-nav="short title"> ... </article>
// Everything here (sidebar, numbering, paging) is generated from that structure,
// so adding, removing or reordering topics and steps needs no changes to this file.
(function () {
  'use strict';
  var doc = document, root = doc.documentElement;
  root.classList.add('js');

  var $ = function (s, r) { return (r || doc).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || doc).querySelectorAll(s)); };
  var store = {
    get: function (k, d) { try { var v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  };
  var KEY_OS = 'agentsGuide.os';

  if (/[?&]audit\b/.test(location.search)) root.classList.add('audit');

  // ---------- operating system ----------
  function detectOS() {
    var p = (navigator.userAgentData && navigator.userAgentData.platform) || navigator.platform || navigator.userAgent || '';
    return /win/i.test(p) ? 'win' : 'mac';
  }
  function setOS(os) {
    root.setAttribute('data-os', os);
    store.set(KEY_OS, os);
    $$('.os-toggle button').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.os === os)); });
  }

  // ---------- model of the page ----------
  var topics = $$('.topic').map(function (el, i) {
    var steps = $$('.step', el).filter(function (s) { return !s.hidden; }).map(function (s, j) {
      var h = $('h2', s);
      return { el: s, id: s.id, title: s.dataset.nav || (h ? h.textContent.trim() : s.id), optional: s.hasAttribute('data-optional'), index: j };
    });
    var h1 = $('h1', el);
    return { el: el, id: el.id, index: i, group: el.dataset.group || '', title: el.dataset.nav || (h1 ? h1.textContent.trim() : el.id), steps: steps };
  });
  var byId = {};
  topics.forEach(function (t) { byId[t.id] = { topic: t }; t.steps.forEach(function (s) { byId[s.id] = { topic: t, step: s }; }); });

  // ---------- decorate content ----------
  topics.forEach(function (t) {
    var head = $('header', t.el);
    if (head && !$('.kicker', head)) {
      var k = doc.createElement('p'); k.className = 'kicker';
      k.textContent = t.group;
      head.insertBefore(k, head.firstChild);
    }
    if (t.steps.length > 1 && head) {
      var toc = doc.createElement('nav'); toc.className = 'toc'; toc.setAttribute('aria-label', 'Sub-sections');
      toc.innerHTML = '<h2>In this section</h2><ol>' + t.steps.map(function (s) {
        return '<li><a href="#' + s.id + '" data-step-link="' + s.id + '">' + esc(s.title) + '</a></li>';
      }).join('') + '</ol>';
      head.appendChild(toc);
    }
    t.steps.forEach(function (s) {
      var h = $('h2', s.el);
      if (h) {
                if (s.optional) { var tag = doc.createElement('span'); tag.className = 'tag'; tag.textContent = 'Optional'; h.appendChild(tag); }
      }
    });
    // pager
    var prev = topics[t.index - 1], next = topics[t.index + 1];
    var pager = doc.createElement('nav'); pager.className = 'pager'; pager.setAttribute('aria-label', 'Previous and next part');
    pager.innerHTML =
      (prev ? '<a class="prev" href="#' + prev.id + '"><small>Back</small>' + esc(prev.title) + '</a>' : '<span class="spacer"></span>') +
      (next ? '<a class="next" href="#' + next.id + '"><small>Next</small>' + esc(next.title) + '</a>' : '<span class="spacer"></span>');
    t.el.appendChild(pager);
  });

  // "part 5" style cross-references follow the real order of the topics
  $$('[data-part]').forEach(function (el) {
    var hit = byId[el.dataset.part]; if (!hit) return;
    var word = /^P/.test(el.textContent) ? 'Part ' : 'part ';
    el.textContent = word + (hit.topic.index + 1);
  });

  // OS blocks get a label and a switch link
  $$('.os').forEach(function (b) {
    var os = b.dataset.os, other = os === 'mac' ? 'win' : 'mac';
    var l = doc.createElement('div'); l.className = 'os-label';
    l.innerHTML = '<span>' + (os === 'mac' ? 'Mac' : 'Windows') + '</span><button type="button">Show ' + (other === 'mac' ? 'Mac' : 'Windows') + ' instead</button>';
    $('button', l).addEventListener('click', function () { setOS(other); });
    b.insertBefore(l, b.firstChild);
  });

  // copy buttons
  $$('.cmd').forEach(function (c) {
    var b = doc.createElement('button'); b.type = 'button'; b.className = 'copy'; b.textContent = 'Copy';
    b.addEventListener('click', function () {
      var text = $('pre', c).textContent.replace(/\n$/, '');
      var ok = function () { b.textContent = 'Copied'; setTimeout(function () { b.textContent = 'Copy'; }, 1400); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(ok, fallback); else fallback();
      function fallback() {
        var ta = doc.createElement('textarea'); ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
        doc.body.appendChild(ta); ta.select(); try { doc.execCommand('copy'); ok(); } catch (e) {} doc.body.removeChild(ta);
      }
    });
    c.appendChild(b);
  });

  // screenshots open larger
  var lightbox = doc.createElement('div'); lightbox.className = 'lightbox'; lightbox.setAttribute('role', 'dialog'); lightbox.setAttribute('aria-label', 'Screenshot');
  lightbox.innerHTML = '<button type="button" class="close">Close</button><img alt="">';
  doc.body.appendChild(lightbox);
  var lastFocus = null;
  function closeLightbox() { lightbox.classList.remove('is-open'); if (lastFocus) lastFocus.focus(); }
  lightbox.addEventListener('click', closeLightbox);
  $$('figure.shot img').forEach(function (img) {
    var btn = doc.createElement('button'); btn.type = 'button'; btn.setAttribute('aria-label', 'Enlarge screenshot: ' + (img.alt || ''));
    img.parentNode.insertBefore(btn, img); btn.appendChild(img);
    btn.addEventListener('click', function () {
      lastFocus = btn; var big = $('img', lightbox); big.src = img.currentSrc || img.src; big.alt = img.alt;
      lightbox.classList.add('is-open'); lightbox.scrollTop = 0; $('.close', lightbox).focus();
    });
  });

  // ---------- sidebar ----------
  var nav = $('#nav'), groups = [], groupEl = {};
  topics.forEach(function (t) {
    if (!groupEl[t.group]) {
      var g = doc.createElement('div'); g.className = 'nav-group';
      g.innerHTML = (t.group ? '<h2>' + esc(t.group) + '</h2>' : '') + '<ol></ol>';
      nav.appendChild(g); groupEl[t.group] = $('ol', g); groups.push(t.group);
    }
    var li = doc.createElement('li'); li.className = 'nav-topic'; li.dataset.topic = t.id;
    var hasSteps = t.steps.length > 0;
    li.innerHTML =
      '<div class="nav-topic-row"><a href="#' + t.id + '"><span class="n">' + (t.index + 1) + '</span><span class="t">' + esc(t.title) + '</span></a>' +
      (hasSteps ? '<button type="button" class="nav-toggle" aria-expanded="false" aria-label="Show the sub-sections of ' + esc(t.title) + '"><span>&#9654;</span></button>' : '') + '</div>' +
      (hasSteps ? '<ol class="nav-steps">' + t.steps.map(function (s) {
        return '<li><a href="#' + s.id + '" data-step-link="' + s.id + '"><span>' + esc(s.title) + (s.optional ? ' <span class="opt">optional</span>' : '') + '</span></a></li>';
      }).join('') + '</ol>' : '');
    groupEl[t.group].appendChild(li); t.navEl = li;
    var tog = $('.nav-toggle', li);
    if (tog) tog.addEventListener('click', function () { setOpen(t, !li.classList.contains('is-open')); });
  });
  function setOpen(t, open) {
    t.navEl.classList.toggle('is-open', open);
    var tog = $('.nav-toggle', t.navEl); if (tog) tog.setAttribute('aria-expanded', String(open));
  }

  // ---------- routing ----------
  var current = null;
  function show(id, opts) {
    var hit = byId[id] || { topic: topics[0] };
    var t = hit.topic, changed = current !== t;
    if (changed) {
      topics.forEach(function (x) {
        x.el.classList.toggle('is-active', x === t);
        x.navEl.classList.toggle('is-active', x === t);
        if (x !== t) setOpen(x, false);
      });
      setOpen(t, true); current = t;
      doc.title = t.title + ' · Getting Started with Coding Agents';
      $('#topbar-topic').textContent = (t.index + 1) + '. ' + t.title;
    }
    closeNav();
    if (hit.step) {
      // wait a frame so a newly shown topic has layout
      requestAnimationFrame(function () { hit.step.el.scrollIntoView({ block: 'start' }); spy(); });
    } else if (changed || (opts && opts.top)) {
      window.scrollTo(0, 0); spy();
    }
    var active = $('a', t.navEl); if (active && changed && active.scrollIntoView) active.scrollIntoView({ block: 'nearest' });
  }
  window.addEventListener('hashchange', function () { show(decodeURIComponent(location.hash.slice(1)), { top: true }); });

  // highlight the step being read
  var ticking = false;
  function spy() {
    ticking = false;
    if (!current) return;
    var line = (window.innerWidth <= 960 ? 56 : 0) + 140, cur = null;
    current.steps.forEach(function (s) { if (s.el.getBoundingClientRect().top <= line) cur = s; });
    $$('.nav-steps a', current.navEl).forEach(function (a) { a.classList.toggle('is-current', !!cur && a.dataset.stepLink === cur.id); });
    var n = current.steps.length;
    $('#topbar-step').textContent = n ? (cur ? cur.title : '') : '';
  }
  window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(spy); } }, { passive: true });

  // ---------- mobile drawer ----------
  var menuBtn = $('#menu-btn');
  function openNav() { root.classList.add('nav-open'); menuBtn.setAttribute('aria-expanded', 'true'); var a = $('.nav-topic.is-active a', nav); if (a) a.focus(); }
  function closeNav() { if (!root.classList.contains('nav-open')) return; root.classList.remove('nav-open'); menuBtn.setAttribute('aria-expanded', 'false'); }
  menuBtn.addEventListener('click', function () { root.classList.contains('nav-open') ? closeNav() : openNav(); });
  $('#backdrop').addEventListener('click', closeNav);
  nav.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a'); if (!a) return;
    // same hash clicked again: hashchange will not fire, so handle it here
    if (a.getAttribute('href') === location.hash) { show(location.hash.slice(1), { top: true }); }
  });
  doc.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (lightbox.classList.contains('is-open')) closeLightbox(); else closeNav();
  });

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  // ---------- go ----------
  $$('.os-toggle button').forEach(function (b) { b.addEventListener('click', function () { setOS(b.dataset.os); }); });
  setOS(store.get(KEY_OS, null) || detectOS());
  show(decodeURIComponent(location.hash.slice(1)));

  // A link straight to a step: the web font and images can arrive after the first scroll and
  // push the step out of place, so line it up once more when they are in.
  (function settle() {
    var id = decodeURIComponent(location.hash.slice(1)), hit = byId[id];
    if (!hit || !hit.step) return;
    var moved = false;
    window.addEventListener('wheel', function () { moved = true; }, { once: true, passive: true });
    window.addEventListener('touchmove', function () { moved = true; }, { once: true, passive: true });
    var go = function () { if (!moved && decodeURIComponent(location.hash.slice(1)) === id) { hit.step.el.scrollIntoView({ block: 'start' }); spy(); } };
    if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(go);
    if (doc.readyState !== 'complete') window.addEventListener('load', go, { once: true });
  })();
})();
