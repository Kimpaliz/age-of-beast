/* ===================================================================
   Age of Beast – Favoriten prüfen
   [Aufgabe: Prüfwesen]

   -------------------------------------------------------------------
   Dieser Wächter führt die echte Favoriten-Fassade in einer kleinen
   Browser-Attrappe aus. So prüft er den Fehlerpfad von localStorage,
   das Umschalten und die Liste zusammen, ohne dafür ein Paket oder ein
   echtes Benutzerprofil zu brauchen.
   =================================================================== */

import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const WURZEL = join(dirname(fileURLToPath(import.meta.url)), '..');
const FAVORITEN = join(WURZEL, 'runtime', 'favoriten.js');
const LISTE = join(WURZEL, 'runtime', 'favoriten-liste.js');
const SEITE = join(WURZEL, 'favoriten.html');
const STIL = join(WURZEL, 'styles', 'favoriten.css');
let anzahl = 0;
const fehler = [];

function pruefe(wert, text) {
  anzahl += 1;
  if (!wert) fehler.push(text);
}

function lauf(name, fn) {
  try {
    fn();
    pruefe(true, name);
  } catch (fehlertext) {
    pruefe(false, name + ': ' + (fehlertext?.message || String(fehlertext)));
  }
}

class Knoten {
  constructor(name) {
    this.tagName = String(name).toUpperCase();
    this.children = [];
    this.dataset = {};
    this.attribute = {};
    this.horcher = new Map();
    this.className = '';
    this._text = '';
  }

  append(...kinder) {
    for (const kind of kinder) this.appendChild(kind);
  }

  appendChild(kind) {
    if (typeof kind === 'string') kind = new Textknoten(kind);
    this.children.push(kind);
    return kind;
  }

  replaceChildren(...kinder) {
    this.children = [];
    this._text = '';
    this.append(...kinder);
  }

  set textContent(wert) {
    this._text = String(wert);
    this.children = [];
  }

  get textContent() {
    return this._text + this.children.map((kind) => kind.textContent || '').join('');
  }

  setAttribute(name, wert) {
    this.attribute[name] = String(wert);
  }

  addEventListener(art, rueckruf) {
    const liste = this.horcher.get(art) || [];
    liste.push(rueckruf);
    this.horcher.set(art, liste);
  }

  ausloesen(art) {
    for (const rueckruf of this.horcher.get(art) || []) {
      rueckruf({ preventDefault() {}, stopPropagation() {} });
    }
  }
}

class Textknoten {
  constructor(text) { this.textContent = String(text); }
}

function speicherMit(roh = null) {
  let wert = roh;
  return {
    getItem() { return wert; },
    setItem(_schluessel, neu) { wert = String(neu); },
    roh() { return wert; },
  };
}

function umgebung(speicher) {
  const liste = new Knoten('main');
  const fensterhorcher = new Map();
  const window = {
    localStorage: speicher,
    addEventListener(art, rueckruf) {
      const eintraege = fensterhorcher.get(art) || [];
      eintraege.push(rueckruf);
      fensterhorcher.set(art, eintraege);
    },
  };
  window.window = window;
  const document = {
    getElementById(id) { return id === 'favoritenliste' ? liste : null; },
    createElement(name) { return new Knoten(name); },
  };
  const sandkasten = { window, document, console, Date, JSON, String, Array, Object };
  vm.createContext(sandkasten);
  new vm.Script(readFileSync(FAVORITEN, 'utf8'), { filename: 'runtime/favoriten.js' })
    .runInContext(sandkasten);
  return { window, liste, sandkasten };
}

function alleKnoten(wurzel) {
  const gefunden = [];
  const gehe = (knoten) => {
    gefunden.push(knoten);
    for (const kind of knoten.children || []) gehe(kind);
  };
  gehe(wurzel);
  return gefunden;
}

function listeStarten(szenario) {
  new vm.Script(readFileSync(LISTE, 'utf8'), { filename: 'runtime/favoriten-liste.js' })
    .runInContext(szenario.sandkasten);
}

function ausgeben() {
  if (fehler.length) {
    console.error('Favoritenprüfung fehlgeschlagen:\n- ' + fehler.join('\n- '));
    process.exitCode = 1;
  } else {
    console.log('Age-of-Beast-Wiki – Favoriten geprüft');
    console.log(anzahl + ' Prüfungen, 0 Fehler');
  }
}

if (!existsSync(FAVORITEN)) {
  pruefe(false, 'runtime/favoriten.js fehlt.');
  ausgeben();
} else if (process.argv.includes('--beweis-rot')) {
  /* Dieser Gegenfall ist absichtlich falsch: Zwei Umschaltungen müssen
     den ursprünglichen Zustand wiederherstellen, nicht zwei Einträge
     erzeugen. Ein grüner Lauf hier würde den Kernvertrag widerlegen. */
  lauf('Rotbeweis: zwei Umschaltungen dürfen nicht zwei Favoriten erzeugen', () => {
    const szenario = umgebung(speicherMit());
    const api = szenario.window.aobFavoriten;
    api.umschalten('bogen', 'figur-1', 'Figur 1');
    api.umschalten('bogen', 'figur-1', 'Figur 1');
    assert.equal(api.anzahl(), 2, 'Der absichtlich falsche Erwartungswert muss scheitern.');
  });
  ausgeben();
} else {
  pruefe(existsSync(LISTE), 'runtime/favoriten-liste.js ist vorhanden.');
  pruefe(existsSync(SEITE), 'favoriten.html ist vorhanden.');
  pruefe(existsSync(STIL), 'styles/favoriten.css ist vorhanden.');

  if (existsSync(SEITE)) {
    const seite = readFileSync(SEITE, 'utf8');
    pruefe(seite.includes('runtime/favoriten.js') && seite.includes('runtime/favoriten-liste.js'),
      'Die Favoritenseite lädt Fassade und Liste in dieser Reihenfolge.');
    pruefe(seite.includes('id="favoritenliste"'),
      'Die Favoritenseite besitzt das eindeutige Listen-Ziel.');
  }

  lauf('Werfender localStorage stoppt die Favoriten-Fassade nicht', () => {
    const kaputt = {
      getItem() { throw new Error('Speicher gesperrt'); },
      setItem() { throw new Error('Speicher gesperrt'); },
    };
    const api = umgebung(kaputt).window.aobFavoriten;
    assert.equal(api.alle().length, 0);
    assert.doesNotThrow(() => api.umschalten('karte', 'karte-1', 'Karte 1'));
  });

  lauf('Umschalten ist umkehrbar und legt keinen doppelten Eintrag an', () => {
    const speicher = speicherMit();
    const api = umgebung(speicher).window.aobFavoriten;
    let aenderungen = 0;
    api.beiAenderung(() => { aenderungen += 1; });
    assert.equal(api.umschalten('karte', 'karte-1', 'Karte 1'), true);
    assert.equal(api.anzahl(), 1);
    assert.equal(api.umschalten('karte', 'karte-1', 'Karte 1'), false);
    assert.equal(api.anzahl(), 0);
    assert.equal(aenderungen, 2);
    assert.deepEqual(JSON.parse(speicher.roh()), []);
  });

  if (existsSync(LISTE)) {
    lauf('Beschädigte Speicherzeilen lassen die Favoritenliste nicht abstürzen', () => {
      const speicher = speicherMit(JSON.stringify([
        null,
        { typ: 'eintrag', id: 'eintrag-1', name: { unerwartet: true } },
        { typ: 'karte', id: 'karte-1', name: 'Karte 1' },
        { typ: 'unbekannt', id: 'weg', name: 'Nicht anzeigen' },
        { typ: 'bogen', id: '', name: 'Leer' },
      ]));
      const szenario = umgebung(speicher);
      assert.doesNotThrow(() => listeStarten(szenario));
      const knoten = alleKnoten(szenario.liste);
      assert.ok(knoten.some((k) => k.tagName === 'A' && k.href === './#/eintrag/eintrag-1'));
      assert.ok(knoten.some((k) => k.tagName === 'A' && k.href === 'karten.html?karte=Karte%201'));
      assert.ok(!knoten.some((k) => String(k.textContent).includes('Nicht anzeigen')));
    });

    lauf('Die Liste zeichnet sich bei einer Änderung sofort neu', () => {
      const szenario = umgebung(speicherMit());
      listeStarten(szenario);
      const api = szenario.window.aobFavoriten;
      api.umschalten('bogen', 'figur-1', 'Figur 1');
      assert.ok(alleKnoten(szenario.liste).some((k) => k.tagName === 'A' && k.href === 'bogen.html?figur=figur-1'));
      api.umschalten('bogen', 'figur-1', 'Figur 1');
      assert.ok(String(szenario.liste.textContent).includes('Stern'));
    });
  }

  ausgeben();
}
