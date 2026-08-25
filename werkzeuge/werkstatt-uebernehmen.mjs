/**
 * Übernimmt die Inhalte der Daggerheart-Werkstatt in das Wiki.
 *
 * Die Werkstatt lag bisher in der Firebase-Datenbank unter
 * `daggerheartCreator/v1`. Dieses Skript wandelt ihre Inhalte in das
 * Wiki-Format um und legt sie als eigenes Modul `werkstatt` in
 * `daten/quelle.json` ab. Danach hängt nichts davon mehr an Firebase.
 *
 * ZWEI DINGE WERDEN BEWUSST NICHT ÜBERNOMMEN:
 *
 *   1. Persönliche Daten. In den Werkstatt-Daten stehen E-Mail-Adressen
 *      und Namen von Mitspielern sowie Firebase-Kennungen. Das Repository
 *      ist öffentlich; solche Angaben stünden dort dauerhaft im Netz, auch
 *      in der Versionsgeschichte. Sie werden entfernt, nicht übertragen.
 *
 *   2. Die Kartengrafik. Sie ist offizielle Illustration von Darrington
 *      Press (hier: Mat Wilma, „DH Core 056/270"). Sie in einem
 *      öffentlichen Repository zu verbreiten wäre etwas anderes als sie
 *      privat zu verwenden. Übernommen werden Text und Angaben der Karte,
 *      nicht das Bild.
 *
 * Nicht übertragbar sind ausserdem Live-Sitzungen, Einladungslinks und
 * Zugangsrechte: Sie sind an die Firebase-Anmeldung gebunden und haben
 * ohne sie keine Bedeutung.
 *
 * Aufruf:
 *   node werkzeuge/werkstatt-uebernehmen.mjs <abzug.json>
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HIER = dirname(fileURLToPath(import.meta.url));
const WURZEL = join(HIER, '..');
const ZIEL = join(WURZEL, 'daten', 'quelle.json');

const abzugPfad = process.argv[2];
if (!abzugPfad) {
  console.error('Bitte den Firebase-Abzug angeben:');
  console.error('  node werkzeuge/werkstatt-uebernehmen.mjs <abzug.json>');
  process.exit(1);
}

/* ------------------------------------------------------------------ *
 * Bausteine für das Wiki-Format
 * ------------------------------------------------------------------ */

const BILD_VORGABE = {
  color: 'gold',
  fit: 'contain',
  frame: 'simple',
  positionX: 50,
  positionY: 50,
  zoom: 100,
};

const sicher = (text) =>
  String(text ?? '')
    .split('&').join('&amp;')
    .split('<').join('&lt;')
    .split('>').join('&gt;');

/** Aus Absätzen wird HTML, wie die Weltenschmiede es führt. */
function alsHtml(text) {
  return String(text ?? '')
    .split(/\n{2,}/)
    .map((a) => a.trim())
    .filter(Boolean)
    .map((a) => '<p>' + sicher(a).split('\n').join('<br>') + '</p>')
    .join('');
}

/** Baut ein Textpanel in genau der Form, die `welt-umwandeln.mjs` erwartet. */
function panel(id, titel, text) {
  const roh = String(text ?? '').trim();
  if (!roh) return null;
  return {
    id,
    image: '',
    imageSettings: { ...BILD_VORGABE },
    kind: 'text',
    text: roh,
    textFields: [{ html: alsHtml(roh), id: 'text-' + id, label: 'Text', text: roh }],
    textLayout: 'single',
    title: titel,
  };
}

/** Fügt mehrere beschriftete Angaben zu einem Absatztext zusammen. */
function absaetze(paare) {
  return paare
    .filter(([, wert]) => String(wert ?? '').trim())
    .map(([beschriftung, wert]) =>
      beschriftung ? beschriftung + ': ' + String(wert).trim() : String(wert).trim(),
    )
    .join('\n\n');
}

/** Setzt ein fertiges Element aus Panels und Steckbriefzeilen zusammen. */
function element({ id, name, beschreibung, panels, zeilen, unterart }) {
  const echte = panels.filter(Boolean);
  const attributeRows = [];
  const fields = {};

  if (unterart) {
    attributeRows.push({ id: 'attribute-' + id + '-art', key: 'werkstattArt', label: 'Art' });
    fields.werkstattArt = unterart;
  }
  for (const [schluessel, beschriftung, wert] of zeilen || []) {
    if (!String(wert ?? '').trim()) continue;
    attributeRows.push({ id: 'attribute-' + id + '-' + schluessel, key: schluessel, label: beschriftung });
    fields[schluessel] = String(wert).trim();
  }

  const jetzt = new Date().toISOString();
  return {
    attributeRows,
    createdAt: jetzt,
    customPanels: echte,
    description: String(beschreibung ?? '').trim(),
    descriptionPanelIds: echte.map((p) => p.id),
    fields,
    id,
    image: '',
    imageSettings: { ...BILD_VORGABE },
    module: 'werkstatt',
    name,
    panelHeights: {},
    panelOrder: ['core-connections', 'references', ...echte.map((p) => p.id)],
    panelWidths: {},
    richText: {},
    updatedAt: jetzt,
  };
}

/* ------------------------------------------------------------------ *
 * Kampagnenrahmen
 * ------------------------------------------------------------------ */

function ausKampagne(roh) {
  const p = JSON.parse(roh.payload || '{}');
  const id = 'werkstatt-kampagne-' + (p.title || 'rahmen').toLowerCase().replace(/[^a-z0-9]+/g, '-');

  const besonderheiten = (p.distinctions || [])
    .filter((d) => d && (d.name || d.description))
    .map((d) => absaetze([[null, d.name], ['Beschreibung', d.description], ['Im Alltag', d.everydayImpact]]))
    .join('\n\n');

  const fraktionen = (p.factions || [])
    .filter((f) => f && f.name)
    .map((f) =>
      absaetze([
        [null, f.name],
        ['Ziel', f.goal],
        ['Machtmittel', f.leverage],
        ['Verhältnis', f.relationship],
      ]),
    )
    .join('\n\n');

  return element({
    id,
    name: p.title || 'Kampagnenrahmen',
    beschreibung: [p.tagline, p.pitch].filter((t) => t && t.trim() && t.trim() !== 'X').join(' — '),
    unterart: 'Kampagnenrahmen',
    zeilen: [
      ['werkstattSchritt', 'Bearbeitungsschritt', roh.currentStep ? String(roh.currentStep) : ''],
      ['werkstattStatus', 'Status', roh.status],
    ],
    panels: [
      panel(
        'panel-' + id + '-kern',
        'Kern der Kampagne',
        absaetze([
          ['Wiederkehrende Tätigkeit', p.core?.recurringActivity],
          ['Was auf dem Spiel steht', p.core?.centralStakes],
          ['Grundgedanke', p.core?.concept],
        ]),
      ),
      panel(
        'panel-' + id + '-stimmung',
        'Ton und Stimmung',
        absaetze([
          ['Ton', p.mood?.tone],
          ['Themen', p.mood?.themes],
          ['Vorbilder', p.mood?.touchstones],
        ]),
      ),
      panel(
        'panel-' + id + '-ueberblick',
        'Wie es zur heutigen Lage kam',
        absaetze([
          ['Vorher', p.overview?.before],
          ['Der Wandel', p.overview?.change],
          ['Heute', p.overview?.today],
          ['Die Kräfte', p.overview?.forces],
          ['Warum die Figuren zählen', p.overview?.charactersMatter],
        ]),
      ),
      panel(
        'panel-' + id + '-motor',
        'Motor der Geschichten',
        absaetze([
          ['Wiederkehrende Lage', p.engine?.recurringSituation],
          ['Steigender Druck', p.engine?.risingPressure],
          ['Bedeutsame Entscheidungen', p.engine?.meaningfulChoices],
          ['Folgen', p.engine?.consequences],
        ]),
      ),
      panel('panel-' + id + '-besonderheiten', 'Besonderheiten der Welt', besonderheiten),
      panel('panel-' + id + '-fraktionen', 'Fraktionen im Rahmen', fraktionen),
      panel(
        'panel-' + id + '-figuren',
        'Anknüpfung der Figuren',
        absaetze([
          ['Gemeinsamer Anlass', p.characterHooks?.sharedReason],
          ['Zu den Gemeinschaften', p.characterHooks?.communityNotes],
        ]),
      ),
      panel('panel-' + id + '-eroeffnung', 'Eröffnung', p.opening),
    ],
  });
}

/* ------------------------------------------------------------------ *
 * Spielfigur
 * ------------------------------------------------------------------ */

const WERTE_NAMEN = {
  agility: 'Beweglichkeit',
  strength: 'Stärke',
  finesse: 'Fingerfertigkeit',
  instinct: 'Instinkt',
  presence: 'Ausstrahlung',
  knowledge: 'Wissen',
};

function ausFigur(roh) {
  const p = JSON.parse(roh.payload || '{}');
  const id = 'werkstatt-figur-' + (p.name || 'figur').toLowerCase().replace(/[^a-z0-9]+/g, '-');

  const werte = Object.entries(WERTE_NAMEN)
    .filter(([k]) => p.traits && p.traits[k] !== undefined)
    .map(([k, n]) => n + ' ' + (p.traits[k] > 0 ? '+' : '') + p.traits[k])
    .join(', ');

  const ausruestung = absaetze([
    ['Hauptwaffe', p.primaryWeapon?.name || p.primaryWeapon],
    ['Zweitwaffe', p.secondaryWeapon?.name || p.secondaryWeapon],
    ['Rüstung', p.armor?.name || p.armor],
    ['Klassengegenstand', p.classItem],
    ['Zauberfokus', p.spellFocus],
  ]);

  const erfahrungen = (p.experiences || [])
    .filter((e) => e && (e.name || e.text))
    .map((e) => (e.name || e.text) + (e.modifier ? ' (+' + e.modifier + ')' : ''))
    .join('\n');

  const hintergrund = (p.backgroundAnswers || [])
    .filter((a) => a && String(a.answer ?? a).trim())
    .map((a) => (a.question ? a.question + '\n' + a.answer : String(a)))
    .join('\n\n');

  const verbindungen = (p.connections || [])
    .filter((v) => v && String(v.answer ?? v).trim())
    .map((v) => (v.question ? v.question + '\n' + v.answer : String(v)))
    .join('\n\n');

  const karten = (p.domainCards || [])
    .filter(Boolean)
    .map((k) => (typeof k === 'string' ? k : k.name || k.id))
    .join(', ');

  return element({
    id,
    name: p.name || 'Namenlose Figur',
    beschreibung: [p.classId, p.ancestry, p.community].filter(Boolean).join(' · '),
    unterart: 'Spielfigur',
    zeilen: [
      ['werkstattKlasse', 'Klasse', p.classId],
      ['werkstattUnterklasse', 'Unterklasse', p.subclassId],
      ['werkstattAbstammung', 'Abstammung', p.ancestry],
      ['werkstattGemeinschaft', 'Gemeinschaft', p.community],
      ['werkstattStufe', 'Stufe', p.level !== undefined ? String(p.level) : ''],
      ['werkstattFuerwort', 'Fürwort', p.pronouns],
      ['werkstattWerte', 'Eigenschaften', werte],
      ['werkstattAusweichen', 'Ausweichen', p.evasion !== undefined ? String(p.evasion) : ''],
    ],
    panels: [
      panel('panel-' + id + '-erscheinung', 'Erscheinung', p.appearance),
      panel('panel-' + id + '-hintergrund', 'Hintergrund', hintergrund),
      panel('panel-' + id + '-erfahrungen', 'Erfahrungen', erfahrungen),
      panel('panel-' + id + '-ausruestung', 'Ausrüstung', ausruestung),
      panel('panel-' + id + '-domaenen', 'Domänenkarten', karten),
      panel('panel-' + id + '-verbindungen', 'Verbindungen zur Gruppe', verbindungen),
    ],
  });
}

/* ------------------------------------------------------------------ *
 * Karte
 * ------------------------------------------------------------------ */

function ausKarte(roh) {
  const p = JSON.parse(roh.payload || '{}');
  const id = 'werkstatt-karte-' + (p.name || 'karte').toLowerCase().replace(/[^a-z0-9]+/g, '-');

  // Der Regeltext der Werkstatt verwendet **fett** und _kursiv_. Das Wiki
  // fuehrt HTML; die Auszeichnung wird deshalb umgesetzt statt verworfen.
  const regeltext = String(p.content || '')
    .split('**_').join('**')
    .split('_**').join('**');

  return element({
    id,
    name: p.name || roh.title || 'Karte',
    beschreibung: p.description,
    unterart: 'Karte',
    zeilen: [
      ['werkstattKartentyp', 'Kartentyp', p.type],
      ['werkstattKategorie', 'Kategorie', p.category],
      ['werkstattStufe', 'Stufe', p.level !== undefined ? String(p.level) : ''],
      ['werkstattRueckruf', 'Rückrufkosten', p.recallCost !== undefined ? String(p.recallCost) : ''],
      ['werkstattNummer', 'Kartennummer', p.cardId],
      ['werkstattKuenstler', 'Illustration', p.artist],
    ],
    panels: [
      panel('panel-' + id + '-regeltext', 'Regeltext', regeltext),
      panel(
        'panel-' + id + '-bild',
        'Zur Illustration',
        p.artist
          ? 'Die Illustration dieser Karte stammt von ' +
              p.artist +
              ' und ist offizielles Material von Darrington Press. Sie wird hier bewusst nicht mitveröffentlicht; ' +
              'im Kartenwerkzeug der Werkstatt liegt sie unverändert vor.'
          : '',
      ),
    ],
  });
}

/* ------------------------------------------------------------------ *
 * Durchlauf
 * ------------------------------------------------------------------ */

const abzug = JSON.parse(readFileSync(abzugPfad, 'utf8'));
const v1 = abzug.v1 || abzug;

const eintraege = {};
let uebersprungen = 0;

for (const roh of Object.values(v1.campaigns || {})) {
  const e = ausKampagne(roh);
  eintraege[e.id] = e;
}

for (const gruppe of Object.values(v1.standaloneCharacters || {})) {
  for (const roh of Object.values(gruppe || {})) {
    if (!roh || !roh.payload) { uebersprungen += 1; continue; }
    const e = ausFigur(roh);
    eintraege[e.id] = e;
  }
}

for (const gruppe of Object.values(v1.cardDocuments || {})) {
  for (const roh of Object.values(gruppe || {})) {
    if (!roh || !roh.payload) { uebersprungen += 1; continue; }
    const e = ausKarte(roh);
    eintraege[e.id] = e;
  }
}

/* --- Sicherheitsnetz: nichts Persönliches darf durchrutschen ------- */

const alsText = JSON.stringify(eintraege);
const mails = alsText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || [];
const bilder = alsText.match(/data:image\//g) || [];

if (mails.length) {
  console.error('Abbruch: Es sind E-Mail-Adressen im Ergebnis gelandet.');
  console.error('  ' + [...new Set(mails)].join(', '));
  process.exit(1);
}
if (bilder.length) {
  console.error('Abbruch: Es ist ein eingebettetes Bild im Ergebnis gelandet.');
  process.exit(1);
}

/* --- In die Quelldatei einhängen ---------------------------------- */

const quelle = JSON.parse(readFileSync(ZIEL, 'utf8'));
quelle.elements = quelle.elements || {};
quelle.elements.werkstatt = eintraege;
quelle.updatedAt = new Date().toISOString();
writeFileSync(ZIEL, JSON.stringify(quelle, null, 2) + '\n', 'utf8');

console.log('Daggerheart-Werkstatt übernommen');
console.log('--------------------------------');
for (const e of Object.values(eintraege)) {
  console.log('  ' + (e.fields.werkstattArt || '').padEnd(16) + e.name + '   (' + e.customPanels.length + ' Abschnitte)');
}
if (uebersprungen) console.log('  Ohne Inhalt übersprungen: ' + uebersprungen);
console.log('');
console.log('Nicht übernommen, mit Absicht:');
console.log('  - E-Mail-Adressen, Namen und Kennungen von Mitspielern');
console.log('  - die offizielle Kartengrafik von Darrington Press');
console.log('  - Live-Sitzungen, Einladungslinks und Zugangsrechte (an Firebase gebunden)');
console.log('');
console.log('Nächster Schritt:  node werkzeuge/welt-aufbereiten.mjs');
