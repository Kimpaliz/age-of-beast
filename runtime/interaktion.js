/* Age of Beast — Vorschaublase, Suche, Leiste, Farbschema, Filter.
   [Aufgabe: Leseruntime]

   Was: Alles, was auf eine Eingabe reagiert, ohne die Seite zu wechseln.

   ⚠️ Der Filter setzt `kachel.hidden`. Dass das wirkt, haengt an
   `styles/grundregeln.css` — eine Klassenregel mit `display` schlaegt
   das Attribut sonst, und am 04.09.2026 tat sie das auch: 35 Kacheln
   trugen `hidden`, keine war unsichtbar.

   Arbeitet zusammen mit: `datenindex.js` und `ansichten.js` (bekommt
   beide hereingereicht), `werkzeuge/pruefe-filter.mjs` (misst im
   Browser, dass der Filter wirklich versteckt). */
(function () {

  'use strict';

  const bausteine = window.__aobLeserBausteine = window.__aobLeserBausteine || {};

  bausteine.interaktion = function interaktionErstellen(datenindex, ansichten) {

    const vorschau = document.getElementById('vorschau');
    const suchfeld = document.getElementById('suchfeld');
    const suchTreffer = document.getElementById('such-treffer');
    const sucheLeeren = document.getElementById('suche-leeren');
    const rahmen = document.getElementById('rahmen');
    const schalter = document.getElementById('leiste-schalter');
    const themaKnopf = document.getElementById('thema-knopf');
    let installiert = false;
    let ziel = null;
    let letzterZeiger = 'mouse';
    let auswahl = -1;
    let einblendUhr = null;
    let ausblendUhr = null;

    const sicher = (t) => String(t ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    const kuerzen = (t, n) => {
      t = String(t || '').trim();
      return t.length <= n ? t : t.slice(0, t.lastIndexOf(' ', n) || n) + ' …';
    };

    const schmal = () => window.matchMedia('(max-width: 60rem)').matches;

    function verbergen() {
      if (ziel) ziel.classList.remove('aktiv');
      ziel = null;
      if (vorschau) {
        vorschau.hidden = true;
        vorschau.innerHTML = '';
      }
    }

    const abbrechen = () => {
      clearTimeout(einblendUhr);
      clearTimeout(ausblendUhr);
    };

    function zeigen(a) {
      const e = datenindex.eintragHolen(a.dataset.ziel);
      if (!e || !vorschau) return;
      if (ziel) ziel.classList.remove('aktiv');
      ziel = a;
      a.classList.add('aktiv');
      const zahl = datenindex.verknuepfungsZahl(e);
      vorschau.innerHTML = '<span class="mikro v-etikett">' + sicher(datenindex.etikettHolen(e)) + '</span><div class="v-name">' + sicher(e.name) + '</div>' + (e.kurz ? '<p class="v-text">' + sicher(kuerzen(e.kurz, 190)) + '</p>' : '') + '<span class="v-fuss"><span>' + zahl + ' ' + (zahl === 1 ? 'Verknüpfung' : 'Verknüpfungen') + ' &middot; ' + datenindex.reifegrad(e) + '</span><a class="v-oeffnen" href="#/eintrag/' + encodeURIComponent(e.id) + '">Öffnen &rarr;</a></span>';
      vorschau.hidden = false;
      const platz = a.getBoundingClientRect();
      const eigen = vorschau.getBoundingClientRect();
      const rand = 12;
      let links = Math.max(window.scrollX + rand, Math.min(platz.left + window.scrollX, window.scrollX + document.documentElement.clientWidth - eigen.width - rand));
      const oben = window.innerHeight - platz.bottom > eigen.height + rand || platz.top < eigen.height + rand ? platz.bottom + window.scrollY + 8 : platz.top + window.scrollY - eigen.height - 8;
      vorschau.style.left = links + 'px';
      vorschau.style.top = oben + 'px';
    }

    function suche() {
      if (!suchfeld || !suchTreffer) return;
      const begriff = suchfeld.value;
      auswahl = -1;
      sucheLeeren.hidden = !begriff;
      if (begriff.trim().length < 2) {
        suchTreffer.hidden = true;
        return;
      }
      const treffer = datenindex.suchen(begriff);
      if (!treffer.length) {
        suchTreffer.innerHTML = '<div class="leer">Nichts gefunden für „' + sicher(begriff) + '“.</div>';
        suchTreffer.hidden = false;
        return;
      }
      const hervorheben = (text) => sicher(text).replace(new RegExp('(' + begriff.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'gi'), '<mark>$1</mark>');
      suchTreffer.innerHTML = treffer.map((t, i) => '<button type="button" class="treffer" role="option" data-index="' + i + '" data-ziel="' + sicher(t.eintrag.id) + '"><strong>' + hervorheben(t.eintrag.name) + '</strong><small>' + sicher(datenindex.kategorieInfoHolen(t.eintrag.kategorie)?.einzahl || t.eintrag.kategorie) + (t.stelle ? ' &middot; ' + hervorheben(kuerzen(t.stelle, 90)) : '') + '</small></button>').join('');
      suchTreffer.hidden = false;
    }

    function trefferOeffnen(id) {
      location.hash = '#/eintrag/' + encodeURIComponent(id);
      suchTreffer.hidden = true;
      suchfeld.blur();
    }

    function leisteSetzen(offen) {
      rahmen.classList.toggle('leiste-zu', !offen);
      schalter.setAttribute('aria-expanded', String(offen));
      if (!schmal()) try {
        localStorage.setItem('age-of-beast-leiste', offen ? 'offen' : 'zu');
      }
      catch (e) {
        /* egal */
      }
    }

    function themaSetzen(thema) {
      const wurzel = document.documentElement;
      wurzel.classList.add('thema-wechsel');
      wurzel.dataset.thema = thema;
      themaKnopf.firstElementChild.textContent = thema === 'hell' ? '☀' : '☾';
      try {
        localStorage.setItem('age-of-beast-thema', thema);
      }
      catch (e) {
        /* egal */
      }
      void wurzel.offsetWidth;
      let frei = false;
      const freigeben = () => {
        if (frei) return;
        frei = true;
        wurzel.classList.remove('thema-wechsel');
      };
      requestAnimationFrame(() => requestAnimationFrame(freigeben));
      setTimeout(freigeben, 120);
    }

    function filterVerdrahten() {
      const filter = document.getElementById('filter');
      const kacheln = document.getElementById('kacheln');
      if (!filter || !kacheln || filter.dataset.verdrahtet) return;
      filter.dataset.verdrahtet = 'ja';
      filter.addEventListener('click', (e) => {
        const knopf = e.target.closest('button[data-filter]');
        if (!knopf) return;
        filter.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b === knopf)));
        let sichtbar = 0;
        kacheln.querySelectorAll('.kachel').forEach((k) => {
          const passt = knopf.dataset.filter === 'alle' || k.dataset.kategorie === knopf.dataset.filter;
          k.hidden = !passt;
          sichtbar += passt ? 1 : 0;
        });
        let leer = kacheln.parentElement.querySelector('.leermeldung');
        if (!sichtbar && !leer) {
          leer = document.createElement('p');
          leer.className = 'leermeldung';
          leer.textContent = 'In dieser Kategorie gibt es noch keine Einträge.';
          kacheln.after(leer);
        }
        else if (sichtbar && leer) leer.remove();
      });
    }

    function einmalInstallieren() {
      if (installiert) return false;
      installiert = true;
      document.addEventListener('pointerdown', (e) => {
        letzterZeiger = e.pointerType || 'mouse';
      }, true);
      document.addEventListener('pointerover', (e) => {
        if (letzterZeiger === 'touch') return;
        const a = e.target.closest('a.verweis[data-ziel]');
        if (a) {
          abbrechen();
          if (ziel !== a) einblendUhr = setTimeout(() => zeigen(a), 170);
          return;
        }
        if (e.target.closest('#vorschau')) {
          abbrechen();
          return;
        }
        if (ziel) {
          abbrechen();
          ausblendUhr = setTimeout(verbergen, 160);
        }
      });
      document.addEventListener('focusin', (e) => {
        const a = e.target.closest('a.verweis[data-ziel]');
        if (a) {
          abbrechen();
          zeigen(a);
        } else if (!e.target.closest('#vorschau')) verbergen();
      });
      document.addEventListener('click', (e) => {
        const a = e.target.closest('a.verweis[data-ziel]');
        if (a && letzterZeiger === 'touch' && ziel !== a) {
          e.preventDefault();
          zeigen(a);
          return;
        }
        if (!e.target.closest('#vorschau')) verbergen();
        if (!e.target.closest('.suche')) suchTreffer.hidden = true;
      });
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') verbergen();
        if (e.key === '/' && !/^(INPUT|TEXTAREA)$/.test(document.activeElement.tagName)) {
          e.preventDefault();
          suchfeld.focus();
          suchfeld.select();
        }
      });
      document.addEventListener('pointermove', (e) => {
        const k = e.target.closest('.kachel');
        if (!k) return;
        const p = k.getBoundingClientRect();
        k.style.setProperty('--maus-x', ((e.clientX - p.left) / p.width) * 100 + '%');
        k.style.setProperty('--maus-y', ((e.clientY - p.top) / p.height) * 100 + '%');
      }, {
        passive: true
      });
      window.addEventListener('scroll', verbergen, {
        passive: true
      });
      window.addEventListener('resize', verbergen);
      suchfeld.addEventListener('input', suche);
      suchfeld.addEventListener('keydown', (e) => {
        const knoepfe = [...suchTreffer.querySelectorAll('.treffer')];
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
          if (!knoepfe.length) return;
          e.preventDefault();
          auswahl = e.key === 'ArrowDown' ? (auswahl + 1) % knoepfe.length : (auswahl - 1 + knoepfe.length) % knoepfe.length;
          knoepfe.forEach((k, i) => k.classList.toggle('aktiv', i === auswahl));
          knoepfe[auswahl].scrollIntoView( {
            block: 'nearest'
          });
        }
        else if (e.key === 'Enter') {
          const k = auswahl >= 0 ? knoepfe[auswahl] : knoepfe[0];
          if (k) {
            e.preventDefault();
            trefferOeffnen(k.dataset.ziel);
          }
        }
        else if (e.key === 'Escape') {
          suchTreffer.hidden = true;
          suchfeld.blur();
        }
      });
      suchTreffer.addEventListener('click', (e) => {
        const k = e.target.closest('.treffer');
        if (k) trefferOeffnen(k.dataset.ziel);
      });
      sucheLeeren.addEventListener('click', () => {
        suchfeld.value = '';
        sucheLeeren.hidden = true;
        suchTreffer.hidden = true;
        suchfeld.focus();
      });
      schalter.addEventListener('click', () => leisteSetzen(rahmen.classList.contains('leiste-zu')));
      schalter.addEventListener('pointerenter', () => rahmen.classList.add('leiste-hervorheben'));
      schalter.addEventListener('pointerleave', () => rahmen.classList.remove('leiste-hervorheben'));
      let leisteStart = true;
      try {
        leisteStart = localStorage.getItem('age-of-beast-leiste') !== 'zu';
      }
      catch (e) {
        /* egal */
      }
      leisteSetzen(schmal() ? false : leisteStart);
      let startThema = 'dunkel';
      try {
        startThema = localStorage.getItem('age-of-beast-thema') || 'dunkel';
      }
      catch (e) {
        /* egal */
      }
      themaSetzen(startThema);
      themaKnopf.addEventListener('click', () => themaSetzen(document.documentElement.dataset.thema === 'hell' ? 'dunkel' : 'hell'));
      return true;
    }

    return {
      einmalInstallieren, nachRender: filterVerdrahten, vorschauVerbergen: verbergen, leisteSetzen
    };

  };

})();
