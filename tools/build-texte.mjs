#!/usr/bin/env node
// Builds the printable full text of Le Menteur (src/pages/echantillon-texte.html) from content/le-menteur/texte.txt,
// the plain-text dump of vread-public-domain-sources/clean/le-menteur_corneille_fr.epub (Wikisource, Marty-Laveaux 1862;
// notice, variants and verse numbers already removed). Run by `npm run build` before build.mjs.
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const lines = fs.readFileSync(path.join(ROOT, 'content/le-menteur/texte.txt'), 'utf8').split('\n').map((l) => l.trim()).filter(Boolean);
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const HEADISH = /^[A-ZÉÈÀÂÎÔÛÇ]{3,}(?:[ ,][^a-zé].*|, .*)?[.;,]$|^[A-ZÉÈÀÂÎÔÛÇ]{3,}, .*[.;]$/;
const isHead = (l) => HEADISH.test(l) && !/^(ACTE|FIN|LE MENTEUR|COMÉDIE|ACTEURS)/.test(l);

const out = [];
let i = 0, inCast = false, verses = 0;
while (i < lines.length) {
  const l = lines[i];
  if (/^(Personnages|Acte [IV]+)/.test(l) && /(Personnages|Acte [IV]+)$/.test(l) && l.length < 40) { i++; continue; } // EPUB running titles
  if (l === 'ACTEURS.') { out.push('<h2>Les personnages</h2><ul class="cast">'); inCast = true; i++; continue; }
  if (inCast) {
    if (l === 'La scène est à Paris.') { out.push('</ul><p class="did">La scène est à Paris.</p>'); inCast = false; i++; continue; }
    out.push(`<li>${esc(l)}</li>`); i++; continue;
  }
  if (l === 'LE MENTEUR.' || l === 'COMÉDIE.') { i++; continue; }
  let m;
  if ((m = l.match(/^ACTE ([IV]+)\.$/))) { out.push(`<h2 id="acte-${m[1].toLowerCase()}">Acte ${m[1]}</h2>`); i++; continue; }
  if (/^FIN DU/.test(l)) { out.push(`<p class="did">${esc(l.charAt(0) + l.slice(1).toLowerCase())}</p>`); i++; continue; }
  if ((m = l.match(/^Scène (première|[IVX]+)\.*$/))) {
    out.push(`<h3>Scène ${m[1] === 'première' ? 'première' : m[1]}</h3>`);
    i++;
    const head = [];
    while (i < lines.length && isHead(lines[i])) head.push(lines[i++]);
    // all but the last header line = characters on stage; the last one is the first speaker
    const speaker = head.pop();
    if (head.length) out.push(`<p class="did">${esc(head.join(' '))}</p>`);
    if (speaker) out.push(`<p class="speaker">${esc(speaker.replace(/\.$/, ''))}</p>`);
    continue;
  }
  if (l.startsWith('(')) {
    // a stage direction ends with « .) »; a parenthesis inside a verse (« (Je ne parle que d'hier), … ») stays a verse
    let d = l, j = i;
    while (!d.includes(')') && j + 1 < lines.length) d += ' ' + lines[++j];
    if (/\.\)$/.test(d)) { out.push(`<p class="did">${esc(d)}</p>`); i = j + 1; continue; }
  }
  if (isHead(l)) { out.push(`<p class="speaker">${esc(l.replace(/\.$/, ''))}</p>`); i++; continue; }
  out.push(`<p class="verse">${esc(l)}</p>`); verses++; i++;
}

const meta = {
  path: '/echantillon/texte/', page: 'text', title: 'Le Menteur de Corneille : texte intégral à imprimer | Lectoclasse',
  description: 'Le texte complet du Menteur de Corneille (1644), édition Marty-Laveaux de 1862, sans notes ni variantes, à imprimer pour la classe.',
};
const html = `<!--meta ${JSON.stringify(meta)}-->
<p class="kicker no-print">Kit gratuit · texte intégral</p>
<h1>Corneille, <i>Le Menteur</i> (1644) : texte intégral</h1>
<div class="note no-print">
<p>Texte de l’édition Charles Marty-Laveaux (<i>Œuvres de P. Corneille</i>, Hachette, 1862, tome IV), transcrit par Wikisource. Nous avons retiré la notice, l’examen, les variantes et les numéros de vers. L’orthographe de 1862 est conservée (« avoit », « connoître »). Ce texte est dans le domaine public ; la transcription Wikisource est sous licence <a href="https://creativecommons.org/licenses/by-sa/4.0/deed.fr">CC BY-SA 4.0</a>, et cette mise en page aussi.</p>
<div class="row"><button type="button" class="btn" data-print="text_download">Imprimer le texte</button><a class="btn ghost" href="{{href:/echantillon/}}">Revenir au kit</a></div>
</div>
<!--pd--><div class="textpage">
${out.join('\n')}
</div><!--/pd-->
<p class="small">Source : <a href="https://fr.wikisource.org/wiki/Le_Menteur_(Corneille,_Marty-Laveaux,_1862)">Wikisource, <i>Le Menteur</i> (Corneille, Marty-Laveaux, 1862)</a>. Nettoyage : outil vread-public-domain-sources de READ FRANCE (${verses} lignes de vers).</p>
`;
fs.writeFileSync(path.join(ROOT, 'src/pages/echantillon-texte.html'), html);
console.log('echantillon-texte.html:', verses, 'verse lines,', out.filter((x) => x.startsWith('<h3')).length, 'scenes');
