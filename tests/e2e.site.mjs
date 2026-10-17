// Lectoclasse scenario for tests/e2e.mjs (local: Apps Script mocked; live: real quote row, @example.com, purged).
export async function scenario({ page, go, noHScroll, posted, vp, LIVE, KEY, SITE, assert, shot }) {
  // 1. Free kit: 55 questions over 5 acts, answer key, oral sheet, PDFs served, print button.
  await go('echantillon/');
  await noHScroll('sample');
  const n = await page.evaluate(() => ['acte-1', 'acte-2', 'acte-3', 'acte-4', 'acte-5'].map((id) => document.querySelectorAll('#' + id + ' ol.q > li').length));
  assert.deepEqual(n, [12, 13, 10, 11, 9], 'questions per act');
  const keys = await page.evaluate(() => document.querySelectorAll('#corrige ol.key > li').length);
  assert.equal(keys, 55 + 5, 'one answer per question, plus the 5 reading checkpoints');
  const cps = await page.evaluate(() => ['acte-1', 'acte-2', 'acte-3', 'acte-4', 'acte-5'].map((id) => document.querySelectorAll('#' + id + ' .checkpoint').length));
  assert.deepEqual(cps, [1, 1, 1, 1, 1], 'one reading checkpoint per act');
  assert.ok(await page.isVisible('#oral blockquote.extract'));
  for (const f of ['lectoclasse-le-menteur-kit.pdf', 'le-menteur-texte-integral.pdf']) {
    const r = await page.request.get(new URL(f, page.url()).href);
    assert.equal(r.status(), 200, f);
    assert.equal((await r.body()).subarray(0, 5).toString(), '%PDF-', f);
  }
  assert.ok(await page.isVisible('button[data-print="sample_print"]'));
  await shot('sample');
  await go('echantillon/texte/');
  assert.ok((await page.textContent('main')).includes('Je t’apprendrai bientôt d’autres façons de vivre.'), 'full text present');

  // 2. Home: A/B price of the licence, wording rules, Vread pilot link.
  await go('?prix=p290');
  await noHScroll('home');
  assert.match(await page.textContent('#tarifs'), /290 €/);
  await go('?prix=p390');
  const home = await page.textContent('main');
  assert.match(await page.textContent('#tarifs'), /390 €/);
  assert.ok(home.includes('épreuve de français de juin 2027') && !/session 2027/i.test(home));
  assert.equal(await page.getAttribute('a[data-mesure="pilot_link_click"]', 'href'), 'https://www.vread.fr/ecoles');
  await shot('home');

  // 3. Collège: rallye sample (text + 10 questions + key + board + certificate).
  await go('college/');
  await noHScroll('college');
  assert.equal(await page.evaluate(() => document.querySelectorAll('#pp-checkpoints ol.q > li').length), 4, 'rally: 4 reading checkpoints');
  assert.equal(await page.evaluate(() => document.querySelectorAll('#pp-questions ol.q > li').length), 10);
  assert.equal(await page.evaluate(() => document.querySelectorAll('#pp-texte .para').length), 33);
  assert.ok(await page.isVisible('#pp-diplome .cert'));

  // 4. FLE variant page.
  await go('fle/');
  await noHScroll('fle');
  assert.ok((await page.textContent('main')).includes('290 €'));

  // 5. Quote form -> own Apps Script (no payment, no e-mail).
  await go('devis/?offre=kits');
  await noHScroll('devis');
  assert.ok(await page.isVisible('#kits-field'));
  await page.fill('#school', `Lycée E2E ${vp.width}`);
  await page.selectOption('#country', 'MA');
  await page.fill('#email', `e2e-${vp.width}@example.com`);
  await page.selectOption('#role', 'lettres');
  await page.check('input[name=kits][value="pot-bouille"]');
  await page.check('input[name=kits][value="cahier-de-douai"]');
  await page.selectOption('#pupils', '300-799');
  await page.check('input[name=consent]');
  await page.click('#devis button[type=submit]');
  await page.waitForSelector('#devis-msg.ok', { timeout: 30000 });
  if (!LIVE) {
    const p = posted.filter((x) => x.action === 'devis').at(-1);
    assert.equal(p.offer, 'kits');
    assert.deepEqual(p.kits, ['pot-bouille', 'cahier-de-douai']);
    assert.equal(p.country, 'MA');
    assert.ok(['p390', 'p290'].includes(p.variant));
  } else if (KEY) {
    const r = await fetch(SITE.api, { method: 'POST', body: JSON.stringify({ action: 'summary', key: KEY, email: `e2e-${vp.width}@example.com` }) }).then((x) => x.json());
    assert.equal(r.hasEmail, true, 'quote row in the Sheet');
  }
  await page.selectOption('#country', 'ES');
  assert.ok(await page.isVisible('#eu-note'), 'EU note shown');
  await shot('devis');

  // 5b. Kit pages: hub + one paid kit page; the CTA preselects the kit on the order page.
  await go('kits/');
  await noHScroll('kits');
  assert.equal(await page.evaluate(() => document.querySelectorAll('main table tbody tr').length), 8, '8 kits listed');
  await go('kits/therese-raquin/');
  await noHScroll('kit-therese-raquin');
  assert.equal(await page.getAttribute('a[href^="https://outils.vread.fr/lectoguide/"]', 'href'), 'https://outils.vread.fr/lectoguide/therese-raquin/');
  assert.ok(!/session 2027/i.test(await page.textContent('main')));
  await shot('kit-therese-raquin');
  const cta = await page.getAttribute('main a.btn', 'href');
  assert.match(cta, /commander\/\?offre=kit&oeuvre=therese-raquin$/);
  await go('commander/?offre=kit&oeuvre=therese-raquin');
  assert.equal(await page.inputValue('#kit'), 'therese-raquin', 'kit preselected');
  assert.ok(await page.isChecked('input[name=offer][value=kit]'), 'kit offer checked');
  await go('kits/le-menteur/');
  await noHScroll('kit-le-menteur');
  assert.match(await page.getAttribute('main a.btn', 'href'), /echantillon\/$/);

  // 6. Card order: CGV required, then the octave-global-checkout module mounts the chosen product; an EU buyer is refused.
  await go('commander/?prix=p390&oeuvre=on-ne-badine');
  await noHScroll('order');
  await page.click('#pay-open');
  assert.ok(await page.isVisible('#order-msg'), 'CGV box required');
  await page.check('#cgv');
  await page.click('#pay-open');
  await page.waitForSelector('#ogc-country', { timeout: 30000 });
  const btnText = await page.textContent('#buy');
  assert.match(btnText, /39,00\s?€/, 'kit price in the module');
  await page.fill('#ogc-email', 'e2e@example.com');
  await page.fill('#ogc-name', 'E2E');
  await page.selectOption('#ogc-country', 'FR');
  const euMsg = await page.evaluate(() => document.querySelector('#ogc-country').validationMessage);
  assert.match(euMsg, /réservé aux acheteurs situés hors de l’Union européenne/, 'EU buyer refused in the browser');
  await page.selectOption('#ogc-country', 'MA');
  assert.equal(await page.evaluate(() => document.querySelector('#ogc-country').validationMessage), '', 'non-EU buyer accepted');
  await shot('order-eu-refused');
}
