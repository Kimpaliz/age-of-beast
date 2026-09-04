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
    if (favorit.typ === 'eintrag') return './#/eintrag/' + encodeURIComponent(favorit.id);
    if (favorit.typ === 'karte') return 'karten.html?karte=' + encodeURIComponent(name);
    return 'bogen.html?figur=' + encodeURIComponent(favorit.id);
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
      verweis.textContent = name;
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
