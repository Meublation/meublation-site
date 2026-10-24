/* Meublation – loading animation (a leaf falling on the green background).
 *
 * - Loaded in the <head> of every page, so the green screen is there before the page is drawn.
 * - Shown only on the first page of a visit (not on every click), and never if the visitor
 *   asked for reduced motion.
 * - Lasts at least 1.2 s and at most 2.5 s, then fades out.
 * - When it is over, the event "meublation:ready" is sent (the Open Days pop-up waits for it).
 */
(function () {
  'use strict';
  var root = document.documentElement;
  var KEY = 'meublation-loader-seen';

  function done() {
    window.__meublationReady = true;
    document.dispatchEvent(new Event('meublation:ready'));
  }

  var skip = false;
  try { skip = sessionStorage.getItem(KEY) === '1'; } catch (e) {}
  try { if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) skip = true; } catch (e) {}
  if (skip) {
    // scripts loaded later (opendays.js) look at this flag when they start
    window.__meublationReady = true;
    return;
  }
  try { sessionStorage.setItem(KEY, '1'); } catch (e) {}

  var lang = 'en';
  try { lang = localStorage.getItem('meublation-lang') === 'fr' ? 'fr' : 'en'; } catch (e) {}
  var q = /[?&]lang=(fr|en)/.exec(location.search);
  if (q) lang = q[1];

  var style = document.createElement('style');
  style.textContent =
    '.ld{position:fixed;inset:0;z-index:2147483000;background:#0E3B2B;overflow:hidden;transition:opacity .4s ease}' +
    '.ld.ld-out{opacity:0;pointer-events:none}' +
    '.ld-stage{position:absolute;left:50%;top:50%;width:320px;height:340px;margin:-170px 0 0 -160px}' +
    '.ld-fall{position:absolute;left:50%;top:0;width:72px;height:72px;margin-left:-36px;animation:ld-fall 4.4s linear infinite}' +
    '.ld-sway{width:72px;height:72px;transform-origin:50% 20%;animation:ld-sway 2.2s ease-in-out infinite alternate}' +
    '.ld-sway svg{display:block;color:#0E3B2B}' +
    '@keyframes ld-fall{0%{transform:translateY(-20px);opacity:0}12%{opacity:1}82%{opacity:1}100%{transform:translateY(240px);opacity:0}}' +
    '@keyframes ld-sway{0%{transform:translateX(-190px) rotate(-26deg)}100%{transform:translateX(190px) rotate(26deg)}}' +
    '@media (max-width:640px){.ld-stage{transform:scale(.8)}}';
  document.head.appendChild(style);

  var el = document.createElement('div');
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
  // <body> does not exist yet: the overlay is added to <html> and covers everything
  root.appendChild(el);

  var started = Date.now(), loaded = document.readyState === 'complete', ended = false;

  function finish() {
    if (ended) return;
    ended = true;
    el.classList.add('ld-out');
    setTimeout(function () {
      if (el.parentNode) el.parentNode.removeChild(el);
      done();
    }, 400);
  }

  function check() {
    var elapsed = Date.now() - started;
    if (elapsed >= 2500 || (loaded && elapsed >= 1200)) finish();
    else setTimeout(check, 100);
  }

  window.addEventListener('load', function () { loaded = true; });
  setTimeout(check, 100);
})();
