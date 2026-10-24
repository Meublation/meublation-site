/* Meublation – Open Days read from the published Google Sheet (CSV).
 *
 * Sheet layout (first tab):
 *   B1 = date of the next Open Days (2026-11-09 or 09/11/2026, optional time "2026-11-09 10:00", Paris time)
 *   B2 = text shown in English        C2 = text shown in French
 *   B3 = booking link for drop-off    B4 = booking link for pick-up
 * An empty link cell keeps the default e-mail link of the page.
 *
 * If the Sheet cannot be read, the pages keep the texts written in their HTML.
 */
(function () {
  'use strict';

  var CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ-3lZ2IoZTVXcPoOZE326Vi_jVmqwKZLI0cA7nWs0PVMSOA2XcxQKzFy7Os6Wov6kr19IqV84OjGiP/pub?output=csv';
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

  // --- Update the page ---
  function render() {
    var lang = currentLang();
    var text = lang === 'fr' ? (data.fr || data.en) : (data.en || data.fr);

    document.querySelectorAll('[data-od="text"]').forEach(function (el) {
      if (el.dataset.odEn === undefined) el.dataset.odEn = el.textContent;
      var fallback = lang === 'fr' && el.getAttribute('data-fr') ? el.getAttribute('data-fr') : el.dataset.odEn;
      el.textContent = text || fallback;
    });

    document.querySelectorAll('[data-od-link]').forEach(function (a) {
      if (a.dataset.odDefault === undefined) a.dataset.odDefault = a.getAttribute('href') || '';
      var url = safeLink(a.getAttribute('data-od-link') === 'pickup' ? data.pickup : data.drop);
      a.setAttribute('href', url || a.dataset.odDefault);
      if (url && /^https?:/i.test(url)) { a.setAttribute('target', '_blank'); a.setAttribute('rel', 'noopener'); }
      else { a.removeAttribute('target'); a.removeAttribute('rel'); }
    });

    var sec = document.querySelector('[data-open-day]');
    if (sec) {
      var ms = data.date ? parseDate(data.date) : null;
      if (ms) sec.setAttribute('data-open-day', new Date(ms).toISOString());
    }

    var popup = document.getElementById('od-popup');
    if (popup) {
      var msg = popup.querySelector('[data-od="popup-text"]');
      if (msg) msg.textContent = text || msg.textContent;
    }
  }

  // --- Pop-up on the home page (closed for the rest of the visit once dismissed) ---
  function setupPopup() {
    var popup = document.getElementById('od-popup');
    if (!popup) return;
    var KEY = 'meublation-od-popup';
    try { if (sessionStorage.getItem(KEY) === 'closed') return; } catch (e) {}
    var close = popup.querySelector('[data-od="close"]');
    if (close) {
      close.addEventListener('click', function () {
        popup.hidden = true;
        try { sessionStorage.setItem(KEY, 'closed'); } catch (e) {}
      });
    }
    setTimeout(function () { popup.hidden = false; }, 1400);
  }

  // The language switch changes the lang attribute of <html>: update our texts too.
  new MutationObserver(render).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });

  render();
  setupPopup();

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
      render();
    })
    .catch(function () { /* keep the texts written in the HTML */ });
})();
