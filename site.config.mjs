// Site configuration read by build.mjs and the tests.
const ORG = { '@type': 'Organization', name: 'READ FRANCE SAS', url: 'https://outils.vread.fr/lectoclasse/', email: 'octave@vread.fr',
  address: { '@type': 'PostalAddress', streetAddress: '11 rue Rouvet', postalCode: '75019', addressLocality: 'Paris', addressCountry: 'FR' } };
const MENTEUR = { '@type': 'Book', name: 'Le Menteur', author: { '@type': 'Person', name: 'Pierre Corneille' }, datePublished: '1644', inLanguage: 'fr' };

export default {
  repo: 'lectoclasse',
  site: 'lectoclasse',
  brand: 'Lectoclasse',
  logo: 'Lecto<span>classe</span> <small>par READ FRANCE</small>',
  accent: '#8e2f1c',
  api: 'https://script.google.com/macros/s/AKfycbzvBNaesku3n73KpIfj_CPWEQwZgd5oflkM2eRHDvXS3agUVAERdJFQK56KTcDcPOxguQ/exec',
  consentVersion: 'devis-2026-10-14',
  variantXp: 'lc-prix',
  venture: 'v4-47',
  // A/B on the licence établissement: p390 = 390 €, p290 = 290 €. Alternates by calendar day (Paris), no storage.
  // ?prix=p390|p290 forces one. Every [data-price-etab] element is swapped.
  xp: [{ id: 'lc-prix', variants: ['p390', 'p290'], mode: 'day', tz: 'Europe/Paris', param: 'prix',
    swap: { p290: [['[data-price-etab]', 'text', '290 €']] } }],
  products: {
    etablissement: { p390: ['lectoclasse-etab-390', 39000], p290: ['lectoclasse-etab-290', 29000] },
    college: ['lectoclasse-college-190', 19000],
    kits: {
      'pot-bouille': ['lectoclasse-kit-pot-bouille-39', 3900, 'Zola, Pot-Bouille'],
      'therese-raquin': ['lectoclasse-kit-therese-raquin-39', 3900, 'Zola, Thérèse Raquin'],
      'servitude-volontaire': ['lectoclasse-kit-servitude-volontaire-39', 3900, 'La Boétie, Discours de la servitude volontaire'],
      'pluralite-des-mondes': ['lectoclasse-kit-pluralite-des-mondes-39', 3900, 'Fontenelle, Entretiens sur la pluralité des mondes'],
      'lettres-peruvienne': ['lectoclasse-kit-lettres-peruvienne-39', 3900, 'Graffigny, Lettres d’une Péruvienne'],
      'on-ne-badine': ['lectoclasse-kit-on-ne-badine-39', 3900, 'Musset, On ne badine pas avec l’amour'],
      'cahier-de-douai': ['lectoclasse-kit-cahier-de-douai-39', 3900, 'Rimbaud, Cahier de Douai'],
    },
  },
  deliveryDate: '30 novembre 2026',
  nav: [['Lycées', '/'], ['Kit gratuit', '/echantillon/'], ['Collège', '/college/'], ['FLE', '/fle/'], ['Commander', '/commander/'], ['Devis', '/devis/']],
  scripts: ['app.js'],
  static: [['src/static/lectoclasse-le-menteur-kit.pdf', 'echantillon/lectoclasse-le-menteur-kit.pdf'], ['src/static/le-menteur-texte-integral.pdf', 'echantillon/le-menteur-texte-integral.pdf'], ['src/static/lectoclasse-petit-poucet-rallye.pdf', 'college/lectoclasse-petit-poucet-rallye.pdf']],
  // Never claim an official status, an AEFE or ministry endorsement, a reading proof or a result.
  claims: [/homologu[ée] par Lectoclasse/i, /(ressource|produit|kit|partenaire|site) officiel/i, /partenaire de l.AEFE/i, /agréé/i, /garanti/i, /certifi/i, /savoir qui a (vraiment )?lu/i, /session 2027/i],
  footerNote: 'Ressource privée, sans lien avec l’AEFE ni avec le ministère de l’Éducation nationale.',
  schema(p, url) {
    if (p.page === 'home') return [{ '@type': 'WebPage', name: p.title, url, inLanguage: 'fr', description: p.description, publisher: ORG },
      { '@type': 'Product', name: 'Lectoclasse : kits de lecture sur les œuvres du bac de français (épreuve de juin 2027)', brand: { '@type': 'Brand', name: 'Lectoclasse' },
        description: 'Textes du domaine public à imprimer, questions par acte ou par chapitre, corrigés et fiches d’oral, pour les établissements français hors Union européenne.',
        url, offers: { '@type': 'AggregateOffer', priceCurrency: 'EUR', lowPrice: '39', highPrice: '390', offerCount: '10', availability: 'https://schema.org/PreOrder', seller: ORG } }];
    if (p.page === 'sample') return { '@type': 'LearningResource', name: 'Le Menteur de Corneille : kit de lecture complet', url, inLanguage: 'fr', isAccessibleForFree: true,
      learningResourceType: ['questionnaire', 'corrigé', 'fiche d’oral'], educationalLevel: 'Première', about: MENTEUR, author: ORG, publisher: ORG,
      license: 'https://outils.vread.fr/lectoclasse/oeuvres/', datePublished: '2026-10-14', description: p.description };
    if (p.page === 'college') return { '@type': 'LearningResource', name: 'Rallye-lecture : Le Petit Poucet (exemple gratuit)', url, inLanguage: 'fr', isAccessibleForFree: true,
      learningResourceType: ['questionnaire', 'corrigé'], educationalLevel: 'Sixième', about: { '@type': 'Book', name: 'Le Petit Poucet', author: { '@type': 'Person', name: 'Charles Perrault' }, datePublished: '1697' },
      author: ORG, publisher: ORG, datePublished: '2026-10-14', description: p.description };
    if (p.page) return { '@type': 'WebPage', name: p.title, url, inLanguage: 'fr', description: p.description, publisher: ORG };
    return null;
  },
};
