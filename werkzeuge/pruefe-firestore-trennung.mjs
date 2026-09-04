/**
 * Prueft, dass firestore.rules beide Anwendungen traegt und getrennt haelt.
 *
 * Warum es diese Pruefung gibt: Das Firebase-Projekt kampagnenrahmen-jt hat
 * genau eine Firestore-Datenbank, und eine Datenbank hat genau eine
 * Regeldatei. Wer aus diesem Repository heraus die Regeln deployt,
 * ueberschreibt damit auch die Regeln von Scotophobia. Enthielte
 * firestore.rules nur Wiki-Regeln, waeren Spielstaende, Rueckmeldungen und
 * Freigaben von Scotophobia im selben Augenblick unlesbar — der Deploy
 * meldet dabei Erfolg, der Schaden zeigt sich erst beim naechsten Spieler.
 *
 * Genau dieser Fehler ist unsichtbar, solange niemand hinsieht. Deshalb wird
 * hier gemessen statt angenommen: Die Pruefung liest Scotophobias eigene
 * Regeldatei als Vergleichsquelle und stellt Wort fuer Wort fest, dass sie
 * vollstaendig und unveraendert enthalten ist.
 *
 * Die zweite Haelfte ist die Trennung. Beide Anwendungen teilen sich die
 * Datei, duerfen sich aber keine Bedingung teilen: Wer bei Scotophobia
 * freigeschaltet ist, darf dadurch nicht das Wiki bearbeiten. Auch das wird
 * am tatsaechlichen Text der Bloecke geprueft, nicht am guten Willen.
 *
 * Kein Browser, kein Netzwerk, keine Abhaengigkeit. Nichts wird geschrieben.
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const WURZEL = join(dirname(fileURLToPath(import.meta.url)), '..');
const REGELDATEI = join(WURZEL, 'firestore.rules');

/* Scotophobia liegt in einem eigenen Repository neben diesem. Der Pfad ist
   nicht fest verdrahtet: Wer die Ordner anders ablegt, setzt
   SCOTOPHOBIA_REGELN und muss diese Datei nicht anfassen. */
const SCOTOPHOBIA_KANDIDATEN = [
  process.env.SCOTOPHOBIA_REGELN,
  join(WURZEL, '..', 'Granithoehle', 'firestore.rules'),
].filter(Boolean);

/* Die Sammlungen von Scotophobia werden nicht aufgezaehlt, sondern aus
   dessen Regeldatei gelesen. Eine vierte Sammlung dort waere sonst eine
   Luecke, die niemandem auffaellt. */

let pruefungen = 0;
const fehler = [];
function pruefe(wert, text) {
  pruefungen += 1;
  if (!wert) fehler.push(text);
}

/* ------------------------------------------------------------------ *
   Werkzeug: Bloecke aus einer Regeldatei schneiden

   Geklammert wird auch in Pfaden (match /zugriffsanfragen/{konto}) und in
   Kommentaren. Deshalb wird der Text zuerst maskiert: Kommentar- und
   Zeichenketteninhalte werden durch Leerzeichen ersetzt, jede Position
   bleibt erhalten. Gezaehlt wird auf der Maske, geschnitten wird aus dem
   Original — so bleiben Kommentare im Ergebnis erhalten.
   ------------------------------------------------------------------ */

function maskiere(text) {
  const aus = text.split('');
  let i = 0;
  while (i < text.length) {
    const zwei = text.slice(i, i + 2);
    if (zwei === '/*') {
      const ende = text.indexOf('*/', i + 2);
      const bis = ende === -1 ? text.length : ende + 2;
      for (let k = i; k < bis; k += 1) if (aus[k] !== '\n') aus[k] = ' ';
      i = bis;
      continue;
    }
    if (zwei === '//') {
      let ende = text.indexOf('\n', i);
      if (ende === -1) ende = text.length;
      for (let k = i; k < ende; k += 1) aus[k] = ' ';
      i = ende;
      continue;
    }
    const c = text[i];
    if (c === "'" || c === '"') {
      let k = i + 1;
      while (k < text.length && text[k] !== c) {
        if (text[k] === '\\') k += 1;
        k += 1;
      }
      for (let m = i; m <= Math.min(k, text.length - 1); m += 1) if (aus[m] !== '\n') aus[m] = ' ';
      i = k + 1;
      continue;
    }
    i += 1;
  }
  return aus.join('');
}

/* Schneidet den Block, dessen Kopf auf `muster` passt. Das Muster muss mit
   der oeffnenden Klammer des Rumpfes enden — dadurch zaehlen Klammern im
   Kopf wie {konto} nicht mit. */
function blockLesen(text, maske, muster) {
  const t = new RegExp(muster.source, 'u').exec(maske);
  if (!t) return null;
  const oeffnung = t.index + t[0].length - 1;
  let tiefe = 0;
  for (let i = oeffnung; i < maske.length; i += 1) {
    if (maske[i] === '{') tiefe += 1;
    else if (maske[i] === '}') {
      tiefe -= 1;
      if (tiefe === 0) return { start: t.index, ende: i + 1, text: text.slice(t.index, i + 1) };
    }
  }
  return null;
}

function funktionMuster(name) {
  return new RegExp('function\\s+' + name + '\\s*\\([^)]*\\)\\s*\\{', 'u');
}

function sammlungMuster(name) {
  return new RegExp('match\\s+/' + name + '/\\{[A-Za-z0-9_]+\\}\\s*\\{', 'u');
}

/* Namen aller Sammlungen, auf die die Datei Regeln legt. Der Datenbankpfad
   selbst und der Riegel /{document=**} sind keine Sammlungen. */
function sammlungenLesen(maske) {
  const namen = [];
  const muster = /match\s+\/([A-Za-z0-9_-]+)\/\{/gu;
  let t;
  while ((t = muster.exec(maske)) !== null) {
    if (t[1] !== 'databases') namen.push(t[1]);
  }
  return namen;
}

function funktionsnamenLesen(maske) {
  const namen = [];
  const muster = /function\s+([A-Za-z0-9_]+)\s*\(/gu;
  let t;
  while ((t = muster.exec(maske)) !== null) namen.push(t[1]);
  return namen;
}

/* Zeilenenden und reine Einrueckung duerfen sich unterscheiden — das ist
   Formatierung. Alles andere muss zeichengleich sein. */
function normalisiere(text) {
  return text
    .replace(/\r\n/gu, '\n')
    .split('\n')
    .map((z) => z.replace(/[ \t]+$/u, '').replace(/^[ \t]+/u, ''))
    .join('\n');
}

/* Ruft dieser Text die genannte Funktion auf? Die Klammer davor verhindert,
   dass istAdmin in istWikiAdmin gefunden wird. */
function ruftAuf(text, name) {
  return new RegExp('(?<![A-Za-z0-9_])' + name + '\\s*\\(', 'u').test(text);
}

/* ------------------------------------------------------------------ *
   Die eigentliche Pruefung

   Sie steht bewusst als Funktion ueber einem Text statt ueber einem
   Dateinamen. Nur so kann sich die Pruefung am Ende selbst pruefen: an
   einem absichtlich beschaedigten Text im Speicher, ohne eine einzige
   Zeile auf die Festplatte zu schreiben.
   ------------------------------------------------------------------ */

function pruefeRegeln(regeltext, scotoText) {
  const meldungen = [];
  let anzahl = 0;
  const p = (wert, text) => {
    anzahl += 1;
    if (!wert) meldungen.push(text);
  };

  const maske = maskiere(regeltext);
  const scotoMaske = maskiere(scotoText);

  /* --- 0. Grundform ------------------------------------------------ */

  p(/^\s*(?:\/\*[\s\S]*?\*\/\s*)*rules_version\s*=\s*'2';/u.test(regeltext),
    'Die Regeldatei beginnt mit rules_version = \'2\'. Ohne Fassung 2 verhaelt sich der Riegel /{document=**} anders als hier angenommen.');

  let tiefe = 0;
  let unterNull = false;
  for (const z of maske) {
    if (z === '{') tiefe += 1;
    else if (z === '}') {
      tiefe -= 1;
      if (tiefe < 0) unterNull = true;
    }
  }
  p(tiefe === 0 && !unterNull, 'Die geschweiften Klammern der Regeldatei sind unausgeglichen (Rest ' + tiefe + '). Ein Deploy wuerde die Datei ablehnen.');

  /* --- 1. Scotophobia vollstaendig und unveraendert ----------------- */

  const scotoFunktionen = funktionsnamenLesen(scotoMaske);
  const scotoSammlungen = sammlungenLesen(scotoMaske);

  p(scotoFunktionen.length > 0, 'In Scotophobias Regeldatei wurde keine einzige Hilfsfunktion gefunden. Die Vergleichsquelle ist damit unbrauchbar.');
  p(scotoSammlungen.length > 0, 'In Scotophobias Regeldatei wurde keine einzige Sammlung gefunden. Die Vergleichsquelle ist damit unbrauchbar.');

  const WARNUNG = ' Ein Deploy dieser Datei wuerde Scotophobia abschalten: Spielstaende, Rueckmeldungen und Freigaben waeren sofort unlesbar.';

  for (const name of scotoFunktionen) {
    const dort = blockLesen(scotoText, scotoMaske, funktionMuster(name));
    const hier = blockLesen(regeltext, maske, funktionMuster(name));
    p(hier !== null, 'Die Hilfsfunktion ' + name + '() von Scotophobia fehlt in firestore.rules.' + WARNUNG);
    if (hier && dort) {
      p(normalisiere(hier.text) === normalisiere(dort.text),
        'Die Hilfsfunktion ' + name + '() weicht von Scotophobias Fassung ab. Bedingungen dort duerfen hier nicht veraendert werden.' + WARNUNG);
    }
  }

  for (const name of scotoSammlungen) {
    const dort = blockLesen(scotoText, scotoMaske, sammlungMuster(name));
    const hier = blockLesen(regeltext, maske, sammlungMuster(name));
    p(hier !== null, 'Der Block match /' + name + '/ von Scotophobia fehlt in firestore.rules.' + WARNUNG);
    if (hier && dort) {
      p(normalisiere(hier.text) === normalisiere(dort.text),
        'Der Block match /' + name + '/ weicht von Scotophobias Fassung ab. Seine Bedingungen duerfen hier nicht veraendert werden.' + WARNUNG);
    }
  }

  /* --- 2. Die Sammlungen ueberschneiden sich nicht ------------------ */

  const sammlungen = sammlungenLesen(maske);
  const gesehen = new Set();
  for (const name of sammlungen) {
    p(!gesehen.has(name), 'Die Sammlung ' + name + ' hat zwei match-Bloecke. Firestore wertet beide aus und verknuepft sie mit ODER — die schwaechere Regel gewinnt.');
    gesehen.add(name);
  }

  const wikiSammlungen = sammlungen.filter((n) => !scotoSammlungen.includes(n));
  p(wikiSammlungen.length > 0, 'firestore.rules enthaelt keine einzige Wiki-Sammlung. Dann gehoert die Datei nicht in dieses Repository.');
  for (const name of wikiSammlungen) {
    p(name.startsWith('wiki_'), 'Die Sammlung ' + name + ' gehoert weder zu Scotophobia noch traegt sie das Praefix wiki_. Ohne Praefix ist nicht mehr erkennbar, welche Anwendung sie besitzt, und der naechste Namensgleichklang trifft fremde Daten.');
  }
  for (const name of scotoSammlungen) {
    p(!name.startsWith('wiki_'), 'Die Scotophobia-Sammlung ' + name + ' traegt das Wiki-Praefix. Dann ist die Zuordnung nicht mehr eindeutig.');
  }

  /* --- 3. Die Freigabelogik ist getrennt ---------------------------- */

  const alleFunktionen = funktionsnamenLesen(maske);
  const wikiFunktionen = alleFunktionen.filter((n) => !scotoFunktionen.includes(n));
  p(wikiFunktionen.length > 0, 'Das Wiki hat keine eigenen Hilfsfunktionen. Dann benutzt es zwangslaeufig die von Scotophobia.');

  /* Der Wiki-Bereich ist mehr als seine match-Bloecke: Auch die
     Hilfsfunktionen des Wikis duerfen nicht auf Scotophobia zurueckgreifen,
     sonst waere die Trennung nur eine Zeile tiefer aufgehoben. */
  const wikiTexte = [];
  for (const name of wikiSammlungen) {
    const b = blockLesen(regeltext, maske, sammlungMuster(name));
    if (b) wikiTexte.push(['match /' + name + '/', b.text]);
  }
  for (const name of wikiFunktionen) {
    const b = blockLesen(regeltext, maske, funktionMuster(name));
    if (b) wikiTexte.push(['function ' + name + '()', b.text]);
  }

  const scotoTexte = [];
  for (const name of scotoSammlungen) {
    const b = blockLesen(regeltext, maske, sammlungMuster(name));
    if (b) scotoTexte.push(['match /' + name + '/', b.text]);
  }
  for (const name of scotoFunktionen) {
    const b = blockLesen(regeltext, maske, funktionMuster(name));
    if (b) scotoTexte.push(['function ' + name + '()', b.text]);
  }

  for (const [wo, text] of wikiTexte) {
    const rumpf = maskiere(text);
    for (const name of scotoFunktionen) {
      p(!ruftAuf(rumpf, name), 'In ' + wo + ' wird Scotophobias ' + name + '() aufgerufen. Damit haenge die Freigabe des Wikis an Scotophobias Sammlung: Wer dort bestaetigt ist, duerfte das Wiki bearbeiten.');
    }
    for (const name of scotoSammlungen) {
      p(!new RegExp('documents/' + name + '/', 'u').test(rumpf), 'In ' + wo + ' wird auf Scotophobias Sammlung ' + name + ' zugegriffen. Die Freigaben beider Anwendungen muessen getrennt bleiben.');
    }
  }

  for (const [wo, text] of scotoTexte) {
    const rumpf = maskiere(text);
    for (const name of wikiFunktionen) {
      p(!ruftAuf(rumpf, name), 'In ' + wo + ' wird die Wiki-Funktion ' + name + '() aufgerufen. Scotophobias Regeln muessen ohne das Wiki auskommen.');
    }
    for (const name of wikiSammlungen) {
      p(!new RegExp('documents/' + name + '/', 'u').test(rumpf), 'In ' + wo + ' wird auf die Wiki-Sammlung ' + name + ' zugegriffen. Scotophobias Regeln muessen ohne das Wiki auskommen.');
    }
  }

  /* --- 4. Der Riegel steht am Ende ---------------------------------- */

  const riegel = blockLesen(regeltext, maske, /match\s+\/\{document=\*\*\}\s*\{/u);
  p(riegel !== null, 'Der abschliessende Riegel match /{document=**} fehlt. Ohne ihn ist jede nicht genannte Sammlung ungeschuetzt, sobald jemand sie anlegt.');
  if (riegel) {
    p(/allow\s+read\s*,\s*write\s*:\s*if\s+false\s*;/u.test(riegel.text),
      'Der Riegel match /{document=**} sperrt nicht mit if false. Er ist damit kein Riegel mehr.');

    let spaeter = 0;
    const weitere = /match\s+\//gu;
    let t;
    while ((t = weitere.exec(maske)) !== null) if (t.index > riegel.start) spaeter += 1;
    p(spaeter === 0, 'Nach dem Riegel match /{document=**} stehen noch ' + spaeter + ' weitere match-Bloecke. Der Riegel muss der letzte Block bleiben, damit beim Lesen der Datei klar ist, dass darunter nichts mehr erlaubt wird.');
  }

  /* --- 5. Kein oeffentliches Schreiben, aber oeffentliches Lesen ---- */

  p(!/allow\s+write\s*:\s*if\s+true/u.test(regeltext), 'Die Datei enthaelt allow write: if true. Damit duerfte jeder Fremde die Daten ueberschreiben.');
  p(!/allow\s+read\s*,\s*write\s*:\s*if\s+true/u.test(regeltext), 'Die Datei enthaelt allow read, write: if true. Damit duerfte jeder Fremde die Daten ueberschreiben.');

  const SCHREIBEND = ['write', 'create', 'update', 'delete'];
  const erlaubnisse = [...maske.matchAll(/allow\s+([a-z]+(?:\s*,\s*[a-z]+)*)\s*:\s*if\s+([^;]+);/gu)];
  p(erlaubnisse.length > 0, 'In der Regeldatei wurde keine einzige allow-Zeile gefunden. Dann misst diese Pruefung nichts.');
  for (const e of erlaubnisse) {
    const verben = e[1].split(',').map((v) => v.trim());
    const bedingung = e[2].trim().replace(/\s+/gu, ' ');
    if (verben.some((v) => SCHREIBEND.includes(v))) {
      p(bedingung !== 'true', 'Die Zeile allow ' + e[1].trim() + ': if true erlaubt Schreiben ohne jede Bedingung.');
    }
  }

  /* Oeffentliches Lesen der Weltdaten ist dagegen erwuenscht: Die
     Besucheransicht holt die Welt ohne Anmeldung ueber die REST-
     Schnittstelle. Faellt diese Zeile weg, ist das Wiki fuer alle ausser
     Jannik leer — und zwar ohne Fehlermeldung. */
  const welt = blockLesen(regeltext, maske, sammlungMuster('wiki_welt'));
  p(welt !== null, 'Der Block match /wiki_welt/ fehlt. Er traegt die Weltdaten.');
  if (welt) {
    p(/allow\s+read\s*:\s*if\s+true\s*;/u.test(welt.text),
      'match /wiki_welt/ erlaubt kein oeffentliches Lesen. Die Besucheransicht liest ohne Anmeldung — ohne diese Zeile bliebe das Wiki fuer jeden Besucher leer.');
    p(/allow\s+delete\s*:\s*if\s+false\s*;/u.test(welt.text),
      'match /wiki_welt/ verbietet das Loeschen nicht. Ein fehlendes Dokument zerreisst die Welt beim Zusammensetzen.');
    p(/request\.resource\.data\.keys\(\)\.hasOnly\(/u.test(welt.text),
      'match /wiki_welt/ erzwingt die Feldstruktur nicht (hasOnly fehlt). Ein Schreibvorgang koennte beliebige Felder anlegen.');
    p(/request\.resource\.data\.geaendertVon\s*==\s*request\.auth\.uid/u.test(welt.text),
      'match /wiki_welt/ erzwingt geaendertVon nicht auf die eigene Kennung. Die Herkunft einer Aenderung waere faelschbar.');
    p(/request\.resource\.data\.geaendertAm\s*==\s*request\.time/u.test(welt.text),
      'match /wiki_welt/ erzwingt geaendertAm nicht auf die Serverzeit. Das Datum waere faelschbar.');
    p(/request\.resource\.data\.inhalt\.size\(\)\s*<=\s*\d+/u.test(welt.text),
      'match /wiki_welt/ begrenzt die Groesse von inhalt nicht. Firestore laesst 1 MiB je Dokument zu — das ist keine Grenze, die jemand versehentlich einhaelt.');
  }

  const zugang = blockLesen(regeltext, maske, sammlungMuster('wiki_zugang'));
  p(zugang !== null, 'Der Block match /wiki_zugang/ fehlt. Ohne ihn gibt es keine eigene Freigabe fuer das Wiki.');
  if (zugang) {
    p(!/allow\s+read\s*:\s*if\s+true\s*;/u.test(zugang.text),
      'match /wiki_zugang/ erlaubt oeffentliches Lesen. Die Liste der Konten mit ihren Mailadressen gehoert nicht ins offene Netz.');
  }

  return { meldungen, anzahl };
}

/* ------------------------------------------------------------------ *
   Ausfuehren
   ------------------------------------------------------------------ */

if (!existsSync(REGELDATEI)) {
  console.error('Firestore-Trennung nicht pruefbar: firestore.rules fehlt (erwartet unter ' + REGELDATEI + ').');
  process.exit(1);
}

const scotoPfad = SCOTOPHOBIA_KANDIDATEN.find((p) => existsSync(p));
if (!scotoPfad) {
  /* Ohne Vergleichsquelle ist diese Pruefung wertlos. Sie darf dann nicht
     gruen werden, sondern muss laut scheitern: Ein stiller Erfolg wuerde
     genau die Sicherheit vortaeuschen, um derentwillen es sie gibt. */
  console.error('Firestore-Trennung nicht pruefbar: Scotophobias Regeldatei wurde nicht gefunden.');
  console.error('Gesucht an:\n- ' + SCOTOPHOBIA_KANDIDATEN.join('\n- '));
  console.error('Ohne diese Datei laesst sich nicht feststellen, ob firestore.rules Scotophobia noch vollstaendig enthaelt.');
  console.error('Abhilfe: Pfad in der Umgebungsvariablen SCOTOPHOBIA_REGELN setzen.');
  process.exit(1);
}

const regeltext = readFileSync(REGELDATEI, 'utf8');
const scotoText = readFileSync(scotoPfad, 'utf8');

const lauf = pruefeRegeln(regeltext, scotoText);
pruefungen += lauf.anzahl;
fehler.push(...lauf.meldungen);

/* ------------------------------------------------------------------ *
   6. Selbsttest: schlaegt die Pruefung ueberhaupt an?

   Eine Wache, die nie rot wird, bewacht nichts. Deshalb wird die
   Regeldatei im Speicher beschaedigt und die Pruefung erneut darauf
   angesetzt. Auf die Festplatte wird dabei nichts geschrieben.
   ------------------------------------------------------------------ */

/* Welcher Block beschaedigt wird, steht nicht fest im Code, sondern kommt
   aus Scotophobias Regeldatei. Benennt Scotophobia seine Sammlungen um,
   zielt der Selbsttest weiterhin auf eine echte. */
const scotoNamen = sammlungenLesen(maskiere(scotoText));
const opfer = scotoNamen[scotoNamen.length - 1] || 'spielstaende';

const proben = [
  {
    name: 'Scotophobias Block match /' + opfer + '/ entfernt',
    stichwort: opfer,
    aendere: (text) => {
      const maske = maskiere(text);
      const b = blockLesen(text, maske, sammlungMuster(opfer));
      return b ? text.slice(0, b.start) + text.slice(b.ende) : text;
    },
  },
  {
    /* Der gefaehrlichere Fall: Der Block bleibt stehen, nur eine Bedingung
       wird entschaerft. Das faellt beim Lesen niemandem auf. */
    name: 'Bedingung in match /' + opfer + '/ still entschaerft',
    stichwort: 'weicht von Scotophobias Fassung ab',
    aendere: (text) => {
      const maske = maskiere(text);
      const b = blockLesen(text, maske, sammlungMuster(opfer));
      if (!b) return text;
      return text.slice(0, b.start) + b.text.replace(/if\s+/u, 'if true || ') + text.slice(b.ende);
    },
  },
  {
    name: 'wiki_welt ruft Scotophobias istFreigeschaltet() auf',
    stichwort: 'istFreigeschaltet',
    aendere: (text) => text.replace('if istWikiSchreiber()', 'if istFreigeschaltet()'),
  },
  {
    name: 'Riegel auf if true gestellt',
    stichwort: 'Riegel',
    aendere: (text) => {
      const maske = maskiere(text);
      const b = blockLesen(text, maske, /match\s+\/\{document=\*\*\}\s*\{/u);
      if (!b) return text;
      return text.slice(0, b.start) + b.text.replace('if false', 'if true') + text.slice(b.ende);
    },
  },
  {
    name: 'Wiki-Sammlung ohne Praefix (wiki_welt zu weltdaten)',
    stichwort: 'weltdaten',
    aendere: (text) => text.split('wiki_welt').join('weltdaten'),
  },
  {
    name: 'oeffentliches Lesen der Weltdaten entfernt',
    stichwort: 'Besucher',
    aendere: (text) => text.replace('allow read: if true;', 'allow read: if istWikiSchreiber();'),
  },
];

const selbsttest = [];
for (const probe of proben) {
  const beschaedigt = probe.aendere(regeltext);

  /* Wenn die Beschaedigung gar nicht griff, prueft der Selbsttest nichts.
     Das ist selbst ein Fehler und keine bestandene Probe. */
  pruefe(beschaedigt !== regeltext, 'Selbsttest „' + probe.name + '" konnte die Regeldatei nicht veraendern. Damit belegt er nichts.');
  if (beschaedigt === regeltext) continue;

  const ergebnis = pruefeRegeln(beschaedigt, scotoText);
  pruefe(ergebnis.meldungen.length > 0, 'Selbsttest „' + probe.name + '": Die Pruefung meldete keinen Fehler. Sie wuerde diesen Schaden also durchlassen.');
  const passend = ergebnis.meldungen.find((m) => m.includes(probe.stichwort));
  pruefe(Boolean(passend), 'Selbsttest „' + probe.name + '": Es kam zwar eine Meldung, aber keine, die „' + probe.stichwort + '" nennt. Dann trifft die Pruefung etwas anderes als den erzeugten Schaden.');
  selbsttest.push({ name: probe.name, meldungen: ergebnis.meldungen.length, erste: passend || ergebnis.meldungen[0] || '(keine)' });
}

/* ------------------------------------------------------------------ *
   Nebenprobe: decken die Regeln die Sammlungen ab, die der Code benutzt?

   werkzeuge/firestore-format.mjs legt die Sammlungsnamen fest. Weicht die
   Regeldatei davon ab, schreibt das Wiki in eine Sammlung, die der Riegel
   sperrt. Die Probe ist freiwillig: Fehlt die Datei, faellt sie aus, statt
   diese Pruefung an einer fremden Datei scheitern zu lassen.
   ------------------------------------------------------------------ */

let formatGeprueft = false;
const formatDatei = join(WURZEL, 'werkzeuge', 'firestore-format.mjs');
if (existsSync(formatDatei)) {
  try {
    const format = await import('./firestore-format.mjs');
    const maske = maskiere(regeltext);
    for (const [feld, wert] of [['SAMMLUNG', format.SAMMLUNG], ['ZUGANG', format.ZUGANG]]) {
      if (typeof wert !== 'string' || !wert) continue;
      formatGeprueft = true;
      pruefe(sammlungenLesen(maske).includes(wert),
        'firestore-format.mjs benutzt die Sammlung ' + wert + ' (' + feld + '), aber firestore.rules kennt sie nicht. Der Riegel wuerde jeden Zugriff darauf sperren.');
    }
  } catch (ursache) {
    pruefe(false, 'werkzeuge/firestore-format.mjs liess sich nicht laden: ' + ursache.message);
  }
}

/* ------------------------------------------------------------------ *
   Kein zerrissener Kommentar

   Am 04.09.2026 wurde diese Datei aus Scotophobias Fassung neu gebaut,
   und der Schnitt begann mitten in einem Kommentarblock: Das oeffnende
   „/*" fehlte, das schliessende blieb stehen. Firestore las den
   Kommentartext daraufhin als Code und wies die ganze Datei ab.

   Eine blosse Zaehlung von „/*" gegen „*\/" haette das nicht gefangen —
   sie war ausgeglichen, weil ein neu geschriebener Kommentar das fehlende
   Zeichenpaar zufaellig ausglich. Gezaehlt wird deshalb der Reihe nach:
   Ein „*\/" ohne offenen Kommentar ist ein Fehler, und am Dateiende darf
   kein Kommentar offen sein.
   ------------------------------------------------------------------ */

{
  const text = regeltext.replace(/\r\n/gu, '\n');
  let offen = false;
  let zerrissen = 0;
  let verwaist = 0;
  for (let i = 0; i < text.length - 1; i += 1) {
    if (!offen && text[i] === '/' && text[i + 1] === '*') { offen = true; i += 1; continue; }
    if (offen && text[i] === '*' && text[i + 1] === '/') { offen = false; i += 1; continue; }
    if (!offen && text[i] === '*' && text[i + 1] === '/') { verwaist += 1; i += 1; }
  }
  if (offen) zerrissen += 1;
  pruefe(verwaist === 0, 'In firestore.rules stehen ' + verwaist + ' schliessende Kommentarzeichen ohne oeffnendes. Der Text davor wird als Code gelesen, und Firebase weist die Datei ab.');
  pruefe(zerrissen === 0, 'In firestore.rules bleibt am Ende ein Kommentar offen. Alles danach wuerde verschluckt.');
}

/* ------------------------------------------------------------------ *
   Ergebnis
   ------------------------------------------------------------------ */

if (fehler.length) {
  console.error('Firestore-Trennung fehlgeschlagen:\n- ' + fehler.join('\n- '));
  process.exitCode = 1;
} else {
  const maske = maskiere(regeltext);
  const sammlungen = sammlungenLesen(maske);
  const scotoSammlungen = sammlungenLesen(maskiere(scotoText));
  const wikiSammlungen = sammlungen.filter((n) => !scotoSammlungen.includes(n));

  console.log('Age-of-Beast-Wiki – Firestore-Trennung geprueft');
  console.log('Pruefungen: ' + pruefungen);
  console.log('Vergleichsquelle: ' + scotoPfad);
  console.log('Scotophobia: ' + scotoSammlungen.length + ' Sammlungen (' + scotoSammlungen.join(', ') + ') wortgleich enthalten');
  console.log('Wiki: ' + wikiSammlungen.length + ' Sammlungen (' + wikiSammlungen.join(', ') + ')');
  console.log('Selbsttest: ' + selbsttest.length + ' von ' + proben.length + ' Beschaedigungen wurden erkannt');
  for (const s of selbsttest) {
    console.log('  - ' + s.name + ' → ' + s.meldungen + ' Meldung(en)');
  }
  if (formatGeprueft) console.log('Sammlungsnamen stimmen mit werkzeuge/firestore-format.mjs ueberein.');
  console.log('Ergebnis: ein Deploy dieser Datei laesst Scotophobia unveraendert, und beide Anwendungen haben getrennte Freigaben.');
}
