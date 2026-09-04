/**
 * Der Filter versteckt wirklich, und die Karten stehen in Blöcken.
 * [Aufgabe: Prüfwesen]
 *
 * ⚠️ **Warum es diese Prüfung gibt.** Am 04.09.2026 meldete Jannik:
 * „Die Kategorien filtern nichts im Wiki." Er hatte recht — und der
 * Fehler war auf jede bequeme Art unsichtbar:
 *
 *   - Der Filter arbeitete korrekt. Er setzte `kachel.hidden = true`.
 *   - Das Attribut stand auch da: **35 von 59 Kacheln** trugen es.
 *   - Und **0 davon waren unsichtbar.** `wiki.css` setzt
 *     `.kachel { display: flex }`; eine Klassenregel schlägt die
 *     eingebaute Browserregel `[hidden] { display: none }`.
 *
 * Es gab keine Fehlermeldung, keine rote Prüfung, keinen Absturz. Wer
 * nur `element.hidden` zählt — so wie ich beim ersten Messen —, sieht
 * ein einwandfreies Ergebnis.
 *
 * **Deshalb misst diese Prüfung die Sichtbarkeit, nicht das Attribut.**
 * Sie fragt den Browser nach `display` und nach `offsetParent`, also
 * danach, was ein Mensch sähe. Eine Prüfung auf `k.hidden` hätte den
 * Fehler mitgemacht statt ihn zu fangen.
 *
 * Zweiter Teil: Janniks „Die Karten sollen aber von Anfang an schon
 * gruppiert sein!" Gemessen standen dort **393 Kacheln in einem
 * einzigen Raster**, 189 Domänenkarten am Stück.
 *
 * ⚠️ Auf einem Bauserver gibt es keinen Browser. Dann wird **nur die
 * Messung** übersprungen und das in der Ausgabe benannt; die statischen
 * Prüfungen laufen weiter. Auf einem Arbeitsplatz bleibt ein fehlender
 * Browser ein Fehler.
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { starteServer, browserStarten } from './browser-messen.mjs';

const WURZEL = join(dirname(fileURLToPath(import.meta.url)), '..');

const DATEIEN = new Set([
  'wiki.html', 'karten.html', 'stil.css', 'wiki.js', 'daten/welt.js',
  'styles/tokens.css', 'styles/wiki.css', 'styles/bearbeiten.css',
  'styles/werkstatt.css', 'styles/kategorien.css', 'styles/handy.css',
  'styles/grundregeln.css', 'styles/spielkarten.css', 'styles/favoriten.css',
  'runtime/favoriten.js', 'runtime/symbole.js', 'runtime/datenindex.js',
  'runtime/ansichten.js', 'runtime/interaktion.js', 'runtime/routing.js',
  'runtime/kontextmenue.js', 'runtime/kontextmenue-wiki.js',
  'runtime/wiki-kennung.js', 'runtime/wiki-rueckweg.js',
  'bearbeiten.js', 'styles/plattform.css',
  'karte/karten-zeigen.js', 'karte/kartenblase.js', 'karte/karten-daten.js',
  'karte/palette.mjs',
  'daten/daggerheart-karten.json', 'daten/daggerheart-gegenstaende.json',
]);
const TYPEN = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
};

let pruefungen = 0;
const fehler = [];
let uebersprungen = null;
const pruefe = (wert, text) => { pruefungen += 1; if (!wert) fehler.push(text); };

/* ------------------------------------------------------------------ *
 * Statisch: die Grundregel ist da und gilt für alles
 * ------------------------------------------------------------------ */

function statikPruefen() {
  const grund = join(WURZEL, 'styles/grundregeln.css');
  pruefe(existsSync(grund), 'styles/grundregeln.css fehlt.');
  if (existsSync(grund)) {
    const text = readFileSync(grund, 'utf8');
    /* Kommentare weg, sonst schlägt die Prüfung an der Begründung an,
       warum die Regel dort steht — derselbe Fehler ist am 04.09.2026
       schon zweimal passiert (Tonwächter, Aufgabensortierung). */
    const code = text.replace(/\/\*[\s\S]*?\*\//gu, ' ');
    pruefe(/\[hidden\]/u.test(code) && /display\s*:\s*none/u.test(code)
      && /!important/u.test(code),
      'grundregeln.css enthält keine wirksame `[hidden]`-Regel. Ohne '
      + '`!important` schlägt jede Klassenregel mit `display` sie.');
    pruefe(!/\.[a-z-]+\s+\[hidden\]/u.test(code),
      'Die `[hidden]`-Regel ist auf einen Bereich eingeschränkt. Sie muss '
      + 'für die ganze Seite gelten — sonst gilt sie genau dort nicht, wo '
      + 'die nächste Klassenregel sie überstimmt.');
  }

  const fassade = join(WURZEL, 'stil.css');
  if (existsSync(fassade)) {
    const f = readFileSync(fassade, 'utf8');
    pruefe(f.includes('styles/grundregeln.css'),
      'stil.css lädt `styles/grundregeln.css` nicht — die Regel wäre wirkungslos.');
    const zeilen = f.split('\n').filter((z) => z.includes('@import'));
    const letzte = zeilen[zeilen.length - 1] || '';
    pruefe(letzte.includes('grundregeln'),
      'grundregeln.css wird nicht zuletzt geladen. Bei gleicher Stärke '
      + 'gewinnt die spätere Regel — die Grundregel muss hinten stehen.');
  }

  const karten = join(WURZEL, 'karte/karten-zeigen.js');
  if (existsSync(karten)) {
    const k = readFileSync(karten, 'utf8');
    pruefe(k.includes('inBloecken'),
      'karten-zeigen.js gruppiert die Karten nicht mehr in Blöcke.');
  }
}

/* ------------------------------------------------------------------ *
 * Die Messseite: was ein Mensch sähe
 * ------------------------------------------------------------------ */

function hilfsseite() {
  return `<!doctype html><meta charset="utf-8"><title>Filtermessung</title>
<body><div id="aob-filter-ergebnis">wartet</div>
<script type="module">
const ausgabe = document.getElementById('aob-filter-ergebnis');

/* Wo steckt die Messung gerade? Ohne das meldet ein Fehlschlag nur
   „kein Ergebnis" — und man raet. Der Zeitgeber gibt nach 12 Sekunden
   den letzten Schritt aus, damit die Meldung den Ort nennt. */
let schritt = 'Start';
const melde = (wert) => { ausgabe.textContent = btoa(unescape(encodeURIComponent(JSON.stringify(wert)))); };
addEventListener('error', (e) => melde({ fehler: ['Seitenfehler bei „' + schritt + '": ' + (e.message || e.error)] }));
addEventListener('unhandledrejection', (e) => melde({ fehler: ['Abgelehnt bei „' + schritt + '": ' + (e.reason?.message || e.reason)] }));
setTimeout(() => { if (ausgabe.textContent === 'wartet') melde({ fehler: ['Haengt bei: ' + schritt] }); }, 12000);

const rahmen = document.createElement('iframe');
document.body.append(rahmen);
rahmen.style.cssText = 'width:1280px;height:900px;border:0;position:absolute;left:-2000px';

function pause() { return new Promise((f) => requestAnimationFrame(() => requestAnimationFrame(f))); }
function warteAuf(test, nachricht) {
  return new Promise((fertig, kaputt) => {
    const ende = Date.now() + 15000;
    const pruefen = () => test() ? fertig() : Date.now() > ende ? kaputt(new Error(nachricht)) : setTimeout(pruefen, 30);
    pruefen();
  });
}
async function lade(adresse, dasein) {
  const fertig = new Promise((ja, nein) => {
    const uhr = setTimeout(() => nein(new Error(adresse + ' lädt nicht.')), 15000);
    rahmen.addEventListener('load', () => { clearTimeout(uhr); ja(); }, { once: true });
  });
  rahmen.src = adresse;
  await fertig;
  await warteAuf(() => Boolean(rahmen.contentDocument?.querySelector(dasein)), adresse + ': ' + dasein + ' erscheint nicht.');
  await pause();
}

/* Der Kern: Was ist WIRKLICH unsichtbar? Nicht das Attribut zählt,
   sondern das, was der Browser daraus macht. */
function sichtbarkeit(dokument) {
  const alle = [...dokument.querySelectorAll('.kachel')];
  const stil = dokument.defaultView.getComputedStyle;
  return {
    gesamt: alle.length,
    mitAttribut: alle.filter((k) => k.hidden).length,
    wirklichSichtbar: alle.filter((k) => k.offsetParent !== null && stil(k).display !== 'none').length,
    sichtbareKategorien: [...new Set(alle
      .filter((k) => k.offsetParent !== null && stil(k).display !== 'none')
      .map((k) => k.dataset.kategorie))].sort(),
  };
}

async function messen() {
  const ergebnis = { filter: [], karten: null, fehler: [] };

  schritt = 'wiki.html laden';
  await lade('/wiki.html?w=age-of-beast', '.kachel');
  const dok = rahmen.contentDocument;
  ergebnis.filter.push({ knopf: 'start', ...sichtbarkeit(dok) });

  for (const wahl of ['species', 'factions', 'regeln', 'alle']) {
    schritt = 'Filter ' + wahl;
    const knopf = dok.querySelector('#filter button[data-filter="' + wahl + '"]');
    if (!knopf) { ergebnis.fehler.push('Filterknopf fehlt: ' + wahl); continue; }
    knopf.click();
    await pause();
    ergebnis.filter.push({ knopf: wahl, ...sichtbarkeit(dok) });
  }

  schritt = 'karten.html laden';
  await lade('/karten.html?w=age-of-beast', '.spielkarte');
  const kd = rahmen.contentDocument;
  const bloecke = [...kd.querySelectorAll('.karten-block')].map((b) => ({
    kopf: b.querySelector('.karten-block-kopf')?.textContent.trim() || '',
    karten: b.querySelectorAll('.spielkarte').length,
  }));
  ergebnis.karten = {
    bloecke,
    kartenGesamt: kd.querySelectorAll('.spielkarte').length,
    koepfeKleben: bloecke.length
      ? kd.defaultView.getComputedStyle(kd.querySelector('.karten-block-kopf')).position
      : null,
  };
  return ergebnis;
}

messen().then(melde)
  .catch((grund) => melde({ fehler: ['Bei „' + schritt + '": ' + grund.message] }));
</script>`;
}

async function messen() {
  const SEITE = '/__aob-filter.html';
  const server = await starteServer({
    hilfsseite, wurzel: WURZEL, dateien: DATEIEN, typen: TYPEN, seite: SEITE,
  });
  try {
    const port = server.address().port;
    const ergebnis = await browserStarten(
      'http://127.0.0.1:' + port + SEITE, 'aob-filter-ergebnis');
    if (ergebnis.fehler?.length) throw new Error(ergebnis.fehler.join(' '));
    return ergebnis;
  } finally {
    await new Promise((fertig) => server.close(fertig));
  }
}

/* ------------------------------------------------------------------ *
 * Auswerten
 * ------------------------------------------------------------------ */

function auswerten(mess) {
  const start = mess.filter.find((f) => f.knopf === 'start');
  pruefe(Boolean(start) && start.gesamt > 0,
    'Die Startseite zeigt gar keine Kacheln — die Messung liefe ins Leere.');

  for (const lauf of mess.filter) {
    if (lauf.knopf === 'start' || lauf.knopf === 'alle') {
      pruefe(lauf.wirklichSichtbar === lauf.gesamt,
        'Ohne Filter (' + lauf.knopf + ') sind nur ' + lauf.wirklichSichtbar
        + ' von ' + lauf.gesamt + ' Kacheln sichtbar.');
      continue;
    }
    /* Der eigentliche Punkt: Nach dem Klick darf **nichts anderes** mehr
       zu sehen sein. Genau hier war der Fehler — das Attribut stimmte,
       das Bild nicht. */
    pruefe(lauf.sichtbareKategorien.length === 1 && lauf.sichtbareKategorien[0] === lauf.knopf,
      'Der Filter „' + lauf.knopf + '" versteckt nichts: sichtbar sind noch '
      + lauf.sichtbareKategorien.join(', ') + '. Wahrscheinlich schlägt eine '
      + '`display`-Regel das `hidden`-Attribut.');
    pruefe(lauf.wirklichSichtbar < lauf.gesamt,
      'Der Filter „' + lauf.knopf + '" lässt alle ' + lauf.gesamt
      + ' Kacheln stehen.');
    pruefe(lauf.mitAttribut > 0,
      'Der Filter „' + lauf.knopf + '" setzt gar kein `hidden` — dann filtert '
      + 'er nicht, sondern tut nichts.');
  }

  const k = mess.karten;
  pruefe(Boolean(k) && k.kartenGesamt > 0, 'Die Kartenseite zeigt keine Karten.');
  if (!k) return;
  pruefe(k.bloecke.length > 1,
    'Die Karten stehen in ' + k.bloecke.length + ' Block/Blöcken statt gruppiert. '
    + 'Jannik: „Die Karten sollen aber von Anfang an schon gruppiert sein."');
  const summe = k.bloecke.reduce((s, b) => s + b.karten, 0);
  pruefe(summe === k.kartenGesamt,
    'Die Blöcke enthalten ' + summe + ' Karten, gezeichnet sind ' + k.kartenGesamt
    + '. Beim Gruppieren geht etwas verloren.');
  pruefe(k.bloecke.every((b) => b.kopf && b.karten > 0),
    'Ein Block hat keinen Kopf oder keine Karten.');
  pruefe(k.koepfeKleben === 'sticky',
    'Die Blocküberschrift klebt nicht oben. Bei 21 Karten je Block weiß man '
    + 'sonst nach dem dritten Bildschirm nicht mehr, wo man ist.');
}

/* ------------------------------------------------------------------ *
 * Lauf
 * ------------------------------------------------------------------ */

statikPruefen();

try {
  auswerten(await messen());
} catch (grund) {
  const aufBauserver = Boolean(process.env.CI || process.env.GITHUB_ACTIONS);
  if (aufBauserver && /Weder Chrome noch Edge/.test(grund?.message || '')) {
    uebersprungen = 'Browsermessung (kein Browser auf dem Bauserver): '
      + 'Sichtbarkeit und Kartenblöcke wurden hier NICHT gemessen.';
  } else {
    fehler.push('Die Browsermessung konnte nicht laufen: ' + (grund?.message || String(grund)));
  }
}

if (fehler.length) {
  console.error('Filterprüfung fehlgeschlagen:\n- ' + fehler.join('\n- '));
  process.exitCode = 1;
} else if (uebersprungen) {
  console.log('Filter geprüft (unvollständig)');
  console.log('Prüfungen: ' + pruefungen);
  console.log('Übersprungen: ' + uebersprungen);
} else {
  console.log('Filter geprüft');
  console.log('Prüfungen: ' + pruefungen);
  console.log('Ergebnis: Versteckte Kacheln sind wirklich weg, die Karten stehen in Blöcken.');
}
