// Renders the printable pages (print stylesheet) to PDFs in src/static/ with a local Chromium. Run: npm run pdf
import fs from 'node:fs';
import path from 'node:path';
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const { chromium } = await import(process.env.PW_CORE || path.join(ROOT, '../octave-checkout/node_modules/playwright-core/index.mjs'));
const exe = ['chromium-1248', 'chromium-1234', 'chromium-1228'].flatMap((d) => ['chrome-linux', 'chrome-linux64'].map((x) => path.join(process.env.HOME, '.cache/ms-playwright', d, x, 'chrome'))).find((p) => fs.existsSync(p));
const JOBS = [
  ['docs/echantillon/index.html', 'src/static/lectoclasse-le-menteur-kit.pdf', 'Lectoclasse · Le Menteur · kit de lecture'],
  ['docs/echantillon/texte/index.html', 'src/static/le-menteur-texte-integral.pdf', 'Corneille, Le Menteur · texte intégral (Wikisource, CC BY-SA 4.0)'],
  ['docs/college/index.html', 'src/static/lectoclasse-petit-poucet-rallye.pdf', 'Lectoclasse · rallye-lecture · Le Petit Poucet'],
];
fs.mkdirSync(path.join(ROOT, 'src/static'), { recursive: true });
const b = await chromium.launch({ executablePath: exe });
const p = await b.newPage();
for (const [src, out, foot] of JOBS) {
  await p.goto('file://' + path.join(ROOT, src), { waitUntil: 'load' });
  await p.emulateMedia({ media: 'print' });
  await p.pdf({ path: path.join(ROOT, out), format: 'A4', printBackground: false, preferCSSPageSize: true, displayHeaderFooter: true,
    headerTemplate: '<span></span>',
    footerTemplate: `<div style="font-size:8px;color:#666;width:100%;padding:0 14mm;display:flex;justify-content:space-between"><span>${foot}</span><span><span class="pageNumber"></span> / <span class="totalPages"></span></span></div>` });
  const pages = (fs.readFileSync(path.join(ROOT, out), 'latin1').match(/\/Type\s*\/Page[^s]/g) || []).length;
  console.log('PDF', out, pages, 'pages');
}
await b.close();
