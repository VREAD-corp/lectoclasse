#!/usr/bin/env node
// Exports the Lectoclasse kits (questions and answer keys in src/pages/*.html) to the READ FRANCE reading engine's
// item-set format: qa/items/le-menteur.json (one unit per act) and qa/items/petit-poucet.json (one unit per
// numbered paragraph). The HTML stays the source of truth; supporting passages written offline for the QA live in
// qa/evidence.json ({ "<item id>": ["verbatim span", ...] }) and are checked against the text by the engine.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const strip = (h) => h.replace(/<div class="lines"><\/div>/g, '').replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
const evidence = fs.existsSync(path.join(ROOT, 'qa/evidence.json')) ? JSON.parse(read('qa/evidence.json')) : {};
const ROMAN = { I: 1, II: 2, III: 3, IV: 4, V: 5 };

const section = (html, id) => {
  const m = html.match(new RegExp(`<section class="sheet" id="${id}">([\\s\\S]*?)</section>`));
  if (!m) throw new Error(`section ${id} not found`);
  return m[1];
};
const topItems = (ol) => {
  // <li> items at depth 1 of an <ol>; nested <ul class="opts"> stay inside their item.
  const out = []; let depth = 0; let start = -1;
  const re = /<(\/?)(li|ul)\b[^>]*>/g; let m;
  while ((m = re.exec(ol))) {
    const closing = m[1] === '/'; const tag = m[2];
    if (tag === 'li' && !closing && depth === 0) start = m.index + m[0].length;
    if (!closing) depth += 1; else depth -= 1;
    if (tag === 'li' && closing && depth === 0) out.push(ol.slice(start, m.index));
  }
  return out;
};

// Le Menteur: questions by act, keys by act ([I, 1] = act I, scene 1).
const ech = read('src/pages/echantillon.html');
const texte = read('content/le-menteur/texte.txt').split('\n');
const actStart = texte.map((l, i) => (/^ACTE [IV]+\.$/.test(l.trim()) ? i : -1)).filter((i) => i >= 0);
const actEnd = texte.map((l, i) => (/^FIN DU .* ACTE\.$/.test(l.trim()) ? i : -1)).filter((i) => i >= 0);
if (actStart.length !== 5 || actEnd.length !== 5) throw new Error('Le Menteur: 5 acts expected');
const menteurUnits = actStart.map((s, k) => ({ id: `acte-${k + 1}`, label: `Acte ${['I', 'II', 'III', 'IV', 'V'][k]}`, text: texte.slice(s, actEnd[k] + 1).join('\n') }));
const keyBlock = section(ech, 'corrige');
const keyLists = [...keyBlock.matchAll(/<ol class="key">([\s\S]*?)<\/ol>/g)].map((m) => topItems(m[1]).map(strip));
const menteurItems = [];
for (let act = 1; act <= 5; act += 1) {
  const qs = topItems(section(ech, `acte-${act}`).match(/<ol class="q">([\s\S]*?)<\/ol>/)[1]).map(strip);
  const keys = keyLists[act - 1];
  if (qs.length !== keys.length) throw new Error(`Le Menteur act ${act}: ${qs.length} questions, ${keys.length} keys`);
  qs.forEach((q, i) => {
    const id = `acte-${act}.q${i + 1}`;
    const key = keys[i];
    const refs = [...key.matchAll(/\[([IV]+),/g)].map((m) => ROMAN[m[1]]);
    const units = [...new Set([act, ...refs])].sort().map((a) => `acte-${a}`);
    menteurItems.push({ id, unit: units, type: 'open', question: q.replace(/^★\s*/, ''), answer: key, evidence: evidence[id] ?? [], tags: q.startsWith('★') ? ['star'] : [] });
  });
}

// Le Petit Poucet: numbered paragraphs [n]; keys end with [n].
const col = read('src/pages/college.html');
const poucetText = read('content/petit-poucet/text.txt');
const paras = [...poucetText.matchAll(/^\[(\d+)\]\s*(.+)$/gm)].map((m) => ({ id: `p${m[1]}`, label: `Paragraphe ${m[1]}`, text: m[2] }));
const qItems = topItems(section(col, 'pp-questions').match(/<ol class="q">([\s\S]*?)<\/ol>/)[1]);
const pKeys = topItems(section(col, 'pp-corrige').match(/<ol class="q">([\s\S]*?)<\/ol>/)[1]).map(strip);
if (qItems.length !== pKeys.length) throw new Error(`Petit Poucet: ${qItems.length} questions, ${pKeys.length} keys`);
const poucetItems = qItems.map((raw, i) => {
  const id = `poucet.q${i + 1}`;
  const opts = [...raw.matchAll(/<li>[a-d]\)\s*([\s\S]*?)<\/li>/g)].map((m) => strip(m[1]));
  const question = strip(raw.replace(/<ul class="opts">[\s\S]*?<\/ul>/, '').replace(/<p class="hint">[\s\S]*?<\/p>/, ''));
  const key = pKeys[i];
  const ref = key.match(/\[(\d+)\]\s*$/);
  const unit = ref ? [`p${ref[1]}`] : paras.map((p) => p.id);
  if (opts.length) {
    const letter = key.match(/^([a-d])\)/)[1].toUpperCase();
    return { id, unit, type: 'mc', question, options: opts, answer: letter, evidence: evidence[id] ?? [] };
  }
  return { id, unit, type: 'open', question, answer: key, evidence: evidence[id] ?? [] };
});

fs.mkdirSync(path.join(ROOT, 'qa/items'), { recursive: true });
const write = (name, set) => fs.writeFileSync(path.join(ROOT, 'qa/items', name), JSON.stringify(set, null, 1) + '\n');
write('le-menteur.json', { set: 'lectoclasse/le-menteur', title: 'Le Menteur', author: 'Pierre Corneille', language: 'fr', units: menteurUnits, items: menteurItems });
write('petit-poucet.json', { set: 'lectoclasse/petit-poucet', title: 'Le Petit Poucet', author: 'Charles Perrault', language: 'fr', units: paras, items: poucetItems });
console.log(`le-menteur: ${menteurItems.length} items, petit-poucet: ${poucetItems.length} items`);
