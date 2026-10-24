/* Meublation – loading animation (a leaf falling on the green background).
 *
 * - Loaded in the <head> of every page.
 * - It appears only when the page is slow: if the page is not loaded after 0.3 s, the green screen
 *   comes in. On a fast connection it never shows.
 * - Once shown, it stays at least 0.8 s (to avoid a flash), and leaves as soon as the page is loaded.
 *   After 8 s it leaves anyway.
 * - It is never shown to people who asked for reduced motion.
 * - When the page is ready, the event "meublation:ready" is sent (the Open Days pop-up waits for it).
 */
(function () {
  'use strict';
  var DELAY = 300, MIN_SHOWN = 800, MAX = 8000;
  var root = document.documentElement;
  var el = null, shownAt = 0, loaded = document.readyState === 'complete', ended = false;

  function ready() {
    window.__meublationReady = true;
    document.dispatchEvent(new Event('meublation:ready'));
  }

  var reduce = false;
  try { reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}

  function show() {
    if (reduce || loaded) return;
    var lang = 'en';
    try { lang = localStorage.getItem('meublation-lang') === 'fr' ? 'fr' : 'en'; } catch (e) {}
    var q = /[?&]lang=(fr|en)/.exec(location.search);
    if (q) lang = q[1];

    var style = document.createElement('style');
    style.textContent =
      '.ld{position:fixed;inset:0;z-index:2147483000;background:#0E3B2B;overflow:hidden;opacity:0;animation:ld-in .25s ease forwards;transition:opacity .4s ease}' +
      '.ld.ld-out{opacity:0;pointer-events:none;animation:none}' +
      '.ld-stage{position:absolute;left:50%;top:50%;width:320px;height:340px;margin:-170px 0 0 -160px}' +
      '.ld-fall{position:absolute;left:50%;top:0;width:72px;height:72px;margin-left:-36px;animation:ld-fall 4.4s linear infinite}' +
      '.ld-sway{width:72px;height:72px;transform-origin:50% 20%;animation:ld-sway 2.2s ease-in-out infinite alternate}' +
      '.ld-sway svg{display:block;color:#0E3B2B}' +
      '@keyframes ld-in{to{opacity:1}}' +
      '@keyframes ld-fall{0%{transform:translateY(-20px);opacity:0}12%{opacity:1}82%{opacity:1}100%{transform:translateY(240px);opacity:0}}' +
      '@keyframes ld-sway{0%{transform:translateX(-190px) rotate(-26deg)}100%{transform:translateX(190px) rotate(26deg)}}' +
      '@media (max-width:640px){.ld-stage{transform:scale(.8)}}';
    (document.head || root).appendChild(style);

    el = document.createElement('div');
    el.className = 'ld';
    el.setAttribute('role', 'status');
    el.setAttribute('aria-live', 'polite');
    el.setAttribute('aria-label', lang === 'fr' ? 'Chargement' : 'Loading');
    el.innerHTML =
      '<div class="ld-stage"><div class="ld-fall"><div class="ld-sway">' +
      '<svg viewBox="0 0 48 48" width="72" height="72" aria-hidden="true">' +
      '<path d="M8 42C5 24 17 8 43 5C46 31 30 46 8 42z" fill="#9BE08C"></path>' +
      '<path d="M9.5 41.5C18 31 27 21 37.5 12C29 25 20 34 9.5 41.5z" fill="currentColor"></path>' +
      '<path d="M8.5 41.5L3.5 46.5" stroke="#9BE08C" stroke-width="2.6" stroke-linecap="round" fill="none"></path>' +
      '</svg></div></div></div>';
    // <body> may not exist yet: the overlay is added to <html> and covers everything
    root.appendChild(el);
    shownAt = Date.now();
    window.__meublationLoaderShown = true;
    poll();
  }

  function hide() {
    if (ended) return;
    ended = true;
    el.classList.add('ld-out');
    setTimeout(function () {
      if (el.parentNode) el.parentNode.removeChild(el);
      ready();
    }, 400);
  }

  function poll() {
    if (ended) return;
    var shown = Date.now() - shownAt;
    if ((loaded && shown >= MIN_SHOWN) || shown >= MAX) hide();
    else setTimeout(poll, 100);
  }

  window.addEventListener('load', function () {
    loaded = true;
    if (!el) ready(); // fast page: no loading screen, the pop-up may come
  });

  if (!loaded) setTimeout(function () { if (!loaded) show(); }, DELAY);
  else ready();
})();
