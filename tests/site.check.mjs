// Static checks of docs/ (run after build.mjs). node tests/site.check.mjs
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import os from 'node:os';
import assert from 'node:assert/strict';
import SITE from '../site.config.mjs';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const DOCS = path.join(ROOT, 'docs');
const files = [];
(function walk(d) { for (const f of fs.readdirSync(d)) { const p = path.join(d, f); fs.statSync(p).isDirectory() ? walk(p) : p.endsWith('.html') && files.push(p); } })(DOCS);
const sitemap = fs.readFileSync(path.join(DOCS, 'sitemap.xml'), 'utf8');
const errors = [];
const BO_URL = 'https://www.education.gouv.fr/bo/2025/Hebdo30/MENE2518792N';
const err = (f, m) => errors.push(path.relative(DOCS, f) + ': ' + m);
const text = (h) => h.replace(/<(script|style|code)[\s\S]*?<\/\1>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ');

for (const f of files) {
  const h = fs.readFileSync(f, 'utf8');
  const is404 = f.endsWith('404.html');
  if (!/<title>[^<]{10,}<\/title>/.test(h)) err(f, 'title');
  const d = h.match(/<meta name="description" content="([^"]*)"/);
  if (!d || d[1].length < 50 || d[1].length > 200) err(f, 'description length ' + (d ? d[1].length : 0));
  if ((h.match(/<h1[\s>]/g) || []).length !== 1) err(f, 'exactly one h1');
  if (!is404) {
    const c = h.match(/<link rel="canonical" href="([^"]+)"/);
    if (!c) err(f, 'canonical'); else if (!sitemap.includes('<loc>' + c[1] + '</loc>')) err(f, 'not in sitemap: ' + c[1]);
  }
  if (!h.includes(`data-site="${SITE.site}"`) || !h.includes(`data-api="${SITE.api}"`)) err(f, 'cro.js tag');
  if (!/assets\/mesure\.js\?v=/.test(h)) err(f, 'mesure.js');
  // V4-47 wording rules: the June 2027 exam belongs to the 2028 bac session; endorsed brand form; no « Vread » product name
  if (/session 2027/i.test(text(h))) err(f, 'forbidden wording « session 2027 »');
  if (!h.includes('Lectoclasse par READ FRANCE') || !h.includes('l’éditeur de Vread')) err(f, 'endorsed brand line');
  if (/Vread (Classe|FLE|Classroom)/.test(h)) err(f, 'Vread used as a product name');
  if (!is404 && !/sans lien avec l’AEFE/.test(h)) err(f, 'private-resource notice');
  if (!h.includes('window.OCTAVE_XP')) err(f, 'OCTAVE_XP');
  for (const m of h.matchAll(/<script[^>]+src="([^"]+)"/g)) if (/^(https?:)?\/\//.test(m[1])) err(f, 'third-party script ' + m[1]);
  for (const m of h.matchAll(/<link[^>]+href="(https?:[^"]+)"/g)) if (!m[0].includes('canonical')) err(f, 'external stylesheet/link ' + m[1]);
  for (const m of h.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    let j; try { j = JSON.parse(m[1]); } catch { err(f, 'JSON-LD parse'); continue; }
    if (/aggregateRating|"review"|ratingValue/i.test(m[1])) err(f, 'ratings or reviews in JSON-LD');
    if (!j['@type']) err(f, 'JSON-LD @type');
  }
  // internal links resolve to a built file
  for (const m of h.matchAll(/\shref="([^"#]+)(#[^"]*)?"/g)) {
    const u = m[1];
    if (/^(https?:|mailto:|data:)/.test(u)) continue;
    let t = u.startsWith('/') ? path.join(DOCS, u.replace('/' + SITE.repo + '/', '/')) : path.resolve(path.dirname(f), u.split('?')[0]);
    if (u.endsWith('/') || fs.existsSync(t) && fs.statSync(t).isDirectory()) t = path.join(t, 'index.html');
    if (!fs.existsSync(t)) err(f, 'broken link ' + u);
  }
  // claims that must never appear without a negation in the same sentence
  // quoted text (« … », e.g. the law itself) is not a claim of ours
  for (const s of text(h).replace(/«[^»]*»/g, ' ').split(/(?<=[.!?;:])\s+/)) for (const re of SITE.claims || []) {
    if (re.test(s) && !/\b(ne|n'|ni|aucun|aucune|non|pas|jamais|sans)\b|n’/i.test(s)) err(f, 'claim without negation: ' + s.trim().slice(0, 140));
  }
}
// anti-AI grid: every page >= 85 and no banned phrase / unverified claim (verdict OK)
// The grid applies to our own writing: the public-domain texts we reproduce (Corneille, Perrault), wrapped in <!--pd-->…<!--/pd-->,
// are removed from a temporary copy before linting.
const LINTDIR = fs.mkdtempSync(path.join(os.tmpdir(), 'lectoclasse-lint-'));
for (const f of files) {
  const out = path.join(LINTDIR, path.relative(DOCS, f));
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, fs.readFileSync(f, 'utf8').replace(/<!--pd-->[\s\S]*?<!--\/pd-->/g, ''));
}
const lint = JSON.parse(execFileSync('node', [path.join(ROOT, 'tools/lint-ia.mjs'), '--json', '--min', '0', LINTDIR], { encoding: 'utf8' }));
for (const r of lint) if (!r.skipped && r.file.endsWith('.html') && (r.score < 85 || r.verdict !== 'OK')) errors.push(r.file + ': lint-ia ' + r.score + ' ' + r.verdict);
// cro.js byte-identical to the master copy when it is available (local runs)
const master = path.join(ROOT, '../octave-checkout/gas/web/cro.js');
if (fs.existsSync(master)) assert.equal(fs.readFileSync(path.join(DOCS, 'assets/cro.js'), 'utf8'), fs.readFileSync(master, 'utf8'), 'cro.js differs from octave-checkout/gas/web/cro.js');
const mesure = fs.readFileSync(path.join(DOCS, 'assets/mesure.js'), 'utf8');
assert.ok(mesure.includes("v:2") && mesure.includes(`site:'${SITE.site}'`) && mesure.includes(SITE.api) && mesure.includes('octave_notrack'), 'mesure.js');
// public-domain rule for sales abroad: excluded authors never appear as a covered work
for (const f of files) {
  const t = text(fs.readFileSync(f, 'utf8'));
  for (const a of ['Leroux', 'Leblanc', 'Colette']) for (const m of t.matchAll(new RegExp('[^.]*' + a + '[^.]*\\.', 'g'))) if (!/mort|morte|pas|ni|n’utilisons/.test(m[0])) errors.push(path.relative(DOCS, f) + ': ' + a + ' mentioned without the exclusion');
}
// the 3 printable PDFs ship with the site
for (const pdf of ['echantillon/lectoclasse-le-menteur-kit.pdf', 'echantillon/le-menteur-texte-integral.pdf', 'college/lectoclasse-petit-poucet-rallye.pdf'])
  assert.ok(fs.existsSync(path.join(DOCS, pdf)) && fs.readFileSync(path.join(DOCS, pdf)).subarray(0, 5).toString() === '%PDF-', pdf);
// checkout module vendored byte-identical from octave-global-checkout (local runs)
const ogMaster = path.join(ROOT, '../octave-global-checkout/dist/og-checkout.js');
if (fs.existsSync(ogMaster)) assert.equal(fs.readFileSync(path.join(DOCS, 'assets/og-checkout.js'), 'utf8'), fs.readFileSync(ogMaster, 'utf8'), 'og-checkout.js differs from octave-global-checkout/dist');
// kit pages: one per public-domain bac work, slug = Lectoguide slug, one CTA, link to the guide and to the kit
const KIT_SLUGS = { 'le-menteur': null, 'on-ne-badine-pas-avec-l-amour': 'on-ne-badine', 'cahier-de-douai': 'cahier-de-douai', 'pot-bouille': 'pot-bouille',
  'therese-raquin': 'therese-raquin', 'servitude-volontaire': 'servitude-volontaire', 'pluralite-des-mondes': 'pluralite-des-mondes', 'lettres-d-une-peruvienne': 'lettres-peruvienne' };
const hub = fs.readFileSync(path.join(DOCS, 'kits/index.html'), 'utf8');
const gated = JSON.parse(fs.readFileSync(path.join(ROOT, 'content/checkpoints/le-menteur.json'), 'utf8')).checkpoints.map((c) => c.question);
for (const [slug, kit] of Object.entries(KIT_SLUGS)) {
  const f = path.join(DOCS, 'kits', slug, 'index.html');
  if (!fs.existsSync(f)) { errors.push('missing kit page ' + slug); continue; }
  const h = fs.readFileSync(f, 'utf8');
  if (!hub.includes(`href="../kits/${slug}/"`)) errors.push('hub does not link ' + slug);
  if (!h.includes(`href="https://outils.vread.fr/lectoguide/${slug}/"`)) errors.push(slug + ': no link to its Lectoguide guide');
  const btns = [...h.matchAll(/<a class="btn"[^>]*href="([^"]+)"/g)].map((m) => m[1]);
  if (btns.length !== 1) errors.push(slug + ': expected exactly one CTA, got ' + btns.length);
  else if (kit ? !btns[0].includes('commander/?offre=kit&amp;oeuvre=' + kit) || !SITE.products.kits[kit] : !btns[0].endsWith('echantillon/')) errors.push(slug + ': CTA ' + btns[0]);
  if (!/"@type":"BreadcrumbList"/.test(h)) errors.push(slug + ': BreadcrumbList');
  if (kit && !/"availability":"https:\/\/schema.org\/PreOrder"/.test(h)) errors.push(slug + ': PreOrder offer');
  if (!h.includes(BO_URL)) errors.push(slug + ': BO source');
  const lm = sitemap.match(new RegExp(`kits/${slug}/</loc><lastmod>(\\d{4}-\\d{2}-\\d{2})<`));
  if (!lm || lm[1] < '2026-10-17') errors.push(slug + ': sitemap lastmod');
  if (!h.includes('href="https://outils.vread.fr/lectopoint/')) errors.push(slug + ': no link to Lectopoint');
  // a question shown on a kit page must be one that passed the reading engine (Le Menteur checkpoints)
  for (const m of h.matchAll(/<blockquote class="extract">([^<]+)<\/blockquote>/g)) if (!gated.includes(m[1].replace(/&#39;/g, "'").replace(/ /g, ' ').trim())) errors.push(slug + ': question not from a gated set: ' + m[1].slice(0, 60));
}
// 2026-10-18 CRO/SEO pass: breadcrumbs from outils.vread.fr on inner pages, FAQPage on home and order, footer link to the
// method page, pooled hero test POOLED-READING-01 (rd-hero) on the home only, real lastmod dates.
for (const f of files) {
  const h = fs.readFileSync(f, 'utf8'), rp = path.relative(DOCS, f);
  if (!h.includes('href="https://outils.vread.fr/a-propos/"')) errors.push(rp + ': footer link to the method page');
  if (rp === 'index.html' || rp === '404.html') continue;
  if (!/"@type":"BreadcrumbList","itemListElement":\[\{"@type":"ListItem","position":1,"name":"outils.vread.fr","item":"https:\/\/outils.vread.fr\/"\}/.test(h)) errors.push(rp + ': BreadcrumbList from outils.vread.fr');
  if (!h.includes('class="fil small no-print"')) errors.push(rp + ': visible breadcrumbs');
}
for (const pg of ['index.html', 'commander/index.html']) if (!fs.readFileSync(path.join(DOCS, pg), 'utf8').includes('"@type":"FAQPage"')) errors.push(pg + ': FAQPage');
const rd = SITE.xp.find((x) => x.id === 'rd-hero');
if (!rd || rd.mode !== 'tab' || rd.param !== 'hero' || String(rd.variants) !== 'a,b' || !new RegExp(rd.pages).test('/lectoclasse/') || new RegExp(rd.pages).test('/lectoclasse/kits/')) errors.push('rd-hero experiment config');
if (!SITE.xp.find((x) => x.id === 'lc-prix')) errors.push('lc-prix kept');
const homeH = fs.readFileSync(path.join(DOCS, 'index.html'), 'utf8');
if ((homeH.match(/data-hero-excerpt/g) || []).length !== 1) errors.push('home: one hero excerpt');
for (const m of sitemap.matchAll(/<lastmod>([^<]+)</g)) if (!/^2026-\d{2}-\d{2}$/.test(m[1])) errors.push('lastmod ' + m[1]);
if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
console.log(`site checks ok: ${files.length} pages, lint-ia >= 85 on all`);
