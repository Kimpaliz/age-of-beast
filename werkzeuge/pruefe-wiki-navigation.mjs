/* [Aufgabe: Prüfwesen]
   Prüft die sichtbare Trennung zwischen normalem Wiki und Werkstatt.

   Die Werkstatt bleibt über ihre eigene obere Schaltfläche erreichbar,
   erscheint aber weder links noch als normale Startseiten-Kategorie.
   Spielfiguren erhalten stattdessen einen direkten Charakterbogen-Zugang.
*/

import { liesDatei, macheMelder } from './helfer.mjs';
import vm from 'node:vm';

const { melde, ende } = macheMelder();

function node() {
  let html = '';
  const element = {
    dataset: {},
    insertAdjacentHTML() {},
    querySelector() { return null; },
    querySelectorAll() { return []; },
    removeAttribute() {},
    setAttribute() {},
    textContent: '',
  };
  Object.defineProperty(element, 'innerHTML', {
    get() { return html; },
    set(value) { html = String(value); },
  });
  return element;
}

const inhalt = node();
const navigation = node();
const body = node();
const welt = {
  titel: 'Prüfwelt',
  untertitel: 'Prüfung',
  standDerDaten: '2026-09-21T00:00:00.000Z',
  kategorien: [
    { schluessel: 'characters', name: 'Figuren', einzahl: 'Figur' },
    { schluessel: 'werkstatt', name: 'Werkstatt', einzahl: 'Werkstatt-Eintrag' },
  ],
  eintraege: [
    {
      id: 'figur-1', name: 'Brix Borin', kategorie: 'characters', unterart: 'Spielfigur',
      kurz: 'Eine Spielfigur.', spielwerte: { system: 'Daggerheart' }, abschnitte: [],
      attribute: [], verbindungen: [],
    },
    {
      id: 'werkstatt-1', name: 'Interner Baukasten', kategorie: 'werkstatt',
      unterart: 'Werkzeug', kurz: 'Nur in der Werkstatt.', abschnitte: [],
      attribute: [], verbindungen: [],
    },
  ],
};
const byId = new Map(welt.eintraege.map((entry) => [entry.id, entry]));
const categories = new Map(welt.kategorien.map((category) => [category.schluessel, category]));
const dataIndex = {
  eintragHolen(id) { return byId.get(id) || null; },
  erwaehntVonHolen() { return []; },
  kategorieHolen(key) { return welt.eintraege.filter((entry) => entry.kategorie === key); },
  kategorieInfoHolen(key) { return categories.get(key) || null; },
  reifegrad() { return 'knapp'; },
  verbundenVonHolen() { return []; },
  verknuepfungsZahl() { return 0; },
  verweiseSetzen() {},
  weltHolen() { return welt; },
};

const document = {
  body,
  title: '',
  getElementById(id) {
    if (id === 'inhalt') return inhalt;
    if (id === 'navigation') return navigation;
    return node();
  },
  querySelector() { return null; },
};
const window = { __aobLeserBausteine: {} };
new vm.Script(liesDatei('runtime/ansichten.js'), { filename: 'runtime/ansichten.js' })
  .runInNewContext({ document, window });

const views = window.__aobLeserBausteine.ansichten(dataIndex);
views.navigationZeichnen();
melde(navigation.innerHTML.includes('data-kategorie="characters"'),
  'Die normale Figuren-Kategorie erscheint links.');
melde(!navigation.innerHTML.includes('data-kategorie="werkstatt"'),
  'Die Werkstatt erscheint nicht in der linken Navigation.');

views.startseiteZeichnen();
melde(!inhalt.innerHTML.includes('data-filter="werkstatt"'),
  'Die Werkstatt erscheint nicht als Startseiten-Filter.');
melde(!inhalt.innerHTML.includes('data-kategorie="werkstatt"'),
  'Werkstatt-Einträge erscheinen nicht als normale Startseiten-Kacheln.');
melde(inhalt.innerHTML.includes('Arbeitsfläche &middot; 1 Eintrag'),
  'Die Startseiten-Zahl zählt nur normale Wiki-Einträge.');

views.kategorieZeichnen('werkstatt');
melde(inhalt.innerHTML.includes('class="werkstatt-seite"'),
  'Ein alter Werkstatt-Kategorielink öffnet die eigene Werkstatt-Ansicht.');
melde(!inhalt.innerHTML.includes('seitenkopf" data-kategorie="werkstatt"'),
  'Die Werkstatt wird auch über alte Links nicht als normale Wiki-Kategorie gezeigt.');

views.eintragZeichnen('figur-1');
melde(inhalt.innerHTML.includes('bogen.html?figur=figur-1'),
  'Ein Eintrag mit Spielwerten verlinkt seinen Charakterbogen.');
melde(inhalt.innerHTML.includes('Charakterbogen öffnen'),
  'Der Charakterbogen-Zugang ist verständlich beschriftet.');

views.eintragZeichnen('werkstatt-1');
melde(!inhalt.innerHTML.includes('bogen.html?figur=werkstatt-1'),
  'Ein normaler Werkstatt-Eintrag erhält keinen falschen Charakterbogen-Zugang.');

ende();
