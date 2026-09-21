/* ===================================================================
   Age of Beast – Favoritenliste
   [Aufgabe: Leseruntime]

   -------------------------------------------------------------------
   Die Seite besitzt keine eigene Kopie der Favoriten. Sie hört nur auf
   `beiAenderung()`: Dadurch bleibt ein Stern aus Karte, Bogen oder einem
   zweiten Tab sofort dieselbe persönliche Liste.
   =================================================================== */

(function () {
  'use strict';

  const ziel = document.getElementById('favoritenliste');
  const favoriten = window.aobFavoriten;
  if (!ziel || !favoriten) return;
  const eintraege = new Map(((window.AGE_OF_BEAST_WELT || {}).eintraege || [])
    .map((eintrag) => [eintrag.id, eintrag]));
  const symbole = window.aobSymbole || null;
  const wikiKennung = (() => {
    if (typeof location === 'undefined') return '';
    const fund = String(location.search || '').match(/(?:^|[?&])w=([^&]*)/u);
    if (!fund) return '';
    try { return decodeURIComponent(fund[1].replace(/\+/gu, ' ')); }
    catch (fehler) { return ''; }
  })();

  if (symbole && !document.querySelector('.symbol-vorrat')) {
    document.body.insertAdjacentHTML('afterbegin', symbole.sprite());
  }

  const GRUPPEN = [
    ['eintrag', 'Einträge'],
    ['karte', 'Karten'],
    ['bogen', 'Bögen'],
  ];

  function lesbarerName(favorit) {
    return typeof favorit.name === 'string' && favorit.name.trim()
      ? favorit.name.trim() : favorit.id;
  }

  function zielAdresse(favorit, name) {
    const kennung = wikiKennung ? 'w=' + encodeURIComponent(wikiKennung) : '';
    if (favorit.typ === 'eintrag') {
      return 'wiki.html' + (kennung ? '?' + kennung : '') + '#/eintrag/' + encodeURIComponent(favorit.id);
    }
    if (favorit.typ === 'karte') {
      return 'karten.html?' + (kennung ? kennung + '&' : '') + 'karte=' + encodeURIComponent(name);
    }
    return 'bogen.html?' + (kennung ? kennung + '&' : '') + 'figur=' + encodeURIComponent(favorit.id);
  }

  function iconAnhaengen(verweis, favorit) {
    if (!symbole || !['eintrag', 'bogen'].includes(favorit.typ)) return;
    const eintrag = eintraege.get(favorit.id);
    if (!eintrag) return;
    const halter = document.createElement('span');
    halter.innerHTML = symbole.eintragSymbol(eintrag.icon, eintrag.kategorie, 'favorit-eintrag-icon');
    if (halter.firstElementChild) verweis.appendChild(halter.firstElementChild);
  }

  function leerZeichnen() {
    const leer = document.createElement('p');
    leer.className = 'favoriten-leer';
    leer.textContent = 'Setze bei einem Eintrag, einer Karte oder einem Charakterbogen einen Stern – dann erscheint er hier.';
    ziel.replaceChildren(leer);
  }

  function gruppeZeichnen(typ, titel, eintraege) {
    const abschnitt = document.createElement('section');
    abschnitt.className = 'favoriten-gruppe';
    const kopf = document.createElement('div');
    kopf.className = 'favoriten-gruppen-kopf';
    const ueberschrift = document.createElement('h2');
    ueberschrift.textContent = titel;
    const zahl = document.createElement('span');
    zahl.className = 'favoriten-zahl';
    zahl.textContent = String(eintraege.length);
    kopf.append(ueberschrift, zahl);

    const liste = document.createElement('ul');
    liste.className = 'favoriten-eintraege';
    for (const favorit of eintraege) {
      const name = lesbarerName(favorit);
      const eintrag = document.createElement('li');
      const verweis = document.createElement('a');
      verweis.className = 'favoriten-verweis';
      verweis.href = zielAdresse(favorit, name);
      iconAnhaengen(verweis, favorit);
      const beschriftung = document.createElement('span');
      beschriftung.textContent = name;
      verweis.appendChild(beschriftung);
      verweis.title = titel.slice(0, -1) + ' öffnen: ' + name;

      const entfernen = favoriten.knopf(typ, favorit.id, name, favorit.zusatz);
      entfernen.className += ' favoriten-stern';
      eintrag.append(verweis, entfernen);
      liste.append(eintrag);
    }
    abschnitt.append(kopf, liste);
    ziel.append(abschnitt);
  }

  function zeichnen() {
    let alle = [];
    try { alle = favoriten.alle(); } catch (fehler) { alle = []; }
    const gueltig = Array.isArray(alle) ? alle.filter((favorit) =>
      favorit && GRUPPEN.some(([typ]) => typ === favorit.typ) &&
      typeof favorit.id === 'string' && favorit.id.trim()
    ) : [];
    if (!gueltig.length) { leerZeichnen(); return; }
    ziel.replaceChildren();
    for (const [typ, titel] of GRUPPEN) {
      const eintraege = gueltig.filter((favorit) => favorit.typ === typ);
      if (eintraege.length) gruppeZeichnen(typ, titel, eintraege);
    }
  }

  favoriten.beiAenderung(zeichnen);
  zeichnen();
}());
