/* ===================================================================
   Age of Beast — Favoriten
   [Aufgabe: Leseruntime]

   -------------------------------------------------------------------
   Ein Stern an jedem Eintrag, jeder Karte und jedem Charakterbogen.
   Was mit Stern versehen ist, steht in einer eigenen Liste.

   **Warum im Browser gespeichert und nicht in der Datenbank:**
   Favoriten sind persönlich. Lägen sie in den Weltdaten, sähe jeder
   Mitspieler, was der andere sich merkt — und Schreibrechte bräuchte
   man dafür auch, obwohl ein Stern niemandem etwas an der Welt ändert.
   `localStorage` gilt je Gerät und Browser; wer an zwei Geräten spielt,
   hat zwei Listen. Das ist der bewusste Preis. Später liesse sich das
   je Konto in Firestore spiegeln, ohne dass sich hier etwas ändert:
   `lies()` und `schreibe()` sind die einzigen zwei Stellen, die den
   Speicher kennen.

   **Ein Favorit merkt sich seinen Namen mit.** Sonst zeigte die Liste
   nach dem Neuladen nur Kennungen, und sie müsste erst die ganze Welt
   laden, um Namen zu haben.

   Klassisches Skript, kein Modul: `index.html` lädt es genauso wie die
   Kartenseite und die Bögen. Es meldet sich als `window.aobFavoriten`.
   =================================================================== */

(function () {
  'use strict';

  var SCHLUESSEL = 'aob.favoriten.v1';
  var horcher = [];

  /* Ein privater Modus oder abgeschaltete Website-Daten lassen
     `localStorage` **werfen** — nicht nur leer sein. Ohne diesen Fang
     bliebe die ganze Seite stehen, weil ein Stern nicht ging. */
  function lies() {
    try {
      var roh = window.localStorage.getItem(SCHLUESSEL);
      if (!roh) return [];
      var liste = JSON.parse(roh);
      return Array.isArray(liste) ? liste.filter(function (f) {
        return f && typeof f.typ === 'string' && typeof f.id === 'string';
      }) : [];
    } catch (e) {
      return [];
    }
  }

  function schreibe(liste) {
    try {
      window.localStorage.setItem(SCHLUESSEL, JSON.stringify(liste));
      return true;
    } catch (e) {
      return false;
    }
  }

  function schluessel(typ, id) { return typ + '::' + id; }

  function melden() {
    var liste = lies();
    for (var i = 0; i < horcher.length; i += 1) {
      try { horcher[i](liste); } catch (e) { /* ein Horcher darf die anderen nicht mitreissen */ }
    }
  }

  var api = {
    /** Alle Favoriten, neueste zuerst. */
    alle: function () {
      return lies().slice().sort(function (a, b) {
        return String(b.wann || '').localeCompare(String(a.wann || ''));
      });
    },

    /** Nur die einer Art: `eintrag`, `karte`, `bogen`. */
    nachTyp: function (typ) {
      return api.alle().filter(function (f) { return f.typ === typ; });
    },

    istFavorit: function (typ, id) {
      var k = schluessel(typ, id);
      return lies().some(function (f) { return schluessel(f.typ, f.id) === k; });
    },

    /**
     * Setzt oder entfernt den Stern.
     * @returns {boolean} der Zustand **danach**
     */
    umschalten: function (typ, id, name, zusatz) {
      var k = schluessel(typ, id);
      var liste = lies();
      var drin = liste.findIndex(function (f) { return schluessel(f.typ, f.id) === k; });
      if (drin >= 0) {
        liste.splice(drin, 1);
        schreibe(liste);
        melden();
        return false;
      }
      liste.push({
        typ: typ,
        id: id,
        name: String(name || id),
        zusatz: zusatz ? String(zusatz) : '',
        wann: new Date().toISOString(),
      });
      schreibe(liste);
      melden();
      return true;
    },

    anzahl: function () { return lies().length; },

    /** Ruft `rueckruf(liste)` bei jeder Änderung — auch in anderen Tabs. */
    beiAenderung: function (rueckruf) {
      horcher.push(rueckruf);
      return function () {
        var i = horcher.indexOf(rueckruf);
        if (i >= 0) horcher.splice(i, 1);
      };
    },

    /**
     * Baut einen Sternknopf. Er trägt seinen Zustand als
     * `aria-pressed`, damit auch ein Vorleseprogramm ihn versteht.
     */
    knopf: function (typ, id, name, zusatz) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'stern';
      b.dataset.favTyp = typ;
      b.dataset.favId = id;

      function zeichnen(an) {
        b.setAttribute('aria-pressed', an ? 'true' : 'false');
        b.title = an ? 'Aus den Favoriten nehmen' : 'Zu den Favoriten';
        b.setAttribute('aria-label', b.title + ': ' + (name || id));
        b.textContent = an ? '★' : '☆';
      }
      zeichnen(api.istFavorit(typ, id));

      b.addEventListener('click', function (e) {
        /* Der Stern sitzt oft **in** einem Verweis oder einer Kachel.
           Ohne diese zwei Zeilen würde ein Klick darauf zugleich den
           Eintrag öffnen. */
        e.preventDefault();
        e.stopPropagation();
        zeichnen(api.umschalten(typ, id, name, zusatz));
      });
      return b;
    },
  };

  /* Ein zweiter Tab derselben Seite soll nicht mit einer veralteten
     Liste dastehen. */
  window.addEventListener('storage', function (e) {
    if (e.key === SCHLUESSEL) melden();
  });

  window.aobFavoriten = api;
}());
