/* ===================================================================
   Age of Beast — die Wiki-Kennung bleibt beim Blättern erhalten
   [Aufgabe: Rahmen]

   -------------------------------------------------------------------
   Die Unterseiten (Karten, Bogen, Weltkarte, Favoriten, Vorlagen)
   tragen oben einen Knopf „Zurück ins Wiki". Der zeigte bis zum
   04.09.2026 auf `./` — und das war richtig, solange das Wiki die
   Startseite war.

   **Mit dem Hauptmenü ist es falsch geworden.** Seit `index.html` die
   Wiki-Auswahl ist, landet man mit `./` im Menü, obwohl der Knopf
   „ins Wiki" verspricht. Ein Verweis, der etwas anderes tut als sein
   eigener Text sagt, ist die unangenehme Sorte Fehler: Es stürzt
   nichts ab, es sieht nur jedes Mal falsch aus.

   Die Verweise zeigen deshalb jetzt fest auf `wiki.html` — das wirkt
   auch ohne JavaScript. Diese Datei ergänzt nur das eine, was statisch
   nicht geht: **Sie trägt die Wiki-Kennung durch.**

   ── Warum in beide Richtungen ───────────────────────────────────────

   Es genügt nicht, sie an den Rückweg zu hängen. Wer aus
   `wiki.html?w=age-of-beast` auf „Karten" klickt, landet auf
   `karten.html` **ohne** Kennung — und von dort führt der Rückweg dann
   in ein kennungsloses Wiki. Die Kennung geht also nicht beim
   Zurückgehen verloren, sondern schon beim Hinausgehen.

   Deshalb bekommt **jeder** seiteninterne Verweis die Kennung.
   Ausgenommen ist genau einer: das **Hauptmenü**. Es steht über allen
   Wikis und hat keine.

   Solange es nur ein Wiki gibt, ändert das nichts Sichtbares. Sobald
   es mehrere gibt, ist es der Unterschied zwischen „zurück in mein
   Wiki" und „zurück in irgendeins".

   Arbeitet zusammen mit `runtime/wiki-kennung.js` (dort wird die
   Kennung gelesen, wenn eine fremde Welt geöffnet wird) und mit
   `runtime/plattform.js`, das die Verweise `wiki.html?w=…` erzeugt.

   Ohne `?w=` in der Adresse ändert diese Datei gar nichts.
   =================================================================== */

(function () {
  'use strict';

  var kennung = '';
  try {
    /* In einem privaten Fenster oder bei kaputter Adresse **wirft**
       das — dann bleibt es bei den statischen Verweisen. */
    kennung = new URLSearchParams(location.search).get('w') || '';
  } catch (e) {
    kennung = '';
  }

  if (!kennung) return;

  /* Das Hauptmenü steht über den Wikis und bekommt nie eine Kennung. */
  var MENUE = { 'index.html': 1, './': 1, '/': 1, '': 1 };

  function ergaenzen() {
    var alle = document.querySelectorAll('a[href]');
    for (var i = 0; i < alle.length; i += 1) {
      var ziel = alle[i].getAttribute('href');
      if (!ziel || MENUE[ziel]) continue;

      /* Nur seiteninterne Ziele: kein `http…`, kein `#anker`, kein
         `mailto:`. Und wer schon eine Abfrage trägt, wird nicht
         angefasst — dort stünde die Kennung sonst zweimal. */
      if (!/^[a-z0-9-]+.html$/i.test(ziel)) continue;

      alle[i].setAttribute('href',
        ziel + '?w=' + encodeURIComponent(kennung));
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ergaenzen);
  } else {
    ergaenzen();
  }
}());
