/* ===================================================================
   Age of Beast — die Farben der Karte
   -------------------------------------------------------------------
   Eine Pixelkarte lebt von wenigen, klar getrennten Farben. Jedes Biom
   bekommt deshalb genau zwei Toene: einen Grundton und eine leichte
   Aufhellung. Zwischen ihnen entscheidet ein feines Rauschen — das ist
   der ganze Trick hinter der koernigen Anmutung. Ein Farbverlauf waere
   glatter und saehe nach Computergrafik aus; zwei Toene sehen nach
   gemalter Karte aus.

   Die Palette folgt dem Wiki: olivfarbener Grund, gedaempfte Toene,
   nichts Neonfarbenes. Sie ist bewusst **waermer** als Janniks Vorlage
   — deren reines Blau und Gruen sind Markierungsfarben, keine
   Landschaft.

   [Aufgabe: Karte]
   =================================================================== */

import { BIOM } from './karte-erzeugen.mjs';

/** Je Biom: [Grundton, Aufhellung] als [r,g,b]. */
export const PALETTE = {
  [BIOM.TIEFSEE]:     [[26, 42, 78], [32, 51, 92]],
  [BIOM.MEER]:        [[38, 62, 108], [46, 74, 124]],
  [BIOM.FLACHWASSER]: [[62, 104, 152], [76, 124, 172]],
  [BIOM.STRAND]:      [[212, 194, 148], [226, 210, 168]],
  [BIOM.WIESE]:       [[122, 152, 82], [138, 168, 94]],
  [BIOM.GRASLAND]:    [[152, 164, 96], [168, 180, 110]],
  [BIOM.WALD]:        [[74, 112, 62], [86, 126, 72]],
  [BIOM.TIEFERWALD]:  [[48, 84, 52], [58, 96, 60]],
  [BIOM.HUEGEL]:      [[128, 128, 92], [142, 142, 104]],
  [BIOM.BERG]:        [[122, 112, 104], [138, 128, 120]],
  [BIOM.GIPFEL]:      [[214, 214, 220], [232, 232, 238]],
  /* Der Sumpf war anfangs vom Wald nicht zu unterscheiden — in OKLab
     gemessene 0,024 Abstand, also praktisch dieselbe Farbe. Jetzt
     deutlich gelbstichig. Die eigentliche Unterscheidung leistet aber
     das Muster: Moor ist ein Flickenteppich aus Schlick und offenem
     Wasser, kein flaechiger Ton. */
  [BIOM.SUMPF]:       [[118, 112, 54], [132, 126, 66]],
  [BIOM.MOORWASSER]:  [[52, 58, 44], [60, 68, 52]],
  [BIOM.WUESTE]:      [[212, 178, 106], [226, 194, 124]],
  [BIOM.DUENE]:       [[226, 196, 130], [238, 212, 150]],
  [BIOM.STURM]:       [[86, 62, 108], [102, 76, 126]],
  /* Daecher, Gassen und Mauer. Drei Toene, damit eine Siedlung bei
     wenigen Bildpunkten trotzdem als Gefuege lesbar bleibt. */
  [BIOM.STADT]:       [[158, 92, 68], [178, 108, 80]],
  [BIOM.STADTGASSE]:  [[104, 84, 68], [118, 96, 78]],
  [BIOM.STADTMAUER]:  [[126, 118, 108], [142, 134, 124]],
};

/* Kuestenlinie und Stadtrand bekommen einen eigenen dunklen Ton. Ohne
   ihn verschwimmen Land und Wasser bei kleiner Darstellung. */
export const KUESTENLINIE = [22, 34, 58];
export const STADTRAND = [58, 38, 30];

/** Die Karte als RGBA-Bytefeld. Kein DOM — dieselbe Ausgabe fuer das
    PNG-Werkzeug und fuer die Zeichenflaeche im Browser. */
export function alsBildpunkte(karte, rauschfunktion) {
  const { breite, hoehe, biome } = karte;
  const daten = new Uint8ClampedArray(breite * hoehe * 4);

  for (let y = 0; y < hoehe; y += 1) {
    for (let x = 0; x < breite; x += 1) {
      const i = y * breite + x;
      const b = biome[i];
      const paar = PALETTE[b] || [[255, 0, 255], [255, 0, 255]];

      /* Der Koernungswert entscheidet zwischen Grund- und Hellton. Er
         kommt aus dem Ort, nicht aus einem Zufallsgenerator: Sonst
         flimmerte die Karte bei jedem Neuzeichnen. */
      const koernung = rauschfunktion(x, y);
      const ton = koernung > 0.52 ? paar[1] : paar[0];

      let [r, g, bl] = ton;

      /* Kuestenlinie: Wasserpunkt mit Landnachbar. */
      if (b === BIOM.FLACHWASSER || b === BIOM.MEER) {
        const nachbarLand = (
          (x > 0 && biome[i - 1] >= BIOM.STRAND && biome[i - 1] !== BIOM.STURM)
          || (x < breite - 1 && biome[i + 1] >= BIOM.STRAND && biome[i + 1] !== BIOM.STURM)
          || (y > 0 && biome[i - breite] >= BIOM.STRAND && biome[i - breite] !== BIOM.STURM)
          || (y < hoehe - 1 && biome[i + breite] >= BIOM.STRAND && biome[i + breite] !== BIOM.STURM)
        );
        if (nachbarLand) [r, g, bl] = KUESTENLINIE;
      }

      /* Stadtrand. */
      const istSiedlung = (n) => n === BIOM.STADT || n === BIOM.STADTGASSE || n === BIOM.STADTMAUER;
      if (!istSiedlung(b)) {
        const nachbarStadt = (
          (x > 0 && istSiedlung(biome[i - 1]))
          || (x < breite - 1 && istSiedlung(biome[i + 1]))
          || (y > 0 && istSiedlung(biome[i - breite]))
          || (y < hoehe - 1 && istSiedlung(biome[i + breite]))
        );
        if (nachbarStadt) [r, g, bl] = STADTRAND;
      }

      const p = i * 4;
      daten[p] = r;
      daten[p + 1] = g;
      daten[p + 2] = bl;
      daten[p + 3] = 255;
    }
  }

  return daten;
}
