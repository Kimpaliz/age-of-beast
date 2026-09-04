/**
 * Prueft die erzeugte Weltkarte.
 *
 * Warum es diese Pruefung gibt: Eine Karte sieht auch dann noch
 * plausibel aus, wenn sie falsch ist. Beim ersten Lauf blieben vom
 * Sumpf 41 von 201.120 Bildpunkten uebrig — er lag in der Geometrie
 * im Wasser und war damit praktisch verschwunden. Auf dem Bild ist das
 * nicht aufgefallen, in der Auszaehlung sofort.
 *
 * Kein Browser, kein Netzwerk. Es wird nichts geschrieben.
 *
 * [Aufgabe: Karte]
 */
import { karteErzeugen, biomeZaehlen, BIOM, BIOM_NAMEN, STANDARD } from '../karte/karte-erzeugen.mjs';
import { PALETTE } from '../karte/palette.mjs';
import { LANDMASSEN, SONDERBIOME, STAEDTE, STADTGROESSEN, VORLAGE, imPolygon } from '../karte/welt-regionen.mjs';

let pruefungen = 0;
const fehler = [];
function pruefe(wert, text) {
  pruefungen += 1;
  if (!wert) fehler.push(text);
}

/* ------------------------------------------------------------------ *
   1. Die Vorlage selbst
   ------------------------------------------------------------------ */

for (const m of LANDMASSEN) {
  pruefe(m.punkte.length >= 4, 'Die Landmasse „' + m.name + '" hat zu wenige Punkte fuer eine Flaeche.');
  for (const [x, y] of m.punkte) {
    pruefe(x >= 0 && x <= VORLAGE.breite && y >= 0 && y <= VORLAGE.hoehe,
      'Die Landmasse „' + m.name + '" hat einen Punkt ausserhalb der Vorlage: ' + x + '/' + y);
  }
}

for (const b of SONDERBIOME) {
  pruefe(b.punkte.length >= 4, 'Das Sonderbiom „' + b.name + '" hat zu wenige Punkte.');
  pruefe(['sumpf', 'wueste', 'sturm'].includes(b.art), 'Unbekannte Biomart: ' + b.art);
}

/* Jede Stadt muss auf Land liegen. Eine Stadt im Meer faellt beim
   Betrachten nicht auf, wenn sie nur wenige Bildpunkte gross ist. */
for (const s of STAEDTE) {
  const aufLand = LANDMASSEN.some((m) => imPolygon(s.x, s.y, m.punkte));
  pruefe(aufLand, 'Die Stadt bei ' + s.x + '/' + s.y + ' (' + s.lage + ') liegt nicht auf Land.');
  pruefe(Object.prototype.hasOwnProperty.call(STADTGROESSEN, s.groesse),
    'Die Stadt bei ' + s.x + '/' + s.y + ' hat die unbekannte Groesse ' + s.groesse + '.');
}

pruefe(STAEDTE.length === 11, 'Janniks Zeichnung traegt elf Kreuze; gefunden: ' + STAEDTE.length + '.');
pruefe(STAEDTE.some((s) => s.groesse === 5), 'Das dickste Kreuz (Metropole) fehlt.');

/* ------------------------------------------------------------------ *
   2. Die erzeugte Karte
   ------------------------------------------------------------------ */

const karte = karteErzeugen();
const anzahl = karte.breite * karte.hoehe;
pruefe(karte.biome.length === anzahl, 'Das Biomfeld hat nicht die Groesse der Karte.');

const zaehler = Object.fromEntries(biomeZaehlen(karte).map((b) => [b.nummer, b]));
const anteil = (nr) => (zaehler[nr] ? zaehler[nr].anteil : 0);

/* Jedes Biom, das es gibt, muss auch vorkommen — sonst ist es entweder
   tot oder seine Bedingung greift nie. Ausgenommen sind die drei
   Siedlungsteile, die nur bei grossen Staedten entstehen. */
const ERWARTET = [
  BIOM.TIEFSEE, BIOM.MEER, BIOM.FLACHWASSER, BIOM.STRAND,
  BIOM.WIESE, BIOM.GRASLAND, BIOM.WALD, BIOM.TIEFERWALD,
  BIOM.HUEGEL, BIOM.BERG, BIOM.GIPFEL,
  BIOM.SUMPF, BIOM.MOORWASSER, BIOM.WUESTE, BIOM.DUENE,
  BIOM.STURM, BIOM.STADT,
];
for (const b of ERWARTET) {
  pruefe(anteil(b) > 0, 'Das Biom „' + BIOM_NAMEN[b] + '" kommt auf der Karte nicht vor.');
}

/* Untergrenzen fuer die Gebiete, die Jannik ausdruecklich gezeichnet
   hat. Sie sind bewusst niedrig — die Pruefung soll das Verschwinden
   fangen, nicht die Gestaltung vorschreiben. */
const SUMPF_MINDESTENS = 0.03;
const sumpfGesamt = anteil(BIOM.SUMPF) + anteil(BIOM.MOORWASSER);
pruefe(sumpfGesamt >= SUMPF_MINDESTENS,
  'Der Sumpf bedeckt nur ' + (sumpfGesamt * 100).toFixed(1) + ' % der Karte (mindestens '
  + (SUMPF_MINDESTENS * 100) + ' %). Beim ersten Lauf lag er in der Geometrie im Wasser.');

const wuesteGesamt = anteil(BIOM.WUESTE) + anteil(BIOM.DUENE);
pruefe(wuesteGesamt >= 0.03, 'Die Wueste bedeckt nur ' + (wuesteGesamt * 100).toFixed(1) + ' % der Karte.');
pruefe(anteil(BIOM.STURM) >= 0.02, 'Das Sturmgebiet bedeckt nur ' + (anteil(BIOM.STURM) * 100).toFixed(1) + ' % der Karte.');

/* Obergrenze fuer Schnee: Ohne sie war die Karte beim ersten Lauf zu
   9,6 % vergletschert, weil `fbm` sich um 0,5 draengt und die
   Hoehenschwelle deshalb fast ueberall ueberschritten wurde. */
pruefe(anteil(BIOM.GIPFEL) <= 0.05,
  'Schneegipfel bedecken ' + (anteil(BIOM.GIPFEL) * 100).toFixed(1) + ' % der Karte (hoechstens 5 %).');

/* Es muss ueberhaupt Land geben, und es darf nicht alles Land sein. */
const landanteil = [...karte.land].reduce((a, b) => a + b, 0) / anzahl;
pruefe(landanteil > 0.25 && landanteil < 0.75,
  'Der Landanteil betraegt ' + (landanteil * 100).toFixed(1) + ' % — die Vorlage zeigt etwa die Haelfte.');

/* ------------------------------------------------------------------ *
   3. Staedte auf der erzeugten Karte
   ------------------------------------------------------------------ */

pruefe(karte.staedte.length === STAEDTE.length, 'Nicht alle Staedte wurden gesetzt.');

for (const s of karte.staedte) {
  pruefe(s.px >= 0 && s.px < karte.breite && s.py >= 0 && s.py < karte.hoehe,
    'Die Stadt „' + s.lage + '" liegt ausserhalb der Karte.');
  const i = s.py * karte.breite + s.px;
  pruefe(karte.land[i] === 1, 'Die Stadt „' + s.lage + '" steht nach der Aufrauhung im Wasser.');
}

/* Die groesste Stadt muss auch die meisten Bildpunkte belegen. */
const siedlungsPunkte = (stadt) => {
  let n = 0;
  const r = Math.ceil(stadt.radius) + 2;
  for (let dy = -r; dy <= r; dy += 1) {
    for (let dx = -r; dx <= r; dx += 1) {
      const x = stadt.px + dx;
      const y = stadt.py + dy;
      if (x < 0 || y < 0 || x >= karte.breite || y >= karte.hoehe) continue;
      const b = karte.biome[y * karte.breite + x];
      if (b === BIOM.STADT || b === BIOM.STADTGASSE || b === BIOM.STADTMAUER) n += 1;
    }
  }
  return n;
};

const metropole = karte.staedte.find((s) => s.groesse === 5);
const kleinstes = karte.staedte.filter((s) => s.groesse === 1);
pruefe(metropole && siedlungsPunkte(metropole) > 0, 'Die Metropole wurde nicht gezeichnet.');
for (const dorf of kleinstes) {
  pruefe(siedlungsPunkte(dorf) > 0, 'Das Dorf „' + dorf.lage + '" wurde nicht gezeichnet.');
  pruefe(siedlungsPunkte(metropole) > siedlungsPunkte(dorf),
    'Die Metropole ist nicht groesser als das Dorf „' + dorf.lage + '" — dann traegt die Strichstaerke der Vorlage nichts.');
}

/* ------------------------------------------------------------------ *
   4. Dieselbe Saat, dieselbe Karte
   ------------------------------------------------------------------ */

const zweite = karteErzeugen();
let abweichungen = 0;
for (let i = 0; i < anzahl; i += 1) if (karte.biome[i] !== zweite.biome[i]) abweichungen += 1;
pruefe(abweichungen === 0,
  'Zwei Laeufe mit derselben Saat unterscheiden sich in ' + abweichungen + ' Punkten. '
  + 'Dann waere kein Vergleich und keine Pruefung mehr aussagekraeftig.');

/* Und eine andere Saat muss eine andere Karte ergeben — sonst wirkt
   die Saat gar nicht. */
const andere = karteErzeugen({ saat: STANDARD.saat + 1 });
let unterschiede = 0;
for (let i = 0; i < anzahl; i += 1) if (karte.biome[i] !== andere.biome[i]) unterschiede += 1;
pruefe(unterschiede > anzahl * 0.05,
  'Eine andere Saat aendert nur ' + unterschiede + ' Punkte. Die Saat wirkt dann kaum.');

/* ------------------------------------------------------------------ *
   5. Zu jedem Biom gehoert eine Farbe
   ------------------------------------------------------------------ */

for (const nr of Object.values(BIOM)) {
  const paar = PALETTE[nr];
  pruefe(Array.isArray(paar) && paar.length === 2,
    'Dem Biom „' + BIOM_NAMEN[nr] + '" fehlt sein Farbpaar — es waere auf der Karte grellrosa.');
  if (Array.isArray(paar)) {
    for (const ton of paar) {
      pruefe(Array.isArray(ton) && ton.length === 3 && ton.every((k) => k >= 0 && k <= 255),
        'Das Biom „' + BIOM_NAMEN[nr] + '" hat einen ungueltigen Farbwert.');
    }
  }
}

/* ------------------------------------------------------------------ *
   Ergebnis
   ------------------------------------------------------------------ */

if (fehler.length) {
  console.error('Kartenpruefung fehlgeschlagen:\n- ' + fehler.join('\n- '));
  process.exitCode = 1;
} else {
  console.log('Age-of-Beast-Wiki – Weltkarte geprueft');
  console.log('Pruefungen: ' + pruefungen);
  console.log('Karte: ' + karte.breite + ' x ' + karte.hoehe + ', Landanteil ' + (landanteil * 100).toFixed(1) + ' %');
  console.log('Sumpf ' + (sumpfGesamt * 100).toFixed(1) + ' %, Wueste ' + (wuesteGesamt * 100).toFixed(1)
    + ' %, Sturm ' + (anteil(BIOM.STURM) * 100).toFixed(1) + ' %, Gipfel ' + (anteil(BIOM.GIPFEL) * 100).toFixed(1) + ' %');
  console.log('Staedte: ' + karte.staedte.length + ', Metropole ' + siedlungsPunkte(metropole) + ' Bildpunkte');
  console.log('Wiederholbarkeit: gleiche Saat 0 Abweichungen, andere Saat ' + unterschiede + ' Unterschiede');
  console.log('Ergebnis: die Vorlage ist vollstaendig umgesetzt und die Erzeugung wiederholbar.');
}
