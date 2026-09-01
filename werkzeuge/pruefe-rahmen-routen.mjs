/**
 * Regressionstest für Paket B: Routing und Kampagnenrahmen-Assistent.
 *
 * Der Wiki-Client läuft im Browser, dieser Test bewusst nicht: Er verwendet
 * ausschließlich Node-Standardbibliothek und eine kleine DOM-Attrappe. Damit
 * prüft er die öffentliche Host-Schnittstelle bei einem echten Hash-Deep-Link
 * sowie den asynchronen Renderer-Vertrag ohne Browser, Paketmanager,
 * Netzwerkzugriff oder temporäre Dateien.
 *
 * Eine vollständige Browser-DOM-Prüfung bleibt zusätzlich sinnvoll. Die hier
 * geprüften Invarianten sind aber der schmale, lokal ausführbare Vertrag:
 *
 *   - `window.ageOfBeast` steht vor dem ersten Rahmen-Initialrender bereit;
 *   - `rahmenRendererRegistrieren(renderer)` registriert kontrolliert und
 *     zeichnet nur eine offene Rahmenroute erneut;
 *   - der Renderer erhält einen Generation-/Aktualitätskontext;
 *   - ein nach `await beschreibungLaden()` veralteter Assistent schreibt weder
 *     im Erfolgs- noch im Fehlerpfad in den Inhaltsbereich.
 *
 * Aufruf:
 *   node werkzeuge/pruefe-rahmen-routen.mjs
 */

import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const HIER = dirname(fileURLToPath(import.meta.url));
// Standardmäßig prüft das Skript sein eigenes Repository. Die optionale
// Variable ist nur für einen lesenden Integrationslauf gegen einen anderen
// vorhandenen Worktree gedacht; sie erzeugt oder verändert keine Dateien.
const WURZEL = process.env.AGE_OF_BEAST_PRUEFWURZEL
  ? resolve(process.env.AGE_OF_BEAST_PRUEFWURZEL)
  : join(HIER, '..');
const WIKI_DATEI = join(WURZEL, 'wiki.js');
const RUNTIME_DATEIEN = [
  join(WURZEL, 'runtime', 'symbole.js'),
  join(WURZEL, 'runtime', 'datenindex.js'),
  join(WURZEL, 'runtime', 'ansichten.js'),
  join(WURZEL, 'runtime', 'interaktion.js'),
  join(WURZEL, 'runtime', 'routing.js'),
];
const ASSISTENT_DATEI = join(WURZEL, 'rahmen-assistent.js');

const fehler = [];
let pruefungen = 0;

function pruefe(bedingung, meldung) {
  pruefungen += 1;
  if (!bedingung) fehler.push(meldung);
}

function fehlermeldung(abschnitt, grund) {
  pruefungen += 1;
  fehler.push(abschnitt + ': ' + grund);
}

function klassenListe() {
  const klassen = new Set();
  return {
    add(...namen) { namen.forEach((name) => klassen.add(name)); },
    remove(...namen) { namen.forEach((name) => klassen.delete(name)); },
    contains(name) { return klassen.has(name); },
    toggle(name, erzwingen) {
      const aktiv = erzwingen === undefined ? !klassen.has(name) : Boolean(erzwingen);
      if (aktiv) klassen.add(name);
      else klassen.delete(name);
      return aktiv;
    },
  };
}

/**
 * Minimaler DOM-Knoten für den Routing-Host. Der Test braucht absichtlich
 * keinen HTML-Parser: Es genügt die Oberfläche, die wiki.js beim Deep-Link
 * vor dem eigentlichen Rahmen-Renderer berührt.
 */
function domKnoten(name, protokoll) {
  let html = '';
  const knoten = {
    name,
    classList: klassenListe(),
    dataset: {},
    style: {},
    hidden: false,
    textContent: '',
    value: '',
    firstElementChild: { textContent: '' },
    parentElement: null,
    parentNode: null,
    tagName: 'DIV',
    addEventListener() {},
    append() {},
    appendChild() {},
    after() {},
    blur() {},
    closest() { return null; },
    focus() {},
    getBoundingClientRect() {
      return { left: 0, top: 0, right: 0, bottom: 0, width: 0, height: 0 };
    },
    insertAdjacentHTML(stelle, wert) {
      protokoll.push({ art: 'eingefuegt', knoten: name, stelle, wert: String(wert) });
    },
    querySelector() { return null; },
    querySelectorAll() { return []; },
    remove() {},
    removeAttribute() {},
    replaceChild() {},
    replaceChildren() {},
    select() {},
    setAttribute() {},
  };

  Object.defineProperty(knoten, 'innerHTML', {
    get() { return html; },
    set(wert) {
      html = String(wert);
      if (name === 'inhalt') protokoll.push({ art: 'inhalt', wert: html });
    },
  });

  return knoten;
}

/** Erzeugt einen isolierten, nur für wiki.js ausreichenden Browser-Stand. */
function wikiPruefstand() {
  const protokoll = [];
  const elemente = new Map();
  const ereignisse = new Map();
  const location = { hash: '#/rahmen/rahmen-probe' };
  let fassade;

  const element = (id) => {
    if (!elemente.has(id)) elemente.set(id, domKnoten(id, protokoll));
    return elemente.get(id);
  };

  const documentElement = domKnoten('html', protokoll);
  const document = {
    activeElement: { tagName: 'BODY' },
    documentElement,
    title: '',
    addEventListener() {},
    createDocumentFragment() { return domKnoten('fragment', protokoll); },
    createElement() { return domKnoten('element', protokoll); },
    createTextNode() { return domKnoten('text', protokoll); },
    createTreeWalker() {
      return { currentNode: null, nextNode() { return false; } };
    },
    getElementById: element,
    /* Der Symbolvorrat wird einmalig in den Body gehaengt. Ohne diese
       beiden Eintraege liefe die Laufzeitprobe an der Stelle vorbei. */
    body: element('body'),
    querySelector() { return null; },
  };

  const speicher = new Map();
  const localStorage = {
    getItem(schluessel) { return speicher.has(schluessel) ? speicher.get(schluessel) : null; },
    setItem(schluessel, wert) { speicher.set(schluessel, String(wert)); },
  };

  const window = {
    AGE_OF_BEAST_WELT: {
      titel: 'Prüfwelt',
      untertitel: 'Laufzeitvertrag',
      standDerDaten: '2026-09-01T00:00:00.000Z',
      kategorien: [],
      eintraege: [],
      woerterbuch: {},
    },
    innerHeight: 900,
    location,
    matchMedia() { return { matches: false }; },
    scrollX: 0,
    scrollY: 0,
    addEventListener(art, rueckruf) {
      const liste = ereignisse.get(art) || [];
      liste.push(rueckruf);
      ereignisse.set(art, liste);
    },
    scrollTo() {},
  };

  Object.defineProperty(window, 'ageOfBeast', {
    configurable: true,
    get() { return fassade; },
    set(wert) {
      fassade = wert;
      protokoll.push({ art: 'fassade' });
    },
  });

  const requestAnimationFrame = () => 0;
  const setTimeout = () => 0;
  window.requestAnimationFrame = requestAnimationFrame;
  window.setTimeout = setTimeout;

  const sandkasten = {
    NodeFilter: { FILTER_ACCEPT: 1, FILTER_REJECT: 2, SHOW_TEXT: 4 },
    clearTimeout() {},
    console,
    document,
    localStorage,
    location,
    requestAnimationFrame,
    setTimeout,
    window,
  };

  return {
    ausloesen(art) {
      for (const rueckruf of ereignisse.get(art) || []) rueckruf({ type: art });
    },
    get fassade() { return fassade; },
    listenerZahl(art) { return (ereignisse.get(art) || []).length; },
    location,
    protokoll,
    sandkasten,
  };
}

function hostPruefen(runtimeQuelltexte, wikiQuelltext) {
  const stand = wikiPruefstand();
  try {
    for (let index = 0; index < runtimeQuelltexte.length; index += 1) {
      new vm.Script(runtimeQuelltexte[index], { filename: RUNTIME_DATEIEN[index] }).runInNewContext(stand.sandkasten);
    }
    new vm.Script(wikiQuelltext, { filename: WIKI_DATEI }).runInNewContext(stand.sandkasten);
  } catch (fehlerBeimStart) {
    fehlermeldung(
      'wiki.js / Rahmen-Deep-Link',
      'Der frische Aufruf #/rahmen/rahmen-probe bricht vor der Registrierung ab: ' +
        (fehlerBeimStart?.message || String(fehlerBeimStart)),
    );
    return;
  }

  const fassade = stand.fassade;
  pruefe(
    Boolean(fassade),
    'wiki.js / öffentliche Fassade: window.ageOfBeast wurde beim Start nicht bereitgestellt.',
  );
  pruefe(
    stand.listenerZahl('hashchange') === 1,
    'wiki.js / Leseruntime: Der Start muss genau einen hashchange-Listener installieren.',
  );
  let nachRenderAufrufe = 0;
  const abmelden = fassade.beiNeuZeichnen(() => { nachRenderAufrufe += 1; });
  pruefe(nachRenderAufrufe === 1, 'wiki.js / Leseruntime: beiNeuZeichnen() muss sofort genau einmal laufen.');
  const globaleVorher = ['hashchange', 'resize', 'scroll'].map((art) => stand.listenerZahl(art)).join(':');
  stand.location.hash = '#/werkstatt';
  stand.ausloesen('hashchange');
  pruefe(nachRenderAufrufe === 2, 'wiki.js / Leseruntime: Ein Routenrender muss den Rückruf genau einmal ausführen.');
  pruefe(globaleVorher === ['hashchange', 'resize', 'scroll'].map((art) => stand.listenerZahl(art)).join(':'), 'wiki.js / Leseruntime: Routenwechsel dürfen keine globalen Listener duplizieren.');
  pruefe(fassade.beiNeuZeichnen(null) === undefined, 'wiki.js / Leseruntime: Ungültige Nachrender-Rückrufe bleiben ein stiller No-op.');
  abmelden?.();
  stand.location.hash = '#/rahmen/rahmen-probe';
  stand.ausloesen('hashchange');
  if (!fassade) return;

  const fassadeStelle = stand.protokoll.findIndex((eintrag) => eintrag.art === 'fassade');
  const ersterInhalt = stand.protokoll.findIndex((eintrag) => eintrag.art === 'inhalt');
  pruefe(
    fassadeStelle !== -1 && (ersterInhalt === -1 || fassadeStelle < ersterInhalt),
    'wiki.js / öffentliche Fassade: Sie muss vor dem ersten Initialrender der Rahmenroute gesetzt werden.',
  );

  pruefe(
    typeof fassade.rahmenRendererRegistrieren === 'function',
    'wiki.js / Rahmen-Host: window.ageOfBeast.rahmenRendererRegistrieren(renderer) fehlt.',
  );
  if (typeof fassade.rahmenRendererRegistrieren !== 'function') return;

  let ungueltig;
  try {
    ungueltig = fassade.rahmenRendererRegistrieren(null);
  } catch (fehlerBeiUngueltigemRenderer) {
    fehlermeldung(
      'wiki.js / Rahmen-Host',
      'Eine ungültige Registrierung wirft statt kontrolliert false zu liefern: ' +
        (fehlerBeiUngueltigemRenderer?.message || String(fehlerBeiUngueltigemRenderer)),
    );
  }
  pruefe(
    ungueltig === false,
    'wiki.js / Rahmen-Host: Eine ungültige Renderer-Registrierung muss false liefern.',
  );

  const aufrufe = [];
  const renderer = (inhalt, rahmenId, kontext) => {
    aufrufe.push({ inhalt, rahmenId, kontext });
  };

  let registriert;
  try {
    registriert = fassade.rahmenRendererRegistrieren(renderer);
  } catch (fehlerBeiRegistrierung) {
    fehlermeldung(
      'wiki.js / Rahmen-Host',
      'Die gültige Renderer-Registrierung wirft einen Fehler: ' +
        (fehlerBeiRegistrierung?.message || String(fehlerBeiRegistrierung)),
    );
  }
  pruefe(registriert === true, 'wiki.js / Rahmen-Host: Eine gültige Renderer-Registrierung muss true liefern.');
  pruefe(
    aufrufe.length === 1,
    'wiki.js / Rahmen-Host: Die Registrierung muss eine bereits offene #/rahmen/<id>-Route genau einmal kontrolliert neu zeichnen.',
  );
  if (!aufrufe.length) return;

  const ersterAufruf = aufrufe[0];
  pruefe(
    ersterAufruf.rahmenId === 'rahmen-probe',
    'wiki.js / Rahmen-Host: Der registrierte Renderer erhielt nicht die ID der offenen Rahmenroute.',
  );
  pruefe(
    ersterAufruf.kontext && typeof ersterAufruf.kontext.istNochAktuell === 'function',
    'wiki.js / Rahmen-Host: Der Renderer erhielt keinen optionalen Aktualitätskontext mit istNochAktuell().',
  );
  pruefe(
    ersterAufruf.kontext && typeof ersterAufruf.kontext.generation === 'number',
    'wiki.js / Rahmen-Host: Der Aktualitätskontext muss eine numerische Render-Generation enthalten.',
  );
  if (!ersterAufruf.kontext || typeof ersterAufruf.kontext.istNochAktuell !== 'function') return;

  pruefe(
    ersterAufruf.kontext.istNochAktuell() === true,
    'wiki.js / Rahmen-Host: Der Kontext einer gerade gezeichneten Rahmenroute muss aktuell sein.',
  );

  // Ein geänderter Hash invalidiert sofort. Der Test löst absichtlich noch
  // kein hashchange aus: Die Guard darf nicht auf das nächste Render warten.
  stand.location.hash = '#/rahmen/anderer-rahmen';
  pruefe(
    ersterAufruf.kontext.istNochAktuell() === false,
    'wiki.js / Rahmen-Host: Ein Kontext muss bei Wechsel auf eine andere Rahmen-ID sofort veralten.',
  );

  stand.location.hash = '#/werkstatt';
  stand.ausloesen('hashchange');

  let fremdeAufrufe = 0;
  const andererRenderer = () => { fremdeAufrufe += 1; };
  let zweiteRegistrierung;
  try {
    zweiteRegistrierung = fassade.rahmenRendererRegistrieren(andererRenderer);
  } catch (fehlerBeiZweiterRegistrierung) {
    fehlermeldung(
      'wiki.js / Rahmen-Host',
      'Die Registrierung außerhalb einer Rahmenroute wirft einen Fehler: ' +
        (fehlerBeiZweiterRegistrierung?.message || String(fehlerBeiZweiterRegistrierung)),
    );
  }
  pruefe(
    zweiteRegistrierung === true,
    'wiki.js / Rahmen-Host: Eine weitere gültige Renderer-Registrierung muss true liefern.',
  );
  pruefe(
    fremdeAufrufe === 0,
    'wiki.js / Rahmen-Host: Außerhalb einer offenen Rahmenroute darf die Registrierung nicht neu zeichnen.',
  );
}

function aufschub() {
  let erfuellen;
  let ablehnen;
  const versprechen = new Promise((resolve, reject) => {
    erfuellen = resolve;
    ablehnen = reject;
  });
  return { ablehnen, erfuellen, versprechen };
}

function inhaltMitSchreibfalle() {
  let schreibversuche = 0;
  const inhalt = {};
  Object.defineProperty(inhalt, 'innerHTML', {
    get() { return ''; },
    set() {
      schreibversuche += 1;
      throw new Error('PRUEF_FALLE_DOM_SCHREIBEN');
    },
  });
  return {
    inhalt,
    get schreibversuche() { return schreibversuche; },
  };
}

/**
 * Führt die isolierte ES-Moduldatei in einem VM-Kontext aus. Die Datei hat
 * keine Imports; nur ihr `export` wird für Node in eine lokale Funktion
 * übersetzt. So bleibt der Test paket- und browserfrei.
 */
function rahmenRendererAusfuehren(assistentQuelltext, fetchVersprechen) {
  let renderer;
  let fetchAufrufe = 0;
  let rohStandAufrufe = 0;
  let runtimeAufrufe = 0;
  const fassade = {
    rahmenRendererRegistrieren(neuerRenderer) {
      renderer = neuerRenderer;
      return true;
    },
  };
  Object.defineProperty(fassade, 'rahmenZeichnen', {
    configurable: true,
    get() { return renderer; },
    set(neuerRenderer) { renderer = neuerRenderer; },
  });

  const sandkasten = {
    console,
    document: {},
    fetch() {
      fetchAufrufe += 1;
      return fetchVersprechen;
    },
    window: { ageOfBeast: fassade },
  };
  const ausfuehrbar = assistentQuelltext.replace(
    /export\s+function\s+rahmenAssistentEinrichten\s*\(/,
    'function rahmenAssistentEinrichten(',
  );

  if (ausfuehrbar === assistentQuelltext) {
    throw new Error('Der Export rahmenAssistentEinrichten konnte nicht gefunden werden.');
  }

  const kontext = vm.createContext(sandkasten);
  new vm.Script(
    ausfuehrbar + '\n;globalThis.__rahmenAssistentEinrichten = rahmenAssistentEinrichten;',
    { filename: ASSISTENT_DATEI },
  ).runInContext(kontext);

  const einrichten = kontext.__rahmenAssistentEinrichten;
  if (typeof einrichten !== 'function') throw new Error('Der Rahmen-Assistent wurde nicht exportiert.');

  const bearbeitungsKontext = Object.freeze({
    rohStand() {
      rohStandAufrufe += 1;
      return {
        rahmen: {
          'rahmen-probe': { inhalt: { title: 'Prüfrahmen' } },
        },
      };
    },
    schreiben() {},
    neuZeichnen() {},
    melden() {},
    runtimeHolen() {
      runtimeAufrufe += 1;
      return sandkasten.window.ageOfBeast;
    },
  });
  einrichten(bearbeitungsKontext);

  if (typeof renderer !== 'function') {
    throw new Error('Der Assistent hat keinen Rahmen-Renderer registriert.');
  }

  return {
    get fetchAufrufe() { return fetchAufrufe; },
    get rohStandAufrufe() { return rohStandAufrufe; },
    get runtimeAufrufe() { return runtimeAufrufe; },
    renderer,
  };
}

async function assistentSzenarioPruefen(assistentQuelltext, art) {
  const laden = aufschub();
  let aktuell = art === 'frisch';
  let aktualitaetsPruefungen = 0;
  let routenRohstandAufrufe = 0;
  let pruefstand;

  try {
    pruefstand = rahmenRendererAusfuehren(assistentQuelltext, laden.versprechen);
  } catch (fehlerBeimEinrichten) {
    fehlermeldung(
      'rahmen-assistent.js / ' + art,
      'Der isolierte Renderer konnte nicht eingerichtet werden: ' +
        (fehlerBeimEinrichten?.message || String(fehlerBeimEinrichten)),
    );
    return;
  }

  const schreibfalle = inhaltMitSchreibfalle();
  const routenKontext = Object.freeze({
    generation: 7,
    istNochAktuell() {
      aktualitaetsPruefungen += 1;
      return aktuell;
    },
    rohStand() {
      routenRohstandAufrufe += 1;
      throw new Error('PRUEF_FALLE_ROUTENKONTEXT_ROHSTAND');
    },
  });
  const lauf = pruefstand.renderer(schreibfalle.inhalt, 'rahmen-probe', routenKontext);

  pruefe(
    pruefstand.rohStandAufrufe === 1 && routenRohstandAufrufe === 0,
    'rahmen-assistent.js / ' + art + ': Der Renderer muss den äußeren Bearbeitungskontext statt des Routen-Kontexts für den Rohstand verwenden.',
  );
  pruefe(
    pruefstand.runtimeAufrufe === 1,
    'rahmen-assistent.js / ' + art + ': Die Renderer-Registrierung muss den Runtime-Host über den äußeren Bearbeitungskontext holen.',
  );

  pruefe(
    pruefstand.fetchAufrufe === 1,
    'rahmen-assistent.js / ' + art + ': Der Renderer muss die Feldbeschreibung asynchron laden.',
  );

  if (art === 'frisch' || art === 'veraltet-erfolg') {
    if (art === 'veraltet-erfolg') aktuell = false;
    laden.erfuellen({
      ok: true,
      json: async () => ({ schritte: [], felder: [], listen: [] }),
    });
  } else {
    aktuell = false;
    laden.ablehnen(new Error('Absichtlicher Ladefehler'));
  }

  let laufFehler;
  try {
    await lauf;
  } catch (fehlerBeimRendern) {
    laufFehler = fehlerBeimRendern;
  }

  pruefe(
    aktualitaetsPruefungen > 0,
    'rahmen-assistent.js / ' + art + ': Der optionale Aktualitätskontext wurde nach dem Laden nicht geprüft.',
  );

  if (art === 'frisch') {
    pruefe(
      laufFehler && laufFehler.message === 'PRUEF_FALLE_DOM_SCHREIBEN',
      'rahmen-assistent.js / frisch: Ein aktueller Renderer muss nach erfolgreichem Feldladen den Inhaltsbereich aufbauen.',
    );
    return;
  }

  pruefe(
    !laufFehler,
    'rahmen-assistent.js / ' + art + ': Ein veralteter Renderer darf nicht weiterlaufen (' +
      (laufFehler?.message || 'unbekannter Fehler') + ').',
  );
  pruefe(
    schreibfalle.schreibversuche === 0,
    'rahmen-assistent.js / ' + art + ': Ein veralteter Renderer hat nach dem asynchronen Laden in den Inhaltsbereich geschrieben.',
  );
}

function quellvertraegePruefen(routingQuelltext, assistentQuelltext) {
  pruefe(
    /\brahmenRendererRegistrieren\s*\(\s*renderer\s*\)/.test(routingQuelltext),
    'runtime/routing.js / Quellvertrag: Die registrierbare Schnittstelle rahmenRendererRegistrieren(renderer) fehlt.',
  );
  pruefe(
    /\brenderGeneration\s*\+=\s*1\s*;/.test(routingQuelltext),
    'runtime/routing.js / Quellvertrag: Jede Route muss eine Render-Generation fortschreiben.',
  );
  pruefe(
    /istNochAktuell\s*:\s*\(\)\s*=>[\s\S]{0,180}rahmenRouteIstOffen\s*\(\s*id\s*\)/.test(routingQuelltext),
    'runtime/routing.js / Quellvertrag: Der Aktualitätskontext muss Generation und exakt offene Rahmen-ID prüfen.',
  );
  pruefe(
    /async\s+function\s+zeichnen\s*\(\s*inhalt\s*,\s*rahmenId\s*,\s*routenKontext\s*\)/.test(assistentQuelltext),
    'rahmen-assistent.js / Quellvertrag: zeichnen(inhalt, rahmenId, routenKontext) muss den optionalen Routen-Kontext annehmen.',
  );
  pruefe(
    /export\s+function\s+rahmenAssistentEinrichten\s*\(\s*bearbeitungsKontext\s*\)/.test(assistentQuelltext) &&
      /bearbeitungsKontext\.rohStand\s*\(\s*\)/.test(assistentQuelltext) &&
      !/routenKontext\.rohStand\s*\(/.test(assistentQuelltext),
    'rahmen-assistent.js / Quellvertrag: Bearbeitungs- und Routen-Kontext müssen für Rohstand und Aktualität getrennt bleiben.',
  );

  const awaitStelle = assistentQuelltext.indexOf('await beschreibungLaden()');
  const catchStelle = assistentQuelltext.indexOf('catch', awaitStelle + 1);
  const fehlerSchreiben = assistentQuelltext.indexOf('inhalt.innerHTML', catchStelle + 1);
  const erfolgSchreiben = assistentQuelltext.indexOf('inhalt.innerHTML', fehlerSchreiben + 1);
  const istAktualitaetsGuard = (text) =>
    /if\s*\(\s*!\s*istNochAktuell\s*\(\s*routenKontext\s*\)\s*\)\s*return\s*;/.test(text) ||
    /if\s*\([\s\S]{0,180}routenKontext(?:\?\.|\.)istNochAktuell[\s\S]{0,180}\)\s*return\s*;/.test(text);

  pruefe(
    /(?:function\s+istNochAktuell\s*\(\s*routenKontext\s*\)|routenKontext(?:\?\.|\.)istNochAktuell)/.test(assistentQuelltext),
    'rahmen-assistent.js / Quellvertrag: Der optionale Kontext muss über istNochAktuell() auswertbar sein.',
  );
  pruefe(
    catchStelle !== -1 && fehlerSchreiben !== -1 &&
      istAktualitaetsGuard(assistentQuelltext.slice(catchStelle, fehlerSchreiben)),
    'rahmen-assistent.js / Quellvertrag: Im Ladefehlerpfad fehlt vor dem DOM-Schreiben die Aktualitätsprüfung.',
  );
  pruefe(
    awaitStelle !== -1 && erfolgSchreiben !== -1 &&
      istAktualitaetsGuard(assistentQuelltext.slice(fehlerSchreiben, erfolgSchreiben)),
    'rahmen-assistent.js / Quellvertrag: Nach await beschreibungLaden() fehlt vor dem Erfolgs-DOM-Schreiben die Aktualitätsprüfung.',
  );
}

async function ausfuehren() {
  const wikiQuelltext = readFileSync(WIKI_DATEI, 'utf8');
  const runtimeQuelltexte = RUNTIME_DATEIEN.map((datei) => readFileSync(datei, 'utf8'));
  const assistentQuelltext = readFileSync(ASSISTENT_DATEI, 'utf8');

  /* Nicht ueber die Position in der Liste suchen: Kommt eine Runtime-Datei
     hinzu, zeigt ein fester Index stillschweigend auf die falsche Datei. */
  const routingIndex = RUNTIME_DATEIEN.findIndex((pfad) => pfad.endsWith('routing.js'));
  if (routingIndex === -1) throw new Error('runtime/routing.js fehlt in RUNTIME_DATEIEN.');
  quellvertraegePruefen(runtimeQuelltexte[routingIndex], assistentQuelltext);
  hostPruefen(runtimeQuelltexte, wikiQuelltext);
  await assistentSzenarioPruefen(assistentQuelltext, 'frisch');
  await assistentSzenarioPruefen(assistentQuelltext, 'veraltet-erfolg');
  await assistentSzenarioPruefen(assistentQuelltext, 'veraltet-fehler');

  console.log('Age-of-Beast-Wiki – Rahmen-Routen geprüft');
  console.log('-----------------------------------------');
  console.log('Prüfungen: ' + pruefungen);
  console.log('Modus: Node-Standardbibliothek, DOM-Attrappe, kein Browser und kein Netzwerk.');

  if (!fehler.length) {
    console.log('Ergebnis: öffentliche Fassade, Renderer-Registrierung, Routen-Generation und asynchrone Aktualitäts-Guards sind erfüllt.');
    return;
  }

  console.error('');
  console.error('FEHLER: ' + fehler.length + ' Vertragsverletzung(en) erkannt.');
  for (const eintrag of fehler) console.error('  - ' + eintrag);
  process.exitCode = 1;
}

try {
  await ausfuehren();
} catch (unerwarteterFehler) {
  console.error('Rahmen-Routen-Prüfung konnte nicht vollständig ausgeführt werden:', unerwarteterFehler?.stack || unerwarteterFehler);
  process.exitCode = 1;
}
