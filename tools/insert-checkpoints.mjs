#!/usr/bin/env node
// Writes the reading checkpoints (content/checkpoints/<slug>.json, format read-france.checkpoints/1, built and
// validated with READ FRANCE's reading engine) into the kit pages, between <!--cp:...--> markers, so a re-run
// replaces them. Le Menteur: one checkpoint per act, at the top of each act sheet, and the key in the corrigé.
// Le Petit Poucet: one checkpoint per part of the tale, on a sheet of its own before the corrigé.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const load = (slug) => {
  const f = JSON.parse(fs.readFileSync(path.join(ROOT, 'content/checkpoints', `${slug}.json`), 'utf8'));
  if (f.format !== 'read-france.checkpoints/1') throw new Error(`${slug}: format ${f.format}`);
  const bad = f.checkpoints.filter((c) => !c.ok);
  if (bad.length || f.integrity.error) throw new Error(`${slug}: checkpoints failing the engine gates`);
  return f.checkpoints;
};
// Every run first removes the blocks written by a previous run, then inserts them again at their anchors.
const strip = (html) => html.replace(/\n?<!--cp:[^>]*-->[\s\S]*?<!--\/cp-->/g, '');
const block = (key, body) => `\n<!--cp:${key}-->\n${body}\n<!--/cp-->`;
/** Inserts after the first occurrence of `anchor` found at or after `from`. */
const insertAt = (html, anchor, from, key, body) => {
  const i = html.indexOf(anchor, from);
  if (i < 0) throw new Error(`anchor not found: ${anchor.slice(0, 60)}`);
  const j = i + anchor.length;
  return html.slice(0, j) + block(key, body) + html.slice(j);
};
const NAME = '<p class="hint">Nom : ........................................ Classe : .......... Date : ..........</p>';
const box = (c) =>
  `<div class="checkpoint"><p><strong>Point de contrôle de lecture</strong> <span class="hint">(un mot du texte, 1 point)</span></p><p>${esc(c.question)}</p><div class="lines"></div></div>`;

// Le Menteur
{
  const file = path.join(ROOT, 'src/pages/echantillon.html');
  let html = strip(fs.readFileSync(file, 'utf8'));
  const cps = load('le-menteur');
  for (const c of cps) {
    const act = Number(c.unit.replace('acte-', ''));
    const sec = html.indexOf(`<section class="sheet" id="acte-${act}">`);
    if (sec < 0) throw new Error(`act ${act} sheet not found`);
    html = insertAt(html, NAME, sec, `acte-${act}`, box(c));
  }
  const keyBlock =
    `<h3>Points de contrôle de lecture</h3>\n<p class="hint">Un mot exact du texte, pris au milieu de l’acte. Acceptez toute graphie qui désigne clairement le même mot.</p>\n<ol class="key">\n` +
    cps.map((c) => `<li><strong>${esc(c.label)} : ${esc(c.answer)}.</strong> « ${esc(c.evidence)} »</li>`).join('\n') +
    `\n</ol>`;
  html = insertAt(html, '<p class="hint">Entre crochets : acte et scène où se trouve la réponse. Les citations suivent l’orthographe de 1862.</p>', 0, 'corrige', keyBlock);
  html = insertAt(html, '<li><strong>55 questions</strong>, réparties sur les cinq actes : une fiche par acte, à donner après la lecture de l’acte.</li>', 0, 'intro',
    '<li><strong>Un point de contrôle de lecture par acte</strong> : une question dont la réponse est un mot du texte, pris au milieu de l’acte. Un résumé ne suffit pas pour y répondre.</li>');
  fs.writeFileSync(file, html);
  console.log(`le-menteur: ${cps.length} checkpoints -> src/pages/echantillon.html`);
}

// Le Petit Poucet
{
  const file = path.join(ROOT, 'src/pages/college.html');
  let html = strip(fs.readFileSync(file, 'utf8'));
  const cps = load('petit-poucet');
  const sheet =
    `<section class="sheet" id="pp-checkpoints">\n<div class="meta"><span>Lectoclasse par READ FRANCE</span><span>Rallye-lecture · <i>Le Petit Poucet</i> · points de contrôle</span></div>\n` +
    `<h2>Points de contrôle de lecture</h2>\n<p class="hint">Une question par partie du conte, à poser juste après sa lecture. La réponse est un mot du texte. Équipe : ................................</p>\n<ol class="q">\n` +
    cps.map((c) => `<li>${esc(c.label.replace('Segment', 'Partie'))} : ${esc(c.question)}<div class="lines"></div></li>`).join('\n') +
    `\n</ol>\n<h3>Corrigé des points de contrôle</h3>\n<ol class="key">\n` +
    cps.map((c) => `<li><strong>${esc(c.answer)}.</strong> « ${esc(c.evidence)} »</li>`).join('\n') +
    `\n</ol>\n</section>`;
  const corr = html.indexOf('<section class="sheet" id="pp-corrige">');
  if (corr < 0) throw new Error('pp-corrige not found');
  html = html.slice(0, corr) + block('pp', sheet).slice(1) + '\n\n' + html.slice(corr);
  fs.writeFileSync(file, html);
  console.log(`petit-poucet: ${cps.length} checkpoints -> src/pages/college.html`);
}
