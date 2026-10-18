#!/usr/bin/env node
// Static build, no dependency: src/pages/*.html (+ site.config.mjs) -> docs/ (GitHub Pages, branch main, folder /docs).
// Each page starts with <!--meta {json}--> : { path, title, description, page, schema?, noindex?, nav? }.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import SITE from './site.config.mjs';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(ROOT, 'docs');
const SRC = path.join(ROOT, 'src');
const ORIGIN = 'https://outils.vread.fr';
const BASE = '/' + SITE.repo + '/';
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const hash = (buf) => crypto.createHash('sha256').update(buf).digest('hex').slice(0, 10);

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(path.join(OUT, 'assets'), { recursive: true });

// 1. Assets (fingerprinted with ?v=). mesure.js is generated per site from the shared template.
if (SITE.prebuild) await SITE.prebuild({ ROOT, SRC });
const mesure = fs.readFileSync(path.join(ROOT, 'tools/mesure.template.js'), 'utf8')
  .replace(/__BRAND__/g, SITE.brand).replace(/__SITE__/g, SITE.site).replace(/__API__/g, SITE.api).replace(/__XP__/g, SITE.variantXp);
fs.writeFileSync(path.join(SRC, 'assets/mesure.js'), mesure);
const ver = {};
for (const f of fs.readdirSync(path.join(SRC, 'assets'))) {
  const buf = fs.readFileSync(path.join(SRC, 'assets', f));
  fs.writeFileSync(path.join(OUT, 'assets', f), buf);
  ver[f] = hash(buf);
}
for (const f of SITE.static || []) if (fs.existsSync(path.join(ROOT, f[0]))) { fs.mkdirSync(path.dirname(path.join(OUT, f[1])), { recursive: true }); fs.copyFileSync(path.join(ROOT, f[0]), path.join(OUT, f[1])); }
fs.writeFileSync(path.join(OUT, '.nojekyll'), '');

// 2. Pages.
const pages = fs.readdirSync(path.join(SRC, 'pages')).filter((f) => f.endsWith('.html')).sort().map((f) => {
  const raw = fs.readFileSync(path.join(SRC, 'pages', f), 'utf8');
  const m = raw.match(/^<!--meta\s*([\s\S]*?)-->\n?/);
  if (!m) throw new Error(f + ': missing <!--meta {...}--> header');
  return { file: f, ...JSON.parse(m[1]), body: raw.slice(m[0].length) };
});

const rel = (from, to) => {
  // relative link from page path `from` (e.g. /audit/) to site path `to` (e.g. /assets/x.css)
  const depth = from.split('/').filter(Boolean).length - (from.endsWith('/') ? 0 : 1);
  return ('../'.repeat(depth) || './') + to.replace(/^\//, '');
};
const asset = (p, f) => rel(p.path, 'assets/' + f) + '?v=' + ver[f];

// Breadcrumbs (visible + BreadcrumbList) on every page but the home and the 404: outils.vread.fr › Lectoclasse › [parent] › page.
const NAV_LABEL = Object.fromEntries(SITE.nav.map(([label, to]) => [to, label]));
const PARENTS = [[/^\/kits\/[^/]+\/$/, ['Kits du bac', '/kits/']], [/^\/echantillon\/texte\/$/, ['Kit gratuit', '/echantillon/']]];
function crumbs(p) {
  if (p.path === '/' || p.path === '/404.html') return null;
  const list = [['outils.vread.fr', 'https://outils.vread.fr/'], [SITE.brand, ORIGIN + BASE]];
  for (const [re, parent] of PARENTS) if (re.test(p.path)) list.push([parent[0], ORIGIN + BASE + parent[1].replace(/^\//, '')]);
  list.push([p.crumb || NAV_LABEL[p.path] || p.title.split(/ [|:] /)[0], ORIGIN + BASE + p.path.replace(/^\//, '')]);
  return list;
}
// FAQPage from the visible <details><summary>question</summary><p>answer</p></details> blocks (pages with "faq": true).
const plain = (h) => h.replace(/<[^>]+>/g, '').replace(/\{\{[^}]+\}\}/g, '').replace(/\s+/g, ' ').trim();
function faqSchema(body) {
  const qa = [...body.matchAll(/<details[^>]*><summary>([\s\S]*?)<\/summary>([\s\S]*?)<\/details>/g)].map((m) => ({ '@type': 'Question', name: plain(m[1]), acceptedAnswer: { '@type': 'Answer', text: plain(m[2]) } }));
  return qa.length ? { '@type': 'FAQPage', mainEntity: qa } : null;
}
// Sitemap lastmod = date of the last commit that touched the page source (today if it has uncommitted changes).
const today = new Date().toISOString().slice(0, 10);
function lastmod(p) {
  const f = path.join('src/pages', p.file);
  try {
    const dirty = execFileSync('git', ['status', '--porcelain', '--', f], { cwd: ROOT, encoding: 'utf8' }).trim();
    if (dirty) return today;
    const d = execFileSync('git', ['log', '-1', '--format=%cs', '--', f], { cwd: ROOT, encoding: 'utf8' }).trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
  } catch { /* no git: fall back to the page header */ }
  return p.updated || today;
}

function layout(p) {
  const url = ORIGIN + BASE + p.path.replace(/^\//, '');
  const R = (to) => rel(p.path, to);
  const body = p.body.replace(/\{\{([a-z_]+):([^}]*)\}\}/g, (all, k, v) => (k === 'href' ? R(v) : k === 'asset' ? asset(p, v) : all))
    .replace(/\{\{api\}\}/g, SITE.api).replace(/\{\{repo_url\}\}/g, 'https://github.com/VREAD-corp/' + SITE.repo);
  const nav = SITE.nav.map(([label, to]) => `<a href="${R(to)}"${to === p.path ? ' aria-current="page"' : ''}>${esc(label)}</a>`).join('');
  const cr = crumbs(p);
  const crumbSchema = cr && { '@type': 'BreadcrumbList', itemListElement: cr.map(([name, item], i) => ({ '@type': 'ListItem', position: i + 1, name, item })) };
  const fil = cr ? `<nav class="fil small no-print" aria-label="Fil d’Ariane">${cr.map(([name, item], i) => (i === cr.length - 1 ? `<span aria-current="page">${esc(name)}</span>` : `<a href="${item.startsWith(ORIGIN + BASE) ? R('/' + item.slice((ORIGIN + BASE).length)) : item}">${esc(name)}</a>`)).join(' › ')}</nav>\n` : '';
  const schema = [].concat(crumbSchema || [], p.schema || [], SITE.schema ? SITE.schema(p, url) : [], p.faq ? faqSchema(p.body) : []).filter(Boolean)
    .map((s) => `<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', ...s })}</script>`).join('\n');
  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(p.title)}</title>
<meta name="description" content="${esc(p.description)}">
${p.noindex ? '<meta name="robots" content="noindex">' : `<link rel="canonical" href="${url}">`}
<meta property="og:type" content="website">
<meta property="og:locale" content="fr_FR">
<meta property="og:site_name" content="${esc(SITE.brand)}">
<meta property="og:title" content="${esc(p.title)}">
<meta property="og:description" content="${esc(p.description)}">
<meta property="og:url" content="${url}">
<meta name="theme-color" content="${SITE.accent}">
<link rel="icon" href="${asset(p, 'icon.svg')}" type="image/svg+xml">
<link rel="stylesheet" href="${asset(p, 'style.css')}">
<script>window.SITE = ${JSON.stringify({ site: SITE.site, api: SITE.api, xp: SITE.variantXp, consent: SITE.consentVersion, base: R('/'), mail: 'octave@vread.fr', venture: SITE.venture, products: SITE.products, ogc: p.page === 'order' ? asset(p, 'og-checkout.js') : '' })};
window.OCTAVE_XP = ${JSON.stringify(SITE.xp)};</script>
<script src="${asset(p, 'cro.js')}" data-site="${SITE.site}" data-api="${SITE.api}" data-hosts="outils.vread.fr" data-cta="a.btn,button.btn,[data-cta]"></script>
<script src="${asset(p, 'mesure.js')}" defer></script>
${(SITE.scripts || []).concat(p.scripts || []).map((s) => `<script src="${asset(p, s)}" defer></script>`).join('\n')}
${schema}
</head>
<body data-page="${esc(p.page || '')}">
<a class="skip" href="#main">Aller au contenu</a>
<header class="top"><div class="wrap">
<a class="logo" href="${R('/')}">${SITE.logo}</a>
<nav aria-label="Navigation principale">${nav}</nav>
</div></header>
<main id="main" class="wrap">
${fil}${body.trim()}
</main>
<footer class="foot"><div class="wrap">
<p><strong>Lectoclasse par READ FRANCE.</strong> Lectoclasse est une activité de READ FRANCE SAS (Paris), l’éditeur de Vread, conçue et exploitée par Octave, son agent IA. ${esc(SITE.footerNote || '')}</p>
<p><a href="https://outils.vread.fr/a-propos/">Qui fait ce site, et comment</a> · <a href="${R('/oeuvres/')}">Œuvres et droits</a> · <a href="${R('/cgv/')}">Conditions de vente</a> · <a href="${R('/confidentialite/')}">Confidentialité</a> · <a href="${R('/mentions-legales/')}">Mentions légales</a> · <a href="mailto:octave@vread.fr">octave@vread.fr</a></p>
<p class="small">Aucun cookie. Mesure d'audience anonyme et agrégée, sans identifiant.</p>
</div></footer>
</body>
</html>
`;
}

for (const p of pages) {
  const target = p.path === '/404.html' ? path.join(OUT, '404.html') : path.join(OUT, p.path, 'index.html');
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, layout(p));
}

// 3. sitemap.xml, robots.txt
const listed = pages.filter((p) => !p.noindex && p.path !== '/404.html');
fs.writeFileSync(path.join(OUT, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${listed.map((p) => `  <url><loc>${ORIGIN + BASE + p.path.replace(/^\//, '')}</loc><lastmod>${lastmod(p)}</lastmod></url>`).join('\n')}
</urlset>
`);
fs.writeFileSync(path.join(OUT, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${ORIGIN + BASE}sitemap.xml\n`);
fs.writeFileSync(path.join(OUT, 'urls.txt'), listed.map((p) => ORIGIN + BASE + p.path.replace(/^\//, '')).join('\n') + '\n');
console.log(`built ${pages.length} pages -> docs/ (${listed.length} in sitemap)`);
