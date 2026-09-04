/* ===================================================================
   Age of Beast — eigenes Rechtsklickmenü
   [Aufgabe: Leseruntime]

   -------------------------------------------------------------------
   Jannik wörtlich: „rechtsklick auf desktop für praktische funktionen
   reservieren und nicht das standart windows kontext fenster!"

   **Nur am Rechner.** Auf Berührungsgeräten gibt es keinen Rechtsklick;
   dort löst langes Drücken denselben Browser-Eintrag aus, und ihn
   abzufangen würde Textmarkieren und Bildspeichern kaputtmachen. Diese
   Datei tut auf solchen Geräten deshalb gar nichts.

   **Das Browsermenü bleibt erreichbar.** Mit gedrückter Umschalttaste
   kommt es wie gewohnt — jeder Browser macht das so, und ohne diesen
   Ausweg wäre „Bild speichern" oder „Seitenquelltext" für immer weg.

   **Die Einträge stehen nicht hier fest.** Wer ein Menü braucht, meldet
   es unter einem Namen an (`anmelden('eintrag', bauer)`) und markiert
   seine Elemente mit `data-menue="eintrag"`. So bleibt diese Datei frei
   von Wissen über Wiki, Karten oder Bögen.
   =================================================================== */

(function () {
  'use strict';

  /* Ein Zeigegerät ohne Überfahren ist ein Finger. Dort wird nichts
     abgefangen. */
  var amRechner = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  var bauer = Object.create(null);
  var menue = null;
  var offen = false;

  function menueHolen() {
    if (menue) return menue;
    menue = document.createElement('div');
    menue.className = 'kontextmenue';
    menue.setAttribute('role', 'menu');
    menue.hidden = true;
    document.body.appendChild(menue);
    return menue;
  }

  function schliessen() {
    if (!menue || !offen) return;
    menue.hidden = true;
    offen = false;
  }

  function zeichnen(eintraege) {
    var m = menueHolen();
    m.innerHTML = '';
    for (var i = 0; i < eintraege.length; i += 1) {
      var e = eintraege[i];
      if (e === '-') {
        var tr = document.createElement('hr');
        tr.className = 'kontextmenue-teiler';
        m.appendChild(tr);
        continue;
      }
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'kontextmenue-eintrag';
      b.setAttribute('role', 'menuitem');
      if (e.symbol) {
        var s = document.createElement('span');
        s.className = 'kontextmenue-symbol';
        s.setAttribute('aria-hidden', 'true');
        s.textContent = e.symbol;
        b.appendChild(s);
      }
      var t = document.createElement('span');
      t.textContent = e.text;
      b.appendChild(t);
      if (e.kurz) {
        var k = document.createElement('span');
        k.className = 'kontextmenue-kurz';
        k.textContent = e.kurz;
        b.appendChild(k);
      }
      /* Der Eintrag wird in einer Schleifenvariablen gefangen — ohne die
         eigene Funktion zeigten alle Knöpfe auf den letzten. */
      (function (eintrag) {
        b.addEventListener('click', function () {
          schliessen();
          try { eintrag.tun(); } catch (fehler) { /* ein Eintrag darf die Seite nicht mitreissen */ }
        });
      }(e));
      m.appendChild(b);
    }
    return m;
  }

  function stellen(m, x, y) {
    /* Erst sichtbar machen, dann messen — vorher ist die Grösse 0. */
    m.hidden = false;
    var r = m.getBoundingClientRect();
    var rand = 8;
    var links = x;
    var oben = y;
    if (links + r.width > window.innerWidth - rand) links = x - r.width;
    if (links < rand) links = rand;
    if (oben + r.height > window.innerHeight - rand) oben = y - r.height;
    if (oben < rand) oben = rand;
    m.style.left = Math.round(links + window.scrollX) + 'px';
    m.style.top = Math.round(oben + window.scrollY) + 'px';
  }

  var api = {
    /**
     * Meldet ein Menü unter einem Namen an.
     * `bauer(element, ereignis)` liefert die Einträge oder `null`, wenn
     * es für diesen Fall nichts anzubieten gibt — dann bleibt das
     * Browsermenü.
     */
    anmelden: function (name, bauFunktion) {
      bauer[name] = bauFunktion;
    },

    schliessen: schliessen,

    /** Ob überhaupt gearbeitet wird. Für Prüfungen. */
    amRechner: function () { return amRechner; },
  };

  if (amRechner) {
    document.addEventListener('contextmenu', function (e) {
      /* Umschalttaste: das Browsermenü, unverändert. */
      if (e.shiftKey) return;

      var ziel = e.target.closest ? e.target.closest('[data-menue]') : null;
      var name = ziel ? ziel.dataset.menue : 'seite';
      var bau = bauer[name];
      if (!bau) return;

      var eintraege = bau(ziel, e);
      if (!eintraege || !eintraege.length) return;

      e.preventDefault();
      var m = zeichnen(eintraege);
      stellen(m, e.clientX, e.clientY);
      offen = true;
      var ersterKnopf = m.querySelector('button');
      if (ersterKnopf) ersterKnopf.focus();
    });

    document.addEventListener('click', function (e) {
      if (offen && !e.target.closest('.kontextmenue')) schliessen();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') schliessen();
    });
    window.addEventListener('resize', schliessen);
    window.addEventListener('scroll', schliessen, true);
  }

  window.aobKontextmenue = api;
}());
