/**
 * [Aufgabe: Betrieb]
 * Versioniert die veränderlichen Browser-Abhängigkeiten eines Pages-Artefakts.
 *
 * Das Werkzeug arbeitet ausschließlich in dem mit --artefakt übergebenen
 * Verzeichnis. Es verändert niemals die Arbeitskopie des Repositories. Der
 * Graph beginnt bei index.html und folgt lokalen HTML-Referenzen, JavaScript-
 * Modulimports, einfachen fetch()-Adressen sowie CSS-Imports und lokalen
 * CSS-url()-Assets. Statische Karten-SVGs bleiben bewusst unverändert.
 *
 * Aufruf:
 *   node werkzeuge/versioniere-browser-ressourcen.mjs \
 *     --artefakt <Verzeichnis> --version <Kennung>
 */

import { readFile, realpath, stat, writeFile } from 'node:fs/promises';
import { dirname, extname, isAbsolute, posix, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const HIER = dirname(fileURLToPath(import.meta.url));
export const REPOSITORY_WURZEL = resolve(HIER, '..');

const TEXTDATEI_ENDUNGEN = new Set(['.html', '.css', '.js', '.mjs']);
const KARTEN_SVG = /^daten\/kartenbilder\/.+\.svg$/iu;

export class CacheGraphFehler extends Error {
  constructor(fehler) {
    super('Cache-Graph ist ungültig:\n' + fehler.map((eintrag) => '  - ' + eintrag).join('\n'));
    this.name = 'CacheGraphFehler';
    this.fehler = fehler;
  }
}

function istInnerhalb(wurzel, ziel) {
  const abstand = relative(wurzel, ziel);
  return abstand === '' || (!abstand.startsWith('..' + sep) && abstand !== '..' && !isAbsolute(abstand));
}

function pfadAusUrl(rohwert) {
  const hash = rohwert.indexOf('#');
  const ohneFragment = hash === -1 ? rohwert : rohwert.slice(0, hash);
  const fragment = hash === -1 ? '' : rohwert.slice(hash);
  const frage = ohneFragment.indexOf('?');

  return {
    pfad: frage === -1 ? ohneFragment : ohneFragment.slice(0, frage),
    parameter: frage === -1 ? '' : ohneFragment.slice(frage + 1),
    hatteParameter: frage !== -1,
    fragment,
  };
}

function parameterLesen(parameter) {
  if (!parameter) return [];
  return parameter.split(/(?:&amp;|&)/iu).filter((teil) => teil !== '');
}

function parameterName(teil) {
  const gleich = teil.indexOf('=');
  const roh = gleich === -1 ? teil : teil.slice(0, gleich);
  try {
    return decodeURIComponent(roh.replace(/\+/gu, ' '));
  } catch {
    return roh;
  }
}

function versionskennungen(rohwert) {
  return parameterLesen(pfadAusUrl(rohwert).parameter)
    .filter((teil) => parameterName(teil) === 'v')
    .map((teil) => {
      const gleich = teil.indexOf('=');
      const roh = gleich === -1 ? '' : teil.slice(gleich + 1);
      try {
        return decodeURIComponent(roh.replace(/\+/gu, ' '));
      } catch {
        return roh;
      }
    });
}

/**
 * Ersetzt ausschließlich den Cache-Parameter und bewahrt übrige Parameter
 * sowie Fragment. HTML erhält &amp; als Trenner, JavaScript und CSS erhalten &.
 */
export function adresseVersionieren(rohwert, version, format) {
  const teile = pfadAusUrl(rohwert);
  const ohneAltesV = parameterLesen(teile.parameter).filter((teil) => parameterName(teil) !== 'v');
  const trenner = format === 'html' ? '&amp;' : '&';
  const parameter = [...ohneAltesV, 'v=' + encodeURIComponent(version)].join(trenner);
  return teile.pfad + '?' + parameter + teile.fragment;
}

function istExterneOderInterneAdresse(pfad) {
  return (
    !pfad ||
    pfad.startsWith('#') ||
    pfad.startsWith('//') ||
    /^[a-z][a-z0-9+.-]*:/iu.test(pfad)
  );
}

/**
 * Löst eine Browser-Adresse auf einen sicheren, virtuellen Webpfad auf.
 * Eine URL außerhalb des Artefakts ist ein Fehler, nicht stiller Ausschluss.
 */
export function lokaleAdresseAufloesen(rohwert, vonPfad, { html = false } = {}) {
  const teile = pfadAusUrl(String(rohwert));
  if (istExterneOderInterneAdresse(teile.pfad)) return { art: 'ignorieren' };
  if (teile.pfad.includes('\\')) {
    return { art: 'fehler', meldung: 'Backslash in Browser-Adresse: ' + rohwert };
  }

  let dekodiert;
  try {
    dekodiert = decodeURIComponent(teile.pfad);
  } catch {
    return { art: 'fehler', meldung: 'Ungültige URL-Kodierung: ' + rohwert };
  }

  if (!dekodiert || dekodiert.includes('\\')) {
    return { art: 'fehler', meldung: 'Ungültige lokale Browser-Adresse: ' + rohwert };
  }

  const basis = dekodiert.startsWith('/')
    ? dekodiert.replace(/^\/+/, '')
    : posix.join(posix.dirname(vonPfad), dekodiert);
  const ziel = posix.normalize(basis);

  if (!ziel || ziel === '.' || ziel === '..' || ziel.startsWith('../') || ziel.startsWith('/')) {
    return { art: 'fehler', meldung: 'Adresse verlässt das Artefakt: ' + rohwert };
  }

  // Normale HTML-Links ohne Dateinamen sind Navigation, keine geladene
  // Browser-Ressource. Imports ohne Endung bleiben dagegen absichtlich rot.
  if (html && !extname(ziel)) return { art: 'ignorieren' };

  return {
    art: 'lokal',
    ziel,
    unveraenderlich: KARTEN_SVG.test(ziel),
  };
}

function kommentarMaskieren(text, start, ende) {
  return text.slice(start, ende).replace(/[^\r\n]/gu, ' ');
}

function htmlReferenzen(text) {
  const ohneKommentare = text.replace(/<!--[\s\S]*?-->/gu, (treffer, position) =>
    kommentarMaskieren(text, position, position + treffer.length));
  const muster = /\b(?:src|href)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+))/gidu;
  const funde = [];

  for (const treffer of ohneKommentare.matchAll(muster)) {
    const gruppe = treffer[1] !== undefined ? 1 : treffer[2] !== undefined ? 2 : 3;
    const bereich = treffer.indices[gruppe];
    funde.push({ start: bereich[0], ende: bereich[1], wert: text.slice(bereich[0], bereich[1]), format: 'html' });
  }
  return funde;
}

function istLeerzeichen(zeichen) {
  return /\s/u.test(zeichen || '');
}

function kommentarOderLeerraumUeberspringen(text, position) {
  let stelle = position;
  while (stelle < text.length) {
    if (istLeerzeichen(text[stelle])) {
      stelle += 1;
      continue;
    }
    if (text.startsWith('//', stelle)) {
      const ende = text.indexOf('\n', stelle + 2);
      stelle = ende === -1 ? text.length : ende + 1;
      continue;
    }
    if (text.startsWith('/*', stelle)) {
      const ende = text.indexOf('*/', stelle + 2);
      stelle = ende === -1 ? text.length : ende + 2;
      continue;
    }
    break;
  }
  return stelle;
}

function wortEnde(text, position) {
  let stelle = position;
  while (/[A-Za-z0-9_$]/u.test(text[stelle] || '')) stelle += 1;
  return stelle;
}

function wortAn(text, position, wort) {
  return text.startsWith(wort, position) &&
    !/[A-Za-z0-9_$]/u.test(text[position - 1] || '') &&
    !/[A-Za-z0-9_$]/u.test(text[position + wort.length] || '');
}

function zeichenketteLesen(text, position) {
  const trennzeichen = text[position];
  if (!['\'', '"', '`'].includes(trennzeichen)) return null;

  let stelle = position + 1;
  let interpolation = false;
  while (stelle < text.length) {
    if (text[stelle] === '\\') {
      stelle += 2;
      continue;
    }
    if (trennzeichen === '`' && text.startsWith('${', stelle)) interpolation = true;
    if (text[stelle] === trennzeichen) {
      return {
        start: position + 1,
        ende: stelle,
        endeMitQuote: stelle + 1,
        wert: text.slice(position + 1, stelle),
        interpolation,
      };
    }
    stelle += 1;
  }
  return null;
}

function vonImportFinden(text, position) {
  let stelle = position;
  while (stelle < text.length) {
    stelle = kommentarOderLeerraumUeberspringen(text, stelle);
    if (text[stelle] === ';') return null;
    if (wortAn(text, stelle, 'from')) {
      const nachVon = kommentarOderLeerraumUeberspringen(text, stelle + 4);
      return zeichenketteLesen(text, nachVon);
    }
    if (['\'', '"', '`'].includes(text[stelle])) {
      const zeichenkette = zeichenketteLesen(text, stelle);
      stelle = zeichenkette ? zeichenkette.endeMitQuote : text.length;
      continue;
    }
    if (text[stelle] === '\n' && text.slice(position, stelle).includes(')')) return null;
    stelle += 1;
  }
  return null;
}

function javascriptModulReferenzen(text) {
  const funde = [];
  const hinzufuegen = (zeichenkette) => {
    if (!zeichenkette || zeichenkette.interpolation) return;
    funde.push({ start: zeichenkette.start, ende: zeichenkette.ende, wert: zeichenkette.wert, format: 'javascript' });
  };

  let stelle = 0;
  while (stelle < text.length) {
    stelle = kommentarOderLeerraumUeberspringen(text, stelle);
    if (stelle >= text.length) break;
    if (['\'', '"', '`'].includes(text[stelle])) {
      const zeichenkette = zeichenketteLesen(text, stelle);
      stelle = zeichenkette ? zeichenkette.endeMitQuote : text.length;
      continue;
    }

    if (wortAn(text, stelle, 'import')) {
      const nachImport = kommentarOderLeerraumUeberspringen(text, stelle + 6);
      if (text[nachImport] === '(') {
        hinzufuegen(zeichenketteLesen(text, kommentarOderLeerraumUeberspringen(text, nachImport + 1)));
      } else if (['\'', '"', '`'].includes(text[nachImport])) {
        hinzufuegen(zeichenketteLesen(text, nachImport));
      } else {
        hinzufuegen(vonImportFinden(text, nachImport));
      }
      stelle = wortEnde(text, stelle);
      continue;
    }

    if (wortAn(text, stelle, 'export')) {
      hinzufuegen(vonImportFinden(text, kommentarOderLeerraumUeberspringen(text, stelle + 6)));
      stelle = wortEnde(text, stelle);
      continue;
    }

    stelle += 1;
  }
  return funde;
}

/** Liest konstante, lokale fetch()-Adressen ohne eine JavaScript-Bibliothek. */
function javascriptFetchReferenzen(text) {
  const konstante = new Map();
  const verwendeteKonstanten = new Set();
  const direkte = [];

  let stelle = 0;
  while (stelle < text.length) {
    stelle = kommentarOderLeerraumUeberspringen(text, stelle);
    if (stelle >= text.length) break;
    if (['\'', '"', '`'].includes(text[stelle])) {
      const zeichenkette = zeichenketteLesen(text, stelle);
      stelle = zeichenkette ? zeichenkette.endeMitQuote : text.length;
      continue;
    }

    if (wortAn(text, stelle, 'const')) {
      let nachName = kommentarOderLeerraumUeberspringen(text, stelle + 5);
      const endeName = wortEnde(text, nachName);
      const name = text.slice(nachName, endeName);
      nachName = kommentarOderLeerraumUeberspringen(text, endeName);
      if (name && text[nachName] === '=') {
        const zeichenkette = zeichenketteLesen(text, kommentarOderLeerraumUeberspringen(text, nachName + 1));
        if (zeichenkette && !zeichenkette.interpolation) konstante.set(name, zeichenkette);
      }
      stelle = wortEnde(text, stelle);
      continue;
    }

    if (wortAn(text, stelle, 'fetch') && text[stelle - 1] !== '.') {
      const nachFetch = kommentarOderLeerraumUeberspringen(text, stelle + 5);
      if (text[nachFetch] === '(') {
        const argument = kommentarOderLeerraumUeberspringen(text, nachFetch + 1);
        const zeichenkette = zeichenketteLesen(text, argument);
        if (zeichenkette && !zeichenkette.interpolation) {
          direkte.push(zeichenkette);
        } else {
          const endeName = wortEnde(text, argument);
          const name = text.slice(argument, endeName);
          if (name) verwendeteKonstanten.add(name);
        }
      }
      stelle = wortEnde(text, stelle);
      continue;
    }

    stelle += 1;
  }

  return [...direkte, ...[...verwendeteKonstanten].map((name) => konstante.get(name)).filter(Boolean)]
    .map((zeichenkette) => ({
      start: zeichenkette.start,
      ende: zeichenkette.ende,
      wert: zeichenkette.wert,
      format: 'javascript',
    }));
}

function cssImportReferenzen(ohneKommentare, text) {
  const muster = /@import\s+(?:url\(\s*)?(?:"([^"]*)"|'([^']*)'|([^\s;)]+))/gidu;
  const funde = [];

  for (const treffer of ohneKommentare.matchAll(muster)) {
    const gruppe = treffer[1] !== undefined ? 1 : treffer[2] !== undefined ? 2 : 3;
    const bereich = treffer.indices[gruppe];
    funde.push({ start: bereich[0], ende: bereich[1], wert: text.slice(bereich[0], bereich[1]), format: 'css' });
  }
  return funde;
}

/**
 * CSS-Assets sind ebenso Browser-Abhängigkeiten wie CSS-Imports. Statische
 * url()-Werte (etwa var(--bild)) lassen sich nicht sicher auflösen und werden
 * bewusst nicht als lokale Datei ausgegeben.
 */
function cssUrlReferenzen(ohneKommentare, text) {
  const muster = /\burl\(\s*(?:"([^"]*)"|'([^']*)'|([^\s)]+))\s*\)/gidu;
  const funde = [];

  for (const treffer of ohneKommentare.matchAll(muster)) {
    const gruppe = treffer[1] !== undefined ? 1 : treffer[2] !== undefined ? 2 : 3;
    const bereich = treffer.indices[gruppe];
    const wert = text.slice(bereich[0], bereich[1]);
    if (wert.includes('(') || wert.includes(')')) continue;
    funde.push({ start: bereich[0], ende: bereich[1], wert, format: 'css' });
  }
  return funde;
}

function cssReferenzen(text) {
  const ohneKommentare = text.replace(/\/\*[\s\S]*?\*\//gu, (treffer, position) =>
    kommentarMaskieren(text, position, position + treffer.length));
  const funde = [
    ...cssImportReferenzen(ohneKommentare, text),
    ...cssUrlReferenzen(ohneKommentare, text),
  ];
  const gesehen = new Set();

  // @import url(...) wird von beiden Mustern erkannt, ist aber nur eine
  // Kante. Doppelte Ersetzungen an derselben Zeichenposition wären falsch.
  return funde.filter((fund) => {
    const kennung = fund.start + ':' + fund.ende;
    if (gesehen.has(kennung)) return false;
    gesehen.add(kennung);
    return true;
  });
}

function referenzenAusText(text, pfad) {
  const endung = extname(pfad).toLowerCase();
  if (endung === '.html') return htmlReferenzen(text);
  if (endung === '.css') return cssReferenzen(text);
  if (endung === '.js' || endung === '.mjs') {
    const funde = [...javascriptModulReferenzen(text), ...javascriptFetchReferenzen(text)];
    const gesehen = new Set();
    return funde.filter((fund) => {
      const kennung = fund.start + ':' + fund.ende;
      if (gesehen.has(kennung)) return false;
      gesehen.add(kennung);
      return true;
    });
  }
  return [];
}

async function artefaktWurzelLesen(artefakt) {
  const wurzel = await realpath(resolve(artefakt));
  const angaben = await stat(wurzel);
  if (!angaben.isDirectory()) throw new Error('Artefakt ist kein Verzeichnis: ' + artefakt);
  return wurzel;
}

async function sichereDatei(wurzel, pfad) {
  const ziel = resolve(wurzel, ...pfad.split('/'));
  if (!istInnerhalb(wurzel, ziel)) throw new Error('Pfad außerhalb des Artefakts: ' + pfad);
  const echt = await realpath(ziel);
  if (!istInnerhalb(wurzel, echt)) throw new Error('Symbolischer Link außerhalb des Artefakts: ' + pfad);
  const angaben = await stat(echt);
  if (!angaben.isFile()) throw new Error('Keine Datei: ' + pfad);
  return echt;
}

/**
 * Liest den vollständigen, lokalen Browser-Graphen. Fehler werden gesammelt,
 * damit ein kaputter Import nicht den nächsten Fehler verdeckt.
 */
export async function browserGraphLesen(artefakt) {
  const wurzel = await artefaktWurzelLesen(artefakt);
  const knoten = new Map();
  const referenzen = [];
  const fehler = [];

  async function besuchen(pfad, herkunft = null) {
    if (knoten.has(pfad)) return;
    let datei;
    try {
      datei = await sichereDatei(wurzel, pfad);
    } catch (fehlerhaft) {
      const vorwort = herkunft ? herkunft + ' → ' : '';
      fehler.push(vorwort + pfad + ': ' + fehlerhaft.message);
      return;
    }

    const endung = extname(pfad).toLowerCase();
    const text = TEXTDATEI_ENDUNGEN.has(endung) ? await readFile(datei, 'utf8') : null;
    const knotenEintrag = { pfad, datei, text, endung };
    knoten.set(pfad, knotenEintrag);
    if (text === null) return;

    for (const fund of referenzenAusText(text, pfad)) {
      const aufgeloest = lokaleAdresseAufloesen(fund.wert, pfad, { html: endung === '.html' });
      if (aufgeloest.art === 'ignorieren') continue;
      if (aufgeloest.art === 'fehler') {
        fehler.push(pfad + ': ' + aufgeloest.meldung);
        continue;
      }

      const referenz = {
        ...fund,
        von: pfad,
        ziel: aufgeloest.ziel,
        versionieren: !aufgeloest.unveraenderlich,
      };
      referenzen.push(referenz);
      await besuchen(aufgeloest.ziel, pfad);
    }
  }

  await besuchen('index.html');
  if (fehler.length) throw new CacheGraphFehler(fehler);

  return {
    wurzel,
    knoten,
    referenzen,
    abhaengigkeiten: new Set([...knoten.keys()].filter((pfad) => pfad !== 'index.html')),
  };
}

function ersetzungenAnwenden(text, ersetzungen) {
  let ergebnis = text;
  for (const ersetzung of [...ersetzungen].sort((a, b) => b.start - a.start)) {
    if (ergebnis.slice(ersetzung.start, ersetzung.ende) !== ersetzung.alt) {
      throw new Error('Referenz änderte sich während der Versionierung: ' + ersetzung.alt);
    }
    ergebnis = ergebnis.slice(0, ersetzung.start) + ersetzung.neu + ergebnis.slice(ersetzung.ende);
  }
  return ergebnis;
}

function versionPruefen(version) {
  if (!/^[A-Za-z0-9._-]{1,128}$/u.test(String(version || ''))) {
    throw new Error('Ungültige Versionskennung. Erlaubt sind nur Buchstaben, Ziffern, Punkt, Unterstrich und Bindestrich.');
  }
  return String(version);
}

/** Versioniert alle veränderlichen Kanten des Artefakt-Graphen. */
export async function artefaktVersionieren({ artefakt, version }) {
  const gueltigeVersion = versionPruefen(version);
  const graph = await browserGraphLesen(artefakt);
  const proDatei = new Map();

  for (const referenz of graph.referenzen) {
    if (!referenz.versionieren) continue;
    const neu = adresseVersionieren(referenz.wert, gueltigeVersion, referenz.format);
    if (neu === referenz.wert) continue;
    if (!proDatei.has(referenz.von)) proDatei.set(referenz.von, []);
    proDatei.get(referenz.von).push({ ...referenz, alt: referenz.wert, neu });
  }

  let umschreibungen = 0;
  for (const [pfad, ersetzungen] of proDatei) {
    const knoten = graph.knoten.get(pfad);
    await writeFile(knoten.datei, ersetzungenAnwenden(knoten.text, ersetzungen), 'utf8');
    umschreibungen += ersetzungen.length;
  }

  const danach = await browserGraphLesen(artefakt);
  return { davor: graph, danach, umschreibungen, version: gueltigeVersion };
}

function kantenMenge(graph) {
  return new Set(graph.referenzen.map((referenz) =>
    [referenz.von, referenz.ziel, referenz.versionieren ? 'veränderlich' : 'statisch'].join(' → ')));
}

/** Prüft Zielgleichheit und exakt eine passende Versionskennung je mutable Kante. */
export async function artefaktCacheGraphPruefen({ quelle, artefakt, version }) {
  const gueltigeVersion = versionPruefen(version);
  const quellGraph = await browserGraphLesen(quelle);
  const artefaktGraph = await browserGraphLesen(artefakt);
  const fehler = [];

  const quelleKanten = kantenMenge(quellGraph);
  const artefaktKanten = kantenMenge(artefaktGraph);
  for (const kante of quelleKanten) {
    if (!artefaktKanten.has(kante)) fehler.push('Artefakt verliert Quellkante: ' + kante);
  }
  for (const kante of artefaktKanten) {
    if (!quelleKanten.has(kante)) fehler.push('Artefakt enthält unbekannte Kante: ' + kante);
  }

  const quellDateien = quellGraph.abhaengigkeiten;
  const artefaktDateien = artefaktGraph.abhaengigkeiten;
  for (const pfad of quellDateien) {
    if (!artefaktDateien.has(pfad)) fehler.push('Artefakt verliert Quellabhängigkeit: ' + pfad);
  }
  for (const pfad of artefaktDateien) {
    if (!quellDateien.has(pfad)) fehler.push('Artefakt enthält unbekannte Abhängigkeit: ' + pfad);
  }

  for (const referenz of artefaktGraph.referenzen) {
    if (!referenz.versionieren) continue;
    const kennungen = versionskennungen(referenz.wert);
    if (kennungen.length !== 1) {
      fehler.push(referenz.von + ' → ' + referenz.ziel + ': genau eine Versionskennung „v“ erwartet, gefunden: ' + kennungen.length);
      continue;
    }
    if (kennungen[0] !== gueltigeVersion) {
      fehler.push(referenz.von + ' → ' + referenz.ziel + ': Versionskennung „' + kennungen[0] + '“ statt „' + gueltigeVersion + '“.');
    }
  }

  if (fehler.length) throw new CacheGraphFehler(fehler);
  return { quellGraph, artefaktGraph, version: gueltigeVersion };
}

function optionenLesen(argumente) {
  const optionen = {};
  for (let index = 0; index < argumente.length; index += 1) {
    const schalter = argumente[index];
    if (schalter === '--hilfe' || schalter === '-h') return { hilfe: true };
    if (!['--artefakt', '--version'].includes(schalter)) throw new Error('Unbekannte Option: ' + schalter);
    const wert = argumente[index + 1];
    if (!wert || wert.startsWith('--')) throw new Error('Wert fehlt nach ' + schalter + '.');
    optionen[schalter.slice(2)] = wert;
    index += 1;
  }
  return optionen;
}

function hilfeAusgeben() {
  console.log('Aufruf: node werkzeuge/versioniere-browser-ressourcen.mjs --artefakt <Verzeichnis> --version <Kennung>');
  console.log('Die Quelle bleibt unverändert; nur das explizite Artefakt wird geschrieben.');
}

const direktGestartet = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (direktGestartet) {
  try {
    const optionen = optionenLesen(process.argv.slice(2));
    if (optionen.hilfe) {
      hilfeAusgeben();
    } else {
      if (!optionen.artefakt || !optionen.version) {
        throw new Error('--artefakt und --version sind beide verpflichtend.');
      }
      const ergebnis = await artefaktVersionieren(optionen);
      console.log('Browser-Ressourcen versioniert');
      console.log('Artefakt: ' + ergebnis.danach.wurzel);
      console.log('Kennung: ' + ergebnis.version);
      console.log('Abhängigkeiten: ' + ergebnis.danach.abhaengigkeiten.size);
      console.log('Kanten umgeschrieben: ' + ergebnis.umschreibungen);
    }
  } catch (fehler) {
    console.error('Browser-Ressourcen konnten nicht versioniert werden: ' + fehler.message);
    process.exitCode = 1;
  }
}
