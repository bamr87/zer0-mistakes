// Feature: ZER0-083
/**
 * Recipe scaling and unit conversion.
 *
 * Rewrites every [data-recipe-qty] and [data-recipe-temp] inside a
 * [data-recipe] root when the reader changes the yield or the unit system.
 * The server-rendered markup is already the correct recipe as written, so this
 * file is pure progressive enhancement — it reveals the controls
 * (.recipe-scaler is `hidden` until then) and never runs without them.
 *
 * Contract with the Liquid components (_includes/components/recipe-*.html):
 *   [data-recipe]            root; data-recipe-id keys the saved scale
 *   [data-recipe-scaler]     control bar; data-base-yield, data-yield-unit
 *   [data-recipe-qty]        data-qty, data-qty-max, data-unit,
 *                            data-grams-per-cup, data-weigh, data-scale
 *   [data-recipe-temp]       data-temp-f, data-temp-c
 *   [data-recipe-name]       data-singular, data-plural (countables only)
 *
 * The unit table below mirrors _includes/components/recipe-grams.html — change
 * the two together.
 */
(function () {
  'use strict';

  var UNITS_KEY = 'zer0-recipe-units';
  var SCALE_KEY_PREFIX = 'zer0-recipe-scale:';
  var ML_PER_CUP = 236.588;

  // Canonical unit table. `dim` is the dimension; `base` is the size of one
  // unit in grams (mass) or millilitres (volume).
  var UNITS = {
    g: { dim: 'mass', base: 1, label: 'g' },
    kg: { dim: 'mass', base: 1000, label: 'kg' },
    mg: { dim: 'mass', base: 0.001, label: 'mg' },
    oz: { dim: 'mass', base: 28.3495, label: 'oz' },
    lb: { dim: 'mass', base: 453.592, label: 'lb' },
    ml: { dim: 'volume', base: 1, label: 'ml' },
    dl: { dim: 'volume', base: 100, label: 'dl' },
    l: { dim: 'volume', base: 1000, label: 'l' },
    tsp: { dim: 'volume', base: 4.92892, label: 'tsp' },
    tbsp: { dim: 'volume', base: 14.7868, label: 'tbsp' },
    cup: { dim: 'volume', base: ML_PER_CUP, label: 'cups' },
    floz: { dim: 'volume', base: 29.5735, label: 'fl oz' },
    pint: { dim: 'volume', base: 473.176, label: 'pints' },
    quart: { dim: 'volume', base: 946.353, label: 'quarts' },
    gallon: { dim: 'volume', base: 3785.41, label: 'gallons' }
  };

  // Everything an author might type, mapped to a canonical key above.
  var ALIASES = {
    g: 'g', gr: 'g', gram: 'g', grams: 'g', gramme: 'g', grammes: 'g',
    kg: 'kg', kilo: 'kg', kilos: 'kg', kilogram: 'kg', kilograms: 'kg',
    mg: 'mg', milligram: 'mg', milligrams: 'mg',
    oz: 'oz', ounce: 'oz', ounces: 'oz',
    lb: 'lb', lbs: 'lb', pound: 'lb', pounds: 'lb',
    ml: 'ml', cc: 'ml', milliliter: 'ml', milliliters: 'ml',
    millilitre: 'ml', millilitres: 'ml',
    dl: 'dl', deciliter: 'dl', deciliters: 'dl',
    l: 'l', liter: 'l', liters: 'l', litre: 'l', litres: 'l',
    tsp: 'tsp', teaspoon: 'tsp', teaspoons: 'tsp',
    tbsp: 'tbsp', tbs: 'tbsp', tablespoon: 'tbsp', tablespoons: 'tbsp',
    cup: 'cup', cups: 'cup',
    floz: 'floz', 'fl oz': 'floz', 'fluid ounce': 'floz', 'fluid ounces': 'floz',
    pt: 'pint', pint: 'pint', pints: 'pint',
    qt: 'quart', quart: 'quart', quarts: 'quart',
    gal: 'gallon', gallon: 'gallon', gallons: 'gallon'
  };

  // Ladders used to pick a readable unit after converting. Ordered small→large.
  var LADDERS = {
    'metric:mass': ['g', 'kg'],
    'metric:volume': ['ml', 'l'],
    'us:mass': ['oz', 'lb'],
    'us:volume': ['tsp', 'tbsp', 'cup', 'quart', 'gallon']
  };

  var VULGAR = {
    0.125: '⅛', 0.25: '¼', 0.333: '⅓', 0.375: '⅜',
    0.5: '½', 0.625: '⅝', 0.667: '⅔', 0.75: '¾',
    0.875: '⅞'
  };
  // Denominators US amounts are rounded to, largest quantity first. A whole
  // cup is measured in quarters; anything under one, in eighths. Finer than
  // that is precision no measuring spoon can deliver.
  var US_STEPS = [
    { min: 1, step: 0.25 },
    { min: 0, step: 0.125 }
  ];
  // Units that read as fractions on a measuring cup or spoon rather than as
  // decimals on a scale.
  var FRACTIONAL_UNITS = ['tsp', 'tbsp', 'cup', 'floz', 'pint', 'quart', 'gallon', 'oz', 'lb'];

  /* ------------------------------------------------------------------ *
   * Unit helpers
   * ------------------------------------------------------------------ */

  function canonicalUnit(raw) {
    if (!raw) return null;
    var key = String(raw).toLowerCase().trim()
      .replace(/\./g, '')
      .replace(/-/g, ' ')
      .replace(/\s+/g, ' ');
    if (ALIASES[key]) return ALIASES[key];
    if (ALIASES[key.replace(/\s/g, '')]) return ALIASES[key.replace(/\s/g, '')];
    return null;
  }

  /** Pick the friendliest unit on a ladder for a magnitude in base units. */
  function pickUnit(ladder, baseAmount) {
    var chosen = ladder[0];
    for (var i = 0; i < ladder.length; i++) {
      var unit = UNITS[ladder[i]];
      var value = baseAmount / unit.base;
      // Step up while the amount would still read as at least one whole unit,
      // so 1500 g becomes 1.5 kg but 900 g stays 900 g.
      if (value >= 1) chosen = ladder[i];
    }
    return chosen;
  }

  /* ------------------------------------------------------------------ *
   * Number formatting
   * ------------------------------------------------------------------ */

  function roundTo(value, step) {
    return Math.round(value / step) * step;
  }

  /** "1½", "¾", "2" — US amounts read as fractions, never as 0.75. */
  function formatFraction(value) {
    var step = 0.0625;
    for (var i = 0; i < US_STEPS.length; i++) {
      if (value >= US_STEPS[i].min) { step = US_STEPS[i].step; break; }
    }
    var rounded = roundTo(value, step);
    // Too small to round to even an eighth — show the decimal rather than "0".
    if (rounded === 0) return trimNumber(value, 2);
    var whole = Math.floor(rounded + 1e-9);
    var frac = rounded - whole;
    var key = Math.round(frac * 1000) / 1000;
    if (key < 1e-6) return String(whole);
    var glyph = VULGAR[key];
    if (glyph) return (whole > 0 ? whole : '') + glyph;
    return trimNumber(rounded, 2);
  }

  /** Metric amounts: precise when small, round when large. */
  function formatMetric(value) {
    if (value >= 100) return String(Math.round(value));
    if (value >= 10) return trimNumber(Math.round(value * 2) / 2, 1);
    if (value >= 1) return trimNumber(Math.round(value * 10) / 10, 1);
    return trimNumber(Math.round(value * 100) / 100, 2);
  }

  /** Countable things ("3 eggs"): whole numbers, halves when small. */
  function formatCount(value) {
    if (value >= 10) return String(Math.round(value));
    return formatFraction(value);
  }

  function trimNumber(value, decimals) {
    var text = value.toFixed(decimals);
    if (text.indexOf('.') !== -1) {
      text = text.replace(/0+$/, '').replace(/\.$/, '');
    }
    return text;
  }

  var COUNTED_UNITS = { cup: 'cup', pint: 'pint', quart: 'quart', gallon: 'gallon' };

  /**
   * Recipe usage, not strict grammar: anything up to and including one takes
   * the singular — "¾ cup", "1 cup", "1½ cups".
   */
  function pluralize(unitKey, value) {
    var singular = COUNTED_UNITS[unitKey];
    if (!singular) return UNITS[unitKey].label;
    return value <= 1 + 1e-9 ? singular : singular + 's';
  }

  /* ------------------------------------------------------------------ *
   * Quantity conversion
   * ------------------------------------------------------------------ */

  /**
   * Convert one amount into the requested system.
   * Returns { value, unit } where `unit` is display text (may be the
   * author's original string when nothing convertible was found).
   */
  function convert(amount, rawUnit, system, density, allowWeigh) {
    var key = canonicalUnit(rawUnit);

    // "As written" still scales — it keeps the author's own unit words, but
    // a scaled amount gets the matching singular/plural so halving "2 cups"
    // reads "1 cup" rather than "1 cups".
    if (!key || system === 'original') {
      var label = rawUnit || '';
      if (key && COUNTED_UNITS[key]) label = pluralize(key, amount);
      return { value: amount, unit: label, key: null, sourceKey: key, keepLabel: true };
    }

    var unit = UNITS[key];
    var target = system === 'metric' ? 'metric' : 'us';

    // Volume ↔ weight, but only when we know how heavy a cup of it is.
    var dim = unit.dim;
    var baseAmount = amount * unit.base; // grams or millilitres

    if (density && allowWeigh) {
      if (target === 'metric' && dim === 'volume') {
        baseAmount = (baseAmount / ML_PER_CUP) * density; // ml → g
        dim = 'mass';
      } else if (target === 'us' && dim === 'mass') {
        baseAmount = (baseAmount / density) * ML_PER_CUP; // g → ml
        dim = 'volume';
      }
    }

    var ladder = LADDERS[target + ':' + dim];
    if (!ladder) {
      return { value: amount, unit: rawUnit || '', key: null, sourceKey: key, keepLabel: true };
    }


    var chosen = pickUnit(ladder, baseAmount);
    var value = baseAmount / UNITS[chosen].base;
    return { value: value, unit: pluralize(chosen, value), key: chosen };
  }

  /** Format a converted amount, choosing the notation its unit is measured in. */
  function renderAmount(result) {
    var unitKey = result.key || result.sourceKey;
    var text;
    if (!unitKey) {
      text = formatCount(result.value);            // "3 eggs", "1½ lemons"
    } else if (FRACTIONAL_UNITS.indexOf(unitKey) !== -1) {
      text = formatFraction(result.value);         // "1¾ cups"
    } else {
      text = formatMetric(result.value);           // "375 g", "1.5 l"
    }
    return result.unit ? text + ' ' + result.unit : text;
  }

  /* ------------------------------------------------------------------ *
   * DOM updates
   * ------------------------------------------------------------------ */

  function updateQuantity(el, factor, system) {
    var base = parseFloat(el.getAttribute('data-qty'));
    if (isNaN(base)) return;

    var scales = el.getAttribute('data-scale') !== 'false';
    var allowWeigh = el.getAttribute('data-weigh') !== 'false';
    var rawUnit = el.getAttribute('data-unit') || '';
    var density = parseFloat(el.getAttribute('data-grams-per-cup'));
    if (isNaN(density)) density = null;

    var multiplier = scales ? factor : 1;
    var parts = [renderAmount(convert(base * multiplier, rawUnit, system, density, allowWeigh))];

    var max = parseFloat(el.getAttribute('data-qty-max'));
    if (!isNaN(max) && max > base) {
      var hi = renderAmount(convert(max * multiplier, rawUnit, system, density, allowWeigh));
      // "2–3 cups", not "2 cups–3 cups".
      var lo = parts[0];
      var loParts = lo.split(' ');
      var hiParts = hi.split(' ');
      if (loParts.length > 1 && loParts.slice(1).join(' ') === hiParts.slice(1).join(' ')) {
        parts = [loParts[0] + '–' + hi];
      } else {
        parts = [lo + '–' + hi];
      }
    }

    var text = parts[0];
    if (el.textContent !== text) el.textContent = text;

    // Keep what the recipe actually said one hover away.
    var original = el.getAttribute('data-original-text');
    if (original && original !== text) {
      el.title = 'As written: ' + original;
    } else {
      el.removeAttribute('title');
    }
  }

  /**
   * "2 large eggs" halved is "1 large egg", not "1 large eggs". Only applies to
   * countable ingredients — where there is a unit, the unit carries the number
   * and the ingredient name never changes.
   */
  function updateName(qtyEl, factor) {
    var item = qtyEl.closest('.recipe-ingredient');
    if (!item) return;
    var name = item.querySelector('[data-recipe-name]');
    if (!name) return;
    if (qtyEl.getAttribute('data-unit')) return;

    var base = parseFloat(qtyEl.getAttribute('data-qty'));
    if (isNaN(base)) return;
    var scales = qtyEl.getAttribute('data-scale') !== 'false';
    var amount = base * (scales ? factor : 1);
    // Same rule as the units: one or less takes the singular, so half an egg
    // is "½ egg yolk" rather than "½ egg yolks".
    var singular = amount <= 1 + 1e-9;
    var text = singular ? name.getAttribute('data-singular') : name.getAttribute('data-plural');
    if (text && name.textContent !== text) name.textContent = text;
  }

  function updateTemperature(el, system) {
    var f = parseFloat(el.getAttribute('data-temp-f'));
    var c = parseFloat(el.getAttribute('data-temp-c'));
    if (isNaN(f) && isNaN(c)) return;
    var label = el.getAttribute('data-temp-label') || '';
    var text;
    if (system === 'metric') {
      text = c + ' °C';
    } else if (system === 'us') {
      text = f + ' °F';
    } else {
      text = f + ' °F (' + c + ' °C)';
    }
    el.textContent = label ? label + ' ' + text : text;
  }

  /* ------------------------------------------------------------------ *
   * Storage (never fatal — private windows throw on access)
   * ------------------------------------------------------------------ */

  function readStore(key) {
    try { return window.localStorage.getItem(key); } catch (e) { return null; }
  }

  function writeStore(key, value) {
    try { window.localStorage.setItem(key, value); } catch (e) { /* ignore */ }
  }

  /* ------------------------------------------------------------------ *
   * Controller
   * ------------------------------------------------------------------ */

  function setupRecipe(scaler) {
    var scope = scaler.closest('[data-recipe]') || document;
    var baseYield = parseFloat(scaler.getAttribute('data-base-yield'));
    if (isNaN(baseYield) || baseYield <= 0) baseYield = 1;

    var yieldUnit = scaler.getAttribute('data-yield-unit') || 'servings';
    var recipeId = scaler.getAttribute('data-recipe-id') || 'recipe';
    var scaleKey = SCALE_KEY_PREFIX + recipeId;

    var input = scaler.querySelector('[data-recipe-yield-input]');
    var status = scaler.querySelector('[data-recipe-status]');
    var quantities = scope.querySelectorAll('[data-recipe-qty]');
    var temperatures = scope.querySelectorAll('[data-recipe-temp]');

    // Remember what the page shipped with so "As written" is exactly that.
    var i;
    for (i = 0; i < quantities.length; i++) {
      quantities[i].setAttribute('data-original-text', quantities[i].textContent.trim());
    }
    for (i = 0; i < temperatures.length; i++) {
      temperatures[i].setAttribute('data-original-text', temperatures[i].textContent.trim());
    }

    var state = {
      target: baseYield,
      system: readStore(UNITS_KEY) || 'original'
    };
    if (['original', 'metric', 'us'].indexOf(state.system) === -1) state.system = 'original';

    var saved = parseFloat(readStore(scaleKey));
    if (!isNaN(saved) && saved > 0) state.target = saved;

    // ?scale=2 or ?servings=24 wins over the remembered value — that is what a
    // shared link is for.
    var params = new URLSearchParams(window.location.search);
    var fromUrl = parseFloat(params.get('servings'));
    var scaleParam = parseFloat(params.get('scale'));
    if (!isNaN(fromUrl) && fromUrl > 0) state.target = fromUrl;
    else if (!isNaN(scaleParam) && scaleParam > 0) state.target = baseYield * scaleParam;

    function factor() {
      return state.target / baseYield;
    }

    function render(announce) {
      var f = factor();
      var j;
      for (j = 0; j < quantities.length; j++) {
        // Nothing to recompute when the reader is looking at the authored
        // units AND this amount is not moving — either because the scale is
        // 1x, or because the amount is pinned (data-scale="false", e.g. the
        // ratio table's per-unit weight). Re-formatting it anyway would nudge
        // the authored 81.9 g to 82 g for no reason.
        var pinned = quantities[j].getAttribute('data-scale') === 'false';
        var still = Math.abs(f - 1) < 1e-9 || pinned;
        if (state.system === 'original' && still) {
          quantities[j].textContent = quantities[j].getAttribute('data-original-text');
          quantities[j].removeAttribute('title');
        } else {
          updateQuantity(quantities[j], f, state.system);
        }
        updateName(quantities[j], f);
      }
      for (j = 0; j < temperatures.length; j++) {
        updateTemperature(temperatures[j], state.system);
      }

      if (input) input.value = trimNumber(state.target, 2);

      var multiplierButtons = scaler.querySelectorAll('[data-recipe-multiplier]');
      for (j = 0; j < multiplierButtons.length; j++) {
        var m = parseFloat(multiplierButtons[j].getAttribute('data-recipe-multiplier'));
        var active = Math.abs(f - m) < 1e-6;
        multiplierButtons[j].classList.toggle('active', active);
        multiplierButtons[j].setAttribute('aria-pressed', active ? 'true' : 'false');
      }

      var unitButtons = scaler.querySelectorAll('[data-recipe-units]');
      for (j = 0; j < unitButtons.length; j++) {
        var on = unitButtons[j].getAttribute('data-recipe-units') === state.system;
        unitButtons[j].classList.toggle('active', on);
        unitButtons[j].setAttribute('aria-pressed', on ? 'true' : 'false');
      }

      scaler.setAttribute('data-current-system', state.system);
      if (scope !== document) scope.setAttribute('data-scaled', Math.abs(f - 1) < 1e-9 ? 'false' : 'true');

      if (announce && status) {
        status.textContent = 'Scaled to ' + trimNumber(state.target, 2) + ' ' + yieldUnit +
          ', shown in ' + (state.system === 'original' ? 'the original units' :
            state.system === 'metric' ? 'metric units' : 'US units') + '.';
      }
    }

    function setYield(value, announce) {
      if (isNaN(value) || value <= 0) return;
      state.target = Math.round(value * 100) / 100;
      writeStore(scaleKey, String(state.target));
      render(announce);
    }

    scaler.addEventListener('click', function (event) {
      var button = event.target.closest('button');
      if (!button || !scaler.contains(button)) return;

      if (button.hasAttribute('data-recipe-step')) {
        var direction = parseFloat(button.getAttribute('data-recipe-step'));
        var stepSize = state.target <= 2 ? 0.5 : 1;
        setYield(state.target + direction * stepSize, true);
      } else if (button.hasAttribute('data-recipe-multiplier')) {
        setYield(baseYield * parseFloat(button.getAttribute('data-recipe-multiplier')), true);
      } else if (button.hasAttribute('data-recipe-units')) {
        state.system = button.getAttribute('data-recipe-units');
        writeStore(UNITS_KEY, state.system);
        render(true);
      } else if (button.hasAttribute('data-recipe-reset')) {
        state.system = 'original';
        writeStore(UNITS_KEY, state.system);
        setYield(baseYield, true);
      }
    });

    if (input) {
      input.addEventListener('change', function () {
        setYield(parseFloat(input.value), true);
      });
    }

    scaler.hidden = false;
    scaler.classList.add('recipe-scaler--ready');
    render(false);
  }

  /** Cross off an ingredient as you use it. */
  function setupChecklist(root) {
    root.addEventListener('change', function (event) {
      var box = event.target;
      if (!box.hasAttribute || !box.hasAttribute('data-recipe-check')) return;
      var item = box.closest('.recipe-ingredient');
      if (item) item.classList.toggle('recipe-ingredient--done', box.checked);
    });
  }

  function init() {
    var scalers = document.querySelectorAll('[data-recipe-scaler]');
    for (var i = 0; i < scalers.length; i++) {
      setupRecipe(scalers[i]);
    }
    var roots = document.querySelectorAll('[data-recipe]');
    for (var j = 0; j < roots.length; j++) {
      setupChecklist(roots[j]);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
