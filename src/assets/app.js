/* Lectoclasse: print buttons, quote form (own Apps Script), card order (octave-global-checkout). No cookie, no identifier. */
(function () {
  'use strict';
  var S = window.SITE || {};
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
  var track = function (ev, det) { try { window.mTrack && window.mTrack(ev, det); } catch (e) { /* */ } };
  var goal = function (g) { try { window.octaveCro && window.octaveCro.goal(g); } catch (e) { /* */ } };
  var variant = function () { return (window.octaveCro && window.octaveCro.v(S.xp)) || 'p390'; };
  var q = new URLSearchParams(location.search);
  var EU = ['AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE', 'MC'];
  var CODES = ('AD AE AF AG AL AM AO AR AU AZ BA BB BD BF BH BI BJ BN BO BR BS BT BW BY BZ CA CD CF CG CH CI CL CM CN CO CR CU CV ' +
    'DJ DM DO DZ EC EG ER ET FJ FM GA GB GD GE GH GM GN GQ GT GW GY HK HN HT ID IL IN IQ IR IS JM JO JP KE KG KH KM KN KR KW KZ ' +
    'LA LB LC LI LK LR LS LY MA MD ME MG MK ML MM MN MO MR MU MV MW MX MY MZ NA NC NE NG NI NO NP NZ OM PA PE PF PG PH PK PS PY ' +
    'QA RS RU RW SA SB SC SD SG SL SM SN SO SR SS ST SV SY SZ TD TG TH TJ TL TM TN TO TR TT TW TZ UA UG US UY UZ VA VC VE VN VU WS YE ZA ZM ZW').split(' ').concat(EU);

  // Print buttons (kit, text, rallye): count, then open the print dialog.
  $$('[data-print]').forEach(function (b) {
    b.addEventListener('click', function () { track(b.getAttribute('data-print')); goal('download'); goal('sample'); window.print(); });
  });
  // Downloads counted as a goal (mesure.js already counts the click event itself).
  $$('a[data-mesure$="download"]').forEach(function (a) { a.addEventListener('click', function () { goal('download'); }); });
  // POOLED-READING-01 secondary metric: any opening or download of the free kit (pages, PDFs, preview images).
  $$('a[data-mesure^="sample_"], a[data-mesure="text_download"], a[data-sample]').forEach(function (a) { a.addEventListener('click', function () { goal('sample'); }); });

  function fillCountries(sel) {
    var dn = null;
    try { dn = new Intl.DisplayNames(['fr'], { type: 'region' }); } catch (e) { /* old browser */ }
    CODES.map(function (c) { return [c, dn ? dn.of(c) : c]; })
      .sort(function (a, b) { return a[1].localeCompare(b[1], 'fr'); })
      .forEach(function (p) { var o = document.createElement('option'); o.value = p[0]; o.textContent = p[1]; sel.appendChild(o); });
  }

  /* ---------- quote form ---------- */
  var df = $('#devis');
  if (df) {
    fillCountries(df.country);
    var offre = q.get('offre');
    if (offre) { var r = $('input[name=offer][value="' + offre + '"]', df); if (r) r.checked = true; }
    var syncKits = function () { $('#kits-field').classList.toggle('hidden', df.offer.value !== 'kits'); };
    $$('input[name=offer]', df).forEach(function (r) { r.addEventListener('change', syncKits); });
    syncKits();
    df.country.addEventListener('change', function () { $('#eu-note').classList.toggle('hidden', EU.indexOf(df.country.value) < 0); });
    var msg = $('#devis-msg');
    df.addEventListener('submit', function (e) {
      e.preventDefault();
      var kits = $$('input[name=kits]:checked', df).map(function (c) { return c.value; });
      var email = df.email.value.trim();
      var err = df.school.value.trim().length < 3 ? 'Indiquez le nom de l’établissement.'
        : !df.country.value ? 'Choisissez le pays.'
        : !/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(email) ? 'Vérifiez l’adresse e-mail.'
        : df.offer.value === 'kits' && !kits.length ? 'Cochez au moins une œuvre.'
        : !df.consent.checked ? 'Cochez la case de consentement pour que nous puissions vous répondre.' : '';
      if (err) { msg.className = 'msg err'; msg.textContent = err; return; }
      track('devis_submit', df.offer.value);
      var btn = $('button[type=submit]', df); btn.disabled = true;
      msg.className = 'small'; msg.textContent = 'Envoi…';
      var body = { action: 'devis', school: df.school.value, country: df.country.value, email: email, role: df.role.value, offer: df.offer.value, kits: kits,
        pupils: df.pupils.value, currency: df.currency.value, payment: df.payment.value, message: df.message.value, hp: df.website.value,
        variant: variant(), consent: true, consent_version: S.consent, page: location.pathname,
        ref_domain: (document.referrer.split('/')[2] || ''), utm_source: q.get('utm_source') || '' };
      fetch(S.api, { method: 'POST', body: JSON.stringify(body), credentials: 'omit' })
        .then(function (r) { return r.json(); })
        .then(function (r) {
          if (!r.ok) throw new Error(r.error || 'error');
          goal('devis');
          msg.className = 'msg ok';
          msg.textContent = r.zone === 'eu'
            ? 'Demande enregistrée. Nous ne servons pas encore les établissements de l’Union européenne : nous vous écrirons si cela change.'
            : 'Demande enregistrée. Nous vous répondons par e-mail sous deux jours ouvrés, depuis octave@vread.fr.';
          df.reset(); syncKits(); btn.disabled = false;
        })
        .catch(function () {
          btn.disabled = false;
          msg.className = 'msg err';
          msg.innerHTML = 'La demande n’est pas partie. Réessayez dans une minute, ou écrivez à <a href="mailto:' + S.mail + '?subject=Devis%20Lectoclasse">' + S.mail + '</a>.';
        });
    });
  }

  /* ---------- card order (octave-global-checkout, EUR, non-EU buyers only) ---------- */
  var of = $('#order');
  if (of) {
    var P = S.products || {};
    var pick = function () {
      var o = of.offer.value;
      if (o === 'etablissement') { var a = P.etablissement[variant()] || P.etablissement.p390; return { id: a[0], amount: a[1] }; }
      if (o === 'college') return { id: P.college[0], amount: P.college[1] };
      var k = P.kits[of.kit.value]; return { id: k[0], amount: k[1] };
    };
    var hash = location.hash.replace('#', ''), off = q.get('offre') || (hash === 'college' ? 'college' : '');
    if (off) { var rr = $('input[name=offer][value="' + off + '"]', of); if (rr) rr.checked = true; }
    if (q.get('oeuvre') && P.kits[q.get('oeuvre')]) { of.kit.value = q.get('oeuvre'); $('input[name=offer][value=kit]', of).checked = true; }
    var syncKit = function () { $('#kit-field').classList.toggle('hidden', of.offer.value !== 'kit'); };
    $$('input[name=offer]', of).forEach(function (r) { r.addEventListener('change', syncKit); });
    syncKit();
    var om = $('#order-msg');
    of.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!of.cgv.checked) { om.textContent = 'Cochez la case des conditions de vente pour continuer.'; om.classList.remove('hidden'); return; }
      om.classList.add('hidden');
      var p = pick(), btn = $('#pay-open');
      btn.disabled = true;
      track('checkout_open', p.id.replace(/^lectoclasse-/, '').slice(0, 24));
      goal('checkout');
      var s = document.createElement('script');
      s.src = S.ogc;
      s.onload = function () {
        $$('input,select', of).forEach(function (x) { x.disabled = true; });
        btn.classList.add('hidden');
        var change = document.createElement('a');
        change.href = location.pathname; change.textContent = 'Changer d’offre'; change.className = 'small';
        btn.parentNode.appendChild(change);
        window.OctaveCheckout.mount('#buy', {
          product: p.id, amount: p.amount, currency: 'eur', venture: S.venture, lang: 'fr',
          appearance: { variables: { colorPrimary: '#8e2f1c', borderRadius: '8px' } },
          onSuccess: function () { goal('paid'); track('paid', p.id.replace(/^lectoclasse-/, '').slice(0, 24)); },
        });
      };
      s.onerror = function () { btn.disabled = false; om.textContent = 'Le module de paiement ne s’est pas chargé. Vérifiez la connexion et réessayez.'; om.classList.remove('hidden'); };
      document.head.appendChild(s);
    });
  }
})();
