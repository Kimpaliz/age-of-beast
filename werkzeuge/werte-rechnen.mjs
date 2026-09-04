/**
 * Aus Grundwert und Ausrüstung wird ein Endwert — mit Herleitung.
 * [Aufgabe: Charakterbogen]
 *
 * -------------------------------------------------------------------
 * Janniks Wunsch vom 04.09.2026: „Die Charakterbögen, die Werte wie
 * Stress, HP, Rüstung usw. sollen sich automatisch ändern beim An- oder
 * Ablegen von Items. Und beim Drüberhalten wird angezeigt, was Grundwert
 * und was Bonus oder Malus ist und wodurch es verursacht wird."
 *
 * ⚠️ **Warum das ein Umbau ist und keine Anzeige.** Bisher standen in
 * den Figurendaten **fertige Endwerte**: Brix hat `evasion: 13`. Dass
 * darin 12 Klassenbasis und +1 vom Gambeson stecken, wusste niemand —
 * es stand nirgends. Ein Wert ohne Herkunft lässt sich weder erklären
 * noch nachrechnen, und beim Ablegen der Rüstung könnte man ihn nicht
 * zurücknehmen.
 *
 * Dieses Modul dreht das um: **Grundwert plus Beiträge ergibt den
 * Endwert.** Jeder Beitrag weiß, woher er kommt.
 *
 * ── Was gerechnet wird und was nicht ────────────────────────────────
 *
 * Gemessen am 04.09.2026: Von 123 Gegenständen tragen 93 einen
 * Wirkungstext — aber die **große Mehrheit ist Spielregel, kein
 * Zahlenbonus**: „Stress markieren, um ein weiteres Ziel anzugreifen",
 * „kehrt nach dem Wurf in die Hand zurück". Solche Wirkungen kann kein
 * Rechner anwenden; sie hängen an einer Entscheidung am Tisch.
 *
 * Deshalb die harte Trennung:
 *
 *   - **Rechenbar** ist nur, was eine Zahl auf einen benannten Wert
 *     legt (`+1 auf Evasion`, `−1 Finesse`). Das wird verrechnet.
 *   - Alles andere bleibt **Hinweistext** am Gegenstand. Es wird
 *     angezeigt, aber nie stillschweigend eingerechnet.
 *
 * Eine Wirkung als Bonus zu raten wäre schlimmer als sie stehen zu
 * lassen: Der Bogen zeigte dann eine Zahl, die im Spiel nicht gilt.
 *
 * Kein DOM, keine Uhr, kein Zufall — damit vollständig in Node prüfbar.
 */

/* Die Werte, auf die ein Gegenstand wirken kann. Der Schlüssel ist der
   in den Figurendaten, der Name das, was auf dem Bogen steht. */
export const WERTE = {
  evasion: 'Ausweichen',
  ruestungswert: 'Rüstungswert',
  hp: 'Lebenspunkte',
  stress: 'Stress',
  schwelleSchwer: 'Schwere Schwelle',
  schwelleErnst: 'Ernste Schwelle',
  agility: 'Agility',
  strength: 'Strength',
  finesse: 'Finesse',
  instinct: 'Instinct',
  presence: 'Presence',
  knowledge: 'Knowledge',
};

/* ------------------------------------------------------------------ *
 * Wirkungstexte lesen
 * ------------------------------------------------------------------ *
 *
 * Die Muster stehen absichtlich einzeln und nicht als ein grosser
 * Ausdruck: Jedes ist an einem echten Text aus
 * `daten/daggerheart-gegenstaende.json` belegt, und der Text steht als
 * Beispiel daneben. Was keinem Muster entspricht, bleibt Hinweis —
 * **nicht** ein geratener Bonus.
 */
const MUSTER = [
  /* „+1 auf Evasion", „−1 Evasion", „+1 auf Ausweichen" */
  { wert: 'evasion', regel: /([+−\-–]\s*\d+)\s*(?:auf\s+)?(?:Evasion|Ausweichen)/iu },
  /* „+1 Rüstungswert", „+1/+2/+3/+4 Rüstungswert" → die erste Stufe */
  { wert: 'ruestungswert', regel: /([+−\-–]\s*\d+)(?:\/[+−\-–]?\d+)*\s*(?:auf\s+)?Rüstungswert/iu },
  /* „+2/+3/+4/+5 Schadensschwellen" → gilt für beide Schwellen */
  { wert: 'schwellen', regel: /([+−\-–]\s*\d+)(?:\/[+−\-–]?\d+)*\s*(?:auf\s+)?Schadensschwellen/iu },
  /* „−1 Finesse", „−1 Agility" — die sechs Attribute */
  { wert: 'agility', regel: /([+−\-–]\s*\d+)\s*Agility/iu },
  { wert: 'strength', regel: /([+−\-–]\s*\d+)\s*Strength/iu },
  { wert: 'finesse', regel: /([+−\-–]\s*\d+)\s*Finesse/iu },
  { wert: 'instinct', regel: /([+−\-–]\s*\d+)\s*Instinct/iu },
  { wert: 'presence', regel: /([+−\-–]\s*\d+)\s*Presence/iu },
  { wert: 'knowledge', regel: /([+−\-–]\s*\d+)\s*Knowledge/iu },
];

/** Wandelt „−1" (mit echtem Minuszeichen) in die Zahl −1. */
function zahl(text) {
  const bereinigt = String(text).replace(/[−–]/gu, '-').replace(/\s+/gu, '');
  const n = Number(bereinigt);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Liest aus einem Wirkungstext die rechenbaren Beiträge heraus.
 *
 * Gibt **immer** auch zurück, ob der Text vollständig verstanden wurde.
 * Ein halb verstandener Text ist die gefährlichste Sorte: Man rechnet
 * einen Teil ein und übersieht den Rest.
 */
export function wirkungLesen(text) {
  if (!text) return { beitraege: [], rest: null };
  const beitraege = [];
  for (const { wert, regel } of MUSTER) {
    const treffer = regel.exec(text);
    if (!treffer) continue;
    const delta = zahl(treffer[1]);
    if (!delta) continue;
    if (wert === 'schwellen') {
      beitraege.push({ wert: 'schwelleSchwer', delta });
      beitraege.push({ wert: 'schwelleErnst', delta });
    } else {
      beitraege.push({ wert, delta });
    }
  }
  /* Der Text bleibt als Hinweis stehen, wenn er mehr sagt als die
     gefundenen Zahlen — etwa „−1 Evasion; zusätzlicher Schadenswürfel". */
  const nurZahlen = beitraege.length > 0
    && text.replace(/[+−\-–]\s*\d+(?:\/[+−\-–]?\d+)*\s*(?:auf\s+)?[A-Za-zÄÖÜäöüß]+/gu, '').replace(/[\s;,.]/gu, '') === '';
  return { beitraege, rest: nurZahlen ? null : text };
}

/* ------------------------------------------------------------------ *
 * Rechnen
 * ------------------------------------------------------------------ */

/**
 * Sammelt die Beiträge aller **angelegten** Gegenstände.
 *
 * Ein Gegenstand im Gepäck wirkt nicht — das ist der ganze Punkt an
 * Janniks „beim An- oder Ablegen".
 */
export function beitraegeSammeln(ausruestung = []) {
  const beitraege = [];
  for (const stueck of ausruestung) {
    if (!stueck || stueck.angelegt === false) continue;

    /* Die Rüstung bringt ihren Rüstungswert und ihre Schwellen mit —
       das steht als Feld da und ist kein Freitext. */
    if (typeof stueck.score === 'number') {
      beitraege.push({ wert: 'ruestungswert', delta: stueck.score, quelle: stueck.name, art: 'grundwert' });
    }
    if (stueck.schwellen) {
      if (typeof stueck.schwellen.schwer === 'number') {
        beitraege.push({ wert: 'schwelleSchwer', delta: stueck.schwellen.schwer, quelle: stueck.name, art: 'grundwert' });
      }
      if (typeof stueck.schwellen.ernst === 'number') {
        beitraege.push({ wert: 'schwelleErnst', delta: stueck.schwellen.ernst, quelle: stueck.name, art: 'grundwert' });
      }
    }

    const { beitraege: aus, rest } = wirkungLesen(stueck.wirkung);
    for (const b of aus) {
      beitraege.push({ ...b, quelle: stueck.name, art: 'wirkung', text: stueck.wirkung });
    }
    if (rest) {
      beitraege.push({ wert: null, delta: 0, quelle: stueck.name, art: 'hinweis', text: rest });
    }
  }
  return beitraege;
}

/**
 * Rechnet einen einzelnen Wert aus.
 *
 * Das Ergebnis trägt die Herleitung mit sich — genau das, was Janniks
 * „beim Drüberhalten wird angezeigt, was Grundwert und was Bonus ist"
 * verlangt. Die Anzeige muss nichts nachschlagen.
 */
export function wertRechnen(schluessel, grundwert, beitraege = [], grundQuelle = null) {
  const meine = beitraege.filter((b) => b.wert === schluessel && b.delta);
  const basis = typeof grundwert === 'number' ? grundwert : 0;
  const summe = meine.reduce((s, b) => s + b.delta, 0);
  return {
    wert: schluessel,
    name: WERTE[schluessel] || schluessel,
    endwert: basis + summe,
    grundwert: basis,
    grundQuelle,
    beitraege: meine.map((b) => ({
      delta: b.delta, quelle: b.quelle, art: b.art, text: b.text || null,
    })),
    hatBeitraege: meine.length > 0,
  };
}

/**
 * Der ganze Bogen auf einmal.
 *
 * `basis` sind die Werte **ohne jede Ausrüstung**. Sie stehen in den
 * Figurendaten unter `basis`; fehlen sie, wird der bisherige Endwert
 * genommen und das im Ergebnis vermerkt — dann stimmt die Summe zwar,
 * die Herleitung ist aber unvollständig, und das soll man sehen.
 */
export function bogenRechnen(spielwerte = {}) {
  const basis = spielwerte.basis || {};
  const beitraege = beitraegeSammeln(spielwerte.ausruestung || []);
  const werte = {};
  const ohneBasis = [];

  const hole = (schluessel, altwert, quelle) => {
    const vorhanden = typeof basis[schluessel] === 'number';
    if (!vorhanden && typeof altwert === 'number') ohneBasis.push(schluessel);
    return wertRechnen(schluessel, vorhanden ? basis[schluessel] : altwert, beitraege,
      vorhanden ? quelle : 'bisheriger Endwert, Herkunft unbekannt');
  };

  werte.evasion = hole('evasion', spielwerte.evasion, (spielwerte.klasse || 'Klasse') + '-Basis');
  werte.hp = hole('hp', spielwerte.hp, (spielwerte.klasse || 'Klasse') + '-Basis');
  werte.stress = hole('stress', spielwerte.stress, (spielwerte.klasse || 'Klasse') + '-Basis');
  werte.ruestungswert = wertRechnen('ruestungswert', basis.ruestungswert || 0, beitraege, 'ohne Rüstung');

  /* Die Schadensschwellen sind Rüstungsbasis **plus Stufe** — das ist
     eine Daggerheart-Regel und keine Eigenschaft der Rüstung. Sie wurde
     am 04.09.2026 schon einmal falsch als Kartenwert übernommen. */
  const stufe = typeof spielwerte.stufe === 'number' ? spielwerte.stufe : 0;
  werte.schwelleSchwer = wertRechnen('schwelleSchwer', stufe, beitraege, 'Stufe ' + stufe);
  werte.schwelleErnst = wertRechnen('schwelleErnst', stufe, beitraege, 'Stufe ' + stufe);

  for (const schluessel of ['agility', 'strength', 'finesse', 'instinct', 'presence', 'knowledge']) {
    const grund = (spielwerte.attribute || {})[schluessel];
    werte[schluessel] = wertRechnen(schluessel, typeof grund === 'number' ? grund : 0,
      beitraege, 'Charakterbogen');
  }

  return {
    werte,
    hinweise: beitraege.filter((b) => b.art === 'hinweis'),
    ohneBasis,
  };
}

/**
 * Die Herleitung als Text — für den Tooltip.
 *
 * Bewusst hier und nicht in der Anzeige: Wie ein Wert zustande kommt,
 * ist eine Aussage über die Rechnung, keine über das Aussehen. So lässt
 * sie sich ohne Browser prüfen.
 */
export function herleitung(ergebnis) {
  const zeilen = [ergebnis.name + ': ' + ergebnis.endwert];
  zeilen.push('Grundwert ' + ergebnis.grundwert
    + (ergebnis.grundQuelle ? ' (' + ergebnis.grundQuelle + ')' : ''));
  for (const b of ergebnis.beitraege) {
    zeilen.push((b.delta > 0 ? '+' : '−') + Math.abs(b.delta) + ' durch ' + (b.quelle || 'unbekannt'));
  }
  if (!ergebnis.beitraege.length) zeilen.push('keine Boni oder Mali');
  return zeilen;
}
