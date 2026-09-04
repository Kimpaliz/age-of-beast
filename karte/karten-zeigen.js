/* ===================================================================
   Age of Beast — die Spielkarten als Kacheln
   [Aufgabe: Karte]

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

const ARTNAMEN = {
  domain: 'Domänenkarte',
  ancestry: 'Abstammung',
  community: 'Gemeinschaft',
  subclass: 'Unterklasse',
};

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
    return (k.name + ' ' + (k.domaene || '') + ' ' + (k.regeltext || '')).toLowerCase().includes(suchtext);
  });

  raster.innerHTML = gezeigt.map(kachel).join('');
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
  const arten = [...new Set(alleKarten.map((k) => k.art).filter(Boolean))];

  const knopf = (wert, text, anzahl) => (
    '<button type="button" class="karten-knopf" data-filter="' + sicher(wert) + '"'
    + (wert === filter ? ' aria-pressed="true"' : ' aria-pressed="false"') + '>'
    + sicher(text) + (anzahl ? ' <small>' + anzahl + '</small>' : '') + '</button>'
  );

  filterleiste.innerHTML = knopf('alle', 'Alle', alleKarten.length)
    + arten.map((a) => knopf(a, ARTNAMEN[a] || a, alleKarten.filter((k) => k.art === a).length)).join('')
    + domaenen.map((d) => knopf('domaene:' + d, d, alleKarten.filter((k) => k.domaene === d).length)).join('');

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
    const quelle = new URL('../daten/daggerheart-karten.json', import.meta.url);
    const antwort = await fetch(quelle);
    if (!antwort.ok) throw new Error('HTTP ' + antwort.status);
    const daten = await antwort.json();
    alleKarten = aufteilen(Array.isArray(daten.karten) ? daten.karten : []);
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
