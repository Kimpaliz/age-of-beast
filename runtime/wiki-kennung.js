/* ===================================================================
   Age of Beast — welches Wiki wird hier gezeigt?
   [Aufgabe: Rahmen]

   -------------------------------------------------------------------
   Das Hauptmenü verweist auf `wiki.html?w=<kennung>`. Diese Seite zeigt
   aber noch **immer dieselbe Welt** — die von Age of Beast, aus
   `daten/welt.js` beziehungsweise aus der alten Sammlung `wiki_welt`.
   Der Umzug in `wiki_projekte/{wikiId}/welt` ist Schritt für Schritt
   geplant (`docs/PLATTFORM.md`), aber noch nicht gebaut.

   **Diese Datei macht genau das sichtbar.** Sie ist bewusst keine halbe
   Umsetzung: Wer mit einer fremden Kennung hier landet, bekäme sonst
   fremde Inhalte unter dem richtigen Namen zu sehen — die schlimmste
   Art von Fehler, weil niemand ihn bemerkt. Bis der Umzug steht, sagt
   die Seite ehrlich, dass sie diese Welt nicht zeigen kann.

   Fällt die Kennung weg oder lautet sie `age-of-beast`, ändert sich
   nichts.
   =================================================================== */

(function () {
  'use strict';

  /* Solange es nur eine Welt gibt, ist sie die Ausnahme. Sobald der
     Umzug steht, verschwindet diese Konstante mitsamt der Warnung. */
  var HEUTIGE_WELT = 'age-of-beast';

  var kennung = '';
  try {
    kennung = new URLSearchParams(location.search).get('w') || '';
  } catch (e) {
    kennung = '';
  }

  if (!kennung || kennung === HEUTIGE_WELT) return;

  function zeigen() {
    var inhalt = document.getElementById('inhalt');
    if (!inhalt) return;
    var kasten = document.createElement('div');
    kasten.className = 'hinweis warnung wiki-fremd';
    kasten.setAttribute('role', 'status');
    kasten.innerHTML = '<strong>Dieses Wiki lässt sich noch nicht anzeigen.</strong><br>'
      + 'Du hast <code>' + kennung.replace(/[<>&"]/g, '') + '</code> geöffnet, '
      + 'diese Seite zeigt aber bis auf Weiteres nur die Welt von '
      + '<em>Age of Beast</em>. Der Umzug auf mehrere Welten ist der '
      + 'nächste Schritt.<br>'
      + '<a href="./">Zurück zum Hauptmenü</a>';
    inhalt.prepend(kasten);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', zeigen);
  } else {
    zeigen();
  }
}());
