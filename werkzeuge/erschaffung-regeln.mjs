/**
 * Die Regeln der Charaktererschaffung — ohne Browser.  [Aufgabe: Charakterbogen]
 *
 * -------------------------------------------------------------------
 * Janniks Frage vom 05.09.2026: „gibt es schon eine caracter erstellung
 * für spieler die einen durch die erstellung begleitet für daggerheart?"
 * Es gab keine. Dies ist ihr Kern.
 *
 * ── Die eine Entscheidung, die alles andere trägt ───────────────────
 *
 * **Die neun Schritte werden nicht hier aufgeschrieben.** Sie stehen
 * längst im Wiki, als die neun Abschnitte des Eintrags
 * `regel-charaktererschaffung` — mit den offiziellen Titeln und dem
 * offiziellen Regeltext. Dieses Modul liest sie von dort.
 *
 * Der Preis einer zweiten Liste wäre nicht die Arbeit, sondern die
 * Uneinigkeit: Ändert jemand die Regel im Wiki, führte der Assistent
 * weiterhin durch die alte — und niemand sähe es, weil beide für sich
 * plausibel bleiben. Dasselbe gilt für die Auswahl in jedem Schritt:
 * Klassen, Unterklassen, Abstammungen, Gemeinschaften, Domänenkarten
 * und Ausrüstung kommen aus den Katalogen, nicht aus Aufzählungen hier.
 *
 * ── Was dieses Modul nicht tut ──────────────────────────────────────
 *
 * Es zeichnet nichts und speichert nichts. Es beantwortet drei Fragen:
 * *Was steht zur Wahl?*, *Ist dieser Schritt fertig?* und *Wie sieht
 * die fertige Figur als Bogen aus?* — Letzteres in genau der Form, die
 * `karte/bogen-zeigen.js` ohnehin liest. Der Assistent baut also keinen
 * eigenen Bogen; er füllt den vorhandenen.
 *
 * Kein DOM, keine Uhr, kein Zufall — vollständig in Node prüfbar.
 *
 * Arbeitet zusammen mit: `karte/erschaffung.js` (die Bedienung),
 * `daten/daggerheart-klassen.json`, `daten/daggerheart-karten.json`,
 * `daten/daggerheart-gegenstaende.json`, `werkzeuge/pruefe-erschaffung.mjs`.
 */

/* Die Verteilung aus Schritt 3 des Regeltextes: „Verteile +2, +1, +1,
   0, 0 und -1 auf die sechs Eigenschaften." Sie steht als Zahlenreihe
   da, weil der Assistent sie als Vorrat austeilt — nicht als Grenze
   prüft. Wer eine +2 vergeben hat, hat keine zweite mehr. */
export const EIGENSCHAFTSVORRAT = [2, 1, 1, 0, 0, -1];

export const EIGENSCHAFTEN = [
  ['agility', 'Agility', 'Beweglichkeit'],
  ['strength', 'Strength', 'Stärke'],
  ['finesse', 'Finesse', 'Fingerfertigkeit'],
  ['instinct', 'Instinct', 'Instinkt'],
  ['presence', 'Presence', 'Ausstrahlung'],
  ['knowledge', 'Knowledge', 'Wissen'],
];

/* Startwerte aus Schritt 4: „Beginne auf Stufe 1 … 6 Stressfeldern,
   2 Hoffnung und Kompetenz 1." Ausweichen und Trefferpunkte stehen
   bewusst **nicht** hier — die kommen aus der Klasse. */
export const START = { stufe: 1, stress: 6, hoffnungStart: 2, hoffnungMax: 6, kompetenz: 1 };

/* Der Vorrat aus Schritt 5, wörtlich aus dem Regeltext. Er ist fest und
   keine Auswahl — deshalb steht er hier und nicht im Katalog. */
export const GRUNDVORRAT = [
  'Fackel', '15 m Seil', 'Grundvorräte', 'eine Handvoll Gold',
  'ein kleiner Heil- oder Ausdauertrank',
];

/* ------------------------------------------------------------------ *
 * Die neun Schritte — aus dem Wiki, nicht von hier
 * ------------------------------------------------------------------ */

/**
 * Liest die Schritte aus dem Regeleintrag.
 *
 * Wirft, wenn der Eintrag fehlt oder nicht neun Abschnitte hat. Ein
 * Assistent mit sieben Schritten, weil zwei Abschnitte umbenannt
 * wurden, wäre die stillste Art, eine Figur unvollständig zu bauen.
 */
export function schritteLesen(welt) {
  const eintrag = (welt?.eintraege || []).find((e) => e.id === 'regel-charaktererschaffung');
  if (!eintrag) throw new Error('Der Regeleintrag „regel-charaktererschaffung" fehlt.');
  const abschnitte = eintrag.abschnitte || [];
  if (abschnitte.length !== 9) {
    throw new Error('9 Schritte erwartet, ' + abschnitte.length + ' im Regeleintrag gefunden.');
  }
  return abschnitte.map((a, i) => ({
    nummer: i + 1,
    /* „1. Klasse und Subklasse" → die Nummer steht schon in `nummer`. */
    titel: String(a.titel || '').replace(/^\s*\d+\.\s*/, ''),
    regel: String(a.html || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(),
    eintragId: eintrag.id,
  }));
}

/* ------------------------------------------------------------------ *
 * Was steht zur Wahl
 * ------------------------------------------------------------------ */

const nachArt = (karten, art) => (karten || []).filter((k) => k.art === art);

export const abstammungen = (karten) => nachArt(karten, 'ancestry');
export const gemeinschaften = (karten) => nachArt(karten, 'community');

/** Die zwei Unterklassen einer Klasse. */
export function unterklassen(karten, klassenname) {
  if (!klassenname) return [];
  return nachArt(karten, 'subclass').filter((k) => k.klasse === klassenname);
}

/**
 * Die Domänenkarten der Stufe 1, die zu dieser Klasse passen.
 *
 * Schritt 8: „Wähle zwei Domänenkarten der Stufe 1 aus den Domänen
 * deiner Klasse. Du darfst je eine Karte aus beiden Domänen oder beide
 * Karten aus derselben Domäne wählen." Die zweite Hälfte ist der Grund,
 * warum hier **nicht** je Domäne gefiltert wird: Beide dürfen aus
 * derselben kommen.
 */
export function domaenenkarten(karten, klasse) {
  const meine = new Set(klasse?.domaenen || []);
  return nachArt(karten, 'domain').filter((k) => k.stufe === 1 && meine.has(k.domaene));
}

/** Primär- und Sekundärwaffen des ersten Rangs. */
export function startwaffen(gegenstaende, art) {
  return (gegenstaende || []).filter((g) => g.art === art && g.abStufe === 1);
}

export const startruestungen = (gegenstaende) =>
  (gegenstaende || []).filter((g) => g.art === 'ruestung' && g.abStufe === 1);

/** Ob eine Waffe beide Hände braucht. */
export const zweihaendig = (waffe) => /zwei/i.test(String(waffe?.traglast || ''));

/* ------------------------------------------------------------------ *
 * Ist ein Schritt fertig?
 * ------------------------------------------------------------------ */

/** Ein leerer Bogen. Bewusst flach — er wandert durch `localStorage`. */
export function leererZustand() {
  return {
    klasse: null, unterklasse: null,
    abstammung: null, gemeinschaft: null,
    eigenschaften: {},
    name: '', fuerwort: '', beschreibung: '',
    primaerwaffe: null, sekundaerwaffe: null, ruestung: null, klassengegenstand: null,
    hintergrund: '',
    erfahrungen: ['', ''],
    domaenenkarten: [],
    verbindungen: '',
  };
}

/**
 * Was einem Schritt noch fehlt — als Liste von Sätzen, nicht als
 * `true`/`false`.
 *
 * Der Unterschied ist der ganze Punkt eines Assistenten: „Schritt 5
 * unvollständig" hilft niemandem, „Es fehlt noch eine Rüstung" schon.
 */
export function fehltImSchritt(nummer, z, kataloge = {}) {
  const f = [];
  const klasse = klasseVon(z, kataloge);

  if (nummer === 1) {
    if (!z.klasse) f.push('Eine Klasse ist noch nicht gewählt.');
    else if (!klasse) f.push('Die Klasse „' + z.klasse + '" steht in keinem Regelwerk.');
    if (!z.unterklasse) f.push('Eine Unterklasse ist noch nicht gewählt.');
    else if (z.klasse && !unterklassen(kataloge.karten, z.klasse)
      .some((u) => u.name === z.unterklasse)) {
      f.push('„' + z.unterklasse + '" gehört nicht zur Klasse ' + z.klasse + '.');
    }
  }

  if (nummer === 2) {
    if (!z.abstammung) f.push('Eine Abstammung ist noch nicht gewählt.');
    if (!z.gemeinschaft) f.push('Eine Gemeinschaft ist noch nicht gewählt.');
  }

  if (nummer === 3) {
    const vergeben = EIGENSCHAFTEN
      .map(([s]) => z.eigenschaften?.[s])
      .filter((w) => typeof w === 'number');
    if (vergeben.length < 6) {
      f.push('Noch ' + (6 - vergeben.length) + ' von 6 Eigenschaften ohne Wert.');
    } else {
      const soll = [...EIGENSCHAFTSVORRAT].sort((a, b) => a - b).join(',');
      const ist = [...vergeben].sort((a, b) => a - b).join(',');
      if (soll !== ist) {
        f.push('Die Werte müssen genau +2, +1, +1, 0, 0 und −1 sein — vergeben sind '
          + vergeben.map((w) => (w > 0 ? '+' + w : String(w).replace('-', '−')))
            .join(', ') + '.');
      }
    }
  }

  if (nummer === 4 && !String(z.name || '').trim()) f.push('Die Figur hat noch keinen Namen.');

  if (nummer === 5) {
    if (!z.primaerwaffe) f.push('Eine Primärwaffe fehlt.');
    if (!z.ruestung) f.push('Eine Rüstung fehlt.');
    const prim = findeGegenstand(kataloge.gegenstaende, z.primaerwaffe);
    /* Schritt 5: „entweder eine zweihändige Primärwaffe **oder** eine
       einhändige Primär- und eine einhändige Sekundärwaffe". Eine
       zweihändige Waffe plus Nebenhand ist kein Geschmacksfall,
       sondern regelwidrig. */
    if (prim && zweihaendig(prim) && z.sekundaerwaffe) {
      f.push('„' + prim.name + '" braucht beide Hände — eine Sekundärwaffe geht dann nicht.');
    }
    if (!z.klassengegenstand) f.push('Ein Klassengegenstand fehlt.');
  }

  if (nummer === 7) {
    const echte = (z.erfahrungen || []).filter((e) => String(e || '').trim());
    if (echte.length < 2) f.push('Es fehlen noch ' + (2 - echte.length) + ' von 2 Erfahrungen.');
  }

  if (nummer === 8) {
    const anzahl = (z.domaenenkarten || []).length;
    if (anzahl !== 2) f.push('Genau zwei Domänenkarten — gewählt sind ' + anzahl + '.');
  }

  /* Schritt 6 (Hintergrund) und 9 (Verbindungen) haben bewusst **keine**
     Pflicht. Der Regeltext sagt zu 6 ausdrücklich „hat keine
     unmittelbare Regelwirkung" und zu 9 „dürfen erst im Spiel
     entstehen". Wer hier eine Pflicht erfände, würde eine Regel
     verschärfen, die es nicht gibt. */
  return f;
}

/** Alle Schritte auf einmal. */
export function standAllerSchritte(z, kataloge = {}) {
  const stand = [];
  for (let n = 1; n <= 9; n += 1) {
    const fehlt = fehltImSchritt(n, z, kataloge);
    stand.push({ nummer: n, fertig: fehlt.length === 0, fehlt });
  }
  return stand;
}

export const istVollstaendig = (z, kataloge) =>
  standAllerSchritte(z, kataloge).every((s) => s.fertig);

/* ------------------------------------------------------------------ *
 * Nachschlagen
 * ------------------------------------------------------------------ */

export function klasseVon(z, kataloge = {}) {
  return (kataloge.klassen || []).find((k) => k.name === z?.klasse) || null;
}

export function findeGegenstand(gegenstaende, name) {
  if (!name) return null;
  return (gegenstaende || []).find((g) => g.name === name) || null;
}

const findeKarte = (karten, name) =>
  (karten || []).find((k) => k.name === name) || null;

/* ------------------------------------------------------------------ *
 * Die fertige Figur als Bogen
 * ------------------------------------------------------------------ */

/**
 * Baut aus dem Assistentenzustand genau die `spielwerte`, die
 * `karte/bogen-zeigen.js` ohnehin liest.
 *
 * ⚠️ **Hier wird nichts geraten.** Was noch offen ist, landet in
 * `offen[]` und steht auf dem Bogen als sichtbare Lücke — dieselbe
 * Regel wie im Rest des Projekts: Eine Lücke, die man sieht, ist am
 * Spieltisch harmlos; eine, die man für vollständig hält, nicht.
 *
 * ⚠️ **Die Schwellen werden nicht ausgerechnet, sondern als
 * Grundwerte übergeben.** Der Bogen addiert die Stufe selbst
 * (`werkzeuge/werte-rechnen.mjs`). Wer sie hier schon addierte, hätte
 * sie zweimal drin — die Sorte Fehler, die plausibel aussieht.
 */
export function zuSpielwerten(z, kataloge = {}) {
  const klasse = klasseVon(z, kataloge);
  const unter = findeKarte(kataloge.karten, z.unterklasse);
  const ruestung = findeGegenstand(kataloge.gegenstaende, z.ruestung);
  const prim = findeGegenstand(kataloge.gegenstaende, z.primaerwaffe);
  const sek = findeGegenstand(kataloge.gegenstaende, z.sekundaerwaffe);

  const waffen = [];
  if (z.primaerwaffe) {
    waffen.push({ name: z.primaerwaffe, hand: 'primär', regelname: prim ? prim.name : null });
  }
  if (z.sekundaerwaffe) {
    waffen.push({ name: z.sekundaerwaffe, hand: 'sekundär', regelname: sek ? sek.name : null });
  }

  const offen = [];
  for (const { nummer, fehlt } of standAllerSchritte(z, kataloge)) {
    for (const satz of fehlt) offen.push('Schritt ' + nummer + ': ' + satz);
  }
  if (!String(z.hintergrund || '').trim()) offen.push('Hintergrund');
  if (!String(z.verbindungen || '').trim()) offen.push('Verbindungen zu anderen Figuren');

  return {
    system: 'Daggerheart',
    stufe: START.stufe,
    fuerwort: z.fuerwort || null,
    abstammung: z.abstammung || null,
    gemeinschaft: z.gemeinschaft || null,
    klasse: z.klasse || null,
    klasseDe: null,
    unterklasse: z.unterklasse || null,
    unterklasseDe: null,
    domaenen: klasse ? [...klasse.domaenen] : [],
    zauberattribut: unter?.spellcast || null,
    evasion: klasse ? klasse.evasion : null,
    ruestung: ruestung ? {
      name: ruestung.name,
      score: ruestung.score,
      basisSchwer: ruestung.schwellen?.schwer ?? null,
      basisErnst: ruestung.schwellen?.ernst ?? null,
      merkmal: ruestung.merkmal
        ? ruestung.merkmal + (ruestung.wirkung ? ': ' + ruestung.wirkung : '')
        : null,
      regelname: ruestung.name,
    } : null,
    hp: klasse ? klasse.hp : null,
    stress: START.stress,
    hoffnung: { start: START.hoffnungStart, max: START.hoffnungMax },
    attribute: Object.fromEntries(EIGENSCHAFTEN.map(([s]) => [s, z.eigenschaften?.[s] ?? 0])),
    waffen,
    klassengegenstand: z.klassengegenstand || null,
    /* Schritt 7: „Beide beginnen mit einem Modifikator von +2." */
    erfahrungen: (z.erfahrungen || []).filter((e) => String(e || '').trim())
      .map((e) => ({ name: String(e).trim(), bonus: 2 })),
    karten: [...(z.domaenenkarten || [])],
    klassenfertigkeit: klasse?.klassenfertigkeit?.name || null,
    hoffnungsfertigkeit: klasse?.hoffnungsfertigkeit?.name || null,
    vorrat: [...GRUNDVORRAT],
    offen,
  };
}

/** Der ganze Wiki-Eintrag, wie ihn `bogen.html` erwartet. */
export function zuEintrag(z, kataloge = {}) {
  const name = String(z.name || '').trim() || 'Namenlose Figur';
  return {
    id: 'figur-eigen-' + kennung(name),
    name,
    kategorie: 'characters',
    unterart: 'Spielfigur',
    kurz: String(z.beschreibung || '').trim(),
    aliase: [],
    abschnitte: [],
    verbindungen: [],
    bild: '',
    eigen: true,
    spielwerte: zuSpielwerten(z, kataloge),
  };
}

/* Aus dem Namen eine Kennung ohne Umlaute und Sonderzeichen. Sie muss
   über Neuladen hinweg dieselbe bleiben — daran haengt, welcher Bogen
   im Speicher welcher ist. */
export function kennung(name) {
  return String(name || '')
    .toLowerCase()
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'ohne-namen';
}
