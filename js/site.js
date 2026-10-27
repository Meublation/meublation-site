/* Meublation – language switch and countdown. */
(function () {
  var KEY = 'meublation-lang';
  var FR = window.MEUBLATION_FR || {};

  function stored() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function save(l) { try { localStorage.setItem(KEY, l); } catch (e) {} }
  function initialLang() {
    var q = new URLSearchParams(location.search).get('lang');
    if (q === 'fr' || q === 'en') return q;
    var s = stored();
    return s === 'fr' || s === 'en' ? s : 'en';
  }

  // Keep the links (href, style...) of the English version when a French text contains links.
  function withLinks(frHtml, enHtml) {
    var f = document.createElement('template'); f.innerHTML = frHtml;
    var e = document.createElement('template'); e.innerHTML = enHtml;
    var src = e.content.querySelectorAll('a');
    f.content.querySelectorAll('a').forEach(function (a, i) {
      if (!src[i]) return;
      for (var j = 0; j < src[i].attributes.length; j++) a.setAttribute(src[i].attributes[j].name, src[i].attributes[j].value);
    });
    var d = document.createElement('div'); d.appendChild(f.content); return d.innerHTML;
  }

  var ATTRS = [['data-i18n-aria', 'aria-label'], ['data-i18n-title', 'title'], ['data-i18n-alt', 'alt'], ['data-i18n-content', 'content']];

  function apply(lang) {
    var fr = lang === 'fr';
    document.documentElement.lang = lang;
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var isTitle = el.tagName === 'TITLE';
      if (el.dataset.en === undefined) el.dataset.en = isTitle ? el.textContent : el.innerHTML;
      var k = el.getAttribute('data-i18n');
      var text = el.dataset.en;
      if (fr && FR[k]) text = (!isTitle && text.indexOf('<a') > -1) ? withLinks(FR[k], text) : FR[k];
      if (isTitle) el.textContent = text; else el.innerHTML = text;
    });
    ATTRS.forEach(function (p) {
      document.querySelectorAll('[' + p[0] + ']').forEach(function (el) {
        var store = 'en' + p[1].replace('-', '');
        if (el.dataset[store] === undefined) el.dataset[store] = el.getAttribute(p[1]) || '';
        var k = el.getAttribute(p[0]);
        el.setAttribute(p[1], fr && FR[k] ? FR[k] : el.dataset[store]);
      });
    });
    // e-mail links with a French subject/message
    document.querySelectorAll('[data-href-fr]').forEach(function (a) {
      if (a.getAttribute('data-href-en') === null) a.setAttribute('data-href-en', a.getAttribute('href') || '');
      a.setAttribute('href', fr ? a.getAttribute('data-href-fr') : a.getAttribute('data-href-en'));
    });
    document.querySelectorAll('.lang').forEach(function (b) {
      b.setAttribute('aria-pressed', b.getAttribute('data-lang') === lang ? 'true' : 'false');
    });
  }

  document.querySelectorAll('.lang').forEach(function (b) {
    b.addEventListener('click', function () {
      var l = b.getAttribute('data-lang');
      save(l); apply(l);
    });
  });
  apply(initialLang());

  // Countdown to the next Open Day (date set in the data-open-day attribute of the #open section on buy.html).
  var sec = document.querySelector('[data-open-day]');
  if (sec) {
    var pad = function (n) { return String(n).padStart(2, '0'); };
    var set = function (name, v) { var el = sec.querySelector('[data-cd="' + name + '"]'); if (el) el.textContent = v; };
    var tick = function () {
      var target = Date.parse(sec.getAttribute('data-open-day'));
      if (isNaN(target)) return;
      var ms = Math.max(0, target - Date.now());
      set('days', Math.floor(ms / 86400000));
      set('hours', pad(Math.floor(ms / 3600000) % 24));
      set('minutes', pad(Math.floor(ms / 60000) % 60));
    };
    tick();
    setInterval(tick, 30000);
  }
})();
