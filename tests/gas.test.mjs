// Unit tests of the fake-door Apps Script (gas/src) under a minimal Apps Script mock. node tests/gas.test.mjs
import fs from 'node:fs';
import vm from 'node:vm';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';

const ROOT = new URL('../gas/src/', import.meta.url);

function load() {
  function Sheet(name) { this.name = name; this.rows = []; }
  Sheet.prototype = {
    getLastRow() { return this.rows.length; },
    getLastColumn() { return this.rows.reduce((m, r) => Math.max(m, r.length), 0); },
    appendRow(r) { this.rows.push(r.slice()); },
    deleteRow(n) { this.rows.splice(n - 1, 1); },
    getRange(r, c, nr = 1, nc = 1) {
      const sh = this;
      return {
        setValues(v) { v.forEach((row, i) => row.forEach((x, j) => { (sh.rows[r - 1 + i] ||= [])[c - 1 + j] = x; })); return this; },
        getValues() { const o = []; for (let i = 0; i < nr; i++) { const row = []; for (let j = 0; j < nc; j++) row.push((sh.rows[r - 1 + i] || [])[c - 1 + j] ?? ''); o.push(row); } return o; },
        getValue() { return (sh.rows[r - 1] || [])[c - 1] ?? ''; },
        setValue(x) { (sh.rows[r - 1] ||= [])[c - 1] = x; return this; },
        setFontWeight() { return this; },
        setNumberFormat() { return this; },
        setNumberFormats() { return this; },
      };
    },
    setFrozenRows() {},
  };
  const sheets = {};
  const ss = { getId: () => 'sheet-id', getUrl: () => 'https://docs.google.com/spreadsheets/d/sheet-id', getSheets: () => Object.values(sheets), getSheetByName: (n) => sheets[n], insertSheet: (n) => (sheets[n] = new Sheet(n)), deleteSheet() {}, setSpreadsheetTimeZone() {} };
  const cache = {}, props = {};
  const ctx = {
    console, JSON, Date, Math, Number, String, Array, Object, RegExp, Error, isFinite,
    SpreadsheetApp: { openById: () => ss, create: () => ss },
    PropertiesService: { getScriptProperties: () => ({ getProperty: (k) => props[k] ?? null, setProperty: (k, v) => { props[k] = v; }, deleteProperty: (k) => { delete props[k]; } }) },
    LockService: { getScriptLock: () => ({ waitLock() {}, tryLock: () => true, releaseLock() {} }) },
    CacheService: { getScriptCache: () => ({ get: (k) => cache[k] ?? null, put: (k, v) => { cache[k] = v; }, getAll: (ks) => Object.fromEntries(ks.map((k) => [k, cache[k]])), putAll: (o) => Object.assign(cache, o) }) },
    ContentService: { createTextOutput: (t) => ({ setMimeType() { return t; } }), MimeType: { JSON: 'json' } },
    Utilities: {
      formatDate: (d) => d.toISOString().slice(0, 10), DigestAlgorithm: { SHA_256: 1 }, Charset: { UTF_8: 1 },
      computeDigest: (a, t) => [...crypto.createHash('sha256').update(t).digest()].map((b) => (b > 127 ? b - 256 : b)),
    },
  };
  vm.createContext(ctx);
  for (const f of fs.readdirSync(ROOT).filter((f) => f.endsWith('.js')).sort()) vm.runInContext(fs.readFileSync(new URL(f, ROOT), 'utf8'), ctx, { filename: f });
  return { ctx, sheets };
}

const { ctx, sheets } = load();
const APP = ctx.APP;
const post = (body) => JSON.parse(ctx.doPost({ postData: { contents: JSON.stringify(body) }, parameter: {} }));
const get = (q) => JSON.parse(ctx.doGet({ parameter: q }));
const xpVar = APP.xp[APP.variantXp][0];
const base = { action: 'devis', offer: 'etablissement', variant: xpVar, email: 'ecole@example.com', school: 'Lycée Test de Rabat', country: 'MA',
  role: 'lettres', pupils: '300-799', currency: 'eur', payment: 'virement', consent: true, consent_version: APP.consentVersion, page: '/' + APP.site + '/devis/' };
// ping
assert.equal(get({ action: 'ping' }).site, APP.site);

// track: counted, excluded, legacy, refused
assert.deepEqual(post({ action: 'track', v: 2, site: APP.site, page: '/' + APP.site + '/', event: 'view', device: 'mobile', variant: xpVar }), { ok: true });
assert.equal(sheets.Stats.rows.length, 2);
assert.equal(sheets.Stats.rows[1][2], '/');
assert.equal(sheets.Stats.rows[1][4], xpVar);
post({ action: 'track', v: 2, site: APP.site, page: '/' + APP.site + '/', event: 'view', device: 'mobile', variant: xpVar });
assert.equal(sheets.Stats.rows[1][9], 2, 'same key increments');
post({ action: 'track', v: 2, site: APP.site, page: '/x/', event: 'view', excluded: 'notrack' });
post({ action: 'track', site: APP.site, page: '/x/', event: 'view' });
assert.deepEqual(sheets.Exclus.rows.slice(1).map((r) => r[4]), ['notrack', 'legacy']);
assert.equal(post({ action: 'track', v: 2, site: 'other-site', page: '/', event: 'view' }).error, 'bad_request');
assert.equal(post({ action: 'track', v: 2, site: APP.site, page: '/', event: 'nope' }).field, 'event');
post({ action: 'track', v: 2, site: APP.site, page: '/', event: APP.events[2], detail: 'BAD VALUE!' });
assert.equal(sheets.Stats.rows.at(-1)[5], '', 'detail outside the slug pattern is dropped');

// devis: validation
assert.equal(post({ ...base, consent: false }).error, 'consent_required');
assert.equal(post({ ...base, consent_version: 'old' }).error, 'consent_outdated');
assert.equal(post({ ...base, email: 'nope' }).field, 'email');
assert.equal(post({ ...base, offer: 'other' }).field, 'offer');
assert.equal(post({ ...base, school: 'x' }).field, 'school');
assert.equal(post({ ...base, country: 'XYZ' }).field, 'country');
assert.equal(post({ ...base, offer: 'kits', kits: [] }).field, 'kits');
assert.equal(post({ ...base, offer: 'kits', kits: ['le-menteur'] }).field, 'kits', 'Le Menteur is free, not a kit to quote');
assert.deepEqual(post({ ...base, hp: 'bot' }), { ok: true });
assert.equal(sheets.Devis, undefined, 'nothing written yet');
assert.equal(get({ ...base }).error, 'method_not_allowed', 'GET cannot write a request');

// devis: stored, deduplicated, priced by arm, test rows kept out of Stats
const r1 = post(base);
assert.equal(r1.ok, true);
assert.equal(r1.updated, false);
assert.equal(r1.zone, 'non-eu');
const H = sheets.Devis.rows[0];
const col = (n) => H.indexOf(n);
let row = sheets.Devis.rows[1];
assert.equal(row[col('site')], APP.site);
assert.equal(row[col('price_eur')], 390);
assert.equal(row[col('test')], 'yes');
assert.equal(post({ ...base, variant: 'p290', message: '=HYPERLINK("x")' }).updated, true);
assert.equal(sheets.Devis.rows.length, 2, 'same e-mail + offer updates the row');
row = sheets.Devis.rows[1];
assert.equal(row[col('price_eur')], 290, 'arm p290 priced 290');
assert.equal(row[col('message')], '\'=HYPERLINK("x")', 'formula injection neutralised');
assert.ok(!sheets.Stats.rows.some((r) => r[3] === 'devis_ok'), 'test e-mails are not counted');
const kits = post({ ...base, email: 'cdi@lycee-reel.ma', offer: 'kits', kits: ['pot-bouille', 'cahier-de-douai', 'pot-bouille', 'bad'] });
assert.equal(kits.ok, true);
row = sheets.Devis.rows.at(-1);
assert.equal(row[col('kits')], 'pot-bouille,cahier-de-douai');
assert.equal(row[col('price_eur')], 78);
assert.ok(sheets.Stats.rows.some((r) => r[3] === 'devis_ok' && r[5] === 'kits' && r[6] === '(server)'));
const fle = post({ ...base, email: 'info@alliance-test.org', offer: 'fle-400', country: 'US' });
assert.equal(fle.zone, 'non-eu');
assert.equal(sheets.Devis.rows.at(-1)[col('price_eur')], 590);
const eu = post({ ...base, email: 'contact@lycee.es', country: 'ES' });
assert.equal(eu.zone, 'eu');
assert.equal(sheets.Devis.rows.at(-1)[col('status')], 'hors_zone');
assert.equal(post({ ...base, email: 'contact@lycee-mc.org', country: 'MC' }).zone, 'eu', 'Monaco treated as EU (VAT territory)');

// admin views
assert.equal(post({ action: 'summary' }).error, 'forbidden');
const key = (process.env[APP.site.toUpperCase().replace(/-/g, '_') + '_ADMIN_KEY'] || '');
if (key) {
  const s = post({ action: 'summary', key });
  assert.equal(s.devis.real, 4);
  assert.equal(s.devis.test, 1);
  assert.equal(post({ action: 'purge_tests', key }).deleted, 1);
}

// cro.js batch accepted for this site only
assert.equal(post({ action: 'track', kind: 'cro', v: 2, site: APP.site, page: '/' + APP.site + '/', device: 'desktop', e: [['pv', '', ''], ['scroll', '', '50'], ['xp', APP.variantXp, xpVar + '.n']] }).ok, true);
assert.ok(sheets.Comportement.rows.length >= 3);
assert.ok(sheets.Experiences.rows.length >= 2);
// POOLED-READING-01: rd-hero views, CTA and the 'sample' goal are kept; an unknown goal is dropped
const xpBefore = sheets.Experiences.rows.length;
assert.equal(post({ action: 'track', kind: 'cro', v: 2, site: APP.site, page: '/' + APP.site + '/', device: 'mobile', e: [['xp', 'rd-hero', 'b.n'], ['xp', 'rd-hero', 'b.view'], ['xp', 'rd-hero', 'b.cta'], ['xp', 'rd-hero', 'b.sample'], ['xp', 'rd-hero', 'b.nogoal']] }).ok, true);
assert.equal(sheets.Experiences.rows.length - xpBefore, 4, 'rd-hero n/view/cta/sample recorded, unknown goal dropped');
assert.notEqual(post({ action: 'track', kind: 'cro', v: 2, site: 'other', page: '/', e: [['pv', '', '']] }).ok, true);

console.log('gas tests ok (' + APP.site + ')');
