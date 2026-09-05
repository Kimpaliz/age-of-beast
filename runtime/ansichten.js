/* Age of Beast — Navigation und die vier Ansichten.
   [Aufgabe: Leseruntime]

   Was: Zeichnet Startseite, Kategorieseite, Eintragsseite und Werkstatt
   in `#inhalt`, dazu die Kategorienleiste.

   Warum als Baustein und nicht als Modul: Die Leseseite laedt bewusst
   ohne Bausystem und ohne `type="module"` — sie soll sich auch aus einer
   Datei heraus oeffnen lassen. Deshalb sammeln sich die Teile in
   `window.__aobLeserBausteine`.

   Arbeitet zusammen mit: `datenindex.js` (bekommt es hereingereicht),
   `symbole.js` (Kategoriesymbole), `interaktion.js` (Filter und Suche
   greifen auf das Gezeichnete zu), `routing.js` (ruft die Ansichten). */
(function () {

  'use strict';

  const bausteine = window.__aobLeserBausteine = window.__aobLeserBausteine || {};

  bausteine.ansichten = function ansichtenErstellen(datenindex) {

    const inhalt = document.getElementById('inhalt');
    const navigation = document.getElementById('navigation');

    /* Die Kategoriesymbole. Fehlt der Baustein, bleibt das Wiki vollstaendig
       benutzbar - es fehlt dann nur das Bild neben dem ohnehin vorhandenen
       Namen der Kategorie. */
    const symbolvorrat = typeof bausteine.symbole === 'function' ? bausteine.symbole() : null;
    const symbol = (kategorie, klasse) => (symbolvorrat ? symbolvorrat.symbol(kategorie, klasse) : '');
    if (symbolvorrat && !document.querySelector('.symbol-vorrat')) {
      document.body.insertAdjacentHTML('afterbegin', symbolvorrat.sprite());
    }

    const sicher = (text) => String(text ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

    const kuerzen = (text, laenge) => {
      const t = String(text || '').trim();
      if (t.length <= laenge) return t;
      const s = t.lastIndexOf(' ', laenge);
      return t.slice(0, s > 0 ? s : laenge) + ' …';
    };

    const datumDeutsch = (iso) => {
      const d = new Date(iso);
      return iso && !Number.isNaN(d.getTime()) ? d.toLocaleDateString('de-DE', {
        day: '2-digit', month: 'long', year: 'numeric'
      }) : 'unbekannt';
    };

    const datumKurz = (iso) => {
      const d = new Date(iso);
      return iso && !Number.isNaN(d.getTime()) ? d.toLocaleDateString('de-DE', {
        day: '2-digit', month: '2-digit', year: 'numeric'
      }) : '';
    };

    const anzahlWort = (n, eins, mehr) => n + ' ' + (n === 1 ? eins : mehr);

    const kategorieName = (s) => datenindex.kategorieInfoHolen(s)?.name ?? s;

    const kategorieEinzahl = (s) => datenindex.kategorieInfoHolen(s)?.einzahl ?? kategorieName(s);

    const etikett = (e) => sicher(kategorieEinzahl(e.kategorie)) + (e.unterart ? ' &middot; ' + sicher(e.unterart) : '');

    function kachel(e) {
      const zahl = datenindex.verknuepfungsZahl(e);
      const reife = datenindex.reifegrad(e);
      return '<a class="kachel" href="#/eintrag/' + encodeURIComponent(e.id) + '" data-kategorie="' + sicher(e.kategorie) + '"><span class="k-kopf">' + symbol(e.kategorie, 'k-marke') + '<span class="mikro k-etikett">' + etikett(e) + '</span></span><h2>' + sicher(e.name) + '</h2><p>' + sicher(kuerzen(e.kurz, 150)) + '</p><span class="k-fuss"><span>' + anzahlWort(zahl, 'Verknüpfung', 'Verknüpfungen') + '</span><span class="reife ' + reife + '">' + (reife === 'ausgebaut' ? 'ausgebaut' : 'knapp') + '</span></span></a>';
    }

    /* ── Bloecke nach Unterart ─────────────────────────────────────
       Dieselbe Idee wie auf `karten.html`, und **aus derselben Sorte
       Daten**: Jeder Eintrag traegt seine `unterart` selbst mit sich
       ("Grundlagen", "Kern-Abstammung", "Gilde"). Es gibt keine zweite
       Liste, die jemand nachpflegen muesste — kommt eine neue Unterart
       hinzu, entsteht ihr Block von allein.

       Die Reihenfolge der Bloecke ist die **Reihenfolge in den
       Weltdaten**, nicht das Alphabet: Bei den Regeln ist das die
       Reihenfolge des Regelwerks (Grundlagen, Charaktere, Konflikte,
       Spielleitung, Nachschlagen), und die will man beim Lesen. */

    /* Ab wann gegliedert wird. Bei zwei Fraktionen waeren zwei Bloecke
       mit je einer Kachel Zierde; die 26 Regelartikel dagegen sind ohne
       Gliederung eine alphabetische Wand, in der Wurfregeln zwischen
       Spielleitungsregeln stehen. Acht ist ungefaehr das, was man mit
       einem Blick noch ueberschaut. */
    const AB_WIEVIEL_GLIEDERN = 8;

    function inBloecken(liste) {
      const welt = datenindex.weltHolen();
      /* Rang = erstes Auftreten in den Weltdaten. */
      const rang = new Map();
      for (const e of welt.eintraege) {
        const u = e.unterart || '';
        if (!rang.has(u)) rang.set(u, rang.size);
      }
      const bloecke = new Map();
      for (const e of liste) {
        const u = e.unterart || 'Sonstige';
        if (!bloecke.has(u)) bloecke.set(u, []);
        bloecke.get(u).push(e);
      }
      return [...bloecke.entries()]
        .map(([name, eintraege]) => ({ name, eintraege }))
        .sort((a, b) => (rang.get(a.name === 'Sonstige' ? '' : a.name) ?? 1e9)
          - (rang.get(b.name === 'Sonstige' ? '' : b.name) ?? 1e9));
    }

    function kachelnOderBloecke(liste) {
      const flach = '<div class="kacheln">' + liste.map(kachel).join('') + '</div>';
      if (liste.length < AB_WIEVIEL_GLIEDERN) return flach;
      const bloecke = inBloecken(liste);
      if (bloecke.length < 2) return flach;
      return '<div class="eintrag-bloecke">' + bloecke.map((b) =>
        '<section class="eintrag-block"><h2 class="eintrag-block-kopf">' + sicher(b.name)
        + ' <small>' + b.eintraege.length + '</small></h2>'
        + '<div class="kacheln">' + b.eintraege.map(kachel).join('') + '</div></section>'
      ).join('') + '</div>';
    }

    function kopfzeileSetzen() {
      const welt = datenindex.weltHolen();
      document.getElementById('welt-titel').textContent = welt.titel;
      document.getElementById('welt-untertitel').textContent = welt.untertitel;
      document.getElementById('kopf-stand').textContent = 'Stand ' + datumKurz(welt.standDerDaten);
    }

    function navigationZeichnen() {
      const welt = datenindex.weltHolen();
      navigation.innerHTML = welt.kategorien.map((k) => {
        const liste = datenindex.kategorieHolen(k.schluessel) || [];
        return !liste.length ? '' : '<section class="nav-gruppe" data-kategorie="' + sicher(k.schluessel) + '"><h2 class="mikro"><a href="#/kategorie/' + encodeURIComponent(k.schluessel) + '">' + symbol(k.schluessel, 'nav-marke') + sicher(k.name) + '</a><span class="anzahl">' + liste.length + '</span></h2><ul>' + liste.map((e) => '<li><a href="#/eintrag/' + encodeURIComponent(e.id) + '" data-nav="' + sicher(e.id) + '">' + sicher(e.name) + '</a></li>').join('') + '</ul></section>';
      }).join('');
    }

    function navigationMarkieren(id) {
      navigation.querySelectorAll('a[data-nav]').forEach((a) => a.dataset.nav === id ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current'));
    }

    function startseiteZeichnen() {
      const welt = datenindex.weltHolen();
      const kampagne = welt.eintraege.find((e) => e.kategorie === 'wiki');
      const sortiert = [...welt.eintraege].sort((a, b) => {
        if (a.kategorie === 'wiki' && b.kategorie !== 'wiki') return -1;
        if (b.kategorie === 'wiki' && a.kategorie !== 'wiki') return 1;
        return welt.kategorien.findIndex((k) => k.schluessel === a.kategorie) - welt.kategorien.findIndex((k) => k.schluessel === b.kategorie) || a.name.localeCompare(b.name, 'de');
      });

      inhalt.innerHTML = '<div class="seitenkopf"><span class="mikro">Arbeitsfläche &middot; ' + anzahlWort(welt.eintraege.length, 'Eintrag', 'Einträge') + ' &middot; Stand ' + datumDeutsch(welt.standDerDaten) + '</span><h1>' + sicher(welt.titel) + '</h1><p class="einleitung" id="start-einleitung">' + (kampagne ? sicher(kampagne.kurz) : sicher(welt.untertitel)) + ' Verlinkte Begriffe zeigen beim Überfahren eine Kurzfassung.</p></div><div class="filter" id="filter"><button type="button" data-filter="alle" aria-pressed="true">Alle</button>' + welt.kategorien.map((k) => '<button type="button" data-filter="' + sicher(k.schluessel) + '" aria-pressed="false" data-kategorie="' + sicher(k.schluessel) + '">' + symbol(k.schluessel, 'filter-marke') + sicher(k.name) + '</button>').join('') + '</div><div class="kacheln" id="kacheln">' + sortiert.map(kachel).join('') + '</div><p class="mikro fusszeile">Die Inhalte stammen aus der Weltenschmiede. Zuletzt dort bearbeitet am ' + datumDeutsch(welt.standDerDaten) + '.</p>';

      const e = document.getElementById('start-einleitung');
      if (e) datenindex.verweiseSetzen(e, kampagne?.id);
      navigationMarkieren(null);
      document.title = welt.titel + ' – Weltwiki';
    }

    function kategorieZeichnen(s) {
      const welt = datenindex.weltHolen();
      const k = datenindex.kategorieInfoHolen(s);
      const liste = datenindex.kategorieHolen(s);
      if (!k || !liste) return nichtGefunden();
      inhalt.innerHTML = '<p class="brotkrumen"><a class="zurueck" href="#/">&lsaquo; Arbeitsfläche</a><span class="pfad">' + sicher(welt.titel) + ' / ' + sicher(k.name) + '</span></p><div class="seitenkopf" data-kategorie="' + sicher(k.schluessel) + '"><span class="mikro">' + anzahlWort(liste.length, 'Eintrag', 'Einträge') + '</span><h1 class="mit-marke">' + symbol(k.schluessel, 'titel-marke') + sicher(k.name) + '</h1></div>' + kachelnOderBloecke(liste);
      navigationMarkieren(null);
      document.title = k.name + ' – ' + welt.titel;
    }

    function eintragZeichnen(id, rahmenVorhanden) {
      const welt = datenindex.weltHolen();
      const e = datenindex.eintragHolen(id);
      if (!e) return nichtGefunden();
      const hinaus = e.verbindungen || [];
      const herein = datenindex.verbundenVonHolen(e.id);
      const text = [];
      if (e.kurz) text.push('<p class="anriss" data-feld="kurz">' + sicher(e.kurz) + '</p>');
      (e.abschnitte || []).forEach((a, stelle) => {
        const anker = a.herkunft ? ' data-abschnitt="' + stelle + '"' : '';
        const titel = a.herkunft?.art === 'panel' ? ' data-feld="titel"' : '';
        const panel = a.herkunft?.art === 'panel' && a.herkunft.panelId ? ' data-panel="' + sicher(a.herkunft.panelId) + '"' : '';
        text.push('<section class="abschnitt' + (a.ergaenzt ? ' ergaenzt' : '') + '"' + anker + panel + '>' + (a.titel ? '<h2' + titel + '>' + sicher(a.titel) + '</h2>' : '') + '<div class="abschnitt-text"' + (anker ? ' data-feld="text"' : '') + '>' + a.html + '</div></section>');
      });

      const seite = [];
      if ((e.attribute || []).length) seite.push('<section class="steckbrief"><h2 class="mikro">Attribute</h2><dl class="eigenschaften">' + e.attribute.map((a) => {
        const z = a.ziel ? '<a class="verweis" href="#/eintrag/' + encodeURIComponent(a.ziel) + '" data-ziel="' + sicher(a.ziel) + '">' + sicher(a.wert) + '</a>' : sicher(a.wert);
        const anker = a.schluessel ? ' data-zeile="' + sicher(a.schluessel) + '"' : '';
        return '<dt' + anker + '>' + sicher(a.beschriftung) + '</dt><dd' + anker + '>' + z + '</dd>';
      }).join('') + '</dl></section>');

      const zeile = (v, richtung) => {
        const ziel = datenindex.eintragHolen(v.ziel);
        return !ziel ? '' : '<li' + (v.text ? ' class="mit-erklaerung"' : '') + '><a class="verweis" href="#/eintrag/' + encodeURIComponent(ziel.id) + '" data-ziel="' + sicher(ziel.id) + '">' + sicher(ziel.name) + '</a><span class="art">' + sicher(richtung === 'hinaus' ? v.art : v.art + ' von') + '</span>' + (v.text ? '<span class="erklaerung">' + sicher(v.text) + '</span>' : '') + '</li>';
      };
      if (hinaus.length || herein.length) {
        const schon = new Set(hinaus.map((v) => v.ziel));
        seite.push('<section><h2 class="mikro">Verknüpfungen</h2><ul class="bezugsliste">' + hinaus.map((v) => zeile(v, 'hinaus')).join('') + herein.filter((v) => !schon.has(v.ziel)).map((v) => zeile(v, 'herein')).join('') + '</ul></section>');
      }

      const erwaehnungen = [...datenindex.erwaehntVonHolen(e.id)].map((q) => datenindex.eintragHolen(q)).filter(Boolean).filter((q) => !hinaus.some((v) => v.ziel === q.id) && !herein.some((v) => v.ziel === q.id)).sort((a, b) => a.name.localeCompare(b.name, 'de'));
      if (erwaehnungen.length) seite.push('<section><h2 class="mikro">Erwähnt in</h2><ul class="bezugsliste">' + erwaehnungen.map((q) => '<li><a class="verweis" href="#/eintrag/' + encodeURIComponent(q.id) + '" data-ziel="' + sicher(q.id) + '">' + sicher(q.name) + '</a><span class="art">' + sicher(kategorieName(q.kategorie)) + '</span></li>').join('') + '</ul></section>');
      if (e.quelle || e.geaendert) seite.push('<section><h2 class="mikro">Herkunft</h2><dl class="eigenschaften">' + (e.quelle ? '<dt>Regelquelle</dt><dd>' + sicher(e.quelle) + '</dd>' : '') + (e.geaendert ? '<dt>Zuletzt</dt><dd>' + sicher(datumKurz(e.geaendert)) + '</dd>' : '') + '</dl></section>');

      inhalt.innerHTML = '<p class="brotkrumen"><a class="zurueck" href="#/">&lsaquo; Arbeitsfläche</a><span class="pfad">' + sicher(welt.titel) + ' / <a href="#/kategorie/' + encodeURIComponent(e.kategorie) + '">' + sicher(kategorieName(e.kategorie)) + '</a> / ' + sicher(e.name) + '</span></p><article class="artikel" data-eintrag="' + sicher(e.id) + '" data-kategorie="' + sicher(e.kategorie) + '"><span class="mikro mit-marke">' + symbol(e.kategorie, 'etikett-marke') + etikett(e) + '</span>' + (rahmenVorhanden?.(e.id) ? '<a class="modul-knopf assistent-verweis" href="#/rahmen/' + encodeURIComponent(e.id) + '">Im Assistenten bearbeiten →</a>' : '') + '<h1 data-feld="name">' + sicher(e.name) + '</h1>' + (e.bild ? '<figure class="eintrag-bild"><img src="' + sicher(e.bild) + '" alt="Wappen: ' + sicher(e.name) + '" decoding="async"></figure>' : '') + (e.aliase?.length ? '<p class="mikro" style="margin:-1.1rem 0 1.5rem">Auch: ' + sicher(e.aliase.join(' · ')) + '</p>' : '') + '<div class="artikel-raster"><div class="artikel-text">' + text.join('') + '</div>' + (seite.length ? '<aside class="artikel-seite">' + seite.join('') + '</aside>' : '') + '</div></article>';

      const belegt = new Set();
      inhalt.querySelectorAll('.artikel-text .anriss, .artikel-text .abschnitt').forEach((bereich) => datenindex.verweiseSetzen(bereich, e.id, belegt));
      navigationMarkieren(e.id);
      document.title = e.name + ' – ' + welt.titel;
    }

    function werkstattZeichnen() {
      const welt = datenindex.weltHolen();
      const zaehle = (art) => welt.eintraege.filter((e) => e.kategorie === 'werkstatt' && (e.attribute || []).some((a) => a.schluessel === 'werkstattArt' && a.wert === art)).length;
      const rahmen = welt.eintraege.filter((e) => e.id.startsWith('rahmen-'));
      const regeln = welt.eintraege.filter((e) => e.kategorie === 'regeln').length;
      const bereiche = [ {
        name: 'Kampagnenrahmen', text: 'Neun Schritte von der Grundidee bis zur ersten Szene, mit den Fragen und Hilfetexten der Werkstatt.', anzahl: rahmen.length, einheit: 'Rahmen', ziel: rahmen.length ? '#/rahmen/' + encodeURIComponent(rahmen[0].id) : null, knopf: 'Assistent öffnen', zustand: 'fertig'
      }, {
        name: 'Regelwiki', text: 'Die Regeln von Daggerheart auf Deutsch, mit Glossar. Aus dem Welttext heraus verlinkt.', anzahl: regeln, einheit: regeln === 1 ? 'Eintrag' : 'Einträge', ziel: '#/kategorie/regeln', knopf: 'Regeln durchsehen', zustand: 'fertig'
      }, {
        name: 'Spielfiguren', text: 'Figurenbögen mit Werten, Ausrüstung und Hintergrund. Der Assistent zum Anlegen fehlt noch.', anzahl: zaehle('Spielfigur'), einheit: zaehle('Spielfigur') === 1 ? 'Figur' : 'Figuren', zustand: 'teilweise'
      }, {
        name: 'Karten', text: 'Karten mit Regeltext und Angaben. Der Kartenbaukasten mit Vorlagen und PDF-Ausgabe fehlt noch.', anzahl: zaehle('Karte'), einheit: zaehle('Karte') === 1 ? 'Karte' : 'Karten', zustand: 'teilweise'
      }];
      const eigene = welt.eintraege.filter((e) => e.kategorie === 'werkstatt');
      inhalt.innerHTML = '<div class="werkstatt-seite" data-kategorie="werkstatt"><span class="mikro">Modul</span><h1>Daggerheart-Werkstatt</h1><p class="anriss">Kampagnenrahmen, Regeln, Figuren und Karten &mdash; alles an einem Ort. Zum Lesen genügt der Browser, zum Bearbeiten eine Anmeldung mit dem Google-Konto.</p><div class="werkstatt-felder">' + bereiche.map((b) => '<section class="werkstatt-feld" data-zustand="' + b.zustand + '"><h2>' + sicher(b.name) + '</h2><p class="zahl">' + b.anzahl + ' <span>' + sicher(b.einheit) + '</span></p><p class="text">' + sicher(b.text) + '</p>' + (b.ziel ? '<a class="modul-knopf" href="' + b.ziel + '">' + sicher(b.knopf) + '</a>' : '<span class="werkstatt-marke">wird noch übernommen</span>') + '</section>').join('') + '</div>' + (eigene.length ? '<h2 class="werkstatt-ueberschrift">Inhalte der Werkstatt</h2><div class="kacheln">' + eigene.map(kachel).join('') + '</div>' : '') + '</div>';
      document.title = 'Werkstatt – ' + welt.titel;
    }

    function rahmenHinweisZeichnen() {
      inhalt.innerHTML = '<p class="brotkrumen"><a class="zurueck" href="#/">&lsaquo; Arbeitsfläche</a></p><div class="hinweis"><strong>Zum Bearbeiten anmelden.</strong><br>Der Kampagnenrahmen-Assistent ändert Inhalte. Oben rechts auf <em>Anmelden</em>.</div>';
      navigationMarkieren(null);
    }

    function nichtGefunden() {
      inhalt.innerHTML = '<div class="seitenkopf"><span class="mikro">Fehler</span><h1>Nicht gefunden</h1><p class="einleitung">Diese Seite gibt es im Wiki nicht.</p></div><p><a class="verweis" href="#/">Zurück zur Arbeitsfläche</a></p>';
      navigationMarkieren(null);
    }

    return {
      inhaltHolen: () => inhalt, kopfzeileSetzen, navigationZeichnen, startseiteZeichnen, kategorieZeichnen, eintragZeichnen, werkstattZeichnen, rahmenHinweisZeichnen, nichtGefunden
    };

  };

})();
