#!/usr/bin/env node
// Writes the kit pages src/pages/kits*.html (one page per public-domain bac work + the /kits/ hub) from the data below.
// Facts: BO n° 30 of 24 July 2025 (note MENE2518792N), read on education.gouv.fr on 2026-10-17; unit word counts are ours
// (whitespace tokens) on the Lectoguide transcriptions (lectoguide/content/guides/<slug>.json, sources/<slug>/), except
// Le Menteur, counted on this repo's text (content/checkpoints/le-menteur.json). Slugs = Lectoguide slugs.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const UPDATED = '2026-10-17';
const BO = 'https://www.education.gouv.fr/bo/2025/Hebdo30/MENE2518792N';
const LG = 'https://outils.vread.fr/lectoguide/';
const OE = {
  theatre: 'Le théâtre du XVIIe siècle au XXIe siècle',
  poesie: 'La poésie du XIXe siècle au XXIe siècle',
  roman: 'Le roman et le récit du Moyen Âge au XXIe siècle',
  idees: 'La littérature d’idées du XVIe siècle au XVIIIe siècle',
};
const fmt = (n) => n.toLocaleString('fr-FR').replace(/ /g, ' ');
// French typography on our own prose: non-breaking space before : ; ? ! and inside « ».
const typo = (s) => s.replace(/ ([:;?!»])/g, ' $1').replace(/« /g, '« ');

const KITS = [
  {
    slug: 'le-menteur', kit: null, short: 'Le Menteur', author: 'Corneille', year: '1644', voie: 'générale et technologique', oe: 'theatre',
    parcours: 'mensonge et comédie', status: 'maintenue',
    h1: '<i>Le Menteur</i> de Corneille : le kit de lecture gratuit, acte par acte',
    title: 'Le Menteur de Corneille : kit de lecture gratuit pour la classe de première | Lectoclasse',
    description: 'Kit gratuit sur Le Menteur (bac de français, épreuve de juin 2027) : 55 questions sur les 5 actes, un point de contrôle par acte, corrigé, fiche d’oral, texte intégral.',
    lead: 'Ce kit est terminé et gratuit : cinq fiches de questions, une par acte, le corrigé, une fiche d’oral et la pièce entière à imprimer. C’est aussi le modèle des sept autres kits de Lectoclasse.',
    text: 'Wikisource, d’après l’édition Charles Marty-Laveaux des <i>Œuvres</i> de Corneille (Hachette, 1862, tome IV), sans les notes ni les variantes de l’éditeur. La comédie est en alexandrins : le texte imprimé garde les vers ligne à ligne, avec les noms des personnages et les didascalies.',
    units: 'acte', rows: [['Fiche 1', 'Acte I', 3485, '12 questions'], ['Fiche 2', 'Acte II', 3332, '13 questions'], ['Fiche 3', 'Acte III', 3334, '10 questions'], ['Fiche 4', 'Acte IV', 3345, '11 questions'], ['Fiche 5', 'Acte V', 3535, '9 questions']],
    cut: 'Les cinq actes ont presque la même longueur, autour de 3 400 mots : une fiche par acte suffit, à donner après la lecture de l’acte. Les questions suivent l’ordre des scènes, et le corrigé donne l’acte et la scène de chaque réponse.',
    extra: '<p>La fiche d’oral porte sur le récit du faux mariage (acte II, scène 5), où Dorante invente devant son père un mariage secret à Poitiers : un extrait à lire, quatre questions pour construire l’explication, une question de grammaire et des questions pour l’entretien, avec des pistes de correction.</p>',
    sample: { label: 'Acte IV', q: 'Quel nom Dorante donne-t-il à son prétendu beau-père quand Géronte, avant d\'écrire, le lui redemande ?' },
  },
  {
    slug: 'on-ne-badine-pas-avec-l-amour', kit: 'on-ne-badine', short: 'On ne badine pas avec l’amour', author: 'Musset', year: '1834', voie: 'générale et technologique', oe: 'theatre',
    parcours: 'les jeux du cœur et de la parole', status: 'maintenue',
    h1: '<i>On ne badine pas avec l’amour</i> de Musset : un kit de lecture en trois fiches',
    title: 'On ne badine pas avec l’amour : kit de lecture à imprimer pour la première | Lectoclasse',
    description: 'Kit Lectoclasse sur On ne badine pas avec l’amour de Musset (bac, épreuve de juin 2027) : une fiche par acte, corrigé avec la scène, fiche d’oral, texte intégral. 39 €.',
    lead: 'Musset a écrit un proverbe en trois actes et en prose, découpé en 18 scènes courtes qui changent souvent de lieu. Le kit suit ce découpage : une fiche par acte, le corrigé, une fiche d’oral et le texte intégral à imprimer.',
    text: 'Wikisource, d’après l’édition de la Clarendon Press (Oxford, 1884), la transcription « On ne badine pas avec l’amour (1884) ». C’est le texte de la pièce publiée en 1834 ; les didascalies de lieu, en tête de chaque scène, sont conservées.',
    units: 'acte', rows: [['Fiche 1', 'Acte I (5 scènes)', 4026, ''], ['Fiche 2', 'Acte II (5 scènes)', 4724, ''], ['Fiche 3', 'Acte III (8 scènes)', 5269, '']],
    cut: 'L’acte III est le plus long et le plus découpé : huit scènes, qui passent du château à un chemin, au petit bois, à la chambre de Camille puis à l’oratoire. Sa fiche est la plus fournie. Le chœur parle dans les actes I et III et se tait dans l’acte II ; les questions de ces deux fiches lui en consacrent une partie, parce que les élèves oublient souvent ce qu’il a dit.',
    extra: '',
  },
  {
    slug: 'cahier-de-douai', kit: 'cahier-de-douai', short: 'Cahier de Douai', author: 'Rimbaud', year: '1870', voie: 'générale et technologique', oe: 'poesie',
    parcours: 'émancipations créatrices', status: 'maintenue',
    h1: 'Le <i>Cahier de Douai</i> de Rimbaud : un kit de lecture pour les 22 poèmes',
    title: 'Cahier de Douai de Rimbaud : kit de lecture des 22 poèmes, à imprimer | Lectoclasse',
    description: 'Kit Lectoclasse sur le Cahier de Douai (bac de français, épreuve de juin 2027) : les 22 poèmes au programme en 5 fiches, corrigé, fiche d’oral, texte à imprimer. 39 €.',
    lead: 'Le BO retient 22 poèmes, de « Première soirée » à « Ma Bohème (Fantaisie) ». Le kit les donne dans cet ordre, en cinq fiches de questions, avec le corrigé, une fiche d’oral et le recueil à imprimer.',
    text: 'Wikisource, d’après les <i>Poésies</i> de Rimbaud (Vanier, 1895), poèmes remis dans l’ordre du programme. Les éditions ne rangent pas toutes ces poèmes dans le même ordre : nous suivons celui qui va de « Première soirée » à « Ma Bohème (Fantaisie) », comme le libellé du BO, en indiquant le titre de chaque poème en tête de page.',
    units: 'groupe de poèmes', rows: [['Fiche 1', '« Première soirée », « Sensation », « Le Forgeron »', 1917, ''], ['Fiche 2', '« Soleil et Chair »', 1426, ''], ['Fiche 3', 'De « Ophélie » à « Les Reparties de Nina » (5 poèmes)', 1471, ''], ['Fiche 4', 'De « À la musique » à « Rages de Césars » (6 poèmes)', 1188, ''], ['Fiche 5', 'De « Rêvé pour l’hiver » à « Ma Bohème (Fantaisie) » (7 poèmes)', 903, '']],
    cut: 'Le recueil compte environ 6 900 mots, moins que la moitié d’une pièce de Corneille, mais les poèmes sont très inégaux : « Le Forgeron » (environ 1 650 mots) est vingt fois plus long que « Sensation » (70 mots). Nous avons donc regroupé les poèmes courts et donné une fiche entière à « Soleil et Chair ». La dernière fiche couvre les sept poèmes qui suivent « Rages de Césars », sonnets pour la plupart.',
    extra: '',
  },
  {
    slug: 'pot-bouille', kit: 'pot-bouille', short: 'Pot-Bouille', author: 'Zola', year: '1882', voie: 'générale', oe: 'roman',
    parcours: 'dévoiler les rouages de la société', status: 'renouvelée',
    h1: '<i>Pot-Bouille</i> de Zola : un kit de lecture en 18 fiches pour la première générale',
    title: 'Pot-Bouille de Zola : kit de lecture chapitre par chapitre, à imprimer | Lectoclasse',
    description: 'Kit Lectoclasse sur Pot-Bouille (voie générale, épreuve de juin 2027) : une fiche par chapitre (18), corrigé avec le chapitre, fiche d’oral, texte intégral. 39 €.',
    lead: '<i>Pot-Bouille</i> est la seule œuvre de Zola au programme de la voie générale cette année, et la plus longue des huit : environ 141 000 mots, plus de huit fois <i>Le Menteur</i>. Le kit la découpe en 18 fiches, une par chapitre, avec le corrigé, une fiche d’oral et le roman à imprimer.',
    text: 'Wikisource, d’après l’édition G. Charpentier (Paris, 1883), le texte du roman paru en volume en 1882. Il est imprimé sans notes ni préface d’éditeur moderne.',
    units: 'chapitre', rows: [6664, 6488, 7608, 6864, 7229, 7153, 7758, 8124, 7637, 6682, 8332, 8860, 9562, 7971, 9130, 7546, 9911, 7486].map((w, i) => [`Fiche ${i + 1}`, `Chapitre ${['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII'][i]}`, w, '']),
    cut: 'Les chapitres font entre 6 500 et 9 900 mots, soit deux à trois actes du <i>Menteur</i> chacun. Une fiche par chapitre permet de vérifier la lecture au fil des semaines plutôt qu’en une seule fois à la fin. À trois chapitres par semaine, la lecture prend six semaines. Le roman suit les habitants et les domestiques d’un même immeuble de la rue de Choiseul : les questions demandent souvent qui fait quoi et à quel étage : avec autant de personnages, c’est le premier point à vérifier.',
    extra: '',
  },
  {
    slug: 'therese-raquin', kit: 'therese-raquin', short: 'Thérèse Raquin', author: 'Zola', year: '1867', voie: 'technologique', oe: 'roman',
    parcours: 'anatomie des passions', status: 'renouvelée',
    h1: '<i>Thérèse Raquin</i> de Zola : un kit de lecture en 10 fiches pour la voie technologique',
    title: 'Thérèse Raquin de Zola : kit de lecture pour la première technologique | Lectoclasse',
    description: 'Kit Lectoclasse sur Thérèse Raquin (voie technologique, épreuve de juin 2027) : 32 chapitres en 10 fiches, corrigé avec le chapitre, fiche d’oral, texte intégral. 39 €.',
    lead: 'En voie technologique, <i>Thérèse Raquin</i> remplace <i>Pot-Bouille</i>. Le roman a 32 chapitres de longueur très inégale : le kit les regroupe en 10 fiches de questions, avec le corrigé, une fiche d’oral et le texte à imprimer.',
    text: 'Wikisource, d’après la deuxième édition (Librairie internationale, A. Lacroix, Verboeckhoven et Cie, Paris, 1868), celle où Zola ajoute sa préface datée du 15 avril 1868. Le texte imprimé reprend cette préface avant le chapitre I. Zola y répond aux critiques et écrit : « j’ai voulu étudier des tempéraments », une phrase qui rejoint directement le parcours « anatomie des passions ».',
    units: 'groupe de chapitres', rows: [['Fiche 1', 'Chapitres I à IV', 6260, ''], ['Fiche 2', 'Chapitres V à VIII', 7142, ''], ['Fiche 3', 'Chapitres IX à XI', 6910, ''], ['Fiche 4', 'Chapitres XII à XV', 5572, ''], ['Fiche 5', 'Chapitres XVI à XVIII', 6952, ''], ['Fiche 6', 'Chapitres XIX à XXI', 8540, ''], ['Fiche 7', 'Chapitres XXII à XXIV', 6073, ''], ['Fiche 8', 'Chapitres XXV à XXVII', 7368, ''], ['Fiche 9', 'Chapitres XXVIII à XXX', 8535, ''], ['Fiche 10', 'Chapitres XXXI et XXXII', 4453, '']],
    cut: 'Le chapitre XV fait moins de 500 mots, le chapitre XXI plus de 3 800 : une fiche par chapitre aurait donné des fiches vides et des fiches trop lourdes. Les groupes suivent l’intrigue. La fiche 3 s’arrête sur la promenade à Saint-Ouen (chapitre XI), la fiche 4 couvre les jours qui suivent, jusqu’aux soirées du jeudi qui reprennent, la fiche 6 va jusqu’à la nuit de noces. Le roman fait environ 68 000 mots, moitié moins que <i>Pot-Bouille</i>.',
    extra: '',
  },
  {
    slug: 'servitude-volontaire', kit: 'servitude-volontaire', short: 'Discours de la servitude volontaire', author: 'La Boétie', year: '1576', voie: 'générale et technologique', oe: 'idees',
    parcours: '« Défendre » et « entretenir » la liberté', status: 'maintenue',
    h1: 'Le <i>Discours de la servitude volontaire</i> de La Boétie : un kit en six fiches',
    title: 'Discours de la servitude volontaire : kit de lecture par paragraphes | Lectoclasse',
    description: 'Kit Lectoclasse sur le Discours de la servitude volontaire (bac de français, juin 2027) : 34 paragraphes en 6 fiches, glossaire, corrigé, fiche d’oral, texte. 39 €.',
    lead: 'Le <i>Discours</i> est un texte d’un seul tenant, sans chapitres ni titres, d’environ 12 600 mots. Le kit numérote ses 34 paragraphes et les répartit en six fiches de questions, avec un glossaire, le corrigé, une fiche d’oral et le texte à imprimer.',
    text: 'Wikisource, d’après le texte établi par Paul Bonnefon (Bossard, 1922). Bonnefon y a modernisé l’orthographe du XVIe siècle, mais il a gardé des mots et des formes anciennes (« ains », « meshui », « prindrent ») : le glossaire du kit les explique. Nous n’utilisons aucune « traduction » en français moderne, car ces versions récentes sont protégées.',
    units: 'groupe de paragraphes', rows: [['Fiche 1', '§ 1 à 10', 2666, ''], ['Fiche 2', '§ 11 à 13', 1396, ''], ['Fiche 3', '§ 14 à 18', 2748, ''], ['Fiche 4', '§ 19 à 24', 2712, ''], ['Fiche 5', '§ 25 à 29', 2105, ''], ['Fiche 6', '§ 30 à 34', 1012, '']],
    cut: 'Comme le texte n’a pas de divisions, toutes les références du kit se font par numéro de paragraphe, imprimé dans la marge du texte. Les six groupes sont ceux de la fiche Lectoguide : un élève qui a lu la fiche et un professeur qui a le kit parlent des mêmes passages. Le texte s’ouvre sur deux vers d’Homère cités par La Boétie : le premier paragraphe est donc imprimé avec ses vers, comme dans l’édition de 1922.',
    extra: '',
  },
  {
    slug: 'pluralite-des-mondes', kit: 'pluralite-des-mondes', short: 'Entretiens sur la pluralité des mondes', author: 'Fontenelle', year: '1686', voie: 'générale et technologique (voie technologique : Premier, Second et Troisième soirs)', oe: 'idees',
    parcours: 'le gout de la science', status: 'maintenue',
    h1: 'Les <i>Entretiens sur la pluralité des mondes</i> de Fontenelle : un kit soir par soir',
    title: 'Entretiens sur la pluralité des mondes : kit de lecture soir par soir | Lectoclasse',
    description: 'Kit Lectoclasse sur les Entretiens de Fontenelle (bac de français, juin 2027) : une fiche par soir, les 3 premiers pour la voie technologique, corrigé, fiche d’oral. 39 €.',
    lead: 'Fontenelle a construit son livre en « soirs » : des conversations avec une marquise, le soir, en se promenant dans un parc. Le kit suit ces six soirs, une fiche par soir, avec le corrigé, une fiche d’oral et le texte à imprimer. En voie technologique, les trois premières fiches couvrent tout le programme.',
    text: 'Wikisource, d’après l’édition Leroy (Lyon, 1800), avec la préface et l’épître « À Monsieur L… » qui ouvrent le livre.',
    units: 'soir', rows: [['Fiche 1', 'Préface, épître et Premier soir', 1998 + 6495, 'voie techno.'], ['Fiche 2', 'Second soir', 6239, 'voie techno.'], ['Fiche 3', 'Troisième soir', 5917, 'voie techno.'], ['Fiche 4', 'Quatrième soir', 6213, ''], ['Fiche 5', 'Cinquième soir', 5433, ''], ['Fiche 6', 'Sixième soir', 4853, '']],
    cut: 'Le BO limite la voie technologique aux Premier, Second et Troisième soirs : ces trois fiches peuvent être données seules, et le corrigé est découpé de la même façon. Chaque soir fait entre 4 800 et 6 500 mots. La préface est courte (environ 2 000 mots) : elle est rattachée à la première fiche, parce que Fontenelle y explique pourquoi il a mis dans ses <i>Entretiens</i> « une femme que l’on instruit ».',
    extra: '',
  },
  {
    slug: 'lettres-d-une-peruvienne', kit: 'lettres-peruvienne', short: 'Lettres d’une Péruvienne', author: 'Graffigny', year: '1747', voie: 'générale et technologique', oe: 'idees',
    parcours: '« un nouvel univers s’est offert à mes yeux »', status: 'maintenue',
    h1: 'Les <i>Lettres d’une Péruvienne</i> de Graffigny : un kit qui inclut les ajouts de 1752',
    title: 'Lettres d’une Péruvienne : kit de lecture avec les éléments de 1752 | Lectoclasse',
    description: 'Kit Lectoclasse sur les Lettres d’une Péruvienne (bac, juin 2027) : 38 lettres en 7 fiches, plus une fiche sur les éléments de 1752 demandés par le BO. Corrigé, oral. 39 €.',
    lead: 'Le BO ne demande pas seulement le roman de 1747 : il y ajoute l’Introduction historique et les lettres XXVIII, XXIX, XXX et XXXIV de l’édition augmentée de 1752. Le kit couvre les deux : sept fiches sur les 38 lettres de 1747, une huitième sur les éléments de 1752, avec le corrigé, une fiche d’oral et le texte à imprimer.',
    text: 'Wikisource, d’après la première édition (1747, avec l’« Avertissement »), dans l’orthographe d’origine (« étoit », « sçavoir »). Les éléments de 1752 ne sont pas transcrits sur Wikisource : nous les transcrivons nous-mêmes d’après les numérisations de l’édition de 1752 conservées sur Internet Archive. Au 17 octobre 2026, cette transcription est en cours.',
    units: 'groupe de lettres', rows: [['Fiche 1', 'Avertissement et lettres I à V', 5777, ''], ['Fiche 2', 'Lettres VI à XI', 3525, ''], ['Fiche 3', 'Lettres XII à XVII', 5275, ''], ['Fiche 4', 'Lettres XVIII à XXIII', 5529, ''], ['Fiche 5', 'Lettres XXIV à XXIX', 5621, ''], ['Fiche 6', 'Lettres XXX à XXXIII', 4221, ''], ['Fiche 7', 'Lettres XXXIV à XXXVIII', 2830, ''], ['Fiche 8', 'Introduction historique et lettres XXVIII, XXIX, XXX, XXXIV de 1752', null, 'en cours']],
    cut: 'Attention aux numéros : le BO vise les lettres XXVIII, XXIX, XXX et XXXIV de l’édition augmentée de 1752, et il ne faut pas les confondre avec les lettres qui portent ces numéros dans le texte de 1747. La fiche 8 cite donc toujours l’édition (« 1752, lettre XXIX »). Les sept premiers groupes suivent l’histoire de Zilia, de l’enlèvement au Temple du Soleil aux dernières lettres adressées à Déterville.',
    extra: '',
  },
];
const ORDER = KITS.map((k) => k.slug);

function rowsTable(k) {
  const total = k.rows.reduce((a, r) => a + (r[2] || 0), 0);
  const hasNote = k.rows.some((r) => r[3]);
  return `<div class="tablewrap"><table>
<thead><tr><th scope="col">Fiche</th><th scope="col">Partie du texte</th><th scope="col">Mots (notre comptage)</th>${hasNote ? '<th scope="col">Remarque</th>' : ''}</tr></thead>
<tbody>
${k.rows.map((r) => `<tr><td>${r[0]}</td><td>${r[1]}</td><td>${r[2] ? fmt(r[2]) : '–'}</td>${hasNote ? `<td>${r[3]}</td>` : ''}</tr>`).join('\n')}
</tbody>
</table></div>
<p class="small">Total : environ ${fmt(Math.round(total / 100) * 100)} mots${k.rows.some((r) => !r[2]) ? ' sans les éléments de 1752' : ''}. Comptage : mots séparés par des espaces, sur la transcription suivie.</p>`;
}

function kitPage(k) {
  const free = !k.kit;
  const cta = free
    ? `<a class="btn" href="{{href:/echantillon/}}" data-mesure="sample_open" data-detail="kit-le-menteur">Ouvrir le kit gratuit</a>`
    : `<a class="btn" href="{{href:/commander/}}?offre=kit&amp;oeuvre=${k.kit}" data-mesure="order_start" data-detail="kit-${k.kit.slice(0, 20)}">Pré-commander ce kit, 39 €</a>`;
  const status = free
    ? `<p>Le kit est prêt et gratuit, sans inscription : vous pouvez l’imprimer depuis la page web ou télécharger le PDF (12 pages) et le texte intégral (PDF de 27 pages sur deux colonnes).</p>`
    : `<p><strong>Pré-commande, livraison au plus tard le 30 novembre 2026.</strong> Ce kit est en préparation : il n’est pas encore livrable aujourd’hui. Vous payez maintenant 39 €, et les fichiers arrivent par e-mail dès qu’ils sont prêts. Si nous ne tenons pas la date, nous remboursons la totalité sans que vous ayez à le demander. Avant la livraison, un e-mail suffit pour annuler. Le kit est aussi compris dans la licence établissement (<span data-price-etab>390 €</span> pour l’année 2026-2027), qui couvre les huit kits du lycée et le rallye-lecture du collège.</p>`;
  const sample = k.sample
    ? `<h2>Un exemple : le point de contrôle de l’${k.sample.label.replace('Acte', 'acte')}</h2>
<p>Chaque fiche commence par une question dont la réponse est un seul mot du texte, pris au milieu de l’acte. Celle-ci ouvre la fiche 4 :</p>
<blockquote class="extract">${k.sample.q}</blockquote>
<p class="small">La réponse et sa scène sont dans le corrigé du kit. Avant publication, cette question a passé le moteur de lecture de READ FRANCE : une personne qui ne disposait que d’un résumé de l’acte n’a pas su y répondre.</p>`
    : '';
  const body = `<nav class="fil small" aria-label="Fil d’Ariane"><a href="{{href:/}}">Lectoclasse</a> › <a href="{{href:/kits/}}">Kits du bac</a> › ${k.short}</nav>
<p class="kicker">Kit Lectoclasse · bac de français, épreuve de juin 2027</p>
<h1>${k.h1}</h1>
<p class="lead">${k.lead}</p>
<div class="row">${cta}</div>

<section id="programme">
<h2>Ce que dit le programme</h2>
<div class="tablewrap"><table>
<tbody>
<tr><th scope="row">Voie</th><td>${k.voie}</td></tr>
<tr><th scope="row">Objet d’étude</th><td>${OE[k.oe]}</td></tr>
<tr><th scope="row">Parcours associé</th><td>« ${k.parcours.replace(/^«\s*|\s*»$/g, '')} »</td></tr>
<tr><th scope="row">Dans la liste 2026-2027</th><td>${k.status === 'renouvelée' ? 'œuvre nouvelle : le BO renouvelle cette année les œuvres du roman et du récit' : 'œuvre maintenue : le BO garde cette année les œuvres de cet objet d’étude'}</td></tr>
</tbody>
</table></div>
<p class="small">Source : note de service du 4 juillet 2025, NOR MENE2518792N, <a href="${BO}" rel="noopener">Bulletin officiel n° 30 du 24 juillet 2025</a>, programme d’œuvres de première pour l’année 2026-2027 (épreuves anticipées de juin 2027). Lu sur education.gouv.fr le 17 octobre 2026.</p>
<p>Le kit sert à la lecture de l’œuvre intégrale. Il ne fournit pas le parcours lui-même, c’est-à-dire les textes complémentaires que vous choisissez autour de l’œuvre.</p>
</section>

<section id="texte">
<h2>Le texte que vous imprimez</h2>
<p>${k.text}</p>
<p>Le texte est dans le domaine public : l’établissement l’imprime pour ses élèves autant de fois qu’il le faut. Le détail des droits est sur la page <a href="{{href:/oeuvres/}}">œuvres et droits</a>.</p>
</section>

<section id="decoupage">
<h2>Comment le kit découpe l’œuvre</h2>
<p>${k.cut}</p>
${rowsTable(k)}
${k.extra}
</section>

${sample}
<section id="contenu">
<h2>Ce que contient le kit</h2>
<ul>
<li>Le texte intégral en PDF à imprimer, avec la source et l’édition indiquées.</li>
<li>${k.rows.length} fiches de questions, une par ${k.units}, à faire sans le livre en 15 à 20 minutes. Les réponses sont courtes et portent sur des détails du texte, dans l’ordre de la lecture.</li>
<li>En tête de chaque fiche, un point de contrôle : une question dont la réponse est un mot du texte.</li>
<li>Un corrigé à part, où chaque réponse renvoie à l’endroit du texte (${k.units === 'acte' ? 'acte et scène' : k.units === 'groupe de paragraphes' ? 'numéro de paragraphe' : k.units === 'soir' ? 'soir' : k.units === 'groupe de lettres' ? 'numéro de lettre' : k.units === 'groupe de poèmes' ? 'titre du poème' : 'chapitre'}).</li>
<li>Une fiche d’oral : un extrait à expliquer, une question de grammaire et des questions pour l’entretien, avec des pistes de correction.</li>
${k.slug === 'servitude-volontaire' ? '<li>Un glossaire des mots anciens que garde l’édition de 1922, écrit par nous.</li>\n' : ''}</ul>
<p>Avant d’entrer dans un kit, chaque question passe le moteur de lecture de READ FRANCE : une question à laquelle on peut répondre avec un simple résumé est réécrite. Les fiches vérifient qu’un texte a été lu de près ; elles ne remplacent ni l’explication en classe ni votre propre lecture du corrigé.</p>
</section>

<section id="statut">
<h2>${free ? 'Disponible maintenant' : 'Prix et date de livraison'}</h2>
${status}
<p>${free ? 'Le kit gratuit est ouvert à tous. Les kits payants et les licences s’adressent aux établissements français situés hors de l’Union européenne (et hors de Monaco).' : 'Lectoclasse s’adresse aux établissements français situés hors de l’Union européenne (et hors de Monaco) : le paiement par carte refuse ces pays. Pour payer par virement ou sur facture, passez par la <a href="{{href:/devis/}}">demande de devis</a>.'}</p>
</section>

<section id="eleves">
<h2>Pour les élèves : la fiche Lectoguide</h2>
<p>Sur Lectoguide, la <a href="${LG}${k.slug}/">fiche de lecture gratuite consacrée à <i>${k.short}</i></a> donne le résumé de chaque partie, des passages clés avec leur référence et cinq questions pour vérifier sa lecture. Elle est publiée par READ FRANCE, comme Lectoclasse. Ses cinq questions peuvent porter sur des détails que les fiches du kit demandent aussi : donnez-la plutôt après vos fiches qu’avant.</p>
<p>Les autres kits : ${KITS.filter((x) => x.slug !== k.slug).map((x) => `<a href="{{href:/kits/${x.slug}/}}"><i>${x.short}</i></a> (${x.author})`).join(', ')}. Tous sont sur la page <a href="{{href:/kits/}}">kits du bac</a>.</p>
</section>`;
  const url = `https://outils.vread.fr/lectoclasse/kits/${k.slug}/`;
  const book = { '@type': 'Book', name: k.short, author: { '@type': 'Person', name: { Corneille: 'Pierre Corneille', Musset: 'Alfred de Musset', Rimbaud: 'Arthur Rimbaud', Zola: 'Émile Zola', 'La Boétie': 'Étienne de La Boétie', Fontenelle: 'Bernard Le Bouyer de Fontenelle', Graffigny: 'Françoise de Graffigny' }[k.author] }, inLanguage: 'fr' };
  const schema = [
    { '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Lectoclasse', item: 'https://outils.vread.fr/lectoclasse/' },
      { '@type': 'ListItem', position: 2, name: 'Kits du bac', item: 'https://outils.vread.fr/lectoclasse/kits/' },
      { '@type': 'ListItem', position: 3, name: k.short, item: url }] },
    free
      ? { '@type': 'LearningResource', name: `Kit de lecture : ${k.short}`, url, inLanguage: 'fr', isAccessibleForFree: true, educationalLevel: 'Première', about: book, dateModified: UPDATED, learningResourceType: ['questionnaire', 'corrigé', 'fiche d’oral'] }
      : { '@type': 'Product', name: `Kit Lectoclasse : ${k.short}`, brand: { '@type': 'Brand', name: 'Lectoclasse' }, url, description: k.description,
          offers: { '@type': 'Offer', price: '39', priceCurrency: 'EUR', availability: 'https://schema.org/PreOrder', url: `https://outils.vread.fr/lectoclasse/commander/?offre=kit&oeuvre=${k.kit}` }, subjectOf: book },
  ];
  const meta = { path: `/kits/${k.slug}/`, page: 'kit', updated: UPDATED, title: k.title, description: k.description, schema };
  return `<!--meta ${JSON.stringify(meta)}-->\n${typo(body)}\n`;
}

function hubPage() {
  const body = `<nav class="fil small" aria-label="Fil d’Ariane"><a href="{{href:/}}">Lectoclasse</a> › Kits du bac</nav>
<p class="kicker">Bac de français, épreuve de juin 2027</p>
<h1>Les huit kits de lecture des œuvres du bac dans le domaine public</h1>
<p class="lead">Une page par œuvre : ce que dit le programme, l’édition imprimée, le découpage en fiches et l’état du kit. Le kit du <i>Menteur</i> est prêt et gratuit ; les sept autres sont en pré-commande, livrés au plus tard le 30 novembre 2026.</p>
<div class="tablewrap"><table>
<thead><tr><th scope="col">Œuvre</th><th scope="col">Voie</th><th scope="col">Objet d’étude</th><th scope="col">Fiches</th><th scope="col">Kit</th></tr></thead>
<tbody>
${KITS.map((k) => `<tr><td><a href="{{href:/kits/${k.slug}/}}">${k.author}, <i>${k.short}</i></a></td><td>${k.voie.replace(/ \(voie technologique : .*\)$/, ' (techno. : soirs 1 à 3)')}</td><td>${OE[k.oe].replace(/ du .*$/, '')}</td><td>${k.rows.length}, par ${k.units}</td><td>${k.kit ? 'pré-commande, 39 €' : '<span class="yes">gratuit, prêt</span>'}</td></tr>`).join('\n')}
</tbody>
</table></div>
<p class="small">Liste : note de service MENE2518792N du 4 juillet 2025, <a href="${BO}" rel="noopener">BO n° 30 du 24 juillet 2025</a>, lue le 17 octobre 2026. Dans chaque voie, 7 des 12 œuvres du programme sont couvertes : <i>Pot-Bouille</i> n’est au programme que de la voie générale, <i>Thérèse Raquin</i> que de la voie technologique. Les cinq autres œuvres sont protégées par le droit d’auteur (voir <a href="{{href:/oeuvres/}}">œuvres et droits</a>).</p>

<section id="choisir">
<h2>Kit à l’unité ou licence ?</h2>
<p>Un kit coûte 39 € et couvre une œuvre pour les élèves de votre établissement. Dès que l’équipe de lettres étudie plusieurs de ces œuvres, la licence établissement (<span data-price-etab>390 €</span> pour l’année 2026-2027) revient moins cher : elle comprend les huit kits du lycée et le rallye-lecture du collège. Paiement par carte en euros, ou sur devis par virement, pour les établissements situés hors de l’Union européenne.</p>
<div class="row"><a class="btn" href="{{href:/commander/}}" data-mesure="order_start" data-detail="kits-hub">Voir les offres et commander</a></div>
<p>Avant de commander, regardez le <a href="{{href:/echantillon/}}">kit complet du <i>Menteur</i></a> : les sept autres suivent le même modèle. Pour les élèves, chaque œuvre a aussi une fiche de lecture gratuite sur <a href="${LG}">Lectoguide</a>.</p>
</section>`;
  const schema = [
    { '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Lectoclasse', item: 'https://outils.vread.fr/lectoclasse/' },
      { '@type': 'ListItem', position: 2, name: 'Kits du bac', item: 'https://outils.vread.fr/lectoclasse/kits/' }] },
    { '@type': 'ItemList', name: 'Kits Lectoclasse des œuvres du bac de français dans le domaine public', itemListElement: KITS.map((k, i) => ({ '@type': 'ListItem', position: i + 1, url: `https://outils.vread.fr/lectoclasse/kits/${k.slug}/`, name: k.short })) },
  ];
  const meta = { path: '/kits/', page: 'kits', updated: UPDATED, title: 'Kits de lecture des 8 œuvres du bac de français dans le domaine public | Lectoclasse',
    description: 'Les huit œuvres du domaine public au programme de l’épreuve de juin 2027 : voie, objet d’étude, découpage en fiches et état de chaque kit Lectoclasse.', schema };
  return `<!--meta ${JSON.stringify(meta)}-->\n${typo(body)}\n`;
}

const dir = path.join(ROOT, 'src/pages');
for (const f of fs.readdirSync(dir)) if (/^kits(-.*)?\.html$/.test(f)) fs.rmSync(path.join(dir, f));
fs.writeFileSync(path.join(dir, 'kits.html'), hubPage());
for (const k of KITS) fs.writeFileSync(path.join(dir, `kits-${k.slug}.html`), kitPage(k));
export { KITS, ORDER };
