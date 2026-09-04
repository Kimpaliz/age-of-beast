/* ===================================================================
   Age of Beast — aus der gemalten Vorlage eine Pixelkarte machen
   -------------------------------------------------------------------
   Janniks Zeichnung hat harte Kanten und fuenf Farben. Eine Landkarte
   lebt aber von weichem Uebergang: Straende am Wasser, Wiesen dahinter,
   Waelder im Landesinneren, Huegel und Berge dort, wo es weit zur
   Kueste ist.

   Der Weg dahin geht ueber drei Felder, die alle aus der **Form**
   berechnet werden, nicht aus der Farbe:

   - **Kuestenabstand** — wie weit ist der naechste Wasserpunkt? Daraus
     folgen Strand, Flachwasser und die Grundhoehe.
   - **Hoehe** — Kuestenabstand, aufgerauht durch mehrlagiges Rauschen.
     Bergketten entstehen dort, wo das Land breit ist.
   - **Feuchtigkeit** — nimmt zum Landesinneren ab, steigt in Senken.
     Sie entscheidet zwischen Wiese, Wald und Steppe.

   Das gesamte Modul kennt weder DOM noch Zeichenflaeche. Es liefert
   ein Feld von Biomnummern; wer daraus Farben macht, entscheidet die
   Anzeige. Nur so laesst sich die Karte in Node pruefen.

   Gewuerfelt wird nie mit `Math.random`, sondern aus einer Saat. Dieselbe
   Saat ergibt dieselbe Karte — sonst waere jede Pruefung wertlos und
   jeder Vergleich zweier Laeufe Zufall.

   [Aufgabe: Karte]
   =================================================================== */

import {
  VORLAGE, LANDMASSEN, SONDERBIOME, STAEDTE, STADTGROESSEN,
  imPolygon,
} from './welt-regionen.mjs';

/* ------------------------------------------------------------------ *
 * Die Biome
 * ------------------------------------------------------------------ */

export const BIOM = {
  TIEFSEE: 0,
  MEER: 1,
  FLACHWASSER: 2,
  STRAND: 3,
  WIESE: 4,
  GRASLAND: 5,
  WALD: 6,
  TIEFERWALD: 7,
  HUEGEL: 8,
  BERG: 9,
  GIPFEL: 10,
  SUMPF: 11,
  MOORWASSER: 12,
  WUESTE: 13,
  DUENE: 14,
  STURM: 15,
  STADT: 16,
  STADTGASSE: 17,
  STADTMAUER: 18,
};

export const BIOM_NAMEN = {
  0: 'Tiefsee', 1: 'Meer', 2: 'Flachwasser', 3: 'Strand',
  4: 'Wiese', 5: 'Grasland', 6: 'Wald', 7: 'Tiefer Wald',
  8: 'Huegel', 9: 'Berg', 10: 'Gipfel',
  11: 'Sumpf', 12: 'Moorwasser', 13: 'Wueste', 14: 'Duene',
  15: 'Sturm', 16: 'Stadt', 17: 'Gasse', 18: 'Stadtmauer',
};

/* ------------------------------------------------------------------ *
 * Gesaeter Zufall und Rauschen
 * ------------------------------------------------------------------ */

/** Ganzzahliger Streuwert. Klein, schnell, gut genug fuer Gelaende. */
function streu(x, y, saat) {
  let h = x * 374761393 + y * 668265263 + saat * 1274126177;
  h = (h ^ (h >>> 13)) >>> 0;
  h = Math.imul(h, 1274126177) >>> 0;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

/** Weiche Interpolation — ohne sie wird jedes Rauschen kantig. */
const weich = (t) => t * t * (3 - 2 * t);

/** Wertrauschen: gestreute Zufallszahlen auf einem Gitter, dazwischen
    weich verblendet. */
function rauschen(x, y, saat) {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const fx = weich(x - x0);
  const fy = weich(y - y0);
  const a = streu(x0, y0, saat);
  const b = streu(x0 + 1, y0, saat);
  const c = streu(x0, y0 + 1, saat);
  const d = streu(x0 + 1, y0 + 1, saat);
  return (a * (1 - fx) + b * fx) * (1 - fy) + (c * (1 - fx) + d * fx) * fy;
}

/** Mehrere Lagen Rauschen uebereinander: grobe Form plus feine Kanten.
    Erst dadurch sieht eine Kueste natuerlich aus statt gewellt. */
function fbm(x, y, saat, lagen = 5) {
  let summe = 0;
  let gewicht = 0;
  let f = 1;
  let a = 1;
  for (let i = 0; i < lagen; i += 1) {
    summe += rauschen(x * f, y * f, saat + i * 101) * a;
    gewicht += a;
    f *= 2.03;
    a *= 0.5;
  }
  return summe / gewicht;
}

/* ------------------------------------------------------------------ *
 * Abstandsfeld
 *
 * Zwei Durchlaeufe ueber das Gitter, vorwaerts und rueckwaerts. Das
 * ergibt keinen exakten euklidischen Abstand, aber einen sehr guten
 * und in linearer Zeit — bei 480x420 Punkten ist das der Unterschied
 * zwischen Sekundenbruchteilen und Minuten.
 * ------------------------------------------------------------------ */

function abstandsfeld(breite, hoehe, istQuelle) {
  const gross = breite + hoehe;
  const d = new Float32Array(breite * hoehe);
  for (let i = 0; i < d.length; i += 1) {
    d[i] = istQuelle(i % breite, Math.floor(i / breite)) ? 0 : gross;
  }
  const setze = (i, wert) => { if (wert < d[i]) d[i] = wert; };

  for (let y = 0; y < hoehe; y += 1) {
    for (let x = 0; x < breite; x += 1) {
      const i = y * breite + x;
      if (x > 0) setze(i, d[i - 1] + 1);
      if (y > 0) setze(i, d[i - breite] + 1);
      if (x > 0 && y > 0) setze(i, d[i - breite - 1] + 1.4142);
      if (x < breite - 1 && y > 0) setze(i, d[i - breite + 1] + 1.4142);
    }
  }
  for (let y = hoehe - 1; y >= 0; y -= 1) {
    for (let x = breite - 1; x >= 0; x -= 1) {
      const i = y * breite + x;
      if (x < breite - 1) setze(i, d[i + 1] + 1);
      if (y < hoehe - 1) setze(i, d[i + breite] + 1);
      if (x < breite - 1 && y < hoehe - 1) setze(i, d[i + breite + 1] + 1.4142);
      if (x > 0 && y < hoehe - 1) setze(i, d[i + breite - 1] + 1.4142);
    }
  }
  return d;
}

/* ------------------------------------------------------------------ *
 * Die Erzeugung
 * ------------------------------------------------------------------ */

export const STANDARD = {
  breite: 480,
  hoehe: 419,
  saat: 20260904,
  /* Wie stark die Vorlage aufgerauht wird. 0 heisst: exakt Janniks
     Striche. Zu viel, und die Inseln zerfallen. */
  kuestenrauschen: 7.5,
  kuestenfrequenz: 0.055,
};

/**
 * Erzeugt die Karte.
 * @returns {{breite:number, hoehe:number, biome:Uint8Array,
 *            hoehenfeld:Float32Array, staedte:Array}}
 */
export function karteErzeugen(konfig = {}) {
  const k = { ...STANDARD, ...konfig };
  const { breite, hoehe, saat } = k;
  const anzahl = breite * hoehe;

  /* Von Pixel zu Vorlagenkoordinate. Die Vorlage ist 1247x1088; das
     Seitenverhaeltnis bleibt erhalten, damit nichts verzerrt. */
  const zuVorlageX = (x) => ((x + 0.5) / breite) * VORLAGE.breite;
  const zuVorlageY = (y) => ((y + 0.5) / hoehe) * VORLAGE.hoehe;

  /* --- 1. Land oder Wasser, mit aufgerauhter Kueste ---------------- */

  /* Die Aufrauhung verschiebt den Pruefpunkt, statt die Grenze zu
     verschieben. Das ist derselbe Effekt, aber ohne Polygonrechnerei —
     und es zerreisst keine Insel, weil die Verschiebung stetig ist. */
  const land = new Uint8Array(anzahl);
  for (let y = 0; y < hoehe; y += 1) {
    for (let x = 0; x < breite; x += 1) {
      const vx = zuVorlageX(x);
      const vy = zuVorlageY(y);
      const versatzX = (fbm(x * k.kuestenfrequenz, y * k.kuestenfrequenz, saat) - 0.5) * 2 * k.kuestenrauschen;
      const versatzY = (fbm(x * k.kuestenfrequenz, y * k.kuestenfrequenz, saat + 7777) - 0.5) * 2 * k.kuestenrauschen;
      const px = vx + versatzX * (VORLAGE.breite / breite);
      const py = vy + versatzY * (VORLAGE.hoehe / hoehe);
      land[y * breite + x] = LANDMASSEN.some((m) => imPolygon(px, py, m.punkte)) ? 1 : 0;
    }
  }

  /* --- 2. Sonderbiome, gleich aufgerauht --------------------------- */

  const sonder = new Uint8Array(anzahl); // 0 = keins, sonst Index+1
  for (let y = 0; y < hoehe; y += 1) {
    for (let x = 0; x < breite; x += 1) {
      const i = y * breite + x;
      const vx = zuVorlageX(x);
      const vy = zuVorlageY(y);
      const versatzX = (fbm(x * 0.07, y * 0.07, saat + 313) - 0.5) * 2 * 6;
      const versatzY = (fbm(x * 0.07, y * 0.07, saat + 929) - 0.5) * 2 * 6;
      const px = vx + versatzX * (VORLAGE.breite / breite);
      const py = vy + versatzY * (VORLAGE.hoehe / hoehe);
      for (let b = 0; b < SONDERBIOME.length; b += 1) {
        if (imPolygon(px, py, SONDERBIOME[b].punkte)) sonder[i] = b + 1;
      }
    }
  }

  /* --- 3. Abstandsfelder ------------------------------------------- */

  const zumWasser = abstandsfeld(breite, hoehe, (x, y) => land[y * breite + x] === 0);
  const zumLand = abstandsfeld(breite, hoehe, (x, y) => land[y * breite + x] === 1);

  /* --- 4. Hoehe ---------------------------------------------------- */

  /* Grundhoehe aus dem Kuestenabstand: je weiter im Landesinneren,
     desto hoeher. Darueber zwei Lagen Rauschen — eine grobe fuer
     Gebirgszuege, eine feine fuer Zerklueftung. */
  const hoehenfeld = new Float32Array(anzahl);
  for (let y = 0; y < hoehe; y += 1) {
    for (let x = 0; x < breite; x += 1) {
      const i = y * breite + x;
      if (!land[i]) { hoehenfeld[i] = -Math.min(1, zumLand[i] / 45); continue; }
      const grund = Math.min(1, zumWasser[i] / 70);
      const gebirge = fbm(x * 0.018, y * 0.018, saat + 4242, 4);
      const zerkluftung = fbm(x * 0.09, y * 0.09, saat + 8484, 3);
      /* Der Kuestenabstand allein ergaebe eine Kuppel. Erst die
         Multiplikation mit dem groben Rauschen macht daraus Ketten:
         Wo das Rauschen niedrig ist, bleibt auch weit drinnen Flachland.

         Das grobe Rauschen wird vorher gespreizt. `fbm` liefert keine
         ueber 0..1 verteilten Werte, sondern draengt sich um 0,5 —
         ungespreizt hat fast jeder Landpunkt im Inneren Gebirge, und
         beim ersten Lauf waren 9,6 % der Karte Schneegipfel. */
      const gespreizt = Math.max(0, Math.min(1, (gebirge - 0.42) * 2.6));
      hoehenfeld[i] = grund * (0.28 + gespreizt * 0.92) + zerkluftung * 0.08;
    }
  }

  /* --- 5. Feuchtigkeit --------------------------------------------- */

  const feuchte = new Float32Array(anzahl);
  for (let y = 0; y < hoehe; y += 1) {
    for (let x = 0; x < breite; x += 1) {
      const i = y * breite + x;
      const vomMeer = Math.max(0, 1 - zumWasser[i] / 90);
      /* Auch hier gespreizt, aus demselben Grund wie bei der Hoehe:
         ungespreizt liegt fast alles ueber der Waldschwelle, und die
         Karte wird ein einziger Forst. */
      const wolkenRoh = fbm(x * 0.025, y * 0.025, saat + 1616, 4);
      const wolken = Math.max(0, Math.min(1, (wolkenRoh - 0.38) * 2.4));
      /* Hohe Lagen sind trockener — Regen faellt an den Haengen. */
      const hoehenabzug = Math.max(0, hoehenfeld[i] - 0.55) * 0.8;
      feuchte[i] = Math.max(0, Math.min(1, vomMeer * 0.34 + wolken * 0.62 - hoehenabzug));
    }
  }

  /* --- 6. Biome zuweisen ------------------------------------------- */

  const biome = new Uint8Array(anzahl);
  for (let y = 0; y < hoehe; y += 1) {
    for (let x = 0; x < breite; x += 1) {
      const i = y * breite + x;
      const s = sonder[i] ? SONDERBIOME[sonder[i] - 1] : null;

      if (!land[i]) {
        /* Das Sturmgebiet liegt teils ueber Wasser — dort gewinnt es. */
        if (s && s.art === 'sturm') { biome[i] = BIOM.STURM; continue; }
        const tiefe = zumLand[i];
        biome[i] = tiefe < 2.5 ? BIOM.FLACHWASSER : tiefe < 14 ? BIOM.MEER : BIOM.TIEFSEE;
        continue;
      }

      if (s && s.art === 'sturm') { biome[i] = BIOM.STURM; continue; }

      if (s && s.art === 'sumpf') {
        /* Im Sumpf entscheidet feines Rauschen zwischen Schlick und
           offenen Tuempeln. Das ist der Charakter eines Moors: kein
           Ufer, sondern ein Flickenteppich. */
        /* Groeberes Muster und mehr Wasser als beim ersten Versuch:
           Ein Sumpf ist an seiner Fleckigkeit zu erkennen, nicht an
           seinem Farbton. Bei feinem Rauschen verschwimmt er aus der
           Entfernung wieder zu einer Flaeche. */
        const tuempel = fbm(x * 0.075, y * 0.075, saat + 5150, 3);
        biome[i] = tuempel > 0.48 ? BIOM.MOORWASSER : BIOM.SUMPF;
        continue;
      }

      if (s && s.art === 'wueste') {
        const duenen = fbm(x * 0.06, y * 0.06, saat + 6060, 3);
        biome[i] = duenen > 0.55 ? BIOM.DUENE : BIOM.WUESTE;
        continue;
      }

      const h = hoehenfeld[i];
      const f = feuchte[i];

      if (zumWasser[i] < 1.8 + fbm(x * 0.2, y * 0.2, saat + 99, 2) * 2.2) {
        biome[i] = BIOM.STRAND;
      } else if (h > 0.86) {
        biome[i] = BIOM.GIPFEL;
      } else if (h > 0.68) {
        biome[i] = BIOM.BERG;
      } else if (h > 0.52) {
        biome[i] = BIOM.HUEGEL;
      } else if (f > 0.62) {
        biome[i] = BIOM.TIEFERWALD;
      } else if (f > 0.44) {
        biome[i] = BIOM.WALD;
      } else if (f > 0.28) {
        biome[i] = BIOM.WIESE;
      } else {
        biome[i] = BIOM.GRASLAND;
      }
    }
  }

  /* --- 7. Staedte -------------------------------------------------- */

  /* Eine Stadt wird nicht als Kreuz gestempelt, sondern als Flaeche
     gesetzt: Der Betrachter soll eine Siedlung sehen, keine Markierung.
     Um sie herum wird das Gelaende zu Wiese — Staedte stehen nicht im
     Dickicht. */
  const staedte = STAEDTE.map((s) => ({
    ...s,
    px: Math.round((s.x / VORLAGE.breite) * breite),
    py: Math.round((s.y / VORLAGE.hoehe) * hoehe),
    radius: STADTGROESSEN[s.groesse].radius,
    art: STADTGROESSEN[s.groesse].name,
  }));

  /* Zwei Durchgaenge: erst das Umland roden, dann die Siedlung setzen.
     Andersherum wuerde das Roden die gerade gesetzten Haeuser wieder
     ueberschreiben, sobald zwei Staedte nah beieinander liegen. */
  for (const stadt of staedte) {
    const umland = stadt.radius * 2.4;
    for (let dy = -Math.ceil(umland); dy <= Math.ceil(umland); dy += 1) {
      for (let dx = -Math.ceil(umland); dx <= Math.ceil(umland); dx += 1) {
        const x = stadt.px + dx;
        const y = stadt.py + dy;
        if (x < 0 || y < 0 || x >= breite || y >= hoehe) continue;
        const i = y * breite + x;
        if (!land[i]) continue;
        const franse = fbm(x * 0.35, y * 0.35, saat + 2020, 2) * 1.6;
        if (Math.hypot(dx, dy) < umland + franse) {
          /* Um eine Siedlung herum ist gerodet — Felder statt Dickicht. */
          const b = biome[i];
          if (b === BIOM.WALD || b === BIOM.TIEFERWALD) biome[i] = BIOM.WIESE;
        }
      }
    }
  }

  /* Eine Siedlung ist kein Fleck, sondern ein Gefuege: Daecher,
     dazwischen Gassen, aussen herum eine Mauer, sobald es sich lohnt.
     Ein einfarbiger Kreis saehe aus wie eine Markierung; hier soll man
     eine Stadt erkennen. */
  for (const stadt of staedte) {
    const r = stadt.radius;
    const mitMauer = r >= 5;
    for (let dy = -Math.ceil(r) - 2; dy <= Math.ceil(r) + 2; dy += 1) {
      for (let dx = -Math.ceil(r) - 2; dx <= Math.ceil(r) + 2; dx += 1) {
        const x = stadt.px + dx;
        const y = stadt.py + dy;
        if (x < 0 || y < 0 || x >= breite || y >= hoehe) continue;
        const i = y * breite + x;
        if (!land[i]) continue;

        const abstand = Math.hypot(dx, dy);
        const franse = fbm(x * 0.45, y * 0.45, saat + 2020, 2) * 1.4;
        if (abstand >= r + franse) continue;

        if (mitMauer && abstand > r + franse - 1.2) {
          biome[i] = BIOM.STADTMAUER;
          continue;
        }

        /* Gassen: ein grobes Schachbrett, verzogen durch Rauschen. Bei
           drei bis fuenf Bildpunkten Stadtbreite ist das genug Andeutung —
           mehr Struktur waere bei dieser Groesse nur Rauschen. */
        const gasse = ((x + Math.round(fbm(x * 0.5, y * 0.5, saat + 3131, 2) * 2)) % 3 === 0)
          || ((y + Math.round(fbm(x * 0.5, y * 0.5, saat + 4141, 2) * 2)) % 3 === 0);
        biome[i] = gasse && r > 3.5 ? BIOM.STADTGASSE : BIOM.STADT;
      }
    }
  }

  return { breite, hoehe, biome, hoehenfeld, staedte, land, feuchte };
}

/* ------------------------------------------------------------------ *
 * Auszaehlung — fuer Pruefungen und den Bericht
 * ------------------------------------------------------------------ */

export function biomeZaehlen(karte) {
  const zaehler = {};
  for (const b of karte.biome) zaehler[b] = (zaehler[b] || 0) + 1;
  const gesamt = karte.biome.length;
  return Object.entries(zaehler)
    .map(([nr, anzahl]) => ({
      nummer: Number(nr),
      name: BIOM_NAMEN[nr],
      anzahl,
      anteil: anzahl / gesamt,
    }))
    .sort((a, b) => b.anzahl - a.anzahl);
}
