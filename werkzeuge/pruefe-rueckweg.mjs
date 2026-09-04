/**
 * Ein Verweis tut, was sein Text verspricht.  [Aufgabe: Prüfwesen]
 *
 * ⚠️ **Warum es diese Prüfung gibt:** Am 04.09.2026 ist `index.html`
 * vom Wiki zum Hauptmenü geworden, und das Wiki nach `wiki.html`
 * gezogen. Zehn Verweise auf fünf Unterseiten sagten weiterhin
 * „Zurück ins Wiki" und führten ab diesem Moment ins **Menü**.
 *
 * Nichts stürzte ab, keine Prüfung schlug an, die Kette war grün —
 * der Knopf tat nur jedes Mal etwas anderes, als er ankündigte. Genau
 * dafür ist diese Datei da: Sie liest den **Text** eines Verweises und
 * vergleicht ihn mit seinem **Ziel**.
 *
 * Zusätzlich: Wer solche Verweise trägt, muss `wiki-rueckweg.js`
 * laden. Ohne das Modul verliert man beim Zurückgehen die
 * Wiki-Kennung und landet im falschen Wiki, sobald es mehrere gibt.
 *
 * Kein Browser, kein Netzwerk. Es wird nichts geschrieben.
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const WURZEL = join(dirname(fileURLToPath(import.meta.url)), '..');

let pruefungen = 0;
const fehler = [];
const pruefe = (wert, text) => { pruefungen += 1; if (!wert) fehler.push(text); };

/* Das Hauptmenü ist die eine Seite, für die `./` richtig ist — es
   *ist* `./`. Alle anderen sind Unterseiten. */
const MENUE = 'index.html';

const seiten = readdirSync(WURZEL)
  .filter((n) => n.endsWith('.html') && n !== MENUE);

pruefe(seiten.length > 0,
  'Es wurde keine einzige Unterseite gefunden — die Prüfung liefe ins Leere.');

for (const seite of seiten) {
  const pfad = join(WURZEL, seite);
  if (!existsSync(pfad)) continue;
  const text = readFileSync(pfad, 'utf8');

  /* Jeden Verweis mit seinem sichtbaren Text einsammeln. */
  const verweise = [...text.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gu)]
    .map((m) => {
      const ziel = (/href=["']([^"']*)["']/u.exec(m[1]) || [, ''])[1];
      /* Markup und HTML-Entitäten weg — es zählt, was ein Mensch liest. */
      const beschriftung = m[2]
        .replace(/<[^>]*>/gu, ' ')
        .replace(/&[a-z]+;/giu, ' ')
        .replace(/\s+/gu, ' ')
        .trim();
      return { ziel, beschriftung };
    });

  for (const { ziel, beschriftung } of verweise) {
    /* Verspricht der Text das Wiki? „Hauptmenü" schlägt das, denn
       „Zurück zum Hauptmenü" ist ein ehrlicher Verweis auf `./`. */
    const verspricht = /\bwiki\b/iu.test(beschriftung)
      && !/haupt-?men/iu.test(beschriftung);
    if (!verspricht) continue;

    pruefe(ziel !== './' && ziel !== '' && ziel !== 'index.html',
      seite + ': Der Verweis „' + beschriftung + '" zeigt auf `' + ziel
      + '` — das ist das Hauptmenü, nicht das Wiki. Seit dem 04.09.2026 '
      + 'liegt das Wiki unter `wiki.html`.');

    pruefe(/^wiki\.html/u.test(ziel),
      seite + ': Der Verweis „' + beschriftung + '" zeigt auf `' + ziel
      + '`, erwartet wird `wiki.html`.');
  }

  /* Jede Seite mit seiteninternen Verweisen braucht das Kennungs-Modul
     — und zwar in **beide** Richtungen. Die Kennung geht nicht erst
     beim Zurückgehen verloren, sondern schon beim Hinausgehen: Wer aus
     `wiki.html?w=…` auf „Karten" klickt, landet ohne sie. */
  const intern = verweise.filter((v) => /^[a-z0-9-]+.html$/iu.test(v.ziel)
    && v.ziel !== 'index.html');
  if (intern.length === 0) continue;

  pruefe(text.includes('runtime/wiki-rueckweg.js'),
    seite + ' trägt ' + intern.length + ' seiteninterne Verweis(e) ('
    + intern.map((v) => v.ziel).join(', ') + '), lädt aber '
    + '`runtime/wiki-rueckweg.js` nicht. Ohne das Modul verliert jeder '
    + 'Klick die Wiki-Kennung.');
}

/* Das Modul selbst: Es darf nichts tun, wenn keine Kennung dasteht. */
const modul = join(WURZEL, 'runtime/wiki-rueckweg.js');
pruefe(existsSync(modul), 'runtime/wiki-rueckweg.js fehlt.');
if (existsSync(modul)) {
  const code = readFileSync(modul, 'utf8');
  pruefe(/try\s*\{[\s\S]*URLSearchParams/u.test(code),
    'wiki-rueckweg.js liest die Adresse ohne try/catch. Eine kaputte '
    + 'Adresse **wirft**, und dann bliebe die ganze Seite ohne Skript.');
  pruefe(/if\s*\(\s*!\s*kennung\s*\)\s*return/u.test(code),
    'wiki-rueckweg.js kehrt ohne Kennung nicht sofort um — dann würde es '
    + 'die statischen Verweise anfassen, obwohl es nichts beizutragen hat.');
}


/* ------------------------------------------------------------------ *
 * Das Modul wird ausgefuehrt, nicht gelesen
 * ------------------------------------------------------------------ *
 *
 * Erst stand hier ein Textmuster: kommt `MENUE` im Code vor? Beim
 * Rot-Beweis blieb es **gruen**, obwohl das Hauptmenue nachweislich
 * nicht mehr ausgenommen war — der Name stand noch an einer zweiten
 * Stelle. Eine Pruefung, die die Schreibweise liest statt das
 * Verhalten, ist Zierde.
 *
 * Deshalb laeuft das Modul jetzt wirklich, gegen eine winzige
 * DOM-Attrappe. Es fasst nur `querySelectorAll`, `getAttribute` und
 * `setAttribute` an; mehr braucht die Attrappe nicht.
 */
{
  const quelle = readFileSync(join(WURZEL, 'runtime/wiki-rueckweg.js'), 'utf8');

  const laufe = (adresse, ziele) => {
    const verweise = ziele.map((z) => {
      let href = z;
      return {
        getAttribute: (n) => (n === 'href' ? href : null),
        setAttribute: (n, w) => { if (n === 'href') href = w; },
        get href() { return href; },
      };
    });
    const umgebung = {
      location: { search: adresse },
      document: {
        readyState: 'complete',
        addEventListener() {},
        /* Der Selektor wird **beachtet**. Ohne das bliebe unbemerkt,
           wenn das Modul sich wieder auf `a[href="wiki.html"]`
           verengte — genau das war Rot-Beweis 7, und die erste
           Fassung dieser Attrappe hat ihn durchgelassen. */
        querySelectorAll: (wahl) => {
          if (wahl === 'a[href]') return verweise;
          const m = /^a\[href="([^"]*)"\]$/u.exec(wahl);
          if (m) return verweise.filter((v) => v.href === m[1]);
          throw new Error('Die Attrappe kennt den Selektor nicht: ' + wahl);
        },
      },
      URLSearchParams,
      encodeURIComponent,
    };
    const namen = Object.keys(umgebung);
    /* eslint-disable no-new-func */
    Function(...namen, quelle)(...namen.map((n) => umgebung[n]));
    return verweise.map((v) => v.href);
  };

  const ZIELE = ['wiki.html', 'karten.html', 'index.html', './',
    'https://example.org/x.html', '#anker', 'wiki.html?w=anderes'];

  const mit = laufe('?w=age-of-beast', ZIELE);
  pruefe(mit[0] === 'wiki.html?w=age-of-beast',
    'Der Rueckweg bekommt die Kennung nicht: ' + mit[0]);
  pruefe(mit[1] === 'karten.html?w=age-of-beast',
    'Ein hinausfuehrender Verweis bekommt die Kennung nicht: ' + mit[1]
    + '. Dann ist sie schon weg, bevor der Rueckweg sie tragen koennte.');
  pruefe(mit[2] === 'index.html',
    'Das Hauptmenue hat eine Kennung bekommen: ' + mit[2]
    + '. Es steht ueber allen Wikis und hat keine.');
  pruefe(mit[3] === './',
    'Der Menue-Verweis `./` wurde angefasst: ' + mit[3]);
  pruefe(mit[4] === 'https://example.org/x.html',
    'Ein fremder Verweis wurde angefasst: ' + mit[4]);
  pruefe(mit[5] === '#anker', 'Ein Anker wurde angefasst: ' + mit[5]);
  pruefe(mit[6] === 'wiki.html?w=anderes',
    'Ein Verweis mit eigener Abfrage wurde ueberschrieben: ' + mit[6]
    + '. Dann stuende die Kennung zweimal da.');

  /* Ohne Kennung darf sich gar nichts aendern. */
  const ohne = laufe('', ZIELE);
  pruefe(ohne.join('|') === ZIELE.join('|'),
    'Ohne Kennung wurden Verweise veraendert: ' + ohne.join(' | '));

  /* Eine Umgebung, in der das Lesen der Adresse **wirft** — genau
     dafuer ist das try/catch da. Ein erdachter kaputter Wert genuegt
     nicht: `URLSearchParams` raeumt ihn stillschweigend auf und wirft
     nie. Also wirft hier der Zugriff selbst, so wie es ein privates
     Fenster tut. */
  let geworfen = false;
  try {
    const boese = {
      location: { get search() { throw new Error('kein Zugriff'); } },
      document: { readyState: 'complete', addEventListener() {},
        querySelectorAll: () => [] },
      URLSearchParams,
      encodeURIComponent,
    };
    const n = Object.keys(boese);
    Function(...n, quelle)(...n.map((k) => boese[k]));
  } catch (e) {
    geworfen = true;
  }
  pruefe(!geworfen,
    'Das Modul faengt einen Fehler beim Lesen der Adresse nicht ab. In '
    + 'einem privaten Fenster **wirft** der Zugriff, und dann bliebe die '
    + 'ganze Seite ohne dieses Skript.');
}

/* ------------------------------------------------------------------ *
 * Die Wegweiser-Tabelle beschreibt jede Prüfung, die es gibt
 * ------------------------------------------------------------------ *
 *
 * ⚠️ Am 04.09.2026 fehlten dort **sechs** Prüfungen und **eine stand
 * drin, die es nicht mehr gab**. Die drei Codex-Pakete hatten ihre
 * Zeilen nicht ergänzt, und `pruefe-github.mjs` war beim Abschalten
 * des GitHub-Wegs verschwunden.
 *
 * Das macht nichts rot — es macht die Landkarte still falsch. Und die
 * Landkarte ist die Datei, die man **zuerst** öffnet. Wer ihr glaubt,
 * hält sechs Zusicherungen für nicht vorhanden und eine für gegeben,
 * die niemand mehr prüft.
 */
{
  const kette = join(WURZEL, 'werkzeuge/pruefe-alles.mjs');
  const vorhanden = readdirSync(join(WURZEL, 'werkzeuge'))
    .filter((n) => /^pruefe-.+\.mjs$/u.test(n))
    /* Die Kette beschreibt sich selbst in Prosa, nicht als Zeile.
       `pruefe-freigabe` steht absichtlich außerhalb und ist im Text
       erklärt — beide bekommen keine Tabellenzeile. */
    .filter((n) => n !== 'pruefe-alles.mjs' && n !== 'pruefe-freigabe.mjs');

  const text = readFileSync(kette, 'utf8');
  const genannt = new Set(
    [...text.matchAll(/^ *\| `(pruefe-[a-z-]+\.mjs)` \|/gmu)].map((m) => m[1]));

  for (const datei of vorhanden) {
    pruefe(genannt.has(datei),
      'werkzeuge/pruefe-alles.mjs: `' + datei + '` läuft in der Kette mit, '
      + 'steht aber nicht in der Wegweiser-Tabelle. Wer die Tabelle liest, '
      + 'hält diese Zusicherung für nicht vorhanden.');
  }
  for (const datei of genannt) {
    pruefe(existsSync(join(WURZEL, 'werkzeuge', datei)),
      'werkzeuge/pruefe-alles.mjs: Die Tabelle nennt `' + datei + '`, die '
      + 'Datei gibt es nicht. Sie verspricht eine Prüfung, die niemand macht.');
  }
}

if (fehler.length) {
  console.error('Rückweg fehlgeschlagen:\n- ' + fehler.join('\n- '));
  process.exitCode = 1;
} else {
  console.log('Rückweg geprüft');
  console.log('Prüfungen: ' + pruefungen);
  console.log('Ergebnis: Jeder Verweis führt dahin, wo sein Text es verspricht.');
}
