/* Meublation – storage price calculator (Store page).
 *
 * Price = (small items x 2 EUR + large items x 4 EUR) per month, multiplied by the number of months.
 * Inputs : [data-calc-input="small|large|months"]
 * Results: [data-calc="total|monthly|monthsLabel"] (the texts are rebuilt in the current language).
 * To change the prices, edit SMALL and LARGE below (and the "per month each" texts of store.html).
 */
(function () {
  'use strict';
  var SMALL = 2, LARGE = 4;

  function lang() { return document.documentElement.lang === 'fr' ? 'fr' : 'en'; }

  function value(name) {
    var el = document.querySelector('[data-calc-input="' + name + '"]');
    var n = el ? parseInt(el.value, 10) : 0;
    return Math.max(0, Math.min(999, isNaN(n) ? 0 : n));
  }

  function euro(n) {
    return lang() === 'fr' ? n.toLocaleString('fr-FR') + ' €' : '€' + n.toLocaleString('en-GB');
  }

  function months(n) {
    return lang() === 'fr' ? n + ' mois' : n + (n === 1 ? ' month' : ' months');
  }

  function update() {
    var m = value('months');
    var monthly = value('small') * SMALL + value('large') * LARGE;
    var out = { total: euro(monthly * m), monthly: euro(monthly), monthsLabel: months(m) };
    // Re-read the elements each time: a language change rewrites the text around them.
    document.querySelectorAll('[data-calc]').forEach(function (el) {
      var k = el.getAttribute('data-calc');
      if (out[k] !== undefined) el.textContent = out[k];
    });
  }

  document.querySelectorAll('[data-calc-input]').forEach(function (el) {
    el.addEventListener('input', update);
    el.addEventListener('change', function () {
      var n = value(el.getAttribute('data-calc-input'));
      el.value = String(n); // show the corrected value (no negative number, 999 maximum)
      update();
    });
  });

  new MutationObserver(update).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
  update();
})();
