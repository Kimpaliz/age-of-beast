/* ===================================================================
   Age of Beast — die Weltkarte auf einer Zeichenflaeche
   [Aufgabe: Karte]

   -------------------------------------------------------------------
   Der einzige Teil der Karte, der den Browser kennt. Alles Rechnen
   steckt in `karte-erzeugen.mjs` und `palette.mjs` und laeuft dort
   ohne DOM — nur das Malen und die Bedienung stehen hier.

   Die Karte wird im Browser **gerechnet**, nicht als Bild geladen. Das
   kostet rund eine Fuenftelsekunde und bringt zwei Dinge: Man kann die
   Saat wechseln und eine andere Welt sehen, und die Staedte bleiben als
   Koordinaten bekannt, statt in einem Bild zu verschwinden.

   =================================================================== */

import { karteErzeugen, BIOM, BIOM_NAMEN, STANDARD } from './karte-erzeugen.mjs';
import { alsBildpunkte, PALETTE } from './palette.mjs';
import { VORLAGE, SONDERBIOME } from './welt-regionen.mjs';
import {
  bildpunktZuKartenpunkt,
  eintraegeMitKartenpunkt,
  kartenpunktZuBildpunkt,
  liegtImKartenraster,
} from './welt-orte.mjs';

const flaeche = document.getElementById('kartenflaeche');
const legende = document.getElementById('kartenlegende');
const staedteliste = document.getElementById('staedteliste');
const stand = document.getElementById('kartenstand');
const marken = document.getElementById('kartenmarken');
const koordinatenanzeige = document.getElementById('kartenkoordinate');
const welt = window.AGE_OF_BEAST_WELT;
const verknuepfteEintraege = eintraegeMitKartenpunkt(welt?.eintraege)
  .filter((eintrag) => liegtImKartenraster(eintrag.kartenpunkt));

/* Dieselbe Koernung wie im PNG-Werkzeug: aus dem Ort gerechnet, nicht
   gewuerfelt. Sonst flimmerte die Karte bei jedem Neuzeichnen. */
function koernung(saat) {
  return (x, y) => {
    let h = x * 374761393 + y * 668265263 + saat * 977;
    h = (h ^ (h >>> 13)) >>> 0;
    h = Math.imul(h, 1274126177) >>> 0;
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  };
}

/* Beschriftungen der grossen Gebiete. Sie stehen nicht in den Daten der
   Vorlage, weil sie Anzeige sind und keine Geografie. */
const GEBIETE = [
  { text: 'Der Sumpf', x: 400, y: 780, warnung: 'gefährlich' },
  { text: 'Die Wüste', x: 1010, y: 850, warnung: '' },
  { text: 'Ewiger Sturm', x: 1090, y: 990, warnung: 'unbekannt' },
];

let karte = null;
let zoom = 2;
let saat = STANDARD.saat;

function zeichnen() {
  const anfang = performance.now();
  karte = karteErzeugen({ saat });
  const punkte = alsBildpunkte(karte, koernung(saat));

  flaeche.width = karte.breite;
  flaeche.height = karte.hoehe;
  const stift = flaeche.getContext('2d');
  stift.putImageData(new ImageData(punkte, karte.breite, karte.hoehe), 0, 0);

  /* Die Anzeigegroesse wird ueber CSS gesetzt, damit der Browser mit
     `image-rendering: pixelated` vergroessert. Wuerde man auf einer
     grossen Flaeche zeichnen, waeren die Bildpunkte weichgezeichnet —
     und genau das zerstoert den Pixellook. */
  flaeche.style.width = (karte.breite * zoom) + 'px';
  flaeche.style.height = (karte.hoehe * zoom) + 'px';

  beschriften();
  markenZeichnen();
  legendeZeichnen();
  staedteZeichnen();

  const dauer = Math.round(performance.now() - anfang);
  if (stand) stand.textContent = karte.breite + ' × ' + karte.hoehe + ' Bildpunkte · Saat ' + saat + ' · in ' + dauer + ' ms gerechnet';
}

/* Die Markierungen sind DOM-Elemente statt Bildpunkte. So bleiben die
   Trefferflächen bei jedem Zoom groß genug und ein Klick kann ins Wiki führen. */
function markenZeichnen() {
  if (!marken || !karte) return;
  const sammlung = document.createDocumentFragment();

  for (const eintrag of verknuepfteEintraege) {
    const nadel = document.createElement('a');
    nadel.className = 'karten-nadel';
    nadel.href = './#' + eintrag.id;
    nadel.title = eintrag.name + ' im Wiki öffnen';
    nadel.setAttribute('aria-label', 'Eintrag „' + eintrag.name + '“ im Wiki öffnen');
    markePlatzieren(nadel, eintrag.kartenpunkt);

    const sinnzeichen = document.createElement('span');
    sinnzeichen.className = 'nadel-sinnbild';
    sinnzeichen.setAttribute('aria-hidden', 'true');
    const name = document.createElement('span');
    name.className = 'nadelname';
    name.textContent = eintrag.name;
    nadel.append(sinnzeichen, name);
    sammlung.append(nadel);
  }

  for (const stadt of karte.staedte) {
    const stadtmarke = document.createElement('div');
    stadtmarke.className = 'karten-stadtmarke';
    stadtmarke.setAttribute('role', 'img');
    stadtmarke.setAttribute(
      'aria-label',
      'Noch nicht verknüpfte ' + stadt.art + ' bei x ' + stadt.x
        + ', y ' + stadt.y + ', Größe ' + stadt.groesse,
    );
    stadtmarke.style.setProperty('--kreuzdicke', (1 + stadt.groesse * 0.75).toFixed(2) + 'px');
    stadtmarke.style.setProperty('--kreuzlaenge', (8 + stadt.groesse * 2).toFixed(0) + 'px');
    markePlatzieren(stadtmarke, stadt);

    const kreuz = document.createElement('span');
    kreuz.className = 'stadt-kreuz';
    kreuz.setAttribute('aria-hidden', 'true');
    const beschriftung = document.createElement('span');
    beschriftung.className = 'stadt-koordinate';
    beschriftung.textContent = 'x: ' + stadt.x + ', y: ' + stadt.y
      + ' · Größe ' + stadt.groesse;
    stadtmarke.append(kreuz, beschriftung);
    sammlung.append(stadtmarke);
  }

  marken.replaceChildren(sammlung);
}

function markePlatzieren(element, kartenpunkt) {
  const bildpunkt = kartenpunktZuBildpunkt(kartenpunkt, {
    breite: karte.breite,
    hoehe: karte.hoehe,
  });
  element.style.left = ((bildpunkt.x / karte.breite) * 100).toFixed(4) + '%';
  element.style.top = ((bildpunkt.y / karte.hoehe) * 100).toFixed(4) + '%';
}

/* Beschriftungen kommen als eigene Ebene darueber, nicht in die
   Bildpunkte: Schrift, die mitvergroessert wird, franst aus. */
function beschriften() {
  const ebene = document.getElementById('kartenschrift');
  if (!ebene) return;
  ebene.innerHTML = GEBIETE.map((g) => {
    const links = (g.x / VORLAGE.breite) * 100;
    const oben = (g.y / VORLAGE.hoehe) * 100;
    return '<span class="gebietsname" style="left:' + links.toFixed(2) + '%;top:' + oben.toFixed(2) + '%">'
      + g.text
      + (g.warnung ? '<em>' + g.warnung + '</em>' : '')
      + '</span>';
  }).join('');
}

function legendeZeichnen() {
  if (!legende) return;
  /* Nur die Biome zeigen, die auf dieser Karte wirklich vorkommen —
     eine Legende mit leeren Eintraegen ist eine Falschaussage. */
  const vorhanden = new Set(karte.biome);
  const reihenfolge = [
    BIOM.TIEFSEE, BIOM.MEER, BIOM.FLACHWASSER, BIOM.STRAND,
    BIOM.WIESE, BIOM.GRASLAND, BIOM.WALD, BIOM.TIEFERWALD,
    BIOM.HUEGEL, BIOM.BERG, BIOM.GIPFEL,
    BIOM.SUMPF, BIOM.MOORWASSER, BIOM.WUESTE, BIOM.DUENE,
    BIOM.STURM, BIOM.STADT,
  ];
  legende.innerHTML = reihenfolge.filter((b) => vorhanden.has(b)).map((b) => {
    const [r, g, bl] = PALETTE[b][0];
    return '<li><span class="tupfen" style="background:rgb(' + r + ',' + g + ',' + bl + ')"></span>'
      + BIOM_NAMEN[b] + '</li>';
  }).join('');
}

function staedteZeichnen() {
  if (!staedteliste) return;
  const nachGroesse = [...karte.staedte].sort((a, b) => b.radius - a.radius);
  staedteliste.innerHTML = nachGroesse.map((s) => (
    '<li><strong>' + s.art + '</strong> <em>(noch nicht verknüpft)</em>'
    + '<span class="lage">' + s.lage + ' · x: ' + s.x + ', y: ' + s.y
    + ' · Größe ' + s.groesse + '</span></li>'
  )).join('');
}

/* ------------------------------------------------------------------ *
 * Bedienung
 * ------------------------------------------------------------------ */

document.getElementById('zoom-rein')?.addEventListener('click', () => {
  zoom = Math.min(6, zoom + 1);
  zeichnen();
});
document.getElementById('zoom-raus')?.addEventListener('click', () => {
  zoom = Math.max(1, zoom - 1);
  zeichnen();
});
document.getElementById('neue-welt')?.addEventListener('click', () => {
  /* Eine andere Saat behaelt Janniks Umrisse, wuerfelt aber Waelder,
     Berge und Kuestenkanten neu. Die Staedte bleiben, wo sie sind. */
  saat = (saat * 1103515245 + 12345) % 2147483647;
  zeichnen();
});
document.getElementById('zuruecksetzen')?.addEventListener('click', () => {
  saat = STANDARD.saat;
  zoom = 2;
  zeichnen();
});

flaeche?.addEventListener('click', (ereignis) => {
  if (!karte || !koordinatenanzeige) return;
  const rahmen = flaeche.getBoundingClientRect();
  if (!rahmen.width || !rahmen.height) return;
  const x = Math.max(0, Math.min(rahmen.width, ereignis.clientX - rahmen.left));
  const y = Math.max(0, Math.min(rahmen.height, ereignis.clientY - rahmen.top));
  const kartenpunkt = bildpunktZuKartenpunkt({
    x: (x / rahmen.width) * karte.breite,
    y: (y / rahmen.height) * karte.hoehe,
  }, {
    breite: karte.breite,
    hoehe: karte.hoehe,
  });
  koordinatenanzeige.textContent = 'Kartenpunkt zum Abschreiben: { x: '
    + kartenpunkt.x + ', y: ' + kartenpunkt.y + ' }';
});

zeichnen();
