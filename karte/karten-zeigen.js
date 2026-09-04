/* ===================================================================
   Age of Beast — die Spielkarten als Kacheln
   [Aufgabe: Spielkarten]

   -------------------------------------------------------------------
   Liest `daten/daggerheart-karten.json` und baut daraus die Kacheln.

   Zwei Entscheidungen, die den Unterschied machen:

   **Fehlende Angaben werden gezeigt, nicht kaschiert.** Eine Karte ohne
   Regeltext bekommt einen sichtbaren Hinweis. Am Spieltisch ist eine
   Luecke, die man sieht, harmlos — eine, die man fuer vollstaendig
   haelt, nicht.

   **Die Daten kommen aus einer Datei, nicht aus dem Programm.** Wer
   eine Karte korrigieren will, aendert die JSON; hier ist nichts
   nachzupflegen.

   =================================================================== */

const raster = document.getElementById('kartenraster');
const meldung = document.getElementById('kartenmeldung');
const filterleiste = document.getElementById('kartenfilter');
const suchfeld = document.getElementById('kartensuche');
const zahl = document.getElementById('kartenzahl');

import { blasenAnbinden } from './kartenblase.js';

const ARTNAMEN = {
  domain: 'Domänenkarte',
  ancestry: 'Abstammung',
  community: 'Gemeinschaft',
  subclass: 'Unterklasse',
  primaerwaffe: 'Primärwaffe',
  sekundaerwaffe: 'Sekundärwaffe',
  ruestung: 'Rüstung',
  gegenstand: 'Fundstück',
  verbrauch: 'Verbrauchsgut',
};

/* Die Reihenfolge der Gruppen in der Filterleiste. Ohne sie stuenden
   die Arten in der Reihenfolge, in der sie zufaellig zuerst vorkommen —
   und die haengt an der Sortierung der Datei. */
const GRUPPEN = [
  ['Karten', ['domain', 'ancestry', 'community', 'subclass']],
  ['Ausrüstung', ['primaerwaffe', 'sekundaerwaffe', 'ruestung']],
  ['Fundstücke', ['gegenstand', 'verbrauch']],
];

let alleKarten = [];
let filter = 'alle';
let suche = '';

function sicher(text) {
  return String(text ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/* Der Regeltext darf einfache Auszeichnung tragen, aber kein beliebiges
   HTML: Die Daten stammen aus einer Recherche, nicht aus einer
   vertrauenswuerdigen Quelle. */
function textAufbereiten(roh) {
  const t = sicher(roh).trim();
  if (!t) return '';
  return t.split(/\n\s*\n/).map((absatz) => (
    '<p>' + absatz.replace(/\n/g, '<br>').replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>') + '</p>'
  )).join('');
}

/**
 * Eine Unterklasse ist im Spiel **nicht eine Karte, sondern drei**:
 * Foundation, Specialization und Mastery liegen einzeln auf dem Tisch
 * und werden nacheinander freigeschaltet.
 *
 * Zusammengefasst ergaben sie Kacheln von im Median 868 und bis zu 1785
 * Zeichen — daher die langgezogenen Streifen. Aufgeteilt sind es 302 im
 * Median und hoechstens 636, also so lang wie eine gewoehnliche
 * Domaenenkarte.
 */
function aufteilen(karten) {
  const aus = [];
  for (const k of karten) {
    const stufen = [
      ['Foundation', k.merkmaleFoundation],
      ['Specialization', k.merkmaleSpecialization],
      ['Mastery', k.merkmaleMastery],
    ].filter(([, liste]) => Array.isArray(liste) && liste.length);

    if (!stufen.length) { aus.push(k); continue; }

    for (const [stufenname, liste] of stufen) {
      aus.push({
        ...k,
        id: k.id + '-' + stufenname.toLowerCase(),
        stufenname,
        merkmale: liste,
        merkmaleFoundation: null,
        merkmaleSpecialization: null,
        merkmaleMastery: null,
      });
    }
  }
  return aus;
}

/* Ein Gegenstand hat andere Felder als eine Domaenenkarte: Attribut,
   Reichweite, Schaden, Traglast — dafuer keinen Regeltext und keine
   Rueckholkosten. Eine gemeinsame Funktion mit zehn Abfragen waere
   schwerer zu lesen als zwei getrennte. */
function gegenstandKachel(g) {
  const t = [];
  t.push('<article class="spielkarte gegenstand" data-art="' + sicher(g.art) + '">');

  t.push('<div class="karte-kopf">');
  if (g.abStufe && g.abStufe > 1) {
    t.push('<span class="karte-stufe" title="ab Stufe">' + sicher(g.abStufe) + '</span>');
  }
  t.push('<span class="stern-platz" data-fav-typ="karte" data-fav-id="' + sicher(g.id)
    + '" data-fav-name="' + sicher(g.name) + '"></span>');
  t.push('</div>');

  t.push('<div class="karte-band">');
  t.push('<h2 class="karte-name">' + sicher(g.name) + '</h2>');
  t.push('<p class="karte-unterzeile">' + sicher(ARTNAMEN[g.art] || g.art) + '</p>');
  t.push('</div>');

  t.push('<div class="karte-text">');
  const werte = [];
  const w = (b, v) => { if (v !== null && v !== undefined && v !== '') werte.push([b, v]); };
  w('Attribut', g.attribut);
  w('Reichweite', g.reichweite);
  w('Schaden', g.schaden && g.schaden.text);
  w('Traglast', g.traglast);
  if (g.schwellen) w('Grundschwellen', g.schwellen.schwer + ' / ' + g.schwellen.ernst);
  w('Schwellen je Stufe', g.schwellenStufen);
  w('Rüstungswert', g.score);
  w('Rüstungswert je Stufe', g.scoreStufen);
  w('Beutewurf', g.wurf);
  if (werte.length) {
    t.push('<dl class="gegenstand-werte">' + werte.map(([b, v]) =>
      '<div><dt>' + sicher(b) + '</dt><dd>' + sicher(v) + '</dd></div>').join('') + '</dl>');
  }
  if (g.merkmal) {
    t.push('<div class="karte-merkmal"><span class="karte-merkmal-name">'
      + sicher(g.merkmal) + '</span>'
      + (g.wirkung ? textAufbereiten(g.wirkung) : '') + '</div>');
  } else if (g.wirkung) {
    t.push(textAufbereiten(g.wirkung));
  }
  if (g.unsicher) {
    t.push('<p class="karte-unsicher">' + sicher(g.unsicher) + '</p>');
  }
  t.push('</div>');

  t.push('<div class="karte-fuss"><span class="karte-art">'
    + sicher(ARTNAMEN[g.art] || g.art) + '</span><span>'
    + sicher(g.quelle || '') + '</span></div>');
  t.push('</article>');
  return t.join('');
}

function kachel(k) {
  const art = k.art || 'domain';
  const domaene = k.domaene || '';
  const teile = [];

  /* Wie viel Text traegt diese Karte? Danach richtet sich die
     Schriftgroesse — so bleibt das Kartenformat fest, statt dass die
     Kachel in die Laenge waechst. */
  const textlaenge = (k.regeltext || '').length
    + (k.merkmale || []).reduce((s, m) => s + (m.text || '').length + (m.name || '').length, 0);
  const enge = textlaenge > 620 ? 'sehr' : textlaenge > 460 ? 'eng' : textlaenge > 340 ? 'etwas' : 'normal';

  teile.push('<article class="spielkarte" data-art="' + sicher(art) + '"'
    + ' data-enge="' + enge + '"'
    + (domaene ? ' data-domaene="' + sicher(domaene) + '"' : '') + '>');

  /* Kopf mit Wappen, Stufe und Kosten */
  teile.push('<div class="karte-kopf">');
  if (k.stufe !== null && k.stufe !== undefined && k.stufe !== '') {
    teile.push('<span class="karte-stufe" title="Stufe">' + sicher(k.stufe) + '</span>');
  }
  if (k.kosten !== null && k.kosten !== undefined && k.kosten !== '') {
    teile.push('<span class="karte-kosten" title="Rückholkosten in Stress">' + sicher(k.kosten) + '</span>');
  }
  if (k.wappen) {
    teile.push('<img class="karte-wappen" src="' + sicher(k.wappen) + '" alt="" decoding="async">');
  }
  teile.push('<span class="stern-platz" data-fav-typ="karte" data-fav-id="'
    + sicher(k.id) + '" data-fav-name="' + sicher(k.name) + '"></span>');
  teile.push('</div>');

  /* Titelband */
  const unterzeile = domaene
    ? domaene + (k.kartentyp ? ' · ' + k.kartentyp : '')
    : [k.klasse, k.stufenname].filter(Boolean).join(' · ') || ARTNAMEN[art] || '';
  teile.push('<div class="karte-band">');
  teile.push('<h2 class="karte-name">' + sicher(k.name) + '</h2>');
  if (unterzeile) teile.push('<p class="karte-unterzeile">' + sicher(unterzeile) + '</p>');
  teile.push('</div>');

  /* Regeltext oder Merkmale */
  teile.push('<div class="karte-text">');

  /* Unterklassen tragen ihre Merkmale nicht in `merkmale`, sondern in
     drei Stufen: Foundation, Specialization, Mastery. Ohne diesen Fall
     stuenden alle 18 Unterklassen als „Regeltext fehlt" da, obwohl die
     Daten vollstaendig sind. */
  if (Array.isArray(k.merkmale) && k.merkmale.length) {
    for (const m of k.merkmale) {
      teile.push('<div class="karte-merkmal">'
        + '<span class="karte-merkmal-name">' + sicher(m.name) + '</span>'
        + textAufbereiten(m.text)
        + '</div>');
    }
  } else if (k.regeltext) {
    teile.push(textAufbereiten(k.regeltext));
  } else {
    teile.push('<div class="karte-luecke">Der Regeltext dieser Karte ist noch nicht erfasst.'
      + (k.unsicher ? ' <em>' + sicher(k.unsicher) + '</em>' : '') + '</div>');
  }
  teile.push('</div>');

  /* Fuss */
  teile.push('<div class="karte-fuss">'
    + '<span class="karte-art">' + sicher(ARTNAMEN[art] || art) + '</span>'
    + '<span>' + sicher(k.quelle || '') + '</span>'
    + '</div>');

  teile.push('</article>');
  return teile.join('');
}

/**
 * Jede Karte macht ihre Schrift selbst passend.
 *
 * Warum nicht die Stufen aus `data-enge` allein: Die Textlaenge sagt die
 * noetige Schriftgroesse **nicht genau genug** voraus. Bei 264 px
 * Kartenbreite gemessen — das ist die schmalste Karte, die das Raster
 * erzeugt (`minmax(16.5rem, 1fr)`) — braucht eine Karte mit 601 Zeichen
 * 0,659 rem, eine mit 627 Zeichen dagegen 0,687. Ueberschriften,
 * Absatzumbrueche und lange Woerter wiegen schwerer als die blosse
 * Zeichenzahl.
 *
 * Die Folge war ein Rollbalken auf genau einer Karte: Die Stufen waren
 * bei 306 px eingestellt, und bei 264 px liefen sechs Karten ueber.
 *
 * Jetzt schrumpft nur, was wirklich ueberlaeuft. Gemessen an 270 Karten:
 * **12 mussten angepasst werden, 29 ms fuer alle**, danach 0 Ueberlaeufe;
 * kleinste Schrift 10 px. Die Stufen bleiben als guter erster Tipp — sie
 * sparen dem Nachmessen die Arbeit.
 *
 * Der Rollbalken bleibt als letzter Ausweg stehen. Text zu verstecken
 * waere schlimmer: Am Spieltisch ist eine Regel, die man nicht sieht,
 * gefaehrlicher als eine, die man wegscrollen muss.
 */
const SCHRIFT_MINDEST = 0.58;  /* rem — darunter wird es unlesbar */
const SCHRIFT_SCHRITT = 0.015;

function passendMachen() {
  const wurzel = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
  for (const karte of raster.querySelectorAll('.spielkarte')) {
    const t = karte.querySelector('.karte-text');
    if (!t) continue;
    /* Erst zurueck auf den Stufenwert: Sonst bliebe eine Karte, die
       einmal geschrumpft wurde, nach dem Vergroessern des Fensters
       fuer immer klein. */
    t.style.fontSize = '';
    if (t.scrollHeight <= t.clientHeight) continue;
    let gr = parseFloat(getComputedStyle(t).fontSize) / wurzel;
    while (gr > SCHRIFT_MINDEST) {
      gr -= SCHRIFT_SCHRITT;
      t.style.fontSize = gr.toFixed(3) + 'rem';
      if (t.scrollHeight <= t.clientHeight) break;
    }
  }
}

/* ------------------------------------------------------------------ *
 * Die Karten stehen in Bloecken, nicht als Wand
 * ------------------------------------------------------------------ *
 *
 * ⚠️ Janniks Meldung vom 04.09.2026: „Die Karten sollen aber von Anfang
 * an schon gruppiert sein."
 *
 * Er hatte recht, und die Verwechslung lag bei mir: Die **Filterleiste**
 * war nach Gruppen geordnet, die **Karten** darunter nicht. Gemessen
 * standen dort **393 Kacheln in einem einzigen Raster** — darunter 189
 * Domaenenkarten am Stueck. Wer nichts filtert, sieht eine Wand.
 *
 * Zwei Ebenen, beide aus dem Spiel selbst:
 *
 *   1. **Art** in der Reihenfolge von `GRUPPEN` — Domaenenkarten,
 *      Abstammungen, Gemeinschaften, Unterklassen, dann Ausruestung.
 *   2. **Domaene** innerhalb der Domaenenkarten. Ohne sie waere der
 *      groesste Block mit 189 Karten fast so unuebersichtlich wie
 *      vorher; mit ihr sind es neun Blöcke zu je rund 21.
 *
 * Ein Kopf erscheint nur, wenn es **mehr als einen** Block gibt. Steht
 * ohnehin nur eine Art da, sagt die gedrueckte Filtertaste das bereits —
 * eine Ueberschrift, die den Knopf darueber wiederholt, ist Laerm.
 */
function inBloecken(karten) {
  const bloecke = [];
  const holen = (name) => {
    let b = bloecke.find((x) => x.name === name);
    if (!b) { b = { name, karten: [] }; bloecke.push(b); }
    return b;
  };

  /* Reihenfolge kommt aus GRUPPEN, nicht aus der Datei — sonst haenge
     die Anordnung an der zufaelligen Sortierung von `daten/*.json`. */
  const reihenfolge = [];
  for (const [, arten] of GRUPPEN) reihenfolge.push(...arten);
  const rang = (k) => {
    const i = reihenfolge.indexOf(k.art);
    return i === -1 ? reihenfolge.length : i;
  };

  for (const k of [...karten].sort((a, b) => rang(a) - rang(b))) {
    if (k.art === 'domain' && k.domaene) holen(k.domaene).karten.push(k);
    else holen(ARTNAMEN[k.art] || k.art).karten.push(k);
  }
  return bloecke;
}

function inBloeckenZeichnen(gezeigt) {
  const kachelnVon = (liste) => liste.map((k) =>
    (k.quelleTyp === 'gegenstand' ? gegenstandKachel(k) : kachel(k))).join('');

  const bloecke = inBloecken(gezeigt);
  if (bloecke.length <= 1) {
    return '<div class="spielkarten-raster">' + kachelnVon(gezeigt) + '</div>';
  }
  return bloecke.map((b) =>
    '<section class="karten-block">'
    + '<h2 class="karten-block-kopf">' + sicher(b.name)
    + ' <small>' + b.karten.length + '</small></h2>'
    + '<div class="spielkarten-raster">' + kachelnVon(b.karten) + '</div>'
    + '</section>').join('');
}

function zeichnen() {
  const suchtext = suche.trim().toLowerCase();
  const gezeigt = alleKarten.filter((k) => {
    if (filter !== 'alle') {
      const passt = filter.startsWith('domaene:')
        ? k.domaene === filter.slice(8)
        : k.art === filter;
      if (!passt) return false;
    }
    if (!suchtext) return true;
    const heuhaufen = [k.name, k.domaene, k.regeltext, k.merkmal, k.wirkung,
      k.attribut, k.reichweite, ARTNAMEN[k.art]].filter(Boolean).join(' ');
    return heuhaufen.toLowerCase().includes(suchtext);
  });

  raster.innerHTML = inBloeckenZeichnen(gezeigt);

  /* Erst nach dem Zeichnen: Vorher gibt es die Plaetze nicht. */
  const fav = window.aobFavoriten;
  if (fav) {
    for (const platz of raster.querySelectorAll('.stern-platz:empty')) {
      platz.appendChild(fav.knopf(platz.dataset.favTyp, platz.dataset.favId, platz.dataset.favName));
    }
  }
  passendMachen();
  if (zahl) {
    zahl.textContent = gezeigt.length === alleKarten.length
      ? alleKarten.length + ' Karten'
      : gezeigt.length + ' von ' + alleKarten.length + ' Karten';
  }
}

function filterLeisteBauen() {
  if (!filterleiste) return;
  const domaenen = [...new Set(alleKarten.map((k) => k.domaene).filter(Boolean))].sort();

  const knopf = (wert, text, anzahl) => (
    '<button type="button" class="karten-knopf" data-filter="' + sicher(wert) + '"'
    + (wert === filter ? ' aria-pressed="true"' : ' aria-pressed="false"') + '>'
    + sicher(text) + (anzahl ? ' <small>' + anzahl + '</small>' : '') + '</button>'
  );
  const zaehle = (art) => alleKarten.filter((k) => k.art === art).length;

  /* Nach Gruppen statt in einer langen Reihe: Mit den Gegenstaenden sind
     es neun Arten plus neun Domaenen — als eine Zeile waere das auf dem
     Handy eine endlose Rutschbahn. */
  const teile = ['<div class="karten-gruppe">' + knopf('alle', 'Alle', alleKarten.length) + '</div>'];
  for (const [titel, arten] of GRUPPEN) {
    const vorhanden = arten.filter((a) => zaehle(a) > 0);
    if (!vorhanden.length) continue;
    teile.push('<div class="karten-gruppe">'
      + '<span class="karten-gruppe-name">' + sicher(titel) + '</span>'
      + vorhanden.map((a) => knopf(a, ARTNAMEN[a] || a, zaehle(a))).join('')
      + '</div>');
  }
  if (domaenen.length) {
    teile.push('<div class="karten-gruppe">'
      + '<span class="karten-gruppe-name">Domänen</span>'
      + domaenen.map((d) => knopf('domaene:' + d, d,
        alleKarten.filter((k) => k.domaene === d).length)).join('')
      + '</div>');
  }
  filterleiste.innerHTML = teile.join('');

  filterleiste.querySelectorAll('button').forEach((b) => {
    b.addEventListener('click', () => {
      filter = b.dataset.filter;
      filterLeisteBauen();
      zeichnen();
    });
  });
}

/* Ein schmaleres Fenster heisst schmalere Karten und damit mehr Zeilen.
   Erst wenn das Ziehen aufhoert — waehrenddessen waere es Arbeit fuer
   Zwischenstaende, die niemand ansieht. */
let ruhe = 0;
addEventListener('resize', () => {
  clearTimeout(ruhe);
  ruhe = setTimeout(passendMachen, 150);
});

suchfeld?.addEventListener('input', () => {
  suche = suchfeld.value;
  zeichnen();
});

/* ------------------------------------------------------------------ *
 * Laden
 * ------------------------------------------------------------------ */

(async () => {
  try {
    /* Der Pfad wird am Modul aufgeloest, nicht an der Seiten-URL. Ein
       blosses 'daten/...' waere relativ zum Dokument und ginge nur
       zufaellig gut, solange die Seite in der Wurzel liegt. */
    const holen = async (pfad) => {
      const antwort = await fetch(new URL(pfad, import.meta.url));
      if (!antwort.ok) throw new Error(pfad + ': HTTP ' + antwort.status);
      return antwort.json();
    };
    const [daten, dinge] = await Promise.all([
      holen('../daten/daggerheart-karten.json'),
      /* Die Gegenstaende sind neuer als die Karten. Fehlen sie, zeigt die
         Seite eben nur die Karten — das ist besser als eine leere Seite. */
      holen('../daten/daggerheart-gegenstaende.json').catch(() => ({ gegenstaende: [] })),
    ]);
    alleKarten = [
      ...aufteilen(Array.isArray(daten.karten) ? daten.karten : []),
      ...(dinge.gegenstaende || []).map((g) => ({ ...g, quelleTyp: 'gegenstand' })),
    ];
    if (!alleKarten.length) throw new Error('Die Datei enthält keine Karten.');
    filterLeisteBauen();
    zeichnen();
  } catch (fehler) {
    if (meldung) {
      meldung.hidden = false;
      meldung.innerHTML = '<strong>Die Kartendaten fehlen noch.</strong><br>'
        + 'Erwartet wird <code>daten/daggerheart-karten.json</code>. '
        + 'Die 234 Wappen liegen bereits unter <code>daten/kartenbilder/</code>; '
        + 'was fehlt, sind Stufen, Kosten und Regeltexte.'
        + '<br><small>' + sicher(fehler.message) + '</small>';
    }
  }
})();
