/* ===================================================================
   Age of Beast — die Karte, die beim Überfahren erscheint
   [Aufgabe: Karte]

   -------------------------------------------------------------------
   Auf dem Charakterbogen stehen Namen: „Ribbet", „Gambeson", „Pick and
   Pull". Wer mit der Maus darüberfährt, soll die zugehörige Karte
   sehen, ohne die Seite zu verlassen.

   **Auf dem Handy gibt es kein Überfahren.** Das ist keine Kleinigkeit,
   sondern der Hauptfall — Jannik will die Bögen vor allem auf Handy und
   Tablet nutzen. Deshalb reagiert dieselbe Blase auf **Antippen**, und
   dort erscheint sie unten am Bildschirmrand statt neben dem Wort: Ein
   Kästchen neben dem Finger läge unter der Hand.

   **Die Blase gibt es genau einmal.** Eine je Fundstelle wären auf
   Brix' Bogen schon zehn Kästchen im Dokument, von denen neun immer
   unsichtbar sind.

   **Tastatur:** Jeder Auslöser ist `tabindex="0"` und reagiert auf
   Fokus; Escape schliesst. Sonst wäre die Zusatzinformation nur mit
   Maus erreichbar.
   =================================================================== */

import { finde } from './karten-daten.js';

let blase = null;
let offenFuer = null;

function sicher(t) {
  return String(t ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function absatz(roh) {
  const t = sicher(roh).trim();
  if (!t) return '';
  return t.split(/\n\s*\n/).map((a) =>
    '<p>' + a.replace(/\n/g, '<br>').replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>') + '</p>'
  ).join('');
}

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

/* Eine Zeile „Bezeichnung — Wert", nur wenn es einen Wert gibt. */
function zeile(bezeichnung, wert) {
  if (wert === null || wert === undefined || wert === '') return '';
  return '<div class="blase-wert"><dt>' + sicher(bezeichnung) + '</dt>'
    + '<dd>' + sicher(wert) + '</dd></div>';
}

function inhaltBauen(e) {
  const t = [];
  const art = e.art || 'domain';
  t.push('<article class="kartenblase-karte" data-art="' + sicher(art) + '"'
    + (e.domaene ? ' data-domaene="' + sicher(e.domaene) + '"' : '') + '>');

  t.push('<header class="blase-kopf">');
  t.push('<h3>' + sicher(e.name) + '</h3>');
  const unter = e.domaene
    ? e.domaene + (e.kartentyp ? ' · ' + e.kartentyp : '')
    : [e.klasse, e.stufenname].filter(Boolean).join(' · ') || ARTNAMEN[art] || art;
  t.push('<p class="blase-unterzeile">' + sicher(unter) + '</p>');
  t.push('</header>');

  /* ── Werte, je nach Art ── */
  const werte = [];
  if (e.stufe !== null && e.stufe !== undefined && e.stufe !== '') werte.push(zeile('Stufe', e.stufe));
  if (e.kosten !== null && e.kosten !== undefined && e.kosten !== '') werte.push(zeile('Rückholkosten', e.kosten));
  if (e.attribut) werte.push(zeile('Attribut', e.attribut));
  if (e.reichweite) werte.push(zeile('Reichweite', e.reichweite));
  if (e.schaden) werte.push(zeile('Schaden', e.schaden.text));
  if (e.traglast) werte.push(zeile('Traglast', e.traglast));
  if (e.schwellen) werte.push(zeile('Grundschwellen', e.schwellen.schwer + ' / ' + e.schwellen.ernst));
  if (e.schwellenStufen) werte.push(zeile('Schwellen je Stufe', e.schwellenStufen));
  if (e.score !== null && e.score !== undefined) werte.push(zeile('Rüstungswert', e.score));
  if (e.scoreStufen) werte.push(zeile('Rüstungswert je Stufe', e.scoreStufen));
  if (e.abStufe && e.abStufe > 1) werte.push(zeile('Ab Stufe', e.abStufe));
  const gefuellt = werte.filter(Boolean);
  if (gefuellt.length) t.push('<dl class="blase-werte">' + gefuellt.join('') + '</dl>');

  /* ── Regeltext ── */
  t.push('<div class="blase-text">');
  if (e.merkmal) {
    t.push('<div class="blase-merkmal"><span class="blase-merkmal-name">'
      + sicher(e.merkmal) + '</span>'
      + (e.wirkung ? ' ' + sicher(e.wirkung) : '') + '</div>');
  } else if (e.wirkung) {
    t.push(absatz(e.wirkung));
  }
  if (Array.isArray(e.merkmale) && e.merkmale.length) {
    for (const m of e.merkmale) {
      t.push('<div class="blase-merkmal"><span class="blase-merkmal-name">'
        + sicher(m.name) + '</span>' + absatz(m.text) + '</div>');
    }
  } else if (e.regeltext) {
    t.push(absatz(e.regeltext));
  }
  t.push('</div>');

  if (e.unsicher) {
    t.push('<p class="blase-unsicher">' + sicher(e.unsicher) + '</p>');
  }
  if (e.quelle) t.push('<footer class="blase-fuss">' + sicher(e.quelle) + '</footer>');

  t.push('</article>');
  return t.join('');
}

function blaseHolen() {
  if (blase) return blase;
  blase = document.createElement('div');
  blase.className = 'kartenblase';
  blase.hidden = true;
  blase.setAttribute('role', 'tooltip');
  document.body.appendChild(blase);
  return blase;
}

function schliessen() {
  if (!blase) return;
  blase.hidden = true;
  blase.classList.remove('unten');
  if (offenFuer) offenFuer.setAttribute('aria-expanded', 'false');
  offenFuer = null;
}

/* Ob es sich um ein Zeigegerät ohne Überfahren handelt — dann klebt die
   Blase unten am Rand statt neben dem Wort. */
const istBeruehrung = () =>
  window.matchMedia('(hover: none)').matches || window.innerWidth < 640;

function stellen(ausloeser) {
  const b = blaseHolen();
  if (istBeruehrung()) { b.classList.add('unten'); b.style.left = ''; b.style.top = ''; return; }
  b.classList.remove('unten');

  const r = ausloeser.getBoundingClientRect();
  const bb = b.getBoundingClientRect();
  const rand = 12;

  /* Erst rechts daneben, sonst links; passt beides nicht, mittig. */
  let links = r.right + rand;
  if (links + bb.width > window.innerWidth - rand) links = r.left - bb.width - rand;
  if (links < rand) links = Math.max(rand, (window.innerWidth - bb.width) / 2);

  /* Senkrecht an der Oberkante ausrichten, aber im Fenster halten. */
  let oben = r.top;
  if (oben + bb.height > window.innerHeight - rand) oben = window.innerHeight - bb.height - rand;
  if (oben < rand) oben = rand;

  b.style.left = Math.round(links + window.scrollX) + 'px';
  b.style.top = Math.round(oben + window.scrollY) + 'px';
}

async function oeffnen(ausloeser) {
  const name = ausloeser.dataset.karte;
  if (!name) return;
  const eintrag = await finde(name);
  const b = blaseHolen();

  b.innerHTML = eintrag
    ? inhaltBauen(eintrag)
    : '<div class="kartenblase-karte leer"><h3>' + sicher(name) + '</h3>'
      + '<p class="blase-unsicher">Dazu gibt es keine Karte in den geladenen '
      + 'Regelwerken. Entweder stammt der Gegenstand aus eurer Runde, oder er '
      + 'steht in einem Teil der Regeln, der noch nicht erfasst ist.</p></div>';

  b.hidden = false;
  /* Erst sichtbar machen, dann messen — vorher ist die Grösse 0. */
  stellen(ausloeser);
  if (offenFuer && offenFuer !== ausloeser) offenFuer.setAttribute('aria-expanded', 'false');
  offenFuer = ausloeser;
  ausloeser.setAttribute('aria-expanded', 'true');
}

/**
 * Macht jedes Element mit `data-karte="Name"` zum Auslöser.
 * Mehrfach aufrufbar: Schon versorgte Elemente werden übersprungen.
 */
export function blasenAnbinden(wurzel = document) {
  const ausloeser = wurzel.querySelectorAll('[data-karte]:not([data-blase])');
  for (const a of ausloeser) {
    a.dataset.blase = 'ja';
    a.setAttribute('tabindex', '0');
    a.setAttribute('aria-expanded', 'false');

    a.addEventListener('mouseenter', () => { if (!istBeruehrung()) oeffnen(a); });
    a.addEventListener('mouseleave', () => { if (!istBeruehrung()) schliessen(); });
    a.addEventListener('focus', () => oeffnen(a));
    a.addEventListener('blur', () => schliessen());

    /* Antippen schaltet um — sonst liesse sich die Blase auf dem Handy
       nicht wieder schliessen. */
    a.addEventListener('click', (e) => {
      e.preventDefault();
      if (offenFuer === a && blase && !blase.hidden) schliessen();
      else oeffnen(a);
    });
    a.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); oeffnen(a); }
    });
  }
  return ausloeser.length;
}

/* Einmal je Seite: Escape und ein Klick daneben schliessen. */
if (typeof document !== 'undefined') {
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') schliessen(); });
  document.addEventListener('click', (e) => {
    if (!blase || blase.hidden) return;
    if (e.target.closest('[data-karte]') || e.target.closest('.kartenblase')) return;
    schliessen();
  });
  window.addEventListener('resize', schliessen);
}

export { schliessen as blaseSchliessen };
