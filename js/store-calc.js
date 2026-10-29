/* Meublation – storage price calculator (Store page).
 *
 * Price = (small items x 2 EUR + large items x 4 EUR) per month, multiplied by the number of months.
 * Box rental (optional): 0.50 EUR per box per month, capped at 5 EUR per box (so 10 months maximum are charged).
 * Inputs : [data-calc-input="small|large|months"]
 * Boxes: buttons [data-box="dec|inc"], counter [data-calc="boxes"], line [data-box-line] (shown when boxes > 0)
 * Results: [data-calc="total|monthly|monthsLabel|boxCost"] (the texts are rebuilt in the current language).
 * To change the prices, edit SMALL and LARGE below (and the "per month each" texts of store.html).
 */
(function () {
  'use strict';
  var SMALL = 2, LARGE = 4, CRATE = 0.5, CRATE_MAX_MONTHS = 10;
  var boxes = 0;

  function lang() { return document.documentElement.lang === 'fr' ? 'fr' : 'en'; }

  function value(name) {
    var el = document.querySelector('[data-calc-input="' + name + '"]');
    var n = el ? parseInt(el.value, 10) : 0;
    return Math.max(0, Math.min(999, isNaN(n) ? 0 : n));
  }

  function euro(n) {
    var o = n % 1 === 0 ? {} : { minimumFractionDigits: 2, maximumFractionDigits: 2 };
    return lang() === 'fr' ? n.toLocaleString('fr-FR', o) + ' €' : '€' + n.toLocaleString('en-GB', o);
  }

  function months(n) {
    return lang() === 'fr' ? n + ' mois' : n + (n === 1 ? ' month' : ' months');
  }

  function update() {
    var m = value('months');
    var monthly = value('small') * SMALL + value('large') * LARGE;
    var boxCost = boxes * CRATE * Math.min(m, CRATE_MAX_MONTHS);
    var out = { total: euro(monthly * m + boxCost), monthly: euro(monthly), monthsLabel: months(m),
                boxCost: euro(boxCost), boxes: String(boxes) };
    document.querySelectorAll('[data-box-line]').forEach(function (el) { el.style.display = boxes > 0 ? 'block' : 'none'; });
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

  document.querySelectorAll('[data-box]').forEach(function (b) {
    b.addEventListener('click', function () {
      boxes = Math.max(0, Math.min(99, boxes + (b.getAttribute('data-box') === 'inc' ? 1 : -1)));
      update();
    });
  });

  new MutationObserver(update).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
  update();
})();
