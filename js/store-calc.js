/* Meublation – storage price calculator (Store page).
 *
 * Price = (small items x 2 EUR + large items x 4 EUR) per month, multiplied by the number of months.
 * Crate rental (optional): 1 EUR per crate per month, capped at 10 EUR per crate (so 10 months maximum are charged).
 * Inputs : [data-calc-input="small|large|months"]
 * Crates: buttons [data-crate="dec|inc"], counter [data-calc="crates"], line [data-crate-line] (shown when crates > 0)
 * Results: [data-calc="total|monthly|monthsLabel|crateCost"] (the texts are rebuilt in the current language).
 * To change the prices, edit SMALL and LARGE below (and the "per month each" texts of store.html).
 */
(function () {
  'use strict';
  var SMALL = 2, LARGE = 4, CRATE = 1, CRATE_MAX_MONTHS = 10;
  var crates = 0;

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
    var crateCost = crates * CRATE * Math.min(m, CRATE_MAX_MONTHS);
    var out = { total: euro(monthly * m + crateCost), monthly: euro(monthly), monthsLabel: months(m),
                crateCost: euro(crateCost), crates: String(crates) };
    document.querySelectorAll('[data-crate-line]').forEach(function (el) { el.style.display = crates > 0 ? 'block' : 'none'; });
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

  document.querySelectorAll('[data-crate]').forEach(function (b) {
    b.addEventListener('click', function () {
      crates = Math.max(0, Math.min(99, crates + (b.getAttribute('data-crate') === 'inc' ? 1 : -1)));
      update();
    });
  });

  new MutationObserver(update).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
  update();
})();
