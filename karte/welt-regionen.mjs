/* ===================================================================
   Age of Beast — Janniks gemalte Weltkarte als Daten
   [Aufgabe: Karte]

   -------------------------------------------------------------------
   Das ist die Vorlage, nicht das Ergebnis: Jannik hat die Welt von Hand
   gemalt — blaues Meer, gruenes Land, ein hellgruener Sumpf, eine gelbe
   Wueste und ein violettes Gebiet im ewigen Sturm. Schwarze Kreuze sind
   Staedte; je dicker das Kreuz, desto groesser die Stadt.

   Hier stehen die Umrisse als Punktzuege. Aus ihnen macht
   `karte-erzeugen.mjs` eine organische Pixelkarte: Die harten Kanten
   der Zeichnung werden aufgerauht, Kuesten bekommen Straende, und im
   Landesinneren entstehen Wiesen, Waelder, Huegel und Berge.

   Warum die Vorlage nicht einfach als Bild eingelesen wird: Ein Bild
   sagt nur, welche Farbe ein Punkt hat. Fuer Straende, Waldgrenzen und
   Bergketten braucht der Erzeuger aber den **Abstand zur Kueste**, die
   **Hoehe** und die **Feuchtigkeit** — und die lassen sich nur aus der
   Form berechnen, nicht aus der Farbe ablesen.

   Alle Koordinaten beziehen sich auf Janniks Zeichnung in ihrer
   urspruenglichen Groesse. Der Erzeuger rechnet sie selbst um.

   =================================================================== */

/** Groesse der Vorlage, auf die sich alle Punkte beziehen. */
export const VORLAGE = { breite: 1247, hoehe: 1088 };

/* ------------------------------------------------------------------ *
 * Landmassen
 *
 * Die Reihenfolge ist bedeutungslos: Jeder Punkt gehoert zu Land,
 * sobald er in mindestens einem dieser Zuege liegt.
 * ------------------------------------------------------------------ */

export const LANDMASSEN = [
  {
    name: 'Festland',
    /* Der grosse Kontinent im Osten. Er reicht von der oberen Kante bis
       nach unten durch und traegt Wueste und Sturmgebiet an seinem
       Suedostrand. */
    punkte: [
      [700, 0], [940, 0], [940, 30], [900, 120], [880, 200], [870, 260],
      [860, 300], [820, 330], [760, 340], [700, 345], [660, 350],
      [640, 355], [620, 380], [600, 400], [580, 420], [560, 450],
      [545, 480], [535, 520], [530, 560], [545, 600], [560, 640],
      [575, 700], [580, 780], [575, 860], [590, 930], [620, 1000],
      [660, 1060], [680, 1088], [1247, 1088], [1247, 0],
    ],
  },
  {
    name: 'Nordinsel',
    /* Die langgestreckte Insel im Nordwesten, in der Mitte fast
       durchgeschnitten. */
    punkte: [
      [232, 62], [280, 72], [310, 105], [325, 150], [330, 200],
      [335, 250], [355, 285], [395, 300], [418, 330], [415, 375],
      [390, 420], [370, 455], [355, 490], [340, 520], [310, 535],
      [285, 520], [270, 490], [268, 455], [280, 430], [285, 400],
      [270, 380], [240, 370], [200, 355], [170, 330], [152, 300],
      [148, 265], [155, 230], [168, 190], [175, 155], [180, 120],
      [195, 85], [232, 62],
    ],
  },
  {
    name: 'Nordkap',
    /* Die Insel oben in der Mitte, oben an die Kante gewachsen. */
    punkte: [
      [372, 0], [700, 0], [690, 40], [670, 90], [650, 130], [620, 165],
      [580, 195], [540, 215], [500, 228], [460, 230], [425, 215],
      [400, 190], [385, 150], [378, 100], [372, 40], [372, 0],
    ],
  },
  {
    name: 'Westinsel',
    /* Die kleine Insel im Westen. */
    punkte: [
      [160, 508], [200, 505], [230, 520], [248, 550], [250, 585],
      [240, 620], [215, 650], [185, 668], [155, 665], [130, 645],
      [112, 615], [105, 580], [110, 545], [130, 520], [160, 508],
    ],
  },
  {
    name: 'Südzunge',
    /* Der Landstreifen an der unteren Kante im Westen. */
    punkte: [
      [0, 1020], [60, 1030], [120, 1042], [190, 1050], [250, 1040],
      [290, 1010], [310, 980], [330, 960], [340, 1000], [345, 1050],
      [350, 1088], [0, 1088], [0, 1020],
    ],
  },
  {
    name: 'Sumpfland',
    /* Der Sumpf ist in Janniks Zeichnung eine eigene Halbinsel, die
       westlich aus dem Festland herauswaechst. Ohne diesen Eintrag
       laege er im Wasser und verschwaende — beim ersten Lauf blieben
       von ihm 41 von 201.120 Bildpunkten uebrig. Die Umrisse sind
       dieselben wie beim Sonderbiom, nur etwas grosszuegiger, damit
       die Aufrauhung nicht ueber die Kueste hinausfrisst. */
    punkte: [
      [560, 555], [585, 585], [598, 640], [596, 705], [585, 765],
      [570, 825], [552, 878], [530, 920], [498, 952], [455, 968],
      [405, 972], [352, 963], [300, 947], [258, 922], [228, 892],
      [216, 852], [224, 806], [244, 768], [265, 732], [281, 692],
      [297, 652], [322, 615], [358, 588], [398, 570], [450, 557],
      [505, 550], [560, 555],
    ],
  },
];

/* ------------------------------------------------------------------ *
 * Sonderbiome
 *
 * Sie liegen **auf** dem Land und ueberschreiben es. Ihre Reihenfolge
 * entscheidet: Was spaeter kommt, liegt oben.
 * ------------------------------------------------------------------ */

export const SONDERBIOME = [
  {
    name: 'Sumpf',
    art: 'sumpf',
    /* Janniks Beschriftung: SUMPF. Und seine Warnung dazu:
       „Der Sumpf ist gefaehrlich!" */
    gefaehrlich: true,
    punkte: [
      [530, 565], [560, 590], [572, 640], [570, 700], [560, 760],
      [545, 820], [530, 870], [510, 910], [480, 940], [440, 955],
      [395, 958], [350, 950], [300, 935], [262, 912], [235, 885],
      [225, 850], [232, 810], [250, 775], [270, 740], [285, 700],
      [300, 660], [325, 625], [360, 598], [400, 580], [450, 568],
      [500, 562], [530, 565],
    ],
  },
  {
    name: 'Wueste',
    art: 'wueste',
    punkte: [
      [1247, 640], [1200, 660], [1150, 700], [1100, 730], [1050, 745],
      [1000, 760], [950, 780], [900, 800], [860, 830], [830, 870],
      [800, 910], [770, 950], [740, 1000], [710, 1050], [690, 1088],
      [1247, 1088], [1247, 640],
    ],
  },
  {
    name: 'Sturmgebiet',
    art: 'sturm',
    /* Janniks Beschriftung: „Unbekanntes Gebiet inmitten eines ewigen
       Sturmes!" */
    unbekannt: true,
    punkte: [
      [1247, 830], [1180, 838], [1110, 850], [1050, 872], [1000, 900],
      [960, 935], [930, 975], [910, 1020], [898, 1060], [893, 1088],
      [1247, 1088], [1247, 830],
    ],
  },
];

/* ------------------------------------------------------------------ *
 * Staedte
 *
 * Die Groesse stammt aus der Strichstaerke der Kreuze in der Zeichnung:
 * je dicker das Kreuz, desto groesser die Stadt. Namen fehlen noch —
 * die vergibt Jannik.
 * ------------------------------------------------------------------ */

export const STAEDTE = [
  { x: 228, y: 110, groesse: 2, name: '', lage: 'Nordinsel, Nordspitze' },
  { x: 500, y: 200, groesse: 2, name: '', lage: 'Nordkap, Südküste' },
  { x: 1032, y: 190, groesse: 1, name: '', lage: 'Festland, Norden' },
  { x: 320, y: 430, groesse: 3, name: '', lage: 'Nordinsel, Süden' },
  { x: 638, y: 375, groesse: 3, name: '', lage: 'Festland, Westküste' },
  { x: 1117, y: 545, groesse: 1, name: '', lage: 'Festland, Osten' },
  { x: 155, y: 645, groesse: 1, name: '', lage: 'Westinsel' },
  { x: 768, y: 628, groesse: 1, name: '', lage: 'Festland, Mitte' },
  { x: 455, y: 882, groesse: 1, name: '', lage: 'im Sumpf' },
  { x: 768, y: 900, groesse: 5, name: '', lage: 'Festland, Wüstenrand' },
  { x: 88, y: 1078, groesse: 1, name: '', lage: 'Südzunge' },
];

/* Wie gross ein Kreuz gezeichnet wird. Stufe 5 ist Janniks dickstes
   Kreuz — offenkundig die groesste Stadt der bekannten Welt. */
export const STADTGROESSEN = {
  1: { name: 'Dorf', radius: 3.0 },
  2: { name: 'Kleinstadt', radius: 4.0 },
  3: { name: 'Stadt', radius: 5.0 },
  4: { name: 'Grossstadt', radius: 6.5 },
  5: { name: 'Metropole', radius: 8.5 },
};

/* ------------------------------------------------------------------ *
 * Punkt-in-Polygon
 *
 * Strahlverfahren: Ein Strahl nach rechts schneidet den Rand eine
 * ungerade Anzahl Mal, wenn der Punkt innen liegt. Ohne Bibliothek,
 * damit diese Datei in Node und im Browser gleich laeuft.
 * ------------------------------------------------------------------ */

export function imPolygon(x, y, punkte) {
  let drin = false;
  for (let i = 0, j = punkte.length - 1; i < punkte.length; j = i, i += 1) {
    const [xi, yi] = punkte[i];
    const [xj, yj] = punkte[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
      drin = !drin;
    }
  }
  return drin;
}

/** Liegt dieser Punkt der Vorlage auf Land? */
export function istLand(x, y) {
  return LANDMASSEN.some((m) => imPolygon(x, y, m.punkte));
}

/** Welches Sonderbiom liegt hier — oder null? Spaetere gewinnen. */
export function sonderbiomAn(x, y) {
  let treffer = null;
  for (const b of SONDERBIOME) {
    if (imPolygon(x, y, b.punkte)) treffer = b;
  }
  return treffer;
}
