/* Age of Beast — Daten, Indizes, Volltext und Verweislogik.
   [Aufgabe: Leseruntime]

   Was: Nimmt die rohe Welt (`daten/welt.js`) entgegen und baut daraus
   die Nachschlagewerke, die jede Ansicht braucht — Eintrag nach Kennung,
   Eintraege nach Kategorie, Volltextindex, und die Aufloesung der
   Verweise zwischen Eintraegen.

   Warum getrennt: Ein Index wird einmal gebaut und oft gefragt. Laege
   er in den Ansichten, entstuende er bei jedem Seitenwechsel neu.

   Arbeitet zusammen mit: `runtime/ansichten.js` und
   `runtime/interaktion.js` bekommen ihn hereingereicht;
   `runtime/routing.js` setzt die drei zusammen. */
(function () {

  'use strict';

  const bausteine = window.__aobLeserBausteine = window.__aobLeserBausteine || {};

  bausteine.datenindex = function datenindexErstellen() {

    let welt;
    let nachId = new Map();
    let kategorieInfo = new Map();
    let nachKategorie = new Map();

    let volltext = new Map();
    let erwaehntVon = new Map();
    let erwaehnt = new Map();
    let verbundenVon = new Map();
    let verweisMuster = null;

    const maskieren = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    const grossGeschrieben = (treffer) => {
      const b = treffer.match(/\p{L}/u);
      return b ? b[0] === b[0].toUpperCase() : false;
    };

    const alsText = (e) => [e.kurz, ...(e.abschnitte || []).map((a) => a.titel + ' ' + a.html)].join(' ').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');

    function erwaehnteEintraege(text, eigeneId) {
      const gefunden = new Set();
      if (!verweisMuster) return gefunden;
      verweisMuster.lastIndex = 0;
      let t;
      while ((t = verweisMuster.exec(text)) !== null) {
        if (!grossGeschrieben(t[1])) continue;
        const ziel = welt.woerterbuch[t[1].toLowerCase()];
        if (ziel && ziel !== eigeneId) gefunden.add(ziel);
      }
      return gefunden;
    }

    function aufbauen() {

      const eintraege = welt.eintraege || [];
      nachId = new Map(eintraege.map((e) => [e.id, e]));
      kategorieInfo = new Map((welt.kategorien || []).map((k) => [k.schluessel, k]));

      nachKategorie = new Map((welt.kategorien || []).map((k) => [k.schluessel, eintraege.filter((e) => e.kategorie === k.schluessel).sort((a, b) => a.name.localeCompare(b.name, 'de'))]));
      volltext = new Map(eintraege.map((e) => [e.id, alsText(e)]));

      const begriffe = Object.keys(welt.woerterbuch || {}).sort((a, b) => b.length - a.length);
      verweisMuster = begriffe.length ? new RegExp('(?<![\\p{L}\\p{N}])(' + begriffe.map(maskieren).join('|') + ')(?![\\p{L}\\p{N}])', 'giu') : null;

      erwaehntVon = new Map(eintraege.map((e) => [e.id, new Set()]));
      erwaehnt = new Map();
      for (const e of eintraege) {
        const ziele = erwaehnteEintraege(volltext.get(e.id), e.id);
        erwaehnt.set(e.id, ziele);
        for (const ziel of ziele) erwaehntVon.get(ziel)?.add(e.id);
      }

      verbundenVon = new Map(eintraege.map((e) => [e.id, []]));
      for (const e of eintraege) for (const v of e.verbindungen || []) if (verbundenVon.has(v.ziel)) verbundenVon.get(v.ziel).push( {
        art: v.art, text: v.text, ziel: e.id
      });

    }

    function weltSetzen(neueWelt) {
      welt = neueWelt;
      aufbauen();
    }

    function verknuepfungsZahl(e) {
      const alle = new Set();
      for (const v of e.verbindungen || []) alle.add(v.ziel);
      for (const v of verbundenVon.get(e.id) || []) alle.add(v.ziel);
      for (const id of erwaehnt.get(e.id) || []) alle.add(id);
      for (const id of erwaehntVon.get(e.id) || []) alle.add(id);
      alle.delete(e.id);
      return alle.size;
    }

    function reifegrad(e) {
      return (e.abschnitte || []).length >= 3 && (volltext.get(e.id) || '').length > 900 ? 'ausgebaut' : 'knapp';
    }

    function verweiseSetzen(bereich, eigeneId, schonVerlinkt) {

      if (!verweisMuster) return;
      const belegt = schonVerlinkt || new Set();
      const laeufer = document.createTreeWalker(bereich, NodeFilter.SHOW_TEXT, {
        acceptNode(k) {
          if (!k.nodeValue || !k.nodeValue.trim() || k.parentElement.closest('a, code, h1, h2, h3, h4')) return NodeFilter.FILTER_REJECT;
          return NodeFilter.FILTER_ACCEPT;
        }
      });
      const knoten = [];
      while (laeufer.nextNode()) knoten.push(laeufer.currentNode);

      for (const k of knoten) {
        const text = k.nodeValue;
        verweisMuster.lastIndex = 0;
        let teile;
        let ende = 0;
        let t;
        while ((t = verweisMuster.exec(text)) !== null) {
          const wort = t[1];
          const ziel = welt.woerterbuch[wort.toLowerCase()];
          if (!ziel || ziel === eigeneId || belegt.has(ziel) || !grossGeschrieben(wort) || !nachId.has(ziel)) continue;
          if (!teile) teile = document.createDocumentFragment();
          if (t.index > ende) teile.appendChild(document.createTextNode(text.slice(ende, t.index)));
          const a = document.createElement('a');
          a.className = 'verweis';
          a.href = '#/eintrag/' + encodeURIComponent(ziel);
          a.dataset.ziel = ziel;
          a.textContent = wort;
          teile.appendChild(a);
          belegt.add(ziel);
          ende = t.index + wort.length;
        }
        if (teile) {
          if (ende < text.length) teile.appendChild(document.createTextNode(text.slice(ende)));
          k.parentNode.replaceChild(teile, k);
        }
      }

    }

    function suchen(begriff) {
      const b = begriff.trim().toLocaleLowerCase('de');
      if (b.length < 2) return [];
      const gefunden = [];
      for (const e of welt.eintraege) {
        const name = e.name.toLocaleLowerCase('de');
        const aliase = (e.aliase || []).join(' ').toLocaleLowerCase('de');
        const kurz = (e.kurz || '').toLocaleLowerCase('de');
        const text = (volltext.get(e.id) || '').toLocaleLowerCase('de');
        let punkte = 0;
        let stelle = '';
        if (name === b) punkte = 100;
        else if (name.startsWith(b)) punkte = 80;
        else if (name.includes(b)) punkte = 60;
        else if (aliase.includes(b)) {
          punkte = 50;
          stelle = 'Andere Bezeichnung';
        }
        else if (kurz.includes(b)) {
          punkte = 35;
          stelle = e.kurz;
        }
        else if (text.includes(b)) {
          punkte = 20;
          const pos = text.indexOf(b);
          stelle = '…' + (volltext.get(e.id) || '').slice(Math.max(0, pos - 40), pos + 70).trim() + '…';
        }
        if (punkte) gefunden.push( {
          eintrag: e, punkte, stelle: stelle || e.kurz || ''
        });
      }
      return gefunden.sort((a, b2) => b2.punkte - a.punkte || a.eintrag.name.localeCompare(b2.eintrag.name, 'de')).slice(0, 12);
    }

    function etikettHolen(eintrag) {
      const kategorie = kategorieInfo.get(eintrag.kategorie);
      const name = kategorie?.einzahl || kategorie?.name || eintrag.kategorie;
      return eintrag.unterart ? name + ' · ' + eintrag.unterart : name;
    }

    return {
      weltSetzen, weltHolen: () => welt, eintragHolen: (id) => nachId.get(id), kategorieHolen: (id) => nachKategorie.get(id), kategorieInfoHolen: (id) => kategorieInfo.get(id), verbundenVonHolen: (id) => verbundenVon.get(id) || [], erwaehntVonHolen: (id) => erwaehntVon.get(id) || new Set(), verknuepfungsZahl, reifegrad, verweiseSetzen, suchen, etikettHolen
    };

  };

})();
