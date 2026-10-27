/* Meublation – Open Days read from the published Google Sheet (CSV).
 *
 * Sheet layout (first tab):
 *   B1 = date of the next Open Days (2026-11-09 or 09/11/2026, optional time "2026-11-09 10:00", Paris time)
 *   B2 = text shown in English        C2 = text shown in French
 *   B3 = booking link for drop-off    B4 = booking link for pick-up
 * An empty link cell keeps the default e-mail link of the page.
 *
 * If the Sheet cannot be read, the pages keep the texts written in their HTML.
 * On the home page, an opening pop-up (#od-popup) is shown once per visit when the date is in the future.
 */
(function () {
  'use strict';

  var CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vS0D0V9SQyAwmFYb84RT9Ty4s-iGndFZbzlq68SqMherGt5rlJghVpGNHbJD0L0xC_qJ38FMtXmlDNv/pub?gid=0&single=true&output=csv';
  var data = { date: '', en: '', fr: '', drop: '', pickup: '' };

  // --- CSV parsing (handles quotes, commas and line breaks inside cells) ---
  function parseCsv(text) {
    var rows = [], row = [], cell = '', q = false, i, c;
    for (i = 0; i < text.length; i++) {
      c = text.charAt(i);
      if (q) {
        if (c === '"') {
          if (text.charAt(i + 1) === '"') { cell += '"'; i++; } else { q = false; }
        } else { cell += c; }
      } else if (c === '"') { q = true; }
      else if (c === ',') { row.push(cell); cell = ''; }
      else if (c === '\n') { row.push(cell); rows.push(row); row = []; cell = ''; }
      else if (c !== '\r') { cell += c; }
    }
    row.push(cell); rows.push(row);
    return rows;
  }

  function cellAt(rows, r, c) {
    return rows[r] && rows[r][c] ? String(rows[r][c]).trim() : '';
  }

  // --- Dates: read as Paris time ---
  function parisOffsetMinutes(ms) {
    var parts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Europe/Paris', hourCycle: 'h23',
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    }).formatToParts(new Date(ms));
    var o = {};
    parts.forEach(function (p) { o[p.type] = p.value; });
    return (Date.UTC(+o.year, +o.month - 1, +o.day, +o.hour, +o.minute, +o.second) - ms) / 60000;
  }

  function parisToEpoch(y, m, d, h, mi) {
    var guess = Date.UTC(y, m - 1, d, h, mi);
    var first = guess - parisOffsetMinutes(guess) * 60000;
    return guess - parisOffsetMinutes(first) * 60000;
  }

  function parseDate(s) {
    var m = /^(\d{4})-(\d{1,2})-(\d{1,2})(?:[ T](\d{1,2}):(\d{2}))?/.exec(s);
    var y, mo, d, h, mi;
    if (m) { y = +m[1]; mo = +m[2]; d = +m[3]; h = +(m[4] || 0); mi = +(m[5] || 0); }
    else {
      m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:[ T](\d{1,2}):(\d{2}))?/.exec(s);
      if (!m) return null;
      d = +m[1]; mo = +m[2]; y = +m[3]; h = +(m[4] || 0); mi = +(m[5] || 0);
    }
    try {
      var ms = parisToEpoch(y, mo, d, h, mi);
      return isNaN(ms) ? null : ms;
    } catch (e) { return null; }
  }

  // --- Links: only web links and e-mail links are accepted ---
  function safeLink(s) {
    return /^(https?:\/\/|mailto:)/i.test(s) ? s : '';
  }

  function currentLang() {
    return document.documentElement.lang === 'fr' ? 'fr' : 'en';
  }

  function lowerFirst(s) {
    // "Week of November 9" -> "week of November 9" (but keep acronyms such as "OD")
    return /^[A-ZÀ-Ý][a-zà-ÿ]/.test(s) ? s.charAt(0).toLowerCase() + s.slice(1) : s;
  }

  // --- Update the page ---
  function render() {
    var lang = currentLang();
    var text = lang === 'fr' ? (data.fr || data.en) : (data.en || data.fr);

    document.querySelectorAll('[data-od="text"]').forEach(function (el) {
      if (el.dataset.odEn === undefined) el.dataset.odEn = el.textContent;
      var fallback = lang === 'fr' && el.getAttribute('data-fr') ? el.getAttribute('data-fr') : el.dataset.odEn;
      var shown = text || fallback;
      el.textContent = (text && el.hasAttribute('data-od-lower')) ? lowerFirst(shown) : shown;
    });

    document.querySelectorAll('[data-od-link]').forEach(function (a) {
      // default link = the e-mail link of the page, in the language shown
      var def = (lang === 'fr' && a.getAttribute('data-href-fr')) ? a.getAttribute('data-href-fr') : (a.getAttribute('data-href-en') || a.dataset.odDefault || a.getAttribute('href') || '');
      if (a.dataset.odDefault === undefined) a.dataset.odDefault = a.getAttribute('data-href-en') || a.getAttribute('href') || '';
      var url = safeLink(a.getAttribute('data-od-link') === 'pickup' ? data.pickup : data.drop);
      a.setAttribute('href', url || def);
      if (url && /^https?:/i.test(url)) { a.setAttribute('target', '_blank'); a.setAttribute('rel', 'noopener'); }
      else { a.removeAttribute('target'); a.removeAttribute('rel'); }
    });

    var sec = document.querySelector('[data-open-day]');
    if (sec) {
      var ms = data.date ? parseDate(data.date) : null;
      if (ms) sec.setAttribute('data-open-day', new Date(ms).toISOString());
    }

    renderPopupNumbers(lang);
  }

  // --- Calendar days between today and the Open Day, both read in Paris time ---
  function parisYmd(ms) {
    var parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Europe/Paris', year: 'numeric', month: '2-digit', day: '2-digit'
    }).formatToParts(new Date(ms));
    var o = {};
    parts.forEach(function (p) { o[p.type] = p.value; });
    return Date.UTC(+o.year, +o.month - 1, +o.day);
  }

  function popupTarget() {
    var box = document.querySelector('.pu-count');
    if (!box) return null;
    var raw = sheetLoaded ? data.date : (data.date || box.getAttribute('data-default-date') || '');
    return raw ? parseDate(raw) : null;
  }

  function daysUntil() {
    var target = popupTarget();
    if (!target) return null;
    return Math.round((parisYmd(target) - parisYmd(Date.now())) / 86400000);
  }

  function dateLabel(ms, lang) {
    if (lang === 'fr') {
      var d = new Intl.DateTimeFormat('fr-FR', { timeZone: 'Europe/Paris', day: 'numeric', month: 'long' }).format(new Date(ms));
      return d.replace(/^1 /, '1er ');
    }
    return new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Paris', day: 'numeric', month: 'long' }).format(new Date(ms));
  }

  function renderPopupNumbers(lang) {
    var box = document.querySelector('.pu-count');
    if (!box) return;
    var days = daysUntil(), target = popupTarget();
    if (days === null || days < 0) return;
    var num = box.querySelector('[data-od="popup-days"]');
    var lbl = box.querySelector('.pu-lbl');
    var fr = lang === 'fr';
    if (days === 0) {
      num.textContent = fr ? 'Aujourd’hui' : 'Today';
      num.classList.add('pu-word');
      lbl.hidden = true;
    } else {
      num.textContent = String(days);
      num.classList.remove('pu-word');
      lbl.hidden = false;
      box.querySelector('[data-od="popup-daylabel"]').textContent = fr ? (days === 1 ? 'jour' : 'jours') : (days === 1 ? 'day' : 'days');
      box.querySelector('[data-od="popup-datelabel"]').textContent = dateLabel(target, lang);
    }
  }

  // --- Opening pop-up on the home page ---
  // Shown once per visit, after the loading animation, only if the Open Day is today or later.
  var sheetLoaded = false, sheetSettled = false, popupDone = false, popupWait = null;
  var popupStart = Date.now();

  function closePopup(popup, opener) {
    popup.hidden = true;
    document.documentElement.classList.remove('pu-open');
    try { sessionStorage.setItem('meublation-od-popup', 'closed'); } catch (e) {}
    if (opener && opener.focus) { try { opener.focus(); } catch (e) {} }
  }

  function openPopup(popup) {
    var opener = document.activeElement;
    var card = popup.querySelector('.pu-card');
    var ok = popup.querySelector('[data-od="ok"]');
    var x = popup.querySelector('[data-od="close"]');
    popup.hidden = false;
    document.documentElement.classList.add('pu-open');
    (ok || card).focus();

    function close() { document.removeEventListener('keydown', onKey, true); closePopup(popup, opener); }
    function onKey(e) {
      if (e.key === 'Escape') { e.preventDefault(); close(); return; }
      if (e.key !== 'Tab') return;
      // keep the focus inside the dialog
      var items = [x, ok].filter(Boolean);
      var first = items[0], last = items[items.length - 1];
      if (!card.contains(document.activeElement)) { e.preventDefault(); first.focus(); }
      else if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
    document.addEventListener('keydown', onKey, true);
    if (x) x.addEventListener('click', close);
    if (ok) ok.addEventListener('click', close);
    popup.addEventListener('click', function (e) { if (e.target === popup) close(); });
  }

  function maybeShowPopup() {
    var popup = document.getElementById('od-popup');
    if (!popup || popupDone) return;
    try { if (sessionStorage.getItem('meublation-od-popup') === 'closed') { popupDone = true; return; } } catch (e) {}
    // wait for the loading animation and for the Sheet (or a 3 s timeout)
    if (!window.__meublationReady) return;
    if (!sheetSettled && Date.now() - popupStart < 3000) {
      if (!popupWait) popupWait = setTimeout(function () { popupWait = null; maybeShowPopup(); }, 3000 - (Date.now() - popupStart));
      return;
    }
    popupDone = true;
    var days = daysUntil();
    if (days === null || days < 0) return;
    renderPopupNumbers(currentLang());
    setTimeout(function () { openPopup(popup); }, 600);
  }

  document.addEventListener('meublation:ready', maybeShowPopup);

  // The language switch changes the lang attribute of <html>: update our texts too.
  new MutationObserver(render).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });

  render();
  maybeShowPopup();

  if (!window.fetch) return;
  fetch(CSV_URL, { cache: 'no-store' })
    .then(function (r) { if (!r.ok) throw new Error('csv'); return r.text(); })
    .then(function (t) {
      var rows = parseCsv(t);
      data.date = cellAt(rows, 0, 1);
      data.en = cellAt(rows, 1, 1);
      data.fr = cellAt(rows, 1, 2);
      data.drop = cellAt(rows, 2, 1);
      data.pickup = cellAt(rows, 3, 1);
      sheetLoaded = true;
      render();
    })
    .catch(function () { /* keep the texts written in the HTML */ })
    .then(function () { sheetSettled = true; maybeShowPopup(); });
})();
