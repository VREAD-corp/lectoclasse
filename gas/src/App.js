/** Site configuration read by Code.js (loaded first: file names are evaluated in alphabetical order). */
var APP = {
  name: 'Lectoclasse',
  site: 'lectoclasse',
  tz: 'Europe/Paris',
  sheetTitle: 'Lectoclasse : devis et statistiques (READ FRANCE SAS)',
  consentVersion: 'devis-2026-10-14',
  adminHash: 'e0e5de6f9ee11f6dbc77fb9408ef9111f5d04f2eb99931b165c3edc68347a642',
  events: ['view', 'sample_open', 'devis_open', 'sample_download', 'sample_print', 'text_download', 'oral_print', 'rallye_download', 'rallye_print',
    'order_start', 'checkout_open', 'paid', 'devis_submit', 'devis_ok', 'pilot_link_click'],
  xp: { 'lc-prix': ['p390', 'p290'] },   // licence établissement 390 € or 290 € (by day, cro.js)
  variantXp: 'lc-prix',
  // EUR, shown on the site (the server catalogue of octave-global-checkout is the price authority for card sales)
  offers: { etablissement: { p390: 390, p290: 290 }, college: 190, kits: 39, 'fle-100': 290, 'fle-400': 590, autre: 0 },
  works: ['pot-bouille', 'therese-raquin', 'servitude-volontaire', 'pluralite-des-mondes', 'lettres-peruvienne', 'on-ne-badine', 'cahier-de-douai'],
  roles: ['direction', 'lettres', 'cdi', 'gestion', 'fle', 'autre'],
  pupils: ['1-99', '100-299', '300-799', '800+'],
  currencies: ['eur', 'usd', 'autre'],
  payments: ['virement', 'carte', 'bon-de-commande', 'autre'],
};
