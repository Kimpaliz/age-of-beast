/* ===================================================================
   Age of Beast — was im Rechtsklickmenü des Wikis steht
   [Aufgabe: Leseruntime]

   -------------------------------------------------------------------
   `runtime/kontextmenue.js` bringt das Menü mit, weiss aber nichts über
   Einträge, Favoriten oder Kategorien. Dieses Wissen steht hier.

   **Warum nicht in den Zeichenpass eingebaut:** Das Menü erkennt seine
   Ziele an den Adressen, die ohnehin im Dokument stehen
   (`#/eintrag/<id>`). Dadurch braucht `runtime/ansichten.js` keine Zeile
   Änderung, und ein neuer Ort, an dem Einträge auftauchen, bekommt das
   Menü von selbst.
   =================================================================== */

(function () {
  'use strict';

  var menue = window.aobKontextmenue;
  if (!menue) return;

  var fav = window.aobFavoriten;

  /* Aus `#/eintrag/<id>` die Kennung holen. Die Adresse ist die einzige
     Stelle, an der die Kennung sicher steht — der sichtbare Text ist der
     Name und kann doppelt vorkommen (es gibt zwei „Brix Borin"). */
  function eintragAus(element) {
    var a = element && element.closest ? element.closest('a[href*="#/eintrag/"]') : null;
    if (!a) return null;
    var treffer = /#\/eintrag\/([^?#]+)/.exec(a.getAttribute('href') || '');
    if (!treffer) return null;
    return {
      id: decodeURIComponent(treffer[1]),
      name: (a.textContent || '').trim().split('\n')[0] || treffer[1],
      adresse: new URL(a.getAttribute('href'), location.href).href,
    };
  }

  function inZwischenablage(text, wasWar) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).catch(function () { fallback(text); });
    } else {
      fallback(text);
    }
    hinweis(wasWar);
  }

  /* Ohne sicheren Kontext gibt es `navigator.clipboard` nicht — dann der
     alte Weg über ein unsichtbares Feld. */
  function fallback(text) {
    var feld = document.createElement('textarea');
    feld.value = text;
    feld.setAttribute('readonly', '');
    feld.style.position = 'fixed';
    feld.style.left = '-9999px';
    document.body.appendChild(feld);
    feld.select();
    try { document.execCommand('copy'); } catch (e) { /* dann eben nicht */ }
    document.body.removeChild(feld);
  }

  /* Eine kurze Rückmeldung: Ein Kopiervorgang ohne sichtbare Wirkung
     sieht aus, als sei nichts passiert. */
  function hinweis(text) {
    var alt = document.querySelector('.menue-hinweis');
    if (alt) alt.remove();
    var d = document.createElement('div');
    d.className = 'menue-hinweis';
    d.setAttribute('role', 'status');
    d.textContent = text;
    document.body.appendChild(d);
    setTimeout(function () { d.remove(); }, 2200);
  }

  /* ── Menü auf einem Eintrag ── */
  menue.anmelden('seite', function (_ziel, ereignis) {
    var e = eintragAus(ereignis.target);
    var eintraege = [];

    if (e) {
      eintraege.push({
        symbol: '→', text: 'Öffnen',
        tun: function () { location.hash = '#/eintrag/' + encodeURIComponent(e.id); },
      });
      eintraege.push({
        symbol: '⧉', text: 'In neuem Tab öffnen',
        tun: function () { window.open(e.adresse, '_blank', 'noopener'); },
      });
      if (fav) {
        var drin = fav.istFavorit('eintrag', e.id);
        eintraege.push({
          symbol: drin ? '★' : '☆',
          text: drin ? 'Aus den Favoriten nehmen' : 'Zu den Favoriten',
          tun: function () {
            var jetzt = fav.umschalten('eintrag', e.id, e.name);
            hinweis(jetzt ? e.name + ' ist jetzt Favorit.' : e.name + ' ist kein Favorit mehr.');
          },
        });
      }
      eintraege.push({
        symbol: '⎘', text: 'Verweis kopieren',
        tun: function () { inZwischenablage(e.adresse, 'Verweis kopiert.'); },
      });
      eintraege.push('-');
    }

    var auswahl = String(window.getSelection ? window.getSelection() : '').trim();
    if (auswahl) {
      var kurz = auswahl.length > 28 ? auswahl.slice(0, 28) + '…' : auswahl;
      eintraege.push({
        symbol: '⌕', text: 'Im Wiki suchen: „' + kurz + '"',
        tun: function () {
          var feld = document.getElementById('suchfeld');
          if (!feld) return;
          feld.value = auswahl;
          feld.dispatchEvent(new Event('input', { bubbles: true }));
          feld.focus();
        },
      });
      eintraege.push({
        symbol: '⎘', text: 'Auswahl kopieren',
        tun: function () { inZwischenablage(auswahl, 'Text kopiert.'); },
      });
      eintraege.push('-');
    }

    eintraege.push({
      symbol: '⌕', text: 'Suche', kurz: '/',
      tun: function () {
        var feld = document.getElementById('suchfeld');
        if (feld) feld.focus();
      },
    });
    eintraege.push({
      symbol: '☆', text: 'Favoriten',
      tun: function () { location.href = 'favoriten.html'; },
    });
    eintraege.push({
      symbol: '⌂', text: 'Zum Hauptmenü',
      tun: function () { location.href = './'; },
    });

    return eintraege;
  });

  /* Die Schrägstrich-Taste springt in die Suche — im Menü steht sie als
     Kurzbefehl, also muss es sie auch geben. */
  document.addEventListener('keydown', function (e) {
    if (e.key !== '/' || e.ctrlKey || e.metaKey || e.altKey) return;
    var aktiv = document.activeElement;
    if (aktiv && /^(INPUT|TEXTAREA|SELECT)$/.test(aktiv.tagName)) return;
    if (aktiv && aktiv.isContentEditable) return;
    var feld = document.getElementById('suchfeld');
    if (!feld) return;
    e.preventDefault();
    feld.focus();
    feld.select();
  });
}());
